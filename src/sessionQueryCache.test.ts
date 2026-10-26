import { afterEach, describe, expect, it, vi } from 'vitest';
import { SessionQueryCache, clearSessionQueries, feedCache, queryCache } from './sessionQueryCache';
import { clearStoredSession, storeSession } from './components/auth/authStorage';

afterEach(() => { clearStoredSession(); vi.useRealTimers(); });

describe('consultas conservadas durante la navegación', () => {
  it('reutiliza resultados y vence la caché después de cinco minutos', async () => {
    vi.useFakeTimers();
    const cache = new SessionQueryCache();
    const load = vi.fn().mockResolvedValue({ items: [1, 2] });
    await cache.read('perfil', load);
    await cache.read('perfil', load);
    expect(load).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(5 * 60_000);
    await cache.read('perfil', load);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('comparte la consulta en curso sin que salir de una pantalla cancele a las demás', async () => {
    const cache = new SessionQueryCache();
    let complete!: (value: string) => void;
    const load = vi.fn(() => new Promise<string>(resolve => { complete = resolve; }));
    const controller = new AbortController();
    const first = cache.read('mapa', load, controller.signal);
    const second = cache.read('mapa', load);
    controller.abort();
    await expect(first).rejects.toMatchObject({ name: 'AbortError' });
    complete('pines');
    await expect(second).resolves.toBe('pines');
    await expect(cache.read('mapa', load)).resolves.toBe('pines');
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('no guarda respuestas fallidas ni resultados anteriores a una modificación', async () => {
    const cache = new SessionQueryCache();
    const error = vi.fn().mockRejectedValue(new Error('sin conexión'));
    await expect(cache.read('perfil', error)).rejects.toThrow('sin conexión');
    expect(cache.get('perfil')).toBeUndefined();
    let complete!: (value: string) => void;
    const pending = cache.read('perfil', () => new Promise<string>(resolve => { complete = resolve; }));
    cache.clear(); complete('viejo'); await pending;
    expect(cache.get('perfil')).toBeUndefined();
    const denied = vi.fn().mockResolvedValue({ ok: false });
    await cache.read<{ ok: boolean }>('perfil', denied, undefined, value => value.ok);
    expect(cache.get('perfil')).toBeUndefined();
  });

  it('conserva todas las páginas del feed y las separa por usuario', () => {
    const snapshot = { items: [1, 2, 3], cursor: 'pagina-3', consumed: ['pagina-2'] };
    feedCache.set('1:para-vos', snapshot, Infinity);
    expect(feedCache.get('1:para-vos')).toEqual(snapshot);
    expect(feedCache.get('2:para-vos')).toBeUndefined();
    clearSessionQueries();
    expect(feedCache.get('1:para-vos')).toBeUndefined();
  });

  it('limpia datos al cambiar de cuenta o salir, pero no al renovar el token', () => {
    const session = { token: 'a', usuarioId: 1, username: 'ana', email: 'ana@test.com', esAdmin: false };
    storeSession(session);
    queryCache.set('perfil', 'ana'); feedCache.set('1:para-vos', [1]);
    storeSession({ ...session, token: 'b' });
    expect(queryCache.get('perfil')).toBe('ana');
    storeSession({ ...session, usuarioId: 2 });
    expect(queryCache.get('perfil')).toBeUndefined();
    expect(feedCache.get('1:para-vos')).toBeUndefined();
    queryCache.set('perfil', 'otra cuenta');
    clearStoredSession();
    expect(queryCache.get('perfil')).toBeUndefined();
  });
});

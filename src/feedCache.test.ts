import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { getInitialFeed } from './feedCache';
import { feedCache } from './sessionQueryCache';
import { clearStoredSession, storeSession } from './components/auth/authStorage';

const session = { token: 'test', usuarioId: 1, username: 'ana', email: 'ana@test.com', esAdmin: false };
const page = { items: [{ id: 12, titulo: 'Precargado', descripcion: 'Una historia', fecha: '1985-01-01', categoria: 0, urlMultimedia: '/foto.jpg', tipoMultimedia: 0, autor: { id: 2, username: 'sofi' } }], siguienteCursor: 'next', hayMas: true };
beforeEach(() => storeSession(session));
afterEach(() => { clearStoredSession(); vi.unstubAllGlobals(); });

it('precarga solo la primera página y la reutiliza sin registrar impresiones ni descargar medios', async () => {
  const fetch = vi.fn().mockImplementation(async () => new Response(JSON.stringify(page)));
  vi.stubGlobal('fetch', fetch);
  const prefetched = await getInitialFeed('para-vos');
  const opened = await getInitialFeed('para-vos');
  expect(opened).toBe(prefetched);
  expect(opened.items[0].title).toBe('Precargado');
  expect(opened.cursor).toBe('next');
  expect(opened.impressionsRegistered).toBeUndefined();
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(new URL(fetch.mock.calls[0][0]).pathname).toBe('/api/feed/para-vos');
});

it('comparte la petición en curso al entrar al feed aunque se cierre la vista del mapa', async () => {
  let complete!: (value: Response) => void;
  const fetch = vi.fn(() => new Promise<Response>(resolve => { complete = resolve; }));
  vi.stubGlobal('fetch', fetch);
  const controller = new AbortController();
  const preload = getInitialFeed('para-vos', controller.signal);
  await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  controller.abort();
  await expect(preload).rejects.toMatchObject({ name: 'AbortError' });
  const visible = getInitialFeed('para-vos');
  complete(new Response(JSON.stringify(page)));
  expect((await visible).items[0].id).toBe('12');
  expect(fetch).toHaveBeenCalledTimes(1);
});

it('permite actualizar manualmente y no recupera una precarga anterior a la actualización', async () => {
  let complete!: (value: Response) => void;
  const fetch = vi.fn().mockImplementationOnce(() => new Promise<Response>(resolve => { complete = resolve; }))
    .mockImplementation(async () => new Response(JSON.stringify({ ...page, items: [] })));
  vi.stubGlobal('fetch', fetch);
  const old = getInitialFeed('para-vos');
  await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  feedCache.delete('1:para-vos');
  expect((await getInitialFeed('para-vos')).items).toEqual([]);
  complete(new Response(JSON.stringify(page)));
  await old;
  expect((await getInitialFeed('para-vos')).items).toEqual([]);
  expect(fetch).toHaveBeenCalledTimes(2);
});

it('no hace precargas anónimas y descarta los resultados si cambia la cuenta', async () => {
  let complete!: (value: Response) => void;
  const fetch = vi.fn(() => new Promise<Response>(resolve => { complete = resolve; }));
  vi.stubGlobal('fetch', fetch);
  const old = getInitialFeed('para-vos');
  await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  storeSession({ ...session, usuarioId: 2 });
  complete(new Response(JSON.stringify(page)));
  await old;
  expect(feedCache.get('1:para-vos')).toBeUndefined();
  expect(feedCache.get('2:para-vos')).toBeUndefined();
  clearStoredSession();
  await expect(getInitialFeed('para-vos')).rejects.toMatchObject({ status: 401 });
  expect(fetch).toHaveBeenCalledTimes(1);
});

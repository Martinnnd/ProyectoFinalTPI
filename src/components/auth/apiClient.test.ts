import { afterEach, expect, it, vi } from "vitest";
import { apiFetch } from "./apiClient";
import { clearStoredSession, storeSession } from "./authStorage";
import { feedCache } from '../../sessionQueryCache';

afterEach(() => {
  clearStoredSession();
  vi.unstubAllGlobals();
});

it("renueva una sesión vencida y repite una sola vez la petición original", async () => {
  storeSession({
    token: "token-anterior",
    usuarioId: 7,
    username: "fran",
    email: "fran@example.com",
    esAdmin: false,
  });
  const renewed = {
    token: "token-renovado",
    usuarioId: 7,
    username: "fran",
    email: "fran@example.com",
    esAdmin: false,
  };
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(new Response(null, { status: 401 }))
    .mockResolvedValueOnce(new Response(JSON.stringify(renewed), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
  vi.stubGlobal("fetch", fetch);

  const response = await apiFetch("https://localhost:7014/api/protegida");

  expect(response.ok).toBe(true);
  expect(fetch).toHaveBeenCalledTimes(3);
  expect(new Headers(fetch.mock.calls[0][1].headers).get("Authorization")).toBe("Bearer token-anterior");
  expect(fetch.mock.calls[1][0]).toContain("/api/auth/refresh");
  expect(fetch.mock.calls[1][1].credentials).toBe("include");
  expect(new Headers(fetch.mock.calls[2][1].headers).get("Authorization")).toBe("Bearer token-renovado");
});

function browserSession() {
  vi.stubGlobal('window', { localStorage: { removeItem: vi.fn() }, dispatchEvent: vi.fn() });
  storeSession({ token: 'token', usuarioId: 1, username: 'ana', email: 'ana@test.com', esAdmin: false });
}

it('reutiliza consultas al volver a una sección y entrega cuerpos independientes', async () => {
  browserSession();
  const fetch = vi.fn().mockImplementation(async () => new Response(JSON.stringify({ username: 'ana' })));
  vi.stubGlobal('fetch', fetch);
  expect(await (await apiFetch('https://localhost/api/usuario/perfil/ana')).json()).toEqual({ username: 'ana' });
  expect(await (await apiFetch('https://localhost/api/usuario/perfil/ana')).json()).toEqual({ username: 'ana' });
  expect(fetch).toHaveBeenCalledTimes(1);
});

it('invalida las consultas después de guardar cambios', async () => {
  browserSession();
  const fetch = vi.fn().mockImplementation(async () => new Response('{}'));
  vi.stubGlobal('fetch', fetch);
  await apiFetch('https://localhost/api/publicaciones/12');
  await apiFetch('https://localhost/api/publicaciones/12', { method: 'PUT', body: '{}' });
  await apiFetch('https://localhost/api/publicaciones/12');
  expect(fetch).toHaveBeenCalledTimes(3);
});

it('mantiene en vivo chat, notificaciones, análisis y asociaciones de momentos', async () => {
  browserSession();
  const fetch = vi.fn().mockImplementation(async () => new Response('{}'));
  vi.stubGlobal('fetch', fetch);
  for (const path of ['/chat/conversaciones', '/notificaciones', '/publicaciones/12/analisis', '/publicaciones/12/momentos']) {
    await apiFetch(`https://localhost/api${path}`);
    await apiFetch(`https://localhost/api${path}`);
  }
  expect(fetch).toHaveBeenCalledTimes(8);
});

it('conserva el feed al registrar impresiones y lo invalida al modificar una publicación', async () => {
  browserSession();
  vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => new Response('{}')));
  feedCache.set('1:para-vos', [12], Infinity);
  await apiFetch('https://localhost/api/feed/impresiones', { method: 'POST', body: '{}' });
  expect(feedCache.get('1:para-vos')).toEqual([12]);
  await apiFetch('https://localhost/api/publicaciones/12/like', { method: 'POST' });
  expect(feedCache.get('1:para-vos')).toBeUndefined();
});

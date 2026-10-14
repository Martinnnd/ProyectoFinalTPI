import { afterEach, expect, it, vi } from 'vitest';
import { cerrarSesion, guardarSesion } from './api';
import { dejarDeSeguir, getSeguidores, getSeguidos, seguir } from './seguimientosApi';

afterEach(() => { cerrarSesion(); vi.unstubAllGlobals(); });

it('envía los dos IDs en JSON al seguir y dejar de seguir', async () => {
  guardarSesion({ usuarioId: 1, token: 'token-test', username: 'Ana', email: 'ana@example.com', esAdmin: false });
  const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', fetch);
  await seguir(1, 2);
  await dejarDeSeguir(1, 2);
  expect(fetch.mock.calls.map(([url, options]) => ({ path: new URL(url).pathname, method: options.method, body: JSON.parse(options.body), token: options.headers.get('Authorization') }))).toEqual([
    { path: '/api/seguimientos', method: 'POST', body: { idUsuario: 1, idUsuarioASeguir: 2 }, token: 'Bearer token-test' },
    { path: '/api/seguimientos', method: 'DELETE', body: { idUsuario: 1, idUsuarioASeguir: 2 }, token: 'Bearer token-test' },
  ]);
});

it('lee seguidos y seguidores desde el usuario indicado', async () => {
  const fetch = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 2, username: 'Beto' }])))
    .mockResolvedValueOnce(new Response(JSON.stringify({ items: [{ idUsuario: 3, username: 'Carla' }] })));
  vi.stubGlobal('fetch', fetch);
  const controller = new AbortController();
  expect(await getSeguidos(1, controller.signal)).toEqual([{ id: 2, username: 'Beto' }]);
  expect(await getSeguidores(1)).toEqual([{ id: 3, username: 'Carla' }]);
  expect(fetch.mock.calls.map(([url]) => new URL(url).pathname)).toEqual(['/api/seguimientos/1/seguidos', '/api/seguimientos/1/seguidores']);
  expect(fetch.mock.calls[0][1].signal).toBe(controller.signal);
});

it('conserva el detalle de errores del servidor', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ detail: 'El usuario no existe.' }), { status: 404 })));
  await expect(seguir(1, 999)).rejects.toThrow('El usuario no existe.');
});

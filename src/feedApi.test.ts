import { afterEach, expect, it, vi } from 'vitest';
import { API_BASE_URL } from './api';
import { FeedError, getFeed } from './feedApi';

afterEach(() => vi.unstubAllGlobals());
const item = { id: 25, titulo: 'Desde el servidor', descripcion: 'Texto abreviado', fecha: '1992-01-01T00:00:00Z', fechaCreacion: '2026-10-13T15:00:00Z', categoria: 0, tipoMultimedia: 0, urlMultimedia: '/uploads/foto.jpg', autor: { id: 2, username: 'Ana' }, lugar: { nombre: 'Mi barrio', latitud: -34, longitud: -58 } };
it('consulta Para vos sin cursor y adapta ubicación, autor y multimedia', async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [item], siguienteCursor: 'next+/=', hayMas: true })));
  vi.stubGlobal('fetch', fetch);
  const page = await getFeed('para-vos');
  const url = new URL(fetch.mock.calls[0][0]);
  expect(url.pathname).toBe('/api/feed/para-vos');
  expect(Object.fromEntries(url.searchParams)).toEqual({ usuarioId: '1', limite: '20' });
  expect(fetch.mock.calls[0][1].cache).toBe('no-store');
  expect(page.items[0]).toMatchObject({ id: '25', source: 'backend', author: 'Ana', year: 1992, place: 'Mi barrio', lat: -34, lng: -58, image: `${API_BASE_URL}/uploads/foto.jpg` });
  expect(page).toMatchObject({ siguienteCursor: 'next+/=', hayMas: true });
});
it('continúa Seguidos con el cursor exacto y propaga la cancelación', async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [], siguienteCursor: null, hayMas: false })));
  vi.stubGlobal('fetch', fetch);
  const controller = new AbortController();
  await getFeed('seguidos', 'next+/=', controller.signal);
  const url = new URL(fetch.mock.calls[0][0]);
  expect(url.pathname).toBe('/api/feed/seguidos');
  expect(url.searchParams.get('cursor')).toBe('next+/=');
  expect(fetch.mock.calls[0][1].signal).toBe(controller.signal);
});
it('distingue una sesión vencida y conserva el mensaje del backend', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ mensaje: 'Sesión vencida' }), { status: 410 })));
  const error = await getFeed('para-vos', 'old').catch(error => error);
  expect(error).toBeInstanceOf(FeedError);
  expect(error.status).toBe(410);
  expect(error.message).toBe('Sesión vencida');
});

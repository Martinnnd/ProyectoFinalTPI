import { API_BASE_URL, guardarSesion, cerrarSesion } from './api';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getMapPublications, getPublication, publicationId, toMemory } from './publicationsApi';
import { createComment, getComments } from './commentsApi';
import type { Memory } from './types';

const pin: Memory = { id: '25', title: 'Recuerdo', year: 1990, category: 'Personales', description: '', author: '', place: '', lat: -34, lng: -58, source: 'backend' };
const bounds = { minLatitud: -35, maxLatitud: -34, minLongitud: -59, maxLongitud: -58 };
const comment = { id: 8, contenido: 'Qué lindo recuerdo', fechaCreacion: '2026-10-13T15:00:00Z', autor: { id: 1, username: 'usuarioTest' } };
function respond(data: unknown, status = 200) {
  return vi.fn().mockImplementation(async () => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } }));
}
afterEach(() => { cerrarSesion(); vi.unstubAllGlobals(); });
it('crea comentarios con la identidad de la sesión', async () => {
  guardarSesion({ usuarioId: 42, token: 'token-test', username: 'Ana', email: 'ana@example.com', esAdmin: false });
  const fetch = respond(comment);
  vi.stubGlobal('fetch', fetch);
  await createComment('25', ' Hola ');
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ contenido: 'Hola', comentarioPadreId: null });
  expect(new Headers(fetch.mock.calls[0][1].headers).get('Authorization')).toBe('Bearer token-test');
});
describe('Publicaciones del backend', () => {
  it('conserva los contadores y el estado de like, incluyendo ceros', () => {
    const data = { id: 25, titulo: 'Recuerdo', fecha: '1992-01-01T00:00:00Z', categoria: 0, urlMultimedia: '', tipoMultimedia: 0, autor: { id: 1, username: 'Ana' }, cantidadLikes: 12, cantidadComentarios: 47, dioLike: true };
    expect(toMemory(data, pin)).toMatchObject({ likeCount: 12, commentCount: 47, viewerLiked: true });
    expect(toMemory({ ...data, cantidadLikes: 0, cantidadComentarios: 0, dioLike: false }, pin)).toMatchObject({ likeCount: 0, commentCount: 0, viewerLiked: false });
  });
  it('conserva el grupo informado por el backend', () => {
    const data = { id: 25, titulo: 'Recuerdo del grupo', fecha: '1992-01-01T00:00:00Z', categoria: 0, urlMultimedia: '', tipoMultimedia: 0, autor: { id: 1, username: 'Ana' }, grupo: { id: 12 } };
    expect(toMemory(data, pin)).toMatchObject({ groupId: '12' });
  });
  it('envía el área visible y el rango exclusivo de fecha, y adapta los pines', async () => {
    const fetch = respond({ pines: [{ id: 25, latitud: -34, longitud: -58, categoria: 6 }], hayMas: true });
    vi.stubGlobal('fetch', fetch);
    const result = await getMapPublications(bounds, { decade: 1990, year: 1995 }, 'Personales');
    const url = new URL(fetch.mock.calls[0][0]);
    expect(url.pathname).toBe('/api/publicaciones/mapa');
    expect(Object.fromEntries(url.searchParams)).toEqual({ ...Object.fromEntries(Object.entries(bounds).map(([k,v]) => [k,String(v)])), fechaDesde: '1995-01-01T00:00:00Z', fechaHasta: '1996-01-01T00:00:00Z', categoria: 'Recuerdos_Personales' });
    expect(result.hayMas).toBe(true);
    expect(result.memories[0]).toMatchObject({ id: '25', category: 'Personales', source: 'backend', lat: -34 });
  });
  it('divide consultas que cruzan el antimeridiano sin duplicar pines', async () => {
    const fetch = respond({ pines: [{ id: 25, latitud: -34, longitud: 175, categoria: 0 }], hayMas: false });
    vi.stubGlobal('fetch', fetch);
    const result = await getMapPublications({ ...bounds, minLongitud: 170, maxLongitud: -170 }, { decade: 1990, year: null }, 'Todas');
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(result.memories).toHaveLength(1);
    expect(new URL(fetch.mock.calls[0][0]).searchParams.has('categoria')).toBe(false);
  });
  it('carga resumen y detalle conservando coordenadas y resolviendo multimedia relativa', async () => {
    const fetch = respond({ id: 25, titulo: 'Mi barrio', descripcionBreve: 'Resumen', fecha: '1992-01-01T00:00:00Z', categoria: 'Lugares', urlMultimedia: '/uploads/foto.jpg', tipoMultimedia: 0, autor: { id: 2, username: 'Ana' } });
    vi.stubGlobal('fetch', fetch);
    expect(await getPublication(pin, true)).toMatchObject({ author: 'Ana', year: 1992, description: 'Resumen', lat: -34, image: `${API_BASE_URL}/uploads/foto.jpg` });
    expect(fetch.mock.calls[0][0]).toBe(`${API_BASE_URL}/api/publicaciones/25/resumen`);
    await getPublication(pin, false);
    expect(fetch.mock.calls[1][0]).toBe(`${API_BASE_URL}/api/publicaciones/25`);
    expect(publicationId({ ...pin, source: 'demo', id: 'demo-25' })).toBeNull();
  });
  it('envía el cursor sin modificarlo y conserva el orden del servidor', async () => {
    const fetch = respond({ items: [comment], siguienteCursor: 'next+/=' });
    vi.stubGlobal('fetch', fetch);
    const page = await getComments('25', 'cursor+/=');
    expect(new URL(fetch.mock.calls[0][0]).searchParams.get('cursor')).toBe('cursor+/=');
    expect(page.cursor).toBe('next+/=');
    expect(page.items[0]).toMatchObject({ id: '8', text: comment.contenido, author: 'usuarioTest', createdAt: comment.fechaCreacion });
  });
  it('rechaza comentarios anónimos y muestra validaciones ProblemDetails', async () => {
    await expect(createComment('25', 'Qué lindo recuerdo')).rejects.toThrow('iniciar sesión');
    guardarSesion({ usuarioId: 42, token: 'token-test', username: 'Ana', email: 'ana@example.com', esAdmin: false });
    vi.stubGlobal('fetch', respond({ title: 'Validación', errors: { Contenido: ['Contenido obligatorio.'] } }, 400));
    await expect(createComment('25', '')).rejects.toThrow('Contenido obligatorio.');
  });
});

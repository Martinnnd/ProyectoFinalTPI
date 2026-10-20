import { afterEach, expect, it, vi } from 'vitest';
import { cerrarSesion, guardarSesion } from './api';
import { createGroup, createGroupMemory, getGroupMemories, getGroups } from './groupsApi';
import type { Memory } from './types';

afterEach(() => {
  cerrarSesion();
  vi.unstubAllGlobals();
});

const apiGroup = {
  id: 12,
  nombre: 'Cine de los 90',
  descripcion: 'Películas que marcaron la década.',
  decada: 1990,
  fechaCreacion: '2026-10-20T18:00:00Z',
  creador: { id: 1, username: 'ana' },
  cantidadIntegrantes: 1,
  esIntegrante: true,
  esCreador: true,
};

it('carga y adapta los grupos del backend', async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify([apiGroup])));
  vi.stubGlobal('fetch', fetch);

  await expect(getGroups()).resolves.toEqual([{
    id: '12',
    name: 'Cine de los 90',
    description: 'Películas que marcaron la década.',
    decade: 1990,
  }]);
  expect(new URL(fetch.mock.calls[0][0]).pathname).toBe('/api/grupos');
});

it('crea el grupo con la sesión y la década seleccionada', async () => {
  guardarSesion({ usuarioId: 1, token: 'token-test', username: 'ana', email: 'ana@example.com', esAdmin: false });
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(apiGroup), { status: 201 }));
  vi.stubGlobal('fetch', fetch);

  await createGroup({
    name: 'Cine de los 90',
    description: 'Películas que marcaron la década.',
    decade: 1990,
  });

  const [url, options] = fetch.mock.calls[0];
  expect(new URL(url).pathname).toBe('/api/grupos');
  expect(options.method).toBe('POST');
  expect(options.headers.get('Authorization')).toBe('Bearer token-test');
  expect(options.headers.get('Content-Type')).toBe('application/json');
  expect(JSON.parse(options.body)).toEqual({
    nombre: 'Cine de los 90',
    descripcion: 'Películas que marcaron la década.',
    decada: 1990,
  });
});

it('muestra el detalle de validación devuelto por el backend', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
    errors: { Nombre: ['El nombre debe tener entre 3 y 100 caracteres.'] },
  }), { status: 400 })));

  await expect(createGroup({ name: 'A', description: '', decade: 1990 }))
    .rejects.toThrow('El nombre debe tener entre 3 y 100 caracteres.');
});

it('publica un recuerdo mediante el endpoint del grupo', async () => {
  guardarSesion({ usuarioId: 1, token: 'token-test', username: 'ana', email: 'ana@example.com', esAdmin: false });
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 88 }), { status: 201 }));
  vi.stubGlobal('fetch', fetch);
  const memory: Memory = {
    id: 'borrador',
    title: 'Una tarde en el videoclub',
    description: 'Elegimos una película para ver con amigos.',
    year: 1996,
    category: 'Cine',
    place: 'Buenos Aires',
    lat: -34.6,
    lng: -58.4,
    author: 'Vos',
    source: 'local',
    image: 'https://example.com/foto.jpg',
  };

  await expect(createGroupMemory('12', memory)).resolves.toEqual({ id: 88 });

  const [url, options] = fetch.mock.calls[0];
  const body = options.body as FormData;
  expect(new URL(url).pathname).toBe('/api/grupos/12/recuerdos');
  expect(options.method).toBe('POST');
  expect(options.headers.get('Authorization')).toBe('Bearer token-test');
  expect(options.headers.has('Content-Type')).toBe(false);
  expect(Object.fromEntries(body.entries())).toMatchObject({
    Titulo: 'Una tarde en el videoclub',
    Descripcion: 'Elegimos una película para ver con amigos.',
    Categoria: 'Cine',
    NombreLugar: 'Buenos Aires',
    Latitud: '-34.6',
    Longitud: '-58.4',
    TipoMultimedia: 'Foto',
    UrlArchivo: 'https://example.com/foto.jpg',
  });
  expect(body.has('AutorId')).toBe(false);
});

it('carga los recuerdos del grupo y conserva su pertenencia', async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify([{
    id: 88,
    titulo: 'Una tarde en el videoclub',
    descripcion: 'Elegimos una pelÃ­cula para ver con amigos.',
    fecha: '1996-07-20T00:00:00Z',
    fechaCreacion: '2026-10-20T18:00:00Z',
    categoria: 2,
    urlMultimedia: '',
    tipoMultimedia: 0,
    autor: { id: 1, username: 'ana' },
    lugar: { nombre: 'Buenos Aires', latitud: -34.6, longitud: -58.4 },
    grupo: { id: 12, nombre: 'Cine de los 90' },
  }])));
  vi.stubGlobal('fetch', fetch);

  await expect(getGroupMemories('12')).resolves.toEqual([
    expect.objectContaining({
      id: '88',
      title: 'Una tarde en el videoclub',
      year: 1996,
      category: 'Cine',
      author: 'ana',
      groupId: '12',
    }),
  ]);
  expect(new URL(fetch.mock.calls[0][0]).pathname).toBe('/api/grupos/12/recuerdos');
});

it('rechaza un grupo sin identificador numérico', async () => {
  await expect(createGroupMemory('grupo-local', {} as Memory))
    .rejects.toThrow('El grupo no tiene un identificador válido.');
});

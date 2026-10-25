import { afterEach, expect, it, vi } from 'vitest';
import { API_BASE_URL, cerrarSesion, crearPublicacion, guardarSesion, login } from './api';
import { ratePublication, toMemory } from './publicationsApi';
import { consumeLoginAchievements } from './loginAchievements';

afterEach(() => { cerrarSesion(); vi.unstubAllGlobals(); });
const session = {usuarioId: 8, token: 'test-token', username: 'usuario', email: 'usuario@example.test', esAdmin: false};

it('envía la puntuación autenticada al backend y conserva su resultado', async () => {
  guardarSesion(session);
  const result = {publicacionId: 20, puntosTotales: 19, miPuntuacion: 4};
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(result)));
  vi.stubGlobal('fetch', fetch);
  expect(await ratePublication('20', 4)).toEqual(result);
  expect(fetch.mock.calls[0][0]).toBe(`${API_BASE_URL}/api/publicaciones/20/puntuacion`);
  expect(fetch.mock.calls[0][1].method).toBe('PUT');
  expect(fetch.mock.calls[0][1].headers.get('Authorization')).toBe('Bearer test-token');
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({puntaje: 4});
});

it('una puntuación rechazada no se interpreta como guardada', async () => {
  guardarSesion(session);
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({detail: 'No podés puntuar tu propia publicación.'}), {status: 400})));
  await expect(ratePublication('20', 4)).rejects.toThrow('propia publicación');
  expect(() => ratePublication('20', 6)).toThrow('no es válida');
});

it('usa la puntuación persistida del DTO al reconstruir una publicación', () => {
  const memory = toMemory({id: 20, titulo: 'Recuerdo', fecha: '1995-01-01', categoria: 0, tipoMultimedia: 0,
    urlMultimedia: '', autor: {id: 2, username: 'autor'}, puntosTotales: 19, miPuntuacion: 4},
  {id: '20', title: '', description: '', author: '', year: 1995, category: 'Lugares', place: '', lat: 0, lng: 0, source: 'backend'});
  expect(memory).toMatchObject({viewerScore: 4, nostalgiaPoints: 19});
});

it('distingue la ubicación GPS del usuario del lugar histórico elegido', async () => {
  guardarSesion(session);
  const fetch = vi.fn().mockImplementation(() => Promise.resolve(new Response('{"id": 20}')));
  vi.stubGlobal('fetch', fetch);
  const memory = {title: 'Recuerdo', description: 'Texto', year: 1995, category: 'Lugares', place: 'Buenos Aires', lat: -35.6, lng: -59.4, image: 'https://example.test/foto.jpg'};
  await crearPublicacion(memory, undefined, {lat: -34.6, lng: -58.4});
  const form = fetch.mock.calls[0][1].body as FormData;
  expect(form.get('Latitud')).toBe('-35.6');
  expect(form.get('GpsLatitud')).toBe('-34.6');
  expect(form.get('GpsLongitud')).toBe('-58.4');
  await crearPublicacion(memory);
  expect((fetch.mock.calls[1][1].body as FormData).has('GpsLatitud')).toBe(false);
});

it('anuncia logros nuevos del login una sola vez y no los guarda en la sesión', async () => {
  const earned = {id: 14, titulo: 'Racha de Hierro', descripcion: 'Tres días', urlIcono: '.', puntosRecompensa: 0, desbloqueado: true, fechaDesbloqueo: '2026-10-03T12:00:00Z'};
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({...session, logrosNuevos: [earned]}))));
  expect(await login(session.email, 'clave-de-prueba')).not.toHaveProperty('logrosNuevos');
  expect(consumeLoginAchievements(session.usuarioId)).toEqual([earned]);
  expect(consumeLoginAchievements(session.usuarioId)).toEqual([]);
});

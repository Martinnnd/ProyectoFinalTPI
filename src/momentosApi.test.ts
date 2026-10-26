import { afterEach, expect, it, vi } from 'vitest';
import { getMoment, getMomentPublications, hasOtherMomentPublications, momentPeriod } from './momentosApi';
afterEach(() => vi.unstubAllGlobals());
it('conserva cursor, descendientes y cancelación sin inventar una primera página', async () => {
  const fetch = vi.fn().mockImplementation(async () => new Response(JSON.stringify({ items: [], siguienteCursor: null, hayMas: false })));
  vi.stubGlobal('fetch', fetch);
  const controller = new AbortController();
  await getMomentPublications(1, false, 'next+/= &?', controller.signal);
  const url = new URL(fetch.mock.calls[0][0]);
  expect(url.searchParams.get('cursor')).toBe('next+/= &?');
  expect(url.searchParams.get('incluirDescendientes')).toBe('false');
  expect(fetch.mock.calls[0][1].signal).toBe(controller.signal);
  await getMomentPublications(1, true);
  expect(new URL(fetch.mock.calls[1][0]).searchParams.has('cursor')).toBe(false);
});
it('presenta precisión anual sin inventar fechas exactas', () => {
  expect(momentPeriod({ id: 1, nombre: 'Mundial', fechaInicio: '1986-01-01', fechaFin: '1986-12-31', momentoPadreId: null })).toBe('1986');
});
it('maneja un 403 vacío sin intentar leer un JSON inexistente', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 403 })));
  await expect(getMoment(1)).rejects.toMatchObject({ status: 403 });
});
it('no ofrece un momento que solo contiene el original, incluso desde un repost', async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [{ id: 118 }], siguienteCursor: null, hayMas: false })));
  vi.stubGlobal('fetch', fetch);
  expect(await hasOtherMomentPublications(1, 118)).toBe(false);
  const url = new URL(fetch.mock.calls[0][0]);
  expect(url.searchParams.get('limite')).toBe('2');
  expect(url.searchParams.get('incluirDescendientes')).toBe('true');
});
it('ofrece un momento con otro recuerdo aunque el original no esté en la primera página', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [{ id: 119 }, { id: 120 }], siguienteCursor: 'next', hayMas: true }))));
  expect(await hasOtherMomentPublications(1, 118)).toBe(true);
});

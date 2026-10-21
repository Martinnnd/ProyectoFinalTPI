import { afterEach, expect, it, vi } from 'vitest';
import { getMemoryRelations, getRelatedMapMemory, getRelatedMemories } from './recuerdosRelationsApi';

afterEach(() => vi.unstubAllGlobals());
it('conserva el cursor opaco, el tipo y la cancelación', async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [], siguienteCursor: null, hayMas: false })));
  vi.stubGlobal('fetch', fetch);
  const controller = new AbortController();
  await getRelatedMemories('25', 'dia', 'next+/= &?', controller.signal);
  const url = new URL(fetch.mock.calls[0][0]);
  expect(url.searchParams.get('cursor')).toBe('next+/= &?');
  expect(url.searchParams.get('tipo')).toBe('dia');
  expect(fetch.mock.calls[0][1].signal).toBe(controller.signal);
});
it('tolera un error sin cuerpo', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 403 })));
  await expect(getMemoryRelations('25')).rejects.toThrow('403');
});
it('no ubica un recuerdo en las coordenadas del pin anterior si falta su lugar', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 26 }))));
  await expect(getRelatedMapMemory(26)).rejects.toThrow('ubicación');
});

import { afterEach, expect, it, vi } from 'vitest';
import { getFeedPlacePage, getMemoryRelations, getRelatedMapMemory, getRelatedMemories, type RelatedMemory } from './recuerdosRelationsApi';

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
const relation = (id: number, mismoDia: boolean) => ({ id, mismoDia } as RelatedMemory);
it('solo lugar descarta el mismo día y sigue páginas vacías hasta otra fecha', async () => {
  const fetch = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ items: [relation(27, true)], siguienteCursor: 'otra+/= &?', hayMas: true })))
    .mockResolvedValueOnce(new Response(JSON.stringify({ items: [relation(28, false), relation(29, true)], siguienteCursor: 'final+/=', hayMas: true })));
  vi.stubGlobal('fetch', fetch);
  const result = await getFeedPlacePage('25', { items: [relation(26, true)], siguienteCursor: 'primera+/=', hayMas: true });
  expect(result.items.map(item => item.id)).toEqual([28]);
  expect(result.siguienteCursor).toBe('final+/=');
  expect(new URL(fetch.mock.calls[1][0]).searchParams.get('cursor')).toBe('otra+/= &?');
});
it('no ofrece solo lugar si todas las páginas pertenecen al mismo día', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [relation(27, true)], siguienteCursor: null, hayMas: false }))));
  expect(await getFeedPlacePage('25', { items: [relation(26, true)], siguienteCursor: 'next', hayMas: true })).toMatchObject({ items: [], siguienteCursor: null, hayMas: false });
});
it('cancela la búsqueda de otras fechas sin enviar una página nueva', async () => {
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
  const controller = new AbortController(); controller.abort();
  await expect(getFeedPlacePage('25', { items: [], siguienteCursor: 'next', hayMas: true }, controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
  expect(fetch).not.toHaveBeenCalled();
});

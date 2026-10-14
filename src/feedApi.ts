import { API_BASE_URL } from './api';
import { toMemory, type Publication } from './publicationsApi';
import type { Memory } from './types';

export type RemoteFeed = 'para-vos' | 'seguidos';
export type FeedPage = { items: Memory[]; siguienteCursor: string | null; hayMas: boolean };
export class FeedError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export async function getFeed(feed: RemoteFeed, cursor?: string, signal?: AbortSignal): Promise<FeedPage> {
  const query = new URLSearchParams({ usuarioId: '1', limite: '20' });
  if (cursor) query.set('cursor', cursor);
  const response = await fetch(`${API_BASE_URL}/api/feed/${feed}?${query}`, { signal, cache: 'no-store' });
  if (!response.ok) {
    const problem = await response.json().catch(() => null);
    const fields = problem?.errors ? Object.values(problem.errors).flat().join(' ') : '';
    throw new FeedError(fields || problem?.mensaje || problem?.detail || problem?.title || `No se pudo cargar el feed (${response.status}).`, response.status);
  }
  const page: { items: Publication[]; siguienteCursor: string | null; hayMas: boolean } = await response.json();
  return { ...page, items: page.items.map(item => toMemory(item, { id: String(item.id), title: '', description: '', author: '', place: '', year: 1990, category: 'Personales', lat: 0, lng: 0, source: 'backend' })) };
}

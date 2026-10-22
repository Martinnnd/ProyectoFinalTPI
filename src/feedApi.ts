import { API_BASE_URL, getSesion } from './api';
import { apiFetch } from './components/auth/apiClient';
import { toMemory, type Publication } from './publicationsApi';
import type { Memory } from './types';

export type RemoteFeed = 'para-vos' | 'seguidos';
export type FeedPage = { items: Memory[]; siguienteCursor: string | null; hayMas: boolean };
export class FeedError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export async function getFeed(feed: RemoteFeed, cursor?: string, signal?: AbortSignal): Promise<FeedPage> {
  const session = getSesion();
  if (!session) throw new FeedError('Tenés que iniciar sesión para ver tu feed personalizado.', 401);
  const query = new URLSearchParams({ usuarioId: String(session.usuarioId), limite: '20' });
  if (cursor) query.set('cursor', cursor);
  const response = await apiFetch(`${API_BASE_URL}/api/feed/${feed}?${query}`, { signal, cache: 'no-store' });
  if (!response.ok) {
    const problem = await response.json().catch(() => null);
    const fields = problem?.errors ? Object.values(problem.errors).flat().join(' ') : '';
    throw new FeedError(fields || problem?.mensaje || problem?.detail || problem?.title || `No se pudo cargar el feed (${response.status}).`, response.status);
  }
  const page: { items: Publication[]; siguienteCursor: string | null; hayMas: boolean } = await response.json();
  const discoveries = feed === 'para-vos' ? page.items.filter(item => item.autor.id !== session.usuarioId) : page.items;
  return { ...page, items: discoveries.map(item => toMemory(item, { id: String(item.id), title: '', description: '', author: '', place: '', year: 1990, category: 'Personales', lat: 0, lng: 0, source: 'backend' })) };
}

export async function registrarImpresionesFeed(publicacionesIds: string[]): Promise<void> {
  const session = getSesion();
  if (!session || publicacionesIds.length === 0) return;
  const ids = [...new Set(publicacionesIds.map(Number).filter(id => Number.isSafeInteger(id) && id > 0))];
  if (ids.length === 0) return;

  const response = await apiFetch(`${API_BASE_URL}/api/feed/impresiones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicacionesIds: ids }),
  });
  if (!response.ok) {
    throw new FeedError(`No se pudieron registrar las impresiones (${response.status}).`, response.status);
  }
}

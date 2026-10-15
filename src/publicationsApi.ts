import { API_BASE_URL } from './api';
import { apiFetch } from './components/auth/apiClient';
import { categories, type Category, type Memory, type Period } from './types';
import { youtubeId } from './media';

export type MapBounds = { minLatitud: number; maxLatitud: number; minLongitud: number; maxLongitud: number };
type Pin = { id: number; latitud: number; longitud: number; categoria: number | string };
export type Publication = { cantidadLikes?: number; cantidadComentarios?: number; dioLike?: boolean; id: number; titulo: string; descripcion?: string; descripcionBreve?: string; fecha: string; fechaCreacion?: string; categoria: number | string; urlMultimedia: string; tipoMultimedia: number | string; autor: { id: number; username: string }; lugar?: { nombre: string; latitud: number; longitud: number } };

export async function publicationRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers);
  const response = await apiFetch(`${API_BASE_URL}/api/publicaciones${path}`, { ...options, headers });
  if (!response.ok) {
    const problem = await response.json().catch(() => null);
    const fields = problem?.errors ? Object.values(problem.errors).flat().join(' ') : '';
    throw new Error(fields || problem?.detail || problem?.title || `Error del servidor (${response.status}).`);
  }
  return response.json();
}
function category(value: number | string): Category {
  if (typeof value === 'number') return categories[value] ?? 'Personales';
  return value === 'Recuerdos_Personales' ? 'Personales' : categories.find(c => c === value) ?? 'Personales';
}
export function publicationId(memory: Memory): string | null {
  return memory.source !== 'demo' && /^[1-9]\d*$/.test(memory.id) ? memory.id : null;
}
export async function getMapPublications(bounds: MapBounds, period: Period, selectedCategory: Category | 'Todas', signal?: AbortSignal): Promise<{ hayMas: boolean; memories: Memory[] }> {
  if (bounds.minLongitud > bounds.maxLongitud) {
    const halves = await Promise.all([
      getMapPublications({ ...bounds, maxLongitud: 180 }, period, selectedCategory, signal),
      getMapPublications({ ...bounds, minLongitud: -180 }, period, selectedCategory, signal),
    ]);
    return { hayMas: halves.some(part => part.hayMas), memories: [...new Map(halves.flatMap(part => part.memories).map(memory => [memory.id, memory])).values()] };
  }
  const year = period.year ?? period.decade;
  const query = new URLSearchParams(Object.entries(bounds).map(([key, value]) => [key, String(value)]));
  query.set('fechaDesde', `${year}-01-01T00:00:00Z`);
  query.set('fechaHasta', `${period.year === null ? year + 10 : year + 1}-01-01T00:00:00Z`);
  if (selectedCategory !== 'Todas') query.set('categoria', selectedCategory === 'Personales' ? 'Recuerdos_Personales' : selectedCategory);
  const result = await publicationRequest<{ pines: Pin[]; hayMas: boolean }>(`/mapa?${query}`, { signal });
  return { hayMas: result.hayMas, memories: result.pines.map((pin): Memory => ({ id: String(pin.id), title: 'Recuerdo', description: '', author: '', place: '', year, category: category(pin.categoria), lat: pin.latitud, lng: pin.longitud, source: 'backend' })) };
}
export function toMemory(data: Publication, pin: Memory): Memory {
  const url = data.urlMultimedia ? new URL(data.urlMultimedia, API_BASE_URL).href : '';
  const video = data.tipoMultimedia === 1 || data.tipoMultimedia === 'Video';
  return { ...pin, id: String(data.id), source: 'backend', likeCount: data.cantidadLikes, commentCount: data.cantidadComentarios, viewerLiked: data.dioLike, title: data.titulo, description: data.descripcion ?? data.descripcionBreve ?? '', year: new Date(data.fecha).getUTCFullYear(), category: category(data.categoria), author: data.autor.username, authorId: data.autor.id, createdAt: data.fechaCreacion, place: data.lugar?.nombre ?? pin.place, lat: data.lugar?.latitud ?? pin.lat, lng: data.lugar?.longitud ?? pin.lng, image: url && !video && !youtubeId(url) ? url : undefined, media: url && (video || youtubeId(url)) ? { kind: youtubeId(url) ? 'youtube' : 'video', url } : undefined };
}
export async function getPublication(memory: Memory, summary: boolean, signal?: AbortSignal) {
  const id = publicationId(memory);
  if (!id) throw new Error('Esta publicación no tiene un identificador del servidor.');
  return toMemory(await publicationRequest<Publication>(`/${id}${summary ? '/resumen' : ''}`, { signal }), memory);
}

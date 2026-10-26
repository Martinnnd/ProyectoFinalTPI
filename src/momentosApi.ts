import { API_BASE_URL } from './apiConfig';
import { apiFetch } from './components/auth/apiClient';
import type { Publication } from './publicationsApi';

export interface MomentoResumen {
  id: number; nombre: string; fechaInicio: string | null; fechaFin: string | null; momentoPadreId: number | null;
}
export interface MomentoDetalle extends MomentoResumen {
  versionCatalogo: number; redirigidoDesdeId: number | null; descripcion: string;
  padre: MomentoResumen | null; hijos: MomentoResumen[]; alias: string[];
}
export interface MomentosPublicacion {
  publicacionId: number; versionRelaciones: number; permitirMomentosAutomaticos: boolean; puedeCorregir: boolean;
  momentos: { momento: MomentoResumen; origen: 'automatico' | 'autor' }[];
}
export type EstadoAnalisis = 'noProgramado' | 'pendiente' | 'procesando' | 'completado' | 'sinMomento' | 'sinAnalizador' | 'descartado' | 'fallido' | 'desactivado';
export interface AnalisisRecuerdo { publicacionId: number; versionContenido: number; estado: EstadoAnalisis }
export interface MomentPublications { items: Publication[]; siguienteCursor: string | null; hayMas: boolean }
export class MomentoError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await apiFetch(`${API_BASE_URL}/api${path}`, { signal, cache: 'no-store' });
  if (!response.ok) {
    const problem = await response.json().catch(() => null);
    throw new MomentoError(response.status === 404 ? 'Este momento o recuerdo no está disponible.' : problem?.detail || problem?.title || 'No pudimos cargar los momentos. Volvé a intentar.', response.status);
  }
  return response.json();
}
export const getPublicationMoments = (id: string, signal?: AbortSignal) => request<MomentosPublicacion>(`/publicaciones/${id}/momentos`, signal);
export const getMemoryAnalysis = (id: string, signal?: AbortSignal) => request<AnalisisRecuerdo>(`/publicaciones/${id}/analisis`, signal);
export const getMoment = (id: number, signal?: AbortSignal) => request<MomentoDetalle>(`/momentos/${id}`, signal);
export function getMomentPublications(id: number, descendants: boolean, cursor?: string | null, signal?: AbortSignal, limit = 20) {
  const query = new URLSearchParams({ incluirDescendientes: String(descendants), limite: String(limit) });
  if (cursor) query.set('cursor', cursor);
  return request<MomentPublications>(`/momentos/${id}/publicaciones?${query}`, signal);
}
export async function hasOtherMomentPublications(momentId: number, originalId: number, signal?: AbortSignal) {
  // Two distinct originals suffice to establish whether another memory exists.
  const page = await getMomentPublications(momentId, true, null, signal, 2);
  return page.items.some(item => item.id !== originalId);
}
export function momentPeriod(moment: MomentoResumen) {
  const { fechaInicio: start, fechaFin: end } = moment;
  if (start && end && start.slice(0, 4) === end.slice(0, 4) && start.endsWith('-01-01') && end.endsWith('-12-31')) return start.slice(0, 4);
  const format = (value: string) => value.split('-').reverse().join('/');
  if (start && end && start !== end) return `${format(start)} – ${format(end)}`;
  return start ? format(start) : end ? `Hasta ${format(end)}` : '';
}

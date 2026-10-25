import { API_BASE_URL, getSesion } from './api';
import { publicationRequest, toMemory, type Publication } from './publicationsApi';
import type { Achievement, Memory } from './types';

export type AchievementState = {
  id: number; titulo: string; descripcion: string; urlIcono: string;
  puntosRecompensa: number; desbloqueado: boolean; fechaDesbloqueo: string | null;
};
export type UserProfile = {
  id: number; username: string; nombre: string | null; apellido: string | null;
  reputacion: string; puntosNostalgia: number; cantidadPublicaciones: number;
  cantidadSeguidores: number; cantidadSeguidos: number; loSigo: boolean;
  logros: AchievementState[];
};

export async function getUserProfile(user: number | string, signal?: AbortSignal): Promise<UserProfile> {
  const token = getSesion()?.token;
  if (!token) throw new Error('Iniciá sesión para ver el perfil.');
  const path = typeof user === 'number' ? `${user}/perfil` : `perfil/${encodeURIComponent(user)}`;
  const response = await fetch(`${API_BASE_URL}/api/usuario/${path}`, {
    headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', signal,
  });
  if (!response.ok) {
    const problem = await response.json().catch(() => null);
    throw new Error(response.status === 401 ? 'Tu sesión venció. Volvé a iniciar sesión.'
      : problem?.detail || problem?.title || 'No se pudo cargar el perfil.');
  }
  const profile: UserProfile = await response.json();
  if (!Array.isArray(profile.logros)) throw new Error('El backend no devolvió el catálogo de logros.');
  return profile;
}

export async function getUserMemories(userId: number, signal?: AbortSignal): Promise<Memory[]> {
  const publications = await publicationRequest<Publication[]>(`/usuario/${userId}`, {signal, cache: 'no-store'});
  return publications.map(data => toMemory(data, {
    id: String(data.id), title: '', description: '', author: '', place: '',
    year: new Date(data.fecha).getUTCFullYear(), category: 'Personales', lat: 0, lng: 0, source: 'backend',
  }));
}

// IDs del backend: no coinciden con la numeración antigua de los archivos.
const icons: Record<number, string> = {
  1: '01_primer_paso.png', 2: '10_primera_palabra.png', 3: '13_con_amigos.png',
  7: '02_cronista_local.png', 8: '04_voz_de_una_epoca.png', 9: '17_fotografoDelRecuerdo.png',
  10: '06_popular.png', 11: '08_generoso.png', 12: '11_conversador.png',
  14: '18_rachaDeHierro.png', 15: '05_decada_completa.png', 16: '07_leyenda.png',
  18: '14_influencer.png', 19: '19_rachaDeOro.png',
};

export function toAchievement(logro: AchievementState): Achievement {
  const customIcon = /^(https:\/\/|\/(?!\/))/.test(logro.urlIcono);
  return {
    id: String(logro.id), name: logro.titulo, description: logro.descripcion,
    image: customIcon ? logro.urlIcono : `/logros/${icons[logro.id] ?? '21_primera_chispa.svg'}`,
    unlocked: logro.desbloqueado,
    unlockedAt: logro.fechaDesbloqueo,
  };
}

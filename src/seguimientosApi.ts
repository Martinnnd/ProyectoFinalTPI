import { API_BASE_URL, getSesion } from './api';

export type FollowedUser = { id: number; username: string };

async function request(path: string, options?: RequestInit): Promise<unknown> {
  const headers = new Headers(options?.headers);
  const token = getSesion()?.token;
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${API_BASE_URL}/api/seguimientos${path}`, { ...options, headers, cache: 'no-store' });
  if (!response.ok) {
    const problem = await response.json().catch(() => null);
    const fields = problem?.errors ? Object.values(problem.errors).flat().join(' ') : '';
    throw new Error(fields || problem?.detail || problem?.mensaje || problem?.title || `No se pudo completar el seguimiento (${response.status}).`);
  }
  if (response.status === 204) return null;
  return response.json().catch(() => null);
}

function users(data: unknown): FollowedUser[] {
  const value = data as { items?: unknown; seguidos?: unknown; seguidores?: unknown } | null;
  const list = Array.isArray(data) ? data : value?.items ?? value?.seguidos ?? value?.seguidores;
  if (!Array.isArray(list)) throw new Error('La lista de seguimientos recibida no es válida.');
  return list.map(item => {
    const user = item as { id?: number; usuarioId?: number; idUsuario?: number; username?: string; nombreUsuario?: string; usuario?: { id?: number; username?: string } };
    const id = Number(user.id ?? user.usuarioId ?? user.idUsuario ?? user.usuario?.id);
    const username = user.username ?? user.nombreUsuario ?? user.usuario?.username;
    if (!Number.isSafeInteger(id) || id <= 0 || !username) throw new Error('La lista de seguimientos recibida no es válida.');
    return { id, username };
  });
}

export async function getSeguidos(idUsuario: number, signal?: AbortSignal): Promise<FollowedUser[]> {
  return users(await request(`/${idUsuario}/seguidos`, { signal }));
}

export async function getSeguidores(idUsuario: number, signal?: AbortSignal): Promise<FollowedUser[]> {
  return users(await request(`/${idUsuario}/seguidores`, { signal }));
}

export async function seguir(idUsuario: number, idUsuarioASeguir: number): Promise<void> {
  await request('', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idUsuario, idUsuarioASeguir }) });
}

export async function dejarDeSeguir(idUsuario: number, idUsuarioASeguir: number): Promise<void> {
  await request('', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idUsuario, idUsuarioASeguir }) });
}

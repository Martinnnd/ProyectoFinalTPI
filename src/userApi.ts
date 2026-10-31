import { API_BASE_URL } from "./apiConfig";
import { apiFetch } from "./components/auth/apiClient";
import { toMemory, type Publication } from "./publicationsApi";
import type { Memory } from "./types";

export interface UsuarioPerfil {
  fotoPerfilUrl?: string | null;
  id: number;
  username: string;
  nombre?: string;
  apellido?: string;
  tipoUsuario: string;
  reputacion: string;
  puntosNostalgia: number;
  cantidadPublicaciones: number;
  cantidadSeguidores: number;
  cantidadSeguidos: number;
  loSigo: boolean;
}

export interface UsuarioBusqueda {
  id: number;
  username: string;
}

export async function buscarUsuarios(
  texto: string,
  signal?: AbortSignal,
): Promise<UsuarioBusqueda[]> {
  const query = new URLSearchParams({ texto: texto.trim(), limite: "10" });
  const response = await apiFetch(`${API_BASE_URL}/api/usuario/buscar?${query}`, { signal });
  if (!response.ok) {
    const problem = await response.json().catch(() => null);
    throw new Error(
      problem?.detail || problem?.title || `No se pudieron buscar usuarios (${response.status}).`,
    );
  }
  const users: unknown = await response.json();
  if (!Array.isArray(users))
    throw new Error("La búsqueda de usuarios devolvió una respuesta inválida.");
  return users.map((user) => {
    const value = user as Partial<UsuarioBusqueda>;
    if (!Number.isSafeInteger(value.id) || !value.username) {
      throw new Error("La búsqueda de usuarios devolvió una respuesta inválida.");
    }
    return { id: value.id!, username: value.username };
  });
}

export async function getPerfilUsuario(
  username: string,
  signal?: AbortSignal,
): Promise<UsuarioPerfil> {
  const response = await apiFetch(
    `${API_BASE_URL}/api/usuario/perfil/${encodeURIComponent(username)}`,
    { signal },
  );
  if (!response.ok) {
    const problem = await response.json().catch(() => null);
    throw new Error(
      problem?.detail ||
        problem?.title ||
        `No se pudo cargar el perfil del usuario (${response.status}).`,
    );
  }
  return response.json();
}

export async function getPublicacionesUsuario(
  usuarioId: number,
  signal?: AbortSignal,
): Promise<Memory[]> {
  const response = await apiFetch(`${API_BASE_URL}/api/publicaciones/usuario/${usuarioId}`, {
    signal,
  });
  if (!response.ok) {
    const problem = await response.json().catch(() => null);
    throw new Error(
      problem?.detail ||
        problem?.title ||
        `No se pudieron cargar los recuerdos del usuario (${response.status}).`,
    );
  }
  const publications: Publication[] = await response.json();
  return publications.map((pub) =>
    toMemory(pub, {
      id: String(pub.id),
      title: pub.titulo,
      description: "",
      year: new Date(pub.fecha).getUTCFullYear(),
      category: "Personales",
      author: pub.autor?.username ?? "",
      authorId: pub.autor?.id,
      place: pub.lugar?.nombre ?? "",
      lat: pub.lugar?.latitud ?? 0,
      lng: pub.lugar?.longitud ?? 0,
      source: "backend",
      groupId: pub.grupo ? String(pub.grupo.id) : undefined,
    }),
  );
}

export async function getPublicacionesGuardadasUsuario(
  usuarioId: number,
  signal?: AbortSignal,
): Promise<Memory[]> {
  const response = await apiFetch(
    `${API_BASE_URL}/api/publicaciones/usuario/${usuarioId}/guardadas`,
    { signal },
  );
  if (!response.ok) {
    const problem = await response.json().catch(() => null);
    throw new Error(
      problem?.detail ||
        problem?.title ||
        `No se pudieron cargar los recuerdos guardados (${response.status}).`,
    );
  }
  const publications: Publication[] = await response.json();
  return publications.map((pub) =>
    toMemory(pub, {
      id: String(pub.id),
      title: pub.titulo,
      description: "",
      year: new Date(pub.fecha).getUTCFullYear(),
      category: "Personales",
      author: pub.autor?.username ?? "",
      authorId: pub.autor?.id,
      place: pub.lugar?.nombre ?? "",
      lat: pub.lugar?.latitud ?? 0,
      lng: pub.lugar?.longitud ?? 0,
      source: "backend",
      groupId: pub.grupo ? String(pub.grupo.id) : undefined,
    }),
  );
}

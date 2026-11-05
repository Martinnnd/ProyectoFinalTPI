import { API_BASE_URL } from "../apiConfig";
import { apiFetch } from "../components/auth/apiClient";

export const adminCategories = [
  "Lugares",
  "Música",
  "Cine",
  "Televisión",
  "Videojuegos",
  "Acontecimientos",
  "Recuerdos personales",
] as const;

export type AdminPage<T> = {
  items: T[];
  pagina: number;
  tamanio: number;
  totalItems: number;
  totalPaginas: number;
};

export type AdminPublication = {
  id: number;
  titulo: string;
  descripcion: string;
  fecha: string;
  fechaCreacion: string;
  categoria: number;
  estaOculto: boolean;
  motivoOculto?: string | null;
  autorId: number;
  autorUsername: string;
};

export type PublicationFilters = {
  pagina?: number;
  tamanio?: number;
  texto?: string;
  categoria?: number;
  oculta?: boolean;
};

export type PublicationUpdate = Pick<
  AdminPublication,
  "titulo" | "descripcion" | "fecha" | "categoria"
>;

export type AdminUser = {
  id: number;
  username: string;
  email: string;
  nombre?: string | null;
  apellido?: string | null;
  esAdmin: boolean;
  estaEliminado: boolean;
  tipo: number;
  suspendidoHasta?: string | null;
  fechaCreacion: string;
};

export type UserFilters = {
  pagina?: number;
  tamanio?: number;
  texto?: string;
  suspendido?: boolean;
  esAdmin?: boolean;
  eliminado?: boolean;
};

export type RankingItem = {
  publicacionId: number;
  titulo: string;
  autorUsername: string;
  cantidad: number;
};

export type AdminStatistics = {
  totalUsuarios: number;
  totalPublicaciones: number;
  publicacionesVisibles: number;
  publicacionesOcultas: number;
  publicacionesPorCategoria: { categoria: string; cantidad: number }[];
  masGustadas: RankingItem[];
  masPuntuadas: RankingItem[];
};

export type AdminComment = {
  id: number;
  publicacionId: number;
  comentarioPadreId?: number | null;
  contenido?: string | null;
  fechaCreacion: string;
  autor?: { id: number; username: string } | null;
  estaEliminado?: boolean;
  respuestas?: AdminComment[];
};

function queryOf(values: Record<string, string | number | boolean | undefined>) {
  const query = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });
  return query.toString();
}

async function adminRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("X-Nostalgiar-Request", "1");
  if (init.body) headers.set("Content-Type", "application/json");
  const response = await apiFetch(`${API_BASE_URL}/api/admin/${path}`, { ...init, headers });
  if (!response.ok) throw new Error(await errorMessage(response));
  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

async function errorMessage(response: Response) {
  const fallback = `No se pudo completar la operación (${response.status}).`;
  try {
    const body = (await response.json()) as { detail?: string; title?: string; mensaje?: string };
    return body.detail ?? body.mensaje ?? body.title ?? fallback;
  } catch {
    return fallback;
  }
}

export function getAdminPublications(filters: PublicationFilters, signal?: AbortSignal) {
  return adminRequest<AdminPage<AdminPublication>>(`publicaciones?${queryOf(filters)}`, {
    signal,
    cache: "no-store",
  });
}

export function updateAdminPublication(id: number, data: PublicationUpdate) {
  return adminRequest<AdminPublication>(`publicaciones/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function setAdminPublicationVisibility(id: number, ocultar: boolean, motivo?: string) {
  return adminRequest<void>(`publicaciones/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ ocultar, motivo: motivo || null }),
  });
}

export function deleteAdminPublication(id: number) {
  return adminRequest<void>(`publicaciones/${id}`, { method: "DELETE" });
}

export function getAdminUsers(filters: UserFilters, signal?: AbortSignal) {
  return adminRequest<AdminPage<AdminUser>>(`usuarios?${queryOf(filters)}`, {
    signal,
    cache: "no-store",
  });
}

export function setAdminUserSuspension(id: number, suspender: boolean, dias = 7) {
  return adminRequest<void>(`usuarios/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ suspender, dias }),
  });
}

export function deleteAdminUser(id: number) {
  return adminRequest<void>(`usuarios/${id}`, { method: "DELETE" });
}

export function getAdminStatistics(signal?: AbortSignal) {
  return adminRequest<AdminStatistics>("estadisticas?limiteRanking=5", {
    signal,
    cache: "no-store",
  });
}

export async function getPublicationComments(publicationId: number, signal?: AbortSignal) {
  const response = await apiFetch(
    `${API_BASE_URL}/api/publicaciones/${publicationId}/comentarios?limite=50`,
    { signal, cache: "no-store" },
  );
  if (!response.ok) throw new Error(await errorMessage(response));
  return (await response.json()) as { items: AdminComment[]; siguienteCursor?: string | null };
}

export function deleteAdminComment(id: number) {
  return adminRequest<void>(`comentarios/${id}`, { method: "DELETE" });
}

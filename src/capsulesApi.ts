import { apiRequest } from "./apiRequest";
import { API_BASE_URL } from "./apiConfig";
import { apiFetch } from "./components/auth/apiClient";
import { toMemory, type MapBounds, type Publication } from "./publicationsApi";
import { categories, type Memory } from "./types";

export type CursorPage<T> = { items: T[]; siguienteCursor: string | null; hayMas: boolean };
export type Capsule = {
  id: number;
  propietarioId: number;
  propietarioUsername: string;
  nombre: string;
  descripcion: string | null;
  visibilidad: 0 | 1;
  portadaPublicacionId: number | null;
  portadaAdjuntoId: number | null;
  portadaUrl: string | null;
  portadaSubida?: boolean;
  cantidadRecuerdos: number;
  fechaDesde: string | null;
  fechaHasta: string | null;
  fechaCreacion: string;
  fechaActualizacion: string;
  puedeAdministrar: boolean;
};
export type CapsuleInput = Pick<
  Capsule,
  "nombre" | "descripcion" | "visibilidad" | "portadaPublicacionId" | "portadaAdjuntoId"
> & { conservarPortadaSubida?: boolean };
export type AvailableCapsuleMemory = {
  id: number;
  titulo: string;
  fecha: string;
  portadaUrl: string | null;
  yaAgregado: boolean;
};
export type CapsuleMapPage = CursorPage<Memory> & { limites: MapBounds | null };
type CapsulePin = {
  id: number;
  titulo: string;
  año: number;
  latitud: number;
  longitud: number;
  categoria: number | string;
};

export function positiveId(value: string | number): number {
  const number = Number(value);
  if (!/^[1-9]\d*$/.test(String(value)) || !Number.isSafeInteger(number) || number > 2147483647)
    throw new Error("El identificador no es válido.");
  return number;
}

function query(cursor?: string | null, limit = 20) {
  const params = new URLSearchParams({ limite: String(limit) });
  if (cursor) params.set("cursor", cursor);
  return params;
}
async function request<T>(path: string, options: RequestInit = {}) {
  try {
    return await apiRequest<T>(`/api/capsulas${path}`, { ...options, cache: "no-store" });
  } catch (cause) {
    if (cause instanceof TypeError)
      throw new Error(
        "No pudimos conectar con el servidor. Revisá tu conexión y volvé a intentar.",
      );
    throw cause;
  }
}
function json(method: string, body: unknown): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}
export function listCapsules(cursor?: string | null, signal?: AbortSignal, ownerId?: number) {
  const params = query(cursor);
  if (ownerId !== undefined) params.set("propietarioId", String(positiveId(ownerId)));
  return request<CursorPage<Capsule>>(`${ownerId === undefined ? "/mias" : ""}?${params}`, {
    signal,
  });
}
export function getCapsule(id: number, signal?: AbortSignal) {
  return request<Capsule>(`/${positiveId(id)}`, { signal });
}
function coverForm(input: CapsuleInput, file: File, publicationIds?: number[]) {
  const form = new FormData();
  form.set("Nombre", input.nombre);
  form.set("Descripcion", input.descripcion ?? "");
  form.set("Visibilidad", String(input.visibilidad));
  form.set("ConservarPortadaSubida", String(input.conservarPortadaSubida ?? true));
  form.set("Archivo", file);
  [...new Set(publicationIds)].forEach((id, index) =>
    form.append(`PublicacionesIds[${index}]`, String(id)),
  );
  return form;
}
export function createCapsule(input: CapsuleInput, publicationIds: number[], file?: File) {
  return request<Capsule>(
    "",
    file
      ? { method: "POST", body: coverForm(input, file, publicationIds) }
      : json("POST", { ...input, publicacionesIds: [...new Set(publicationIds)] }),
  );
}
export function updateCapsule(id: number, input: CapsuleInput, file?: File) {
  return request<Capsule>(
    `/${positiveId(id)}`,
    file ? { method: "PUT", body: coverForm(input, file) } : json("PUT", input),
  );
}
export async function getCapsuleCover(id: number, signal?: AbortSignal): Promise<Blob> {
  const response = await apiFetch(`${API_BASE_URL}/api/capsulas/${positiveId(id)}/portada`, {
    signal,
    cache: "no-store",
  });
  if (!response.ok) throw new Error("No pudimos cargar la portada.");
  const image = await response.blob();
  if (image.type !== "image/webp") throw new Error("La portada no tiene un formato válido.");
  return image;
}
export function deleteCapsule(id: number) {
  return request<void>(`/${positiveId(id)}`, { method: "DELETE" });
}
export function addCapsuleMemories(id: number, publicationIds: number[]) {
  return request<void>(
    `/${positiveId(id)}/recuerdos`,
    json("POST", { publicacionesIds: [...new Set(publicationIds)] }),
  );
}
export function removeCapsuleMemory(id: number, publicationId: number) {
  return request<void>(`/${positiveId(id)}/recuerdos?publicacionId=${positiveId(publicationId)}`, {
    method: "DELETE",
  });
}
export function availableCapsuleMemories(
  capsuleId?: number,
  cursor?: string | null,
  signal?: AbortSignal,
) {
  const params = query(cursor);
  if (capsuleId !== undefined) params.set("capsulaId", String(positiveId(capsuleId)));
  return request<CursorPage<AvailableCapsuleMemory>>(`/recuerdos-disponibles?${params}`, {
    signal,
  });
}
export async function getCapsuleMemories(
  id: number,
  cursor?: string | null,
  signal?: AbortSignal,
): Promise<CursorPage<Memory>> {
  const page = await request<CursorPage<Publication>>(
    `/${positiveId(id)}/recuerdos?${query(cursor)}`,
    { signal },
  );
  return {
    ...page,
    items: page.items.map((publication) =>
      toMemory(publication, {
        id: String(publication.id),
        title: "",
        description: "",
        year: 1970,
        author: "",
        place: "",
        category: "Personales",
        lat: 0,
        lng: 0,
        source: "backend",
      }),
    ),
  };
}
export async function getCapsuleMap(
  id: number,
  cursor?: string | null,
  signal?: AbortSignal,
): Promise<CapsuleMapPage> {
  const page = await request<CursorPage<CapsulePin> & { limites: MapBounds | null }>(
    `/${positiveId(id)}/mapa?${query(cursor, 200)}`,
    { signal },
  );
  return {
    ...page,
    items: page.items.map((pin) => ({
      id: String(pin.id),
      title: pin.titulo,
      year: pin.año,
      lat: pin.latitud,
      lng: pin.longitud,
      category:
        typeof pin.categoria === "number"
          ? (categories[pin.categoria] ?? "Personales")
          : (categories.find((category) => category === pin.categoria) ?? "Personales"),
      description: "",
      place: "",
      author: "",
      source: "backend" as const,
    })),
  };
}

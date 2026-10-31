import { publicationRequest, toMemory, type Publication } from "./publicationsApi";
import type { Memory } from "./types";

export interface RelatedMemory {
  id: number;
  titulo: string;
  descripcionBreve: string;
  fecha: string;
  urlMultimedia: string;
  tipoMultimedia: 0 | 1;
  autorId: number;
  autorUsername: string;
  nombreLugar: string;
  distanciaMetros: number;
  mismoDia: boolean;
  mismoLugar: true;
}
export interface RelatedPage {
  items: RelatedMemory[];
  siguienteCursor: string | null;
  hayMas: boolean;
}
export interface MemoryRelations {
  publicacionId: number;
  radioMetros: number;
  dia: RelatedPage;
  lugar: RelatedPage;
}
export function getMemoryRelations(id: string, signal?: AbortSignal) {
  return publicationRequest<MemoryRelations>(`/${id}/relaciones`, { signal, cache: "no-store" });
}
export function getRelatedMemories(
  id: string,
  tipo: "dia" | "lugar",
  cursor: string,
  signal?: AbortSignal,
) {
  const query = new URLSearchParams({ tipo, limite: "20", cursor });
  return publicationRequest<RelatedPage>(`/${id}/relacionadas?${query}`, {
    signal,
    cache: "no-store",
  });
}
// The backend's place relation includes the same day. The feed presents those
// separately, following opaque cursors until a page has another date or ends.
export async function getFeedPlacePage(
  id: string,
  initial: RelatedPage,
  signal?: AbortSignal,
): Promise<RelatedPage> {
  let page = initial;
  const visited = new Set<string>();
  while (true) {
    signal?.throwIfAborted();
    const items = page.items.filter((item) => !item.mismoDia);
    if (items.length || !page.siguienteCursor) return { ...page, items };
    if (visited.has(page.siguienteCursor))
      throw new Error("No pudimos continuar los recuerdos de este lugar.");
    visited.add(page.siguienteCursor);
    page = await getRelatedMemories(id, "lugar", page.siguienteCursor, signal);
  }
}
// Relations intentionally have no coordinates. Resolve the selected publication
// before moving the map, without borrowing the originating pin's location.
export async function getRelatedMapMemory(id: number, signal?: AbortSignal): Promise<Memory> {
  const data = await publicationRequest<Publication>(`/${id}`, { signal });
  if (
    !data.lugar ||
    !Number.isFinite(data.lugar.latitud) ||
    !Number.isFinite(data.lugar.longitud)
  ) {
    throw new Error("Este recuerdo no tiene una ubicación disponible para mostrar en el mapa.");
  }
  return toMemory(data, {
    id: String(id),
    title: "",
    description: "",
    year: 1990,
    category: "Personales",
    author: "",
    place: "",
    lat: data.lugar.latitud,
    lng: data.lugar.longitud,
    source: "backend",
  });
}

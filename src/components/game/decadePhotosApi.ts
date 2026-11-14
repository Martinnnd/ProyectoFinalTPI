import { API_BASE_URL } from "../../apiConfig";
import { decadeOptions, type DecadeQuestion } from "./decadeQuestions";
import type { Decade } from "../../types";

export async function getPublicationDecadePhotos(signal: AbortSignal): Promise<DecadeQuestion[]> {
  const response = await fetch(`${API_BASE_URL}/api/juegos/decadas/fotos`, {
    signal,
    cache: "no-store",
    credentials: "omit",
  });
  if (!response.ok) throw new Error("No se pudieron obtener las fotos de las publicaciones.");
  const data: unknown = await response.json();
  if (!Array.isArray(data)) throw new Error("El catálogo de fotos no es válido.");
  return data.flatMap((item): DecadeQuestion[] => {
    if (
      !item ||
      !Number.isSafeInteger(item.publicacionId) ||
      item.publicacionId <= 0 ||
      !decadeOptions.includes(item.decada) ||
      typeof item.url !== "string"
    )
      return [];
    let url: URL;
    try {
      url = new URL(item.url);
    } catch {
      return [];
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") return [];
    return [
      {
        id: `publication:${item.publicacionId}:${url.href}`,
        image: url.href,
        decade: item.decada as Decade,
        source: "publication",
        publicationId: item.publicacionId,
      },
    ];
  });
}

import { publicationRequest, toMemory, type Publication } from "./publicationsApi";
import type { FeedPage } from "./feedApi";
import type { WeeklyTrend } from "./hashtags";

type HashtagResponse = {
  hashtag: string;
  cantidadPublicaciones: number;
  cantidadAutores: number;
};

const toTrend = (item: HashtagResponse): WeeklyTrend => ({
  tag: item.hashtag,
  count: item.cantidadPublicaciones,
  authors: item.cantidadAutores,
});

export async function getHashtagPosts(tag: string, cursor?: string, signal?: AbortSignal): Promise<FeedPage> {
  const query = new URLSearchParams({ limite: "20" });
  if (cursor) query.set("cursor", cursor);
  const page = await publicationRequest<{
    items: Publication[];
    siguienteCursor: string | null;
    hayMas: boolean;
  }>(`/hashtags/${encodeURIComponent(tag)}/publicaciones?${query}`, { signal, cache: "no-store" });
  return {
    ...page,
    items: page.items.map(item => toMemory(item, {
      id: String(item.id), title: "", description: "", author: "", place: "", year: 1990,
      category: "Personales", lat: 0, lng: 0, source: "backend",
    })),
  };
}

export async function getWeeklyHashtags(signal?: AbortSignal): Promise<WeeklyTrend[]> {
  const items = await publicationRequest<HashtagResponse[]>("/hashtags/tendencias?limite=5", {
    signal, cache: "no-store",
  });
  return items.map(toTrend);
}

export async function searchHashtags(query: string, signal?: AbortSignal): Promise<WeeklyTrend[]> {
  const params = new URLSearchParams({ q: query, limite: "10" });
  const items = await publicationRequest<HashtagResponse[]>(`/hashtags/buscar?${params}`, {
    signal, cache: "no-store",
  });
  return items.map(toTrend);
}

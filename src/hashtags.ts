import type { Memory } from "./types";

export const MAX_HASHTAGS = 5;
export const MAX_HASHTAG_LENGTH = 32;
const tagPattern = /^[\p{L}\p{N}_]+$/u;

export function normalizeHashtag(value: string): string {
  return value.trim().replace(/^#/, "").normalize("NFKC").toLocaleLowerCase("es");
}

export function isHashtag(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 &&
    value.length <= MAX_HASHTAG_LENGTH && tagPattern.test(value) &&
    normalizeHashtag(value) === value;
}

export function parseHashtags(value: string): { tags: string[]; error: string | null } {
  const tags = [...new Set(value.split(/[\s,]+/u).filter(Boolean).map(normalizeHashtag))];
  if (tags.some(tag => !isHashtag(tag))) {
    return { tags: [], error: "Usá hashtags de hasta 32 caracteres, con letras, números o guion bajo." };
  }
  if (tags.length > MAX_HASHTAGS) {
    return { tags: [], error: "Podés agregar hasta 5 hashtags por recuerdo." };
  }
  return { tags, error: null };
}

/** Extract standalone hashtags, preserving accents and ignoring URL fragments. */
export function extractHashtags(description: string): { tags: string[]; error: string | null } {
  const matches = description.normalize("NFKC").matchAll(/(?:^|[\s(¿¡.,;:!?])#([\p{L}\p{N}_]+)/gu);
  return parseHashtags(Array.from(matches, match => match[1]).join(" "));
}

export function memoryHashtags(memory: Memory): string[] {
  return [...new Set((memory.hashtags ?? extractHashtags(memory.description).tags).map(normalizeHashtag).filter(isHashtag))];
}

export interface WeeklyTrend {
  tag: string;
  count: number;
  authors: number;
}

/** Rolling seven days. Old records without a timestamp remain in threads, not rankings. */
export function weeklyTrends(memories: Memory[], now = Date.now()): WeeklyTrend[] {
  const since = now - 7 * 24 * 60 * 60 * 1000;
  const tags = new Map<string, { count: number; authors: Set<string> }>();
  const seen = new Set<string>();
  for (const memory of memories) {
    const published = Date.parse(memory.createdAt ?? "");
    if (seen.has(memory.id) || memory.repost || !Number.isFinite(published) || published < since || published > now) continue;
    seen.add(memory.id);
    for (const tag of memoryHashtags(memory)) {
      const entry = tags.get(tag) ?? { count: 0, authors: new Set<string>() };
      entry.count++;
      entry.authors.add(memory.author);
      tags.set(tag, entry);
    }
  }
  return [...tags].map(([tag, entry]) => ({ tag, count: entry.count, authors: entry.authors.size }))
    .sort((a, b) => b.count - a.count || b.authors - a.authors || a.tag.localeCompare(b.tag, "es"));
}

export interface HashtagContribution {
  id: string;
  tag: string;
  author: string;
  text: string;
  createdAt: string;
}

export const THREAD_STORAGE_KEY = "nostalgia.hashtag-threads.v1";

export function loadContributions(storage: Pick<Storage, "getItem">): HashtagContribution[] {
  const raw: unknown = JSON.parse(storage.getItem(THREAD_STORAGE_KEY) ?? "[]");
  if (!Array.isArray(raw)) throw new Error("Invalid thread storage");
  const ids = new Set<string>();
  return raw.filter((item): item is HashtagContribution => {
    if (!item || typeof item !== "object" || typeof item.id !== "string" || !item.id ||
      ids.has(item.id) || !isHashtag(item.tag) || item.author !== "Vos" ||
      typeof item.text !== "string" || !item.text.trim() || item.text.length > 1000 ||
      typeof item.createdAt !== "string" || !Number.isFinite(Date.parse(item.createdAt))) return false;
    ids.add(item.id);
    return true;
  });
}

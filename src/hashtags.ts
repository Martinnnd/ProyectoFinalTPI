import type { Memory } from "./types";

export const MAX_HASHTAGS = 5;
export const MAX_HASHTAG_LENGTH = 32;
const tagPattern = /^[\p{L}\p{N}_]+$/u;

export function normalizeHashtag(value: string): string {
  return value.trim().replace(/^#/, "").normalize("NFKC").toLocaleLowerCase("es");
}

export function isHashtag(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_HASHTAG_LENGTH &&
    tagPattern.test(value) &&
    normalizeHashtag(value) === value
  );
}

export function parseHashtags(value: string): { tags: string[]; error: string | null } {
  const tags = [
    ...new Set(
      value
        .split(/[\s,]+/u)
        .filter(Boolean)
        .map(normalizeHashtag),
    ),
  ];
  if (tags.some((tag) => !isHashtag(tag))) {
    return {
      tags: [],
      error: "Usá hashtags de hasta 32 caracteres, con letras, números o guion bajo.",
    };
  }
  if (tags.length > MAX_HASHTAGS) {
    return { tags: [], error: "Podés agregar hasta 5 hashtags por recuerdo." };
  }
  return { tags, error: null };
}

/** Extract standalone hashtags, preserving accents and ignoring URL fragments. */
export function extractHashtags(description: string): { tags: string[]; error: string | null } {
  const matches = description.normalize("NFKC").matchAll(/(?:^|[\s(¿¡.,;:!?])#([\p{L}\p{N}_]+)/gu);
  return parseHashtags(Array.from(matches, (match) => match[1]).join(" "));
}

export function memoryHashtags(memory: Memory): string[] {
  return [
    ...new Set(
      (memory.hashtags ?? extractHashtags(memory.description).tags)
        .map(normalizeHashtag)
        .filter(isHashtag),
    ),
  ];
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
    if (
      seen.has(memory.id) ||
      memory.repost ||
      !Number.isFinite(published) ||
      published < since ||
      published > now
    )
      continue;
    seen.add(memory.id);
    for (const tag of memoryHashtags(memory)) {
      const entry = tags.get(tag) ?? { count: 0, authors: new Set<string>() };
      entry.count++;
      entry.authors.add(memory.author);
      tags.set(tag, entry);
    }
  }
  return [...tags]
    .map(([tag, entry]) => ({ tag, count: entry.count, authors: entry.authors.size }))
    .sort((a, b) => b.count - a.count || b.authors - a.authors || a.tag.localeCompare(b.tag, "es"));
}

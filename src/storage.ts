import { categories, type Memory } from "./types";
export const STORAGE_KEY = "nostalgia.memories.v1";
export function isMemory(value: unknown): value is Memory {
  if (!value || typeof value !== "object") return false;
  const m = value as Record<string, unknown>;
  return (
    ["id", "title", "description", "place", "author"].every(
      (k) =>
        typeof m[k] === "string" &&
        (m[k] as string).trim().length > 0 &&
        (m[k] as string).length <= 3000,
    ) &&
    typeof m.year === "number" &&
    Number.isInteger(m.year) &&
    m.year >= 1970 &&
    m.year <= 2009 &&
    categories.includes(m.category as Memory["category"]) &&
    m.source === "local" &&
    typeof m.lat === "number" &&
    Number.isFinite(m.lat) &&
    Math.abs(m.lat) <= 90 &&
    typeof m.lng === "number" &&
    Number.isFinite(m.lng) &&
    Math.abs(m.lng) <= 180
  );
}
export function loadMemories(storage: Pick<Storage, "getItem">): {
  memories: Memory[];
  warning: string;
} {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null) return { memories: [], warning: "" };
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("invalid");
    const valid = parsed.filter(isMemory);
    const unique = valid.filter(
      (m, i) => valid.findIndex((other) => other.id === m.id) === i,
    );
    return {
      memories: unique,
      warning:
        unique.length !== parsed.length
          ? "Se omitieron recuerdos guardados con datos inválidos."
          : "",
    };
  } catch {
    return {
      memories: [],
      warning:
        "No pudimos recuperar los recuerdos de este navegador. Podés seguir explorando.",
    };
  }
}
export function saveMemories(
  memories: Memory[],
  storage: Pick<Storage, "setItem">,
): boolean {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(memories));
    return true;
  } catch {
    return false;
  }
}

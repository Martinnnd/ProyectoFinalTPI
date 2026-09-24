// Shared aggregation only. Edit stories inside each era/content.ts.
import { availableDecades, eraRegistry } from "./eras/registry";
import type { Decade, Memory } from "./types";
export const initialMemories: Memory[] = availableDecades.flatMap(
  (year) => eraRegistry[year].content.memories,
);
export const eraContent = Object.fromEntries(
  availableDecades.map((year) => [
    year,
    eraRegistry[year].content.introduction,
  ]),
) as Record<Decade, { label: string; description: string }>;

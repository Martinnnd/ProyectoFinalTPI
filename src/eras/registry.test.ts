import { expect, it } from "vitest";
import { availableDecades, eraRegistry } from "./registry";
it("integra las cuatro épocas sin colisiones de IDs", () => {
  expect(availableDecades).toEqual([1970, 1980, 1990, 2000]);
  const memories = availableDecades.flatMap(
    (year) => eraRegistry[year].content.memories,
  );
  expect(new Set(memories.map((m) => m.id)).size).toBe(memories.length);
  const facts = availableDecades.flatMap(
    (year) => eraRegistry[year].content.facts,
  );
  expect(new Set(facts.map((f) => f.id)).size).toBe(facts.length);
});

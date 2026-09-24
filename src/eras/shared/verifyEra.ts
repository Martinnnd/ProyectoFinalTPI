import { describe, expect, it } from "vitest";
import type { Decade } from "../../types";
import type { EraModule } from "../contracts";

// Each team's contract.test.ts runs independently of the registry and other eras.
export function verifyEra(decade: Decade, era: EraModule) {
  describe(`Contrato de ${decade}`, () => {
    it("ofrece componentes, textos y tokens completos", () => {
      expect(typeof era.Chrome).toBe("function");
      expect(typeof era.Player).toBe("function");
      for (const key of [
        "brand",
        "brandLabel",
        "shortLabel",
        "windowTitle",
        "storiesTitle",
        "factsTitle",
        "musicTitle",
      ] as const)
        expect(era.theme[key].trim()).not.toBe("");
      for (const token of [
        "--bg",
        "--surface",
        "--ink",
        "--accent",
        "--font-body",
        "--font-display",
      ])
        expect(era.theme.tokens[token as `--${string}`]).toBeTruthy();
      expect(Object.keys(era.icons).sort()).toEqual([
        "facts",
        "map",
        "music",
        "stories",
      ]);
    });
    it("mantiene los años y los identificadores de su contenido", () => {
      expect(era.content.music.length).toBeGreaterThan(0);
      const records = [
        ...era.content.memories,
        ...era.content.facts,
        ...era.content.music,
      ];
      for (const entry of records) {
        expect(entry.year).toBeGreaterThanOrEqual(decade);
        expect(entry.year).toBeLessThan(decade + 10);
      }
      const ids = [...era.content.memories, ...era.content.facts].map(
        (entry) => entry.id,
      );
      expect(new Set(ids).size).toBe(ids.length);
      for (const memory of era.content.memories)
        expect(memory.source).toBe("demo");
    });
  });
}

import { describe, expect, it } from "vitest";
import { filterMemories, type Memory } from "./types";
import { initialMemories } from "./data";
import { eraFacts, factsForPeriod, musicByDecade } from "./eraData";
import { isMemory, loadMemories, saveMemories } from "./storage";
const local: Memory = { ...initialMemories[0], id: "local-1", source: "local" };
describe("Exploración temporal", () => {
  it("ofrece siete escenas por década en lugares distintos", () => {
    for (const decade of [1970, 1980, 1990, 2000] as const) {
      const memories = filterMemories(
        initialMemories,
        { decade, year: null },
        "Todas",
      );
      expect(memories).toHaveLength(7);
      expect(new Set(memories.map((m) => m.place)).size).toBe(7);
      expect(memories.every((m) => m.source === "demo")).toBe(true);
    }
  });
  it("combina año y categoría, incluyendo estados vacíos", () => {
    expect(
      filterMemories(
        initialMemories,
        { decade: 1990, year: 1997 },
        "Personales",
      ),
    ).toHaveLength(1);
    expect(
      filterMemories(initialMemories, { decade: 1990, year: 1997 }, "Música"),
    ).toEqual([]);
    expect(
      filterMemories(initialMemories, { decade: 1980, year: null }, "Cine"),
    ).toHaveLength(1);
  });
});
describe("Contenido de época", () => {
  it("separa datos culturales verificados de los pines y respeta década y año", () => {
    expect(
      factsForPeriod({ decade: 1990, year: 1995 }).map((f) => f.id),
    ).toEqual(["toystory"]);
    expect(factsForPeriod({ decade: 1980, year: 1980 })).toEqual([]);
    for (const decade of [1970, 1980, 1990, 2000] as const) {
      expect(factsForPeriod({ decade, year: null })).toHaveLength(3);
      expect(
        musicByDecade[decade].every(
          (t) => t.year >= decade && t.year < decade + 10,
        ),
      ).toBe(true);
    }
    expect(
      eraFacts.every((f) => f.source.startsWith("https://") && !("lat" in f)),
    ).toBe(true);
  });
  it("ofrece enlaces reales de Spotify y relatos con lugares específicos", () => {
    expect(musicByDecade[1980][0].artist).toBe("Guns N' Roses");
    expect(musicByDecade[1990][0].artist).toBe("Michael Jackson");
    expect(musicByDecade[2000][0].artist).toBe("Linkin Park");
    for (const tracks of Object.values(musicByDecade)) {
      for (const track of tracks)
        expect(track.reference).toBe(
          `https://open.spotify.com/track/${track.spotifyId}`,
        );
    }
    expect(
      initialMemories.every(
        (m) => m.description.length > 300 && m.place.includes(","),
      ),
    ).toBe(true);
  });
});
describe("Persistencia resistente a errores", () => {
  it("recupera solo recuerdos locales válidos y elimina duplicados", () => {
    const result = loadMemories({
      getItem: () =>
        JSON.stringify([
          local,
          local,
          { ...local, year: 1969 },
          initialMemories[0],
          null,
        ]),
    });
    expect(result.memories).toEqual([local]);
    expect(result.warning).not.toBe("");
  });
  it("maneja JSON corrupto, estructuras incorrectas y acceso bloqueado", () => {
    for (const value of ["{bad", "{}", "null"])
      expect(loadMemories({ getItem: () => value }).memories).toEqual([]);
    expect(
      loadMemories({
        getItem: () => {
          throw new Error("Blocked");
        },
      }).warning,
    ).not.toBe("");
  });
  it("valida límites y coordenadas", () => {
    expect(isMemory(local)).toBe(true);
    for (const patch of [
      { lat: NaN },
      { lng: 181 },
      { title: " " },
      { year: 2009.5 },
      { category: "Otra" },
      { year: 2010 },
    ])
      expect(isMemory({ ...local, ...patch })).toBe(false);
  });
  it("guarda y vuelve a cargar sin perder datos", () => {
    let value: string | null = null;
    const storage = {
      setItem: (_key: string, text: string) => {
        value = text;
      },
      getItem: () => value,
    };
    expect(saveMemories([local], storage)).toBe(true);
    expect(loadMemories(storage).memories).toEqual([local]);
  });
  it("informa una cuota excedida sin lanzar una excepción", () => {
    expect(
      saveMemories([local], {
        setItem: () => {
          throw new Error("QuotaExceededError");
        },
      }),
    ).toBe(false);
  });
});

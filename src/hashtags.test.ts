import { describe, expect, it } from "vitest";
import {
  extractHashtags,
  loadContributions,
  memoryHashtags,
  parseHashtags,
  weeklyTrends,
} from "./hashtags";
import { isMemory, loadMemories, saveMemories } from "./storage";
import type { Memory } from "./types";

const now = Date.parse("2026-10-11T12:00:00Z");
const day = 86_400_000;
const memory: Memory = {
  id: "one",
  title: "Una cinta",
  year: 1993,
  category: "Música",
  description: "Compartíamos cassettes.",
  place: "San Justo",
  author: "Vos",
  lat: -34.6,
  lng: -58.5,
  source: "local",
  hashtags: ["cassettes"],
  createdAt: new Date(now).toISOString(),
};

describe("Hashtags", () => {
  it("extrae hashtags de la historia sin confundir fragmentos de enlaces y normaliza Unicode", () => {
    expect(
      extractHashtags(
        "Volvimos al #Barrio, con #MÚSICA. (#barrio) https://example.com/#ignorar texto#ignorar #rock_90",
      ),
    ).toEqual({ tags: ["barrio", "música", "rock_90"], error: null });
    expect(extractHashtags("Una historia sin etiquetas, # y C#.")).toEqual({
      tags: [],
      error: null,
    });
    expect(extractHashtags("#a #b #c #d #e #f").error).toBeTruthy();
    expect(extractHashtags(`#${"a".repeat(33)}`).error).toBeTruthy();
  });
  it("recupera etiquetas desde la descripción del servidor y permite quitarlas al editar", () => {
    expect(memoryHashtags({ ...memory, hashtags: undefined, description: "Mi #Barrio" })).toEqual([
      "barrio",
    ]);
    expect(memoryHashtags({ ...memory, hashtags: [], description: "Sin etiquetas" })).toEqual([]);
  });
  it("normaliza mayúsculas, Unicode y separadores, sin repetir etiquetas", () => {
    expect(parseHashtags(" #Cassettes, cassettes #MÚSICA #rock_90 ")).toEqual({
      tags: ["cassettes", "música", "rock_90"],
      error: null,
    });
    expect(parseHashtags("")).toEqual({ tags: [], error: null });
  });
  it("rechaza caracteres y cantidades inválidas sin truncar lo escrito", () => {
    for (const input of ["#", "#rock!", "#<script>", "x".repeat(33), "a b c d e f"]) {
      expect(parseHashtags(input).error).toBeTruthy();
    }
  });
  it("conserva compatibilidad con recuerdos antiguos y persiste etiquetas y fecha", () => {
    expect(isMemory({ ...memory, hashtags: undefined, createdAt: undefined })).toBe(true);
    expect(isMemory({ ...memory, hashtags: [42] })).toBe(false);
    expect(isMemory({ ...memory, createdAt: "invalid" })).toBe(false);
    let saved = "";
    expect(
      saveMemories([memory], {
        setItem: (_key, value) => {
          saved = value;
        },
      }),
    ).toBe(true);
    expect(loadMemories({ getItem: () => saved }).memories).toEqual([memory]);
    expect(memoryHashtags({ ...memory, hashtags: ["Cassettes", "cassettes"] })).toEqual([
      "cassettes",
    ]);
  });
});

describe("Trends semanales", () => {
  it("usa siete días de publicaciones, no el año histórico; excluye futuras y sin fecha", () => {
    const records = [
      memory,
      { ...memory, id: "boundary", createdAt: new Date(now - 7 * day).toISOString() },
      { ...memory, id: "old", createdAt: new Date(now - 7 * day - 1).toISOString() },
      { ...memory, id: "future", createdAt: new Date(now + 1).toISOString() },
      { ...memory, id: "legacy", createdAt: undefined },
    ];
    expect(weeklyTrends(records, now)).toEqual([{ tag: "cassettes", count: 2, authors: 1 }]);
    expect(weeklyTrends([memory], now + 8 * day)).toEqual([]);
  });
  it("cuenta publicaciones únicas, excluye reposts y ordena por actividad y autores", () => {
    const records: Memory[] = [
      memory,
      memory,
      { ...memory, id: "two", author: "Nico", hashtags: ["cassettes", "cassettes", "vinilos"] },
      { ...memory, id: "three", author: "Nico", hashtags: ["vinilos"] },
      { ...memory, id: "repost", repost: { author: "Nico" } },
    ];
    expect(weeklyTrends(records, now)).toEqual([
      { tag: "cassettes", count: 2, authors: 2 },
      { tag: "vinilos", count: 2, authors: 1 },
    ]);
  });
});

describe("Aportes al hilo", () => {
  it("valida el almacenamiento y descarta aportes inválidos o repetidos", () => {
    const entry = {
      id: "a",
      tag: "cassettes",
      author: "Vos",
      text: "Mi primer walkman",
      createdAt: memory.createdAt,
    };
    expect(
      loadContributions({
        getItem: () => JSON.stringify([entry, entry, { ...entry, id: "b", tag: "<bad>" }, null]),
      }),
    ).toEqual([entry]);
    expect(() => loadContributions({ getItem: () => "broken" })).toThrow();
    expect(loadContributions({ getItem: () => null })).toEqual([]);
  });
});

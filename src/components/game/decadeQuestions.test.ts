import { describe, expect, it } from "vitest";
import {
  createGameQuestions,
  decadeOptions,
  formatDecade,
  GAME_LENGTH,
  isWinningScore,
  type DecadeQuestion,
} from "./decadeQuestions";

describe("decade game", () => {
  const pool: DecadeQuestion[] = decadeOptions.map((decade) => ({
    id: `local:${decade}`,
    image: `/juego-decadas/${decade}/foto.jpg`,
    decade,
    source: "local",
  }));
  it("creates five unique questions without mutating the question bank", () => {
    const originalIds = pool.map((question) => question.id);
    const game = createGameQuestions(pool, () => 0.25);

    expect(game).toHaveLength(GAME_LENGTH);
    expect(new Set(game.map((question) => question.id)).size).toBe(GAME_LENGTH);
    expect(pool.map((question) => question.id)).toEqual(originalIds);
  });

  it("mezcla publicaciones y fotos locales conservando la publicación de origen", () => {
    const publication: DecadeQuestion = {
      id: "pub:17",
      image: "https://fotos.example/17.jpg",
      decade: 1980,
      source: "publication",
      publicationId: 17,
    };
    const game = createGameQuestions([...pool.slice(0, 4), publication], () => 0);
    expect(game.some((question) => question.source === "local")).toBe(true);
    expect(game).toContainEqual(publication);
  });

  it("no muestra dos veces la misma imagen y no inventa preguntas si faltan fotos", () => {
    const sameImage = { ...pool[0], id: "duplicada" };
    expect(createGameQuestions([pool[0], sameImage], () => 0)).toEqual([pool[0]]);
    expect(createGameQuestions([], () => 0)).toEqual([]);
  });

  it("requires four correct answers to win", () => {
    expect(isWinningScore(3)).toBe(false);
    expect(isWinningScore(4)).toBe(true);
    expect(isWinningScore(5)).toBe(true);
  });

  it("formats decade labels for both centuries", () => {
    expect(formatDecade(1970)).toBe("Decada 70");
    expect(formatDecade(2020)).toBe("Decada 2020");
  });
});

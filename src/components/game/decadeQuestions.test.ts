import { describe, expect, it } from "vitest";
import {
  createGameQuestions,
  decadeQuestions,
  formatDecade,
  GAME_LENGTH,
  isWinningScore,
} from "./decadeQuestions";

describe("decade game", () => {
  it("creates five unique questions without mutating the question bank", () => {
    const originalIds = decadeQuestions.map((question) => question.id);
    const game = createGameQuestions(() => 0.25);

    expect(game).toHaveLength(GAME_LENGTH);
    expect(new Set(game.map((question) => question.id)).size).toBe(GAME_LENGTH);
    expect(decadeQuestions.map((question) => question.id)).toEqual(originalIds);
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

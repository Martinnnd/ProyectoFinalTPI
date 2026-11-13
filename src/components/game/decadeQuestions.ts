import type { Decade } from "../../types";

export interface DecadeQuestion {
  id: string;
  image: string;
  decade: Decade;
}

export const decadeOptions: readonly Decade[] = [1970, 1980, 1990, 2000, 2010, 2020];

export const decadeQuestions: readonly DecadeQuestion[] = decadeOptions.map((decade) => ({
  id: String(decade),
  image: `/juego-decadas/${decade}.jpg`,
  decade,
}));

export const GAME_LENGTH = 5;
export const WINNING_SCORE = 4;

export function createGameQuestions(random: () => number = Math.random): DecadeQuestion[] {
  const shuffled = [...decadeQuestions];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled.slice(0, GAME_LENGTH);
}

export function isWinningScore(score: number): boolean {
  return score >= WINNING_SCORE;
}

export function formatDecade(decade: Decade): string {
  return decade < 2000 ? `Decada ${String(decade).slice(2)}` : `Decada ${decade}`;
}

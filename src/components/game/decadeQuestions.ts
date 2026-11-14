import type { Decade } from "../../types";

type BaseQuestion = {
  id: string;
  image: string;
  decade: Decade;
};

export type DecadeQuestion = BaseQuestion &
  ({ source: "local" } | { source: "publication"; publicationId: number });

export const decadeOptions: readonly Decade[] = [1970, 1980, 1990, 2000, 2010, 2020];

export const GAME_LENGTH = 5;
export const WINNING_SCORE = 4;

export function createGameQuestions(
  pool: readonly DecadeQuestion[],
  random: () => number = Math.random,
): DecadeQuestion[] {
  const images = new Set<string>();
  const shuffled = pool.filter((question) => {
    if (images.has(question.image)) return false;
    images.add(question.image);
    return true;
  });

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

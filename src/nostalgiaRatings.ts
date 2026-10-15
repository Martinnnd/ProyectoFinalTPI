export type NostalgiaRatings = Record<string, number>;

export function updateNostalgiaRating(ratings: NostalgiaRatings, postId: string, score: number): NostalgiaRatings {
  if (!Number.isInteger(score) || score < 1 || score > 5) return ratings;
  const next = { ...ratings };
  if (next[postId] === score) delete next[postId];
  else next[postId] = score;
  return next;
}

export function totalGivenNostalgia(ratings: NostalgiaRatings): number {
  return Object.values(ratings).reduce((sum, score) => sum + score, 0);
}


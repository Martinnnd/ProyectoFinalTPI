// Shared aggregation and filtering; content stays with its era team.
import { availableDecades, eraRegistry, mapEras } from "./eras/registry";
import type { Period } from "./types";
import type { MusicTrack, EraFact } from "./eras/contracts";
export type { MusicTrack, EraFact } from "./eras/contracts";
export const musicByDecade = mapEras<MusicTrack[]>((era) => era.content.music);
export const eraFacts: EraFact[] = availableDecades.flatMap(
  (year) => eraRegistry[year].content.facts,
);
export function factsForPeriod(period: Period) {
  return eraFacts.filter(
    (f) =>
      f.year >= period.decade &&
      f.year < period.decade + 10 &&
      (period.year === null || f.year === period.year),
  );
}

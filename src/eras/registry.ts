import type { Decade } from "../types";
import type { EraModule } from "./contracts";
import seventies from "./70s";
import nineties from "./90s";
import eighties from "./80s";
import thousands from "./2000s";

// Integration boundary: teams implement their own module, never each other's.
export const eraRegistry: Record<Decade, EraModule> = {
  1970: seventies,
  1980: eighties,
  1990: nineties,
  2000: thousands,

};
export const availableDecades = Object.keys(eraRegistry).map(
  Number,
) as Decade[];

export function mapEras<T>(select: (era: EraModule) => T): Record<Decade, T> {
  return Object.fromEntries(
    availableDecades.map((year) => [year, select(eraRegistry[year])]),
  ) as Record<Decade, T>;
}

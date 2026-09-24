// Shared adapter: theme definitions belong to src/eras/<era>/theme.ts.
import { availableDecades, eraRegistry } from "./eras/registry";
import type { Decade } from "./types";
import type { EraTheme } from "./eras/contracts";
export const eraThemes = Object.fromEntries(
  availableDecades.map((year) => [year, eraRegistry[year].theme]),
) as Record<Decade, EraTheme>;

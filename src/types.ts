export const categories = [
  "Lugares",
  "Música",
  "Cine",
  "Televisión",
  "Videojuegos",
  "Acontecimientos",
  "Personales",
] as const;
export type Category = (typeof categories)[number];
export type Decade = 1970 | 1980 | 1990 | 2000;
export interface Memory {
  id: string;
  title: string;
  year: number;
  category: Category;
  description: string;
  place: string;
  author: string;
  lat: number;
  lng: number;
  source: "demo" | "local";
  groupId?: string;
  image?: string;
  imageCaption?: string;
  media?: { kind: "image" | "video" | "youtube"; url: string };
  music?: { spotifyId: string; title: string; artist: string };
  reference?: string;
  repost?: {
    author: string;
    comment?: string;
  };
}
export interface Period {
  decade: Decade;
  year: number | null;
}
export type UserCategory = "Errante" | "Nostálgico" | "Aedo" | "Mnemosine";
/** Each tier is unlocked by a different kind of evidence, not only by a count. */
export type TierRule =
  | { kind: "memories"; min: number }
  | { kind: "points"; min: number }
  | { kind: "subscription" };
export interface TierProgress {
  memories: number;
  /** Highest nostalgia points reached by a single memory. */
  points: number;
  subscribed: boolean;
}
export interface UserTier {
  name: UserCategory;
  rule: TierRule;
  /** Plain-language rule shown in the tiers dialog. */
  requirement: string;
}
export type TierState = "current" | "reached" | "locked";
export interface DescribedTier extends UserTier {
  state: TierState;
}
export interface Achievement {
  id: string;
  name: string;
  description: string;
  image: string;
  unlocked: boolean;
}
export const symbols: Record<Category, string> = {
  Lugares: "⌂",
  Música: "♫",
  Cine: "▤",
  Televisión: "▣",
  Videojuegos: "✚",
  Acontecimientos: "★",
  Personales: "♡",
};
export function filterMemories(
  memories: Memory[],
  period: Period,
  category: Category | "Todas",
) {
  return memories.filter(
    (m) =>
      m.year >= period.decade &&
      m.year < period.decade + 10 &&
      (period.year === null || m.year === period.year) &&
      (category === "Todas" || m.category === category),
  );
}

export interface CommunityGroup { id: string; name: string; decade: Decade; description: string; }

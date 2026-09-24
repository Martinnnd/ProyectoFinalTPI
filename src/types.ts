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
  image?: string;
  reference?: string;
}
export interface Period {
  decade: Decade;
  year: number | null;
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

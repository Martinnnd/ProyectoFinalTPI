export type CluePlacement = { key: string; after: number };

export function chooseClueAfter(random: number): number {
  return Math.min(6, Math.max(3, 3 + Math.floor(random * 4)));
}

export function placeClue(
  previous: CluePlacement | null,
  key: string,
  desired: number,
  postCount: number,
): CluePlacement {
  // Conserva el lugar al agregar páginas o actualizar interacciones. Si el feed
  // estaba vacío, espera sus primeras publicaciones antes de fijar la posición.
  if (previous?.key === key && (previous.after > 0 || postCount === 0)) return previous;
  return { key, after: Math.min(desired, postCount) };
}

"use client";

import { useState } from "react";
import { useTreasure } from "./TreasureProvider";
import { placeClue, type CluePlacement } from "./cluePlacement";

export function useTreasureCluePosition(postCount: number, ready: boolean): number | null {
  const treasure = useTreasure();
  const key = treasure?.challenge ? `${treasure.usuarioId}:${treasure.challenge.id}` : null;
  const desired = treasure?.clueAfter ?? 3;
  const [placement, setPlacement] = useState<CluePlacement | null>(null);
  if (ready && key && (placement?.key !== key || (placement.after === 0 && postCount > 0))) {
    setPlacement(placeClue(placement, key, desired, postCount));
  }
  return ready && placement && placement.key === key ? Math.min(placement.after, postCount) : null;
}

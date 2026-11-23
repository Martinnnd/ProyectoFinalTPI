"use client";

import Link from "next/link";
import { CheckCircle2, Compass } from "lucide-react";
import { useEraState } from "../context/EraContext";
import { useTreasure } from "./TreasureProvider";
import styles from "./treasure.module.css";

export default function TreasureClue() {
  const treasure = useTreasure();
  const decade = useEraState((state) => state.period.decade);
  const challenge = treasure?.challenge;
  if (!challenge) return null;
  return (
    <aside className={styles.clue} data-decade={decade} aria-label="Pista del tesoro semanal">
      <span className={styles.eyebrow}>
        {challenge.halladoUtc ? (
          <CheckCircle2 size={14} aria-hidden="true" />
        ) : (
          <Compass size={14} aria-hidden="true" />
        )}
        {challenge.halladoUtc ? "Un secreto menos" : "Un rumor entre recuerdos"}
      </span>
      <p>
        {challenge.halladoUtc
          ? "Esta semana encontraste el tesoro. El domingo llega otro rumor."
          : challenge.pista}
      </p>
      {!challenge.halladoUtc && <Link href="/explorar">La pista sigue en el mapa →</Link>}
    </aside>
  );
}

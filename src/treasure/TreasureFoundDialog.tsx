"use client";

import { useEffect, useRef } from "react";
import { Trophy } from "lucide-react";
import type { TreasureFinding } from "./treasureApi";
import styles from "./treasure.module.css";

export default function TreasureFoundDialog({
  finding,
  onClose,
}: {
  finding: TreasureFinding;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      className={styles.found}
      aria-labelledby="treasure-found-title"
      onClose={onClose}
    >
      <Trophy className={styles.trophy} size={52} aria-hidden="true" />
      <p className={styles.eyebrow}>Reto semanal completado</p>
      <h2 id="treasure-found-title">¡Tesoro encontrado!</h2>
      <p>{finding.nombre}</p>
      <p className={styles.saved}>
        Tu hallazgo quedó guardado. El próximo domingo te espera otra pista.
      </p>
      <button type="button" autoFocus onClick={() => dialog.current?.close()}>
        Seguir explorando
      </button>
    </dialog>
  );
}

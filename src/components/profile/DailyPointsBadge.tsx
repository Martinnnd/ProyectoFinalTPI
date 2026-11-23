"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { ACHIEVEMENTS_CHANGED } from "../../achievementEvents";
import { createRankingStore } from "../../musicRanking/store";
import { formatRankingDate, nextRefresh } from "../../musicRanking/rules";

export default function DailyPointsBadge() {
  const [store] = useState(createRankingStore);
  const { round, loading, fresh, error } = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
  useEffect(() => {
    void store.refresh();
    const refresh = () => {
      if (document.visibilityState === "visible") void store.refresh();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener(ACHIEVEMENTS_CHANGED, refresh);
    return () => {
      store.cancelRead();
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener(ACHIEVEMENTS_CHANGED, refresh);
    };
  }, [store]);
  useEffect(() => {
    if (loading) return;
    const timer = window.setTimeout(
      () => void store.refresh(),
      round ? nextRefresh(round) : 15_000,
    );
    return () => window.clearTimeout(timer);
  }, [loading, round, store]);
  const saldo = fresh && !loading ? round?.saldo : null;
  const description = saldo
    ? `${saldo.puntosRestantes} de ${saldo.cupo} puntos diarios disponibles. Compartidos entre canciones y publicaciones. Se renuevan el ${formatRankingDate(saldo.reinicio)} (Buenos Aires).`
    : loading
      ? "Consultando puntos diarios disponibles…"
      : error || "El saldo diario no está disponible en este momento. Volvé a consultar.";
  return (
    <button
      type="button"
      className="profile-daily-points profile-note profile-header-button"
      title={description}
      aria-label={description}
      aria-busy={loading}
      disabled={loading}
      onClick={() => void store.refresh()}
    >
      <Image
        src="/nostalgiar-rail-logo.png"
        alt=""
        width={20}
        height={17}
        className="profile-points-isotype"
      />
      <span aria-live="polite">
        {saldo
          ? `${saldo.puntosRestantes}/${saldo.cupo} puntos`
          : loading
            ? "… puntos"
            : "Consultar puntos"}
      </span>
    </button>
  );
}

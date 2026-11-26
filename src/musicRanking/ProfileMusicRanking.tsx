"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { useStore } from "zustand";
import { Music2, Plus } from "lucide-react";
import { useAuth } from "../components/auth/AuthProvider";
import { useAccountCategory } from "../context/AccountCategoryContext";
import { ACHIEVEMENTS_CHANGED } from "../achievementEvents";
import { editSong, suggestSong, withdrawSong } from "./api";
import { createRankingStore } from "./store";
import { createRankingViewStore } from "./viewStore";
import {
  canEdit,
  canManage,
  isRoundActive,
  nextRefresh,
  rankingCountdown,
  validContribution,
} from "./rules";
import SongForm from "./SongForm";
import NostalgiaPointSelector from "../components/social/NostalgiaPointSelector";
import styles from "./profileRanking.module.css";

export default function ProfileMusicRanking({ decade }: { decade: number }) {
  const { session } = useAuth();
  return <SessionRanking key={session?.usuarioId ?? "guest"} selectedDecade={decade} />;
}

function SessionRanking({ selectedDecade }: { selectedDecade: number }) {
  const { session } = useAuth();
  const { hasPermission, loading: categoryLoading, error: categoryError } = useAccountCategory();
  const [store] = useState(createRankingStore);
  const [viewStore] = useState(createRankingViewStore);
  const { round, loading, fresh, busy, error, message, loginRequired } = useStore(store);
  const view = useStore(viewStore);
  const id = useId();
  const decade = round?.decadas.find((item) => item.decada === selectedDecade);
  const songs = [...(decade?.candidaturas ?? [])].sort((a, b) => b.puntos - a.puntos);
  const active = !!round && fresh && !loading && isRoundActive(round, view.now);
  const canVote = !!session && hasPermission("VotarCancion");
  const canSuggest = !!session && hasPermission("SugerirMusica");
  const suggestionRestriction = !session
    ? "Iniciá sesión para sugerir una canción."
    : categoryLoading
      ? "Estamos consultando los permisos de tu categoría."
      : categoryError ||
        (!canSuggest
          ? "Tu categoría no permite sugerir canciones. Las sugerencias están disponibles para Mnemosine."
          : "");

  useEffect(() => {
    viewStore.getState().resetActions();
  }, [selectedDecade, viewStore]);
  useEffect(() => {
    void store.refresh();
    const refresh = () => {
      if (document.visibilityState === "visible") void store.refresh();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener(ACHIEVEMENTS_CHANGED, refresh);
    const clock = window.setInterval(() => viewStore.getState().tick(), 30_000);
    return () => {
      store.cancelRead();
      window.clearInterval(clock);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener(ACHIEVEMENTS_CHANGED, refresh);
    };
  }, [store, viewStore]);
  useEffect(() => {
    if (loading || busy) return;
    const timer = window.setTimeout(
      () => {
        viewStore.getState().tick();
        void store.refresh();
      },
      round ? nextRefresh(round) : 15_000,
    );
    return () => window.clearTimeout(timer);
  }, [store, viewStore, round, loading, busy]);

  return (
    <section id="ranking-musical" className={styles.panel} aria-label="Ranking musical del perfil">
      <header className={styles.header}>
        <Music2 size={21} aria-hidden="true" />
        <h2>Ranking musical {selectedDecade}</h2>
        {round && (
          <span
            className={styles.countdown}
            title="Tiempo restante hasta el cierre de la ronda"
            aria-label={`Cierre de la ronda: ${rankingCountdown(round.cierre, view.now)}`}
          >
            {rankingCountdown(round.cierre, view.now)}
          </span>
        )}
      </header>
      {loading && <p role="status">Consultando ranking…</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && fresh && !round && (
        <p>No hay una ronda vigente. Volveremos a consultarla automáticamente.</p>
      )}
      {round && !isRoundActive(round, view.now) && (
        <p>La ronda finalizó. Estamos consultando la próxima.</p>
      )}
      {round && !songs.length && <p>Todavía no hay canciones de {selectedDecade} en esta ronda.</p>}
      {!!songs.length && (
        <ol className={styles.songs} aria-label={`Ranking de ${selectedDecade}`}>
          {songs.map((song, index) => {
            const position = index + 1;
            const positionHint =
              position <= 3
                ? "Se incorporan a la lista de reproducción al cerrar la ronda, si reciben votos."
                : position <= 6
                  ? "Clasifican a la siguiente ronda, si reciben votos."
                  : `Puesto ${position}`;
            return (
              <li
                key={song.id}
                className={styles.row}
                data-expanded={view.expandedSong === song.id}
              >
                <div className={styles.song}>
                  <span
                    className={styles.positionTooltip}
                    tabIndex={position <= 6 ? 0 : undefined}
                    aria-label={`Puesto ${position}. ${positionHint}`}
                  >
                    <span className={styles.position} data-winner={position <= 3}>
                      {position}
                    </span>
                    {position <= 6 && (
                      <span className={styles.tooltipText} role="tooltip">
                        {positionHint}
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    className={styles.songTitle}
                    aria-expanded={view.expandedSong === song.id}
                    aria-controls={`${id}-actions-${song.id}`}
                    onClick={() => view.toggleSong(song.id)}
                    title="Ver opciones para puntuar"
                  >
                    <strong>{song.titulo}</strong>
                    <small>{song.artista}</small>
                  </button>
                  <b className={styles.score}>
                    {song.puntos}
                    <small>puntos</small>
                  </b>
                </div>
                <div id={`${id}-actions-${song.id}`} className={styles.songActions}>
                  <div
                    className={`post-ratings ${styles.vote}`}
                    role="group"
                    aria-label={`Puntuar canción: ${song.titulo}`}
                    aria-busy={busy}
                  >
                    <NostalgiaPointSelector
                      title={song.titulo}
                      canRate={canVote && active && !busy}
                      maxPoints={round?.saldo?.puntosRestantes ?? 0}
                      onRate={async (points) => {
                        if (round && validContribution(points, round))
                          await store.vote(song.id, points);
                      }}
                    />
                  </div>
                  {round && canManage(song, session) && (
                    <div className={styles.management}>
                      <button
                        type="button"
                        className="secondary-button"
                        disabled={busy || !active || !canEdit(song, round, session)}
                        title={
                          song.puntos
                            ? "La edición se bloqueó con el primer voto."
                            : "Corregir título o artista"
                        }
                        onClick={() => view.setEditing(song)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="secondary-button"
                        disabled={busy || !active}
                        onClick={() => view.setWithdrawing(song)}
                      >
                        Retirar
                      </button>
                    </div>
                  )}
                </div>
                {view.editing?.id === song.id && round && (
                  <SongForm
                    initial={song}
                    label="Guardar corrección"
                    busy={busy || !active || !canEdit(song, round, session)}
                    onCancel={() => view.setEditing(null)}
                    onSave={async (input) => {
                      const ok = await store.mutate(
                        () => editSong(song.id, input),
                        "Candidatura corregida.",
                      );
                      if (ok) view.setEditing(null);
                      return ok;
                    }}
                  />
                )}
                {view.withdrawing?.id === song.id && (
                  <div
                    className={styles.confirm}
                    role="group"
                    aria-label={`Confirmar retiro de ${song.titulo}`}
                  >
                    <p>
                      ¿Retirar «{song.titulo}»? Los votos previos y los puntos gastados se
                      conservan.
                    </p>
                    <div className={styles.management}>
                      <button
                        className="secondary-button"
                        disabled={busy || !active}
                        onClick={async () => {
                          const ok = await store.mutate(
                            () => withdrawSong(song.id),
                            "Candidatura retirada. Los puntos gastados se conservan.",
                          );
                          if (ok) view.setWithdrawing(null);
                        }}
                      >
                        Confirmar retiro
                      </button>
                      <button
                        className="secondary-button"
                        disabled={busy}
                        onClick={() => view.setWithdrawing(null)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
      {!canVote && (
        <p className={styles.hint}>
          {session
            ? "Podés votar desde la categoría Nostálgico."
            : "Iniciá sesión para dar puntos."}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {loginRequired && <Link href="/auth/login?returnTo=/perfil">Iniciar sesión</Link>}
      <footer className={styles.footer}>
        <span
          className={styles.suggestionTooltip}
          tabIndex={suggestionRestriction ? 0 : undefined}
          aria-label={suggestionRestriction || undefined}
        >
          <button
            type="button"
            className="secondary-button"
            aria-expanded={view.suggesting && canSuggest}
            aria-describedby={suggestionRestriction ? `${id}-restriction` : undefined}
            disabled={!!suggestionRestriction || busy}
            onClick={() => {
              if (canSuggest) view.toggleSuggestion();
            }}
          >
            <Plus size={15} aria-hidden="true" /> Sugerir canción
          </button>
          {suggestionRestriction && (
            <span id={`${id}-restriction`} className={styles.tooltipText} role="tooltip">
              {suggestionRestriction}
            </span>
          )}
        </span>
      </footer>
      {view.suggesting && canSuggest && (
        <SongForm
          key={selectedDecade}
          defaultDecade={selectedDecade}
          busy={!active || busy}
          onCancel={view.toggleSuggestion}
          onSave={async (song) => {
            const ok = await store.mutate(
              () => suggestSong(song),
              "Tu canción ya participa en la ronda.",
            );
            if (ok) view.toggleSuggestion();
            return ok;
          }}
        />
      )}
    </section>
  );
}

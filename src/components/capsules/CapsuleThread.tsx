"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { MapPin, Minus, ArrowUpRight } from "lucide-react";
import { getCapsuleMemories, removeCapsuleMemory, type Capsule } from "../../capsulesApi";
import PostMedia, { PostMusic } from "../PostMedia";
import { useCursorPage } from "./useCursorPage";
import { memoryDate } from "./capsulePresentation";
import styles from "./capsules.module.css";

export default function CapsuleThread({
  capsule,
  onChanged,
}: {
  capsule: Capsule;
  onChanged: () => void;
}) {
  const load = useCallback(
    (cursor: string | null, signal: AbortSignal) => getCapsuleMemories(capsule.id, cursor, signal),
    [capsule.id],
  );
  const page = useCursorPage(load);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState("");
  return (
    <section aria-label="Hilo de recuerdos" className={styles.thread}>
      <p className={styles.hint}>De más antiguo a más reciente · Todas las épocas</p>
      {page.loading && !page.items.length && <p role="status">Abriendo los recuerdos…</p>}
      {page.error && (
        <p role="alert" className={styles.error}>
          {page.error} <button onClick={page.retry}>Reintentar</button>
        </p>
      )}
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {!page.loading && !page.error && !page.items.length && (
        <div className={styles.empty}>
          <h2>Una cápsula por llenar</h2>
          <p>
            {capsule.puedeAdministrar
              ? "Sumá tus recuerdos publicados para empezar esta historia."
              : "Todavía no hay recuerdos disponibles en esta cápsula."}
          </p>
        </div>
      )}
      {page.items.map((memory) => (
        <article key={memory.id} className={styles.threadEntry}>
          <time className={styles.date} dateTime={memory.date}>
            {memory.year}
            <span>{memory.date ? memoryDate(memory.date) : ""}</span>
          </time>
          <div className={styles.story}>
            <div className={styles.storyTop}>
              <Link href={`/perfil/${encodeURIComponent(memory.author)}`}>@{memory.author}</Link>
              <span>{memory.category}</span>
            </div>
            <h2>{memory.title}</h2>
            <p className={styles.place}>
              <MapPin size={14} />
              {memory.place}
            </p>
            <PostMedia memory={memory} showFallbackWhenEmpty={false} />
            <p className={styles.storyText}>{memory.description}</p>
            <PostMusic music={memory.music} />
            <footer className={styles.storyActions}>
              <Link
                href={`/recuerdo/${memory.id}?returnTo=${encodeURIComponent(`/capsulas/${capsule.id}`)}`}
              >
                Ver publicación <ArrowUpRight size={16} />
              </Link>
              {capsule.puedeAdministrar && (
                <button
                  disabled={removing !== null}
                  onClick={async () => {
                    setRemoving(memory.id);
                    setError("");
                    try {
                      await removeCapsuleMemory(capsule.id, Number(memory.id));
                      onChanged();
                    } catch (cause) {
                      setError(
                        cause instanceof Error ? cause.message : "No pudimos quitar el recuerdo.",
                      );
                    } finally {
                      setRemoving(null);
                    }
                  }}
                >
                  <Minus size={15} />
                  {removing === memory.id ? "Quitando…" : "Quitar de la cápsula"}
                </button>
              )}
            </footer>
          </div>
        </article>
      ))}
      {page.cursor && (
        <div className={styles.loadMore}>
          <button className={styles.secondary} onClick={page.more} disabled={page.loading}>
            {page.loading ? "Cargando…" : "Seguir recorriendo"}
          </button>
        </div>
      )}
    </section>
  );
}

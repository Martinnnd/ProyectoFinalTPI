"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { getCapsuleMap, type Capsule } from "../../capsulesApi";
import type { MapBounds } from "../../publicationsApi";
import type { Memory } from "../../types";
import { useCursorPage } from "./useCursorPage";
import styles from "./capsules.module.css";

const MemoryMap = dynamic(() => import("../MemoryMap"), {
  ssr: false,
  loading: () => <p role="status">Preparando el mapa…</p>,
});

export default function CapsuleMap({ capsule }: { capsule: Capsule }) {
  const router = useRouter();
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [selected, setSelected] = useState<Memory | null>(null);
  const load = useCallback(
    async (cursor: string | null, signal: AbortSignal) => {
      const page = await getCapsuleMap(capsule.id, cursor, signal);
      if (!signal.aborted) setBounds(page.limites);
      return page;
    },
    [capsule.id],
  );
  const page = useCursorPage(load);
  return (
    <section aria-label="Mapa de la cápsula" className={styles.atlas}>
      <p className={styles.hint}>Solo los lugares de esta cápsula · Todas las épocas</p>
      {page.loading && !page.items.length && <p role="status">Buscando sus lugares…</p>}
      {page.error && (
        <p role="alert" className={styles.error}>
          {page.error} <button onClick={page.retry}>Reintentar</button>
        </p>
      )}
      {!page.loading && !page.error && !page.items.length && (
        <div className={styles.empty}>
          <h2>Todavía no hay lugares para recorrer</h2>
          <p>Los recuerdos que se sumen a esta cápsula aparecerán acá.</p>
        </div>
      )}
      {!!page.items.length && (
        <>
          <div className={styles.mapFrame}>
            <MemoryMap
              fitMemories
              fitBounds={bounds ?? undefined}
              showRelations={false}
              showEmptyState={false}
              memories={page.items}
              selected={selected}
              onSelect={setSelected}
              onClosePreview={() => setSelected(null)}
              onOpen={(memory) =>
                router.push(
                  `/recuerdo/${memory.id}?returnTo=${encodeURIComponent(`/capsulas/${capsule.id}`)}`,
                )
              }
              picking={false}
              onPick={() => {}}
              draft={null}
              onCancel={() => {}}
            />
          </div>
          <p className={styles.hint}>
            {page.items.length}{" "}
            {page.cursor
              ? "lugares cargados. El encuadre incluye toda la cápsula."
              : "lugares para volver a visitar."}
          </p>
          <div className={styles.mapPlaces}>
            {page.items.map((memory) => (
              <button
                key={memory.id}
                aria-pressed={selected?.id === memory.id}
                onClick={() => setSelected(memory)}
              >
                <strong>{memory.year}</strong>
                <span>{memory.title}</span>
              </button>
            ))}
          </div>
        </>
      )}
      {page.cursor && (
        <div className={styles.loadMore}>
          <button className={styles.secondary} disabled={page.loading} onClick={page.more}>
            {page.loading ? "Cargando…" : "Cargar más lugares"}
          </button>
        </div>
      )}
    </section>
  );
}

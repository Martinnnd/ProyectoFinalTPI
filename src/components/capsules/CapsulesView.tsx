"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Archive, Plus, ArrowLeft } from "lucide-react";
import { listCapsules, positiveId } from "../../capsulesApi";
import { useAuth } from "../auth/AuthProvider";
import { useEraState } from "../../context/EraContext";
import { useCursorPage } from "./useCursorPage";
import CapsuleCard from "./CapsuleCard";
import CapsuleEditor from "./CapsuleEditor";
import styles from "./capsules.module.css";

export default function CapsulesView() {
  const { session, status } = useAuth();
  const params = useSearchParams();
  const requested = params.get("propietarioId");
  let ownerId: number | undefined;
  try {
    ownerId = requested === null ? undefined : positiveId(requested);
  } catch {
    return (
      <div className={styles.viewport}>
        <p role="alert">El perfil indicado no es válido.</p>
        <Link href="/capsulas">Volver a mis cápsulas</Link>
      </div>
    );
  }
  if (status === "loading")
    return (
      <div className={styles.viewport} role="status">
        Preparando tus cápsulas…
      </div>
    );
  if (ownerId === undefined && !session)
    return (
      <div className={styles.viewport}>
        <div className={styles.empty}>
          <Archive size={40} />
          <h1>Tus historias, en un mismo lugar</h1>
          <p>Iniciá sesión para crear y recorrer tus cápsulas.</p>
          <Link className={styles.primary} href="/auth/login?returnTo=/capsulas">
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  const own = ownerId === undefined || ownerId === session?.usuarioId;
  return (
    <CapsulesList
      key={`${session?.usuarioId ?? "guest"}:${ownerId ?? "mias"}`}
      ownerId={own ? undefined : ownerId}
    />
  );
}

function CapsulesList({ ownerId }: { ownerId?: number }) {
  const router = useRouter();
  const decade = useEraState((state) => state.period.decade);
  const load = useCallback(
    (cursor: string | null, signal: AbortSignal) => listCapsules(cursor, signal, ownerId),
    [ownerId],
  );
  const page = useCursorPage(load);
  const [creating, setCreating] = useState(false);
  const own = ownerId === undefined;
  const author = page.items[0]?.propietarioUsername;

  return (
    <main className={styles.viewport}>
      <div className={styles.library}>
        <Link
          href={own ? "/perfil" : author ? `/perfil/${encodeURIComponent(author)}` : "/explorar"}
          className={styles.back}
        >
          <ArrowLeft size={16} />
          {own ? "Mi perfil" : "Volver al perfil"}
        </Link>
        <header className={styles.libraryHeader}>
          <div>
            <span className={styles.eyebrow}>HISTORIAS QUE VAN JUNTAS</span>
            <h1>
              {own ? "Mis cápsulas" : author ? `Las cápsulas de ${author}` : "Cápsulas públicas"}
            </h1>
            <p>
              {own
                ? "Guardá ese viaje, esas personas, esos años. Volvé cuando quieras."
                : "Una forma de recorrer sus recuerdos, más allá de una sola época."}
            </p>
          </div>
          {own && (
            <button className={styles.primary} onClick={() => setCreating(true)}>
              <Plus size={18} />
              Nueva cápsula
            </button>
          )}
        </header>
        <div className={styles.shelfHeading}>
          <span>{decade}s · Tu archivo de recuerdos</span>
          <span>Todas las épocas adentro</span>
        </div>
        {page.loading && !page.items.length && <p role="status">Abriendo el archivo…</p>}
        {page.error && (
          <p role="alert" className={styles.error}>
            {page.error} <button onClick={page.retry}>Reintentar</button>
          </p>
        )}
        {!page.loading && !page.error && !page.items.length && (
          <section className={styles.empty}>
            <Archive size={42} />
            <h2>{own ? "Toda historia merece su cápsula" : "Todavía no hay cápsulas públicas"}</h2>
            <p>
              {own
                ? "Reuní tus recuerdos bajo un nombre. Pueden ser de cualquier año y de cualquier lugar del mundo."
                : "Las cápsulas que esta persona haga públicas aparecerán acá."}
            </p>
            {own && (
              <button className={styles.primary} onClick={() => setCreating(true)}>
                Crear mi primera cápsula
              </button>
            )}
          </section>
        )}
        <div className={styles.grid}>
          {page.items.map((capsule) => (
            <CapsuleCard key={capsule.id} capsule={capsule} decade={decade} />
          ))}
        </div>
        {page.cursor && (
          <div className={styles.loadMore}>
            <button className={styles.secondary} onClick={page.more} disabled={page.loading}>
              {page.loading ? "Cargando…" : "Ver más cápsulas"}
            </button>
          </div>
        )}
      </div>
      {creating && (
        <CapsuleEditor
          onClose={() => setCreating(false)}
          onSaved={(capsule) => {
            setCreating(false);
            router.push(`/capsulas/${capsule.id}`);
          }}
        />
      )}
    </main>
  );
}

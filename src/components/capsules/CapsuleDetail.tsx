"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArrowLeft,
  BookOpen,
  Globe2,
  LockKeyhole,
  Map,
  Pencil,
  Plus,
  Share2,
  Trash2,
} from "lucide-react";
import { getCapsule, deleteCapsule, type Capsule } from "../../capsulesApi";
import { useAuth } from "../auth/AuthProvider";
import CapsuleEditor, { AddCapsuleMemoriesDialog } from "./CapsuleEditor";
import CapsuleDialog from "./CapsuleDialog";
import CapsuleThread from "./CapsuleThread";
import CapsuleMap from "./CapsuleMap";
import CapsuleCover from "./CapsuleCover";
import { capsulePeriod } from "./capsulePresentation";
import styles from "./capsules.module.css";

export default function CapsuleDetail({ id }: { id: number }) {
  const { session, status } = useAuth();
  const [revision, setRevision] = useState(0);
  if (status === "loading")
    return (
      <div className={styles.viewport} role="status">
        Abriendo la cápsula…
      </div>
    );
  return (
    <CapsuleContent
      key={`${session?.usuarioId ?? "guest"}:${id}:${revision}`}
      id={id}
      onChanged={() => setRevision((value) => value + 1)}
    />
  );
}

function CapsuleContent({ id, onChanged }: { id: number; onChanged: () => void }) {
  const router = useRouter();
  const [capsule, setCapsule] = useState<Capsule | null>(null);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState<"edit" | "add" | "delete" | null>(null);
  const [view, setView] = useState<"thread" | "map">("thread");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    getCapsule(id, controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setCapsule(value);
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setError(cause instanceof Error ? cause.message : "No pudimos abrir esta cápsula.");
      });
    return () => controller.abort();
  }, [id]);
  const refresh = () => {
    setDialog(null);
    onChanged();
  };
  if (!capsule)
    return (
      <main className={`${styles.viewport} ${styles.neutral}`}>
        <div className={styles.detail}>
          <Link href="/capsulas" className={styles.back}>
            <ArrowLeft size={16} />
            Volver a cápsulas
          </Link>
          {error ? (
            <section className={styles.empty}>
              <Archive size={40} />
              <h1>No pudimos abrir esta cápsula</h1>
              <p role="alert">{error}</p>
              <p>Puede ser privada o ya no estar disponible.</p>
              <button className={styles.secondary} onClick={onChanged}>
                Volver a intentar
              </button>
            </section>
          ) : (
            <p role="status">Abriendo la cápsula…</p>
          )}
        </div>
      </main>
    );

  return (
    <main className={`${styles.viewport} ${styles.neutral}`}>
      <div className={styles.detail}>
        <Link
          href={
            capsule.puedeAdministrar
              ? "/capsulas"
              : `/capsulas?propietarioId=${capsule.propietarioId}`
          }
          className={styles.back}
        >
          <ArrowLeft size={16} />
          {capsule.puedeAdministrar ? "Mis cápsulas" : "Más cápsulas de su autor"}
        </Link>
        <header className={styles.coverHeader}>
          <CapsuleCover
            capsule={capsule}
            className={styles.heroPhoto}
            fallback={
              <div className={styles.heroPlaceholder}>
                <Archive size={65} strokeWidth={1} />
              </div>
            }
          />
          <div className={styles.coverText}>
            <span className={styles.eyebrow}>UNA CÁPSULA DE NOSTALGIAR</span>
            <h1>{capsule.nombre}</h1>
            <p>{capsule.descripcion || "Una historia hecha de recuerdos."}</p>
            <div className={styles.detailsMeta}>
              <span>{capsulePeriod(capsule)}</span>
              <span>{capsule.cantidadRecuerdos} recuerdos</span>
              <span>
                {capsule.visibilidad === 0 ? <LockKeyhole size={14} /> : <Globe2 size={14} />}
                {capsule.visibilidad === 0 ? "Privada" : "Pública"}
              </span>
            </div>
            <Link href={`/perfil/${encodeURIComponent(capsule.propietarioUsername)}`}>
              Por @{capsule.propietarioUsername}
            </Link>
          </div>
        </header>
        {capsule.visibilidad === 0 && (
          <p className={styles.privacy}>
            <LockKeyhole size={16} />
            Solo vos podés ver esta cápsula. Sus recuerdos mantienen su visibilidad original.
          </p>
        )}
        <div className={styles.toolbar}>
          <div className={styles.viewToggle} role="group" aria-label="Vista de la cápsula">
            <button aria-pressed={view === "thread"} onClick={() => setView("thread")}>
              <BookOpen size={16} />
              Recorrido
            </button>
            <button aria-pressed={view === "map"} onClick={() => setView("map")}>
              <Map size={16} />
              Ver en el mapa
            </button>
          </div>
          <div className={styles.ownerActions}>
            {capsule.puedeAdministrar && (
              <>
                <button className={styles.primary} onClick={() => setDialog("add")}>
                  <Plus size={16} />
                  Sumar recuerdos
                </button>
                <button className={styles.secondary} onClick={() => setDialog("edit")}>
                  <Pencil size={15} />
                  Editar
                </button>
                <button
                  className={styles.iconButton}
                  onClick={() => {
                    setDeleteError("");
                    setDialog("delete");
                  }}
                  aria-label="Eliminar cápsula"
                >
                  <Trash2 size={18} />
                </button>
              </>
            )}
            {capsule.visibilidad === 1 && (
              <button
                className={styles.secondary}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      `${window.location.origin}/capsulas/${capsule.id}`,
                    );
                    setShareMessage("Enlace copiado");
                  } catch {
                    setShareMessage(
                      "No pudimos copiarlo. Podés compartir la dirección de esta página.",
                    );
                  }
                }}
              >
                <Share2 size={15} />
                Compartir
              </button>
            )}
          </div>
        </div>
        {shareMessage && (
          <p role="status" className={styles.hint}>
            {shareMessage}
          </p>
        )}
        {view === "thread" ? (
          <CapsuleThread capsule={capsule} onChanged={refresh} />
        ) : (
          <CapsuleMap capsule={capsule} />
        )}
      </div>
      {dialog === "edit" && (
        <CapsuleEditor capsule={capsule} onClose={() => setDialog(null)} onSaved={refresh} />
      )}
      {dialog === "add" && (
        <AddCapsuleMemoriesDialog
          capsule={capsule}
          onClose={() => setDialog(null)}
          onSaved={refresh}
        />
      )}
      {dialog === "delete" && (
        <CapsuleDialog
          title="¿Eliminar esta cápsula?"
          busy={deleting}
          onClose={() => setDialog(null)}
        >
          <div className={styles.form}>
            <p>
              Se eliminará <strong>{capsule.nombre}</strong>. Los recuerdos seguirán publicados y
              conservarán sus otras cápsulas.
            </p>
            {deleteError && (
              <p role="alert" className={styles.error}>
                {deleteError}
              </p>
            )}
            <footer className={styles.dialogActions}>
              <button
                className={styles.secondary}
                disabled={deleting}
                onClick={() => setDialog(null)}
              >
                Conservar cápsula
              </button>
              <button
                className={styles.danger}
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true);
                  try {
                    await deleteCapsule(capsule.id);
                    router.replace("/capsulas");
                  } catch (cause) {
                    setDeleteError(
                      cause instanceof Error ? cause.message : "No pudimos eliminarla.",
                    );
                    setDeleting(false);
                  }
                }}
              >
                {deleting ? "Eliminando…" : "Eliminar cápsula"}
              </button>
            </footer>
          </div>
        </CapsuleDialog>
      )}
    </main>
  );
}

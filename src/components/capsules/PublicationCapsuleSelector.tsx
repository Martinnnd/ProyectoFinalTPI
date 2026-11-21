"use client";

import { useCallback } from "react";
import Link from "next/link";
import { LockKeyhole, Globe2 } from "lucide-react";
import { listCapsules } from "../../capsulesApi";
import { useCursorPage } from "./useCursorPage";
import styles from "./capsules.module.css";

export default function PublicationCapsuleSelector({
  value,
  onChange,
  disabled,
}: {
  value: number[];
  onChange: (ids: number[]) => void;
  disabled: boolean;
}) {
  const load = useCallback(
    (cursor: string | null, signal: AbortSignal) => listCapsules(cursor, signal),
    [],
  );
  const page = useCursorPage(load);
  return (
    <details className={styles.publicationChoice}>
      <summary>
        Guardar también en mis cápsulas {value.length ? `(${value.length})` : "· opcional"}
      </summary>
      <p>Tu recuerdo se publicará normalmente y quedará dentro de las cápsulas que elijas.</p>
      {page.items.map((capsule) => (
        <label key={capsule.id}>
          <input
            type="checkbox"
            value={capsule.id}
            checked={value.includes(capsule.id)}
            disabled={disabled || (value.length >= 100 && !value.includes(capsule.id))}
            onChange={(event) =>
              onChange(
                event.target.checked
                  ? [...value, capsule.id]
                  : value.filter((id) => id !== capsule.id),
              )
            }
          />
          {capsule.visibilidad === 0 ? (
            <LockKeyhole size={13} aria-label="Privada" />
          ) : (
            <Globe2 size={13} aria-label="Pública" />
          )}
          {capsule.nombre}
        </label>
      ))}
      {page.loading && <p role="status">Buscando tus cápsulas…</p>}
      {page.error && (
        <p role="alert">
          {page.error}{" "}
          <button type="button" disabled={disabled} onClick={page.retry}>
            Reintentar
          </button>
        </p>
      )}
      {!page.loading && !page.error && !page.items.length && (
        <p>
          Todavía no tenés cápsulas. Podés publicar este recuerdo y agruparlo después desde{" "}
          <Link href="/capsulas" target="_blank" rel="noopener noreferrer">
            Mis cápsulas (otra pestaña)
          </Link>
          .
        </p>
      )}
      {page.cursor && (
        <button
          type="button"
          className={styles.secondary}
          disabled={disabled || page.loading}
          onClick={page.more}
        >
          Ver más cápsulas
        </button>
      )}
      <small>Una cápsula privada no oculta la publicación original.</small>
    </details>
  );
}

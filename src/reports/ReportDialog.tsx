"use client";

import { Flag, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useNotice } from "../context/NoticeProvider";
import { useAuth } from "../components/auth/AuthProvider";
import { createReport, ReportRequestError } from "./reportApi";
import {
  reportReasons,
  reportTargetLabels,
  type ReportReason,
  type ReportTarget,
} from "./reportTypes";
import styles from "./reportDialog.module.css";

export default function ReportButton({
  targetType,
  targetId,
  targetLabel,
  compact = false,
  className = "",
}: {
  targetType: ReportTarget;
  targetId: number;
  targetLabel?: string;
  compact?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>(0);
  const [detail, setDetail] = useState("");
  const [sending, setSending] = useState(false);
  const titleId = useId();
  const { session } = useAuth();
  const showToast = useNotice((state) => state.showToast);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    try {
      await createReport({
        tipoContenido: targetType,
        contenidoId: targetId,
        motivo: reason,
        detalle: detail,
      });
      setOpen(false);
      setDetail("");
      showToast("Recibimos tu reporte y será revisado.", "success");
    } catch (error) {
      const duplicate = error instanceof ReportRequestError && error.status === 409;
      showToast(
        duplicate
          ? "Ya reportaste este contenido."
          : error instanceof Error
            ? error.message
            : "No se pudo enviar el reporte.",
        duplicate ? "warning" : "error",
      );
    } finally {
      setSending(false);
    }
  }

  if (!session) return null;

  return (
    <>
      <button
        type="button"
        className={`${styles.trigger} ${compact ? styles.compact : ""} ${className}`.trim()}
        onClick={(event) => {
          event.currentTarget.closest("details")?.removeAttribute("open");
          setOpen(true);
        }}
        aria-label={`Reportar ${targetLabel ?? reportTargetLabels[targetType].toLowerCase()}`}
        title="Reportar"
      >
        <Flag size={compact ? 13 : 15} aria-hidden="true" />
        <span>{compact ? "Reportar" : `Reportar ${targetLabel ?? ""}`.trim()}</span>
      </button>
      {open &&
        createPortal(
          <div
            className={styles.backdrop}
            role="presentation"
            onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}
          >
            <form
              className={styles.dialog}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              onSubmit={submit}
            >
              <header>
                <span>
                  <Flag aria-hidden="true" />
                </span>
                <div>
                  <small>Moderación</small>
                  <h2 id={titleId}>
                    Reportar {targetLabel ?? reportTargetLabels[targetType].toLowerCase()}
                  </h2>
                </div>
                <button type="button" aria-label="Cerrar" onClick={() => setOpen(false)}>
                  <X />
                </button>
              </header>
              <p>El contenido seguirá visible hasta que un administrador revise el reporte.</p>
              <label>
                Motivo
                <select
                  value={reason}
                  onChange={(event) => setReason(Number(event.target.value) as ReportReason)}
                >
                  {reportReasons.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Detalle opcional
                <textarea
                  maxLength={500}
                  rows={4}
                  value={detail}
                  onChange={(event) => setDetail(event.target.value)}
                  placeholder="Contanos brevemente qué sucede…"
                />
                <small>{detail.length}/500</small>
              </label>
              <footer>
                <button type="button" className={styles.cancel} onClick={() => setOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.submit} disabled={sending}>
                  {sending ? "Enviando…" : "Enviar reporte"}
                </button>
              </footer>
            </form>
          </div>,
          document.body,
        )}
    </>
  );
}

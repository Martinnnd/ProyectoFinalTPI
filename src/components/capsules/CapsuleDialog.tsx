"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import styles from "./capsules.module.css";

export default function CapsuleDialog({
  title,
  busy = false,
  children,
  onClose,
}: {
  title: string;
  busy?: boolean;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!busy) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <header className={styles.dialogHeader}>
        <h2 id={titleId}>{title}</h2>
        <button
          type="button"
          className={styles.iconButton}
          disabled={busy}
          onClick={onClose}
          aria-label="Cerrar ventana"
        >
          <X size={20} />
        </button>
      </header>
      {children}
    </dialog>
  );
}

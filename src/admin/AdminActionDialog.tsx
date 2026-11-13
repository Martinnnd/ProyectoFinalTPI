"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import styles from "./admin.module.css";

type DialogField = {
  label: string;
  defaultValue?: string;
  placeholder?: string;
  type?: "text" | "number";
  min?: number;
  max?: number;
};

type AdminActionDialogProps = {
  title: string;
  description: string;
  confirmLabel: string;
  field?: DialogField;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: (value: string) => Promise<void> | void;
};

export default function AdminActionDialog(props: AdminActionDialogProps) {
  const { title, description, confirmLabel, field, danger, onCancel, onConfirm } = props;
  const [value, setValue] = useState(field?.defaultValue ?? "");
  const [working, setWorking] = useState(false);
  const input = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    input.current?.focus();
    const close = (event: KeyboardEvent) => event.key === "Escape" && !working && onCancel();
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onCancel, working]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setWorking(true);
    try {
      await onConfirm(value.trim());
    } finally {
      setWorking(false);
    }
  }

  return (
    <div
      className={styles.modalBackdrop}
      role="presentation"
      onMouseDown={() => !working && onCancel()}
    >
      <form
        className={styles.actionDialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="action-title"
        aria-describedby="action-description"
        onSubmit={submit}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <span className={danger ? styles.actionIconDanger : styles.actionIcon}>
            <AlertTriangle aria-hidden="true" />
          </span>
          <button type="button" aria-label="Cerrar" disabled={working} onClick={onCancel}>
            <X aria-hidden="true" />
          </button>
        </header>
        <h2 id="action-title">{title}</h2>
        <p id="action-description">{description}</p>
        {field && (
          <label>
            {field.label}
            {field.type === "number" ? (
              <input
                ref={input as React.RefObject<HTMLInputElement>}
                required
                type="number"
                min={field.min}
                max={field.max}
                value={value}
                placeholder={field.placeholder}
                onChange={(event) => setValue(event.target.value)}
              />
            ) : (
              <textarea
                ref={input as React.RefObject<HTMLTextAreaElement>}
                required
                rows={3}
                value={value}
                placeholder={field.placeholder}
                onChange={(event) => setValue(event.target.value)}
              />
            )}
          </label>
        )}
        <footer>
          <button
            type="button"
            className={styles.secondaryButton}
            disabled={working}
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            className={danger ? styles.dangerButton : styles.primaryButton}
            disabled={working}
          >
            {working ? "Procesando…" : confirmLabel}
          </button>
        </footer>
      </form>
    </div>
  );
}

export function AdminToast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 3200);
    return () => window.clearTimeout(timer);
  }, [message, onClose]);

  return (
    <div className={styles.toast} role="status">
      <CheckCircle2 aria-hidden="true" />
      <span>{message}</span>
      <button type="button" aria-label="Cerrar notificación" onClick={onClose}>
        <X />
      </button>
    </div>
  );
}

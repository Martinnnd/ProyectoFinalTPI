"use client";

import { useEffect } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import { useNotice } from "../../context/NoticeProvider";
import type { Toast } from "../../context/noticeStore";
import styles from "./toastViewport.module.css";

const savedMemoryMessage = "¡Recuerdo guardado! Ya tiene su lugar en el mapa.";

function ToastItem({ toast, dismiss }: { toast: Toast; dismiss: (id: number) => void }) {
  useEffect(() => {
    if (toast.duration <= 0) return;
    const timer = window.setTimeout(() => dismiss(toast.id), toast.duration);
    return () => window.clearTimeout(timer);
  }, [toast.id, toast.duration, dismiss]);

  const Icon =
    toast.type === "error"
      ? CircleAlert
      : toast.type === "warning"
        ? TriangleAlert
        : toast.type === "success"
          ? CircleCheck
          : Info;

  return (
    <div
      className={`${styles.toast} ${styles[toast.type]} ${toast.message === savedMemoryMessage ? styles.savedMemory : ""}`}
      role={toast.type === "error" || toast.type === "warning" ? "alert" : "status"}
      aria-atomic="true"
    >
      <Icon size={20} aria-hidden="true" />
      <span>{toast.message}</span>
      <button type="button" aria-label="Cerrar aviso" onClick={() => dismiss(toast.id)}>
        <X size={18} aria-hidden="true" />
      </button>
    </div>
  );
}

export default function ToastViewport() {
  const toasts = useNotice((state) => state.toasts);
  const dismiss = useNotice((state) => state.dismissToast);
  if (!toasts.length) return null;

  return (
    <div className={styles.viewport} aria-label="Avisos de Nostalgiar">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} dismiss={dismiss} />
      ))}
    </div>
  );
}

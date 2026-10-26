import { forwardRef, type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import type { Memory } from "../../types";

const PostDetailFrame = forwardRef<
  HTMLDivElement,
  {
    decade: number;
    backLabel?: string;
    memory: Memory | null;
    maximized: boolean;
    onClose: () => void;
    onToggleMaximize: () => void;
    children: ReactNode;
  }
>(function PostDetailFrame(
  {
    decade,
    backLabel = "Volver al feed",
    memory,
    maximized,
    onClose,
    onToggleMaximize,
    children,
  },
  ref,
) {
  const detail = !!memory && (decade === 1990 || decade === 2000);

  return (
    <div
      className={`social-stream${
        detail
          ? ` detail-mode transition-${decade === 1990 ? "win95" : "messenger"}`
          : ""
      }`}
      ref={ref}
    >
      <div className={detail ? "transition-window detail-window" : undefined}>
        {detail && memory && (
          <>
            <div className="transition-title">
              <button
                type="button"
                className="transition-caption detail-back"
                onClick={onClose}
              >
                <ArrowLeft size={17} aria-hidden="true" />
                {backLabel}
              </button>
              <div className="transition-window-controls">
                <button aria-label="Minimizar publicación" onClick={onClose}>
                  _
                </button>
                <button
                  aria-label={maximized ? "Restaurar ventana" : "Maximizar ventana"}
                  onClick={onToggleMaximize}
                >
                  □
                </button>
                <button aria-label="Cerrar publicación" onClick={onClose}>
                  ×
                </button>
              </div>
            </div>
          </>
        )}
        <div className={detail ? "transition-content" : undefined}>
          {children}
        </div>
        {detail && (
          <div className="transition-status">
            {decade === 1990
              ? "Listo · Mi PC · Archivo de recuerdos"
              : "Nostalgiar Messenger · Conversación sobre este recuerdo"}
          </div>
        )}
      </div>
    </div>
  );
});

export default PostDetailFrame;

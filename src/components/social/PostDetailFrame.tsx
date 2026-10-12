import { forwardRef, type ReactNode } from "react";
import type { Memory } from "../../types";

const PostDetailFrame = forwardRef<
  HTMLDivElement,
  {
    decade: number;
    memory: Memory | null;
    maximized: boolean;
    onClose: () => void;
    onToggleMaximize: () => void;
    children: ReactNode;
  }
>(function PostDetailFrame(
  {
    decade,
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
              <span className="transition-app-icon">
                {decade === 1990 ? "▣" : "♟"}
              </span>
              <strong className="transition-caption">
                {decade === 1990
                  ? "Recuerdo — Nostalgiar 95"
                  : "Nostalgiar Messenger"}
              </strong>
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
            <div className="transition-menu">
              Archivo · Recuerdos · Conversación
            </div>
            {decade === 2000 && (
              <>
                <div className="transition-contact">
                  <span className="transition-contact-avatar">
                    {memory.author.slice(0, 1)}
                  </span>
                  <div className="transition-contact-name">
                    {memory.author} — Conversación
                  </div>
                  <small className="transition-contact-status">
                    Recuerdo de {memory.year}
                  </small>
                </div>
                <div className="transition-chat-tools">
                  ☺ Recuerdos compartidos · ♫ Nostalgiar
                </div>
              </>
            )}
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

import { useEffect, useRef, useState } from "react";
import { X, Quote } from "lucide-react";

export default function RepostDialog({
  memoryTitle,
  onCancel,
  onConfirm,
}: {
  memoryTitle: string;
  onCancel: () => void;
  onConfirm: (descripcion: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [descripcion, setDescripcion] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!descripcion.trim()) return;
    setSubmitting(true);
    onConfirm(descripcion.trim());
  }

  return (
    <dialog
      ref={dialog}
      className="memory-dialog"
      onCancel={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onCancel();
      }}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <header className="dialog-heading">
        <span>
          <Quote
            size={16}
            style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }}
          />{" "}
          Citar recuerdo
        </span>
        <button
          type="button"
          className="icon-button"
          disabled={submitting}
          aria-label="Cerrar"
          onClick={onCancel}
        >
          <X size={16} />
        </button>
      </header>

      <form onSubmit={handleSubmit}>
        <div style={{ padding: "0 1rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label htmlFor="repost-desc">
              ¿Qué querés agregar sobre <strong>"{memoryTitle}"</strong>?
            </label>
            <textarea
              id="repost-desc"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              disabled={submitting}
              placeholder="Escribe tu reflexión, contexto o anécdota..."
              rows={3}
              autoFocus
              required
            />
          </div>
        </div>

        <footer className="dialog-actions">
          <button
            type="button"
            className="secondary-button"
            disabled={submitting}
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="primary-button"
            disabled={submitting || !descripcion.trim()}
          >
            {submitting ? "Publicando..." : "Publicar cita"}
          </button>
        </footer>
      </form>
    </dialog>
  );
}

export { RepostDialog as CitarDialog };

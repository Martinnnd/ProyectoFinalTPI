import { useEffect, useRef, useState } from "react";
import { Trash2, X } from "lucide-react";
import type { Memory } from "../types";

export default function DeleteMemoryDialog({memory, onCancel, onConfirm}: {
  memory: Memory; onCancel: () => void; onConfirm: () => string | null;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    cancel.current?.focus();
    return () => { if (previous?.isConnected) previous.focus(); };
  }, []);
  return <dialog ref={dialog} className="delete-memory-dialog" aria-labelledby="delete-memory-title" aria-describedby="delete-memory-description" onCancel={e => {e.preventDefault();e.stopPropagation();onCancel();}} onKeyDown={e => e.stopPropagation()}>
    <header className="delete-memory-heading"><span><Trash2 size={16}/> Eliminar recuerdo</span><button type="button" className="icon-button" aria-label="Cerrar confirmación" onClick={onCancel}><X size={16}/></button></header>
    <div className="delete-memory-body">
      <div className="delete-memory-symbol" aria-hidden="true"><Trash2 size={28}/></div>
      <h2 id="delete-memory-title">¿Eliminar este recuerdo?</h2>
      <p className="delete-memory-name">{memory.title}</p>
      <small>{memory.place} · {memory.year}</small>
      <p id="delete-memory-description">Se quitará de tu perfil, del feed y del mapa. Esta acción no se puede deshacer.</p>
      {error && <p role="alert" className="form-error">{error}</p>}
    </div>
    <footer className="delete-memory-footer"><button ref={cancel} className="secondary-button" onClick={onCancel}>Cancelar</button><button className="primary-button" onClick={() => setError(onConfirm())}><Trash2 size={15}/> Eliminar recuerdo</button></footer>
  </dialog>;
}

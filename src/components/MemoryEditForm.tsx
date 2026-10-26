import { useEffect, useRef, useState, type FormEvent } from "react";
import { Loader2, Save, X } from "lucide-react";
import { extractHashtags } from "../hashtags";
import type { Decade, Memory } from "../types";
import DiscardDraftDialog from "./DiscardDraftDialog";

export default function MemoryEditForm({ initial, onCancel, onSave }: {
  initial: Memory;
  onCancel: () => void;
  onSave: (memory: Memory) => string | null | Promise<string | null | void> | void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const hashtags = extractHashtags(description);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    return () => previous?.focus();
  }, []);

  function requestClose() {
    if (saving) return;
    if (title !== initial.title || description !== initial.description) setConfirmDiscard(true);
    else onCancel();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    if (!title.trim() || !description.trim()) {
      setError("Completá el título y la descripción.");
      return;
    }
    if (hashtags.error) { setError(hashtags.error); return; }
    setSaving(true);
    setError("");
    try {
      const result = await onSave({
        ...initial,
        title: title.trim(),
        description: description.trim(),
        hashtags: hashtags.tags,
      });
      if (typeof result === "string") setError(result);
    } catch {
      setError("No se pudo guardar el recuerdo. Tus cambios siguen acá; intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog ref={dialog} className="memory-dialog" aria-labelledby="edit-memory-title"
      onCancel={(event) => { event.preventDefault(); event.stopPropagation(); requestClose(); }}
      onKeyDown={(event) => event.stopPropagation()}>
      <div className="dialog-heading">
        <span className="eyebrow">EDITAR PUBLICACIÓN</span>
        <button type="button" className="icon-button" onClick={requestClose} disabled={saving} aria-label="Cerrar formulario"><X size={20} /></button>
      </div>
      <h2 id="edit-memory-title">Editar mi recuerdo</h2>
      <form onSubmit={submit} onChangeCapture={() => setError("")}>
        <label>Título del recuerdo
          <input name="title" value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={90} disabled={saving} autoFocus />
        </label>
        <label>Descripción
          <textarea name="description" value={description} onChange={(event) => setDescription(event.target.value)} required minLength={1} maxLength={1800} rows={6} disabled={saving} aria-describedby="edit-hashtags-help" />
        </label>
        <small id="edit-hashtags-help">Agregá #palabras en tu historia para crear hashtags. Hasta 5, de 32 caracteres cada uno.</small>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="dialog-actions">
          <button type="button" className="secondary-button" onClick={requestClose} disabled={saving}>Cancelar</button>
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? <><Loader2 size={17} /> Guardando…</> : <><Save size={17} /> Guardar cambios</>}
          </button>
        </div>
      </form>
      {confirmDiscard && <DiscardDraftDialog decade={(Math.floor(initial.year / 10) * 10) as Decade} onContinue={() => setConfirmDiscard(false)} onDiscard={onCancel} />}
    </dialog>
  );
}

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Loader2, Save, Users, UserPlus, X } from "lucide-react";
import { extractHashtags } from "../hashtags";
import type { Decade, Memory } from "../types";
import DiscardDraftDialog from "./DiscardDraftDialog";
import { useOptionalAuth } from "./auth/AuthProvider";
import { buscarUsuarios, type UsuarioBusqueda } from "../userApi";
import { tagUsersInPublication, untagUserInPublication } from "../publicationsApi";

export default function MemoryEditForm({
  initial,
  onCancel,
  onSave,
}: {
  initial: Memory;
  onCancel: () => void;
  onSave: (memory: Memory) => string | null | Promise<string | null | void> | void;
}) {
  const auth = useOptionalAuth();
  const session = auth?.session;
  const dialog = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [taggedUsers, setTaggedUsers] = useState<UsuarioBusqueda[]>(() => {
    const list = initial.taggedUsers ? [...initial.taggedUsers] : [];
    return list.filter((u) => {
      if (session?.usuarioId && u.id === session.usuarioId) return false;
      if (session?.username && u.username.toLowerCase() === session.username.toLowerCase()) return false;
      return true;
    });
  });
  const [tagQuery, setTagQuery] = useState("");
  const [tagResults, setTagResults] = useState<UsuarioBusqueda[]>([]);
  const [tagSearching, setTagSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const hashtags = extractHashtags(description);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    return () => previous?.focus();
  }, []);

  useEffect(() => {
    const q = tagQuery.trim();
    if (q.length < 2) {
      setTagResults([]);
      setTagSearching(false);
      return;
    }

    const currentUserId = session?.usuarioId;
    const currentUsername = session?.username?.toLowerCase();

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setTagSearching(true);
      buscarUsuarios(q, controller.signal)
        .then((users) => {
          if (!controller.signal.aborted) {
            setTagResults(
              users.filter((u) => {
                if (currentUserId && u.id === currentUserId) return false;
                if (currentUsername && u.username.toLowerCase() === currentUsername) return false;
                if (taggedUsers.some((t) => t.id === u.id)) return false;
                return true;
              }),
            );
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) setTagResults([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setTagSearching(false);
        });
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [tagQuery, taggedUsers, session]);

  function requestClose() {
    if (saving) return;
    const initialIds = (initial.taggedUsers ?? []).map((u) => u.id).sort().join(",");
    const currentIds = taggedUsers.map((u) => u.id).sort().join(",");
    const hasTagChanges = initialIds !== currentIds;

    if (title !== initial.title || description !== initial.description || hasTagChanges) {
      setConfirmDiscard(true);
    } else {
      onCancel();
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    if (!title.trim() || !description.trim()) {
      setError("Completá el título y la descripción.");
      return;
    }
    if (hashtags.error) {
      setError(hashtags.error);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const cleanTaggedUsers = taggedUsers.filter((u) => {
        if (session?.usuarioId && u.id === session.usuarioId) return false;
        if (session?.username && u.username.toLowerCase() === session.username.toLowerCase()) return false;
        return true;
      });

      // Sincronizar etiquetas en el backend para publicaciones persistidas
      const numericId = Number(initial.id);
      if (Number.isSafeInteger(numericId) && numericId > 0) {
        const initialIds = (initial.taggedUsers ?? []).map((u) => u.id);
        const currentIds = cleanTaggedUsers.map((u) => u.id);
        const toAdd = currentIds.filter((id) => !initialIds.includes(id));
        const toRemove = initialIds.filter((id) => !currentIds.includes(id));

        if (toAdd.length > 0) {
          try {
            await tagUsersInPublication(numericId, toAdd);
          } catch (tagErr) {
            console.error("Error al agregar etiquetas:", tagErr);
          }
        }
        for (const remId of toRemove) {
          try {
            await untagUserInPublication(numericId, remId);
          } catch (untagErr) {
            console.error("Error al quitar etiqueta:", untagErr);
          }
        }
      }

      const result = await onSave({
        ...initial,
        title: title.trim(),
        description: description.trim(),
        hashtags: hashtags.tags,
        taggedUsers: cleanTaggedUsers,
      });
      if (typeof result === "string") setError(result);
    } catch {
      setError("No se pudo guardar el recuerdo. Tus cambios siguen acá; intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      className="memory-dialog"
      aria-labelledby="edit-memory-title"
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        requestClose();
      }}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <div className="dialog-heading">
        <span className="eyebrow">EDITAR PUBLICACIÓN</span>
        <button
          type="button"
          className="icon-button"
          onClick={requestClose}
          disabled={saving}
          aria-label="Cerrar formulario"
        >
          <X size={20} />
        </button>
      </div>
      <h2 id="edit-memory-title">Editar mi recuerdo</h2>
      <form onSubmit={submit} onChangeCapture={() => setError("")}>
        <label>
          Título del recuerdo
          <input
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            maxLength={90}
            disabled={saving}
            autoFocus
          />
        </label>
        <label>
          Descripción
          <textarea
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            required
            minLength={1}
            maxLength={1800}
            rows={6}
            disabled={saving}
            aria-describedby="edit-hashtags-help"
          />
        </label>
        <small id="edit-hashtags-help">
          Agregá #palabras en tu historia para crear hashtags. Hasta 5, de 32 caracteres cada uno.
        </small>

        <div className="memory-tag-users-section">
          <label htmlFor="tag-user-input" className="tag-users-label">
            <Users size={15} /> ¿Quiénes estuvieron ahí?
          </label>
          <div className="tag-users-input-wrapper">
            <input
              id="tag-user-input"
              type="text"
              value={tagQuery}
              placeholder="Buscá amigos por @username..."
              onChange={(e) => setTagQuery(e.target.value)}
              disabled={saving}
              autoComplete="off"
            />
            {tagSearching && <Loader2 size={14} className="tag-search-spinner spin" />}
          </div>

          {tagResults.length > 0 && (
            <ul className="tag-users-dropdown" role="listbox">
              {tagResults.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => {
                      if (session?.usuarioId && u.id === session.usuarioId) return;
                      if (session?.username && u.username.toLowerCase() === session.username.toLowerCase()) return;
                      setTaggedUsers((prev) => (prev.some((p) => p.id === u.id) ? prev : [...prev, u]));
                      setTagQuery("");
                      setTagResults([]);
                    }}
                  >
                    <UserPlus size={14} /> @{u.username}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {taggedUsers.length > 0 && (
            <div className="tagged-users-chips" aria-label="Amigos etiquetados">
              {taggedUsers.map((u) => (
                <span key={u.id} className="tagged-chip">
                  @{u.username}
                  <button
                    type="button"
                    aria-label={`Quitar @${u.username}`}
                    disabled={saving}
                    onClick={() => {
                      setTaggedUsers((prev) => prev.filter((item) => item.id !== u.id));
                    }}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={requestClose}
            disabled={saving}
          >
            Cancelar
          </button>
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? (
              <>
                <Loader2 size={17} /> Guardando…
              </>
            ) : (
              <>
                <Save size={17} /> Guardar cambios
              </>
            )}
          </button>
        </div>
      </form>
      {confirmDiscard && (
        <DiscardDraftDialog
          decade={(Math.floor(initial.year / 10) * 10) as Decade}
          onContinue={() => setConfirmDiscard(false)}
          onDiscard={onCancel}
        />
      )}
    </dialog>
  );
}

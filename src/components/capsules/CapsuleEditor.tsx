"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  availableCapsuleMemories,
  createCapsule,
  updateCapsule,
  addCapsuleMemories,
  type Capsule,
  type AvailableCapsuleMemory,
  type CapsuleInput,
} from "../../capsulesApi";
import CapsuleDialog from "./CapsuleDialog";
import CapsuleCover from "./CapsuleCover";
import { useCursorPage } from "./useCursorPage";
import { memoryDate } from "./capsulePresentation";
import styles from "./capsules.module.css";

function FilePreview({ file }: { file: File }) {
  const image = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const url = URL.createObjectURL(file);
    if (image.current) image.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return <img ref={image} className={styles.coverPreview} alt="Vista previa de la portada" />;
}

function Selection({
  items,
  selected,
  onChange,
  disabled,
}: {
  items: AvailableCapsuleMemory[];
  selected: number[];
  onChange: (ids: number[]) => void;
  disabled: boolean;
}) {
  return (
    <div className={styles.memoryChoices}>
      {items.map((memory) => (
        <label key={memory.id} className={styles.memoryChoice}>
          <input
            type="checkbox"
            checked={memory.yaAgregado || selected.includes(memory.id)}
            disabled={
              disabled ||
              memory.yaAgregado ||
              (selected.length >= 100 && !selected.includes(memory.id))
            }
            onChange={(event) =>
              onChange(
                event.target.checked
                  ? [...selected, memory.id]
                  : selected.filter((id) => id !== memory.id),
              )
            }
          />
          {memory.portadaUrl && <img src={memory.portadaUrl} alt="" loading="lazy" />}
          <span>
            <strong>{memory.titulo}</strong>
            <small>
              {memoryDate(memory.fecha)}
              {memory.yaAgregado ? " · Ya está en esta cápsula" : ""}
            </small>
          </span>
        </label>
      ))}
    </div>
  );
}

export default function CapsuleEditor({
  capsule,
  onSaved,
  onClose,
}: {
  capsule?: Capsule;
  onSaved: (capsule: Capsule) => void;
  onClose: () => void;
}) {
  const load = useCallback(
    (cursor: string | null, signal: AbortSignal) =>
      availableCapsuleMemories(capsule?.id, cursor, signal),
    [capsule?.id],
  );
  const page = useCursorPage(load);
  const [name, setName] = useState(capsule?.nombre ?? "");
  const [description, setDescription] = useState(capsule?.descripcion ?? "");
  const [visibility, setVisibility] = useState<0 | 1>(capsule?.visibilidad ?? 0);
  const [selected, setSelected] = useState<number[]>([]);
  const [cover, setCover] = useState(capsule?.portadaPublicacionId?.toString() ?? "");
  const [coverMode, setCoverMode] = useState<"automatic" | "memory" | "upload">(
    capsule?.portadaSubida ? "upload" : capsule?.portadaPublicacionId ? "memory" : "automatic",
  );
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const choices = page.items.filter(
    (memory) => memory.portadaUrl && (capsule ? memory.yaAgregado : selected.includes(memory.id)),
  );

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (name.trim().length < 3) {
      setError("Elegí un nombre de al menos 3 caracteres.");
      return;
    }
    const portadaId =
      coverMode === "memory" && cover && (capsule || selected.includes(Number(cover)))
        ? Number(cover)
        : null;
    if (coverMode === "memory" && !portadaId) {
      setError("Elegí un recuerdo con foto para la portada.");
      return;
    }
    if (coverMode === "upload" && !file && !capsule?.portadaSubida) {
      setError("Elegí una foto de tu dispositivo.");
      return;
    }
    const input: CapsuleInput = {
      nombre: name.trim(),
      descripcion: description.trim() || null,
      visibilidad: visibility,
      portadaPublicacionId: portadaId,
      portadaAdjuntoId:
        portadaId === capsule?.portadaPublicacionId ? capsule.portadaAdjuntoId : null,
      conservarPortadaSubida: coverMode === "upload",
    };
    setBusy(true);
    setError("");
    try {
      onSaved(
        capsule
          ? await updateCapsule(
              capsule.id,
              input,
              coverMode === "upload" ? (file ?? undefined) : undefined,
            )
          : await createCapsule(
              input,
              selected,
              coverMode === "upload" ? (file ?? undefined) : undefined,
            ),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos guardar la cápsula.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <CapsuleDialog
      title={capsule ? "Editar cápsula" : "Una nueva cápsula"}
      busy={busy}
      onClose={onClose}
    >
      <form onSubmit={save} className={styles.form}>
        <label>
          Nombre
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            minLength={3}
            maxLength={100}
            disabled={busy}
            autoFocus
            placeholder="Veranos en familia"
          />
        </label>
        <label>
          Descripción <small>(opcional)</small>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={500}
            rows={3}
            disabled={busy}
            placeholder="Lo que hace que estos recuerdos vayan juntos…"
          />
        </label>
        <label>
          Quién puede verla
          <select
            value={visibility}
            onChange={(event) => setVisibility(Number(event.target.value) as 0 | 1)}
            disabled={busy}
          >
            <option value={0}>Privada · solo yo</option>
            <option value={1}>Pública · cualquier persona</option>
          </select>
        </label>
        <p className={styles.hint}>
          La privacidad de la cápsula no cambia la de los recuerdos originales.
        </p>
        {!capsule && (
          <fieldset disabled={busy}>
            <legend>
              Sumá tus recuerdos <small>(opcional · {selected.length}/100)</small>
            </legend>
            <Selection
              items={page.items}
              selected={selected}
              onChange={(ids) => {
                setSelected(ids);
                if (cover && !ids.includes(Number(cover))) setCover("");
              }}
              disabled={busy}
            />
            {!page.items.length && !page.loading && !page.error && (
              <p>Podés crearla vacía y agregar recuerdos después.</p>
            )}
          </fieldset>
        )}
        <fieldset disabled={busy}>
          <legend>Foto de portada</legend>
          <div className={styles.coverChoices}>
            {(
              [
                ["automatic", "Automática"],
                ["memory", "De un recuerdo"],
                ["upload", "Subir una foto"],
              ] as const
            ).map(([mode, label]) => (
              <label key={mode}>
                <input
                  type="radio"
                  name="coverMode"
                  value={mode}
                  checked={coverMode === mode}
                  onChange={() => {
                    setCoverMode(mode);
                    setError("");
                  }}
                />
                {label}
              </label>
            ))}
          </div>
          {coverMode === "automatic" && (
            <p className={styles.hint}>
              Usaremos una foto de los recuerdos incluidos, cuando haya alguna disponible.
            </p>
          )}
          {coverMode === "memory" && (
            <label>
              Recuerdo para la portada
              <select
                value={cover}
                disabled={busy}
                onChange={(event) => setCover(event.target.value)}
              >
                <option value="">Seleccioná un recuerdo con foto</option>
                {cover && !choices.some((memory) => String(memory.id) === cover) && (
                  <option value={cover}>Conservar portada actual</option>
                )}
                {choices.map((memory) => (
                  <option key={memory.id} value={memory.id}>
                    {memory.titulo}
                  </option>
                ))}
              </select>
            </label>
          )}
          {coverMode === "memory" && capsule && (
            <p className={styles.hint}>
              Podés elegir una foto de los recuerdos incluidos. Cargá más si todavía no aparece el
              que buscás.
            </p>
          )}
          {coverMode === "memory" &&
            choices.find((memory) => String(memory.id) === cover)?.portadaUrl && (
              <img
                className={styles.coverPreview}
                src={choices.find((memory) => String(memory.id) === cover)!.portadaUrl!}
                alt="Vista previa de la portada"
              />
            )}
          {coverMode === "upload" && (
            <>
              <label>
                Foto de tu dispositivo
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={busy}
                  onChange={(event) => {
                    const chosen = event.target.files?.[0];
                    if (!chosen) return;
                    if (
                      !["image/jpeg", "image/png", "image/webp"].includes(chosen.type) ||
                      chosen.size === 0 ||
                      chosen.size > 5 * 1024 * 1024
                    ) {
                      setError("Elegí una foto JPG, PNG o WebP de hasta 5 MB.");
                      event.target.value = "";
                      return;
                    }
                    setFile(chosen);
                    setError("");
                  }}
                />
              </label>
              <p className={styles.hint}>
                JPG, PNG o WebP · hasta 5 MB. Solo será la portada; no se publicará como recuerdo.
              </p>
              {file ? (
                <FilePreview file={file} />
              ) : (
                capsule?.portadaSubida && (
                  <CapsuleCover
                    capsule={capsule}
                    className={styles.coverPreview}
                    fallback={<p>Portada actual</p>}
                  />
                )
              )}
              {file && (
                <button type="button" className={styles.secondary} onClick={() => setFile(null)}>
                  {capsule?.portadaSubida
                    ? "Conservar la foto anterior"
                    : "Quitar foto seleccionada"}
                </button>
              )}
            </>
          )}
        </fieldset>
        {page.loading && <p role="status">Cargando tus recuerdos…</p>}
        {page.error && (
          <p role="alert">
            {page.error}{" "}
            <button type="button" onClick={page.retry}>
              Reintentar
            </button>
          </p>
        )}
        {page.cursor && (
          <button
            type="button"
            className={styles.secondary}
            disabled={busy || page.loading}
            onClick={page.more}
          >
            Cargar más recuerdos
          </button>
        )}
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
        <footer className={styles.dialogActions}>
          <button type="button" className={styles.secondary} disabled={busy} onClick={onClose}>
            Cancelar
          </button>
          <button className={styles.primary} disabled={busy}>
            {busy ? "Guardando…" : capsule ? "Guardar cambios" : "Crear cápsula"}
          </button>
        </footer>
      </form>
    </CapsuleDialog>
  );
}

export function AddCapsuleMemoriesDialog({
  capsule,
  onSaved,
  onClose,
}: {
  capsule: Capsule;
  onSaved: () => void;
  onClose: () => void;
}) {
  const load = useCallback(
    (cursor: string | null, signal: AbortSignal) =>
      availableCapsuleMemories(capsule.id, cursor, signal),
    [capsule.id],
  );
  const page = useCursorPage(load);
  const [selected, setSelected] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <CapsuleDialog title="Sumar recuerdos" busy={busy} onClose={onClose}>
      <div className={styles.form}>
        <p>Elegí entre tus recuerdos publicados. Cada uno puede estar en varias cápsulas.</p>
        <Selection items={page.items} selected={selected} onChange={setSelected} disabled={busy} />
        {!page.items.length && !page.loading && !page.error && (
          <p>Todavía no tenés recuerdos disponibles para sumar.</p>
        )}
        {page.loading && <p role="status">Cargando recuerdos…</p>}
        {page.error && (
          <p role="alert">
            {page.error} <button onClick={page.retry}>Reintentar</button>
          </p>
        )}
        {page.cursor && (
          <button className={styles.secondary} disabled={busy || page.loading} onClick={page.more}>
            Cargar más recuerdos
          </button>
        )}
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
        <footer className={styles.dialogActions}>
          <span>{selected.length}/100</span>
          <button
            className={styles.primary}
            disabled={busy || selected.length === 0}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                await addCapsuleMemories(capsule.id, selected);
                onSaved();
              } catch (cause) {
                setError(
                  cause instanceof Error ? cause.message : "No pudimos sumar los recuerdos.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Agregando…" : "Agregar a la cápsula"}
          </button>
        </footer>
      </div>
    </CapsuleDialog>
  );
}

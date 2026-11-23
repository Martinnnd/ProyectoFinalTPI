"use client";

import { useId, useRef, useState } from "react";
import { currentDecade, validateSong } from "./rules";
import type { SongInput } from "./api";
import styles from "./ranking.module.css";

export default function SongForm({
  initial,
  busy = false,
  onSave,
  onCancel,
  label = "Sugerir canción",
  defaultDecade,
}: {
  initial?: SongInput;
  busy?: boolean;
  onSave: (song: SongInput) => Promise<boolean>;
  onCancel?: () => void;
  label?: string;
  defaultDecade?: number;
}) {
  const id = useId();
  const [song, setSong] = useState<SongInput>(
    initial ?? { decada: defaultDecade ?? currentDecade(), titulo: "", artista: "" },
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);
  return (
    <form
      className={styles.form}
      aria-label={label}
      onSubmit={async (event) => {
        event.preventDefault();
        if (inFlight.current || busy) return;
        const input = { ...song, titulo: song.titulo.trim(), artista: song.artista.trim() };
        const invalid = validateSong(input);
        setError(invalid ?? "");
        if (invalid) return;
        inFlight.current = true;
        setSaving(true);
        try {
          if ((await onSave(input)) && !initial) setSong({ ...input, titulo: "", artista: "" });
        } catch (reason) {
          setError(reason instanceof Error ? reason.message : "No pudimos guardar la canción.");
        } finally {
          inFlight.current = false;
          setSaving(false);
        }
      }}
    >
      <fieldset disabled={busy || saving}>
        <legend>{label}</legend>
        <label htmlFor={id + "decade"}>Década</label>
        <input
          id={id + "decade"}
          type="number"
          min={1900}
          max={currentDecade()}
          step={10}
          required
          disabled={!!initial}
          value={song.decada}
          onChange={(event) => setSong({ ...song, decada: Number(event.target.value) })}
        />
        <label htmlFor={id + "title"}>Título</label>
        <input
          id={id + "title"}
          required
          maxLength={120}
          value={song.titulo}
          onChange={(event) => setSong({ ...song, titulo: event.target.value })}
        />
        <label htmlFor={id + "artist"}>Artista</label>
        <input
          id={id + "artist"}
          required
          maxLength={120}
          value={song.artista}
          onChange={(event) => setSong({ ...song, artista: event.target.value })}
        />
        <div className={styles.actions}>
          <button type="submit">{saving ? "Guardando…" : label}</button>
          {onCancel && (
            <button type="button" onClick={onCancel}>
              Cancelar
            </button>
          )}
        </div>
      </fieldset>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}

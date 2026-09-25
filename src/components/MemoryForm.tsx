  import { useEffect, useRef, useState } from "react";
  import { X, MapPin, Save } from "lucide-react";
  import { categories, type Memory, type Decade } from "../types";
  import type { Point } from "./MemoryMap";
  export default function MemoryForm({
    point,
    decade,
    onCancel,
    onSave,
  }: {
    point: Point;
    decade: Decade;
    onCancel: () => void;
    onSave: (m: Memory) => string | null;
  }) {
    const dialog = useRef<HTMLDialogElement>(null);
    const titleInput = useRef<HTMLInputElement>(null);
    const [error, setError] = useState("");
    useEffect(() => {
      const previous = document.activeElement as HTMLElement | null;
      dialog.current?.showModal();
      titleInput.current?.focus();
      return () => {
        previous?.focus();
      };
    }, []);
    function submit(event: React.FormEvent<HTMLFormElement>) {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const title = String(data.get("title")).trim(),
        place = String(data.get("place")).trim(),
        description = String(data.get("description")).trim();
      const year = Number(data.get("year"));
      if (
        !title ||
        !place ||
        !description ||
        !Number.isInteger(year) ||
        year < 1970 ||
        year > 2009
      ) {
        setError("Completá los campos y elegí un año entre 1970 y 2009.");
        return;
      }
      const result = onSave({
        id: crypto.randomUUID(),
        title,
        place,
        year,
        category: data.get("category") as Memory["category"],
        description,
        author: "Vos",
        source: "local",
        ...point,
      });
      if (result) setError(result);
    }
    return (
      <dialog
        ref={dialog}
        className="memory-dialog"
        onCancel={(e) => {
          e.preventDefault();
          onCancel();
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onCancel();
        }}
        aria-labelledby="form-title"
      >
        <div className="dialog-heading">
          <span className="eyebrow">UNA HISTORIA MÁS EN EL MAPA</span>
          <button
            className="icon-button"
            onClick={onCancel}
            aria-label="Cerrar formulario"
          >
            <X size={20} />
          </button>
        </div>
        <h2 id="form-title">¿Qué pasó en este lugar?</h2>
        <p className="muted">Los pequeños recuerdos también merecen un pin.</p>
        <div className="coordinate-label">
          <MapPin size={16} /> Ubicación elegida: {point.lat.toFixed(4)},{" "}
          {point.lng.toFixed(4)}
        </div>
        <form onSubmit={submit}>
          <label>
            Título del recuerdo
            <input
              ref={titleInput}
              name="title"
              autoFocus
              required
              maxLength={90}
              placeholder="Ese verano que no me olvido"
            />
          </label>
          <div className="form-row">
            <label>
              Año
              <input
                name="year"
                type="number"
                required
                min="1970"
                max="2009"
                defaultValue={decade + 5}
              />
            </label>
            <label>
              Categoría
              <select name="category" defaultValue="Personales">
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Nombre del lugar
            <input
              name="place"
              required
              maxLength={120}
              placeholder="Una plaza, tu barrio, aquel café…"
            />
          </label>
          <label>
            Tu historia
            <textarea
              name="description"
              required
              minLength={1}
              maxLength={1800}
              rows={4}
              placeholder="Contanos qué hace especial a este recuerdo."
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <p className="local-note">
            Se guarda solo en este navegador. No se comparte con otros
            dispositivos.
          </p>
          <div className="dialog-actions">
            <button type="button" className="secondary-button" onClick={onCancel}>
              Cancelar
            </button>
            <button className="primary-button" type="submit">
              <Save size={17} /> Guardar recuerdo
            </button>
          </div>
        </form>
      </dialog>
    );
  }

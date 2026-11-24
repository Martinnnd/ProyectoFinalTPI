"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { findPlaces, type PlaceResult } from "../placeSearch";
import { useNotice } from "../context/NoticeProvider";
import {
  editCurrentTreasure,
  saveTreasureLocation,
  type TreasureLocationInput,
} from "./treasureAdminApi";
import TreasureLocationMap from "./TreasureLocationMap";
import styles from "./admin.module.css";
import local from "./treasureAdmin.module.css";

export default function TreasureLocationForm({
  id,
  initial,
  current = false,
  onCancel,
  onSaved,
}: {
  id: number | null;
  initial: TreasureLocationInput;
  current?: boolean;
  onCancel: () => void;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const request = useRef<AbortController | null>(null);
  const showToast = useNotice((s) => s.showToast);
  useEffect(() => () => request.current?.abort(), []);
  async function searchPlaces() {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setSearching(true);
    setSearchError("");
    setResults([]);
    try {
      setResults(await findPlaces(search.trim(), controller.signal));
    } catch {
      if (!controller.signal.aborted)
        setSearchError(
          "No pudimos buscar ese lugar. Podés elegirlo en el mapa o ingresar coordenadas.",
        );
    } finally {
      if (!controller.signal.aborted) setSearching(false);
    }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (current && id) await editCurrentTreasure(id, form);
      else await saveTreasureLocation(id, form);
      showToast(
        current
          ? "Reto vigente actualizado. Se conservaron los hallazgos."
          : "Ubicación guardada para futuros retos.",
        "success",
      );
      await onSaved();
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <form
      className={`${styles.panel} ${local.editor}`}
      onSubmit={submit}
      aria-label={current ? "Editar reto vigente" : "Editar ubicación del tesoro"}
    >
      <h2>
        {current ? "Editar reto de esta semana" : id ? "Editar ubicación" : "Nueva ubicación"}
      </h2>
      <p>
        {current
          ? "Este cambio puede mover el tesoro para quienes aún lo buscan. Quienes ya lo encontraron conservan el reto completado. No modifica el catálogo de futuras semanas."
          : "Los cambios del catálogo se aplican a futuras semanas. Para cambiar esta semana, usá Editar reto vigente."}
      </p>
      <fieldset disabled={saving}>
        <label>
          Nombre al encontrarlo
          <input
            required
            maxLength={200}
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />
        </label>
        <label>
          Pista del feed
          <textarea
            required
            rows={3}
            maxLength={500}
            value={form.pista}
            onChange={(e) => setForm({ ...form, pista: e.target.value })}
          />
        </label>
        <div className={local.search}>
          <label>
            Buscar un lugar
            <input
              type="search"
              minLength={3}
              value={search}
              onChange={(e) => {
                request.current?.abort();
                setSearching(false);
                setSearch(e.target.value);
                setResults([]);
              }}
            />
          </label>
          <button
            type="button"
            className={styles.secondaryButton}
            disabled={searching || search.trim().length < 3}
            onClick={() => void searchPlaces()}
          >
            {searching ? "Buscando…" : "Buscar lugar"}
          </button>
        </div>
        {searchError && <p role="status">{searchError}</p>}
        <ul className={local.results}>
          {results.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => {
                  setForm({ ...form, latitud: p.lat, longitud: p.lng });
                  setResults([]);
                }}
              >
                {p.label}
              </button>
            </li>
          ))}
        </ul>
        <TreasureLocationMap
          point={form}
          onChange={(p) => setForm((previous) => ({ ...previous, ...p }))}
        />
        <div className={local.coordinates}>
          <label>
            Latitud
            <input
              required
              type="number"
              step="any"
              min={-85}
              max={85}
              value={form.latitud}
              onChange={(e) => setForm({ ...form, latitud: Number(e.target.value) })}
            />
          </label>
          <label>
            Longitud
            <input
              required
              type="number"
              step="any"
              min={-180}
              max={180}
              value={form.longitud}
              onChange={(e) => setForm({ ...form, longitud: Number(e.target.value) })}
            />
          </label>
          <label>
            Zoom mínimo
            <select
              value={form.zoomMinimo}
              onChange={(e) => setForm({ ...form, zoomMinimo: Number(e.target.value) })}
            >
              <option value={17}>17 · Cerca</option>
              <option value={18}>18 · Muy cerca</option>
              <option value={19}>19 · Máximo detalle</option>
            </select>
          </label>
        </div>
        {!current && (
          <label className={local.checkbox}>
            <input
              type="checkbox"
              checked={form.activa}
              onChange={(e) => setForm({ ...form, activa: e.target.checked })}
            />
            Ubicación activa
          </label>
        )}
        {!current && !form.activa && (
          <p>
            Se excluye de la rotación. Las futuras semanas programadas con esta ubicación quedarán
            pausadas mientras esté inactiva.
          </p>
        )}
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <footer>
          <button type="button" className={styles.secondaryButton} onClick={onCancel}>
            Cancelar
          </button>
          <button className={styles.primaryButton}>
            {saving
              ? "Guardando…"
              : current
                ? "Guardar cambios en el reto actual"
                : "Guardar ubicación"}
          </button>
        </footer>
      </fieldset>
    </form>
  );
}

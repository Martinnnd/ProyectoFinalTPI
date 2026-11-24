"use client";

import { useCallback, useEffect, useState } from "react";
import { MapPin, Pencil, Plus } from "lucide-react";
import { useNotice } from "../context/NoticeProvider";
import {
  getTreasureAdmin,
  scheduleTreasure,
  type TreasureAdminPanel,
  type TreasureLocationInput,
  type TreasureWeek,
} from "./treasureAdminApi";
import TreasureLocationForm from "./TreasureLocationForm";
import styles from "./admin.module.css";
import local from "./treasureAdmin.module.css";

const blank: TreasureLocationInput = {
  nombre: "",
  pista: "",
  latitud: -34.59558,
  longitud: -58.3785,
  zoomMinimo: 18,
  activa: true,
};
type Editor = { id: number | null; initial: TreasureLocationInput; current?: boolean };

export default function TreasurePanel() {
  const [panel, setPanel] = useState<TreasureAdminPanel | null>(null);
  const [editing, setEditing] = useState<Editor | null>(null);
  const [error, setError] = useState("");
  const showToast = useNotice((s) => s.showToast);
  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await getTreasureAdmin(signal);
      if (!signal?.aborted) {
        setPanel(data);
        setError("");
      }
    } catch (reason) {
      if (!signal?.aborted) setError((reason as Error).message);
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void getTreasureAdmin(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setPanel(data);
      })
      .catch((reason: Error) => {
        if (!controller.signal.aborted) setError(reason.message);
      });
    return () => controller.abort();
  }, []);
  async function program(week: string, choice: string) {
    await scheduleTreasure(week, choice);
    await load();
    showToast("Programación semanal guardada.", "success");
  }
  return (
    <div className={styles.content}>
      {error && (
        <p className={styles.error} role="alert">
          {error}
          <button type="button" onClick={() => void load()}>
            Reintentar
          </button>
        </p>
      )}
      {!panel && !error && <p role="status">Cargando búsqueda del tesoro…</p>}
      {panel && (
        <>
          {!panel.habilitado && (
            <p role="status">
              El juego está pausado por la configuración del servidor. Podés preparar el catálogo y
              las próximas semanas.
            </p>
          )}
          {editing ? (
            <TreasureLocationForm
              key={`${editing.current ? "actual" : "catalogo"}:${editing.id}`}
              {...editing}
              onCancel={() => setEditing(null)}
              onSaved={async () => {
                setEditing(null);
                await load();
              }}
            />
          ) : (
            <>
              <section className={styles.panel} aria-label="Reto de esta semana">
                <h2>Reto de esta semana</h2>
                {panel.actual ? (
                  <>
                    <h3>{panel.actual.nombre}</h3>
                    <p>{panel.actual.pista}</p>
                    <p>
                      Zoom mínimo: {panel.actual.zoomMinimo}. Los hallazgos se conservan si editás
                      este reto.
                    </p>
                    <button
                      className={styles.secondaryButton}
                      onClick={() =>
                        setEditing({
                          id: panel.actual!.id,
                          initial: { ...panel.actual!, activa: true },
                          current: true,
                        })
                      }
                    >
                      <Pencil size={16} /> Editar reto vigente
                    </button>
                  </>
                ) : (
                  <p>Esta semana no hay un tesoro activo.</p>
                )}
              </section>
              <section className={styles.tablePanel} aria-label="Ubicaciones del tesoro">
                <header>
                  <div>
                    <h2>Ubicaciones y pistas</h2>
                    <p>
                      El catálogo se usa para próximas semanas. Podés conservar ubicaciones
                      inactivas.
                    </p>
                  </div>
                  <button
                    className={styles.primaryButton}
                    onClick={() => setEditing({ id: null, initial: blank })}
                  >
                    <Plus size={16} /> Nueva ubicación
                  </button>
                </header>
                <div className={styles.tableScroll}>
                  <table>
                    <thead>
                      <tr>
                        <th>Lugar</th>
                        <th>Pista</th>
                        <th>Zoom</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {panel.ubicaciones.map((u) => (
                        <tr key={u.id}>
                          <td>
                            <strong>
                              <MapPin size={14} /> {u.nombre}
                            </strong>
                            <small>
                              {u.latitud.toFixed(5)}, {u.longitud.toFixed(5)}
                            </small>
                          </td>
                          <td className={local.clue}>{u.pista}</td>
                          <td>{u.zoomMinimo}</td>
                          <td>
                            <span className={u.activa ? styles.badgeSuccess : styles.badgeDanger}>
                              {u.activa ? "Activa" : "Inactiva"}
                            </span>
                          </td>
                          <td>
                            <button
                              className={styles.secondaryButton}
                              aria-label={`Editar ${u.nombre}`}
                              onClick={() => setEditing({ id: u.id, initial: u })}
                            >
                              Editar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!panel.ubicaciones.length && (
                  <p className={styles.empty}>Agregá una ubicación para comenzar.</p>
                )}
              </section>
              <section className={styles.tablePanel} aria-label="Programación semanal del tesoro">
                <header>
                  <div>
                    <h2>Próximas 12 semanas</h2>
                    <p>
                      Cada semana comienza el domingo a las 00:00 de Argentina. La rotación es una
                      vista previa y puede cambiar al editar el catálogo.
                    </p>
                  </div>
                </header>
                <div className={styles.tableScroll}>
                  <table>
                    <thead>
                      <tr>
                        <th>Semana desde</th>
                        <th>Programación</th>
                        <th>Pista prevista</th>
                      </tr>
                    </thead>
                    <tbody>
                      {panel.semanas
                        .filter((w) => w.editable)
                        .map((week) => (
                          <WeekRow
                            key={`${week.semanaInicio}:${week.modo}:${week.ubicacionId}`}
                            week={week}
                            locations={panel.ubicaciones}
                            onSave={program}
                          />
                        ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}

function WeekRow({
  week,
  locations,
  onSave,
}: {
  week: TreasureWeek;
  locations: TreasureAdminPanel["ubicaciones"];
  onSave: (week: string, choice: string) => Promise<void>;
}) {
  const initial =
    week.ubicacionId !== null
      ? String(week.ubicacionId)
      : week.modo === "pausada"
        ? "pause"
        : "auto";
  const [choice, setChoice] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function save() {
    setSaving(true);
    setError("");
    try {
      await onSave(week.semanaInicio, choice);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <tr>
      <td>
        <strong>{week.semanaInicio}</strong>
        <small>{week.nombre ?? "Sin tesoro"}</small>
      </td>
      <td>
        <div className={local.schedule}>
          <select
            aria-label={`Ubicación para ${week.semanaInicio}`}
            value={choice}
            disabled={saving}
            onChange={(e) => setChoice(e.target.value)}
          >
            <option value="auto">Rotación automática</option>
            <option value="pause">Pausar esta semana</option>
            {locations
              .filter((u) => u.activa || u.id === week.ubicacionId)
              .map((u) => (
                <option key={u.id} value={u.id} disabled={!u.activa}>
                  {u.nombre}
                  {u.activa ? "" : " · Inactiva"}
                </option>
              ))}
          </select>
          <button
            className={styles.secondaryButton}
            disabled={saving || choice === initial}
            onClick={() => void save()}
          >
            {saving ? "Guardando…" : "Guardar semana"}
          </button>
        </div>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        {week.ubicacionId !== null && week.modo === "pausada" && (
          <small>La ubicación programada está inactiva. Activala o elegí otra.</small>
        )}
      </td>
      <td className={local.clue}>{week.pista ?? "No se publicará una pista."}</td>
    </tr>
  );
}

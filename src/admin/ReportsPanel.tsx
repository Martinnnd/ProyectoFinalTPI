"use client";

import { ChevronLeft, ChevronRight, Flag, Search, ShieldCheck, X } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useNotice } from "../context/NoticeProvider";
import {
  actionsForTarget,
  reportActionLabels,
  reportReasons,
  reportStateLabels,
  reportTargetLabels,
  type ReportAction,
} from "../reports/reportTypes";
import { getAdminReports, resolveAdminReport, type AdminPage, type AdminReport } from "./adminApi";
import styles from "./admin.module.css";

const emptyPage: AdminPage<AdminReport> = {
  items: [],
  pagina: 1,
  tamanio: 10,
  totalItems: 0,
  totalPaginas: 0,
};

export default function ReportsPanel() {
  const [page, setPage] = useState(emptyPage);
  const [pagina, setPagina] = useState(1);
  const [search, setSearch] = useState("");
  const [text, setText] = useState("");
  const [target, setTarget] = useState("");
  const [state, setState] = useState("0");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<AdminReport | null>(null);
  const showToast = useNotice((value) => value.showToast);

  const load = useCallback(
    (signal?: AbortSignal) => {
      setLoading(true);
      setError("");
      return getAdminReports(
        {
          pagina,
          tamanio: 10,
          texto: text || undefined,
          tipoContenido: target === "" ? undefined : Number(target),
          motivo: reason === "" ? undefined : Number(reason),
          estado: state === "" ? undefined : Number(state),
        },
        signal,
      )
        .then(setPage)
        .catch((cause: Error) => {
          if (!signal?.aborted) setError(cause.message);
        })
        .finally(() => {
          if (!signal?.aborted) setLoading(false);
        });
    },
    [pagina, text, target, reason, state],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  function applyFilters(event: FormEvent) {
    event.preventDefault();
    setPagina(1);
    setText(search.trim());
  }

  async function resolve(action: ReportAction, observation: string, days: number) {
    if (!selected) return;
    try {
      await resolveAdminReport(selected.id, action, observation, days);
      setSelected(null);
      await load();
      showToast("El reporte fue resuelto y se aplicó la acción seleccionada.", "success");
    } catch (cause) {
      showToast(
        cause instanceof Error ? cause.message : "No se pudo resolver el reporte.",
        "error",
      );
    }
  }

  return (
    <div className={styles.content}>
      <section className={styles.commentIntro}>
        <span>
          <Flag />
        </span>
        <div>
          <h2>Contenido reportado</h2>
          <p>
            Revisá la evidencia y decidí qué medida aplicar. Ningún reporte modera contenido
            automáticamente.
          </p>
        </div>
      </section>
      <form className={styles.filters} onSubmit={applyFilters}>
        <label className={styles.search}>
          <Search />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Usuario, detalle o contenido"
          />
        </label>
        <select
          aria-label="Tipo de contenido"
          value={target}
          onChange={(event) => {
            setTarget(event.target.value);
            setPagina(1);
          }}
        >
          <option value="">Todos los tipos</option>
          {Object.entries(reportTargetLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          aria-label="Motivo"
          value={reason}
          onChange={(event) => {
            setReason(event.target.value);
            setPagina(1);
          }}
        >
          <option value="">Todos los motivos</option>
          {reportReasons.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Estado"
          value={state}
          onChange={(event) => {
            setState(event.target.value);
            setPagina(1);
          }}
        >
          <option value="">Todos los estados</option>
          {Object.entries(reportStateLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button className={styles.primaryButton}>Buscar</button>
      </form>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <section className={styles.tablePanel}>
        <header>
          <div>
            <h2>Reportes</h2>
            <p>{page.totalItems} resultados</p>
          </div>
        </header>
        {loading ? (
          <p className={styles.state}>Cargando reportes…</p>
        ) : (
          <div className={styles.tableScroll}>
            <table>
              <thead>
                <tr>
                  <th>Contenido</th>
                  <th>Motivo</th>
                  <th>Usuarios</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {page.items.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <strong>
                        {reportTargetLabels[report.tipoContenido]} #{report.contenidoId}
                      </strong>
                      <small title={report.contenidoSnapshot ?? ""}>
                        {report.contenidoSnapshot ||
                          report.contexto ||
                          "Sin vista previa disponible"}
                      </small>
                    </td>
                    <td>
                      <strong>
                        {reportReasons.find((item) => item.value === report.motivo)?.label ??
                          `Motivo ${report.motivo}`}
                      </strong>
                      <small>
                        {report.detalle || "Sin detalle"} · {report.cantidadCoincidentes}{" "}
                        coincidente(s)
                      </small>
                    </td>
                    <td>
                      <strong>Reportado: @{report.usuarioReportadoUsername}</strong>
                      <small>Por @{report.reportanteUsername}</small>
                    </td>
                    <td>
                      <span
                        className={
                          report.estado === 2
                            ? styles.badgeSuccess
                            : report.estado === 3
                              ? styles.badgeDanger
                              : styles.badgeWarning
                        }
                      >
                        {reportStateLabels[report.estado]}
                      </span>
                    </td>
                    <td>{formatDate(report.fechaCreacion)}</td>
                    <td>
                      <button
                        className={styles.primaryButton}
                        disabled={report.estado === 2 || report.estado === 3}
                        onClick={() => setSelected(report)}
                      >
                        Revisar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!page.items.length && (
              <p className={styles.empty}>No hay reportes para estos filtros.</p>
            )}
          </div>
        )}
        <footer className={styles.pagination}>
          <button disabled={pagina <= 1 || loading} onClick={() => setPagina((value) => value - 1)}>
            <ChevronLeft /> Anterior
          </button>
          <span>
            Página {page.pagina} de {Math.max(page.totalPaginas, 1)}
          </span>
          <button
            disabled={pagina >= page.totalPaginas || loading}
            onClick={() => setPagina((value) => value + 1)}
          >
            Siguiente <ChevronRight />
          </button>
        </footer>
      </section>
      {selected && (
        <ResolutionDialog
          report={selected}
          onCancel={() => setSelected(null)}
          onConfirm={resolve}
        />
      )}
    </div>
  );
}

function ResolutionDialog({
  report,
  onCancel,
  onConfirm,
}: {
  report: AdminReport;
  onCancel: () => void;
  onConfirm: (action: ReportAction, observation: string, days: number) => Promise<void>;
}) {
  const available = actionsForTarget(report.tipoContenido);
  const [action, setAction] = useState<ReportAction>(available[0]);
  const [observation, setObservation] = useState("");
  const [days, setDays] = useState(7);
  const [busy, setBusy] = useState(false);
  return (
    <div className={styles.modalBackdrop} role="presentation">
      <form
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          await onConfirm(action, observation, days);
          setBusy(false);
        }}
      >
        <header>
          <div>
            <span className={styles.eyebrow}>Reporte #{report.id}</span>
            <h2>Resolver reporte</h2>
          </div>
          <button type="button" aria-label="Cerrar" onClick={onCancel}>
            <X />
          </button>
        </header>
        <div className={styles.reportEvidence}>
          <ShieldCheck />
          <div>
            <strong>
              {reportTargetLabels[report.tipoContenido]} de @{report.usuarioReportadoUsername}
            </strong>
            <p>
              {report.contenidoSnapshot || report.contexto || "No hay una vista previa disponible."}
            </p>
            {report.detalle && <small>Detalle del reportante: {report.detalle}</small>}
          </div>
        </div>
        <label>
          Acción
          <select
            value={action}
            onChange={(event) => setAction(Number(event.target.value) as ReportAction)}
          >
            {available.map((value) => (
              <option key={value} value={value}>
                {reportActionLabels[value]}
              </option>
            ))}
          </select>
        </label>
        {action === 3 && (
          <label>
            Días de suspensión
            <input
              type="number"
              min={1}
              max={365}
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
            />
          </label>
        )}
        <label>
          Observación administrativa
          <textarea
            rows={4}
            maxLength={500}
            value={observation}
            onChange={(event) => setObservation(event.target.value)}
            placeholder="Motivo o contexto de la decisión…"
          />
        </label>
        <footer>
          <button type="button" className={styles.secondaryButton} onClick={onCancel}>
            Cancelar
          </button>
          <button
            type="submit"
            className={action === 4 || action === 2 ? styles.dangerButton : styles.primaryButton}
            disabled={busy}
          >
            {busy ? "Aplicando…" : "Confirmar decisión"}
          </button>
        </footer>
      </form>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(value),
  );
}

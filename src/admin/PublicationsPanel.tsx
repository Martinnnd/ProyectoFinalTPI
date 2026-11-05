"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff, Pencil, Search, Trash2, X } from "lucide-react";
import {
  adminCategories,
  deleteAdminPublication,
  getAdminPublications,
  setAdminPublicationVisibility,
  updateAdminPublication,
  type AdminPage,
  type AdminPublication,
} from "./adminApi";
import Pagination from "./Pagination";
import AdminActionDialog, { AdminToast } from "./AdminActionDialog";
import styles from "./admin.module.css";

const emptyPage: AdminPage<AdminPublication> = {
  items: [],
  pagina: 1,
  tamanio: 10,
  totalItems: 0,
  totalPaginas: 0,
};

export default function PublicationsPanel() {
  const [page, setPage] = useState(emptyPage);
  const [pagina, setPagina] = useState(1);
  const [texto, setTexto] = useState("");
  const [query, setQuery] = useState("");
  const [categoria, setCategoria] = useState("");
  const [oculta, setOculta] = useState("");
  const [editing, setEditing] = useState<AdminPublication | null>(null);
  const [action, setAction] = useState<{
    kind: "visibility" | "delete";
    item: AdminPublication;
  } | null>(null);
  const [pending, setPending] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(
    (signal?: AbortSignal) => {
      setError("");
      return getAdminPublications(
        {
          pagina,
          tamanio: 10,
          texto: query || undefined,
          categoria: categoria === "" ? undefined : Number(categoria),
          oculta: oculta === "" ? undefined : oculta === "true",
        },
        signal,
      )
        .then(setPage)
        .catch((reason: Error) => {
          if (!signal?.aborted) setError(reason.message);
        });
    },
    [categoria, oculta, pagina, query],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  function search(event: FormEvent) {
    event.preventDefault();
    setPagina(1);
    setQuery(texto.trim());
  }

  async function changeVisibility(item: AdminPublication, motivo: string) {
    setAction(null);
    const success = item.estaOculto
      ? "La publicación fue restaurada."
      : "La publicación fue dada de baja.";
    await run(
      item.id,
      () => setAdminPublicationVisibility(item.id, !item.estaOculto, motivo),
      success,
    );
  }

  async function remove(item: AdminPublication) {
    setAction(null);
    await run(item.id, () => deleteAdminPublication(item.id), "La publicación fue eliminada.");
  }

  async function run(id: number, action: () => Promise<void>, success: string) {
    setPending(id);
    setError("");
    try {
      await action();
      await load();
      setNotice(success);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className={styles.content}>
      <form className={styles.filters} onSubmit={search}>
        <label className={styles.search}>
          <Search />
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Buscar por título, descripción o autor"
          />
        </label>
        <select
          aria-label="Filtrar por categoría"
          value={categoria}
          onChange={(e) => {
            setCategoria(e.target.value);
            setPagina(1);
          }}
        >
          <option value="">Todas las categorías</option>
          {adminCategories.map((label, value) => (
            <option key={label} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrar por visibilidad"
          value={oculta}
          onChange={(e) => {
            setOculta(e.target.value);
            setPagina(1);
          }}
        >
          <option value="">Todos los estados</option>
          <option value="false">Visibles</option>
          <option value="true">Ocultas</option>
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
            <h2>Publicaciones</h2>
            <p>{page.totalItems} resultados encontrados</p>
          </div>
        </header>
        <div className={styles.tableScroll}>
          <table>
            <thead>
              <tr>
                <th>Publicación</th>
                <th>Categoría</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>
                  <span className={styles.srOnly}>Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {page.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.titulo}</strong>
                    <small>
                      @{item.autorUsername} · ID {item.id}
                    </small>
                  </td>
                  <td>{adminCategories[item.categoria] ?? `Categoría ${item.categoria}`}</td>
                  <td>{formatDate(item.fecha)}</td>
                  <td>
                    <span className={item.estaOculto ? styles.badgeDanger : styles.badgeSuccess}>
                      {item.estaOculto ? "Oculta" : "Visible"}
                    </span>
                    {item.motivoOculto && (
                      <small title={item.motivoOculto}>{item.motivoOculto}</small>
                    )}
                  </td>
                  <td>
                    <div className={styles.rowActions}>
                      <button
                        title="Editar"
                        aria-label={`Editar ${item.titulo}`}
                        onClick={() => setEditing(item)}
                      >
                        <Pencil />
                      </button>
                      <button
                        title={item.estaOculto ? "Restaurar" : "Dar de baja"}
                        aria-label={
                          item.estaOculto ? "Restaurar publicación" : "Dar de baja publicación"
                        }
                        disabled={pending === item.id}
                        onClick={() => setAction({ kind: "visibility", item })}
                      >
                        {item.estaOculto ? <Eye /> : <EyeOff />}
                      </button>
                      <button
                        className={styles.dangerAction}
                        title="Eliminar"
                        aria-label="Eliminar publicación"
                        disabled={pending === item.id}
                        onClick={() => setAction({ kind: "delete", item })}
                      >
                        <Trash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!page.items.length && (
          <p className={styles.empty}>No encontramos publicaciones con estos filtros.</p>
        )}
        <Pagination current={page.pagina} total={page.totalPaginas} onChange={setPagina} />
      </section>
      {editing && (
        <EditPublication
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await load();
          }}
        />
      )}
      {action?.kind === "visibility" && (
        <AdminActionDialog
          title={action.item.estaOculto ? "Restaurar publicación" : "Dar de baja la publicación"}
          description={
            action.item.estaOculto
              ? `“${action.item.titulo}” volverá a estar visible para la comunidad.`
              : `“${action.item.titulo}” dejará de ser visible y su autor recibirá una notificación administrativa.`
          }
          confirmLabel={action.item.estaOculto ? "Restaurar" : "Dar de baja"}
          field={
            action.item.estaOculto
              ? undefined
              : {
                  label: "Motivo de la baja",
                  defaultValue: "No cumple los estándares de la comunidad.",
                  placeholder: "Indicá el motivo",
                }
          }
          danger={!action.item.estaOculto}
          onCancel={() => setAction(null)}
          onConfirm={(motivo) => changeVisibility(action.item, motivo)}
        />
      )}
      {action?.kind === "delete" && (
        <AdminActionDialog
          title="Eliminar publicación"
          description={`¿Querés eliminar definitivamente “${action.item.titulo}”? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar definitivamente"
          danger
          onCancel={() => setAction(null)}
          onConfirm={() => remove(action.item)}
        />
      )}
      {notice && <AdminToast message={notice} onClose={() => setNotice("")} />}
    </div>
  );
}

function EditPublication({
  item,
  onClose,
  onSaved,
}: {
  item: AdminPublication;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    titulo: item.titulo,
    descripcion: item.descripcion,
    fecha: item.fecha.slice(0, 10),
    categoria: item.categoria,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await updateAdminPublication(item.id, {
        ...form,
        fecha: new Date(`${form.fecha}T12:00:00`).toISOString(),
      });
      await onSaved();
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className={styles.modalBackdrop} role="presentation">
      <form
        className={styles.modal}
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-title"
      >
        <header>
          <div>
            <span className={styles.eyebrow}>Publicación #{item.id}</span>
            <h2 id="edit-title">Editar recuerdo</h2>
          </div>
          <button type="button" aria-label="Cerrar" onClick={onClose}>
            <X />
          </button>
        </header>
        <label>
          Título
          <input
            required
            maxLength={120}
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          />
        </label>
        <label>
          Descripción
          <textarea
            required
            rows={5}
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          />
        </label>
        <div className={styles.formRow}>
          <label>
            Fecha
            <input
              required
              type="date"
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            />
          </label>
          <label>
            Categoría
            <select
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: Number(e.target.value) })}
            >
              {adminCategories.map((label, value) => (
                <option key={label} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <footer>
          <button type="button" className={styles.secondaryButton} onClick={onClose}>
            Cancelar
          </button>
          <button className={styles.primaryButton} disabled={saving}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </footer>
      </form>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Ban, RotateCcw, Search, ShieldCheck, Trash2, UserRound } from "lucide-react";
import {
  deleteAdminUser,
  getAdminUsers,
  setAdminUserSuspension,
  type AdminPage,
  type AdminUser,
} from "./adminApi";
import Pagination from "./Pagination";
import AdminActionDialog from "./AdminActionDialog";
import { useNotice } from "../context/NoticeProvider";
import styles from "./admin.module.css";

const userTypes = ["Personal", "Marca", "Moderador", "Otro"];
const emptyPage: AdminPage<AdminUser> = {
  items: [],
  pagina: 1,
  tamanio: 10,
  totalItems: 0,
  totalPaginas: 0,
};

export default function UsersPanel({ currentUserId }: { currentUserId: number }) {
  const [page, setPage] = useState(emptyPage);
  const [pagina, setPagina] = useState(1);
  const [texto, setTexto] = useState("");
  const [query, setQuery] = useState("");
  const [estado, setEstado] = useState("");
  const [pending, setPending] = useState<number | null>(null);
  const [action, setAction] = useState<{
    kind: "suspend" | "reactivate" | "delete";
    user: AdminUser;
  } | null>(null);
  const [error, setError] = useState("");
  const showToast = useNotice((state) => state.showToast);

  const load = useCallback(
    (signal?: AbortSignal) => {
      setError("");
      const filters = {
        pagina,
        tamanio: 10,
        texto: query || undefined,
        suspendido: estado === "suspended" ? true : undefined,
        esAdmin: estado === "admin" ? true : undefined,
        eliminado: estado === "deleted" ? true : false,
      };
      return getAdminUsers(filters, signal)
        .then(setPage)
        .catch((reason: Error) => {
          if (!signal?.aborted) setError(reason.message);
        });
    },
    [estado, pagina, query],
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

  async function suspension(user: AdminUser, suspend: boolean, value: string) {
    const days = suspend ? Number(value) : 7;
    setAction(null);
    await run(
      user.id,
      () => setAdminUserSuspension(user.id, suspend, days),
      suspend ? `@${user.username} fue suspendido.` : `@${user.username} fue reactivado.`,
    );
  }

  async function remove(user: AdminUser) {
    setAction(null);
    await run(user.id, () => deleteAdminUser(user.id), `@${user.username} fue dado de baja.`);
  }

  async function run(id: number, action: () => Promise<void>, success: string) {
    setPending(id);
    setError("");
    try {
      await action();
      await load();
      showToast(success, "success");
    } catch (reason) {
      showToast((reason as Error).message, "error");
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
            placeholder="Buscar por nombre, usuario o email"
          />
        </label>
        <select
          aria-label="Filtrar usuarios por estado"
          value={estado}
          onChange={(e) => {
            setEstado(e.target.value);
            setPagina(1);
          }}
        >
          <option value="">Usuarios activos</option>
          <option value="suspended">Suspendidos</option>
          <option value="admin">Administradores</option>
          <option value="deleted">Dados de baja</option>
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
            <h2>Usuarios</h2>
            <p>{page.totalItems} cuentas encontradas</p>
          </div>
        </header>
        <div className={styles.tableScroll}>
          <table>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Tipo</th>
                <th>Registro</th>
                <th>Estado</th>
                <th>
                  <span className={styles.srOnly}>Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {page.items.map((user) => {
                const suspended = Boolean(
                  user.suspendidoHasta && new Date(user.suspendidoHasta) > new Date(),
                );
                const protectedUser =
                  user.esAdmin || user.id === currentUserId || user.estaEliminado;
                return (
                  <tr key={user.id}>
                    <td>
                      <div className={styles.userCell}>
                        <span>
                          <UserRound />
                        </span>
                        <div>
                          <strong>
                            {user.nombre || user.apellido
                              ? `${user.nombre ?? ""} ${user.apellido ?? ""}`.trim()
                              : `@${user.username}`}
                          </strong>
                          <small>
                            @{user.username} · {user.email}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>{userTypes[user.tipo] ?? "Otro"}</td>
                    <td>{formatDate(user.fechaCreacion)}</td>
                    <td>
                      <div className={styles.statusStack}>
                        {user.esAdmin && (
                          <span className={styles.badgeAdmin}>
                            <ShieldCheck /> Admin
                          </span>
                        )}
                        {user.estaEliminado ? (
                          <span className={styles.badgeDanger}>Baja</span>
                        ) : suspended ? (
                          <span className={styles.badgeWarning}>Suspendido</span>
                        ) : (
                          !user.esAdmin && <span className={styles.badgeSuccess}>Activo</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <button
                          title={suspended ? "Reactivar" : "Suspender"}
                          aria-label={
                            suspended
                              ? `Reactivar a ${user.username}`
                              : `Suspender a ${user.username}`
                          }
                          disabled={protectedUser || pending === user.id}
                          onClick={() =>
                            setAction({
                              kind: suspended ? "reactivate" : "suspend",
                              user,
                            })
                          }
                        >
                          {suspended ? <RotateCcw /> : <Ban />}
                        </button>
                        <button
                          className={styles.dangerAction}
                          title="Dar de baja"
                          aria-label={`Dar de baja a ${user.username}`}
                          disabled={protectedUser || pending === user.id}
                          onClick={() => setAction({ kind: "delete", user })}
                        >
                          <Trash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!page.items.length && (
          <p className={styles.empty}>No encontramos usuarios con estos filtros.</p>
        )}
        <Pagination current={page.pagina} total={page.totalPaginas} onChange={setPagina} />
      </section>
      {action && action.kind !== "delete" && (
        <AdminActionDialog
          title={action.kind === "suspend" ? "Suspender usuario" : "Reactivar usuario"}
          description={
            action.kind === "suspend"
              ? `@${action.user.username} no podrá iniciar sesión durante el período indicado.`
              : `@${action.user.username} recuperará el acceso inmediatamente.`
          }
          confirmLabel={action.kind === "suspend" ? "Suspender" : "Reactivar"}
          field={
            action.kind === "suspend"
              ? {
                  label: "Cantidad de días",
                  type: "number",
                  defaultValue: "7",
                  min: 1,
                  max: 365,
                }
              : undefined
          }
          danger={action.kind === "suspend"}
          onCancel={() => setAction(null)}
          onConfirm={(value) => suspension(action.user, action.kind === "suspend", value)}
        />
      )}
      {action?.kind === "delete" && (
        <AdminActionDialog
          title="Dar de baja al usuario"
          description={`@${action.user.username} perderá el acceso y se cerrarán todas sus sesiones activas.`}
          confirmLabel="Dar de baja"
          danger
          onCancel={() => setAction(null)}
          onConfirm={() => remove(action.user)}
        />
      )}
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

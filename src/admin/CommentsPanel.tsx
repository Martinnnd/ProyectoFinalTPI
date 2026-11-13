"use client";

import { useState, type FormEvent } from "react";
import { MessageSquareText, Search, Trash2 } from "lucide-react";
import { deleteAdminComment, getPublicationComments, type AdminComment } from "./adminApi";
import AdminActionDialog from "./AdminActionDialog";
import { useNotice } from "../context/NoticeProvider";
import styles from "./admin.module.css";

export default function CommentsPanel() {
  const [publicationId, setPublicationId] = useState("");
  const [activeId, setActiveId] = useState<number | null>(null);
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<AdminComment | null>(null);
  const [error, setError] = useState("");
  const showToast = useNotice((state) => state.showToast);

  async function search(event: FormEvent) {
    event.preventDefault();
    const id = Number(publicationId);
    if (!Number.isInteger(id) || id < 1) return setError("Ingresá un ID de publicación válido.");
    await load(id);
  }

  async function load(id: number) {
    setLoading(true);
    setError("");
    try {
      const page = await getPublicationComments(id);
      setComments(flatten(page.items));
      setActiveId(id);
    } catch (reason) {
      setError((reason as Error).message);
      setComments([]);
    } finally {
      setLoading(false);
    }
  }

  async function remove(comment: AdminComment) {
    setSelected(null);
    setLoading(true);
    setError("");
    try {
      await deleteAdminComment(comment.id);
      await load(activeId!);
      showToast("El comentario fue eliminado y su autor fue notificado.", "success");
    } catch (reason) {
      showToast((reason as Error).message, "error");
      setLoading(false);
    }
  }

  return (
    <div className={styles.content}>
      <section className={styles.commentIntro}>
        <span>
          <MessageSquareText />
        </span>
        <div>
          <h2>Moderación de comentarios</h2>
          <p>
            Buscá los comentarios por el ID de la publicación. Al eliminarlos, el sistema notificará
            al autor automáticamente.
          </p>
        </div>
      </section>
      <form className={styles.filters} onSubmit={search}>
        <label className={styles.search}>
          <Search />
          <input
            inputMode="numeric"
            value={publicationId}
            onChange={(e) => setPublicationId(e.target.value)}
            placeholder="ID de publicación"
          />
        </label>
        <button className={styles.primaryButton} disabled={loading}>
          {loading ? "Buscando…" : "Buscar comentarios"}
        </button>
      </form>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {activeId && (
        <section className={styles.tablePanel}>
          <header>
            <div>
              <h2>Comentarios de la publicación #{activeId}</h2>
              <p>{comments.length} comentarios cargados</p>
            </div>
          </header>
          <div className={styles.commentsList}>
            {comments.map((comment) => (
              <article key={comment.id} className={comment.comentarioPadreId ? styles.reply : ""}>
                <div>
                  <span className={styles.commentAvatar}>
                    {comment.autor?.username?.slice(0, 1).toUpperCase() ?? "?"}
                  </span>
                  <p>
                    <strong>@{comment.autor?.username ?? "usuario eliminado"}</strong>
                    <small>
                      {formatDate(comment.fechaCreacion)} · #{comment.id}
                      {comment.comentarioPadreId
                        ? ` · respuesta a #${comment.comentarioPadreId}`
                        : ""}
                    </small>
                  </p>
                </div>
                <p>{comment.estaEliminado ? <em>Comentario eliminado</em> : comment.contenido}</p>
                <button
                  className={styles.dangerAction}
                  disabled={loading || comment.estaEliminado}
                  onClick={() => setSelected(comment)}
                >
                  <Trash2 /> Eliminar
                </button>
              </article>
            ))}
          </div>
          {!comments.length && (
            <p className={styles.empty}>Esta publicación no tiene comentarios visibles.</p>
          )}
        </section>
      )}
      {selected && (
        <AdminActionDialog
          title="Eliminar comentario"
          description={`El comentario #${selected.id} se ocultará del hilo y su autor recibirá una notificación administrativa.`}
          confirmLabel="Eliminar comentario"
          danger
          onCancel={() => setSelected(null)}
          onConfirm={() => remove(selected)}
        />
      )}
    </div>
  );
}

function flatten(comments: AdminComment[]): AdminComment[] {
  return comments.flatMap((comment) => [comment, ...flatten(comment.respuestas ?? [])]);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
}

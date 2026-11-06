import { apiRequest } from "./apiRequest";
import { publicationRequest } from "./publicationsApi";
import { getSesion } from "./api";
import type { CommentReaction, MemoryComment } from "./socialTypes";

type RemoteComment = {
  id: number;
  publicacionId: number;
  comentarioPadreId?: number | null;
  contenido?: string | null;
  fechaCreacion: string;
  autor?: { id: number; username: string } | null;
  estaEliminado?: boolean;
  puedeEliminar?: boolean;
  cantidadRespuestas?: number;
  siguienteCursorRespuestas?: string | null;
  reacciones: Partial<Record<CommentReaction, number>>;
  reaccionActual?: CommentReaction | null;
  respuestas?: RemoteComment[];
};

function toComment(data: RemoteComment, memoryId: string): MemoryComment {
  return {
    id: String(data.id),
    memoryId,
    parentId: data.comentarioPadreId ? String(data.comentarioPadreId) : undefined,
    author: data.autor?.username,
    text: data.contenido ?? undefined,
    createdAt: data.fechaCreacion,
    deleted: data.estaEliminado ?? false,
    canDelete: data.puedeEliminar ?? false,
    replyCount: data.cantidadRespuestas ?? 0,
    repliesCursor: data.siguienteCursorRespuestas,
    reactions: data.reacciones ?? {},
    viewerReaction: data.reaccionActual ?? undefined,
  };
}

function flattenComments(items: RemoteComment[], memoryId: string): MemoryComment[] {
  return items.flatMap((item) => [
    toComment(item, memoryId),
    ...(item.respuestas ?? []).map((reply) => toComment(reply, memoryId)),
  ]);
}

export async function getComments(memoryId: string, cursor?: string, signal?: AbortSignal) {
  const query = new URLSearchParams({ limite: "20" });
  if (cursor) query.set("cursor", cursor);
  const data = await publicationRequest<{ items: RemoteComment[]; siguienteCursor: string | null }>(
    `/${memoryId}/comentarios?${query}`,
    { signal },
  );
  return { items: flattenComments(data.items, memoryId), cursor: data.siguienteCursor };
}

export async function getCommentReplies(
  memoryId: string,
  commentId: string,
  cursor?: string | null,
  signal?: AbortSignal,
) {
  const query = new URLSearchParams({ publicacionId: memoryId, limite: "3" });
  if (cursor) query.set("cursor", cursor);
  const data = await apiRequest<{ items: RemoteComment[]; siguienteCursor: string | null }>(
    `/api/comentarios/respuestas/${commentId}?${query}`,
    { signal },
  );
  return { items: flattenComments(data.items, memoryId), cursor: data.siguienteCursor };
}

export async function createComment(memoryId: string, text: string, parentId?: string) {
  if (!getSesion()) throw new Error("Tenés que iniciar sesión para comentar.");
  const data = await publicationRequest<RemoteComment>(`/${memoryId}/comentarios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contenido: text.trim(),
      comentarioPadreId: parentId ? Number(parentId) : null,
    }),
  });
  return toComment(data, memoryId);
}

export async function setCommentReaction(
  memoryId: string,
  commentId: string,
  reaction: CommentReaction,
) {
  if (!getSesion()) throw new Error("Tenés que iniciar sesión para reaccionar.");
  const data = await apiRequest<RemoteComment>(
    `/api/comentarios/${commentId}/reaccion?${new URLSearchParams({ publicacionId: memoryId })}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo: reaction }),
    },
  );
  return toComment(data, memoryId);
}

export async function removeCommentReaction(memoryId: string, commentId: string) {
  if (!getSesion()) throw new Error("Tenés que iniciar sesión para reaccionar.");
  const data = await apiRequest<RemoteComment>(
    `/api/comentarios/${commentId}/reaccion?${new URLSearchParams({ publicacionId: memoryId })}`,
    {
      method: "DELETE",
    },
  );
  return toComment(data, memoryId);
}

export async function deleteComment(memoryId: string, commentId: string) {
  if (!getSesion()) throw new Error("Tenés que iniciar sesión para eliminar un comentario.");
  await apiRequest<void>(
    `/api/comentarios/${commentId}?${new URLSearchParams({ publicacionId: memoryId })}`,
    { method: "DELETE" },
  );
}

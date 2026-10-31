import { ChevronDown, ChevronRight, SmilePlus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  commentReactions,
  reactionEmoji,
  type CommentReaction,
  type MemoryComment,
} from "../../socialTypes";
import ReactionPicker from "./ReactionPicker";

export default function CommentItem({
  comment,
  comments,
  interactive,
  onReply,
  onReaction,
  onLoadReplies,
  onDelete,
  depth = 0,
}: {
  comment: MemoryComment;
  comments: MemoryComment[];
  interactive: boolean;
  onReply: (parentId: string, text: string) => void | Promise<void>;
  onReaction: (commentId: string, reaction: CommentReaction) => void | Promise<void>;
  onLoadReplies: (commentId: string) => void | Promise<void>;
  onDelete: (commentId: string) => void | Promise<void>;
  depth?: number;
}) {
  const replies = comments.filter((reply) => reply.parentId === comment.id);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyDraft, setReplyDraft] = useState("");
  const [replySending, setReplySending] = useState(false);
  const [repliesExpanded, setRepliesExpanded] = useState(replies.length > 0);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState("");
  const [expanded, setExpanded] = useState(true);
  const controls = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (replies.length > 0) setRepliesExpanded(true);
  }, [replies.length]);

  useEffect(() => {
    if (!pickerOpen) return;
    function close(event: PointerEvent | KeyboardEvent) {
      if (event instanceof KeyboardEvent && event.key !== "Escape") return;
      if (event instanceof PointerEvent && controls.current?.contains(event.target as Node)) return;
      setPickerOpen(false);
    }
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [pickerOpen]);

  const time = new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(comment.createdAt));
  const remainingReplies = Math.max(0, comment.replyCount - replies.length);

  async function showReplies() {
    setActionError("");
    if (replies.length > 0) {
      setRepliesExpanded(true);
      return;
    }
    setRepliesLoading(true);
    try {
      await onLoadReplies(comment.id);
      setRepliesExpanded(true);
    } catch (reason) {
      setActionError(
        reason instanceof Error ? reason.message : "No se pudieron cargar las respuestas.",
      );
    } finally {
      setRepliesLoading(false);
    }
  }

  async function loadMoreReplies() {
    setRepliesLoading(true);
    setActionError("");
    try {
      await onLoadReplies(comment.id);
    } catch (reason) {
      setActionError(
        reason instanceof Error ? reason.message : "No se pudieron cargar más respuestas.",
      );
    } finally {
      setRepliesLoading(false);
    }
  }

  return (
    <article className={`comment-item${comment.deleted ? " is-deleted" : ""}`}>
      <header>
        <button
          type="button"
          className="comment-collapse-button"
          aria-label={expanded ? "Contraer comentario" : "Expandir comentario"}
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>
        {comment.deleted ? (
          <em className="comment-deleted-label">Comentario eliminado</em>
        ) : (
          <>
            <span className="comment-avatar" aria-hidden="true">
              {comment.author?.slice(0, 1)}
            </span>
            <div>
              <strong>{comment.author}</strong>
              <time dateTime={comment.createdAt}>{time}</time>
            </div>
          </>
        )}
      </header>
      {expanded && (
        <>
          {!comment.deleted && <p>{comment.text}</p>}
          {!comment.deleted && (
            <div className="comment-footer">
              <div className="comment-reaction-summary" aria-label="Reacciones del comentario">
                {commentReactions.map((reaction) => {
                  const count = comment.reactions[reaction] ?? 0;
                  return count ? (
                    <span key={reaction}>
                      {reactionEmoji[reaction]} {count}
                    </span>
                  ) : null;
                })}
              </div>
              {interactive && (
                <div className="comment-reaction-controls" ref={controls}>
                  <button
                    type="button"
                    className="comment-reply-button"
                    aria-expanded={replyOpen}
                    onClick={() => setReplyOpen((value) => !value)}
                  >
                    Responder
                  </button>
                  <button
                    type="button"
                    className="comment-react-button"
                    aria-label="Reaccionar al comentario"
                    aria-haspopup="true"
                    aria-expanded={pickerOpen}
                    onClick={() => setPickerOpen((value) => !value)}
                  >
                    <SmilePlus size={15} /> Reaccionar
                  </button>
                  {comment.canDelete && (
                    <button
                      type="button"
                      className="comment-delete-button"
                      disabled={deleting}
                      onClick={async () => {
                        if (
                          !window.confirm(
                            "¿Querés eliminar este comentario? Las respuestas se conservarán.",
                          )
                        )
                          return;
                        setDeleting(true);
                        setActionError("");
                        try {
                          await onDelete(comment.id);
                        } catch (reason) {
                          setActionError(
                            reason instanceof Error
                              ? reason.message
                              : "No se pudo eliminar el comentario.",
                          );
                        } finally {
                          setDeleting(false);
                        }
                      }}
                    >
                      <Trash2 size={14} /> {deleting ? "Eliminando…" : "Eliminar"}
                    </button>
                  )}
                  {pickerOpen && (
                    <ReactionPicker
                      selected={comment.viewerReaction}
                      onSelect={async (reaction) => {
                        setActionError("");
                        try {
                          await onReaction(comment.id, reaction);
                          setPickerOpen(false);
                        } catch (reason) {
                          setActionError(
                            reason instanceof Error
                              ? reason.message
                              : "No se pudo guardar la reacción.",
                          );
                        }
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          )}
          {actionError && (
            <p className="comment-action-error" role="alert">
              {actionError}
            </p>
          )}
          {interactive && !comment.deleted && replyOpen && (
            <form
              className="comment-reply-form"
              onSubmit={async (event) => {
                event.preventDefault();
                if (!replyDraft.trim() || replySending) return;
                setReplySending(true);
                setActionError("");
                try {
                  await onReply(comment.id, replyDraft);
                  setReplyDraft("");
                  setReplyOpen(false);
                  setRepliesExpanded(true);
                } catch (reason) {
                  setActionError(
                    reason instanceof Error ? reason.message : "No se pudo publicar la respuesta.",
                  );
                } finally {
                  setReplySending(false);
                }
              }}
            >
              <label className="sr-only" htmlFor={`reply-${comment.id}`}>
                Responder a {comment.author}
              </label>
              <textarea
                id={`reply-${comment.id}`}
                value={replyDraft}
                maxLength={1000}
                required
                disabled={replySending}
                onChange={(event) => setReplyDraft(event.target.value)}
                placeholder={`Responder a ${comment.author}…`}
              />
              <button
                className="primary-button"
                type="submit"
                disabled={replySending || !replyDraft.trim()}
              >
                {replySending ? "Enviando…" : "Responder"}
              </button>
            </form>
          )}
          {comment.replyCount > 0 && !repliesExpanded && (
            <button
              type="button"
              className="comment-load-replies"
              disabled={repliesLoading}
              onClick={() => void showReplies()}
            >
              {repliesLoading
                ? "Cargando…"
                : `Ver ${comment.replyCount} ${comment.replyCount === 1 ? "respuesta" : "respuestas"}`}
            </button>
          )}
          {repliesExpanded && replies.length > 0 && (
            <div className={`comment-replies${depth >= 2 ? " is-depth-capped" : ""}`}>
              {replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  comments={comments}
                  interactive={interactive}
                  onReply={onReply}
                  onReaction={onReaction}
                  onLoadReplies={onLoadReplies}
                  onDelete={onDelete}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
          {repliesExpanded && comment.repliesCursor && (
            <button
              type="button"
              className="comment-load-replies"
              disabled={repliesLoading}
              onClick={() => void loadMoreReplies()}
            >
              {repliesLoading ? "Cargando…" : `Ver ${Math.min(3, remainingReplies)} respuestas más`}
            </button>
          )}
          {repliesExpanded && replies.length > 0 && (
            <button
              type="button"
              className="comment-hide-replies"
              onClick={() => setRepliesExpanded(false)}
            >
              Ocultar respuestas
            </button>
          )}
        </>
      )}
    </article>
  );
}

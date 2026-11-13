import { useEffect, useRef, useState } from "react";
import {
  createComment,
  deleteComment,
  getCommentReplies,
  getComments,
  removeCommentReaction,
  setCommentReaction,
} from "../../commentsApi";
import type { CommentReaction, MemoryComment } from "../../socialTypes";
import CommentsSection from "./CommentsSection";

function mergeComments(current: MemoryComment[], incoming: MemoryComment[]) {
  const merged = new Map(current.map((comment) => [comment.id, comment]));
  incoming.forEach((comment) => merged.set(comment.id, { ...merged.get(comment.id), ...comment }));
  return [...merged.values()];
}

export default function RemoteComments({
  memoryId,
  onCommentCreated,
  onCommentDeleted,
}: {
  memoryId: string;
  onCommentCreated?: () => void;
  onCommentDeleted?: () => void;
}) {
  const [comments, setComments] = useState<MemoryComment[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const busy = useRef(false);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => {
    const request = new AbortController();
    controller.current = request;
    setLoading(true);
    setError("");
    setComments([]);
    setCursor(null);
    getComments(memoryId, undefined, request.signal)
      .then((page) => {
        if (request.signal.aborted) return;
        setComments(page.items);
        setCursor(page.cursor);
      })
      .catch((reason: Error) => {
        if (!request.signal.aborted) setError(reason.message);
      })
      .finally(() => {
        if (!request.signal.aborted) setLoading(false);
      });
    return () => request.abort();
  }, [memoryId, retry]);

  async function more() {
    if (!cursor || busy.current) return;
    busy.current = true;
    setLoading(true);
    setError("");
    const request = controller.current!;
    try {
      const page = await getComments(memoryId, cursor, request.signal);
      if (request.signal.aborted) return;
      setComments((current) => mergeComments(current, page.items));
      setCursor(page.cursor);
    } catch (reason) {
      if (!request.signal.aborted) setError((reason as Error).message);
    } finally {
      busy.current = false;
      if (!request.signal.aborted) setLoading(false);
    }
  }

  async function loadReplies(commentId: string) {
    const parent = comments.find((comment) => comment.id === commentId);
    const page = await getCommentReplies(memoryId, commentId, parent?.repliesCursor);
    setComments((current) =>
      mergeComments(
        current.map((comment) =>
          comment.id === commentId ? { ...comment, repliesCursor: page.cursor } : comment,
        ),
        page.items,
      ),
    );
  }

  async function addComment(_: string, text: string, parentId?: string) {
    const comment = await createComment(memoryId, text, parentId);
    setComments((current) => {
      const updated = parentId
        ? current.map((item) =>
            item.id === parentId ? { ...item, replyCount: item.replyCount + 1 } : item,
          )
        : current;
      return parentId
        ? mergeComments(updated, [comment])
        : [comment, ...updated.filter((item) => item.id !== comment.id)];
    });
    onCommentCreated?.();
  }

  async function reactToComment(_: string, commentId: string, reaction: CommentReaction) {
    const current = comments.find((comment) => comment.id === commentId);
    const updated =
      current?.viewerReaction === reaction
        ? await removeCommentReaction(memoryId, commentId)
        : await setCommentReaction(memoryId, commentId, reaction);
    setComments((items) =>
      items.map((item) => (item.id === commentId ? { ...item, ...updated } : item)),
    );
  }

  async function remove(commentId: string) {
    await deleteComment(memoryId, commentId);
    setComments((current) => {
      const target = current.find((comment) => comment.id === commentId);
      const withoutLeaf = target?.replyCount === 0;
      const next = withoutLeaf
        ? current.filter((comment) => comment.id !== commentId)
        : current.map((comment) =>
            comment.id === commentId
              ? {
                  ...comment,
                  deleted: true,
                  canDelete: false,
                  author: undefined,
                  text: undefined,
                  reactions: {},
                  viewerReaction: undefined,
                }
              : comment,
          );
      if (withoutLeaf && target?.parentId) {
        return next.map((comment) =>
          comment.id === target.parentId
            ? { ...comment, replyCount: Math.max(0, comment.replyCount - 1) }
            : comment,
        );
      }
      return next;
    });
    onCommentDeleted?.();
  }

  return (
    <>
      {loading && !comments.length && <p role="status">Cargando comentarios…</p>}
      {error && (
        <p role="alert">
          {error}{" "}
          <button
            type="button"
            onClick={() => (cursor ? void more() : setRetry((value) => value + 1))}
          >
            Reintentar
          </button>
        </p>
      )}
      <CommentsSection
        memoryId={memoryId}
        comments={comments}
        onAddComment={addComment}
        onReaction={reactToComment}
        onLoadReplies={loadReplies}
        onDeleteComment={remove}
      />
      {cursor && (
        <button type="button" disabled={loading} onClick={() => void more()}>
          Ver más comentarios
        </button>
      )}
    </>
  );
}

import { useEffect, useRef, useState } from "react";
import {
  createComment,
  getComments,
  removeCommentReaction,
  setCommentReaction,
} from "../../commentsApi";
import type { CommentReaction, MemoryComment } from "../../socialTypes";
import CommentsSection from "./CommentsSection";

export default function RemoteComments({
  memoryId,
  onCommentCreated,
}: {
  memoryId: string;
  onCommentCreated?: () => void;
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
      setComments((current) => [
        ...new Map([...current, ...page.items].map((comment) => [comment.id, comment])).values(),
      ]);
      setCursor(page.cursor);
    } catch (reason) {
      if (!request.signal.aborted) setError((reason as Error).message);
    } finally {
      busy.current = false;
      if (!request.signal.aborted) setLoading(false);
    }
  }

  async function addComment(_: string, text: string, parentId?: string) {
    const comment = await createComment(memoryId, text, parentId);
    setComments((current) => parentId
      ? [...current.filter((item) => item.id !== comment.id), comment]
      : [comment, ...current.filter((item) => item.id !== comment.id)]);
    onCommentCreated?.();
  }

  async function reactToComment(_: string, commentId: string, reaction: CommentReaction) {
    const current = comments.find((comment) => comment.id === commentId);
    const updated = current?.viewerReaction === reaction
      ? await removeCommentReaction(memoryId, commentId)
      : await setCommentReaction(memoryId, commentId, reaction);
    setComments((items) => items.map((item) => item.id === commentId ? updated : item));
  }

  return (
    <>
      {loading && !comments.length && <p role="status">Cargando comentarios…</p>}
      {error && (
        <p role="alert">
          {error}{" "}
          <button type="button" onClick={() => cursor ? void more() : setRetry((value) => value + 1)}>
            Reintentar
          </button>
        </p>
      )}
      <CommentsSection
        memoryId={memoryId}
        comments={comments}
        onAddComment={addComment}
        onReaction={reactToComment}
      />
      {cursor && (
        <button type="button" disabled={loading} onClick={() => void more()}>
          Ver más comentarios
        </button>
      )}
    </>
  );
}

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import type {
  CommentReaction,
  MemoryComment,
} from "../../socialTypes";
import CommentItem from "./CommentItem";
import { useAuth } from "../auth/AuthProvider";

export default function CommentsSection({
  memoryId,
  comments,
  onAddComment,
  onReaction,
}: {
  memoryId: string;
  comments: MemoryComment[];
  onAddComment: (memoryId: string, text: string, parentId?: string) => void;
  onReaction: (
    memoryId: string,
    commentId: string,
    reaction: CommentReaction,
  ) => void;
}) {
  const { isAuthenticated } = useAuth();
  const [draft, setDraft] = useState("");
  const [commentsExpanded, setCommentsExpanded] = useState(true);
  const fieldId = useId();

  useEffect(() => {
    setDraft("");
    setCommentsExpanded(true);
  }, [memoryId]);

  return (
    <section className="post-comments" aria-label="Comentarios">
      <div className="comments-heading">
        <h4>La conversación</h4>
        <button
          type="button"
          className="comments-toggle"
          aria-expanded={commentsExpanded}
          onClick={() => setCommentsExpanded((expanded) => !expanded)}
        >
          {commentsExpanded
            ? "Ocultar comentarios"
            : `Mostrar comentarios (${comments.length})`}
        </button>
      </div>
      {commentsExpanded && (
        <>
          <div className="comment-list">
            {comments
              .filter((comment) => !comment.parentId)
              .map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  comments={comments}
                  interactive={isAuthenticated}
                  onReply={(parentId, text) =>
                    onAddComment(memoryId, text, parentId)
                  }
                  onReaction={(commentId, reaction) =>
                    onReaction(memoryId, commentId, reaction)
                  }
                />
              ))}
          </div>
          {isAuthenticated ? <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!draft.trim()) return;
              onAddComment(memoryId, draft);
              setDraft("");
            }}
          >
            <label className="sr-only" htmlFor={fieldId}>
              Comentar el recuerdo
            </label>
            <textarea
              id={fieldId}
              value={draft}
              maxLength={1000}
              required
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Comentá este recuerdo…"
            />
            <button className="primary-button" type="submit">
              Comentar
            </button>
          </form> : <p className="comments-auth-required"><Link href="/auth/login?returnTo=/explorar">Iniciá sesión</Link> para comentar o reaccionar.</p>}
        </>
      )}
    </section>
  );
}

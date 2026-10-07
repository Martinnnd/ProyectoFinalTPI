import { ChevronDown, ChevronRight, SmilePlus } from "lucide-react";
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
  onReply,
  onReaction,
}: {
  comment: MemoryComment;
  comments: MemoryComment[];
  onReply: (parentId: string, text: string) => void;
  onReaction: (commentId: string, reaction: CommentReaction) => void;
}) {
  const replies = comments.filter((reply) => reply.parentId === comment.id);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyDraft, setReplyDraft] = useState("");
  const [expanded, setExpanded] = useState(true);
  const controls = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pickerOpen) return;
    function close(event: PointerEvent | KeyboardEvent) {
      if (event instanceof KeyboardEvent && event.key !== "Escape") return;
      if (
        event instanceof PointerEvent &&
        controls.current?.contains(event.target as Node)
      )
        return;
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

  return (
    <article className="comment-item">
      <header>
        <button
          type="button"
          className="comment-collapse-button"
          aria-label={expanded ? "Contraer comentario" : "Expandir comentario"}
          aria-expanded={expanded}
          onClick={() => setExpanded((isExpanded) => !isExpanded)}
        >
          {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>
        <span className="comment-avatar" aria-hidden="true">
          {comment.author.slice(0, 1)}
        </span>
        <div>
          <strong>{comment.author}</strong>
          <time dateTime={comment.createdAt}>{time}</time>
        </div>
      </header>
      {expanded && (
        <>
          <p>{comment.text}</p>
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
            <div className="comment-reaction-controls" ref={controls}>
              <button
                type="button"
                className="comment-reply-button"
                aria-expanded={replyOpen}
                onClick={() => setReplyOpen((open) => !open)}
              >
                Responder
              </button>
              <button
                type="button"
                className="comment-react-button"
                aria-label="Reaccionar al comentario"
                aria-haspopup="true"
                aria-expanded={pickerOpen}
                onClick={() => setPickerOpen((open) => !open)}
              >
                <SmilePlus size={15} />
                Reaccionar
              </button>
              {pickerOpen && (
                <ReactionPicker
                  selected={comment.viewerReaction}
                  onSelect={(reaction) => {
                    onReaction(comment.id, reaction);
                    setPickerOpen(false);
                  }}
                />
              )}
            </div>
          </div>
          {replyOpen && (
            <form
              className="comment-reply-form"
              onSubmit={(event) => {
                event.preventDefault();
                if (!replyDraft.trim()) return;
                onReply(comment.id, replyDraft);
                setReplyDraft("");
                setReplyOpen(false);
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
                onChange={(event) => setReplyDraft(event.target.value)}
                placeholder={`Responder a ${comment.author}…`}
              />
              <button className="primary-button" type="submit">
                Responder
              </button>
            </form>
          )}
          {replies.length > 0 && (
            <div className="comment-replies">
              {replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  comments={comments}
                  onReply={onReply}
                  onReaction={onReaction}
                />
              ))}
            </div>
          )}
        </>
      )}
    </article>
  );
}

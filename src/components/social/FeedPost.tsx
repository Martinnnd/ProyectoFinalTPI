import { MapPin, Repeat2 } from "lucide-react";
import MemoryOwnerActions from "../MemoryOwnerActions";
import PostMedia, { PostMusic } from "../PostMedia";
import { youtubeId } from "../../media";
import type { CommentReaction, MemoryComment } from "../../socialTypes";
import type { Memory } from "../../types";
import CommentsSection from "./CommentsSection";
import PostActions from "./PostActions";
import PostRating from "./PostRating";

export default function FeedPost({
  memory,
  selected,
  following,
  liked,
  comments,
  rating,
  reposted,
  saved,
  onDelete,
  onEdit,
  onProfile,
  onFollow,
  onOpen,
  onMap,
  onRate,
  onLike,
  onRepost,
  onSave,
  onAddComment,
  onReaction,
}: {
  memory: Memory;
  selected: boolean;
  following: boolean;
  liked: boolean;
  comments: MemoryComment[];
  rating?: number;
  reposted: boolean;
  saved: boolean;
  onDelete: (memory: Memory) => void;
  onEdit: (memory: Memory) => void;
  onProfile: (memory: Memory) => void;
  onFollow: (author: string) => void;
  onOpen: (memory: Memory) => void;
  onMap: (memory: Memory) => void;
  onRate: (value: number) => void;
  onLike: () => void;
  onRepost: () => void;
  onSave: () => void;
  onAddComment: (memoryId: string, text: string, parentId?: string) => void;
  onReaction: (
    memoryId: string,
    commentId: string,
    reaction: CommentReaction,
  ) => void;
}) {
  const hasInlineImage =
    memory.image && !memory.media && !youtubeId(memory.image);

  return (
    <article className="feed-post">
      {memory.repost && (
        <div style={{ padding: '0.5rem 1rem 0', fontSize: '0.85rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Repeat2 size={14} />
          <span>Has reposteado esto</span>
        </div>
      )}
      <header>
        <button
          className="social-avatar author-avatar"
          aria-label={`Ver perfil de ${!memory.repost?.comment && memory.repost ? memory.repost.author : (memory.source === "local" ? "Vos" : memory.author)}`}
          onClick={() => onProfile(memory)}
        >
          {(!memory.repost?.comment && memory.repost ? memory.repost.author : (memory.source === "local" ? "Vos" : memory.author)).slice(0, 1)}
        </button>
        <div>
          <button className="author-name" onClick={() => onProfile(memory)}>
            <strong>{!memory.repost?.comment && memory.repost ? memory.repost.author : (memory.source === "local" ? "Vos" : memory.author)}</strong>
          </button>
          <small>
            {memory.source === "demo" ? "" : "Recuerdo local"} {memory.year}
          </small>
        </div>
        {memory.source === "demo" && (
          <button
            className="follow-button"
            aria-pressed={following}
            onClick={() => onFollow(memory.author)}
          >
            {following ? "Siguiendo" : "Seguir"}
          </button>
        )}
        <MemoryOwnerActions
          memory={memory}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </header>

      {memory.repost?.comment && (
        <div style={{ padding: '0 1rem 0.5rem', fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>
          {memory.repost.comment}
        </div>
      )}

      <div style={memory.repost?.comment ? { border: '1px solid var(--border, #ccc)', margin: '0 1rem 1rem', borderRadius: '8px', overflow: 'hidden' } : undefined}>
        {memory.repost?.comment && (
          <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--border, #ccc)', background: 'var(--surface-hover, rgba(0,0,0,0.03))', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="social-avatar" style={{ width: '20px', height: '20px', fontSize: '0.7rem' }}>{memory.repost.author.slice(0, 1)}</div>
            <span><strong>{memory.repost.author}</strong></span>
          </div>
        )}

        <PostMusic music={memory.music} />
        <button
          className={hasInlineImage ? `post-content with-image${selected ? " is-open" : ""}` : "post-content"}
          onClick={() => onOpen(memory)}
        >
          <span className="post-text">
            <h3>{memory.title}</h3>
            <p className={selected ? "" : "post-excerpt"}>{memory.description}</p>
            {!selected && (
              <span className="read-post">Leer recuerdo completo →</span>
            )}
          </span>
          {hasInlineImage && (
            <img
              className="post-image"
              src={memory.image}
              alt={`Fotografía de ${memory.title} en ${memory.place}, ${memory.year}`}
              loading="lazy"
              decoding="async"
              onError={(event) => {
                event.currentTarget.hidden = true;
              }}
            />
          )}
        </button>
        {(memory.media || (memory.image && youtubeId(memory.image))) && (
          <PostMedia memory={memory} />
        )}
        <button className="post-place" onClick={() => onMap(memory)}>
          <MapPin size={14} />
          {memory.place} · {memory.year}
        </button>
      </div>

      <PostRating
        memoryTitle={memory.title}
        value={rating}
        onRate={onRate}
      />
      <PostActions
        memoryTitle={memory.title}
        liked={liked}
        commentCount={comments.length}
        reposted={reposted}
        saved={saved}
        onLike={onLike}
        onOpenComments={() => onOpen(memory)}
        onRepost={onRepost}
        onSave={onSave}
      />
      {selected && (
        <CommentsSection
          memoryId={memory.id}
          comments={comments}
          onAddComment={onAddComment}
          onReaction={onReaction}
        />
      )}
    </article>
  );
}

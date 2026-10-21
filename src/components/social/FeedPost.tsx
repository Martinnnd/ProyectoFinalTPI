import { Ellipsis, MapPin, Pencil, Repeat2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import PostMedia, { PostMusic } from "../PostMedia";
import { youtubeId } from "../../media";
import type { Memory } from "../../types";
import { isOwnMemory, getMemoryAuthorDisplay } from "../../api";
import RemoteComments from './RemoteComments';
import PostActions from "./PostActions";
import PostRating from "./PostRating";
import { memoryHashtags } from "../../hashtags";

export default function FeedPost({
  memory,
  selected,
  following,
  liked,
  commentMemoryId,
  rating,
  canRate,
  reposted,
  saved,
  quotedMemory,
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
  onHashtag,
}: {
  memory: Memory;
  selected: boolean;
  following: boolean;
  liked: boolean;
  commentMemoryId?: string;
  rating?: number;
  canRate: boolean;
  reposted: boolean;
  saved: boolean;
  quotedMemory?: Memory;
  onDelete: (memory: Memory) => void;
  onEdit: (memory: Memory) => void;
  onProfile: (memory: Memory) => void;
  onFollow: (author: string, authorId?: number) => void;
  onOpen: (memory: Memory) => void;
  onMap: (memory: Memory) => void;
  onRate: (value: number) => void;
  onLike: () => void;
  onRepost: () => void;
  onSave: () => void;
  onHashtag: (tag: string) => void;
}) {
  const [commentCount, setCommentCount] = useState(memory.commentCount ?? 0);
  useEffect(() => setCommentCount(memory.commentCount ?? 0), [memory.id, memory.commentCount]);
  const hasInlineImage =
    memory.image && !memory.media && !youtubeId(memory.image);

  const isSimpleRepost = Boolean(memory.repost && !memory.repost.comment);

  const isReposterOwn = isOwnMemory(memory);
  const reposterDisplay = isReposterOwn ? "Vos" : getMemoryAuthorDisplay(memory);

  const originalAuthor = memory.repost?.author;
  const isOriginalAuthorOwn = originalAuthor ? isOwnMemory({ author: originalAuthor }) : false;

  const headerAuthor = isSimpleRepost && originalAuthor ? originalAuthor : memory.author;
  const isHeaderAuthorOwn = isSimpleRepost && originalAuthor ? isOriginalAuthorOwn : isReposterOwn;
  const displayAuthor = isHeaderAuthorOwn ? "Vos" : getMemoryAuthorDisplay({ author: headerAuthor });

  const profileMemory: Memory = isSimpleRepost && originalAuthor
    ? { ...memory, author: originalAuthor, source: isOriginalAuthorOwn ? "local" : "community" }
    : memory;

  return (
    <article className="feed-post">
      {isSimpleRepost && (
        <div className="repost-header-badge" style={{ padding: '0.5rem 1rem 0', fontSize: '0.85rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Repeat2 size={14} />
          <span>{isReposterOwn ? "Has reposteado" : `${reposterDisplay} ha reposteado`}</span>
        </div>
      )}
      <header>
        <button
          className="social-avatar author-avatar"
          aria-label={`Ver perfil de ${displayAuthor}`}
          onClick={() => onProfile(profileMemory)}
        >
          {displayAuthor.slice(0, 1)}
        </button>
        <div>
          <button className="author-name" onClick={() => onProfile(profileMemory)}>
            <strong>{displayAuthor}</strong>
          </button>
          <small>
            {isHeaderAuthorOwn ? "Recuerdo local" : (memory.source === "demo" ? "" : "Recuerdo de la comunidad")} {memory.year}
          </small>
        </div>
        {!isHeaderAuthorOwn && (
          <button
            className="follow-button"
            aria-pressed={following}
            onClick={() => onFollow(headerAuthor, isSimpleRepost ? memory.repost?.authorId : memory.authorId)}
          >
            {following ? "Siguiendo" : "Seguir"}
          </button>
        )}
        {isOwnMemory(memory) && (
          <details className="compact-menu feed-owner-menu">
            <summary aria-label="Opciones de publicación" title="Opciones de publicación"><Ellipsis size={20} aria-hidden="true" /></summary>
            <div className="feed-owner-menu-options">
              <button type="button" onClick={event => { event.currentTarget.closest("details")?.removeAttribute("open"); onEdit(memory); }}><Pencil size={15} /> Editar</button>
              <button type="button" onClick={event => { event.currentTarget.closest("details")?.removeAttribute("open"); onDelete(memory); }}><Trash2 size={15} /> Eliminar</button>
            </div>
          </details>
        )}
      </header>

      {memory.repost?.comment && (
        <div
          style={{
            padding: '0 1rem 0.5rem',
            fontSize: '0.95rem',
            whiteSpace: 'pre-wrap',
            cursor: !selected ? 'pointer' : undefined,
          }}
          onClick={!selected ? () => onOpen(memory) : undefined}
          title={!selected ? "Ver publicación con cita" : undefined}
        >
          {memory.repost.comment}
        </div>
      )}

      {(() => {
        const isQuote = Boolean(memory.repost?.comment);
        const targetQuoted: Memory = isQuote
          ? (quotedMemory || {
              ...memory,
              id: memory.repost?.originalId || memory.id,
              title: memory.title,
              description: memory.description,
              author: memory.repost?.author || "Desconocido",
              repost: undefined,
            })
          : memory;
        const targetHasInlineImage =
          targetQuoted.image && !targetQuoted.media && !youtubeId(targetQuoted.image);

        return (
          <div
            className={isQuote ? "quoted-post-box" : undefined}
            onClick={isQuote ? (e) => {
              e.stopPropagation();
              onOpen(targetQuoted);
            } : undefined}
            style={isQuote ? {
              border: '1px solid var(--border, #ccc)',
              margin: '0 1rem 1rem',
              borderRadius: '8px',
              overflow: 'hidden',
              cursor: 'pointer',
            } : undefined}
            title={isQuote ? `Ver publicación original de ${getMemoryAuthorDisplay({ author: targetQuoted.author })}` : undefined}
          >
            {isQuote && (
              <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--border, #ccc)', background: 'var(--surface-hover, rgba(0,0,0,0.03))', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className="social-avatar" style={{ width: '20px', height: '20px', fontSize: '0.7rem' }}>
                  {getMemoryAuthorDisplay({ author: targetQuoted.author }).slice(0, 1)}
                </div>
                <span><strong>{getMemoryAuthorDisplay({ author: targetQuoted.author })}</strong></span>
              </div>
            )}

            <PostMusic music={targetQuoted.music} />
            <button
              className={targetHasInlineImage ? `post-content with-image${selected && !isQuote ? " is-open" : ""}` : "post-content"}
              onClick={(e) => {
                if (isQuote) {
                  e.stopPropagation();
                  onOpen(targetQuoted);
                } else {
                  onOpen(memory);
                }
              }}
            >
              <span className="post-text">
                <h3>{targetQuoted.title}</h3>
                <p className={selected && !isQuote ? "" : "post-excerpt"}>{targetQuoted.description}</p>
                {(!selected || isQuote) && (
                  <span className="read-post">
                    {isQuote ? "Leer recuerdo original completo →" : "Leer recuerdo completo →"}
                  </span>
                )}
              </span>
              {targetHasInlineImage && (
                <img
                  className="post-image"
                  src={targetQuoted.image}
                  alt={`Fotografía de ${targetQuoted.title} en ${targetQuoted.place}, ${targetQuoted.year}`}
                  loading="lazy"
                  decoding="async"
                  onError={(event) => {
                    event.currentTarget.hidden = true;
                  }}
                />
              )}
            </button>
            {(targetQuoted.media || (targetQuoted.image && youtubeId(targetQuoted.image))) && (
              <PostMedia memory={targetQuoted} />
            )}
            {!!memoryHashtags(targetQuoted).length && (
              <div className="post-hashtags" aria-label="Hashtags del recuerdo">
                {memoryHashtags(targetQuoted).map((tag) => (
                  <button
                    key={tag}
                    onClick={(e) => {
                      e.stopPropagation();
                      onHashtag(tag);
                    }}
                    aria-label={`Ver hilo #${tag}`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
            <button
              className="post-place"
              onClick={(e) => {
                e.stopPropagation();
                onMap(targetQuoted);
              }}
            >
              <MapPin size={14} />
              {targetQuoted.place} · {targetQuoted.year}
            </button>
          </div>
        );
      })()}

      <PostRating
        memoryTitle={memory.title}
        value={rating}
        totalPoints={memory.points ?? 0}
        canRate={canRate}
        onRate={onRate}
      />
      <PostActions
        memoryTitle={memory.title}
        liked={liked}
        likeCount={memory.likeCount}
        commentCount={commentCount}
        reposted={reposted}
        saved={saved}
        onLike={onLike}
        onOpenComments={() => onOpen(memory)}
        onRepost={onRepost}
        onSave={onSave}
      />
      {selected && commentMemoryId && (
        <RemoteComments
          key={commentMemoryId}
          memoryId={commentMemoryId}
          onCommentCreated={() => setCommentCount((count) => count + 1)}
          onCommentDeleted={() => setCommentCount((count) => Math.max(0, count - 1))}
        />
      )}
    </article>
  );
}

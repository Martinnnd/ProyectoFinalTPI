import { Ellipsis, MapPin, Pencil, Repeat2, Trash2, UsersRound } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import PostMedia, { PostMusic } from "../PostMedia";
import { youtubeId } from "../../media";
import type { Memory } from "../../types";
import { isOwnMemory, getMemoryAuthorDisplay } from "../../api";
import RemoteComments from './RemoteComments';
import PostActions from "./PostActions";
import PostRating from "./PostRating";
import { memoryHashtags } from "../../hashtags";
import { publicationId } from '../../publicationsApi';
import FeedRelations from './FeedRelations';

export default function FeedPost({
  topOverlay,
  memory,
  groupName,
  active = true,
  selected,
  following,
  liked,
  likeCount,
  commentMemoryId,
  rating,
  canRate,
  reposted,
  directUnrepost = false,
  repostCount,
  saved,
  quotedMemory,
  onDelete,
  onEdit,
  onProfile,
  onFollow,
  onOpen,
  onOpenRelated,
  onMap,
  onRate,
  onLike,
  onRepost,
  onSimpleRepost,
  onUnrepost,
  onQuote,
  onSave,
  onHashtag,
}: {
  topOverlay?: ReactNode;
  memory: Memory;
  groupName?: string;
  active?: boolean;
  selected: boolean;
  following: boolean;
  liked: boolean;
  likeCount?: number;
  commentMemoryId?: string;
  rating?: number;
  canRate: boolean;
  reposted: boolean;
  directUnrepost?: boolean;
  repostCount?: number;
  saved: boolean;
  quotedMemory?: Memory;
  onDelete: (memory: Memory) => void;
  onEdit: (memory: Memory) => void;
  onProfile: (memory: Memory) => void;
  onFollow: (author: string, authorId?: number) => void;
  onOpen: (memory: Memory) => void;
  onOpenRelated?: (memory: Memory) => void;
  onMap: (memory: Memory) => void;
  onRate: (value: number) => void;
  onLike: () => void;
  onRepost?: () => void;
  onSimpleRepost?: (memory: Memory) => void;
  onUnrepost?: (memory: Memory) => void | Promise<void>;
  onQuote?: (memory: Memory) => void;
  onSave: () => void;
  onHashtag: (tag: string) => void;
}) {
  const [commentCount, setCommentCount] = useState(memory.commentCount ?? 0);
  useEffect(() => setCommentCount(memory.commentCount ?? 0), [memory.id, memory.commentCount]);
  const hasInlineImage =
    memory.image && !memory.media && !youtubeId(memory.image);
  const splitPhoto = Boolean(hasInlineImage && !selected && !memory.repost?.comment);

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
    <article className={`feed-post${topOverlay ? ' has-top-overlay' : ''}`}>
      {topOverlay}
      {isSimpleRepost && (
        <div className="repost-header-badge">
          <Repeat2 size={14} aria-hidden="true" />
          {isReposterOwn ? (
            <span>Has reposteado</span>
          ) : (
            <span>
              <button
                type="button"
                className="repost-author"
                onClick={(e) => {
                  e.stopPropagation();
                  onProfile({ ...memory, author: memory.author });
                }}
              >
                {reposterDisplay}
              </button>{" "}
              ha reposteado
            </span>
          )}
        </div>
      )}
      {memory.groupId && !memory.repost && (
        <div className="post-group-context">
          <UsersRound size={14} aria-hidden="true" />
          <span>{isReposterOwn ? "Publicaste un recuerdo en" : `${displayAuthor} publicó un recuerdo en`} <strong>{groupName ?? "un grupo"}</strong></span>
        </div>
      )}
      <div className={`post-composition${splitPhoto ? ' has-split-photo' : ''}`}>
      <div className="post-details">
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
        {isReposterOwn && !memory.repost && (
          <details className="feed-owner-menu">
            <summary className="secondary-button" aria-label="Opciones de publicación" title="Opciones de publicación"><Ellipsis size={20} aria-hidden="true" /></summary>
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
            className={isQuote ? "quoted-post-box" : "post-body"}
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
                    aria-label={`Ver recuerdos con #${tag}`}
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
        isOwn={isHeaderAuthorOwn}
        onRate={onRate}
      />
      <PostActions
        directUnrepost={directUnrepost}
        memoryTitle={memory.title}
        memoryId={memory.id}
        memoryYear={memory.year}
        liked={liked}
        likeCount={likeCount ?? memory.likeCount}
        commentCount={commentCount}
        reposted={reposted}
        repostCount={repostCount ?? memory.repostCount}
        saved={saved}
        onLike={onLike}
        onOpenComments={() => onOpen(memory)}
        onSimpleRepost={() => {
          if (onSimpleRepost) onSimpleRepost(memory);
          else onRepost?.();
        }}
        onUnrepost={() => {
          if (onUnrepost) return onUnrepost(memory);
          else onRepost?.();
        }}
        onQuote={() => {
          if (onQuote) onQuote(memory);
          else onRepost?.();
        }}
        onRepost={onRepost}
        onSave={onSave}
      />
      </div>
      {splitPhoto && <button className="post-photo-open" onClick={() => onOpen(memory)} aria-label={`Abrir recuerdo: ${memory.title}`}>
        <img src={memory.image} alt={`Fotografía de ${memory.title} en ${memory.place}, ${memory.year}`} loading="lazy" decoding="async" onError={event => { event.currentTarget.hidden = true; }} />
      </button>}
      </div>
      {publicationId(memory) && <FeedRelations key={`relations-${memory.id}`} id={memory.id} active={active} onOpen={onOpenRelated ?? onOpen} />}
      {selected && commentMemoryId && (
        <RemoteComments
          key={`comments-${commentMemoryId}`}
          memoryId={commentMemoryId}
          onCommentCreated={() => setCommentCount((count) => count + 1)}
          onCommentDeleted={() => setCommentCount((count) => Math.max(0, count - 1))}
        />
      )}
    </article>
  );
}

import { forwardRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Memory } from "../../types";
import FeedPost from "../social/FeedPost";
import RepostDialog from "../social/RepostDialog";
import useMemoryInteractions from "../../hooks/useMemoryInteractions";
import { useRatings } from "../../context/RatingsContext";
import { useFollow } from "../../context/FollowContext";
import { useAuth } from "../auth/AuthProvider";
import { compartirPublicacion, isOwnMemory } from "../../api";

const ProfilePosts = forwardRef<HTMLElement, {
  author?: string;
  username: string;
  memories: Memory[];
  selected: Memory | null;
  repostedPublicationIds: string[];
  onEdit: (memory: Memory) => void;
  onDelete: (memory: Memory) => void;
  onOpen?: (memory: Memory) => void;
  onSelectOnMap: (memory: Memory) => void;
  onAdd: () => void;
}>(function ProfilePosts({
  author,
  username,
  memories,
  selected,
  repostedPublicationIds,
  onEdit,
  onDelete,
  onOpen,
  onSelectOnMap,
  onAdd,
}, ref) {
  const router = useRouter();
  const { session } = useAuth();
  const { ratings, pointsMap, rateMemory, setNotice } = useRatings();
  const { followingUsers, toggleFollow } = useFollow();
  const interactions = useMemoryInteractions();

  const [repostMemory, setRepostMemory] = useState<Memory | null>(null);
  const [reposts, setReposts] = useState<string[]>(repostedPublicationIds);
  const [saves, setSaves] = useState<string[]>([]);

  const sortedMemories = [...memories].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (timeA !== timeB) return timeB - timeA;
    return Number(b.id) - Number(a.id);
  });

  return (
    <section ref={ref} className="personal-album profile-posts">
      <div className="personal-section-title">
        <h3>{author ? `Recuerdos de ${author}` : "Mis recuerdos"}</h3>
        <span>Todas las épocas · Últimas publicaciones primero</span>
      </div>
      {sortedMemories.length ? (
        <div className="feed-posts profile-feed-posts">
          {sortedMemories.map((memory) => {
            const isSimpleRepost = Boolean(memory.repost && !memory.repost.comment);
            const isQuote = Boolean(memory.repost?.comment);
            const rootId = isSimpleRepost && memory.repost?.originalId ? memory.repost.originalId : memory.id;
            const quotedId = isQuote && memory.repost?.originalId ? memory.repost.originalId : undefined;
            const quotedMemory = quotedId
              ? memories.find((m) => m.id === quotedId) || {
                  ...memory,
                  id: quotedId,
                  title: memory.title,
                  description: memory.description,
                  author: memory.repost?.author || "Desconocido",
                  repost: undefined,
                }
              : undefined;

            const targetKey = isSimpleRepost ? rootId : memory.id;
            const isReposted =
              reposts.includes(memory.id) ||
              reposts.includes(rootId) ||
              repostedPublicationIds.includes(memory.id) ||
              Boolean(memory.repost && isOwnMemory(memory));

            const effectivePoints = pointsMap?.[targetKey] ?? memory.points ?? 0;
            const effectiveRating = ratings[targetKey] ?? memory.viewerRating;
            const effectiveMemory = {
              ...memory,
              points: effectivePoints,
              viewerRating: effectiveRating,
            };

            const targetAuthor = isSimpleRepost && memory.repost?.author ? memory.repost.author : memory.author;
            const isFollowing = followingUsers.some(
              (u) => u.username.toLowerCase() === (targetAuthor ?? "").toLowerCase()
            );

            return (
              <FeedPost
                key={memory.id}
                memory={effectiveMemory}
                active={true}
                selected={selected?.id === memory.id}
                following={isFollowing}
                liked={interactions.isLiked(targetKey, memory.viewerLiked)}
                likeCount={interactions.getLikeCount(targetKey, memory.likeCount ?? 0)}
                commentMemoryId={selected?.id === memory.id ? targetKey : undefined}
                rating={effectiveRating}
                canRate={Boolean(session)}
                reposted={isReposted}
                saved={saves.includes(memory.id)}
                quotedMemory={quotedMemory}
                onDelete={onDelete}
                onEdit={onEdit}
                onProfile={(m) => {
                  if (m.author && m.author !== username) {
                    router.push(`/perfil/${m.author}`);
                  }
                }}
                onFollow={(authorToFollow, authorId) => {
                  if (authorId) toggleFollow(authorToFollow, authorId);
                }}
                onOpen={(m) => {
                  if (onOpen) onOpen(m || memory);
                  else router.push(`/recuerdo/${(m || memory).id}`);
                }}
                onMap={(m) => onSelectOnMap(m || memory)}
                onRate={(value) => rateMemory(targetKey, value, Boolean(session))}
                onLike={() => {
                  if (!session) {
                    router.push(`/auth/login?returnTo=${typeof window !== "undefined" ? window.location.pathname : "/perfil"}`);
                    return;
                  }
                  interactions.toggleLike(targetKey, memory.viewerLiked, memory.likeCount ?? 0);
                }}
                onRepost={() => {
                  if (!session) {
                    router.push(`/auth/login?returnTo=${typeof window !== "undefined" ? window.location.pathname : "/perfil"}`);
                    return;
                  }
                  setRepostMemory(memory);
                }}
                onSave={() => {
                  setSaves((curr) =>
                    curr.includes(memory.id) ? curr.filter((id) => id !== memory.id) : [...curr, memory.id]
                  );
                }}
                onHashtag={(tag) => router.push(`/feed?tag=${encodeURIComponent(tag)}`)}
              />
            );
          })}
        </div>
      ) : (
        <div className="personal-empty">
          <h3>{author ? "Todavía no hay recuerdos publicados" : "Tu primer recuerdo merece un lugar"}</h3>
          <p>{author ? "Sus publicaciones aparecerán acá." : "Contá tu historia: cada recuerdo que publiques aparecerá acá, uno debajo del otro."}</p>
          {!author && <button className="primary-button" onClick={onAdd}>Crear un recuerdo</button>}
        </div>
      )}
      {repostMemory && (
        <RepostDialog
          memoryTitle={repostMemory.title}
          onCancel={() => setRepostMemory(null)}
          onConfirm={async (descripcion) => {
            try {
              const res = await compartirPublicacion(repostMemory.id, descripcion);
              if (res && res.id) {
                setReposts((curr) => [...new Set([...curr, repostMemory.id, String(res.id)])]);
              }
              setNotice("Publicación compartida.");
            } catch (err) {
              console.error("Error al compartir:", err);
            } finally {
              setRepostMemory(null);
            }
          }}
        />
      )}
    </section>
  );
});

export default ProfilePosts;


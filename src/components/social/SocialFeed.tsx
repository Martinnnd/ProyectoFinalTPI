import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { transitionFeed } from "../../eras/shared/transitionFeed";
import useMemoryInteractions from "../../hooks/useMemoryInteractions";
import type { FeedTab } from "../../socialTypes";
import type { Memory } from "../../types";
import FeedHeader from "./FeedHeader";
import FeedPost from "./FeedPost";
import FeedSidebar from "./FeedSidebar";
import PostDetailFrame from "./PostDetailFrame";
import RepostDialog from "./RepostDialog";
import { compartirPublicacion, eliminarRepost, isOwnMemory } from "../../api";
import { memoryHashtags, weeklyTrends } from "../../hashtags";
import WeeklyTrends from "./WeeklyTrends";
import HashtagThread from "./HashtagThread";
import useRemoteFeed from '../../hooks/useRemoteFeed';

function toggleId(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];
}

function getTargetToRepost(mem: Memory, allMemories: Memory[]): { targetId: string; targetMemory: Memory } {
  // Solo los reposts simples (sin comentario) resuelven a la publicación original raíz.
  // Los quote tweets tienen su propio contenido y comentario, por lo que son el objetivo directo.
  const isSimple = Boolean(mem.repost && !mem.repost.comment);
  if (isSimple && mem.repost?.originalId) {
    const root = allMemories.find((m) => m.id === mem.repost?.originalId) || {
      ...mem,
      id: mem.repost.originalId,
      repost: undefined,
    };
    return { targetId: mem.repost.originalId, targetMemory: root };
  }
  return { targetId: mem.id, targetMemory: mem };
}

export default function SocialFeed({
  active,
  onItems,
  filterFeed,
  onEdit,
  onDelete,
  onProfile,
  groupIds,
  groupName,
  community,
  memories,
  decade,
  selected,
  onSelect,
  onMap,
  onAdd,
  onAddHashtag,
  following,
  onFollow,
  onReloadMemories,
}: {
  active: boolean;
  onItems: (items: Memory[]) => void;
  filterFeed: (items: Memory[]) => Memory[];
  onEdit: (memory: Memory) => void;
  onDelete: (memory: Memory) => void;
  onProfile: (memory: Memory) => void;
  decade: number;
  following: string[];
  onFollow: (author: string) => void;
  groupIds: string[];
  groupName?: string;
  community?: ReactNode;
  memories: Memory[];
  selected: Memory | null;
  onSelect: (memory: Memory | null) => void;
  onMap: (memory: Memory) => void;
  onAdd: () => void;
  onAddHashtag: (tag: string) => void;
  onReloadMemories?: () => void | Promise<void>;
}) {
  const interactions = useMemoryInteractions();
  const desktopDetail = !!selected && (decade === 1990 || decade === 2000);
  const [maximized, setMaximized] = useState(false);
  const [reposts, setReposts] = useState<string[]>([]);
  const [repostMemory, setRepostMemory] = useState<Memory | null>(null);
  const [saves, setSaves] = useState<string[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [tab, setTab] = useState<FeedTab>("all");
  const remote = useRemoteFeed(tab === 'groups' ? null : tab === 'following' ? 'seguidos' : 'para-vos', active);
  useEffect(() => { if (tab !== 'groups') onItems(remote.items); }, [remote.items, tab, onItems]);
  const [hashtag, setHashtag] = useState<string | null>(null);
  const [, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const openingRect = useRef<DOMRect | undefined>(undefined);
  const cancelTurn = useRef<() => void>(() => {});
  const stream = useRef<HTMLDivElement>(null);
  
  const allMemories = tab === 'groups' ? memories : filterFeed(remote.items);

  useEffect(() => () => cancelTurn.current(), []);
  useEffect(() => {
    if (stream.current) stream.current.scrollTop = 0;
  }, [selected?.id, tab, hashtag]);

  const authors = [
    ...new Set(
      allMemories
        .map((memory) =>
          memory.repost && !memory.repost.comment && memory.repost.author
            ? memory.repost.author
            : memory.author
        )
        .filter((author) => !isOwnMemory({ author })),
    ),
  ];
  const tabPosts =
    tab === "groups"
        ? allMemories.filter(
            (memory) =>
              !!memory.groupId && groupIds.includes(memory.groupId),
          )
        : allMemories;
  const posts = hashtag ? tabPosts.filter(memory => memoryHashtags(memory).includes(hashtag)) : tabPosts;
  const trends = weeklyTrends(tabPosts);

  function chooseHashtag(tag: string) {
    setHashtag(tag);
    open(null);
    setNow(Date.now());
  }

  function rate(id: string, value: number) {
    setRatings((current) => {
      const next = { ...current };
      if (next[id] === value) delete next[id];
      else next[id] = value;
      return next;
    });
  }

  function open(memory: Memory | null) {
    if (memory?.id === selected?.id) return;
    setMaximized(false);
    cancelTurn.current();
    if (stream.current) {
      if (memory) {
        openingRect.current = document.activeElement
          ?.closest(".feed-post")
          ?.getBoundingClientRect();
      }
      cancelTurn.current = transitionFeed(
        stream.current,
        memory === null,
        openingRect.current,
      );
    }
    onSelect(memory);
  }

  function changeTab(nextTab: FeedTab) {
    setTab(nextTab);
    setHashtag(null);
    open(null);
  }

  function isMemoryRepostedByMe(mem: Memory): boolean {
    const isQuote = Boolean(mem.repost?.comment);

    // En los reposts con cita (tipo quote tweet):
    // NO debe aparecer pintado por defecto ni porque sea propio ni porque se haya reposteado el post citado.
    // Solo aparecerá pintado si el usuario hizo explícitamente un retweet simple DE ESTE quote tweet.
    if (isQuote) {
      const hasRetweetedThisQuote = allMemories.some(
        (m) =>
          isOwnMemory(m) &&
          m.repost &&
          !m.repost.comment &&
          m.repost.originalId === mem.id,
      );
      return hasRetweetedThisQuote || reposts.includes(mem.id);
    }

    // Para reposts simples propios:
    if (mem.repost && !mem.repost.comment && isOwnMemory(mem)) {
      return true;
    }

    // Para posts normales o reposts simples de terceros:
    const rootId = mem.repost?.originalId || mem.id;
    const existsInFeed = allMemories.some(
      (m) =>
        isOwnMemory(m) &&
        m.repost &&
        !m.repost.comment &&
        (m.repost.originalId === rootId || m.repost.originalId === mem.id),
    );
    const existsLocally = reposts.includes(rootId) || reposts.includes(mem.id);
    return existsInFeed || existsLocally;
  }

  async function handleUnrepost(mem: Memory) {
    const { targetId } = getTargetToRepost(mem, allMemories);
    try {
      await eliminarRepost(targetId);
      remote.reload();
      if (onReloadMemories) {
        await onReloadMemories();
      }
    } catch (err) {
      console.error("Error al deshacer repost:", err);
    } finally {
      setReposts((current) => current.filter((id) => id !== targetId && id !== mem.id));
    }
  }

  return (
    <section
      className={`social-layout${desktopDetail && maximized ? " detail-maximized" : ""}`}
      aria-label="Feed de recuerdos"
    >
      <PostDetailFrame
        ref={stream}
        decade={decade}
        memory={selected}
        maximized={maximized}
        onClose={() => open(null)}
        onToggleMaximize={() => setMaximized((current) => !current)}
      >
        <FeedHeader
          title={groupName ?? "Feed"}
          tab={tab}
          selected={!!selected}
          onBack={() => open(null)}
          onTabChange={changeTab}
        />
        {!selected && tab !== 'groups' && <div className="feed-heading">
          <button type="button" disabled={remote.loading} onClick={() => { setHashtag(null); remote.reload(); }}>Recargar {tab === 'all' ? 'Para vos' : 'Seguidos'}</button>
          {remote.loading && <span role="status">Cargando publicaciones…</span>}
          {remote.error && <p role="alert">{remote.error} <button type="button" disabled={remote.loading} onClick={remote.expired || !remote.hayMas ? remote.reload : remote.more}>{remote.expired ? 'Nueva selección' : 'Reintentar'}</button></p>}
        </div>}
        {!selected && hashtag && (
          <HashtagThread key={hashtag} tag={hashtag} count={posts.length}
            hasDemo={posts.some(memory => memory.source === "demo")}
            onBack={() => setHashtag(null)} onAdd={() => { setTab("all"); onAddHashtag(hashtag); }} />
        )}
        <div className="feed-posts">
          {(selected ? [selected] : posts).map((memory) => {
            const isSimpleRepost = Boolean(memory.repost && !memory.repost.comment);
            const isQuote = Boolean(memory.repost?.comment);
            const rootId = isSimpleRepost && memory.repost?.originalId ? memory.repost.originalId : memory.id;
            const targetMemory = isSimpleRepost
              ? (allMemories.find((m) => m.id === rootId) || memory)
              : memory;
            const quotedId = isQuote && memory.repost?.originalId ? memory.repost.originalId : undefined;
            const quotedMemory = quotedId
              ? (allMemories.find((m) => m.id === quotedId) || {
                  ...memory,
                  id: quotedId,
                  title: memory.title,
                  description: memory.description,
                  author: memory.repost?.author || "Desconocido",
                  repost: undefined,
                })
              : undefined;
            const comments = interactions.getComments(isSimpleRepost ? rootId : memory.id);
            const isReposted = isMemoryRepostedByMe(memory);

            return (
              <FeedPost
                key={memory.id}
                memory={memory}
                quotedMemory={quotedMemory}
                selected={selected?.id === memory.id}
                following={following.includes(
                  memory.repost && !memory.repost.comment && memory.repost.author
                    ? memory.repost.author
                    : memory.author
                )}
                liked={interactions.isLiked(isSimpleRepost ? rootId : memory.id, targetMemory.viewerLiked)}
                comments={comments}
                rating={ratings[isSimpleRepost ? rootId : memory.id]}
                reposted={isReposted}
                saved={saves.includes(memory.id)}
                onDelete={onDelete}
                onEdit={onEdit}
                onProfile={onProfile}
                onFollow={onFollow}
                onOpen={(memToOpen) => open(memToOpen || targetMemory)}
                onMap={onMap}
                onRate={(value) => rate(isSimpleRepost ? rootId : memory.id, value)}
                onLike={() => interactions.toggleLike(isSimpleRepost ? rootId : memory.id, targetMemory.viewerLiked)}
                onRepost={() => {
                  if (isReposted) {
                    handleUnrepost(memory);
                  } else {
                    const { targetMemory: toRepost } = getTargetToRepost(memory, allMemories);
                    setRepostMemory(toRepost);
                  }
                }}
                onSave={() =>
                  setSaves((current) => toggleId(current, memory.id))
                }
                onAddComment={(memId, text, parentId) =>
                  interactions.addComment(isSimpleRepost ? rootId : memId, text, parentId)
                }
                onReaction={(memId, commentId, reaction) =>
                  interactions.reactToComment(isSimpleRepost ? rootId : memId, commentId, reaction)
                }
                onHashtag={chooseHashtag}
              />
            );
          })}
          {!selected && !posts.length && (tab === 'groups' || (!remote.loading && !remote.error)) && (
            <div className="feed-empty">
              <h3>
                {tab === "following"
                  ? "Todavía no hay publicaciones de tus seguidos"
                  : tab === "groups"
                    ? "No hay publicaciones de tus grupos para esta época y categoría"
                    : "No hay recuerdos con estos filtros"}
              </h3>
              <p>
                Explorá otras épocas y categorías, o seguí a alguien desde Para
                vos.
              </p>
            </div>
          )}
          {!selected && tab !== 'groups' && remote.hayMas && <button className="primary-button" type="button" disabled={remote.loading || remote.expired} onClick={remote.more}>Ver más publicaciones</button>}
        </div>
      </PostDetailFrame>
      <FeedSidebar
        community={community}
        trends={<WeeklyTrends trends={trends} onSelect={chooseHashtag} />}
        authors={authors}
        following={following}
        onAdd={onAdd}
        onFollow={onFollow}
      />
      {repostMemory && (
        <RepostDialog
          memoryTitle={repostMemory.title}
          onCancel={() => setRepostMemory(null)}
          onConfirm={async (descripcion) => {
            const { targetId } = getTargetToRepost(repostMemory, allMemories);
            try {
              await compartirPublicacion(targetId, descripcion);
              remote.reload();
              if (onReloadMemories) {
                await onReloadMemories();
              }
            } catch (err) {
              console.error("Error al compartir en el servidor:", err);
            } finally {
              // Solo se marca pintado en local si fue un repost simple (sin comentario agregado)
              if (!descripcion.trim()) {
                setReposts((current) => [...new Set([...current, targetId])]);
              }
              setRepostMemory(null);
            }
          }}
        />
      )}
    </section>
  );
}

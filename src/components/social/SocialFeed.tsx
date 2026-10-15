import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import { useAuth } from '../auth/AuthProvider';
import { publicationId } from '../../publicationsApi';

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
  suggestedAuthors,
  groupOpenRequest,
  groupName,
  community,
  memories,
  decade,
  selected,
  onSelect,
  onMap,
  onAdd,
  onAddHashtag,
  onTabChange,
  following,
  followingRevision,
  onFollow,
  ratings,
  canRate,
  onRate,
  onReloadMemories,
  onRepostCreated,
}: {
  active: boolean;
  onItems: (items: Memory[]) => void;
  filterFeed: (items: Memory[]) => Memory[];
  onEdit: (memory: Memory) => void;
  onDelete: (memory: Memory) => void;
  onProfile: (memory: Memory) => void;
  decade: number;
  following: string[];
  followingRevision: number;
  onFollow: (author: string, authorId?: number) => void;
  ratings: Record<string, number>;
  canRate: boolean;
  onRate: (postId: string, score: number) => void;
  groupIds: string[];
  suggestedAuthors: { name: string; id: number }[];
  groupOpenRequest: number;
  groupName?: string;
  community?: ReactNode;
  memories: Memory[];
  selected: Memory | null;
  onSelect: (memory: Memory | null) => void;
  onMap: (memory: Memory) => void;
  onAdd: () => void;
  onAddHashtag: (tag: string) => void;
  onTabChange: (tab: FeedTab) => void;
  onReloadMemories?: () => void | Promise<void>;
  onRepostCreated: (id: string) => void;
}) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const interactions = useMemoryInteractions();
  const desktopDetail = !!selected && (decade === 1990 || decade === 2000);
  const [maximized, setMaximized] = useState(false);
  const [reposts, setReposts] = useState<string[]>([]);
  const [repostMemory, setRepostMemory] = useState<Memory | null>(null);
  const [saves, setSaves] = useState<string[]>([]);
  const [tab, setTab] = useState<FeedTab>("all");

  function requireAuthentication(): boolean {
    if (isAuthenticated) return true;
    router.push('/auth/login?returnTo=/explorar');
    return false;
  }
  useEffect(() => {
    if (groupName) {
      setTab("groups");
      setHashtag(null);
    }
  }, [groupName, groupOpenRequest]);
  const remote = useRemoteFeed(tab === 'groups' ? null : tab === 'following' ? 'seguidos' : 'para-vos', active && isAuthenticated);
  useEffect(() => { if (followingRevision && tab === 'following') remote.reload(); }, [followingRevision]);
  useEffect(() => {
    if (isAuthenticated && tab !== 'groups') onItems(remote.items);
  }, [isAuthenticated, remote.items, tab, onItems]);
  const [hashtag, setHashtag] = useState<string | null>(null);
  const [, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const openingRect = useRef<DOMRect | undefined>(undefined);
  const cancelTurn = useRef<() => void>(() => {});
  const stream = useRef<HTMLDivElement>(null);
  
  const allMemories = tab === 'groups' || !isAuthenticated
    ? filterFeed(memories)
    : filterFeed(remote.items);

  useEffect(() => () => cancelTurn.current(), []);
  useEffect(() => {
    if (stream.current) stream.current.scrollTop = 0;
  }, [selected?.id, tab, hashtag]);

  const feedAuthors = allMemories.map(memory => {
    const simpleRepost = memory.repost && !memory.repost.comment && memory.repost.author;
    const name = simpleRepost ? memory.repost!.author : memory.author;
    const id = simpleRepost ? memory.repost?.authorId : memory.authorId;
    return [name, { name, id }] as const;
  });
  const authors = [...new Map([...feedAuthors, ...suggestedAuthors.map(author => [author.name, author] as const)]
    .filter(([, author]) => author.id && !isOwnMemory({ author: author.name }))).values()];
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
    if (!isAuthenticated && (nextTab === 'following' || nextTab === 'groups')) {
      requireAuthentication();
      return;
    }
    onTabChange(nextTab);
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
      setReposts((current) => current.filter((id) => id !== targetId && id !== mem.id));
      remote.reload();
      if (onReloadMemories) {
        await onReloadMemories();
      }
    } catch (err) {
      console.error("Error al deshacer repost:", err);
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
                commentMemoryId={publicationId(targetMemory) ? rootId : undefined}
                rating={ratings[isSimpleRepost ? rootId : memory.id]}
                canRate={canRate}
                reposted={isReposted}
                saved={saves.includes(memory.id)}
                onDelete={onDelete}
                onEdit={onEdit}
                onProfile={onProfile}
                onFollow={onFollow}
                onOpen={(memToOpen) => open(memToOpen || targetMemory)}
                onMap={onMap}
                onRate={(value) => onRate(isSimpleRepost ? rootId : memory.id, value)}
                onLike={() => {
                  if (!requireAuthentication()) return;
                  interactions.toggleLike(isSimpleRepost ? rootId : memory.id, targetMemory.viewerLiked);
                }}
                onRepost={() => {
                  if (!requireAuthentication()) return;
                  if (isReposted) {
                    handleUnrepost(memory);
                  } else {
                    const { targetMemory: toRepost } = getTargetToRepost(memory, allMemories);
                    setRepostMemory(toRepost);
                  }
                }}
                onSave={() => {
                  if (!requireAuthentication()) return;
                  setSaves((current) => toggleId(current, memory.id));
                }}
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
            if (!requireAuthentication()) {
              setRepostMemory(null);
              return;
            }
            const { targetId } = getTargetToRepost(repostMemory, allMemories);
            try {
              const created = await compartirPublicacion(targetId, descripcion);
              if (created && typeof created.id !== 'undefined') onRepostCreated(String(created.id));
              if (!descripcion.trim()) {
                setReposts((current) => [...new Set([...current, targetId])]);
              }
              remote.reload();
              if (onReloadMemories) {
                await onReloadMemories();
              }
            } catch (err) {
              console.error("Error al compartir en el servidor:", err);
            } finally {
              setRepostMemory(null);
            }
          }}
        />
      )}
    </section>
  );
}

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
import { compartirPublicacion } from "../../api";
import { memoryHashtags, weeklyTrends } from "../../hashtags";
import WeeklyTrends from "./WeeklyTrends";
import HashtagThread from "./HashtagThread";
import useRemoteFeed from '../../hooks/useRemoteFeed';

function toggleId(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];
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
}) {
  const interactions = useMemoryInteractions();
  const desktopDetail = !!selected && (decade === 1990 || decade === 2000);
  const [maximized, setMaximized] = useState(false);
  const [reposts, setReposts] = useState<string[]>([]);
  const [repostMemory, setRepostMemory] = useState<Memory | null>(null);
  const [localReposts, setLocalReposts] = useState<Memory[]>([]);
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
  
  const allMemories = tab === 'groups' ? [...localReposts, ...memories] : filterFeed(tab === 'all' ? [...new Map([...localReposts, ...remote.items].map(memory => [memory.id, memory])).values()] : remote.items);

  useEffect(() => () => cancelTurn.current(), []);
  useEffect(() => {
    if (stream.current) stream.current.scrollTop = 0;
  }, [selected?.id, tab, hashtag]);

  const authors = [
    ...new Set(
      allMemories
        .map((memory) => memory.author),
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
          community={community}
          selected={!!selected}
          onBack={() => open(null)}
          onTabChange={changeTab}
        />
        {!selected && tab !== 'groups' && <div className="feed-heading">
          <button type="button" disabled={remote.loading} onClick={() => { setHashtag(null); remote.reload(); }}>Recargar {tab === 'all' ? 'Para vos' : 'Seguidos'}</button>
          {remote.loading && <span role="status">Cargando publicaciones…</span>}
          {remote.error && <p role="alert">{remote.error} <button type="button" disabled={remote.loading} onClick={remote.expired || !remote.hayMas ? remote.reload : remote.more}>{remote.expired ? 'Nueva selección' : 'Reintentar'}</button></p>}
        </div>}
        {!selected && (hashtag ? (
          <HashtagThread key={hashtag} tag={hashtag} count={posts.length}
            hasDemo={posts.some(memory => memory.source === "demo")}
            onBack={() => setHashtag(null)} onAdd={() => { setTab("all"); onAddHashtag(hashtag); }} />
        ) : <WeeklyTrends trends={trends} onSelect={chooseHashtag} />)}
        <div className="feed-posts">
          {(selected ? [selected] : posts).map((memory) => {
            const comments = interactions.getComments(memory.id);
            return (
              <FeedPost
                key={memory.id}
                memory={memory}
                selected={selected?.id === memory.id}
                following={following.includes(memory.author)}
                liked={interactions.isLiked(memory.id, memory.viewerLiked)}
                comments={comments}
                rating={ratings[memory.id]}
                reposted={reposts.includes(memory.id)}
                saved={saves.includes(memory.id)}
                onDelete={onDelete}
                onEdit={onEdit}
                onProfile={onProfile}
                onFollow={onFollow}
                onOpen={open}
                onMap={onMap}
                onRate={(value) => rate(memory.id, value)}
                onLike={() => interactions.toggleLike(memory.id, memory.viewerLiked)}
                onRepost={() => setRepostMemory(memory)}
                onSave={() =>
                  setSaves((current) => toggleId(current, memory.id))
                }
                onAddComment={interactions.addComment}
                onReaction={interactions.reactToComment}
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
            try {
              // Llamada defensiva al backend
              const res = await compartirPublicacion(repostMemory.id, descripcion);
              
              const newRepost: Memory = {
                ...repostMemory,
                id: res.id ? String(res.id) : `repost-${Date.now()}`,
                author: "Vos",
                source: "local",
                repost: {
                  author: repostMemory.author,
                  comment: descripcion || undefined
                }
              };
              setLocalReposts((prev) => [newRepost, ...prev]);

            } catch (err) {
              console.warn("Backend no disponible o falló al compartir, pero seguimos visualmente.", err);
              
              const newRepost: Memory = {
                ...repostMemory,
                id: `repost-${Date.now()}`,
                author: "Vos",
                source: "local",
                repost: {
                  author: repostMemory.author,
                  comment: descripcion || undefined
                }
              };
              setLocalReposts((prev) => [newRepost, ...prev]);
            } finally {
              // Igualmente actualizamos la UI para no romper el flujo "demo" del front
              setReposts((current) => toggleId(current, repostMemory.id));
              setRepostMemory(null);
            }
          }}
        />
      )}
    </section>
  );
}

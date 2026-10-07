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

function toggleId(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];
}

export default function SocialFeed({
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
  following,
  onFollow,
}: {
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
}) {
  const interactions = useMemoryInteractions();
  const desktopDetail = !!selected && (decade === 1990 || decade === 2000);
  const [maximized, setMaximized] = useState(false);
  const [reposts, setReposts] = useState<string[]>([]);
  const [saves, setSaves] = useState<string[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [tab, setTab] = useState<FeedTab>("all");
  const openingRect = useRef<DOMRect | undefined>(undefined);
  const cancelTurn = useRef<() => void>(() => {});
  const stream = useRef<HTMLDivElement>(null);
  const resultKey = memories.map((memory) => memory.id).join(",");

  useEffect(() => () => cancelTurn.current(), []);
  useEffect(() => {
    if (stream.current) stream.current.scrollTop = 0;
  }, [selected?.id, resultKey, tab]);

  const authors = [
    ...new Set(
      memories
        .filter((memory) => memory.source === "demo")
        .map((memory) => memory.author),
    ),
  ];
  const posts =
    tab === "following"
      ? memories.filter((memory) => following.includes(memory.author))
      : tab === "groups"
        ? memories.filter(
            (memory) =>
              !!memory.groupId && groupIds.includes(memory.groupId),
          )
        : memories;

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
        <div className="feed-posts">
          {(selected ? [selected] : posts).map((memory) => {
            const comments = interactions.getComments(memory.id);
            return (
              <FeedPost
                key={memory.id}
                memory={memory}
                selected={selected?.id === memory.id}
                following={following.includes(memory.author)}
                liked={interactions.isLiked(memory.id)}
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
                onLike={() => interactions.toggleLike(memory.id)}
                onRepost={() =>
                  setReposts((current) => toggleId(current, memory.id))
                }
                onSave={() =>
                  setSaves((current) => toggleId(current, memory.id))
                }
                onAddComment={interactions.addComment}
                onReaction={interactions.reactToComment}
              />
            );
          })}
          {!selected && !posts.length && (
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
        </div>
      </PostDetailFrame>
      <FeedSidebar
        authors={authors}
        following={following}
        onAdd={onAdd}
        onFollow={onFollow}
      />
    </section>
  );
}

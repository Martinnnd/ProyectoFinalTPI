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
import { repostearPublicacion, quitarRepost, citarPublicacion, isOwnMemory } from "../../api";
import type { WeeklyTrend } from "../../hashtags";
import { getWeeklyHashtags } from "../../hashtagsApi";
import WeeklyTrends from "./WeeklyTrends";
import HashtagThread from "./HashtagThread";
import useRemoteFeed from '../../hooks/useRemoteFeed';
import useHashtagFeed from '../../hooks/useHashtagFeed';
import { useAuth } from '../auth/AuthProvider';
import { publicationId } from '../../publicationsApi';
import { LoaderCircle, RefreshCw } from 'lucide-react';
import { feedCache } from '../../sessionQueryCache';

function toggleId(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];
}

function authorsFromMemories(memories: Memory[]) {
  return memories.map(memory => {
    const simpleRepost = memory.repost && !memory.repost.comment && memory.repost.author;
    const name = simpleRepost ? memory.repost!.author : memory.author;
    const id = simpleRepost ? memory.repost?.authorId : memory.authorId;
    return [name, { name, id }] as const;
  });
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
  backLabel = "Volver al feed",
  initialHashtag,
  active,
  onItems,
  filterFeed,
  onEdit,
  onDelete,
  onProfile,
  groupIds,
  groupNames = {},
  suggestedAuthors,
  groupOpenRequest,
  groupName,
  groupActions,
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
  pointsMap,
  canRate,
  onRate,
  onReloadMemories,
  onRepostCreated,
}: {
  backLabel?: string;
  initialHashtag?: string | null;
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
  pointsMap?: Record<string, number>;
  canRate: boolean;
  onRate: (postId: string, score: number) => void;
  groupIds: string[];
  groupNames?: Record<string, string>;
  suggestedAuthors: { name: string; id: number }[];
  groupOpenRequest: number;
  groupName?: string;
  groupActions?: ReactNode;
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
  const { isAuthenticated, session } = useAuth();
  const interactions = useMemoryInteractions();
  const desktopDetail = !!selected && (decade === 1990 || decade === 2000);
  const [maximized, setMaximized] = useState(false);
  const [relatedHistory, setRelatedHistory] = useState<Memory[]>([]);
  useEffect(() => { if (!selected) setRelatedHistory([]); }, [selected?.id]);
  const [reposts, setReposts] = useState<string[]>([]);
  const [repostMemory, setRepostMemory] = useState<Memory | null>(null);
  const [saves, setSaves] = useState<string[]>([]);
  const viewKey = `${session?.usuarioId ?? 'guest'}:feed-view`;
  const [tab, setTab] = useState<FeedTab>(() => feedCache.get<FeedTab>(viewKey) ?? 'all');
  useEffect(() => {
    if (active && !selected && tab !== 'groups') feedCache.set(viewKey, tab, Infinity);
  }, [active, selected?.id, tab, viewKey]);
  const [knownAuthors, setKnownAuthors] = useState<{ name: string; id: number }[]>([]);

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
  useEffect(() => {
    setKnownAuthors(previous => {
      const candidates = new Map(previous.map(author => [author.id, author]));
      for (const [, author] of authorsFromMemories(remote.items)) {
        if (author.id && author.id !== session?.usuarioId) candidates.set(author.id, { name: author.name, id: author.id });
      }
      const next = [...candidates.values()];
      return next.length === previous.length && next.every((author, index) => author.id === previous[index].id && author.name === previous[index].name) ? previous : next;
    });
  }, [remote.items, session?.usuarioId]);
  const lastFollowingRevision = useRef(followingRevision);
  useEffect(() => {
    if (lastFollowingRevision.current !== followingRevision && tab === 'following') remote.reload();
    lastFollowingRevision.current = followingRevision;
  }, [followingRevision, tab]);
  useEffect(() => {
    if (isAuthenticated && tab !== 'groups') onItems(remote.items);
  }, [isAuthenticated, remote.items, tab, onItems]);
  const [hashtag, setHashtag] = useState<string | null>(null);
  useEffect(() => {
    if (initialHashtag !== undefined) setHashtag(initialHashtag);
  }, [initialHashtag]);
  const hashtagFeed = useHashtagFeed(hashtag, active);
  const [trends, setTrends] = useState<WeeklyTrend[]>([]);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trendsError, setTrendsError] = useState("");
  const [trendsRevision, setTrendsRevision] = useState(0);
  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    setTrendsLoading(true);
    setTrendsError("");
    getWeeklyHashtags(controller.signal)
      .then(items => { if (!controller.signal.aborted) setTrends(items); })
      .catch(cause => { if (!controller.signal.aborted) setTrendsError((cause as Error).message); })
      .finally(() => { if (!controller.signal.aborted) setTrendsLoading(false); });
    return () => controller.abort();
  }, [active, trendsRevision]);
  const [, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const openingRect = useRef<DOMRect | undefined>(undefined);
  const cancelTurn = useRef<() => void>(() => {});
  const stream = useRef<HTMLDivElement>(null);
  const loadTarget = useRef<HTMLDivElement>(null);
  const [headerHidden, setHeaderHidden] = useState(false);
  const [suggestRefresh, setSuggestRefresh] = useState(false);
  const scrolledDown = useRef(false);
  useEffect(() => {
    setHeaderHidden(false);
    setSuggestRefresh(false);
    scrolledDown.current = false;
    if (!active || selected || !stream.current) return;
    let detach = () => {};
    const attach = () => {
      detach();
      let root: HTMLElement | null = stream.current;
      while (root && !/(auto|scroll)/.test(getComputedStyle(root).overflowY)) root = root.parentElement;
      if (!root) return;
      const scrollRoot = root;
      let previous = Math.max(0, scrollRoot.scrollTop);
      const onScroll = () => {
        const next = Math.max(0, scrollRoot.scrollTop);
        const delta = next - previous;
        if (next >= 120) scrolledDown.current = true;
        setSuggestRefresh(next <= 8 && scrolledDown.current);
        if (next > 8 && Math.abs(delta) < 3) return;
        previous = next;
        setHeaderHidden(next > 8 && delta > 0);
      };
      scrollRoot.addEventListener('scroll', onScroll, { passive: true });
      detach = () => scrollRoot.removeEventListener('scroll', onScroll);
      setHeaderHidden(false);
    };
    attach();
    window.addEventListener('resize', attach);
    return () => { detach(); window.removeEventListener('resize', attach); };
  }, [active, selected?.id, tab, hashtag]);
  
  const allMemories = tab === 'groups' || !isAuthenticated
    ? filterFeed(memories)
    : filterFeed(remote.items);

  useEffect(() => () => cancelTurn.current(), []);
  useEffect(() => {
    let root: HTMLElement | null = stream.current;
    while (root && !/(auto|scroll)/.test(getComputedStyle(root).overflowY)) root = root.parentElement;
    if (!root || !active) return;
    if (selected || hashtag) { root.scrollTop = 0; return; }
    const scrollRoot = root;
    const key = `${viewKey}:${tab}:scroll`;
    const saved = feedCache.get<number>(key) ?? 0;
    const frame = requestAnimationFrame(() => { scrollRoot.scrollTop = saved; });
    const remember = () => feedCache.set(key, scrollRoot.scrollTop, Infinity);
    scrollRoot.addEventListener('scroll', remember, { passive: true });
    return () => { cancelAnimationFrame(frame); remember(); scrollRoot.removeEventListener('scroll', remember); };
  }, [active, selected?.id, tab, hashtag, viewKey]);

  const feedAuthors = authorsFromMemories(allMemories);
  const authors = [...new Map([...feedAuthors, ...knownAuthors.map(author => [author.name, author] as const), ...suggestedAuthors.map(author => [author.name, author] as const)]
    .filter(([, author]) => author.id && author.id !== session?.usuarioId && !isOwnMemory({ author: author.name }))).values()];
  const browsingGroups = tab === "groups" && !groupName;
  const tabPosts =
    tab === "groups"
        ? allMemories.filter(
            (memory) =>
              !!memory.groupId && groupIds.includes(memory.groupId),
          )
        : allMemories;
  const posts = hashtag ? hashtagFeed.items : browsingGroups ? [] : tabPosts;
  useEffect(() => {
    if (!active || hashtag || !isAuthenticated || selected || tab === 'groups' || remote.loading || remote.error || remote.expired || !remote.hayMas || !loadTarget.current) return;
    let root: HTMLElement | null = stream.current;
    while (root && !/(auto|scroll)/.test(getComputedStyle(root).overflowY)) root = root.parentElement;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) remote.more();
    }, { root, rootMargin: '0px 0px 120px 0px' });
    observer.observe(loadTarget.current);
    return () => observer.disconnect();
  }, [active, isAuthenticated, selected?.id, tab, hashtag, posts.length, remote.loading, remote.error, remote.expired, remote.hayMas, remote.more]);
  useEffect(() => {
    if (!active || !hashtag || selected || hashtagFeed.loading || hashtagFeed.error || !hashtagFeed.hayMas || !loadTarget.current) return;
    let root: HTMLElement | null = stream.current;
    while (root && !/(auto|scroll)/.test(getComputedStyle(root).overflowY)) root = root.parentElement;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) hashtagFeed.more();
    }, { root, rootMargin: '0px 0px 120px 0px' });
    observer.observe(loadTarget.current);
    return () => observer.disconnect();
  }, [active, hashtag, selected?.id, hashtagFeed.loading, hashtagFeed.error, hashtagFeed.hayMas, hashtagFeed.more]);

  function chooseHashtag(tag: string) {
    onTabChange('all');
    setTab('all');
    setHashtag(tag);
    open(null);
    router.push(`/feed?tag=${encodeURIComponent(tag)}`);
    setNow(Date.now());
  }

  function open(memory: Memory | null, preserveHistory = false) {
    if (memory?.id === selected?.id) return;
    if (!preserveHistory) setRelatedHistory([]);
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
    if (hashtag) router.push('/feed');
  }

  function isMemoryRepostedByMe(mem: Memory): boolean {
    const isQuote = Boolean(
      mem.quotedMemory ||
      (mem.repost && (mem.repost.comment !== undefined || (mem.repost.id && mem.repost.id !== mem.repost.originalId)))
    );

    // En los reposts con cita (tipo quote tweet):
    // NO debe aparecer pintado por defecto ni porque sea propio ni porque se haya reposteado el post citado.
    // Solo aparecerá pintado si el usuario hizo explícitamente un retweet simple DE ESTE quote tweet.
    if (isQuote) {
      const hasRetweetedThisQuote = allMemories.some(
        (m) =>
          isOwnMemory(m) &&
          m.repost &&
          !m.repost.comment &&
          !m.quotedMemory &&
          m.repost.originalId === mem.id,
      );
      return hasRetweetedThisQuote || reposts.includes(mem.id) || mem.viewerReposted === true;
    }

    if (typeof mem.viewerReposted === 'boolean') {
      const rootId = mem.repost?.originalId || mem.id;
      const existsLocally = reposts.includes(rootId) || reposts.includes(mem.id);
      return mem.viewerReposted || existsLocally;
    }

    // Para reposts simples propios:
    if (mem.repost && !mem.repost.comment && !mem.quotedMemory && isOwnMemory(mem)) {
      return true;
    }

    // Para posts normales o reposts simples de terceros:
    const rootId = mem.repost?.originalId || mem.id;
    const existsInFeed = allMemories.some(
      (m) =>
        isOwnMemory(m) &&
        m.repost &&
        !m.repost.comment &&
        !m.quotedMemory &&
        (m.repost.originalId === rootId || m.repost.originalId === mem.id),
    );
    const existsLocally = reposts.includes(rootId) || reposts.includes(mem.id);
    return existsInFeed || existsLocally;
  }

  async function handleSimpleRepost(mem: Memory) {
    if (!requireAuthentication()) return;
    const { targetId } = getTargetToRepost(mem, allMemories);
    try {
      const res = await repostearPublicacion(targetId);
      setReposts((current) => [...new Set([...current, targetId, mem.id])]);
      onRepostCreated(targetId);
      if (res?.cantidadReposts !== undefined) {
        interactions.updateRepostCount(targetId, res.cantidadReposts);
      } else {
        interactions.incrementRepostCount(targetId, 1, mem.repostCount ?? 0);
      }
      remote.reload();
      if (onReloadMemories) {
        await onReloadMemories();
      }
    } catch (err) {
      console.error("Error al repostear:", err);
    }
  }

  async function handleUnrepost(mem: Memory) {
    if (!requireAuthentication()) return;
    const { targetId } = getTargetToRepost(mem, allMemories);
    try {
      const res = await quitarRepost(targetId);
      setReposts((current) => current.filter((id) => id !== targetId && id !== mem.id));
      if (res?.cantidadReposts !== undefined) {
        interactions.updateRepostCount(targetId, res.cantidadReposts);
      } else {
        interactions.incrementRepostCount(targetId, -1, mem.repostCount ?? 0);
      }
      remote.reload();
      if (onReloadMemories) {
        await onReloadMemories();
      }
    } catch (err) {
      console.error("Error al deshacer repost:", err);
    }
  }

  function handleQuote(mem: Memory) {
    if (!requireAuthentication()) return;
    const { targetMemory: toRepost } = getTargetToRepost(mem, allMemories);
    setRepostMemory(toRepost);
  }

  return (
    <section
      className={`social-layout${desktopDetail && maximized ? " detail-maximized" : ""}`}
      aria-label="Feed de recuerdos"
    >
      <PostDetailFrame
        backLabel={backLabel}
        ref={stream}
        decade={decade}
        memory={selected}
        maximized={maximized}
        onClose={() => open(null)}
        onToggleMaximize={() => setMaximized((current) => !current)}
      >
        <FeedHeader
          actions={groupName ? groupActions : undefined}
          backLabel={backLabel}
          title={groupName ?? (tab === "groups" ? "Mis grupos" : "Feed")}
          tab={tab}
          selected={!!selected && !desktopDetail}
          scrollHidden={headerHidden}
          onBack={() => open(null)}
          onTabChange={changeTab}
        />
        {!!selected && !!relatedHistory.length && <button className="feed-back" onClick={() => {
          const previous = relatedHistory[relatedHistory.length - 1];
          setRelatedHistory(current => current.slice(0, -1));
          open(previous, true);
        }}>← Volver a {relatedHistory[relatedHistory.length - 1].title}</button>}
        
        {!selected && hashtag && (
          <HashtagThread key={hashtag} tag={hashtag}
            onBack={() => { setHashtag(null); router.push('/feed'); }}
            onAdd={() => { setTab("all"); onAddHashtag(hashtag); }} />
        )}
        {!selected && browsingGroups && community && (
          <div className="feed-group-directory">
            {community}
          </div>
        )}
        <div className="feed-posts">
          {(selected ? [selected] : posts).map((memory, index) => {
            const isQuote = Boolean(
              memory.quotedMemory ||
              (memory.repost && (memory.repost.comment !== undefined || (memory.repost.id && memory.repost.id !== memory.repost.originalId)))
            );
            const isSimpleRepost = Boolean(memory.repost && !isQuote);
            const rootId = isSimpleRepost && memory.repost?.originalId ? memory.repost.originalId : memory.id;
            const targetMemory = isSimpleRepost
              ? (allMemories.find((m) => m.id === rootId) || memory)
              : memory;
            const quotedId = isQuote && memory.repost?.originalId ? memory.repost.originalId : undefined;
            const quotedMemory = quotedId
              ? (memory.quotedMemory || allMemories.find((m) => m.id === quotedId) || {
                  ...memory,
                  id: quotedId,
                  title: memory.title,
                  description: memory.description,
                  author: memory.repost?.author || "Desconocido",
                  repost: undefined,
                })
              : undefined;
            const isReposted = isMemoryRepostedByMe(memory);

            const targetKey = isSimpleRepost ? rootId : memory.id;
            const effectivePoints = pointsMap?.[targetKey] ?? targetMemory.points ?? 0;
            const effectiveRating = ratings[targetKey] ?? targetMemory.viewerRating;
            const effectiveMemory = {
              ...memory,
              points: effectivePoints,
              viewerRating: effectiveRating,
            };

            return (
              <FeedPost
                groupName={memory.groupId ? groupNames[memory.groupId] : undefined}
                topOverlay={index === 0 && isAuthenticated && tab !== 'groups' && !selected && (suggestRefresh || remote.refreshing) ? (
                  <button type="button" className="feed-refresh-button" aria-label={remote.refreshing ? "Cargando publicaciones…" : "nuevas publicaciones"} aria-busy={remote.refreshing} disabled={remote.loading || remote.refreshing} onClick={() => {
                    setSuggestRefresh(false);
                    scrolledDown.current = false;
                    remote.reload();
                  }}><RefreshCw size={15} aria-hidden="true" className={remote.refreshing ? "feed-refresh-spinning" : undefined} /><span role="status">{remote.refreshing ? "Cargando publicaciones…" : "nuevas publicaciones"}</span></button>
                ) : undefined}
                key={memory.id}
                memory={effectiveMemory}
                active={active}
                quotedMemory={quotedMemory}
                selected={selected?.id === memory.id}
                following={following.some((name) =>
                  name.toLowerCase() ===
                  (memory.repost && !memory.repost.comment && memory.repost.author
                    ? memory.repost.author
                    : memory.author
                  ).toLowerCase()
                )}
                liked={interactions.isLiked(targetKey, targetMemory.viewerLiked)}
                likeCount={interactions.getLikeCount(targetKey, targetMemory.likeCount ?? 0)}
                commentMemoryId={publicationId(targetMemory) ? rootId : undefined}
                rating={effectiveRating}
                canRate={canRate}
                reposted={isReposted}
                repostCount={interactions.getRepostCount(targetKey, targetMemory.repostCount ?? 0)}
                saved={interactions.isSaved(targetKey, targetMemory.viewerSaved)}
                onDelete={onDelete}
                onEdit={onEdit}
                onProfile={onProfile}
                onFollow={onFollow}
                onOpen={(memToOpen) => open(memToOpen || targetMemory)}
                onOpenRelated={next => {
                  setRelatedHistory(current => [...current, memory]);
                  open(next, true);
                }}
                onMap={onMap}
                onRate={(value) => onRate(isSimpleRepost ? rootId : memory.id, value)}
                onLike={() => {
                  if (!requireAuthentication()) return;
                  interactions.toggleLike(targetKey, targetMemory.viewerLiked, targetMemory.likeCount ?? 0);
                }}
                onSimpleRepost={() => handleSimpleRepost(memory)}
                onUnrepost={() => handleUnrepost(memory)}
                onQuote={() => handleQuote(memory)}
                onRepost={() => {
                  if (isReposted) {
                    handleUnrepost(memory);
                  } else {
                    handleSimpleRepost(memory);
                  }
                }}
                onSave={() => {
                  if (!requireAuthentication()) return;
                  interactions.toggleSave(targetKey, targetMemory.viewerSaved);
                }}
                onHashtag={chooseHashtag}
              />
            );
          })}
          {!selected && !browsingGroups && !posts.length && (hashtag
            ? !hashtagFeed.loading && !hashtagFeed.error && !hashtagFeed.hayMas
            : tab === 'groups' || (!remote.loading && !remote.error && !remote.hayMas)) && (
            <div className="feed-empty">
              <h3>
                {hashtag
                  ? `Todavía no hay recuerdos con #${hashtag}`
                  : tab === "following"
                  ? "Todavía no hay publicaciones de tus seguidos"
                  : tab === "groups"
                    ? "Este grupo no tiene publicaciones para esta época y categoría"
                    : "No hay recuerdos con estos filtros"}
              </h3>
              <p>
                {hashtag ? 'Sé la primera persona en publicar un recuerdo con este hashtag.' :
                  'Explorá otras épocas y categorías, o seguí a alguien desde Para vos.'}
              </p>
            </div>
          )}
          {!selected && hashtag && <>
            <div ref={loadTarget} className="feed-load-target" aria-hidden="true" />
            {hashtagFeed.loading && <div className="feed-loading" role="status"><LoaderCircle size={20} aria-hidden="true" /><span>Cargando recuerdos…</span></div>}
            {hashtagFeed.error && <div className="feed-load-error" role="alert"><p>{hashtagFeed.error}</p><button type="button" className="secondary-button" onClick={hashtagFeed.hayMas ? hashtagFeed.more : hashtagFeed.reload}>Reintentar</button></div>}
          </>}
          {!selected && !hashtag && tab !== 'groups' && isAuthenticated && <>
            <div ref={loadTarget} className="feed-load-target" aria-hidden="true" />
            {remote.loading && <div className="feed-loading" role="status"><LoaderCircle size={20} aria-hidden="true" /><span>Cargando recuerdos…</span></div>}
            {remote.error && <div className="feed-load-error" role="alert"><p>{remote.error}</p><button type="button" className="secondary-button" onClick={remote.expired || !remote.hayMas ? remote.reload : remote.more}>{remote.expired ? 'Nueva selección' : 'Reintentar'}</button></div>}
          </>}
        </div>
      </PostDetailFrame>
      <FeedSidebar
        community={browsingGroups ? undefined : community}
        trends={<WeeklyTrends trends={trends} loading={trendsLoading} error={trendsError}
          onRetry={() => setTrendsRevision(value => value + 1)} onSelect={chooseHashtag} />}
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
              await citarPublicacion(targetId, descripcion);
              remote.reload();
              if (onReloadMemories) {
                await onReloadMemories();
              }
            } catch (err) {
              console.error("Error al citar en el servidor:", err);
            } finally {
              setRepostMemory(null);
            }
          }}
        />
      )}
    </section>
  );
}

import { useEffect, useRef, useState } from "react";
import { FeedError, getFeed, registrarImpresionesFeed, type RemoteFeed } from "../feedApi";
import { getStoredSession } from "../components/auth/authStorage";
import { feedCache } from "../sessionQueryCache";
import { getInitialFeed, type FeedSnapshot as Snapshot } from "../feedCache";
import { mergeFeedItems } from "../feedItems";

const emptySnapshot: Snapshot = { items: [], cursor: null, hayMas: false, consumed: [] };

export default function useRemoteFeed(feed: RemoteFeed | null, active: boolean) {
  const userId = getStoredSession()?.usuarioId;
  const key = `${userId ?? "guest"}:${feed}`;
  const cached = active ? feedCache.get<Snapshot>(key) : undefined;
  const [result, setResult] = useState<{ key: string; snapshot: Snapshot }>(() => ({
    key,
    snapshot: cached ? { ...cached, items: mergeFeedItems(cached.items) } : emptySnapshot,
  }));
  // A tab change must not expose the previous feed's items or pagination cursor.
  const snapshot = result.key === key ? result.snapshot : (cached ?? emptySnapshot);
  const { items, cursor, hayMas } = snapshot;
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);
  const [revision, setRevision] = useState(0);
  const request = useRef<AbortController | null>(null);
  const busy = useRef(false);
  const loadedCursors = useRef(new Set<string>());
  const forceRefresh = useRef(false);
  const currentItems = useRef(items);
  currentItems.current = items;
  const currentKey = useRef(key);
  currentKey.current = key;
  async function load(more: boolean, controller: AbortController) {
    if (!feed || currentKey.current !== key) return;
    busy.current = true;
    setLoading(true);
    setError("");
    const deadline = new AbortController();
    const timeout = window.setTimeout(() => deadline.abort(), 20000);
    const isCurrentRequest = () => !controller.signal.aborted && currentKey.current === key;
    try {
      const signal = AbortSignal.any([controller.signal, deadline.signal]);
      const first = more ? null : await getInitialFeed(feed, signal);
      const page = first
        ? { items: first.items, siguienteCursor: first.cursor, hayMas: first.hayMas }
        : await getFeed(feed, cursor ?? undefined, signal);
      if (!isCurrentRequest()) return;
      if (
        more &&
        page.hayMas &&
        page.siguienteCursor &&
        (page.siguienteCursor === cursor || loadedCursors.current.has(page.siguienteCursor))
      ) {
        throw new Error("No pudimos continuar la lista de recuerdos. Volvé a intentar.");
      }
      if (more && cursor) loadedCursors.current.add(cursor);
      if (feed === "para-vos") {
        void registrarImpresionesFeed(page.items.map((item) => item.id)).catch((err) => {
          console.warn("No se pudieron registrar las impresiones del feed.", err);
        });
      }
      const next = mergeFeedItems(more ? [...currentItems.current, ...page.items] : page.items);
      currentItems.current = next;
      const nextSnapshot: Snapshot = {
        items: next,
        cursor: page.siguienteCursor,
        hayMas: page.hayMas,
        consumed: [...loadedCursors.current],
        impressionsRegistered: true,
      };
      feedCache.set(key, nextSnapshot, Infinity);
      setResult({ key, snapshot: nextSnapshot });
      setExpired(false);
    } catch (err) {
      if (!isCurrentRequest()) return;
      if (deadline.signal.aborted) {
        setError("El servidor está tardando demasiado en cargar los recuerdos. Volvé a intentar.");
        return;
      }
      const gone = err instanceof FeedError && err.status === 410;
      setExpired(gone);
      setError(
        gone
          ? "Esta selección de Para vos venció. Recargá para ver nuevas recomendaciones."
          : (err as Error).message,
      );
      if (gone) {
        setResult((previous) =>
          previous.key === key
            ? { key, snapshot: { ...previous.snapshot, cursor: null, hayMas: false } }
            : previous,
        );
      }
    } finally {
      window.clearTimeout(timeout);
      if (isCurrentRequest()) {
        busy.current = false;
        setLoading(false);
        setRefreshing(false);
      }
    }
  }
  useEffect(() => {
    if (!active || !feed) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    const snapshot = forceRefresh.current ? undefined : feedCache.get<Snapshot>(key);
    const refreshing = forceRefresh.current;
    forceRefresh.current = false;
    setError("");
    setExpired(false);
    setLoading(false);
    if (snapshot) {
      if (feed === "para-vos" && !snapshot.impressionsRegistered) {
        snapshot.impressionsRegistered = true;
        void registrarImpresionesFeed(snapshot.items.map((item) => item.id)).catch(() => {});
      }
      const restored = { ...snapshot, items: mergeFeedItems(snapshot.items) };
      currentItems.current = restored.items;
      setResult({ key, snapshot: restored });
      loadedCursors.current = new Set(snapshot.consumed);
    } else {
      loadedCursors.current.clear();
      if (!refreshing) {
        currentItems.current = [];
        setResult({ key, snapshot: emptySnapshot });
      }
      void load(false, controller);
    }
    return () => {
      controller.abort();
      busy.current = false;
    };
  }, [feed, active, revision, key]);
  function more() {
    if (
      currentKey.current !== key ||
      result.key !== key ||
      busy.current ||
      !cursor ||
      !hayMas ||
      expired ||
      !active
    )
      return;
    const controller = new AbortController();
    request.current = controller;
    void load(true, controller);
  }
  useEffect(() => () => request.current?.abort(), [feed, active, revision, key]);
  return {
    items,
    loading: active && !!feed && (result.key !== key || loading),
    refreshing,
    error,
    expired,
    hayMas: hayMas && !!cursor,
    more,
    reload: () => {
      setRefreshing(true);
      request.current?.abort();
      feedCache.delete(key);
      forceRefresh.current = true;
      setRevision((value) => value + 1);
    },
  };
}

import { useEffect, useRef, useState } from 'react';
import { FeedError, getFeed, registrarImpresionesFeed, type RemoteFeed } from '../feedApi';
import { getStoredSession } from '../components/auth/authStorage';
import { feedCache } from '../sessionQueryCache';
import type { Memory } from '../types';
import { getInitialFeed, type FeedSnapshot as Snapshot } from '../feedCache';

export default function useRemoteFeed(feed: RemoteFeed | null, active: boolean) {
  const userId = getStoredSession()?.usuarioId;
  const key = `${userId ?? 'guest'}:${feed}`;
  const cached = active ? feedCache.get<Snapshot>(key) : undefined;
  const [items, setItems] = useState<Memory[]>(cached?.items ?? []);
  const [cursor, setCursor] = useState<string | null>(cached?.cursor ?? null);
  const [hayMas, setHayMas] = useState(cached?.hayMas ?? false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expired, setExpired] = useState(false);
  const [revision, setRevision] = useState(0);
  const request = useRef<AbortController | null>(null);
  const busy = useRef(false);
  const loadedCursors = useRef(new Set<string>());
  const forceRefresh = useRef(false);
  const currentItems = useRef(items);
  currentItems.current = items;
  async function load(more: boolean, controller: AbortController) {
    if (!feed) return;
    busy.current = true; setLoading(true); setError('');
    try {
      const first = more ? null : await getInitialFeed(feed, controller.signal);
      const page = first
        ? { items: first.items, siguienteCursor: first.cursor, hayMas: first.hayMas }
        : await getFeed(feed, cursor ?? undefined, controller.signal);
      if (controller.signal.aborted) return;
      if (more && page.hayMas && page.siguienteCursor && (page.siguienteCursor === cursor || loadedCursors.current.has(page.siguienteCursor))) {
        throw new Error('No pudimos continuar la lista de recuerdos. Volvé a intentar.');
      }
      if (more && cursor) loadedCursors.current.add(cursor);
      if (feed === 'para-vos') {
        void registrarImpresionesFeed(page.items.map(item => item.id)).catch((err) => {
          console.warn('No se pudieron registrar las impresiones del feed.', err);
        });
      }
      const next = more ? [...new Map([...currentItems.current, ...page.items].map(item => [item.id, item])).values()] : page.items;
      currentItems.current = next;
      feedCache.set<Snapshot>(key, { items: next, cursor: page.siguienteCursor, hayMas: page.hayMas, consumed: [...loadedCursors.current], impressionsRegistered: true }, Infinity);
      setItems(next);
      setCursor(page.siguienteCursor); setHayMas(page.hayMas); setExpired(false);
    } catch (err) {
      if (controller.signal.aborted) return;
      const gone = err instanceof FeedError && err.status === 410;
      setExpired(gone);
      setError(gone ? 'Esta selección de Para vos venció. Recargá para ver nuevas recomendaciones.' : (err as Error).message);
      if (gone) { setCursor(null); setHayMas(false); }
    } finally {
      if (!controller.signal.aborted) { busy.current = false; setLoading(false); }
    }
  }
  useEffect(() => {
    if (!active || !feed) return;
    const controller = new AbortController(); request.current = controller;
    const snapshot = forceRefresh.current ? undefined : feedCache.get<Snapshot>(key);
    const refreshing = forceRefresh.current;
    forceRefresh.current = false;
    setError(''); setExpired(false); setLoading(false);
    if (snapshot) {
      if (feed === 'para-vos' && !snapshot.impressionsRegistered) {
        snapshot.impressionsRegistered = true;
        void registrarImpresionesFeed(snapshot.items.map(item => item.id)).catch(() => {});
      }
      currentItems.current = snapshot.items;
      setItems(snapshot.items); setCursor(snapshot.cursor); setHayMas(snapshot.hayMas);
      loadedCursors.current = new Set(snapshot.consumed);
    } else {
      loadedCursors.current.clear();
      if (!refreshing) { currentItems.current = []; setItems([]); setCursor(null); setHayMas(false); }
      void load(false, controller);
    }
    return () => { controller.abort(); busy.current = false; };
  }, [feed, active, revision, key]);
  function more() {
    if (busy.current || !cursor || !hayMas || expired || !active) return;
    const controller = new AbortController(); request.current = controller;
    void load(true, controller);
  }
  useEffect(() => () => request.current?.abort(), [feed, active, revision, key]);
  return { items, loading, error, expired, hayMas: hayMas && !!cursor, more, reload: () => { request.current?.abort(); feedCache.delete(key); forceRefresh.current = true; setRevision(value => value + 1); } };
}

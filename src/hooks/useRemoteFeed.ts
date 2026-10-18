import { useEffect, useRef, useState } from 'react';
import { FeedError, getFeed, type RemoteFeed } from '../feedApi';
import type { LikeSummary } from '../publicationsApi';
import type { Memory } from '../types';

export default function useRemoteFeed(feed: RemoteFeed | null, active: boolean) {
  const [items, setItems] = useState<Memory[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hayMas, setHayMas] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expired, setExpired] = useState(false);
  const [revision, setRevision] = useState(0);
  const request = useRef<AbortController | null>(null);
  const busy = useRef(false);
  async function load(more: boolean, controller: AbortController) {
    if (!feed) return;
    busy.current = true; setLoading(true); setError('');
    try {
      const page = await getFeed(feed, more ? cursor ?? undefined : undefined, controller.signal);
      if (controller.signal.aborted) return;
      setItems(current => more ? [...new Map([...current, ...page.items].map(item => [item.id, item])).values()] : page.items);
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
    setItems([]); setCursor(null); setHayMas(false); setExpired(false);
    void load(false, controller);
    return () => { controller.abort(); busy.current = false; };
  }, [feed, active, revision]);
  function more() {
    if (busy.current || !cursor || !hayMas || expired || !active) return;
    const controller = new AbortController(); request.current = controller;
    void load(true, controller);
  }
  function updateLikeSummary(publicationId: string, summary: LikeSummary) {
    setItems(current => current.map(item => item.id === publicationId || item.repost?.originalId === publicationId
      ? { ...item, likeCount: summary.cantidadLikes, viewerLiked: summary.dioLike }
      : item));
  }
  useEffect(() => () => request.current?.abort(), [feed, active, revision]);
  return { items, loading, error, expired, hayMas: hayMas && !!cursor, more, updateLikeSummary, reload: () => { request.current?.abort(); setRevision(value => value + 1); } };
}

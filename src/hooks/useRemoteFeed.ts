import { useEffect, useRef, useState } from 'react';
import { FeedError, getFeed, registrarImpresionesFeed, type RemoteFeed } from '../feedApi';
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
  const loadedCursors = useRef(new Set<string>());
  async function load(more: boolean, controller: AbortController) {
    if (!feed) return;
    busy.current = true; setLoading(true); setError('');
    const deadline = new AbortController();
    const timeout = window.setTimeout(() => deadline.abort(), 20000);
    try {
      const page = await getFeed(feed, more ? cursor ?? undefined : undefined, AbortSignal.any([controller.signal, deadline.signal]));
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
      setItems(current => more ? [...new Map([...current, ...page.items].map(item => [item.id, item])).values()] : page.items);
      setCursor(page.siguienteCursor); setHayMas(page.hayMas); setExpired(false);
    } catch (err) {
      if (controller.signal.aborted) return;
      if (deadline.signal.aborted) {
        setError('El servidor está tardando demasiado en cargar los recuerdos. Volvé a intentar.');
        return;
      }
      const gone = err instanceof FeedError && err.status === 410;
      setExpired(gone);
      setError(gone ? 'Esta selección de Para vos venció. Recargá para ver nuevas recomendaciones.' : (err as Error).message);
      if (gone) { setCursor(null); setHayMas(false); }
    } finally {
      window.clearTimeout(timeout);
      if (!controller.signal.aborted) { busy.current = false; setLoading(false); }
    }
  }
  useEffect(() => {
    if (!active || !feed) { setLoading(false); return; }
    const controller = new AbortController(); request.current = controller;
    loadedCursors.current.clear();
    setItems([]); setCursor(null); setHayMas(false); setExpired(false);
    void load(false, controller);
    return () => { controller.abort(); busy.current = false; };
  }, [feed, active, revision]);
  function more() {
    if (busy.current || !cursor || !hayMas || expired || !active) return;
    const controller = new AbortController(); request.current = controller;
    void load(true, controller);
  }
  useEffect(() => () => request.current?.abort(), [feed, active, revision]);
  return { items, loading, error, expired, hayMas: hayMas && !!cursor, more, reload: () => { request.current?.abort(); setRevision(value => value + 1); } };
}

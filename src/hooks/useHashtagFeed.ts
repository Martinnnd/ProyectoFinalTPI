import { useCallback, useEffect, useRef, useState } from "react";
import { getHashtagPosts } from "../hashtagsApi";
import type { FeedPage } from "../feedApi";

const emptyPage: FeedPage = { items: [], siguienteCursor: null, hayMas: false };

export default function useHashtagFeed(tag: string | null, active: boolean) {
  const [result, setResult] = useState<{ tag: string | null; page: FeedPage }>({ tag: null, page: emptyPage });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);
  const busy = useRef(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    request.current?.abort();
    busy.current = false;
    if (!active || !tag) return;
    const controller = new AbortController();
    request.current = controller;
    busy.current = true;
    setResult({ tag, page: emptyPage });
    setLoading(true);
    setError("");
    getHashtagPosts(tag, undefined, controller.signal)
      .then(page => { if (!controller.signal.aborted) setResult({ tag, page }); })
      .catch(cause => { if (!controller.signal.aborted) setError((cause as Error).message); })
      .finally(() => {
        if (!controller.signal.aborted) { busy.current = false; setLoading(false); }
      });
    return () => { controller.abort(); busy.current = false; };
  }, [tag, active, revision]);

  const page = result.tag === tag ? result.page : emptyPage;
  const more = useCallback(() => {
    if (!active || !tag || busy.current || !page.hayMas || !page.siguienteCursor) return;
    const currentCursor = page.siguienteCursor;
    const controller = new AbortController();
    request.current = controller;
    busy.current = true;
    setLoading(true);
    setError("");
    getHashtagPosts(tag, currentCursor, controller.signal)
      .then(next => {
        if (controller.signal.aborted) return;
        if (next.hayMas && next.siguienteCursor === currentCursor)
          throw new Error("No pudimos continuar la lista de recuerdos. Volvé a intentar.");
        setResult(previous => previous.tag === tag ? {
          tag, page: {
            ...next,
            items: [...new Map([...previous.page.items, ...next.items].map(item => [item.id, item])).values()],
          },
        } : previous);
      })
      .catch(cause => { if (!controller.signal.aborted) setError((cause as Error).message); })
      .finally(() => {
        if (!controller.signal.aborted) { busy.current = false; setLoading(false); }
      });
  }, [active, tag, page.hayMas, page.siguienteCursor]);

  return {
    items: page.items,
    hayMas: page.hayMas && !!page.siguienteCursor,
    loading: active && !!tag && (result.tag !== tag || loading),
    error,
    more,
    reload: () => setRevision(value => value + 1),
  };
}

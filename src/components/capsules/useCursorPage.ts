"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CursorPage } from "../../capsulesApi";
import { mergeCapsuleItems } from "./capsulePresentation";

// Cada cambio de recurso cancela la consulta anterior. La década no forma parte de la consulta.
export function useCursorPage<T extends { id: string | number }>(
  load: (cursor: string | null, signal: AbortSignal) => Promise<CursorPage<T>>,
) {
  const [snapshot, setSnapshot] = useState<{
    loader: typeof load;
    items: T[];
    cursor: string | null;
    loading: boolean;
    error: string;
  }>({ loader: load, items: [], cursor: null, loading: true, error: "" });
  // Una respuesta de otro recurso nunca se muestra mientras llega su reemplazo.
  const page =
    snapshot.loader === load
      ? snapshot
      : { loader: load, items: [] as T[], cursor: null, loading: true, error: "" };
  const request = useRef<AbortController | null>(null);
  const busy = useRef(false);

  const fetchPage = useCallback(
    async (next: string | null, replace: boolean) => {
      request.current?.abort();
      const controller = new AbortController();
      request.current = controller;
      busy.current = true;
      try {
        const result = await load(next, controller.signal);
        if (controller.signal.aborted) return;
        setSnapshot((current) => ({
          loader: load,
          items: mergeCapsuleItems(
            replace || current.loader !== load ? [] : current.items,
            result.items,
          ),
          cursor: result.siguienteCursor,
          loading: false,
          error: "",
        }));
      } catch (cause) {
        if (!controller.signal.aborted)
          setSnapshot((current) => ({
            loader: load,
            items: current.loader === load ? current.items : [],
            cursor: current.loader === load ? current.cursor : null,
            loading: false,
            error: cause instanceof Error ? cause.message : "No pudimos cargar los recuerdos.",
          }));
      } finally {
        if (!controller.signal.aborted) {
          busy.current = false;
        }
      }
    },
    [load],
  );

  useEffect(() => {
    void fetchPage(null, true);
    return () => {
      request.current?.abort();
      busy.current = false;
    };
  }, [fetchPage]);

  function start(next: string | null, replace: boolean) {
    if (busy.current) return;
    setSnapshot({ ...page, loading: true, error: "" });
    void fetchPage(next, replace);
  }

  return {
    items: page.items,
    cursor: page.cursor,
    loading: page.loading,
    error: page.error,
    more: () => {
      if (page.cursor) start(page.cursor, false);
    },
    retry: () => {
      start(page.cursor, page.items.length === 0);
    },
  };
}

"use client";

import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { useStore } from "zustand";
import { useAuth } from "../components/auth/AuthProvider";
import { createNoticeStore, type NoticeState } from "./noticeStore";

type NoticeStore = ReturnType<typeof createNoticeStore>;
const NoticeContext = createContext<NoticeStore | null>(null);

export function NoticeProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<NoticeStore | null>(null);
  if (!storeRef.current) storeRef.current = createNoticeStore();
  const store = storeRef.current;
  const notice = useStore(store, (state) => state.notice);
  const { session } = useAuth();
  const currentUserId = session?.usuarioId;

  useEffect(() => {
    store.getState().setNotice(null);
  }, [currentUserId, store]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => store.getState().setNotice(null), 3500);
    return () => window.clearTimeout(timer);
  }, [notice, store]);

  return <NoticeContext.Provider value={store}>{children}</NoticeContext.Provider>;
}

export function useNotice<T>(selector: (state: NoticeState) => T): T {
  const store = useContext(NoticeContext);
  if (!store) throw new Error("useNotice debe usarse dentro de NoticeProvider.");
  return useStore(store, selector);
}

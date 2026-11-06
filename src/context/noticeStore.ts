import { createStore } from "zustand/vanilla";

export type NoticeState = {
  notice: string | null;
  setNotice: (message: string | null) => void;
};

export function createNoticeStore() {
  return createStore<NoticeState>()((set) => ({
    notice: null,
    setNotice: (notice) => set({ notice }),
  }));
}

import { createStore } from "zustand/vanilla";

export type ToastType = "success" | "error" | "info" | "warning";
export type Toast = {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
};

let nextToastId = 0;

export type NoticeState = {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  dismissToast: (id: number) => void;
  clearToasts: () => void;
  /** Kept for existing success and informational notices. */
  setNotice: (message: string | null) => void;
};

export function createNoticeStore() {
  return createStore<NoticeState>()((set, get) => ({
    toasts: [],
    showToast: (message, type = "info", duration = type === "error" ? 6000 : 3500) => {
      const cleanMessage = message.trim();
      if (!cleanMessage) return;
      set((state) => {
        if (state.toasts.some((toast) => toast.message === cleanMessage && toast.type === type))
          return state;
        return {
          toasts: [
            ...state.toasts,
            { id: ++nextToastId, message: cleanMessage, type, duration },
          ].slice(-3),
        };
      });
    },
    dismissToast: (id) =>
      set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
    clearToasts: () => set({ toasts: [] }),
    setNotice: (message) => {
      if (message === null) get().clearToasts();
      else get().showToast(message);
    },
  }));
}

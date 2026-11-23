import { createStore } from "zustand/vanilla";
import type { Candidate } from "./api";

type RankingViewState = {
  contributions: Record<number, string>;
  expandedSong: number | null;
  suggesting: boolean;
  editing: Candidate | null;
  withdrawing: Candidate | null;
  now: number;
  resetActions: () => void;
  setContribution: (id: number, value: string) => void;
  toggleSong: (id: number) => void;
  toggleSuggestion: () => void;
  setEditing: (song: Candidate | null) => void;
  setWithdrawing: (song: Candidate | null) => void;
  tick: () => void;
};

export function createRankingViewStore() {
  return createStore<RankingViewState>()((set) => ({
    contributions: {},
    expandedSong: null,
    suggesting: false,
    editing: null,
    withdrawing: null,
    now: Date.now(),
    resetActions: () =>
      set({ expandedSong: null, suggesting: false, editing: null, withdrawing: null }),
    setContribution: (id, value) =>
      set((state) => ({ contributions: { ...state.contributions, [id]: value } })),
    toggleSong: (id) => set((state) => ({ expandedSong: state.expandedSong === id ? null : id })),
    toggleSuggestion: () => set((state) => ({ suggesting: !state.suggesting })),
    setEditing: (editing) => set({ editing }),
    setWithdrawing: (withdrawing) => set({ withdrawing }),
    tick: () => set({ now: Date.now() }),
  }));
}

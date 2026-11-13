import { createStore } from "zustand/vanilla";
import type { SetStateAction } from "react";
import type { Period } from "../types";

export type EraState = {
  period: Period;
  musicOpen: boolean;
  factsOpen: boolean;
  panelOpen: boolean;
  setPeriod: (value: SetStateAction<Period>) => void;
  setMusicOpen: (open: boolean) => void;
  setFactsOpen: (open: boolean) => void;
  setPanelOpen: (open: boolean) => void;
};

export function createEraStore() {
  return createStore<EraState>()((set) => ({
    period: { decade: 1980, year: null },
    musicOpen: false,
    factsOpen: false,
    panelOpen: false,
    setPeriod: (value) =>
      set((state) => ({
        period: typeof value === "function" ? value(state.period) : value,
      })),
    setMusicOpen: (musicOpen) => set({ musicOpen }),
    setFactsOpen: (factsOpen) => set({ factsOpen }),
    setPanelOpen: (panelOpen) => set({ panelOpen }),
  }));
}

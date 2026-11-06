"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { flushSync } from "react-dom";
import { useStore } from "zustand";
import type { Decade, Period } from "../types";
import { eraThemes } from "../themes";
import { createEraStore, type EraState } from "./eraStore";

export type ChangePeriodFn = {
  (next: Period, afterChange?: () => void): void;
  (decade: Decade, year?: number | null, afterChange?: () => void): void;
  (
    periodOrDecade: Period | Decade,
    yearOrAfterChange?: number | null | (() => void),
    afterChange?: () => void,
  ): void;
};

interface EraContextType {
  period: Period;
  setPeriod: React.Dispatch<React.SetStateAction<Period>>;
  changePeriod: ChangePeriodFn;
  theme: (typeof eraThemes)[Decade];
  musicOpen: boolean;
  setMusicOpen: (open: boolean) => void;
  factsOpen: boolean;
  setFactsOpen: (open: boolean) => void;
  panelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
}

const DEFAULT_PERIOD: Period = { decade: 1980, year: null };
const ERA_STORAGE_KEY = "nostalgia_era";

type EraStore = ReturnType<typeof createEraStore>;
const EraContext = createContext<{ store: EraStore; changePeriod: ChangePeriodFn } | null>(null);

export function EraProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<EraStore | null>(null);
  if (!storeRef.current) storeRef.current = createEraStore();
  const store = storeRef.current;
  const period = useStore(store, (state) => state.period);
  const setPeriod = useStore(store, (state) => state.setPeriod);
  const [hydrated, setHydrated] = useState(false);

  // Sincronizar en el cliente post-hidratación para evitar hydration mismatch con SSR
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const eraParam = params.get("era");
      let initialDecade: Decade | null = null;
      if (
        eraParam === "1970" ||
        eraParam === "1980" ||
        eraParam === "1990" ||
        eraParam === "2000" ||
        eraParam === "2010" ||
        eraParam === "2020"
      ) {
        initialDecade = Number(eraParam) as Decade;
      } else {
        const savedEra = window.localStorage.getItem(ERA_STORAGE_KEY);
        if (
          savedEra === "1970" ||
          savedEra === "1980" ||
          savedEra === "1990" ||
          savedEra === "2000" ||
          savedEra === "2010" ||
          savedEra === "2020"
        ) {
          initialDecade = Number(savedEra) as Decade;
        }
      }

      const decade = initialDecade ?? DEFAULT_PERIOD.decade;
      const year = Number(params.get("year") ?? window.localStorage.getItem("nostalgia_year"));
      setPeriod({
        decade,
        year:
          Number.isInteger(year) &&
          year >= decade &&
          year < decade + 10 &&
          year <= new Date().getFullYear()
            ? year
            : null,
      });
    } catch {
      // Ignorar si el almacenamiento local está restringido
    }
    setHydrated(true);
  }, [setPeriod]);

  // Persistir en localStorage cada vez que cambia la década (omitir primer ciclo para no sobreescribir)
  useEffect(() => {
    if (!hydrated) return;
    const url = new URL(window.location.href);
    url.searchParams.set("era", String(period.decade));
    if (period.year === null) url.searchParams.delete("year");
    else url.searchParams.set("year", String(period.year));
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    try {
      window.localStorage.setItem(ERA_STORAGE_KEY, String(period.decade));
      if (period.year === null) window.localStorage.removeItem("nostalgia_year");
      else window.localStorage.setItem("nostalgia_year", String(period.year));
    } catch {
      // Ignorar
    }
  }, [hydrated, period.decade, period.year]);

  const eraTransition = useRef<{ finished: Promise<void>; skipTransition: () => void } | null>(
    null,
  );
  const periodChangeRevision = useRef(0);
  useEffect(
    () => () => {
      eraTransition.current?.skipTransition();
    },
    [],
  );

  const changePeriod: ChangePeriodFn = useCallback(
    (
      periodOrDecade: Period | Decade,
      yearOrAfterChange?: number | null | (() => void),
      afterChange?: () => void,
    ) => {
      const revision = ++periodChangeRevision.current;
      eraTransition.current?.skipTransition();
      let next: Period;
      let callback: (() => void) | undefined;

      if (typeof periodOrDecade === "object") {
        next = periodOrDecade;
        callback = typeof yearOrAfterChange === "function" ? yearOrAfterChange : afterChange;
      } else {
        next = {
          decade: periodOrDecade,
          year: typeof yearOrAfterChange === "number" ? yearOrAfterChange : null,
        };
        callback = afterChange;
      }

      if (next.decade === period.decade && next.year === period.year) {
        callback?.();
        return;
      }

      const update = () => {
        if (revision !== periodChangeRevision.current) return;
        setPeriod(next);
        callback?.();
      };

      if (
        typeof window === "undefined" ||
        next.decade === period.decade ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        update();
        return;
      }

      const doc = document as unknown as {
        startViewTransition?: (cb: () => void) => {
          finished: Promise<void>;
          skipTransition: () => void;
        };
        documentElement: HTMLElement;
        querySelector: (selector: string) => HTMLElement | null;
      };

      if (typeof doc.startViewTransition === "function") {
        eraTransition.current?.skipTransition();
        doc.documentElement.classList.add("switching-era");
        const transition = doc.startViewTransition(() => flushSync(update));
        eraTransition.current = transition;
        void transition.finished
          .catch(() => {})
          .finally(() => {
            if (eraTransition.current === transition) {
              doc.documentElement.classList.remove("switching-era");
              eraTransition.current = null;
            }
          });
      } else {
        flushSync(update);
        doc.querySelector(".app")?.animate([{ opacity: 0.35 }, { opacity: 1 }], {
          duration: 600,
          easing: "ease-out",
        });
      }
    },
    [period],
  );

  const value = useMemo(() => ({ store, changePeriod }), [store, changePeriod]);
  return <EraContext.Provider value={value}>{children}</EraContext.Provider>;
}

export function useEraState<T>(selector: (state: EraState) => T): T {
  const context = useContext(EraContext);
  if (!context) {
    throw new Error("useEra must be used within an EraProvider");
  }
  return useStore(context.store, selector);
}

export function useEra(): EraContextType {
  const context = useContext(EraContext);
  if (!context) throw new Error("useEra must be used within an EraProvider");
  const period = useStore(context.store, (state) => state.period);
  const setPeriod = useStore(context.store, (state) => state.setPeriod);
  const musicOpen = useStore(context.store, (state) => state.musicOpen);
  const setMusicOpen = useStore(context.store, (state) => state.setMusicOpen);
  const factsOpen = useStore(context.store, (state) => state.factsOpen);
  const setFactsOpen = useStore(context.store, (state) => state.setFactsOpen);
  const panelOpen = useStore(context.store, (state) => state.panelOpen);
  const setPanelOpen = useStore(context.store, (state) => state.setPanelOpen);
  const theme = useMemo(() => eraThemes[period.decade], [period.decade]);
  return {
    period,
    setPeriod,
    changePeriod: context.changePeriod,
    theme,
    musicOpen,
    setMusicOpen,
    factsOpen,
    setFactsOpen,
    panelOpen,
    setPanelOpen,
  };
}

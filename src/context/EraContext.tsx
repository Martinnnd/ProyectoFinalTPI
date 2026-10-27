"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useRef, useCallback } from "react";
import { flushSync } from "react-dom";
import type { Decade, Period } from "../types";
import { eraThemes } from "../themes";

export type ChangePeriodFn = {
  (next: Period, afterChange?: () => void): void;
  (decade: Decade, year?: number | null, afterChange?: () => void): void;
  (periodOrDecade: Period | Decade, yearOrAfterChange?: number | null | (() => void), afterChange?: () => void): void;
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

const EraContext = createContext<EraContextType | undefined>(undefined);

export function EraProvider({ children }: { children: React.ReactNode }) {
  const [period, setPeriod] = useState<Period>(DEFAULT_PERIOD);
  const [hydrated, setHydrated] = useState(false);

  const [musicOpen, setMusicOpen] = useState(false);
  const [factsOpen, setFactsOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  // Sincronizar en el cliente post-hidratación para evitar hydration mismatch con SSR
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const eraParam = params.get("era");
      let initialDecade: Decade | null = null;
      if (eraParam === "1970" || eraParam === "1980" || eraParam === "1990" || eraParam === "2000" || eraParam === "2010") {
        initialDecade = Number(eraParam) as Decade;
      } else {
        const savedEra = window.localStorage.getItem(ERA_STORAGE_KEY);
        if (savedEra === "1970" || savedEra === "1980" || savedEra === "1990" || savedEra === "2000" || savedEra === "2010") {
          initialDecade = Number(savedEra) as Decade;
        }
      }

      const decade = initialDecade ?? DEFAULT_PERIOD.decade;
      const year = Number(params.get("year") ?? window.localStorage.getItem("nostalgia_year"));
      setPeriod({ decade, year: Number.isInteger(year) && year >= decade && year < decade + 10 ? year : null });
    } catch {
      // Ignorar si el almacenamiento local está restringido
    }
    setHydrated(true);
  }, []);

  // Persistir en localStorage cada vez que cambia la década (omitir primer ciclo para no sobreescribir)
  useEffect(() => {
    if (!hydrated) return;
    const url = new URL(window.location.href);
    url.searchParams.set("era", String(period.decade));
    if (period.year === null) url.searchParams.delete("year");
    else url.searchParams.set("year", String(period.year));
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    try {
      window.localStorage.setItem(ERA_STORAGE_KEY, String(period.decade));
      if (period.year === null) window.localStorage.removeItem("nostalgia_year");
      else window.localStorage.setItem("nostalgia_year", String(period.year));
    } catch {
      // Ignorar
    }
  }, [hydrated, period.decade, period.year]);

  const eraTransition = useRef<{ finished: Promise<void>; skipTransition: () => void } | null>(null);
  const periodChangeRevision = useRef(0);
  useEffect(() => () => { eraTransition.current?.skipTransition(); }, []);

  const changePeriod: ChangePeriodFn = useCallback(
    (
      periodOrDecade: Period | Decade,
      yearOrAfterChange?: number | null | (() => void),
      afterChange?: () => void
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
        startViewTransition?: (cb: () => void) => { finished: Promise<void>; skipTransition: () => void };
        documentElement: HTMLElement;
        querySelector: (selector: string) => HTMLElement | null;
      };

      if (typeof doc.startViewTransition === "function") {
        eraTransition.current?.skipTransition();
        doc.documentElement.classList.add("switching-era");
        const transition = doc.startViewTransition(() => flushSync(update));
        eraTransition.current = transition;
        void transition.finished.catch(() => {}).finally(() => {
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
    [period]
  );

  const theme = useMemo(() => eraThemes[period.decade], [period.decade]);

  const value = useMemo(
    () => ({
      period,
      setPeriod,
      changePeriod,
      theme,
      musicOpen,
      setMusicOpen,
      factsOpen,
      setFactsOpen,
      panelOpen,
      setPanelOpen,
    }),
    [period, changePeriod, theme, musicOpen, factsOpen, panelOpen]
  );

  return <EraContext.Provider value={value}>{children}</EraContext.Provider>;
}

export function useEra() {
  const context = useContext(EraContext);
  if (!context) {
    throw new Error("useEra must be used within an EraProvider");
  }
  return context;
}

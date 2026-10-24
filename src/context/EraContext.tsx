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

const EraContext = createContext<EraContextType | undefined>(undefined);

export function EraProvider({ children }: { children: React.ReactNode }) {
  const [period, setPeriod] = useState<Period>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const eraParam = params.get("era");
      if (eraParam === "1970" || eraParam === "1980" || eraParam === "1990" || eraParam === "2000") {
        return { decade: Number(eraParam) as Decade, year: null };
      }
    }
    return DEFAULT_PERIOD;
  });

  const [musicOpen, setMusicOpen] = useState(false);
  const [factsOpen, setFactsOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  const eraTransition = useRef<{ finished: Promise<void>; skipTransition: () => void } | null>(null);
  useEffect(() => () => { eraTransition.current?.skipTransition(); }, []);

  const changePeriod: ChangePeriodFn = useCallback(
    (
      periodOrDecade: Period | Decade,
      yearOrAfterChange?: number | null | (() => void),
      afterChange?: () => void
    ) => {
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

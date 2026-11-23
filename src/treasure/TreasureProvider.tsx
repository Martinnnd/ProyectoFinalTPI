"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "../components/auth/AuthProvider";
import { getTreasureChallenge, type TreasureChallenge, type TreasureFinding } from "./treasureApi";

type TreasureContextValue = {
  challenge: TreasureChallenge | null;
  refresh: () => Promise<void>;
  markFound: (finding: TreasureFinding) => void;
  usuarioId: number | null;
};
const Context = createContext<TreasureContextValue | null>(null);

export function TreasureProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const usuarioId = session?.usuarioId ?? null;
  const [state, setState] = useState<{ owner: number | null; challenge: TreasureChallenge | null }>(
    { owner: null, challenge: null },
  );
  const pending = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    pending.current?.abort();
    if (!usuarioId) return;
    const controller = new AbortController();
    pending.current = controller;
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const challenge = await getTreasureChallenge(controller.signal);
      if (!controller.signal.aborted)
        setState({
          owner: usuarioId,
          challenge: challenge && Date.parse(challenge.finUtc) > Date.now() ? challenge : null,
        });
    } catch {
      // El reto es complementario: una caída de esta API no bloquea el feed o el mapa.
    } finally {
      clearTimeout(timeout);
    }
  }, [usuarioId]);

  useEffect(() => {
    void refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const timer = setInterval(onVisible, 60000);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      pending.current?.abort();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [refresh]);

  useEffect(() => {
    if (state.owner !== usuarioId || !state.challenge) return;
    const delay = Math.min(
      2_147_483_647,
      Math.max(0, Date.parse(state.challenge.finUtc) - Date.now()),
    );
    const timer = setTimeout(() => {
      setState({ owner: usuarioId, challenge: null });
      void refresh();
    }, delay);
    return () => clearTimeout(timer);
  }, [state, usuarioId, refresh]);

  const markFound = useCallback(
    (finding: TreasureFinding) => {
      pending.current?.abort();
      setState((current) =>
        current.owner === usuarioId && current.challenge?.id === finding.retoId
          ? { ...current, challenge: { ...current.challenge, halladoUtc: finding.halladoUtc } }
          : current,
      );
    },
    [usuarioId],
  );
  const challenge = state.owner === usuarioId ? state.challenge : null;
  const value = useMemo(
    () => ({ challenge, refresh, markFound, usuarioId }),
    [challenge, refresh, markFound, usuarioId],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useTreasure() {
  return useContext(Context);
}

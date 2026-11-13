"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "../components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { ratePublication } from "../publicationsApi";
import { type NostalgiaRatings } from "../nostalgiaRatings";
import { useNotice } from "./NoticeProvider";

interface RatingsContextType {
  ratings: NostalgiaRatings;
  pointsMap: Record<string, number>;
  rateMemory: (postId: string, score: number, canRate?: boolean) => Promise<void>;
}

const RatingsContext = createContext<RatingsContextType | undefined>(undefined);

export function RatingsProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const currentUserId = session?.usuarioId;
  const router = useRouter();
  const currentAccount = useRef(currentUserId);
  currentAccount.current = currentUserId;
  const pending = useRef(new Set<string>());

  const [ratings, setRatings] = useState<NostalgiaRatings>({});
  const [pointsMap, setPointsMap] = useState<Record<string, number>>({});
  const showToast = useNotice((state) => state.showToast);

  useEffect(() => {
    setRatings({});
    setPointsMap({});
  }, [currentUserId]);

  const rateMemory = useCallback(
    async (postId: string, score: number, canRate: boolean = true) => {
      if (!currentUserId) {
        router.push("/auth/login?returnTo=/feed");
        return;
      }
      if (!canRate) {
        showToast("Disponible desde la categoría Nostálgico.", "warning");
        return;
      }
      const requestKey = `${currentUserId}:${postId}`;
      if (pending.current.has(requestKey)) return;
      pending.current.add(requestKey);
      try {
        const res = await ratePublication(postId, score);
        if (currentAccount.current !== currentUserId) return;
        setPointsMap((current) => ({
          ...current,
          [postId]: res.puntosTotales,
        }));
        if (res.miPuntuacion === null || res.miPuntuacion === undefined) {
          // 0 confirma que se quitó: no vuelve a mostrar el puntaje anterior del DTO.
          setRatings((current) => ({ ...current, [postId]: 0 }));
        } else {
          setRatings((current) => ({
            ...current,
            [postId]: res.miPuntuacion!,
          }));
        }
      } catch (error) {
        if (currentAccount.current === currentUserId)
          showToast(error instanceof Error ? error.message : "No se pudo registrar la puntuación.", "error");
      } finally {
        pending.current.delete(requestKey);
      }
    },
    [currentUserId, router, showToast],
  );

  return (
    <RatingsContext.Provider value={{ ratings, pointsMap, rateMemory }}>
      {children}
    </RatingsContext.Provider>
  );
}

export function useRatings() {
  const context = useContext(RatingsContext);
  if (!context) {
    throw new Error("useRatings must be used within a RatingsProvider");
  }
  return context;
}

"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAuth } from "../components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { ratePublication } from "../publicationsApi";
import { updateNostalgiaRating, type NostalgiaRatings } from "../nostalgiaRatings";

interface RatingsContextType {
  ratings: NostalgiaRatings;
  pointsMap: Record<string, number>;
  rateMemory: (postId: string, score: number, canRate?: boolean) => Promise<void>;
  notice: string | null;
  setNotice: (msg: string | null) => void;
}

const RatingsContext = createContext<RatingsContextType | undefined>(undefined);

export function RatingsProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const currentUserId = session?.usuarioId;
  const router = useRouter();

  const [ratings, setRatings] = useState<NostalgiaRatings>({});
  const [pointsMap, setPointsMap] = useState<Record<string, number>>({});
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const rateMemory = useCallback(
    async (postId: string, score: number, canRate: boolean = true) => {
      if (!currentUserId) {
        router.push("/auth/login?returnTo=/feed");
        return;
      }
      if (!canRate) {
        setNotice("Disponible desde la categoría Nostálgico.");
        return;
      }
      const previousRating = ratings[postId];
      const next = updateNostalgiaRating(ratings, postId, score);
      setRatings(next);

      try {
        const res = await ratePublication(postId, score);
        setPointsMap((current) => ({
          ...current,
          [postId]: res.puntosTotales,
        }));
        if (res.miPuntuacion === null || res.miPuntuacion === undefined) {
          setRatings((current) => {
            const updated = { ...current };
            delete updated[postId];
            return updated;
          });
        } else {
          setRatings((current) => ({
            ...current,
            [postId]: res.miPuntuacion!,
          }));
        }
      } catch (error) {
        setRatings((current) => {
          const reverted = { ...current };
          if (previousRating !== undefined) reverted[postId] = previousRating;
          else delete reverted[postId];
          return reverted;
        });
        setNotice(error instanceof Error ? error.message : "No se pudo registrar la puntuación.");
      }
    },
    [currentUserId, ratings, router]
  );

  return (
    <RatingsContext.Provider value={{ ratings, pointsMap, rateMemory, notice, setNotice }}>
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

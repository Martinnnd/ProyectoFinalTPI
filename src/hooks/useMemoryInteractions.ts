import { useState, useCallback } from "react";
import { likePublication, unlikePublication } from "../publicationsApi";

export default function useMemoryInteractions() {
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

  const isLiked = useCallback(
    (memoryId: string, initial = false) => {
      return likes[memoryId] ?? initial;
    },
    [likes],
  );

  const getLikeCount = useCallback(
    (memoryId: string, initialCount = 0) => {
      return likeCounts[memoryId] ?? initialCount;
    },
    [likeCounts],
  );

  const toggleLike = useCallback(
    async (memoryId: string, initialLiked = false, initialCount = 0) => {
      const currentlyLiked = likes[memoryId] ?? initialLiked;
      const currentCount = likeCounts[memoryId] ?? initialCount;
      const nextLiked = !currentlyLiked;
      const nextCount = Math.max(0, currentCount + (nextLiked ? 1 : -1));

      // Actualización optimista inmediata en la interfaz
      setLikes((prev) => ({ ...prev, [memoryId]: nextLiked }));
      setLikeCounts((prev) => ({ ...prev, [memoryId]: nextCount }));

      try {
        const res = nextLiked
          ? await likePublication(memoryId)
          : await unlikePublication(memoryId);

        setLikes((prev) => ({ ...prev, [memoryId]: res.dioLike }));
        setLikeCounts((prev) => ({ ...prev, [memoryId]: res.cantidadLikes }));
      } catch (err) {
        console.error("Error al actualizar me gusta:", err);
        // Revertir estado si el backend rechaza la petición
        setLikes((prev) => ({ ...prev, [memoryId]: currentlyLiked }));
        setLikeCounts((prev) => ({ ...prev, [memoryId]: currentCount }));
      }
    },
    [likes, likeCounts],
  );

  return { isLiked, getLikeCount, toggleLike };
}

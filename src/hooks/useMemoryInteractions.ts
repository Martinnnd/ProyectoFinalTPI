import { useState } from "react";

export default function useMemoryInteractions() {
  const [likes, setLikes] = useState<Record<string, boolean>>({});

  function isLiked(memoryId: string, initial = false) {
    return likes[memoryId] ?? initial;
  }

  function toggleLike(memoryId: string, initial = false) {
    setLikes((current) => ({
      ...current,
      [memoryId]: !(current[memoryId] ?? initial),
    }));
  }

  return { isLiked, toggleLike };
}

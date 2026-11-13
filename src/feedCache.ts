import { getStoredSession } from "./components/auth/authStorage";
import { FeedError, getFeed, type RemoteFeed } from "./feedApi";
import { feedCache } from "./sessionQueryCache";
import type { Memory } from "./types";

export type FeedSnapshot = {
  items: Memory[];
  cursor: string | null;
  hayMas: boolean;
  consumed: string[];
  impressionsRegistered?: boolean;
};

/** Shared by the idle prefetch and the visible feed; does not record impressions. */
export function getInitialFeed(feed: RemoteFeed, signal?: AbortSignal): Promise<FeedSnapshot> {
  const userId = getStoredSession()?.usuarioId;
  if (!userId)
    return Promise.reject(new FeedError("Tenés que iniciar sesión para ver tu feed.", 401));
  return feedCache.read<FeedSnapshot>(
    `${userId}:${feed}`,
    async () => {
      const page = await getFeed(feed);
      return { items: page.items, cursor: page.siguienteCursor, hayMas: page.hayMas, consumed: [] };
    },
    signal,
    () => getStoredSession()?.usuarioId === userId,
    Infinity,
  );
}

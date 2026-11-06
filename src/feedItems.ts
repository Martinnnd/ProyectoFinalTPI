import type { Memory } from "./types";

/** An original and its simple reposts share a publication ID, but are distinct feed entries. */
export function getFeedItemKey(memory: Memory): string {
  const isQuote = Boolean(
    memory.quotedMemory ||
      (memory.repost &&
        (memory.repost.comment !== undefined ||
          (memory.repost.id && memory.repost.id !== memory.repost.originalId))),
  );
  if (memory.repost && !isQuote) {
    return JSON.stringify([
      "repost",
      memory.repost.originalId ?? memory.id,
      memory.authorId ?? memory.author,
    ]);
  }
  return JSON.stringify(["publication", memory.id]);
}

/** Keep the original order, updating repeated entries without dropping other users' reposts. */
export function mergeFeedItems(items: readonly Memory[]): Memory[] {
  return [...new Map(items.map((item) => [getFeedItemKey(item), item])).values()];
}

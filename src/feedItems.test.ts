import { expect, it } from "vitest";
import { getFeedItemKey, mergeFeedItems } from "./feedItems";
import type { Memory } from "./types";

const original: Memory = {
  id: "25",
  title: "Mundial 2022",
  year: 2022,
  category: "Acontecimientos",
  description: "Un recuerdo",
  place: "Obelisco",
  author: "Ana",
  authorId: 2,
  lat: -34.6,
  lng: -58.38,
  source: "backend",
};

const repost = (authorId: number, author = `usuario-${authorId}`): Memory => ({
  ...original,
  authorId,
  author,
  repost: { originalId: original.id, author: original.author, authorId: original.authorId },
});

it("conserva el original y los reposts de distintos usuarios aunque compartan el ID de publicación", () => {
  const entries = mergeFeedItems([original, repost(3), repost(4)]);
  expect(entries).toHaveLength(3);
  expect(new Set(entries.map(getFeedItemKey)).size).toBe(3);
  expect(entries.map((entry) => entry.id)).toEqual([original.id, original.id, original.id]);
});

it("al continuar una página actualiza las entradas repetidas sin perder otros reposts ni el orden", () => {
  const updatedRepost = { ...repost(3, "nuevo-nombre"), likeCount: 9 };
  const entries = mergeFeedItems([
    original,
    repost(3),
    { ...original, id: "26" },
    updatedRepost,
    repost(4),
  ]);
  expect(entries).toEqual([original, updatedRepost, { ...original, id: "26" }, repost(4)]);
});

it("las citas mantienen su identidad propia y no se confunden con un repost simple de la cita", () => {
  const quote: Memory = {
    ...original,
    id: "27",
    description: "Mi comentario",
    quotedMemory: original,
    repost: { id: "27", originalId: original.id, author: "Ana", authorId: 2, comment: "Mi comentario" },
  };
  const quoteRepost: Memory = {
    ...quote,
    author: "Sofi",
    authorId: 3,
    quotedMemory: undefined,
    repost: { originalId: quote.id, author: quote.author, authorId: quote.authorId },
  };
  expect(mergeFeedItems([original, quote, quoteRepost])).toHaveLength(3);
  expect(new Set([original, quote, quoteRepost].map(getFeedItemKey)).size).toBe(3);
});

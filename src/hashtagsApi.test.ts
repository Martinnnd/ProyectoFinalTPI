import { afterEach, expect, it, vi } from "vitest";
import { getHashtagPosts, getWeeklyHashtags, searchHashtags } from "./hashtagsApi";

function respond(data: unknown) {
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(data), { status: 200 }));
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

afterEach(() => vi.unstubAllGlobals());

it.each(["música", "buscar", "tendencias"])(
  "consulta el hashtag %s sin superar tres segmentos",
  async (tag) => {
    const fetch = respond({ items: [], siguienteCursor: null, hayMas: false });
    await getHashtagPosts(tag, "cursor+/=");
    const url = new URL(fetch.mock.calls[0][0]);
    expect(url.pathname).toBe(`/api/publicaciones/hashtags/${encodeURIComponent(tag)}`);
    expect(url.searchParams.get("cursor")).toBe("cursor+/=");
    expect(url.searchParams.get("limite")).toBe("20");
  },
);

it("consulta tendencias en una ruta distinta del hashtag tendencias", async () => {
  const fetch = respond([{ hashtag: "amanecer", cantidadPublicaciones: 2, cantidadAutores: 1 }]);
  expect(await getWeeklyHashtags()).toEqual([{ tag: "amanecer", count: 2, authors: 1 }]);
  const url = new URL(fetch.mock.calls[0][0]);
  expect(url.pathname).toBe("/api/publicaciones/tendencias/hashtags");
  expect(url.searchParams.get("limite")).toBe("5");
});

it("busca hashtags pasando el texto y el límite por query", async () => {
  const fetch = respond([]);
  await searchHashtags("música & cine");
  const url = new URL(fetch.mock.calls[0][0]);
  expect(url.pathname).toBe("/api/publicaciones/buscar/hashtags");
  expect(url.searchParams.get("q")).toBe("música & cine");
  expect(url.searchParams.get("limite")).toBe("10");
});

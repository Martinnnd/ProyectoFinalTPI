import { afterEach, describe, expect, it, vi } from "vitest";
import { getPublicationDecadePhotos } from "./decadePhotosApi";

afterEach(() => vi.unstubAllGlobals());

describe("fotos de publicaciones para el juego", () => {
  it("consume el catálogo público y conserva el destino para mostrarlo después de responder", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        Response.json([
          { publicacionId: 42, url: "https://fotos.example/plaza.jpg", decada: 1990 },
        ]),
      );
    vi.stubGlobal("fetch", fetchMock);
    const signal = new AbortController().signal;
    expect(await getPublicationDecadePhotos(signal)).toEqual([
      {
        id: "publication:42:https://fotos.example/plaza.jpg",
        image: "https://fotos.example/plaza.jpg",
        decade: 1990,
        source: "publication",
        publicationId: 42,
      },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/api/juegos/decadas/fotos"), {
      signal,
      cache: "no-store",
      credentials: "omit",
    });
  });

  it("descarta preguntas sin publicación válida, con décadas desconocidas o URLs que no sean HTTP", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json([
          { publicacionId: 1, url: "javascript:alert(1)", decada: 1990 },
          { publicacionId: 2, url: "https://fotos.example/foto.jpg", decada: 1960 },
          { publicacionId: 0, url: "https://fotos.example/foto.jpg", decada: 1990 },
          { publicacionId: 3, url: "no es una url", decada: 1990 },
        ]),
      ),
    );
    expect(await getPublicationDecadePhotos(new AbortController().signal)).toEqual([]);
  });

  it("informa una respuesta fallida o inválida para permitir el respaldo con fotos locales", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 503 })));
    await expect(getPublicationDecadePhotos(new AbortController().signal)).rejects.toThrow();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ fotos: [] })));
    await expect(getPublicationDecadePhotos(new AbortController().signal)).rejects.toThrow();
  });
});

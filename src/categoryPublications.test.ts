import { describe, expect, it } from "vitest";
import { buildPublicationFormData } from "./publicationFormData";
import { toMemory, type Publication } from "./publicationsApi";
import { getMemoryAttachments, publicationAttachmentsError } from "./publicationMedia";
import type { Memory } from "./types";

const memory: Memory = {
  id: "25",
  title: "Mi recuerdo",
  description: "Una historia",
  year: 1995,
  date: "1995-04-15",
  category: "Personales",
  place: "Rosario",
  lat: -32.95,
  lng: -60.66,
  author: "Ana",
  source: "backend",
};
const music = { spotifyId: "1234567890123456789012", title: "Tema", artist: "Artista" };
const publication: Publication = {
  id: 25,
  titulo: memory.title,
  fecha: "1995-04-15T00:00:00Z",
  categoria: 0,
  urlMultimedia: "",
  tipoMultimedia: "Foto",
  autor: { id: 7, username: "Ana" },
};

describe("Adjuntos y música de publicaciones", () => {
  it("envía cuatro adjuntos mixtos en orden y los campos de música del contrato del backend", async () => {
    const data = buildPublicationFormData({
      ...memory,
      music,
      attachments: [
        { kind: "image", url: "data:image/png;base64,AQID" },
        { kind: "video", url: "https://media.example/video.mp4" },
        { kind: "image", url: "https://media.example/foto.jpg" },
        { kind: "youtube", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
      ],
    });
    expect(data.get("Adjuntos[0].Tipo")).toBe("Foto");
    const file = data.get("Adjuntos[0].Archivo") as File;
    expect(file.type).toBe("image/png");
    expect([...new Uint8Array(await file.arrayBuffer())]).toEqual([1, 2, 3]);
    expect(data.get("Adjuntos[1].Tipo")).toBe("Video");
    expect(data.get("Adjuntos[1].Url")).toBe("https://media.example/video.mp4");
    expect(data.get("Adjuntos[3].Tipo")).toBe("Video");
    expect(data.get("Musica.SpotifyId")).toBe(music.spotifyId);
    expect(data.get("Musica.Titulo")).toBe(music.title);
    expect(data.get("Musica.Artista")).toBe(music.artist);
    expect(data.has("Archivo")).toBe(false);
    expect(data.has("UrlArchivo")).toBe(false);
  });

  it("no permite preparar cinco adjuntos ni música incompleta", () => {
    expect(() =>
      buildPublicationFormData({
        ...memory,
        attachments: Array.from({ length: 5 }, () => ({
          kind: "image" as const,
          url: "https://example.com/foto.jpg",
        })),
      }),
    ).toThrow("4 adjuntos");
    expect(() => buildPublicationFormData({ ...memory, music: { ...music, title: "" } })).toThrow(
      "música",
    );
  });

  it("recupera el orden y la música del detalle o resumen, sin perder los valores del servidor", () => {
    const mapped = toMemory(
      {
        ...publication,
        musica: { spotifyId: music.spotifyId, titulo: music.title, artista: music.artist },
        adjuntos: [
          { url: "https://media.example/video.mp4", tipo: "Video", orden: 1 },
          { url: "https://media.example/foto.jpg", tipo: 0, orden: 0 },
        ],
      },
      memory,
    );
    expect(mapped.attachments).toEqual([
      { kind: "image", url: "https://media.example/foto.jpg" },
      { kind: "video", url: "https://media.example/video.mp4" },
    ]);
    expect(mapped.music).toEqual(music);
    expect(mapped.image).toBe("https://media.example/foto.jpg");
  });

  it("recupera adjuntos y música dentro de un recuerdo citado", () => {
    const mapped = toMemory(
      {
        ...publication,
        id: 26,
        publicacionOriginal: {
          ...publication,
          adjuntos: [{ url: "https://media.example/foto.jpg", tipo: "Foto", orden: 0 }],
          musica: { spotifyId: music.spotifyId, titulo: music.title, artista: music.artist },
        },
      },
      memory,
    );
    expect(mapped.quotedMemory?.attachments).toHaveLength(1);
    expect(mapped.quotedMemory?.music).toEqual(music);
  });

  it("mantiene las publicaciones antiguas con un único adjunto y los recuerdos sin multimedia", () => {
    expect(
      getMemoryAttachments(
        toMemory({ ...publication, urlMultimedia: "https://media.example/antigua.jpg" }, memory),
      ),
    ).toEqual([{ kind: "image", url: "https://media.example/antigua.jpg" }]);
    expect(getMemoryAttachments(toMemory(publication, memory))).toEqual([]);
  });

  it("valida el máximo recibido de la cuenta y conserva la multimedia opcional", () => {
    const attachments = [
      { kind: "image" as const, url: "https://media.example/1.jpg" },
      { kind: "video" as const, url: "https://media.example/2.mp4" },
    ];
    expect(publicationAttachmentsError(attachments, 1)).toContain("1 adjunto");
    expect(publicationAttachmentsError(attachments, 4)).toBeNull();
    expect(publicationAttachmentsError([], 1, false)).toBeNull();
    expect(publicationAttachmentsError([], 1, true)).toContain("Adjuntá");
    expect(
      publicationAttachmentsError([{ kind: "image", url: "http://example.com/foto.jpg" }], 4),
    ).toContain("adjunto");
  });
});

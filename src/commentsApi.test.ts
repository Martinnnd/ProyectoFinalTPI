import { afterEach, describe, expect, it, vi } from "vitest";
import { cerrarSesion, guardarSesion } from "./api";
import {
  createComment,
  getComments,
  removeCommentReaction,
  setCommentReaction,
} from "./commentsApi";

const session = {
  usuarioId: 42,
  token: "token-test",
  username: "Ana",
  email: "ana@example.com",
  esAdmin: false,
};

const root = {
  id: 8,
  publicacionId: 25,
  comentarioPadreId: null,
  contenido: "Qué lindo recuerdo",
  fechaCreacion: "2026-10-13T15:00:00Z",
  autor: { id: 1, username: "usuarioTest" },
  reacciones: { love: 2 },
  reaccionActual: "love",
  respuestas: [{
    id: 9,
    publicacionId: 25,
    comentarioPadreId: 8,
    contenido: "Totalmente",
    fechaCreacion: "2026-10-13T15:01:00Z",
    autor: { id: 2, username: "Ana" },
    reacciones: {},
  }],
};

function respond(data: unknown) {
  return vi.fn().mockImplementation(async () => new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  }));
}

afterEach(() => {
  cerrarSesion();
  vi.unstubAllGlobals();
});

describe("API de comentarios", () => {
  it("adapta respuestas y reacciones del backend", async () => {
    vi.stubGlobal("fetch", respond({ items: [root], siguienteCursor: null }));
    const page = await getComments("25");
    expect(page.items).toHaveLength(2);
    expect(page.items[0]).toMatchObject({ id: "8", viewerReaction: "love", reactions: { love: 2 } });
    expect(page.items[1]).toMatchObject({ id: "9", parentId: "8", text: "Totalmente" });
  });

  it("envía respuestas sin confiar la identidad al body", async () => {
    guardarSesion(session);
    const fetch = respond(root.respuestas[0]);
    vi.stubGlobal("fetch", fetch);
    await createComment("25", " Respuesta ", "8");
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
      contenido: "Respuesta",
      comentarioPadreId: 8,
    });
    expect(JSON.parse(fetch.mock.calls[0][1].body)).not.toHaveProperty("usuarioId");
  });

  it("crea, cambia o quita la reacción propia", async () => {
    guardarSesion(session);
    const fetch = respond(root);
    vi.stubGlobal("fetch", fetch);
    await setCommentReaction("25", "8", "love");
    await removeCommentReaction("25", "8");
    expect(fetch.mock.calls[0][0]).toContain("/25/comentarios/8/reaccion");
    expect(fetch.mock.calls[0][1].method).toBe("PUT");
    expect(fetch.mock.calls[1][1].method).toBe("DELETE");
  });
});

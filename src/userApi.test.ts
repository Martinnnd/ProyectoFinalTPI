import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buscarUsuarios,
  getPerfilUsuario,
  getPublicacionesUsuario,
  getPublicacionesGuardadasUsuario,
} from "./userApi";
import { guardarSesion, cerrarSesion } from "./api";

function respond(data: unknown, status = 200) {
  return vi.fn().mockImplementation(
    async () =>
      new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
  );
}

afterEach(() => {
  cerrarSesion();
  vi.unstubAllGlobals();
});

describe("userApi", () => {
  it("busca usuarios parcialmente y codifica los parámetros", async () => {
    const fetch = respond([{ id: 2, username: "lucia" }]);
    vi.stubGlobal("fetch", fetch);

    await expect(buscarUsuarios("  luci & amigos  ")).resolves.toEqual([
      { id: 2, username: "lucia" },
    ]);

    const url = new URL(fetch.mock.calls[0][0]);
    expect(url.pathname).toBe("/api/usuario/buscar");
    expect(Object.fromEntries(url.searchParams)).toEqual({ texto: "luci & amigos", limite: "10" });
  });

  it("rechaza una respuesta de búsqueda inválida", async () => {
    vi.stubGlobal("fetch", respond([{ id: 0, username: "" }]));

    await expect(buscarUsuarios("usuario")).rejects.toThrow("respuesta inválida");
  });

  it("obtiene el perfil del usuario autenticado o buscado", async () => {
    guardarSesion({
      usuarioId: 17,
      token: "token-test",
      username: "nico",
      email: "nico@example.com",
      esAdmin: false,
    });
    const mockPerfil = {
      id: 17,
      username: "nico",
      nombre: "Nico",
      apellido: "Pérez",
      tipoUsuario: "Usuario_Personal",
      reputacion: "Nostálgico",
      puntosNostalgia: 10,
      cantidadPublicaciones: 2,
      cantidadSeguidores: 5,
      cantidadSeguidos: 3,
      loSigo: false,
    };
    const fetch = respond(mockPerfil);
    vi.stubGlobal("fetch", fetch);

    const perfil = await getPerfilUsuario("nico");

    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch.mock.calls[0][0]).toContain("/api/usuario/perfil/nico");
    expect(perfil).toEqual(mockPerfil);
  });

  it("obtiene las publicaciones de un usuario adaptándolas a Memory", async () => {
    const mockPublicaciones = [
      {
        id: 21,
        titulo: "El cassette de Nirvana que no volvía nunca",
        descripcion: "Llevé un cassette de Nirvana...",
        fecha: "1993-01-01T00:00:00Z",
        fechaCreacion: "2026-10-21T04:15:31.376271Z",
        categoria: 1,
        urlMultimedia:
          "https://deadaheadrecords.com/wp-content/uploads/2022/09/nirvana-nevermind-cassette-tape-used.jpg",
        tipoMultimedia: 0,
        autor: { id: 17, username: "Nico" },
        lugar: {
          id: 21,
          nombre: "Plaza Sarmiento",
          direccion: "Plaza Sarmiento",
          latitud: -34.676,
          longitud: -58.56,
        },
        cantidadLikes: 4,
        cantidadComentarios: 1,
        dioLike: true,
        puntosTotales: 15,
        miPuntuacion: 5,
        grupo: null,
      },
    ];
    const fetch = respond(mockPublicaciones);
    vi.stubGlobal("fetch", fetch);

    const memories = await getPublicacionesUsuario(17);

    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch.mock.calls[0][0]).toContain("/api/publicaciones/usuario/17");
    expect(memories).toHaveLength(1);
    expect(memories[0]).toMatchObject({
      id: "21",
      title: "El cassette de Nirvana que no volvía nunca",
      author: "Nico",
      authorId: 17,
      year: 1993,
      likeCount: 4,
      points: 15,
      viewerRating: 5,
      viewerLiked: true,
      place: "Plaza Sarmiento",
      lat: -34.676,
      lng: -58.56,
      source: "backend",
    });
  });

  it("obtiene las publicaciones guardadas de un usuario adaptándolas a Memory", async () => {
    const mockPublicaciones = [
      {
        id: 99,
        titulo: "Recuerdo guardado de otro autor",
        descripcion: "Un gran recuerdo guardado",
        fecha: "1985-06-20T00:00:00Z",
        categoria: 0,
        urlMultimedia: "",
        tipoMultimedia: 0,
        autor: { id: 5, username: "Carlos" },
        lugar: null,
        cantidadLikes: 10,
        cantidadComentarios: 2,
        guardada: true,
      },
    ];
    const fetch = respond(mockPublicaciones);
    vi.stubGlobal("fetch", fetch);

    const memories = await getPublicacionesGuardadasUsuario(17);

    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch.mock.calls[0][0]).toContain("/api/publicaciones/usuario/17/guardadas");
    expect(memories).toHaveLength(1);
    expect(memories[0]).toMatchObject({
      id: "99",
      title: "Recuerdo guardado de otro autor",
      author: "Carlos",
      authorId: 5,
      year: 1985,
      viewerSaved: true,
    });
  });
});

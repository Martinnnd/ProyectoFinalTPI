import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { guardarSesion, cerrarSesion } from "./api";
import {
  getUserMemories,
  getUserProfile,
  toAchievement,
  type AchievementState,
} from "./profileApi";

vi.mock("./apiConfig", () => ({ API_BASE_URL: "http://backend.test" }));
const fetchMock = vi.fn();
const logro: AchievementState = {
  id: 2,
  titulo: "Primera Palabra",
  descripcion: "Comentario en un recuerdo ajeno",
  urlIcono: ".",
  puntosRecompensa: 0,
  desbloqueado: true,
  fechaDesbloqueo: "2026-10-25T12:00:00Z",
};

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  guardarSesion({
    token: "test-token",
    usuarioId: 2,
    username: "susana",
    email: "susana@example.test",
    esAdmin: false,
  });
});
afterEach(() => {
  cerrarSesion();
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});

describe("perfil conectado", () => {
  it("pide el perfil autenticado y conserva el catálogo del servidor", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: 2, username: "susana", logros: [logro] })),
    );
    const profile = await getUserProfile(2);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://backend.test/api/usuario/2/perfil",
      expect.objectContaining({
        cache: "no-store",
      }),
    );
    expect(new Headers(fetchMock.mock.calls[0][1].headers).get("Authorization")).toBe(
      "Bearer test-token",
    );
    expect(profile.logros).toEqual([logro]);
  });
  it("no sustituye un catálogo ausente por los antiguos logros de ejemplo", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ id: 2 })));
    await expect(getUserProfile(2)).rejects.toThrow("catálogo de logros");
  });
  it("exige sesión y no hace requests anónimos del perfil", async () => {
    cerrarSesion();
    await expect(getUserProfile(2)).rejects.toThrow("Iniciá sesión");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("explica la sesión vencida en lugar de mostrar datos ficticios", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 401 }));
    await expect(getUserProfile(2)).rejects.toThrow("sesión venció");
  });
  it("asigna el icono al ID real y respeta el estado del backend", () => {
    expect(toAchievement(logro)).toMatchObject({
      id: "2",
      name: "Primera Palabra",
      image: "/logros/10_primera_palabra.png",
      unlocked: true,
      unlockedAt: logro.fechaDesbloqueo,
    });
    expect(toAchievement({ ...logro, desbloqueado: false })).toMatchObject({ unlocked: false });
  });
  it("carga recuerdos propios con el endpoint vigente y convierte el DTO", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            id: 9,
            titulo: "Recuerdo real",
            descripcion: "Texto",
            fecha: "1995-01-01T00:00:00Z",
            categoria: 0,
            tipoMultimedia: 0,
            urlMultimedia: "",
            autor: { id: 2, username: "susana" },
            lugar: { nombre: "Córdoba", latitud: -31.4, longitud: -64.2 },
          },
        ]),
      ),
    );
    const memories = await getUserMemories(2);
    expect(fetchMock.mock.calls[0][0]).toBe("http://backend.test/api/publicaciones/usuario/2");
    expect(memories[0]).toMatchObject({
      id: "9",
      title: "Recuerdo real",
      author: "susana",
      year: 1995,
      source: "backend",
    });
  });
});

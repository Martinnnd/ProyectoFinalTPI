import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "../components/auth/apiClient";
import { hasAccountPermission, type AccountCategoryState } from "../accountCategories";
import type { AuthSession } from "../components/auth/authTypes";
import {
  addAdminSong,
  editSong,
  getCurrentRound,
  getResults,
  RankingError,
  suggestSong,
  voteSong,
  withdrawSong,
  type Round,
} from "./api";
import {
  canEdit,
  canManage,
  currentDecade,
  formatRankingDate,
  nextRefresh,
  validContribution,
  validateSong,
} from "./rules";
import { createRankingStore } from "./store";

vi.mock("../components/auth/apiClient", () => ({ apiFetch: vi.fn() }));
const fetch = vi.mocked(apiFetch);
const song = {
  id: 12,
  creadorId: 7,
  decada: 1980,
  titulo: "Billie Jean",
  artista: "Michael Jackson",
  puntos: 0,
};
const session: AuthSession = {
  usuarioId: 7,
  token: "token",
  username: "usuario",
  email: "u@example.com",
  esAdmin: false,
};
const round = (): Round => ({
  id: 4,
  apertura: "2026-11-15T03:00:00Z",
  cierre: "2026-11-30T03:00:00Z",
  decadas: [{ decada: 1980, candidaturas: [{ ...song }] }],
  saldo: { cupo: 5, puntosRestantes: 5, reinicio: "2026-11-22T03:00:00Z" },
});
const response = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status });
afterEach(() => {
  vi.useRealTimers();
  fetch.mockReset();
});

describe("contrato del ranking musical", () => {
  it("consulta la ronda personalizada sin cache y transmite la señal", async () => {
    fetch.mockResolvedValue(response(round()));
    const signal = new AbortController().signal;
    expect(await getCurrentRound(signal)).toEqual(round());
    expect(fetch.mock.calls[0][0]).toMatch(/\/api\/ranking-musica\/actual$/);
    expect(fetch.mock.calls[0][1]).toMatchObject({ cache: "no-store", signal });
  });
  it("conserva candidaturaId y puntos en el cuerpo del aporte acumulativo", async () => {
    fetch.mockResolvedValue(response({ id: 1, puntosTotales: 9, puntosDiariosRestantes: 2 }));
    expect(await voteSong(12, 3)).toEqual({ id: 1, puntosTotales: 9, puntosDiariosRestantes: 2 });
    expect(fetch.mock.calls[0][0]).toMatch(/\/api\/ranking-musica\/puntuacion$/);
    expect(fetch.mock.calls[0][1]).toMatchObject({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidaturaId: 12, puntos: 3 }),
    });
  });
  it("usa rutas distintas para sugerencia y carga administrativa sin consultar categoría", async () => {
    fetch.mockImplementation(async () => response(song, 201));
    const input = { decada: 1980, titulo: song.titulo, artista: song.artista };
    await suggestSong(input);
    await addAdminSong(input);
    expect(fetch.mock.calls.map(([url]) => String(url))).toEqual([
      expect.stringMatching(/\/api\/ranking-musica\/sugerencias$/),
      expect.stringMatching(/\/api\/admin\/ranking-musica$/),
    ]);
    for (const [, init] of fetch.mock.calls) {
      expect(init?.method).toBe("POST");
      expect(JSON.parse(String(init?.body))).toEqual(input);
    }
  });
  it("edita solo los metadatos y retira sin cuerpo", async () => {
    fetch
      .mockResolvedValueOnce(response(song))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    await editSong(12, song);
    expect(fetch.mock.calls[0][0]).toMatch(/\/api\/ranking-musica\/12$/);
    expect(fetch.mock.calls[0][1]?.method).toBe("PUT");
    expect(JSON.parse(String(fetch.mock.calls[0][1]?.body))).toEqual({
      titulo: song.titulo,
      artista: song.artista,
    });
    expect(await withdrawSong(12)).toBeUndefined();
    expect(fetch.mock.calls[1][1]).toMatchObject({ method: "DELETE" });
    expect(fetch.mock.calls[1][1]?.body).toBeUndefined();
  });
  it("consulta última ronda e ID histórico con posiciones intactas y sin paginación", async () => {
    const results = {
      id: 3,
      apertura: round().apertura,
      cierre: round().cierre,
      decadas: [
        {
          decada: 1980,
          ganadoras: [
            {
              candidaturaId: 12,
              posicion: 1,
              titulo: song.titulo,
              artista: song.artista,
              puntos: 8,
            },
          ],
          clasificadas: [
            {
              candidaturaId: 13,
              posicion: 4,
              titulo: "Otra canción",
              artista: "Artista",
              puntos: 3,
            },
          ],
        },
      ],
    };
    fetch.mockImplementation(async () => response(results));
    expect(await getResults()).toEqual(results);
    expect(await getResults(3)).toEqual(results);
    expect(fetch.mock.calls[0][0]).toMatch(/\/resultados$/);
    expect(fetch.mock.calls[1][0]).toMatch(/\/resultados\?rondaId=3$/);
    for (const id of [0, -1, 1.5, NaN])
      await expect(getResults(id)).rejects.toMatchObject({ status: 400 });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it.each([400, 401, 403, 404, 409, 429])(
    "preserva status %s y ProblemDetails por campo",
    async (status) => {
      fetch.mockResolvedValue(
        response(
          {
            title: "Problema",
            detail: "Detalle del backend",
            errors: { Titulo: ["Título inválido"] },
          },
          status,
        ),
      );
      await expect(getCurrentRound()).rejects.toMatchObject({
        status,
        fields: { Titulo: ["Título inválido"] },
        message: expect.stringContaining("Detalle del backend Título inválido"),
      });
    },
  );
  it("propaga 404 de resultados sin inventar rondas", async () => {
    fetch.mockResolvedValue(response({}, 404));
    await expect(getResults(999)).rejects.toBeInstanceOf(RankingError);
  });
});

describe("permisos, validaciones y fechas", () => {
  it("respeta permisos explícitos y no confunde categoría con administración", () => {
    for (const [codigo, permissions] of [
      ["Errante", []],
      ["Nostalgico", ["VotarCancion"]],
      ["Aedo", ["VotarCancion"]],
      ["Mnemosine", ["VotarCancion", "SugerirMusica"]],
      ["Marca", ["VotarCancion", "SugerirMusica"]],
    ] as const) {
      const account = { categoria: { codigo, permisos: [...permissions] } } as AccountCategoryState;
      expect(hasAccountPermission(account, "VotarCancion")).toBe(codigo !== "Errante");
      expect(hasAccountPermission(account, "SugerirMusica")).toBe(
        codigo === "Mnemosine" || codigo === "Marca",
      );
      expect(canManage(song, { ...session, usuarioId: 8 })).toBe(false);
    }
    expect(canManage(song, null)).toBe(false);
    expect(canManage(song, session)).toBe(true);
    expect(canManage(song, { ...session, usuarioId: 8, esAdmin: true })).toBe(true);
  });
  it("permite editar al creador y admin solo antes del primer voto y durante la ronda", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-21T15:00:00Z"));
    expect(canEdit(song, round(), session)).toBe(true);
    expect(canEdit(song, round(), { ...session, usuarioId: 8, esAdmin: true })).toBe(true);
    expect(canEdit({ ...song, puntos: 1 }, round(), session)).toBe(false);
    expect(canEdit(song, round(), { ...session, usuarioId: 8 })).toBe(false);
    vi.setSystemTime(new Date(round().cierre));
    expect(canEdit(song, round(), session)).toBe(false);
  });
  it("valida texto, décadas y aportes contra saldo y vencimiento del servidor", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-21T15:00:00Z"));
    expect(validateSong(song)).toBeNull();
    for (const decada of [1890, 1981, 2030]) expect(validateSong({ ...song, decada })).toBeTruthy();
    expect(validateSong({ ...song, titulo: " " })).toBeTruthy();
    expect(validateSong({ ...song, artista: "a".repeat(121) })).toBeTruthy();
    for (const points of [0, -1, 1.5, 6, NaN])
      expect(validContribution(points, round())).toBe(false);
    expect(validContribution(5, round())).toBe(true);
    expect(validContribution(1, { ...round(), saldo: null })).toBe(false);
    vi.setSystemTime(new Date("2026-11-22T03:00:00Z"));
    expect(validContribution(1, round())).toBe(false);
  });
  it("usa Buenos Aires y programa el próximo corte o renovación entregado por backend", () => {
    const now = Date.parse("2026-11-22T02:59:59Z");
    expect(nextRefresh(round(), now)).toBe(1100);
    expect(nextRefresh({ ...round(), saldo: null }, Date.parse(round().cierre))).toBe(15000);
    expect(formatRankingDate("2026-11-22T03:00:00Z")).toContain("00:00");
    expect(currentDecade(new Date("2030-01-01T01:00:00Z"))).toBe(2020);
  });
});

describe("estado y concurrencia de la votación", () => {
  function setup() {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-21T15:00:00Z"));
    return createRankingStore();
  }
  it("acumula múltiples aportes y actualiza puntaje y saldo antes de reordenar desde el servidor", async () => {
    const store = setup();
    fetch.mockResolvedValueOnce(response(round()));
    await store.refresh();
    const snapshots: Round[] = [];
    store.subscribe(() => {
      const value = store.getSnapshot().round;
      if (value) snapshots.push(value);
    });
    const afterFirst = {
      ...round(),
      saldo: { ...round().saldo!, puntosRestantes: 3 },
      decadas: [{ decada: 1980, candidaturas: [{ ...song, puntos: 2 }] }],
    };
    fetch
      .mockResolvedValueOnce(response({ id: 1, puntosTotales: 2, puntosDiariosRestantes: 3 }))
      .mockResolvedValueOnce(response(afterFirst));
    expect(await store.vote(12, 2)).toBe(true);
    expect(
      snapshots.some(
        (value) =>
          value.saldo?.puntosRestantes === 3 && value.decadas[0].candidaturas[0].puntos === 2,
      ),
    ).toBe(true);
    fetch
      .mockResolvedValueOnce(response({ id: 2, puntosTotales: 5, puntosDiariosRestantes: 0 }))
      .mockResolvedValueOnce(
        response({
          ...afterFirst,
          saldo: { ...afterFirst.saldo, puntosRestantes: 0 },
          decadas: [{ decada: 1980, candidaturas: [{ ...song, puntos: 5 }] }],
        }),
      );
    expect(await store.vote(12, 3)).toBe(true);
    expect(store.getSnapshot().round?.saldo?.puntosRestantes).toBe(0);
    expect(store.getSnapshot().round?.decadas[0].candidaturas[0].puntos).toBe(5);
    expect(await store.vote(12, 1)).toBe(false);
  });
  it("bloquea el doble envío global mientras hay un aporte pendiente", async () => {
    const store = setup();
    fetch.mockResolvedValueOnce(response(round()));
    await store.refresh();
    let resolve!: (value: Response) => void;
    fetch
      .mockImplementationOnce(
        () =>
          new Promise((done) => {
            resolve = done;
          }),
      )
      .mockResolvedValueOnce(response(round()));
    const first = store.vote(12, 1);
    expect(await store.vote(12, 1)).toBe(false);
    await store.refresh();
    expect(fetch).toHaveBeenCalledTimes(2);
    resolve(response({ id: 1, puntosTotales: 1, puntosDiariosRestantes: 4 }));
    await first;
    expect(fetch.mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(1);
  });
  it("reconsulta saldo tras 429 sin repetir el voto", async () => {
    const store = setup();
    fetch.mockResolvedValueOnce(response(round()));
    await store.refresh();
    fetch
      .mockResolvedValueOnce(response({ detail: "Saldo consumido en publicaciones" }, 429))
      .mockResolvedValueOnce(
        response({ ...round(), saldo: { ...round().saldo!, puntosRestantes: 0 } }),
      );
    expect(await store.vote(12, 1)).toBe(false);
    expect(store.getSnapshot().message).toContain("Saldo consumido");
    expect(store.getSnapshot().round?.saldo?.puntosRestantes).toBe(0);
    expect(fetch).toHaveBeenCalledTimes(3);
  });
  it("no repite un POST incierto y bloquea votos si falla la reconciliación", async () => {
    const store = setup();
    fetch.mockResolvedValueOnce(response(round()));
    await store.refresh();
    fetch
      .mockRejectedValueOnce(new TypeError("network"))
      .mockRejectedValueOnce(new TypeError("network"));
    expect(await store.vote(12, 1)).toBe(false);
    expect(store.getSnapshot().message).toContain("No pudimos confirmar");
    expect(store.getSnapshot().fresh).toBe(false);
    expect(await store.vote(12, 1)).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(3);
  });
  it("muestra ronda inexistente o vacía y permite volver a consultar", async () => {
    const store = setup();
    fetch.mockResolvedValueOnce(response({}, 404));
    await store.refresh();
    expect(store.getSnapshot()).toMatchObject({
      round: null,
      fresh: true,
      loading: false,
      error: "",
    });
    fetch.mockResolvedValueOnce(response({ ...round(), decadas: [] }));
    await store.refresh();
    expect(store.getSnapshot().round?.decadas).toEqual([]);
  });
  it("reconcilia edición bloqueada o candidatura retirada por otra sesión", async () => {
    const store = setup();
    fetch.mockResolvedValueOnce(response(round()));
    await store.refresh();
    fetch
      .mockResolvedValueOnce(response({ detail: "Ya recibió votos" }, 409))
      .mockResolvedValueOnce(response({ ...round(), decadas: [] }));
    expect(await store.mutate(() => editSong(12, song), "Corregida")).toBe(false);
    expect(store.getSnapshot().message).toContain("Ya recibió votos");
    expect(store.getSnapshot().round?.decadas).toEqual([]);
    fetch.mockResolvedValueOnce(response({}, 404)).mockResolvedValueOnce(response(round()));
    expect(await store.mutate(() => withdrawSong(12), "Retirada")).toBe(false);
    expect(store.getSnapshot().message).toContain("ya no está disponible");
  });
  it("retira y recarga sin devolver puntos gastados; indica login tras 401", async () => {
    const store = setup();
    fetch.mockResolvedValueOnce(response(round()));
    await store.refresh();
    fetch
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        response({ ...round(), decadas: [], saldo: { ...round().saldo!, puntosRestantes: 2 } }),
      );
    expect(await store.mutate(() => withdrawSong(12), "Retirada")).toBe(true);
    expect(store.getSnapshot().round?.saldo?.puntosRestantes).toBe(2);
    fetch.mockResolvedValueOnce(response({}, 401)).mockResolvedValueOnce(response(round()));
    await store.mutate(() => suggestSong(song), "Creada");
    expect(store.getSnapshot().loginRequired).toBe(true);
  });
  it("una nueva sesión no hereda saldo y las respuestas obsoletas no sobrescriben datos", async () => {
    const store = setup();
    let resolve!: (value: Response) => void;
    fetch
      .mockImplementationOnce(
        () =>
          new Promise((done) => {
            resolve = done;
          }),
      )
      .mockResolvedValueOnce(response({ ...round(), saldo: null }));
    const old = store.refresh();
    await store.refresh();
    resolve(response(round()));
    await old;
    expect(store.getSnapshot().round?.saldo).toBeNull();
    expect(createRankingStore().getSnapshot().round).toBeNull();
  });
});

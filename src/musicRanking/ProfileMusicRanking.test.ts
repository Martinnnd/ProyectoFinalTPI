import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import ProfileMusicRanking from "./ProfileMusicRanking";
import type { Round } from "./api";

const { snapshot, permissions } = vi.hoisted(() => ({
  snapshot: {
    round: null as Round | null,
    loading: false,
    fresh: true,
    busy: false,
    error: "",
    message: "",
    loginRequired: false,
  },
  permissions: [] as string[],
}));
vi.mock("../components/auth/AuthProvider", () => ({
  useAuth: () => ({ session: { usuarioId: 7 } }),
}));
vi.mock("../context/AccountCategoryContext", () => ({
  useAccountCategory: () => ({
    hasPermission: (permission: string) => permissions.includes(permission),
    loading: false,
    error: null,
  }),
}));
vi.mock("./store", () => ({
  createRankingStore: () => ({
    getState: () => snapshot,
    getInitialState: () => snapshot,
    subscribe: () => () => {},
    refresh: vi.fn(),
    cancelRead: vi.fn(),
  }),
}));
afterEach(() => {
  snapshot.round = null;
  snapshot.loading = false;
  snapshot.busy = false;
  permissions.length = 0;
});
const render = (decade = 1980) =>
  renderToStaticMarkup(createElement(ProfileMusicRanking, { decade }));
describe("ranking en la barra lateral del perfil", () => {
  it("mantiene visible la sugerencia aunque la categoría no pueda sugerir", () => {
    const html = render();
    expect(html).toContain("Sugerir canción");
    expect(html).not.toContain("<form");
    expect(html).toContain("No hay una ronda vigente");
    expect(html).toContain('disabled=""');
    expect(html).toContain('role="tooltip"');
    expect(html).toContain("Las sugerencias están disponibles para Mnemosine.");
    expect(html).not.toContain("Marca");
    expect(html).not.toContain("Actualizar ranking musical");
    expect(html).not.toContain("Elegimos la banda sonora");
    expect(html).not.toContain("/musica");
  });
  it("muestra saldo, décadas y aporte sin el encabezado ni las fechas de la ronda", () => {
    snapshot.round = {
      id: 4,
      apertura: "2020-01-01T03:00:00Z",
      cierre: "2035-01-01T03:00:00Z",
      saldo: { cupo: 5, puntosRestantes: 3, reinicio: "2030-11-22T03:00:00Z" },
      decadas: [
        { decada: 1990, candidaturas: [] },
        {
          decada: 1980,
          candidaturas: [
            {
              id: 12,
              creadorId: 7,
              decada: 1980,
              titulo: "Billie Jean",
              artista: "Michael Jackson",
              puntos: 9,
            },
          ],
        },
      ],
    };
    permissions.push("VotarCancion");
    const html = render();
    expect(html).not.toContain("Ronda actual");
    expect(html).not.toContain("Buenos Aires");
    expect(html).not.toContain("puntos disponibles hoy");
    expect(html).toContain("Ranking musical 1980");
    expect(html).not.toContain('aria-label="Ranking por década"');
    expect(render(2000)).toContain("Ranking musical 2000");
    expect(render(2000)).not.toContain("Billie Jean");
    expect(html).toContain("Billie Jean");
    expect(html).toContain('aria-label="Puntuar canción: Billie Jean"');
    expect(html.match(/src="\/nostalgiar-rail-logo.png"/g)).toHaveLength(5);
    const pointButtons = html.match(
      /<button[^>]+aria-label="Dar [1-5] puntos? de nostalgia[^>]*>/g,
    )!;
    expect(pointButtons).toHaveLength(5);
    expect(pointButtons.filter((button) => button.includes('disabled=""'))).toHaveLength(2);
    expect(html).toContain('data-winner="true"');
    snapshot.round.saldo!.puntosRestantes = 0;
    const exhausted = render().match(
      /<button[^>]+aria-label="Dar [1-5] puntos? de nostalgia[^>]*>/g,
    )!;
    expect(exhausted.filter((button) => button.includes('disabled=""'))).toHaveLength(5);
  });
  it("distingue carga y ronda sin canciones", () => {
    snapshot.loading = true;
    expect(render()).toContain("Consultando ranking");
    snapshot.loading = false;
    snapshot.round = {
      id: 4,
      apertura: "2020-01-01T03:00:00Z",
      cierre: "2035-01-01T03:00:00Z",
      saldo: null,
      decadas: [],
    };
    expect(render()).toContain("Todavía no hay canciones de 1980 en esta ronda");
  });
});

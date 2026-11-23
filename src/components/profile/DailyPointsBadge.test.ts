import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DailyPointsBadge from "./DailyPointsBadge";

const { snapshot } = vi.hoisted(() => ({
  snapshot: {
    round: null as null | { saldo: { cupo: number; puntosRestantes: number; reinicio: string } },
    loading: false,
    fresh: true,
    error: "",
  },
}));
vi.mock("../../musicRanking/store", () => ({
  createRankingStore: () => ({
    subscribe: () => () => {},
    getSnapshot: () => snapshot,
    refresh: vi.fn(),
    cancelRead: vi.fn(),
  }),
}));
beforeEach(() => {
  snapshot.round = null;
  snapshot.loading = false;
  snapshot.fresh = true;
  snapshot.error = "";
});
describe("saldo diario en el perfil", () => {
  it("muestra el saldo del servidor y la renovación en Buenos Aires", () => {
    snapshot.round = { saldo: { cupo: 7, puntosRestantes: 3, reinicio: "2026-11-22T03:00:00Z" } };
    const html = renderToStaticMarkup(createElement(DailyPointsBadge));
    expect(html).toContain("3/7 puntos");
    expect(html).toContain("Compartidos entre canciones y publicaciones");
    expect(html).toContain("00:00 (Buenos Aires)");
  });
  it("muestra cero cuando se agotó el saldo", () => {
    snapshot.round = { saldo: { cupo: 5, puntosRestantes: 0, reinicio: "2026-11-22T03:00:00Z" } };
    expect(renderToStaticMarkup(createElement(DailyPointsBadge))).toContain("0/5 puntos");
  });
  it("oculta el saldo anterior mientras se actualiza", () => {
    snapshot.round = { saldo: { cupo: 5, puntosRestantes: 4, reinicio: "2026-11-22T03:00:00Z" } };
    snapshot.loading = true;
    const html = renderToStaticMarkup(createElement(DailyPointsBadge));
    expect(html).toContain("… puntos");
    expect(html).not.toContain("4/5");
  });
  it("permite consultar de nuevo cuando la API no ofrece saldo o falla", () => {
    expect(renderToStaticMarkup(createElement(DailyPointsBadge))).toContain("Consultar puntos");
    snapshot.fresh = false;
    snapshot.error = "No pudimos consultar el saldo.";
    const html = renderToStaticMarkup(createElement(DailyPointsBadge));
    expect(html).toContain("Consultar puntos");
    expect(html).toContain(snapshot.error);
    expect(html).not.toContain('disabled=""');
  });
});

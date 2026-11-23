import { afterEach, describe, expect, it, vi } from "vitest";
import { createRankingViewStore } from "./viewStore";
import { rankingCountdown } from "./rules";

afterEach(() => vi.useRealTimers());
describe("estado del panel musical", () => {
  it("aísla aportes entre perfiles y limpia las acciones al cambiar década", () => {
    const first = createRankingViewStore();
    const second = createRankingViewStore();
    first.getState().setContribution(12, "3");
    first.getState().toggleSong(12);
    first.getState().toggleSuggestion();
    first.getState().resetActions();
    expect(first.getState()).toMatchObject({
      contributions: { 12: "3" },
      expandedSong: null,
      suggesting: false,
    });
    expect(second.getState()).toMatchObject({
      contributions: {},
      suggesting: false,
    });
  });
  it("actualiza el reloj y permite cerrar el formulario de sugerencia", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-23T03:00:00Z"));
    const store = createRankingViewStore();
    store.getState().toggleSuggestion();
    expect(store.getState().suggesting).toBe(true);
    store.getState().toggleSuggestion();
    expect(store.getState().suggesting).toBe(false);
    vi.advanceTimersByTime(60_000);
    store.getState().tick();
    expect(store.getState().now).toBe(Date.now());
  });
});
describe("cuenta regresiva del cierre entregado por la API", () => {
  const close = "2026-12-06T03:00:00Z";
  const end = Date.parse(close);
  it.each([
    [172_800_000, "2 días"],
    [86_400_000, "24 h"],
    [82_800_000, "23 h"],
    [3_600_000, "60 min"],
    [3_540_000, "59 min"],
    [1, "1 min"],
    [0, "Finalizó"],
    [-1, "Finalizó"],
  ])("muestra la unidad apropiada a %s ms del cierre", (remaining, expected) => {
    expect(rankingCountdown(close, end - remaining)).toBe(expected);
  });
});

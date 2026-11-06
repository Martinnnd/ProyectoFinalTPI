import { describe, expect, it } from "vitest";
import { createEraStore } from "./eraStore";

describe("era store", () => {
  it("keeps period and panels independent across provider instances", () => {
    const first = createEraStore();
    const second = createEraStore();

    first.getState().setPeriod({ decade: 2020, year: 2023 });
    first.getState().setMusicOpen(true);
    first.getState().setFactsOpen(true);
    first.getState().setPanelOpen(true);

    expect(first.getState()).toMatchObject({
      period: { decade: 2020, year: 2023 },
      musicOpen: true,
      factsOpen: true,
      panelOpen: true,
    });
    expect(second.getState()).toMatchObject({
      period: { decade: 1980, year: null },
      musicOpen: false,
      factsOpen: false,
      panelOpen: false,
    });
  });

  it("accepts the functional period updates used by the map", () => {
    const store = createEraStore();
    store.getState().setPeriod((current) => ({ ...current, year: 1984 }));
    expect(store.getState().period).toEqual({ decade: 1980, year: 1984 });
  });
});

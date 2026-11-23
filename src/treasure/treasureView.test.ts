import { describe, expect, it } from "vitest";
import { treasureView } from "./treasureView";
import type { Map } from "mapbox-gl";

function map(west = -58.379, east = -58.378): Pick<Map, "getBounds" | "getZoom"> {
  return {
    getZoom: () => 18,
    getBounds: () =>
      ({
        getSouth: () => -34.596,
        getNorth: () => -34.595,
        getWest: () => west,
        getEast: () => east,
      }) as ReturnType<Map["getBounds"]>,
  };
}
describe("vista del tesoro", () => {
  it("normaliza vueltas completas del globo sin consultar inclinación", () => {
    const view = treasureView(map(301.621, 301.622))!;
    expect(view.zoom).toBe(18);
    expect(view.minLongitud).toBeCloseTo(-58.379);
    expect(view.maxLongitud).toBeCloseTo(-58.378);
  });
  it("ignora vistas globales que todavía no delimitan una zona", () => {
    expect(treasureView(map(-180, 180))).toBeNull();
  });
  it("ignora valores no finitos y cruces de la línea de cambio de fecha", () => {
    expect(treasureView(map(Number.NaN, -58))).toBeNull();
    expect(treasureView(map(179, 181))).toBeNull();
  });
});

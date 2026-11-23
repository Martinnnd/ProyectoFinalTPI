import type { Map } from "mapbox-gl";
import type { TreasureView } from "./treasureApi";

const longitude = (value: number) => ((((value + 180) % 360) + 360) % 360) - 180;

export function treasureView(map: Pick<Map, "getBounds" | "getZoom">): TreasureView | null {
  const bounds = map.getBounds();
  if (!bounds || bounds.getEast() - bounds.getWest() >= 360) return null;
  const view = {
    zoom: map.getZoom(),
    minLatitud: bounds.getSouth(),
    maxLatitud: bounds.getNorth(),
    minLongitud: longitude(bounds.getWest()),
    maxLongitud: longitude(bounds.getEast()),
  };
  if (
    !Object.values(view).every(Number.isFinite) ||
    view.minLatitud < -90 ||
    view.maxLatitud > 90 ||
    view.minLatitud >= view.maxLatitud ||
    view.minLongitud >= view.maxLongitud
  )
    return null;
  return view;
}

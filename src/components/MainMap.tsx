import { lazy, Suspense, useState, type ComponentProps } from "react";
import MemoryMap, { type Point } from "./MemoryMap";
import PlaceSearch from "./PlaceSearch";
const MapboxMap = lazy(() => import("./MapboxMap"));
export type MapProps = ComponentProps<typeof MemoryMap>;
export default function MainMap(props: MapProps) {
  const token =
    process.env.NEXT_PUBLIC_MAP_MODE === "2d"
      ? undefined
      : process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim();
  const [fallback, setFallback] = useState(false);
  const [searchTarget, setSearchTarget] = useState<Point | null>(null);
  const mapProps = { ...props, searchTarget, onSearchMove: setSearchTarget,
    onSelect: (memory: Parameters<MapProps["onSelect"]>[0]) => { setSearchTarget(null); props.onSelect(memory); } };
  const useFallback = !token?.startsWith("pk.") || fallback;
  return <div className="main-map-shell">
    {useFallback ? <>
      <MemoryMap {...mapProps}/>
      <div className="mapbox-status" role="status">{fallback ? "Mapbox no pudo cargar. Seguís explorando con el mapa 2D." : "Vista 2D · Mapbox pendiente de configuración."}
        {fallback && <button onClick={() => setFallback(false)}>Reintentar Mapbox</button>}
      </div>
    </> : <Suspense fallback={<div className="map-empty" role="status">Cargando globo…</div>}>
      <MapboxMap {...mapProps} token={token!} onFallback={() => setFallback(true)}/>
    </Suspense>}
    <PlaceSearch target={searchTarget} onChoose={setSearchTarget} onCreate={props.onPick}/>
  </div>;
}

import { lazy, Suspense, useState, type ComponentProps } from "react";
import MemoryMap from "./MemoryMap";
const MapboxMap = lazy(() => import("./MapboxMap"));
export type MapProps = ComponentProps<typeof MemoryMap>;
export default function MainMap(props: MapProps) {
  const token =
    process.env.NEXT_PUBLIC_MAP_MODE === "2d"
      ? undefined
      : process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim();
  const [fallback, setFallback] = useState(false);
  if (!token?.startsWith("pk.") || fallback)
    return (
      <div className="main-map-shell">
        <MemoryMap {...props} />
        <div className="mapbox-status" role="status">
          {fallback
            ? "Mapbox no pudo cargar. Seguís explorando con el mapa 2D."
            : "Vista 2D · Mapbox pendiente de configuración."}
          {fallback && (
            <button onClick={() => setFallback(false)}>
              Reintentar Mapbox
            </button>
          )}
        </div>
      </div>
    );
  return (
    <Suspense
      fallback={
        <div className="map-empty" role="status">
          Cargando globo…
        </div>
      }
    >
      <MapboxMap
        {...props}
        token={token}
        onFallback={() => setFallback(true)}
      />
    </Suspense>
  );
}

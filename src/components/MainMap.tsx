import { lazy, Suspense, useEffect, useState, type ComponentProps } from "react";
import { createPortal } from "react-dom";
import MemoryMap, { type Point } from "./MemoryMap";
import PlaceSearch from "./PlaceSearch";
const MapboxMap = lazy(() => import("./MapboxMap"));
export type MapProps = ComponentProps<typeof MemoryMap>;
export default function MainMap({onUserLocation, ...props}: MapProps & {onUserLocation?: (point: Point | null) => void}) {
  const token =
    process.env.NEXT_PUBLIC_MAP_MODE === "2d"
      ? undefined
      : process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim();
  const [fallback, setFallback] = useState(false);
  const [searchTarget, setSearchTarget] = useState<Point | null>(null);
  const [userLocation, setUserLocation] = useState<Point | null>(null);
  const [locationResolved, setLocationResolved] = useState(false);
  const [searchSlot, setSearchSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const placeSearch = () => setSearchSlot(window.innerWidth >= 900 ? document.getElementById("place-search-slot") : null);
    placeSearch();
    window.addEventListener("resize", placeSearch);
    return () => window.removeEventListener("resize", placeSearch);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!("geolocation" in navigator)) {
      onUserLocation?.(null);
      setLocationResolved(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) return;
        const point = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(point);
        onUserLocation?.(point);
        setLocationResolved(true);
      },
      () => {
        if (cancelled) return;
        setUserLocation(null);
        onUserLocation?.(null);
        setLocationResolved(true);
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 300000,
      },
    );
    return () => { cancelled = true; };
  }, [onUserLocation]);

  const mapProps = {
    ...props,
    searchTarget,
    onSearchMove: setSearchTarget,
    onSelect: (memory: Parameters<MapProps["onSelect"]>[0]) => {
      setSearchTarget(null);
      props.onSelect(memory);
    },
  };

  const useFallback = !token?.startsWith("pk.") || fallback;

  return (
    <div className="main-map-shell">
      {useFallback ? (
        <>
          <MemoryMap {...mapProps} />
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
        </>
      ) : (
        <Suspense
          fallback={
            <div className="map-empty" role="status">
              Cargando globo…
            </div>
          }
        >
          <MapboxMap
            {...mapProps}
            token={token!}
            onFallback={() => setFallback(true)}
            userLocation={userLocation}
            locationResolved={locationResolved}
          />
        </Suspense>
      )}

      {searchSlot ? createPortal(<PlaceSearch
        target={searchTarget}
        onChoose={setSearchTarget}
        onCreate={props.onPick}
      />, searchSlot) : <PlaceSearch
        target={searchTarget}
        onChoose={setSearchTarget}
        onCreate={props.onPick}
      />}
    </div>
  );
}

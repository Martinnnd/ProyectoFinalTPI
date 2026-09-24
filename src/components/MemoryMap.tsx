import { useEffect, useState } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  Tooltip,
  ZoomControl,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { LocateFixed, MapPin, RotateCcw } from "lucide-react";
import { symbols, type Memory } from "../types";
export type Point = { lat: number; lng: number };
const center: [number, number] = [-38.4, -64.4];
function MapActions({
  picking,
  onPick,
  selected,
  reset,
}: {
  picking: boolean;
  onPick: (p: Point) => void;
  selected: Memory | null;
  reset: number;
}) {
  const map = useMapEvents({
    click(e) {
      if (picking) onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  useEffect(() => {
    const observer = new ResizeObserver(() =>
      map.invalidateSize({ pan: true, animate: false }),
    );
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  useEffect(() => {
    if (selected)
      map.setView([selected.lat, selected.lng], Math.max(map.getZoom(), 6), {
        animate: false,
      });
  }, [selected, map]);
  useEffect(() => {
    map.setView(center, 4);
  }, [reset, map]);
  useEffect(() => {
    map.getContainer().style.cursor = picking ? "crosshair" : "";
  }, [picking, map]);
  useEffect(() => {
    const element = map.getContainer();
    element.setAttribute(
      "aria-label",
      "Mapa interactivo. Usá las flechas para desplazarte; al agregar, Enter elige el centro.",
    );
    // Leaflet restaura el scroll de window al enfocar, pero el mapa vive en
    // un panel desplazable. Enfocarlo antes evita que el pin se mueva al hacer clic.
    const focusMap = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest(".leaflet-control"))
        element.focus({ preventScroll: true });
    };
    const choose = (event: KeyboardEvent) => {
      if (picking && event.key === "Enter" && event.target === element) {
        event.preventDefault();
        const p = map.getCenter();
        onPick({ lat: p.lat, lng: p.lng });
      }
    };
    element.addEventListener("mousedown", focusMap, true);
    element.addEventListener("keydown", choose);
    return () => {
      element.removeEventListener("keydown", choose);
      element.removeEventListener("mousedown", focusMap, true);
    };
  }, [map, picking, onPick]);
  return null;
}
function icon(memory?: Memory, selected = false) {
  const symbol = memory ? symbols[memory.category] : "+";
  const category = memory
    ? memory.category
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
    : "provisional";
  return L.divIcon({
    className: "memory-marker-wrapper",
    html: `<span class="memory-marker marker-${category} ${selected ? "selected" : ""}">${symbol}</span>`,
    iconSize: [36, 42],
    iconAnchor: [18, 40],
    tooltipAnchor: [0, -38],
  });
}
export default function MemoryMap({
  memories,
  selected,
  onSelect,
  picking,
  onPick,
  draft,
  onCancel,
}: {
  memories: Memory[];
  selected: Memory | null;
  onSelect: (m: Memory) => void;
  picking: boolean;
  onPick: (p: Point) => void;
  draft: Point | null;
  onCancel: () => void;
}) {
  const [reset, setReset] = useState(0);
  const [tileError, setTileError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (!loaded) setTileError(true);
    }, 12000);
    return () => clearTimeout(timeout);
  }, [loaded, retry]);
  return (
    <section
      className="map-section"
      aria-label="Mapa de recuerdos de Argentina"
    >
      <div className="map-frame">
        <MapContainer
          center={center}
          zoom={4}
          minZoom={3}
          maxZoom={18}
          scrollWheelZoom
          className="memory-map"
          attributionControl
          zoomControl={false}
        >
          <ZoomControl
            position="bottomright"
            zoomInTitle="Acercar mapa"
            zoomOutTitle="Alejar mapa"
          />
          <TileLayer
            key={retry}
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            eventHandlers={{
              tileerror: () => setTileError(true),
              load: () => setLoaded(true),
            }}
          />
          <MapActions
            picking={picking}
            onPick={onPick}
            selected={selected}
            reset={reset}
          />
          {memories.map((m) => (
            <Marker
              key={m.id}
              position={[m.lat, m.lng]}
              icon={icon(m, selected?.id === m.id)}
              title={`${m.title}, ${m.year}, ${m.category}`}
              alt={m.title}
              eventHandlers={{
                add: (e) => {
                  e.target
                    .getElement()
                    ?.setAttribute(
                      "aria-label",
                      `${m.title}, ${m.year}, ${m.category}`,
                    );
                },
                click: () => {
                  if (picking) onPick({ lat: m.lat, lng: m.lng });
                  else onSelect(m);
                },
              }}
            >
              <Tooltip direction="top">
                {m.title} · {m.year}
              </Tooltip>
            </Marker>
          ))}
          {draft && (
            <Marker
              position={[draft.lat, draft.lng]}
              icon={icon()}
              title="Ubicación del nuevo recuerdo"
            />
          )}
        </MapContainer>
        <button
          className="map-reset"
          onClick={() => setReset((r) => r + 1)}
          aria-label="Volver a la vista de Argentina"
        >
          <LocateFixed size={18} /> <span>Ver Argentina</span>
        </button>
        {picking && (
          <div className="map-notice picking" role="status">
            <MapPin size={19} />
            <span>Elegí un lugar en el mapa para tu recuerdo.</span>
            <button onClick={onCancel}>Cancelar</button>
          </div>
        )}
        {tileError && (
          <div className="map-notice map-error" role="status">
            <span>
              Parte del mapa no pudo cargar. Revisá tu conexión; los recuerdos
              siguen disponibles en la lista.
            </span>
            <button
              onClick={() => {
                setLoaded(false);
                setTileError(false);
                setRetry((r) => r + 1);
              }}
              aria-label="Reintentar cargar mapa"
            >
              <RotateCcw size={17} />
            </button>
          </div>
        )}
        {!memories.length && !picking && (
          <div className="map-empty">
            No hay recuerdos con esta combinación.
            <br />
            <small>Probá otra categoría o toda la década.</small>
          </div>
        )}
      </div>
    </section>
  );
}

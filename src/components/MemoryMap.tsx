import PinMemoryPreview from "./PinMemoryPreview";
import type { MapBounds } from '../publicationsApi';
import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  CircleMarker,
  Marker,
  TileLayer,
  Tooltip,
  useMapEvents,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import { LocateFixed, MapPin, RotateCcw } from "lucide-react";
import { symbols, type Memory } from "../types";
export type Point = { lat: number; lng: number; label?: string };
const center: [number, number] = [-38.4, -64.4];
function MapActions({
  picking,
  onPick,
  selected,
  reset,
  fitPoints,
  searchTarget,
  onBoundsChange,
}: {
  picking: boolean;
  onPick: (p: Point) => void;
  selected: Memory | null;
  reset: number;
  fitPoints?: string;
  searchTarget?: Point | null;
  onBoundsChange?: (bounds: MapBounds) => void;
}) {
  const reportBounds = () => {
    const b = map.getBounds();
    const west = b.getWest(), east = b.getEast();
    const normalize = (value: number) => ((value + 180) % 360 + 360) % 360 - 180;
    onBoundsChange?.({ minLatitud: Math.max(-90,b.getSouth()), maxLatitud: Math.min(90,b.getNorth()), minLongitud: east-west >= 360 ? -180 : normalize(west), maxLongitud: east-west >= 360 ? 180 : normalize(east) });
  };
  const map = useMapEvents({
    moveend: () => reportBounds(),
    click(e) {
      if (picking) onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  useEffect(() => { reportBounds(); }, [map, onBoundsChange]);
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (map.getContainer().clientWidth > 0) map.invalidateSize({ pan: false, animate: false });
    });
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  useEffect(() => {
    const fit = () => {
      if (!fitPoints) {map.setView(center, 4);return;}
      const points = JSON.parse(fitPoints) as [number, number][];
      map.invalidateSize({animate:false});
      if (points.length) map.fitBounds(L.latLngBounds(points), {padding:[50,50], maxZoom:13, animate:false});
      else map.setView(center,4);
    };
    fit();
    if (fitPoints === undefined) return;
    const observer = new ResizeObserver(() => { if (!selectedRef.current) fit(); });
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [reset, map, fitPoints]);
  useEffect(() => {
    if (selected)
      map.flyTo([selected.lat, selected.lng], Math.max(map.getZoom(), 14), {
        animate: !matchMedia("(prefers-reduced-motion: reduce)").matches, duration: .7,
      });
  }, [selected, map]);
  useEffect(() => {
    if (searchTarget) map.flyTo([searchTarget.lat, searchTarget.lng], 16, {
      animate: !matchMedia("(prefers-reduced-motion: reduce)").matches, duration: .8,
    });
  }, [searchTarget, map]);
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
  const symbol = memory?.groupId
    ? '<img src="/groups/community-pin.svg" width="36" height="44" alt="" />'
    : memory ? symbols[memory.category] : "+";
  const category = memory
    ? memory.category
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
    : "provisional";
  return L.divIcon({
    className: "memory-marker-wrapper",
    html: `<span class="memory-marker marker-${category} ${memory?.groupId ? "community-marker" : ""} ${selected ? "selected" : ""}">${symbol}</span>`,
    iconSize: [36, 42],
    iconAnchor: [18, 40],
    tooltipAnchor: [0, -38],
  });
}
export default function MemoryMap({
  showEmptyState = true,
  onBoundsChange,
  searchTarget,
  onSearchMove,
  fitMemories = false,
  memories,
  selected,
  onSelect,
  onSelectRelated,
  onMoment,
  onOpen,
  picking,
  onPick,
  draft,
  onCancel,
}: {
  active?: boolean;
  showEmptyState?: boolean;
  onBoundsChange?: (bounds: MapBounds) => void;
  searchTarget?: Point | null;
  onSearchMove?: (point: Point) => void;
  fitMemories?: boolean;
  memories: Memory[];
  selected: Memory | null;
  onSelect: (m: Memory) => void;
  onSelectRelated?: (m: Memory) => void;
  onMoment?: (id: number, memory: Memory) => void;
  onOpen?: (m: Memory) => void;
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
      aria-label={fitMemories ? "Mapa personal de recuerdos" : "Mapa de recuerdos de Argentina"}
    >
      <div className="map-frame">
        <MapContainer
          center={center}
          zoom={4}
          minZoom={fitMemories ? 1 : 3}
          maxZoom={18}
          scrollWheelZoom
          className="memory-map"
          attributionControl
          zoomControl={false}
        >
          <ZoomControl position="bottomright" />
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
            onBoundsChange={onBoundsChange}
            picking={picking}
            onPick={onPick}
            selected={selected}
            reset={reset}
            searchTarget={searchTarget}
            fitPoints={fitMemories ? JSON.stringify(memories.map(m => [m.lat,m.lng])) : undefined}
          />
          {(selected && !memories.some(memory => memory.id === selected.id) ? [...memories, selected] : memories).map((m) => (
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
              <Tooltip direction="top">{m.title} · {m.year}</Tooltip>
            </Marker>
          ))}
          {selected && !picking && !searchTarget && <CircleMarker key={selected.id} center={[selected.lat,selected.lng]} radius={0} opacity={0} fillOpacity={0} interactive={false}><Tooltip position={[selected.lat,selected.lng]} direction="right" offset={[25,-20]} permanent interactive className="pin-message-preview"><PinMemoryPreview memory={selected} onSelect={onSelectRelated ?? onSelect} onOpen={onOpen} onMoment={onMoment ? id => onMoment(id, selected) : undefined} /></Tooltip></CircleMarker>}
          {searchTarget && <Marker position={[searchTarget.lat, searchTarget.lng]} icon={icon()} draggable title="Arrastrá para ajustar la ubicación" eventHandlers={{ dragend: event => {
            const point = event.target.getLatLng(); onSearchMove?.({ ...searchTarget, lat: point.lat, lng: point.lng });
          }}}><Tooltip>Ubicación encontrada · Arrastrá para ajustar</Tooltip></Marker>}
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
          aria-label={fitMemories ? "Encuadrar todos los recuerdos" : "Volver a la vista de Argentina"}
        >
          <LocateFixed size={18} /> <span>{fitMemories ? "Ver todos los recuerdos" : "Ver Argentina"}</span>
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
        {showEmptyState && !memories.length && !picking && (
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

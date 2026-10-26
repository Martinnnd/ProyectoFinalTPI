import PinMemoryPreview from './PinMemoryPreview';
import { createPortal } from 'react-dom';
import { MapPin } from 'lucide-react';
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { symbols } from "../types";
import type { MapProps } from "./MainMap";

const overview = {
  center: [-60, -24] as [number, number],
  zoom: 1.8,
  pitch: 0,
  bearing: 0,
};
const intro = {
  center: [-58.5622, -34.6702] as [number, number], // UNLaM, San Justo
  zoom: 17,
  pitch: 45,
  bearing: -20, // opcional: rotar un poco da mejor perspectiva
};
type Camera = {
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
};
// The map remounts every time the visitor leaves the map view, so both facts
// have to outlive the component: the camera they left behind, and whether the
// intro already played. A module binding survives the remount, a ref does not.
let introSeen = false;
let savedCamera: Camera | null = null;
const responsiveOverview = () => ({ ...overview, zoom: window.innerWidth < 900 ? 0.8 : overview.zoom });
const duration = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1000;
type Options = {
  light: string;
  theme: string;
  satellite: boolean;
  labels: boolean;
  poi: boolean;
};
const initial: Options = {
  light: "day",
  theme: "default",
  satellite: false,
  labels: true,
  poi: true,
};
function configure(map: mapboxgl.Map, options: Options) {
  map.setProjection("globe");
  map.setFog({
    color: "#b9e6ff",
    "high-color": "#63a5ed",
    "horizon-blend": 0.035,
    "space-color": "#031627",
    "star-intensity": 0.55,
  });
  map.setConfigProperty("basemap", "lightPreset", options.light);
  map.setConfigProperty("basemap", "showPlaceLabels", options.labels);
  map.setConfigProperty("basemap", "showPointOfInterestLabels", options.poi);
  if (!options.satellite)
    map.setConfigProperty("basemap", "theme", options.theme);
}

export default function MapboxMap(
  props: MapProps & {
    token: string;
    onFallback: () => void;
    userLocation?: { lat: number; lng: number } | null;
    locationResolved: boolean;
  },
) {
  const container = useRef<HTMLDivElement>(null);
  const instance = useRef<mapboxgl.Map | null>(null);
  const styleReady = useRef(false);
  const userInteracted = useRef(false);
  const initialLocationApplied = useRef(false);
  const latest = useRef(props);
  latest.current = props;
  const [options, setOptions] = useState(initial);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const [previewContent, setPreviewContent] = useState<HTMLElement | null>(null);
  const previewPopup = useRef<mapboxgl.Popup | null>(null);
  const focusedPin = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [controls, setControls] = useState(false);
  useEffect(() => {
    if (!container.current) return;
    setReady(false);
    setError(null);
    if (!mapboxgl.supported()) {
      latest.current.onFallback();
      return;
    }
    let map: mapboxgl.Map;
    try {
      map = new mapboxgl.Map({
        container: container.current,
        accessToken: props.token,
        style: `mapbox://styles/mapbox/${optionsRef.current.satellite ? "standard-satellite" : "standard"}`,
        projection: "globe",
        ...(savedCamera ?? responsiveOverview()),
        minZoom: 0.5,
        maxZoom: 19,
        attributionControl: true,
      });
    } catch {
      latest.current.onFallback();
      return;
    }
    instance.current = map;
    const reportBounds = () => {
      const b = map.getBounds();
      if (!b) return;
      const west = b.getWest(), east = b.getEast();
      const normalize = (value: number) => ((value + 180) % 360 + 360) % 360 - 180;
      latest.current.onBoundsChange?.({ minLatitud: Math.max(-90,b.getSouth()), maxLatitud: Math.min(90,b.getNorth()), minLongitud: east-west >= 360 ? -180 : normalize(west), maxLongitud: east-west >= 360 ? 180 : normalize(east) });
    };
    map.on('load', reportBounds);
    map.on('moveend', reportBounds);
    let loaded = false;
    const timeout = window.setTimeout(() => {
      if (!loaded) setError("El mapa está tardando en cargar. Podés reintentar o usar el mapa 2D.");
    }, 20000);
    map.on("style.load", () => {
      styleReady.current = true;
      configure(map, optionsRef.current);
    });
    map.on("webglcontextlost", () => latest.current.onFallback());
    
    let resourceFailed = false;
    map.on("error", (event) => {
      resourceFailed = true;
      const status = (event.error as Error & { status?: number }).status;
      setError(status === 401 || status === 403
        ? "Mapbox rechazó el acceso al mapa. Revisá el token y sus dominios permitidos."
        : status === 429
          ? "Mapbox alcanzó su límite de solicitudes. Esperá un momento antes de reintentar."
          : "No se pudieron cargar algunos recursos del mapa. Reintentá la carga; si persiste, revisá la conexión o los bloqueadores del navegador.");
    });
    map.on("idle", () => {
      // An idle map may still contain failed tiles. Only clear a slow-load
      // warning when this instance has not reported a resource failure.
      if (!resourceFailed) setError(null);
    });
    map.on("load", () => {
      loaded = true;
      clearTimeout(timeout);
      setReady(true);

      // Si ya se mostró la introducción en una visita anterior,
      // conservamos la cámara guardada.
      if (introSeen) {
        initialLocationApplied.current = true;
      }
    });

    map.on("dragstart", () => {
      userInteracted.current = true;
    });

    map.on("zoomstart", (event) => {
      if ("originalEvent" in event && event.originalEvent) {
        userInteracted.current = true;
      }
    });

    map.on("rotatestart", () => {
      userInteracted.current = true;
    });

    map.on("pitchstart", (event) => {
      if ("originalEvent" in event && event.originalEvent) {
        userInteracted.current = true;
      }
    });

    map.on("click", (event) => {
      if (latest.current.picking) {
        latest.current.onPick({
          lat: event.lngLat.lat,
          lng: event.lngLat.wrap().lng,
        });
      }
    });
    const canvas = map.getCanvas();
    canvas.setAttribute(
      "aria-label",
      "Globo de recuerdos. Flechas para desplazarte; Enter elige el centro al crear un recuerdo.",
    );
    const key = (event: KeyboardEvent) => {
      if (event.key === "Enter" && latest.current.picking) {
        event.preventDefault();
        const point = map.getCenter().wrap();
        latest.current.onPick({ lat: point.lat, lng: point.lng });
      }
    };
    canvas.addEventListener("keydown", key);
    const observer = new ResizeObserver(() => { if (container.current?.clientWidth) map.resize(); });
    observer.observe(container.current);
    return () => {
      clearTimeout(timeout);
      observer.disconnect();
      canvas.removeEventListener("keydown", key);
      map.stop();
      const center = map.getCenter();
      savedCamera = {
        center: [center.lng, center.lat],
        zoom: map.getZoom(),
        pitch: map.getPitch(),
        bearing: map.getBearing(),
      };
      map.remove();
      instance.current = null;
      styleReady.current = false;
    };
  }, [props.token, reload]);
  useEffect(() => {
    if (props.active === false) instance.current?.stop();
  }, [props.active]);
  useEffect(() => {
    const map = instance.current;
    if (!map || !ready) return;
    if (styleReady.current) configure(map, options);
  }, [options, ready]);
  useEffect(() => {
    const map = instance.current;

    if (
      !map ||
      !ready ||
      props.active === false ||
      !props.locationResolved ||
      initialLocationApplied.current
    ) {
      return;
    }

    if (props.selected) {
      introSeen = true;
      initialLocationApplied.current = true;
      return;
    }

    // Si ya se había mostrado la introducción, no alteramos
    // la cámara guardada al volver a entrar al mapa.
    if (introSeen) {
      initialLocationApplied.current = true;
      return;
    }

    // Si el usuario ya interactuó mientras esperábamos el permiso,
    // respetamos su posición y no lo recentramos.
    if (userInteracted.current) {
      introSeen = true;
      initialLocationApplied.current = true;
      return;
    }

    const location = props.userLocation;

    const target = location
      ? {
          center: [location.lng, location.lat] as [number, number],
          zoom: 14,
          pitch: 45,
          bearing: -20,
        }
      : {
        center: [-64.4, -38.4] as [number, number],
        zoom: 4,
        pitch: 0,
        bearing: 0,
      };

    introSeen = true;
    initialLocationApplied.current = true;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduce) {
      map.jumpTo(target);
    } else {
      map.flyTo({
        ...target,
        duration: 6000,
        essential: true,
      });
    }
  }, [props.locationResolved, props.userLocation, props.active, props.selected?.id, ready]);
  useEffect(() => {
    const map = instance.current;
    if (!map) return;
    map.getCanvas().style.cursor = props.picking ? "crosshair" : "";
  }, [props.picking, ready]);
  useEffect(() => {
    const map = instance.current;
    if (!map || !ready) return;
    const visiblePins = props.selected && !props.memories.some(memory => memory.id === props.selected!.id)
      ? [...props.memories, props.selected] : props.memories;
    const markers = visiblePins.map((memory) => {
      const button = document.createElement("button");
      button.className = "mapbox-memory-pin";
      button.setAttribute(
        "aria-label",
        `${memory.title}, ${memory.year}, ${memory.category}`,
      );
      button.title = `${memory.title} · ${memory.year}`;
      const symbol = document.createElement("span");
      const category = memory.category
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      symbol.className = `memory-marker marker-${category} ${props.selected?.id === memory.id ? "selected" : ""}`;
      if (memory.groupId) {
        symbol.classList.add('community-marker');
        const icon = document.createElement('img');
        icon.src = '/groups/community-pin.svg'; icon.alt = ''; icon.width = 36; icon.height = 44;
        symbol.append(icon);
        button.setAttribute('aria-label', `${memory.title}, ${memory.year}, grupos en común`);
        button.title = `${memory.title} · Grupos en común`;
      } else symbol.textContent = symbols[memory.category];
      button.append(symbol);
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        const p = latest.current;
        if (p.picking) p.onPick({ lat: memory.lat, lng: memory.lng });
        else p.onSelect(memory);
      });
      const marker = new mapboxgl.Marker({ element: button })
        .setLngLat([memory.lng, memory.lat])
        .addTo(map);
      button.setAttribute("role", "button");
      return marker;
    });
    if (props.draft)
      markers.push(
        new mapboxgl.Marker({ color: "#e35a38" })
          .setLngLat([props.draft.lng, props.draft.lat])
          .addTo(map),
      );
    return () => markers.forEach((marker) => marker.remove());
  }, [props.memories, props.selected?.id, props.selected?.lat, props.selected?.lng, props.draft, ready]);
  useEffect(() => {
    if (!ready || props.active === false) return;
    if (!props.selected) { focusedPin.current = null; return; }
    const locationKey = `${props.selected.id}:${props.selected.lat}:${props.selected.lng}`;
    if (focusedPin.current === locationKey) return;
    focusedPin.current = locationKey;
    if (props.selected)
      instance.current?.flyTo({
        center: [props.selected.lng, props.selected.lat],
        zoom: Math.max(instance.current.getZoom(), 14),
        duration: duration(),
      });
  }, [props.selected?.id, props.selected?.lat, props.selected?.lng, props.active, ready]);
  useEffect(() => {
    const map=instance.current;
    const memory=props.selected;
    if(!map || !ready || !memory || props.picking || props.searchTarget)return;
    const content=document.createElement('div');
    setPreviewContent(content);
    const preview=new mapboxgl.Popup({className:'pin-message-preview',anchor:'left',offset:25,maxWidth:'230px',closeButton:false,closeOnClick:false,focusAfterOpen:false})
      .setLngLat([memory.lng,memory.lat]).setDOMContent(content).addTo(map);
    previewPopup.current = preview;
    return ()=>{setPreviewContent(null);preview.remove();};
  }, [props.selected, props.picking, props.searchTarget, ready]);
  useEffect(() => {
    const map = instance.current;
    const target = props.searchTarget;
    if (!map || !ready || !target) return;
    map.flyTo({ center: [target.lng, target.lat], zoom: 16, pitch: 0, bearing: 0, duration: duration() });
    const marker = new mapboxgl.Marker({ color: "#e35a38", draggable: true })
      .setLngLat([target.lng, target.lat]).addTo(map);
    marker.getElement().setAttribute("aria-label", "Ubicación encontrada. Arrastrá para ajustar");
    marker.on("dragend", () => {
      const point = marker.getLngLat().wrap();
      latest.current.onSearchMove?.({ ...target, lat: point.lat, lng: point.lng });
    });
    return () => { marker.remove(); };
  }, [props.searchTarget, ready]);
  function satellite(value: boolean) {
    const next = { ...options, satellite: value };
    optionsRef.current = next;
    setOptions(next);
    styleReady.current = false;
    setError(null);
    instance.current?.setStyle(
      `mapbox://styles/mapbox/${value ? "standard-satellite" : "standard"}`,
    );
  }
  return (
    <section
      className="map-section mapbox-section"
      aria-label="Globo Mapbox de recuerdos de Argentina"
    >
      {previewContent && props.selected && createPortal(<PinMemoryPreview key={props.selected.id} memory={props.selected} onSelect={memory => (latest.current.onSelectRelated ?? latest.current.onSelect)(memory)} onOpen={props.onOpen} onMoment={props.onMoment ? id => latest.current.onMoment?.(id, props.selected!) : undefined} onClose={() => { if (latest.current.onClosePreview) latest.current.onClosePreview(); else { previewPopup.current?.remove(); setPreviewContent(null); } }} />, previewContent)}
      <div ref={container} className="memory-map" data-mapbox-ready={ready} />
      
      {controls && (
        <aside
          id="mapbox-settings"
          className="mapbox-settings"
          aria-label="Estilo del mapa"
        >
          <header>
            <strong>Estilo del mapa</strong>
            <button
              aria-label="Cerrar estilo del mapa"
              onClick={() => setControls(false)}
            >
              ×
            </button>
          </header>
          <label>
            Iluminación
            <select
              value={options.light}
              onChange={(e) =>
                setOptions({ ...options, light: e.target.value })
              }
            >
              <option value="dawn">Amanecer</option>
              <option value="day">Día</option>
              <option value="dusk">Atardecer</option>
              <option value="night">Noche</option>
            </select>
          </label>
          <label>
            Color
            <select
              disabled={options.satellite}
              value={options.theme}
              onChange={(e) =>
                setOptions({ ...options, theme: e.target.value })
              }
            >
              <option value="default">Original</option>
              <option value="faded">Suave</option>
              <option value="monochrome">Monocromo</option>
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              checked={options.satellite}
              onChange={(e) => satellite(e.target.checked)}
            />{" "}
            Satélite
          </label>
          <label>
            <input
              type="checkbox"
              checked={options.labels}
              onChange={(e) =>
                setOptions({ ...options, labels: e.target.checked })
              }
            />{" "}
            Nombres de lugares
          </label>
          <label>
            <input
              type="checkbox"
              checked={options.poi}
              onChange={(e) =>
                setOptions({ ...options, poi: e.target.checked })
              }
            />{" "}
            Puntos de interés
          </label>
        </aside>
      )}
      {props.picking && (
        <div className="map-notice picking" role="status">
          <MapPin size={22} aria-hidden="true" />
          <span>Elegí un lugar en el mapa para tu recuerdo.</span>
          <button onClick={props.onCancel}>Cancelar</button>
        </div>
      )}
      {error && (
        <div className="mapbox-status" role="alert">
          {error}
          <button onClick={() => setReload(value => value + 1)}>Reintentar mapa</button>
          <button onClick={props.onFallback}>Usar mapa 2D</button>
          <button onClick={() => setError(null)}>Cerrar aviso</button>
        </div>
      )}
      {props.showEmptyState !== false && !props.memories.length && !props.picking && (
        <div className="map-empty">
          No hay recuerdos con esta combinación.
          <br />
          <small>Probá otra categoría o toda la década.</small>
        </div>
      )}
    </section>
  );
}

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
  props: MapProps & { token: string; onFallback: () => void },
) {
  const container = useRef<HTMLDivElement>(null);
  const instance = useRef<mapboxgl.Map | null>(null);
  const styleReady = useRef(false);
  const latest = useRef(props);
  latest.current = props;
  const [options, setOptions] = useState(initial);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [controls, setControls] = useState(false);
  useEffect(() => {
    if (!container.current) return;
    if (!mapboxgl.supported()) {
      latest.current.onFallback();
      return;
    }
    let map: mapboxgl.Map;
    try {
      map = new mapboxgl.Map({
        container: container.current,
        accessToken: props.token,
        style: "mapbox://styles/mapbox/standard",
        projection: "globe",
        ...overview,
        minZoom: 0.5,
        maxZoom: 19,
        attributionControl: true,
      });
    } catch {
      latest.current.onFallback();
      return;
    }
    instance.current = map;
    let loaded = false;
    const timeout = window.setTimeout(() => {
      if (!loaded) setError(true);
    }, 20000);
    map.on("style.load", () => {
      styleReady.current = true;
      configure(map, optionsRef.current);
    });
    map.on("webglcontextlost", () => latest.current.onFallback());
    map.on("load", () => {
      loaded = true;
      clearTimeout(timeout);
      setReady(true);
    });
    map.on("error", () => setError(true));
    map.on("click", (event) => {
      if (latest.current.picking)
        latest.current.onPick({
          lat: event.lngLat.lat,
          lng: event.lngLat.wrap().lng,
        });
    });
    map.addControl(new mapboxgl.NavigationControl(), "bottom-right");
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
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(container.current);
    return () => {
      clearTimeout(timeout);
      observer.disconnect();
      canvas.removeEventListener("keydown", key);
      map.remove();
      instance.current = null;
      styleReady.current = false;
    };
  }, [props.token]);
  useEffect(() => {
    const map = instance.current;
    if (!map || !ready) return;
    if (styleReady.current) configure(map, options);
  }, [options, ready]);
  useEffect(() => {
    const map = instance.current;
    if (!map) return;
    map.getCanvas().style.cursor = props.picking ? "crosshair" : "";
  }, [props.picking, ready]);
  useEffect(() => {
    const map = instance.current;
    if (!map || !ready) return;
    const markers = props.memories.map((memory) => {
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
      symbol.textContent = symbols[memory.category];
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
  }, [props.memories, props.selected?.id, props.draft, ready]);
  useEffect(() => {
    if (ready && props.selected)
      instance.current?.flyTo({
        center: [props.selected.lng, props.selected.lat],
        zoom: Math.max(instance.current.getZoom(), 8),
        duration: duration(),
      });
  }, [props.selected?.id, ready]);
  function satellite(value: boolean) {
    const next = { ...options, satellite: value };
    optionsRef.current = next;
    setOptions(next);
    styleReady.current = false;
    setError(false);
    instance.current?.setStyle(
      `mapbox://styles/mapbox/${value ? "standard-satellite" : "standard"}`,
    );
  }
  return (
    <section
      className="map-section mapbox-section"
      aria-label="Globo Mapbox de recuerdos de Argentina"
    >
      <div ref={container} className="memory-map" data-mapbox-ready={ready} />
      <div className="globe-tools">
        <button
          onClick={() =>
            instance.current?.flyTo({ ...overview, duration: duration() })
          }
        >
          Ver globo
        </button>
        <button
          onClick={() =>
            instance.current?.flyTo({
              center: [-64.4, -38.4],
              zoom: 4,
              pitch: 0,
              bearing: 0,
              duration: duration(),
            })
          }
        >
          Ver Argentina
        </button>
        <button
          aria-expanded={controls}
          aria-controls="mapbox-settings"
          onClick={() => setControls((v) => !v)}
        >
          Estilo del mapa
        </button>
      </div>
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
          <span>Elegí un lugar en el mapa para tu recuerdo.</span>
          <button onClick={props.onCancel}>Cancelar</button>
        </div>
      )}
      {error && (
        <div className="mapbox-status" role="alert">
          Mapbox no pudo cargar parte del mapa. Revisá la conexión o la
          configuración del token.
          <button onClick={props.onFallback}>Usar mapa 2D</button>
          <button onClick={() => setError(false)}>Cerrar aviso</button>
        </div>
      )}
      {!props.memories.length && !props.picking && (
        <div className="map-empty">
          No hay recuerdos con esta combinación.
          <br />
          <small>Probá otra categoría o toda la década.</small>
        </div>
      )}
    </section>
  );
}

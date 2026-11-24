"use client";

import { useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import "leaflet/dist/leaflet.css";
import styles from "./treasureAdmin.module.css";

type Point = { latitud: number; longitud: number };
type MapAdapter = { move: (point: Point) => void; remove: () => void };

export default function TreasureLocationMap({
  point,
  onChange,
}: {
  point: Point;
  onChange: (point: Point) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapAdapter | null>(null);
  const initial = useRef(point);
  const changed = useRef(onChange);
  const [status, setStatus] = useState("Cargando mapa…");
  useEffect(() => {
    changed.current = onChange;
  }, [onChange]);
  useEffect(() => {
    initial.current = point;
  }, [point]);
  useEffect(() => {
    let cancelled = false;
    const token =
      process.env.NEXT_PUBLIC_MAP_MODE === "2d"
        ? ""
        : process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim();
    async function start() {
      if (!container.current) return;
      if (token?.startsWith("pk.")) {
        const { default: mapboxgl } = await import("mapbox-gl");
        if (cancelled || !container.current) return;
        const instance = new mapboxgl.Map({
          container: container.current,
          accessToken: token,
          style: "mapbox://styles/mapbox/standard",
          center: [initial.current.longitud, initial.current.latitud],
          zoom: 17,
          maxZoom: 19,
        });
        const marker = new mapboxgl.Marker({ color: "#32654f" })
          .setLngLat([initial.current.longitud, initial.current.latitud])
          .addTo(instance);
        instance.addControl(new mapboxgl.NavigationControl({ showCompass: false }));
        instance.on("click", (event) =>
          changed.current({ latitud: event.lngLat.lat, longitud: event.lngLat.wrap().lng }),
        );
        instance.on("load", () => {
          if (!cancelled) setStatus("");
        });
        instance.on("error", () => {
          if (!cancelled)
            setStatus("No pudimos cargar el mapa. Podés ingresar las coordenadas debajo.");
        });
        map.current = {
          move: (p) => {
            marker.setLngLat([p.longitud, p.latitud]);
            instance.easeTo({ center: [p.longitud, p.latitud], duration: 0 });
          },
          remove: () => {
            marker.remove();
            instance.remove();
          },
        };
      } else {
        const { default: L } = await import("leaflet");
        if (cancelled || !container.current) return;
        const instance = L.map(container.current).setView(
          [initial.current.latitud, initial.current.longitud],
          17,
        );
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(instance);
        const marker = L.circleMarker([initial.current.latitud, initial.current.longitud], {
          radius: 9,
          color: "#32654f",
          fillOpacity: 0.8,
        }).addTo(instance);
        instance.on("click", (event) =>
          changed.current({ latitud: event.latlng.lat, longitud: event.latlng.wrap().lng }),
        );
        map.current = {
          move: (p) => {
            marker.setLatLng([p.latitud, p.longitud]);
            instance.panTo([p.latitud, p.longitud], { animate: false });
          },
          remove: () => instance.remove(),
        };
        setStatus("");
      }
    }
    void start().catch(() => {
      if (!cancelled)
        setStatus("No pudimos cargar el mapa. Podés ingresar las coordenadas debajo.");
    });
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    if (
      Number.isFinite(point.latitud) &&
      Math.abs(point.latitud) <= 85 &&
      Number.isFinite(point.longitud) &&
      Math.abs(point.longitud) <= 180
    )
      map.current?.move({ latitud: point.latitud, longitud: point.longitud });
  }, [point.latitud, point.longitud]);
  return (
    <div>
      <div
        ref={container}
        className={styles.map}
        aria-label="Mapa para ubicar el tesoro"
        data-treasure-picker-ready={status === ""}
      />
      <p role="status">{status || "Hacé clic en el mapa para ubicar el tesoro con precisión."}</p>
    </div>
  );
}

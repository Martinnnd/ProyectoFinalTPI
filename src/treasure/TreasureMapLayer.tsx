"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import mapboxgl from "mapbox-gl";
import { LoaderCircle, Trophy } from "lucide-react";
import { useNotice } from "../context/NoticeProvider";
import { useTreasure } from "./TreasureProvider";
import {
  collectTreasure,
  getVisibleTreasure,
  type TreasureFinding,
  type VisibleTreasure,
} from "./treasureApi";
import TreasureFoundDialog from "./TreasureFoundDialog";
import styles from "./treasure.module.css";
import { treasureView } from "./treasureView";

export default function TreasureMapLayer({
  map,
  active,
  picking,
  onVisibilityChange,
}: {
  map: mapboxgl.Map | null;
  active: boolean;
  picking: boolean;
  onVisibilityChange?: (visible: boolean) => void;
}) {
  const treasure = useTreasure();
  const challenge = treasure?.challenge;
  const owner = treasure?.usuarioId;
  const refresh = treasure?.refresh;
  const showToast = useNotice((state) => state.showToast);
  const [visible, setVisible] = useState<{ host: HTMLElement; treasure: VisibleTreasure } | null>(
    null,
  );
  const [finding, setFinding] = useState<TreasureFinding | null>(null);
  const [saving, setSaving] = useState(false);
  const capture = useRef<AbortController | null>(null);
  const busy = useRef(false);
  useEffect(() => {
    onVisibilityChange?.(!!visible);
    return () => onVisibilityChange?.(false);
  }, [visible, onVisibilityChange]);
  useEffect(() => {
    setFinding(null);
    capture.current?.abort();
  }, [owner]);

  useEffect(() => {
    if (!map || !challenge || challenge.halladoUtc || !active || picking || !owner) return;
    let marker: mapboxgl.Marker | null = null;
    let pending: AbortController | null = null;
    let disposed = false;
    const clear = () => {
      pending?.abort();
      marker?.remove();
      marker = null;
      setVisible(null);
    };
    const query = async () => {
      clear();
      const view = treasureView(map);
      if (!view || view.zoom < challenge.zoomMinimo || Date.parse(challenge.finUtc) <= Date.now())
        return;
      const request = new AbortController();
      pending = request;
      const timeout = setTimeout(() => request.abort(), 8000);
      try {
        const item = await getVisibleTreasure(view, request.signal);
        if (!item || item.retoId !== challenge.id || request.signal.aborted || disposed) return;
        const host = document.createElement("div");
        host.addEventListener("click", (event) => event.stopPropagation());
        marker = new mapboxgl.Marker({ element: host, anchor: "bottom" })
          .setLngLat([item.longitud, item.latitud])
          .addTo(map);
        setVisible({ host, treasure: item });
      } catch {
        // La búsqueda puede continuar si una consulta de visibilidad falla.
      } finally {
        clearTimeout(timeout);
      }
    };
    map.on("movestart", clear);
    map.on("moveend", query);
    void query();
    return () => {
      disposed = true;
      map.off("movestart", clear);
      map.off("moveend", query);
      clear();
    };
  }, [map, active, picking, challenge, owner]);

  useEffect(() => () => capture.current?.abort(), []);
  const close = useCallback(() => {
    setFinding(null);
    map?.getCanvas().focus();
  }, [map]);
  async function collect() {
    if (!visible || !map || !treasure || busy.current) return;
    const view = treasureView(map);
    if (!view || !challenge || view.zoom < challenge.zoomMinimo) return;
    busy.current = true;
    setSaving(true);
    const request = new AbortController();
    capture.current = request;
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      request.abort();
    }, 10000);
    try {
      const result = await collectTreasure(visible.treasure.retoId, view, request.signal);
      if (request.signal.aborted) return;
      treasure.markFound(result);
      setFinding(result);
    } catch (error) {
      if (!request.signal.aborted) {
        showToast(
          error instanceof Error
            ? error.message
            : "No pudimos guardar el hallazgo. Intentá nuevamente.",
          "error",
        );
        void refresh?.();
      } else if (timedOut) {
        showToast("La confirmación tardó demasiado. Volvé a intentar recoger el tesoro.", "error");
      }
    } finally {
      clearTimeout(timeout);
      busy.current = false;
      setSaving(false);
    }
  }
  return (
    <>
      {visible &&
        createPortal(
          <button
            type="button"
            className={styles.marker}
            aria-label="Recoger el tesoro"
            title="Hay algo entre estos recuerdos…"
            disabled={saving}
            onClick={(event) => {
              event.stopPropagation();
              void collect();
            }}
          >
            {saving ? <LoaderCircle size={28} className={styles.spin} /> : <Trophy size={28} />}
            <span className={styles.spark} aria-hidden="true">
              ✦
            </span>
          </button>,
          visible.host,
        )}
      {finding && <TreasureFoundDialog finding={finding} onClose={close} />}
    </>
  );
}

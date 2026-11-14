import { GripVertical, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function MapPickingNotice({ onCancel }: { onCancel: () => void }) {
  const notice = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; x: number; y: number; left: number; top: number } | null>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const move = (left: number, top: number) => {
    const element = notice.current;
    const parent = element?.parentElement;
    if (!element || !parent) return;
    setPosition({
      left: Math.max(0, Math.min(left, parent.clientWidth - element.offsetWidth)),
      top: Math.max(0, Math.min(top, parent.clientHeight - element.offsetHeight)),
    });
  };

  useEffect(() => {
    const element = notice.current;
    const parent = element?.parentElement;
    if (!element || !parent) return;
    const observer = new ResizeObserver(() => {
      // Keep the notice reachable when the map or notice changes size.
      const bounds = element.getBoundingClientRect();
      const container = parent.getBoundingClientRect();
      move(bounds.left - container.left, bounds.top - container.top);
    });
    observer.observe(parent);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={notice}
      className={`map-notice picking draggable-picking${dragging ? " is-dragging" : ""}`}
      role="status"
      style={
        position
          ? {
              ...position,
              transform: "none",
              right: "auto",
              bottom: "auto",
              width: "min(560px, calc(100% - 24px))",
            }
          : undefined
      }
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className="picking-drag-handle"
        aria-label="Mover cartel de ubicación"
        title="Arrastrá para mover; también podés usar las flechas"
        onPointerDown={(event) => {
          if (!event.isPrimary || event.button !== 0) return;
          event.stopPropagation();
          const element = notice.current!;
          const bounds = element.getBoundingClientRect();
          const parent = element.parentElement!.getBoundingClientRect();
          drag.current = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            left: bounds.left - parent.left,
            top: bounds.top - parent.top,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragging(true);
        }}
        onPointerMove={(event) => {
          const current = drag.current;
          if (!current || current.id !== event.pointerId) return;
          move(current.left + event.clientX - current.x, current.top + event.clientY - current.y);
        }}
        onLostPointerCapture={() => {
          drag.current = null;
          setDragging(false);
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => {
          drag.current = null;
          setDragging(false);
        }}
        onKeyDown={(event) => {
          const delta = {
            ArrowLeft: [-16, 0],
            ArrowRight: [16, 0],
            ArrowUp: [0, -16],
            ArrowDown: [0, 16],
          }[event.key];
          if (!delta) return;
          event.preventDefault();
          event.stopPropagation();
          const element = notice.current!;
          move(element.offsetLeft + delta[0], element.offsetTop + delta[1]);
        }}
      >
        <GripVertical size={20} aria-hidden="true" />
      </button>
      <MapPin size={22} aria-hidden="true" />
      <span>Elegí un lugar en el mapa para tu recuerdo.</span>
      <button type="button" onClick={onCancel}>
        Cancelar
      </button>
    </div>
  );
}

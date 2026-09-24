import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import MemoryMap from "./MemoryMap";
import type { Memory } from "../types";

export default function MapModal({
  memories,
  selected,
  onSelect,
  onClose,
}: {
  memories: Memory[];
  selected: Memory | null;
  onSelect: (memory: Memory) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => {
      element?.close();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="expanded-map-dialog"
      aria-labelledby="expanded-map-title"
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          onClose();
      }}
    >
      <header>
        <div>
          <h2 id="expanded-map-title">Explorá los recuerdos en el mapa</h2>
          <small>{memories.length} recuerdos en la época seleccionada</small>
        </div>
        <button
          autoFocus
          className="icon-button"
          aria-label="Cerrar mapa ampliado"
          onClick={onClose}
        >
          <X size={22} />
        </button>
      </header>
      <div className="expanded-map-content">
        <MemoryMap
          memories={memories}
          selected={selected}
          onSelect={onSelect}
          picking={false}
          onPick={() => {}}
          draft={null}
          onCancel={onClose}
        />
      </div>
      <footer>
        {selected ? (
          <>
            <strong>{selected.title}</strong>
            <span>
              {selected.place} · {selected.year}
            </span>
            <button className="secondary-button" onClick={onClose}>
              Ver publicación en el feed
            </button>
          </>
        ) : (
          <span>Elegí un pin para ubicar su publicación en el feed.</span>
        )}
      </footer>
    </dialog>
  );
}

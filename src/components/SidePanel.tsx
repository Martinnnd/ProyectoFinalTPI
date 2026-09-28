import { ArrowUpRight } from "lucide-react";
import { symbols, type Memory } from "../types";

export function MemoryArtwork({
  category,
  year,
  image,
  title,
}: {
  category: Memory["category"];
  year: number;
  image?: string;
  title: string;
}) {
  return (
    <div className={`memory-art art-${Math.floor(year / 10) * 10}`}>
      {image && (
        <img
          src={image}
          alt={title}
          onError={(e) => {
            e.currentTarget.hidden = true;
          }}
        />
      )}
      <div className="art-grid" />
      <span className="art-label">ARCHIVO DE MOMENTOS</span>
      <div className="art-symbol">{symbols[category]}</div>
      <span className="art-year">{year}</span>
      <span className="art-footer">UN LUGAR AL QUE VOLVER ↗</span>
    </div>
  );
}
export default function SidePanel({ memories, selected, onSelect }: {
  memories: Memory[];
  selected: Memory | null;
  onSelect: (memory: Memory) => void;
}) {
  return <aside className="side-panel" aria-label="Recuerdos de la época" id="stories">
    <div className="stories-content">
      <div className="list-heading"><h3>Elegí un recuerdo</h3><span>{memories.length}</span></div>
      <p className="stories-hint">Abrí el título para leerlo en el feed.</p>
      <div className="memory-list">
        {memories.map(memory => <button key={memory.id} aria-current={selected?.id === memory.id ? 'true' : undefined} onClick={() => onSelect(memory)}>
          <strong>{memory.title}</strong><ArrowUpRight size={16} aria-hidden="true" />
        </button>)}
        {!memories.length && <p className="muted">No hay recuerdos para este filtro.</p>}
      </div>
    </div>
  </aside>;
}

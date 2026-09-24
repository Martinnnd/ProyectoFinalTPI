import { useEffect, useRef } from "react";
import { ArrowLeft, ArrowUpRight, MapPin } from "lucide-react";
import { eraContent } from "../data";
import { symbols, type Memory, type Period } from "../types";

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
export default function SidePanel({
  period,
  selected,
  onBack,
  memories,
  onSelect,
}: {
  period: Period;
  selected: Memory | null;
  onBack: () => void;
  memories: Memory[];
  onSelect: (m: Memory) => void;
}) {
  const container = useRef<HTMLElement>(null);
  useEffect(() => {
    container.current?.scrollTo(0, 0);
  }, [selected?.id, period]);
  return (
    <aside
      ref={container}
      className="side-panel"
      aria-label="Historias y cultura"
      id="stories"
    >
      {selected ? (
        <div className="detail-content" key={selected.id}>
          <button className="text-button" onClick={onBack}>
            <ArrowLeft size={15} /> Volver a las historias
          </button>
          <MemoryArtwork
            category={selected.category}
            year={selected.year}
            image={selected.image}
            title={selected.title}
          />
          <div className="detail-meta">
            <span className="category-badge">
              {symbols[selected.category]} {selected.category}
            </span>
            <span>{selected.year}</span>
          </div>
          <h2 className="detail-title">{selected.title}</h2>
          <p className="detail-place">
            <MapPin size={15} />
            {selected.place}
          </p>
          <p className="memory-story">{selected.description}</p>
          <div className="author">
            <span className="avatar">{selected.author.slice(0, 1)}</span>
            <div>
              <strong>{selected.author}</strong>
              <small>
                {selected.source === "demo"
                  ? "Autor ficticio · dato de demostración"
                  : "Tu recuerdo · guardado en este navegador"}
              </small>
            </div>
          </div>
          <div className="source-note">
            {selected.source === "demo"
              ? "Relato ficticio de demostración situado en un lugar real. Las personas y esta experiencia son inventadas."
              : "Este recuerdo se guarda solo en este navegador y no se comparte entre dispositivos."}
          </div>
          {selected.reference && (
            <a
              className="text-button"
              href={selected.reference}
              target="_blank"
              rel="noreferrer"
            >
              Consultar fuente <ArrowUpRight size={15} />
            </a>
          )}
        </div>
      ) : (
        <div className="stories-content">
          <h2>{eraContent[period.decade].label}, en primera persona.</h2>
          <p className="muted">{eraContent[period.decade].description}</p>
          <div className="list-heading">
            <h3>Elegí un recuerdo</h3>
            <span>{memories.length}</span>
          </div>
          <div className="memory-list">
            {memories.map((m) => (
              <button key={m.id} onClick={() => onSelect(m)}>
                <span className="list-symbol">{symbols[m.category]}</span>
                <span>
                  <strong>{m.title}</strong>
                  <small>
                    {m.place} · {m.year}
                  </small>
                  <span className="story-excerpt">
                    {m.description.slice(0, 100)}…
                  </span>
                </span>
                <ArrowUpRight size={16} />
              </button>
            ))}
            {!memories.length && (
              <p className="muted">
                No hay historias para este filtro. Probá con toda la década o
                agregá la tuya.
              </p>
            )}
          </div>
          <p className="demo-note">
            Relatos de ejemplo y autores ficticios. Tus recuerdos propios se
            guardan en este navegador.
          </p>
        </div>
      )}
    </aside>
  );
}

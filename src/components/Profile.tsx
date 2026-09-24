import { MapPin, Plus, UserRound, X } from "lucide-react";
import MemoryMap from "./MemoryMap";
import type { Memory, Period } from "../types";

export default function Profile({
  memories,
  allMemories,
  following,
  period,
  selected,
  onSelect,
  onAdd,
}: {
  memories: Memory[];
  allMemories: Memory[];
  following: string[];
  period: Period;
  selected: Memory | null;
  onSelect: (memory: Memory | null) => void;
  onAdd: () => void;
}) {
  return (
    <main id="explore" className="personal-profile" aria-label="Mi perfil">
      <header className="personal-header">
        <div className="profile-portrait" aria-hidden="true">
          <UserRound size={44} />
        </div>
        <div className="personal-identity">
          <span className="eyebrow">MI ARCHIVO PERSONAL</span>
          <h2>Mi perfil</h2>
          <p>Los lugares cambian. Tus historias quedan.</p>
          <small className="profile-note">
            Visitante · recuerdos guardados en este navegador
          </small>
        </div>
        <button className="primary-button" onClick={onAdd}>
          <Plus size={18} />
          Crear un recuerdo
        </button>
        <dl className="personal-counts">
          <div>
            <dt>Recuerdos</dt>
            <dd>{allMemories.length}</dd>
          </div>
          <div>
            <dt>Seguidores</dt>
            <dd>0</dd>
          </div>
          <div>
            <dt>Seguidos</dt>
            <dd>{following.length}</dd>
          </div>
          <div>
            <dt>Lugares</dt>
            <dd>{new Set(allMemories.map((m) => `${m.lat},${m.lng}`)).size}</dd>
          </div>
        </dl>
        <small className="personal-demo-note">
          Perfil local sin inicio de sesión. Los seguidos corresponden a esta
          sesión; todavía no recibís seguidores.
        </small>
      </header>
      <section className="personal-atlas">
        <div className="personal-section-title">
          <div>
            <span className="eyebrow">MI GEOGRAFÍA DE RECUERDOS</span>
            <h3>Los lugares de mi historia</h3>
          </div>
          <span>
            {period.year ?? `${period.decade}–${period.decade + 9}`} ·{" "}
            {memories.length} recuerdos
          </span>
        </div>
        <div className="personal-map">
          <MemoryMap
            memories={memories}
            selected={selected}
            onSelect={onSelect}
            picking={false}
            onPick={() => {}}
            draft={null}
            onCancel={() => {}}
          />
        </div>
        {selected && (
          <article className="personal-detail">
            <button
              className="icon-button"
              aria-label="Cerrar mi recuerdo"
              onClick={() => onSelect(null)}
            >
              <X size={18} />
            </button>
            <span className="eyebrow">
              {selected.year} / {selected.category}
            </span>
            <h3>{selected.title}</h3>
            <p className="personal-place">
              <MapPin size={14} />
              {selected.place}
            </p>
            <p>{selected.description}</p>
          </article>
        )}
      </section>
      <section className="personal-album">
        <div className="personal-section-title">
          <h3>Mi colección</h3>
          <span>Elegí un recuerdo para verlo en el mapa</span>
        </div>
        {memories.length ? (
          <div className="personal-grid">
            {memories.map((memory) => (
              <button
                key={memory.id}
                className="personal-memory"
                aria-pressed={selected?.id === memory.id}
                onClick={() => onSelect(memory)}
              >
                <span className="album-year">{memory.year}</span>
                <span className="eyebrow">{memory.category}</span>
                <strong>{memory.title}</strong>
                <small>
                  <MapPin size={13} />
                  {memory.place}
                </small>
              </button>
            ))}
          </div>
        ) : (
          <div className="personal-empty">
            <h3>
              {allMemories.length
                ? "No hay recuerdos tuyos con estos filtros"
                : "Tu primer recuerdo merece un lugar"}
            </h3>
            <p>
              {allMemories.length
                ? "Cambiá la época o la categoría para recorrer tu colección."
                : "Marcá un lugar en el mapa y contá qué viviste allí. Tus publicaciones aparecerán en este archivo."}
            </p>
            <button className="primary-button" onClick={onAdd}>
              Crear un recuerdo
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

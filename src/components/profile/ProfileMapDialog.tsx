import { Link2, MapPin, Send, Share2, X } from "lucide-react";
import { useState, type RefObject } from "react";
import type { Memory, Period } from "../../types";
import MemoryMap from "../MemoryMap";
import MemoryOwnerActions from "../MemoryOwnerActions";
import PostMedia, { PostMusic } from "../PostMedia";

export default function ProfileMapDialog({
  dialogRef,
  author,
  period,
  memories,
  selected,
  opened,
  closing,
  onSelect,
  onOpen,
  onEdit,
  onDelete,
  onClose,
}: {
  dialogRef: RefObject<HTMLDialogElement | null>;
  author?: string;
  period: Period;
  memories: Memory[];
  selected: Memory | null;
  opened: boolean;
  closing: boolean;
  onSelect: (memory: Memory | null) => void;
  onOpen?: (memory: Memory) => void;
  onEdit: (memory: Memory) => void;
  onDelete: (memory: Memory) => void;
  onClose: (after?: () => void) => void;
}) {
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const openFromMap = onOpen ? (memory: Memory) => onClose(() => onOpen(memory)) : undefined;

  return (
    <dialog
      ref={dialogRef}
      id="profile-map-dialog"
      className={`timeline-drawer profile-map-dialog${closing ? " is-closing" : ""}`}
      aria-labelledby="profile-map-dialog-title"
      onCancel={(event) => { event.preventDefault(); event.stopPropagation(); onClose(); }}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <header className="timeline-drawer-header">
        <div>
          <span className="eyebrow">UN VIAJE POR TUS LUGARES</span>
          <h2 id="profile-map-dialog-title">{author ? `El mapa de ${author}` : "Mi mapa de recuerdos"}</h2>
        </div>
        <button className="icon-button" aria-label="Cerrar mapa del perfil" onClick={() => onClose()}><X size={22} /></button>
      </header>
      <div className="profile-map-dialog-content">
        {opened && (
          <section className="personal-atlas">
            <div className="personal-section-title">
              <div>
                <span className="eyebrow">{author ? "GEOGRAFÍA DE RECUERDOS" : "MI GEOGRAFÍA DE RECUERDOS"}</span>
                <h3>{author ? `Los lugares de ${author}` : "Los lugares de mi historia"}</h3>
              </div>
              <span>Todas las épocas · {memories.length} recuerdos</span>
            </div>
            <div className="profile-atlas-workspace">
              <div className={period.decade === 1990 ? "profile-computer" : "profile-atlas-frame profile-era-device"}>
                {period.decade === 1990 && (
                  <div className="profile-computer-title"><span>▣ Mi PC — Mapa personal</span><small>Archivo de recuerdos</small></div>
                )}
                {period.decade !== 1990 && (
                  <div className="profile-device-top" aria-hidden="true">
                    <strong>{period.decade === 1970 ? "NOSTALGIAR · TELEVISIÓN" : period.decade === 1980 ? "MEMORY ARCADE" : "Nostalgiar · Digital Display"}</strong>
                    <small>{period.decade === 1980 ? "UN LUGAR · UNA HISTORIA" : "MAPA PERSONAL"}</small>
                  </div>
                )}
                <div className="profile-atlas-screen">
                  <div className="personal-map">
                    <MemoryMap
                      fitMemories
                      showRelations={false}
                      memories={memories}
                      selected={selected}
                      onSelect={onSelect}
                      onOpen={openFromMap}
                      picking={false}
                      onPick={() => {}}
                      draft={null}
                      onCancel={() => {}}
                    />
                  </div>
                </div>
                {period.decade !== 1990 && (
                  <div className="profile-device-bottom" aria-hidden="true">
                    <span className="profile-device-brand">NOSTALGIAR</span><span className="profile-device-grille" />
                    <span className="profile-device-knob" /><span className="profile-device-buttons"><i /><i /><i /></span>
                    <span className="profile-device-led" />
                  </div>
                )}
                {period.decade === 1990 && (
                  <div className="profile-computer-chin" aria-hidden="true">
                    <strong>NOSTALGIAR <small>PERSONAL COMPUTER</small></strong><span className="profile-computer-vents" /><i /><span>POWER</span>
                  </div>
                )}
              </div>
              <aside className="profile-map-list" aria-label="Recuerdos del mapa">
                <header><strong>{author ? "Sus recuerdos" : "Mis recuerdos"}</strong><small>{memories.length}</small></header>
                <div className="profile-map-items">
                  {memories.length ? [...memories].sort((a, b) => a.year - b.year).map((memory) => (
                    <div className="profile-map-row" key={memory.id} data-selected={selected?.id === memory.id}>
                      <button className="profile-map-select" aria-pressed={selected?.id === memory.id} onClick={() => onSelect(memory)}>
                        <span className="profile-map-year">{memory.year}</span>
                        <span><strong>{memory.title}</strong><small>{memory.place}</small></span>
                      </button>
                      {selected?.id === memory.id && (
                        <><p>{memory.description}</p>{onOpen && <button className="profile-map-open" onClick={() => openFromMap?.(memory)}>Ver publicación →</button>}</>
                      )}
                    </div>
                  )) : <p className="profile-map-empty">Los recuerdos publicados aparecerán acá.</p>}
                </div>
              </aside>
            </div>
            {selected && (
              <article className="personal-detail">
                <div className="personal-detail-actions">
                  <MemoryOwnerActions
                    memory={selected}
                    onEdit={(memory) => onClose(() => onEdit(memory))}
                    onDelete={(memory) => onClose(() => onDelete(memory))}
                  />
                  <div className="share-menu">
                    <button className="icon-button" aria-label="Compartir recuerdo" aria-expanded={shareOpen} onClick={() => setShareOpen((open) => !open)}>
                      <Share2 size={18} />
                    </button>
                    {shareOpen && (
                      <div className="share-menu-panel" role="menu">
                        <span>Compartir recuerdo</span>
                        <a target="_blank" rel="noreferrer"><Send size={15} /> WhatsApp</a>
                        <a target="_blank" rel="noreferrer"><Link2 size={15} /> Facebook</a>
                        <a target="_blank" rel="noreferrer"><span aria-hidden="true">𝕏</span> X</a>
                        <button onClick={async () => { await navigator.clipboard.writeText(window.location.href); setCopied(true); }}>
                          <Link2 size={15} />{copied ? "Enlace copiado" : "Copiar enlace"}
                        </button>
                      </div>
                    )}
                  </div>
                  <button className="icon-button" aria-label="Cerrar mi recuerdo" onClick={() => onSelect(null)}><X size={18} /></button>
                </div>
                <span className="eyebrow">{selected.year} / {selected.category}</span>
                <PostMusic key={`music-${selected.id}`} music={selected.music} />
                <h3>{selected.title}</h3>
                <p className="personal-place"><MapPin size={14} />{selected.place}</p>
                <p>{selected.description}</p>
                <PostMedia key={`media-${selected.id}`} memory={selected} />
              </article>
            )}
          </section>
        )}
      </div>
    </dialog>
  );
}

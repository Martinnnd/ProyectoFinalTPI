import PostMedia, { PostMusic } from "./PostMedia";
import type { ReactNode } from "react";
import { useMemo, useRef, useState } from "react";
import { Grid3x3, Link2, Lock, MapPin, Plus, Send, Share2, UserRound, X } from "lucide-react";
import MemoryMap from "./MemoryMap";
import { resolveAchievements } from "../data";
import type { Achievement, Memory, Period } from "../types";

export default function Profile({
  community,
  memories,
  allMemories,
  following,
  period,
  selected,
  earned,
  onSelect,
  onOpen,
  onAdd,
}: {
  community?: ReactNode;
  memories: Memory[];
  allMemories: Memory[];
  following: string[];
  period: Period;
  selected: Memory | null;
  earned: Achievement[];
  onOpen?: (memory: Memory) => void;
  onSelect: (memory: Memory | null) => void;
  onAdd: () => void;
}) {
  const [detailShareOpen, setDetailShareOpen] = useState(false);
  const [collectionShareOpen, setCollectionShareOpen] = useState<string | null>(null);
  const [copiedShare, setCopiedShare] = useState<string | null>(null);
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const catalogueDialog = useRef<HTMLDialogElement>(null);
  const catalogue = useMemo(() => resolveAchievements(earned), [earned]);
  const unlocked = catalogue.filter((achievement) => achievement.unlocked);
  function openCatalogue() {
    setAchievementsOpen(true);
    catalogueDialog.current?.showModal();
  }
  function closeCatalogue() {
    setAchievementsOpen(false);
    catalogueDialog.current?.close();
  }
  return (
    <main id="explore" className="personal-profile" aria-label="Mi perfil">
      
      <header className="personal-header">
        <div className="profile-portrait" aria-hidden="true">
          <img
            src="https://static.wikia.nocookie.net/universalstudios/images/1/10/Michael_J._Fox_as_Marty_McFly_%28BTTF%29.jpg/revision/latest?cb=20241030235532"
            alt="Marty McFly"
          />
        </div>
        <div className="personal-identity">
          <div className="personal-identity-text">
            <span className="eyebrow">MI ARCHIVO PERSONAL</span>
            <h2>Marty McFly</h2>
            <p>Los lugares cambian. Tus historias quedan.</p>
            <small className="profile-note">
              Errante
            </small>
          </div>
          <div className="achievements">
            <div className="achievements-heading">
              <h3>Logros</h3>
              <span className="achievements-count">
                {unlocked.length}/{catalogue.length}
              </span>
            </div>
            {unlocked.length ? (
              <ul className="achievement-rail">
                {unlocked.map((achievement) => (
                  <li key={achievement.id}>
                    <img
                      src={achievement.image}
                      alt={achievement.name}
                      title={achievement.name}
                      width={40}
                      height={40}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="achievements-empty">
                Todavía no conseguiste ninguna insignia.
              </p>
            )}
            <button
              className="achievements-browse"
              onClick={openCatalogue}
              aria-haspopup="dialog"
              aria-expanded={achievementsOpen}
            >
              <Grid3x3 size={14} />
              Ver todas
            </button>
          </div>
        </div>


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
            <dd>
              {new Set(allMemories.map((m) => `${m.lat},${m.lng}`)).size}
            </dd>
          </div>
        </dl>
      </header>
      {community}
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
            onOpen={onOpen}
            picking={false}
            onPick={() => { }}
            draft={null}
            onCancel={() => { }}
          />
        </div>
        {selected && (
          <article className="personal-detail">
            <div className="personal-detail-actions">
              <div className="share-menu">
                <button
                  className="icon-button"
                  aria-label="Compartir recuerdo"
                  aria-expanded={detailShareOpen}
                  onClick={() => setDetailShareOpen((open) => !open)}
                >
                  <Share2 size={18} />
                </button>

                {detailShareOpen && (
                  <div className="share-menu-panel" role="menu">
                    <span>Compartir recuerdo</span>

                    <a
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Send size={15} /> WhatsApp
                    </a>

                    <a
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Link2 size={15} /> Facebook
                    </a>

                    <a
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span aria-hidden="true">𝕏</span> X
                    </a>

                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(window.location.href);
                        setCopiedShare("detail");
                      }}
                    >
                      <Link2 size={15} />
                      {copiedShare === "detail" ? "Enlace copiado" : "Copiar enlace"}
                    </button>
                  </div>
                )}
              </div>

              <button
                className="icon-button"
                aria-label="Cerrar mi recuerdo"
                onClick={() => onSelect(null)}
              >
                <X size={18} />
              </button>
            </div>
            <span className="eyebrow">
              {selected.year} / {selected.category}
            </span>
            <PostMusic key={`music-${selected.id}`} music={selected.music}/>
            <h3>{selected.title}</h3>
            <p className="personal-place">
              <MapPin size={14} />
              {selected.place}
            </p>
            <p>{selected.description}</p>
            <PostMedia key={`media-${selected.id}`} memory={selected}/>
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
              <article
                key={memory.id}
                className="personal-memory"
                data-selected={selected?.id === memory.id}
              >
                <div className="memory-card-top">
                  <span className="album-year">{memory.year}</span>

                  <div className="share-menu">
                    <button
                      className="icon-button"
                      aria-label={`Compartir ${memory.title}`}
                      aria-expanded={collectionShareOpen === memory.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        setCollectionShareOpen((open) =>
                          open === memory.id ? null : memory.id
                        );
                      }}
                    >
                      <Share2 size={18} />
                    </button>

                    {collectionShareOpen === memory.id && (
                      <div
                        className="share-menu-panel"
                        role="menu"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <span>Compartir recuerdo</span>

                        <a
                        >
                          <Send size={15} /> WhatsApp
                        </a>

                        <a
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Link2 size={15} /> Facebook
                        </a>

                        <a
                          target="_blank"
                          rel="noreferrer"
                        >
                          <span aria-hidden="true">𝕏</span> X
                        </a>

                        <button
                          onClick={async (event) => {
                            event.stopPropagation();
                            await navigator.clipboard.writeText(window.location.href);
                            setCopiedShare(memory.id);
                          }}
                        >
                          <Link2 size={15} />
                          {copiedShare === memory.id
                            ? "Enlace copiado"
                            : "Copiar enlace"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <button className="personal-memory-open" aria-pressed={selected?.id === memory.id} onClick={() => onSelect(memory)}>
                <span className="eyebrow">{memory.category}</span>
                <strong>{memory.title}</strong>
                <small>
                  <MapPin size={13} />
                  {memory.place}
                </small>
                </button>
              </article>
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

      <dialog
        ref={catalogueDialog}
        className="achievement-dialog"
        onCancel={(event) => {
          event.preventDefault();
          closeCatalogue();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeCatalogue();
        }}
        aria-labelledby="achievements-title"
      >
        <header>
          <div>
            <h2 id="achievements-title">Todas las insignias</h2>
            <small>
              {unlocked.length} de {catalogue.length} conseguidas
            </small>
          </div>
          <button
            className="icon-button"
            onClick={closeCatalogue}
            aria-label="Cerrar catálogo de logros"
          >
            <X size={20} />
          </button>
        </header>
        <div className="achievement-dialog-content">
          <ul className="achievement-list">
            {catalogue.map((achievement) => (
              <li
                key={achievement.id}
                className={`achievement-card ${achievement.unlocked ? "is-unlocked" : "is-locked"
                  }`}
              >
                <span className="achievement-media">
                  <img
                    src={achievement.image}
                    alt=""
                    width={64}
                    height={64}
                    loading="lazy"
                  />
                  {!achievement.unlocked && (
                    <span className="achievement-lock">
                      <Lock size={14} />
                    </span>
                  )}
                </span>
                <span className="achievement-body">
                  <strong>{achievement.name}</strong>
                  <p>{achievement.description}</p>
                  <span className="achievement-state">
                    {achievement.unlocked ? "Conseguida" : "Bloqueada"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </dialog>
    </main>
  );
}

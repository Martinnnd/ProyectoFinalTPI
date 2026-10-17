import { Link2, MapPin, Repeat2, Send, Share2 } from "lucide-react";
import { forwardRef, useState } from "react";
import type { Memory } from "../../types";
import MemoryOwnerActions from "../MemoryOwnerActions";
import PostMedia, { PostMusic } from "../PostMedia";

const ProfilePosts = forwardRef<HTMLElement, {
  author?: string;
  username: string;
  memories: Memory[];
  selected: Memory | null;
  repostedPublicationIds: string[];
  onEdit: (memory: Memory) => void;
  onDelete: (memory: Memory) => void;
  onOpen?: (memory: Memory) => void;
  onSelectOnMap: (memory: Memory) => void;
  onAdd: () => void;
}>(function ProfilePosts({
  author,
  username,
  memories,
  selected,
  repostedPublicationIds,
  onEdit,
  onDelete,
  onOpen,
  onSelectOnMap,
  onAdd,
}, ref) {
  const [shareOpen, setShareOpen] = useState<string | null>(null);
  const [copiedShare, setCopiedShare] = useState<string | null>(null);
  const displayName = author ?? username;

  return (
    <section ref={ref} className="personal-album profile-posts">
      <div className="personal-section-title">
        <h3>{author ? `Recuerdos de ${author}` : "Mis recuerdos"}</h3>
        <span>Todas las épocas · Últimas publicaciones primero</span>
      </div>
      {memories.length ? (
        <div className="personal-grid profile-post-list">
          {[...memories].reverse().map((memory) => (
            <article
              key={memory.id}
              className="personal-memory profile-post"
              data-selected={selected?.id === memory.id}
            >
              {(memory.repost || repostedPublicationIds.includes(memory.id)) && (
                <div className="profile-repost-badge"><Repeat2 size={15} aria-hidden="true" /> Reposteado</div>
              )}
              <div className="memory-card-top">
                <div className="profile-post-author">
                  <span className="profile-post-avatar" aria-hidden="true">
                    {displayName.slice(0, 1).toUpperCase()}
                  </span>
                  <span>
                    <strong>{displayName}</strong>
                    <small>{memory.year} · {memory.category}</small>
                  </span>
                </div>
                <MemoryOwnerActions memory={memory} onEdit={onEdit} onDelete={onDelete} />
                <div className="share-menu">
                  <button
                    className="icon-button"
                    aria-label={`Compartir ${memory.title}`}
                    aria-expanded={shareOpen === memory.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      setShareOpen((open) => open === memory.id ? null : memory.id);
                    }}
                  >
                    <Share2 size={18} />
                  </button>
                  {shareOpen === memory.id && (
                    <div className="share-menu-panel" role="menu" onClick={(event) => event.stopPropagation()}>
                      <span>Compartir recuerdo</span>
                      <a><Send size={15} /> WhatsApp</a>
                      <a target="_blank" rel="noreferrer"><Link2 size={15} /> Facebook</a>
                      <a target="_blank" rel="noreferrer"><span aria-hidden="true">𝕏</span> X</a>
                      <button
                        onClick={async (event) => {
                          event.stopPropagation();
                          await navigator.clipboard.writeText(window.location.href);
                          setCopiedShare(memory.id);
                        }}
                      >
                        <Link2 size={15} />
                        {copiedShare === memory.id ? "Enlace copiado" : "Copiar enlace"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="profile-post-body">
                <h3>{memory.title}</h3>
                <p className="profile-post-location"><MapPin size={14} />{memory.place}</p>
                <p className="profile-post-story">{memory.description}</p>
                <PostMusic music={memory.music} />
                <PostMedia memory={memory} />
              </div>
              <footer className="profile-post-footer">
                {onOpen && <button onClick={() => onOpen(memory)}>Ver publicación</button>}
                <button onClick={() => onSelectOnMap(memory)}><MapPin size={16} />Ver en el mapa</button>
              </footer>
            </article>
          ))}
        </div>
      ) : (
        <div className="personal-empty">
          <h3>{author ? "Todavía no hay recuerdos publicados" : "Tu primer recuerdo merece un lugar"}</h3>
          <p>{author ? "Sus publicaciones aparecerán acá." : "Contá tu historia: cada recuerdo que publiques aparecerá acá, uno debajo del otro."}</p>
          {!author && <button className="primary-button" onClick={onAdd}>Crear un recuerdo</button>}
        </div>
      )}
    </section>
  );
});

export default ProfilePosts;


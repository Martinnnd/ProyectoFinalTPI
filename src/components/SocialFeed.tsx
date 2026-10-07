import MemoryOwnerActions from "./MemoryOwnerActions";
import { youtubeId } from "../media";
import PostMedia, { PostMusic } from "./PostMedia";
import type { ReactNode } from "react";
import { transitionFeed } from "../eras/shared/transitionFeed";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  Heart,
  MapPin,
  MessageCircle,
  Repeat2,
} from "lucide-react";
import type { Memory } from "../types";

function toggleId(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
}

const SCORES = [1, 2, 3, 4, 5] as const;

export default function SocialFeed({
  onEdit,
  onDelete,
  onProfile,
  groupIds,
  groupName,
  community,
  memories,
  decade,
  selected,
  onSelect,
  onMap,
  onAdd,
  following,
  onFollow,
}: {
  onEdit: (memory: Memory) => void;
  onDelete: (memory: Memory) => void;
  onProfile: (memory: Memory) => void;
  decade: number;
  following: string[];
  onFollow: (author: string) => void;
  groupIds: string[];
  groupName?: string;
  community?: ReactNode;
  memories: Memory[];
  selected: Memory | null;
  onSelect: (memory: Memory | null) => void;
  onMap: (memory: Memory) => void;
  onAdd: () => void;
}) {
  const desktopDetail = !!selected && (decade === 1990 || decade === 2000);
  const [maximized, setMaximized] = useState(false);
  const [likes, setLikes] = useState<string[]>([]);
  const [reposts, setReposts] = useState<string[]>([]);
  const [saves, setSaves] = useState<string[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string[]>>({});
  const [tab, setTab] = useState<"all" | "following" | "groups">("all");
  const openingRect = useRef<DOMRect | undefined>(undefined);
  const cancelTurn = useRef<() => void>(() => {});
  useEffect(() => () => cancelTurn.current(), []);
  const [comment, setComment] = useState("");
  const stream = useRef<HTMLDivElement>(null);
  const resultKey = memories.map((m) => m.id).join(",");
  useEffect(() => {
    if (stream.current) stream.current.scrollTop = 0;
    setComment("");
  }, [selected?.id, resultKey, tab]);
  const authors = [
    ...new Set(
      memories.filter((m) => m.source === "demo").map((m) => m.author),
    ),
  ];
  const posts =
    tab === "following"
      ? memories.filter((m) => following.includes(m.author))
      : tab === "groups" ? memories.filter(m => !!m.groupId && groupIds.includes(m.groupId)) : memories;
  function follow(author: string) {
    onFollow(author);
  }
  function rate(id: string, value: number) {
    setRatings((v) => {
      const next = { ...v };
      if (next[id] === value) delete next[id];
      else next[id] = value;
      return next;
    });
  }
  function open(memory: Memory | null) {
    if (memory?.id === selected?.id) return;
    setMaximized(false);
    cancelTurn.current();
    if (stream.current) {
      if (memory) openingRect.current = document.activeElement?.closest('.feed-post')?.getBoundingClientRect();
      cancelTurn.current = transitionFeed(stream.current, memory === null, openingRect.current);
    }
    setComment("");
    onSelect(memory);
  }
  return (
    <section className={`social-layout${desktopDetail && maximized ? " detail-maximized" : ""}`} aria-label="Feed de recuerdos">
      <div className={`social-stream${desktopDetail ? ` detail-mode transition-${decade === 1990 ? 'win95' : 'messenger'}` : ''}`} ref={stream}>
        <div className={desktopDetail ? 'transition-window detail-window' : undefined}>
        {desktopDetail && <>
          <div className="transition-title"><span className="transition-app-icon">{decade === 1990 ? '▣' : '♟'}</span><strong className="transition-caption">{decade === 1990 ? 'Recuerdo — Nostalgiar 95' : 'Nostalgiar Messenger'}</strong><div className="transition-window-controls">
            <button aria-label="Minimizar publicación" onClick={() => open(null)}>_</button>
            <button aria-label={maximized ? 'Restaurar ventana' : 'Maximizar ventana'} onClick={() => setMaximized(v => !v)}>□</button>
            <button aria-label="Cerrar publicación" onClick={() => open(null)}>×</button>
          </div></div>
          <div className="transition-menu">Archivo · Recuerdos · Conversación</div>
          {decade === 2000 && <><div className="transition-contact"><span className="transition-contact-avatar">{selected.author.slice(0,1)}</span><div className="transition-contact-name">{selected.author} — Conversación</div><small className="transition-contact-status">Recuerdo de {selected.year}</small></div><div className="transition-chat-tools">☺ Recuerdos compartidos · ♫ Nostalgiar</div></>}
        </>}
        <div className={desktopDetail ? 'transition-content' : undefined}>
        {!selected && community && <details className="feed-community" open={window.innerWidth >= 900 ? true : undefined}><summary>Buscar recuerdos y grupos</summary>{community}</details>}
        <header className="feed-heading">
          <h2>{groupName ?? "Feed"}</h2>
          <div className="feed-tabs" role="group" aria-label="Publicaciones">

            <button
              aria-pressed={tab === "all"}
              onClick={() => {
                setTab("all");
                open(null);
              }}
            >
              Para vos
            </button>
            <button
              aria-pressed={tab === "following"}
              onClick={() => {
                setTab("following");
                open(null);
              }}
            >
              Seguidos
            </button>
            <button aria-pressed={tab === "groups"} onClick={() => {setTab("groups");open(null);}}>Mis grupos</button>
          </div>
        </header>
        {selected && (
          <button className="feed-back" onClick={() => open(null)}>
            <ArrowLeft size={17} />
            Volver a feed
          </button>
        )}
        <div className="feed-posts">
          {(selected ? [selected] : posts).map((memory) => (
            <article className="feed-post" key={memory.id}>
              <header>
                <button className="social-avatar author-avatar" aria-label={`Ver perfil de ${memory.source === "local" ? "Vos" : memory.author}`} onClick={() => onProfile(memory)}>
                  {memory.author.slice(0, 1)}
                </button>
                <div>
                  <button className="author-name" onClick={() => onProfile(memory)}>
                    <strong>{memory.source === "local" ? "Vos" : memory.author}</strong>
                  </button>
                  <small>
                    {memory.source === "demo"
                      ? ""
                      : "Recuerdo local"}{" "}
                     {memory.year}
                  </small>
                </div>
                {memory.source === "demo" && (
                  <button
                    className="follow-button"
                    aria-pressed={following.includes(memory.author)}
                    onClick={() => follow(memory.author)}
                  >
                    {following.includes(memory.author) ? "Siguiendo" : "Seguir"}
                  </button>
                )}
                <MemoryOwnerActions memory={memory} onEdit={onEdit} onDelete={onDelete}/>
              </header>
              
              <PostMusic key={`music-${memory.id}`} music={memory.music}/>
              <button
                className={
                  memory.image && !memory.media && !youtubeId(memory.image)
                    ? `post-content with-image${selected ? " is-open" : ""}`
                    : "post-content"
                }
                onClick={() => open(memory)}
              >
                <span className="post-text">
                  <h3>{memory.title}</h3>
                  <p className={selected ? "" : "post-excerpt"}>
                    {memory.description}
                  </p>
                  {!selected && (
                    <span className="read-post">Leer recuerdo completo →</span>
                  )}
                </span>
                {memory.image && !memory.media && !youtubeId(memory.image) && (
                  <img
                    className="post-image"
                    src={memory.image}
                    alt={`Fotografía de ${memory.title} en ${memory.place}, ${memory.year}`}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.hidden = true;
                    }}
                  />
                )}
              </button>
              {(memory.media || (memory.image && youtubeId(memory.image))) && <PostMedia key={`media-${memory.id}`} memory={memory}/>}
              <button className="post-place" onClick={() => onMap(memory)}>
                <MapPin size={14} />
                {memory.place} · {memory.year}
              </button>
              <div
                className="post-ratings"
                role="group"
                aria-label={`Puntuar publicación: ${memory.title}`}
              >
                {SCORES.map((value) => (
                  <button
                    key={value}
                    aria-label={`Puntar ${value} de 5`}
                    aria-pressed={ratings[memory.id] === value}
                    onClick={() => rate(memory.id, value)}
                  >
                    {value}
                  </button>
                ))}
                <small className="post-rating-value">
                  {ratings[memory.id]
                    ? `Puntaje: ${ratings[memory.id]} de 5`
                    : "Sin puntuar"}
                </small>
              </div>
              <footer>
                <button
                  aria-label={`Me gusta: ${memory.title}`}
                  aria-pressed={likes.includes(memory.id)}
                  onClick={() => setLikes((v) => toggleId(v, memory.id))}
                >
                  <Heart
                    size={17}
                    fill={likes.includes(memory.id) ? "currentColor" : "none"}
                  />
                  {likes.includes(memory.id) ? "Te gusta" : "Me gusta"}
                </button>
                <button onClick={() => open(memory)}>
                  <MessageCircle size={17} />
                  {comments[memory.id]?.length || ""} Comentar
                </button>
                <button
                  aria-label={`Repostear: ${memory.title}`}
                  aria-pressed={reposts.includes(memory.id)}
                  onClick={() => setReposts((v) => toggleId(v, memory.id))}
                >
                  <Repeat2 size={17} />
                  {reposts.includes(memory.id) ? "Reposteado" : "Repostear"}
                </button>
                <button
                  aria-label={`Guardar: ${memory.title}`}
                  aria-pressed={saves.includes(memory.id)}
                  onClick={() => setSaves((v) => toggleId(v, memory.id))}
                >
                  <Bookmark
                    size={17}
                    fill={saves.includes(memory.id) ? "currentColor" : "none"}
                  />
                  {saves.includes(memory.id) ? "Guardado" : "Guardar"}
                </button>
              </footer>
              {selected && (
                <section className="post-comments" aria-label="Comentarios">
                  <h4>La conversación</h4>
                  {(comments[memory.id] ?? []).map((text, i) => (
                    <p key={i}>
                      <strong>Vos</strong>
                      <br />
                      {text}
                    </p>
                  ))}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!comment.trim()) return;
                      setComments((v) => ({
                        ...v,
                        [memory.id]: [...(v[memory.id] ?? []), comment.trim()],
                      }));
                      setComment("");
                    }}
                  >
                    <label className="sr-only" htmlFor="feed-comment">
                      Comentar el recuerdo
                    </label>
                    <textarea
                      id="feed-comment"
                      value={comment}
                      maxLength={1000}
                      required
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Comentá este recuerdo…"
                    />
                    <button className="primary-button" type="submit">
                      Comentar
                    </button>
                  </form>
                </section>
              )}
            </article>
          ))}
          {!selected && !posts.length && (
            <div className="feed-empty">
              <h3>
                {tab === "following"
                  ? "Todavía no hay publicaciones de tus seguidos"
                  : tab === "groups" ? "No hay publicaciones de tus grupos para esta época y categoría" : "No hay recuerdos con estos filtros"}
              </h3>
              <p>
                {
                  "Explorá otras épocas y categorías, o seguí a alguien desde Para vos."
                }
              </p>
            </div>
          )}
        </div>
        </div>
        {desktopDetail && <div className="transition-status">{decade === 1990 ? 'Listo · Mi PC · Archivo de recuerdos' : 'Nostalgiar Messenger · Conversación sobre este recuerdo'}</div>}
        </div>
      </div>
      <aside className="feed-sidebar">
        <button className="primary-button feed-add-memory" onClick={onAdd}><span aria-hidden="true">＋</span> Sumar mi recuerdo</button>
        <section>
          <h3>A quién seguir</h3>
          {authors.slice(0, 4).map((author) => (
            <div className="suggested-person" key={author}>
              <span className="social-avatar" aria-hidden="true">
                {author[0]}
              </span>
              <strong>{author}</strong>
              <button
                className="follow-button"
                aria-pressed={following.includes(author)}
                onClick={() => follow(author)}
              >
                {following.includes(author) ? "Siguiendo" : "Seguir"}
              </button>
            </div>
          ))}
          <small>Perfiles ficticios · demo local</small>
        </section>
      </aside>
    </section>
  );
}

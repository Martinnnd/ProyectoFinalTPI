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
  memories,
  selected,
  onSelect,
  onMap,
  onAdd,
  following,
  onFollow,
}: {
  following: string[];
  onFollow: (author: string) => void;
  memories: Memory[];
  selected: Memory | null;
  onSelect: (memory: Memory | null) => void;
  onMap: (memory: Memory) => void;
  onAdd: () => void;
}) {
  const [likes, setLikes] = useState<string[]>([]);
  const [reposts, setReposts] = useState<string[]>([]);
  const [saves, setSaves] = useState<string[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string[]>>({});
  const [tab, setTab] = useState<"all" | "following">("all");
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
      : memories;
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
    setComment("");
    onSelect(memory);
  }
  return (
    <section className="social-layout" aria-label="Feed de recuerdos">
      <div className="social-stream" ref={stream}>
        <header className="feed-heading">
          <h2>Feed</h2>
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
                <span className="social-avatar" aria-hidden="true">
                  {memory.author.slice(0, 1)}
                </span>
                <div>
                  <strong>
                    {memory.source === "local" ? "Vos" : memory.author}
                  </strong>
                  <small>
                    {memory.source === "demo"
                      ? "Relato ficticio de demostración"
                      : "Recuerdo local"}{" "}
                    · {memory.year}
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
              </header>
              <button
                className={
                  memory.image
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
                {memory.image && (
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
                  <small>
                    Comentarios, me gusta, repostes, guardados, puntajes y
                    seguidos son de esta sesión de demostración.
                  </small>
                </section>
              )}
            </article>
          ))}
          {!selected && !posts.length && (
            <div className="feed-empty">
              <h3>
                {tab === "following"
                  ? "Todavía no hay publicaciones de tus seguidos"
                  : "No hay recuerdos con estos filtros"}
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
      <aside className="feed-sidebar">
        <section>
          <span className="eyebrow">CADA LUGAR TIENE UNA HISTORIA</span>
          <h3>Volvé a esos días</h3>
          <p>Elegí una época, encontrá un lugar y compartí lo que viviste.</p>
          <button className="primary-button" onClick={onAdd}>
            Sumar mi recuerdo
          </button>
        </section>
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

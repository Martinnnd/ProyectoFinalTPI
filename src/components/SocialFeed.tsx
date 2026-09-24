import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Heart, MapPin, MessageCircle } from "lucide-react";
import type { Memory } from "../types";

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
              <button className="post-content" onClick={() => open(memory)}>
                <h3>{memory.title}</h3>
                <p className={selected ? "" : "post-excerpt"}>
                  {memory.description}
                </p>
                {!selected && (
                  <span className="read-post">Leer recuerdo completo →</span>
                )}
              </button>
              <button className="post-place" onClick={() => onMap(memory)}>
                <MapPin size={14} />
                {memory.place} · {memory.year}
              </button>
              <footer>
                <button
                  aria-label={`Me gusta: ${memory.title}`}
                  aria-pressed={likes.includes(memory.id)}
                  onClick={() =>
                    setLikes((v) =>
                      v.includes(memory.id)
                        ? v.filter((id) => id !== memory.id)
                        : [...v, memory.id],
                    )
                  }
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
                    Comentarios, me gusta y seguidos son de esta sesión de
                    demostración.
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

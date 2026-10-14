import type { ReactNode } from "react";

export default function FeedSidebar({
  community,
  trends,
  authors,
  following,
  onAdd,
  onFollow,
}: {
  community?: ReactNode;
  trends: ReactNode;
  authors: string[];
  following: string[];
  onAdd: () => void;
  onFollow: (author: string) => void;
}) {
  return (
    <aside className="feed-sidebar">
      <details className="feed-sidebar-content" open={window.innerWidth >= 900}>
        <summary>Tendencias, búsqueda y comunidad</summary>
        <button className="primary-button feed-add-memory" onClick={onAdd}>
          <span aria-hidden="true">＋</span> Sumar mi recuerdo
        </button>
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
                onClick={() => onFollow(author)}
              >
                {following.includes(author) ? "Siguiendo" : "Seguir"}
              </button>
            </div>
          ))}
          <small>Perfiles ficticios · demo local</small>
        </section>
        {trends}
        {community}
      </details>
    </aside>
  );
}

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
  authors: { name: string; id?: number }[];
  following: string[];
  onAdd: () => void;
  onFollow: (author: string, authorId?: number) => void;
}) {
  return (
    <aside className="feed-sidebar">
      <details className="feed-sidebar-content" open={window.innerWidth >= 900}>
        <summary>Tendencias, búsqueda y comunidad</summary>
        
        <section>
          <h3>A quién seguir</h3>
          {authors.slice(0, 4).map((author) => (
            <div className="suggested-person" key={author.name}>
              <span className="social-avatar" aria-hidden="true">
                {author.name[0]}
              </span>
              <strong>{author.name}</strong>
              <button
                className="follow-button"
                aria-pressed={following.includes(author.name)}
                onClick={() => onFollow(author.name, author.id)}
              >
                {following.includes(author.name) ? "Siguiendo" : "Seguir"}
              </button>
            </div>
          ))}
        </section>
        {trends}
        {community}
      </details>
    </aside>
  );
}

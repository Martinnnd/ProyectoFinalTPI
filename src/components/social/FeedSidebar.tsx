import type { ReactNode } from "react";
import { useState } from "react";

function avatarFor(name: string, id?: number) {
  const seed = id ?? [...name].reduce((sum, letter) => sum + letter.codePointAt(0)!, 0);
  return `/avatars/foto-${seed % 12 + 1}.jpg`;
}

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
  onFollow: (author: string, authorId?: number) => void | Promise<void>;
}) {
  const [leaving, setLeaving] = useState<string | null>(null);
  const suggestions = authors
    .filter((author) => !following.includes(author.name) || author.name === leaving)
    .slice(0, 4);

  async function followSuggestion(author: { name: string; id?: number }) {
    if (leaving) return;
    setLeaving(author.name);
    await Promise.all([
      Promise.resolve(onFollow(author.name, author.id)),
      new Promise<void>((resolve) => window.setTimeout(resolve, 240)),
    ]);
    setLeaving(null);
  }

  return (
    <aside className="feed-sidebar">
      <details className="feed-sidebar-content" open={typeof window !== "undefined" ? window.innerWidth >= 900 : true}>
        <summary>Tendencias, búsqueda y comunidad</summary>
        
        <section>
          <h3>A quién seguir</h3>
          {suggestions.map((author) => (
            <div className={`suggested-person${leaving === author.name ? " is-leaving" : ""}`} key={author.name}>
              <span className="social-avatar" aria-hidden="true">
                {author.name[0]}
                <img src={avatarFor(author.name, author.id)} alt="" onError={event => { event.currentTarget.hidden = true; }} />
              </span>
              <strong>{author.name}</strong>
              <button
                className="follow-button"
                disabled={leaving === author.name}
                onClick={() => void followSuggestion(author)}
              >
                Seguir
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

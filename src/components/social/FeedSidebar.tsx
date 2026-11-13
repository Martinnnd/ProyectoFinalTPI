import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";

import { getPerfilUsuario } from "../../userApi";

function SuggestedAvatar({ name }: { name: string }) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setPhotoUrl(null);
    setFailedUrl(null);
    getPerfilUsuario(name, controller.signal)
      .then((profile) => {
        if (!controller.signal.aborted) setPhotoUrl(profile.fotoPerfilUrl ?? null);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [name]);
  return (
    <>
      <span aria-hidden="true">{name[0]}</span>
      {photoUrl && photoUrl !== failedUrl && (
        <img src={photoUrl} alt="" onError={() => setFailedUrl(photoUrl)} />
      )}
    </>
  );
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
      <details
        className="feed-sidebar-content"
        open={typeof window !== "undefined" ? window.innerWidth >= 900 : true}
      >
        <summary>Tendencias, búsqueda y comunidad</summary>

        <section>
          <h3>A quién seguir</h3>
          {suggestions.map((author) => (
            <div
              className={`suggested-person${leaving === author.name ? " is-leaving" : ""}`}
              key={author.name}
            >
              <Link
                className="social-avatar"
                href={`/perfil/${encodeURIComponent(author.name)}`}
                aria-label={`Ver perfil de ${author.name}`}
              >
                <SuggestedAvatar name={author.name} />
              </Link>
              <Link
                className="suggested-person-name"
                href={`/perfil/${encodeURIComponent(author.name)}`}
              >
                <strong>{author.name}</strong>
              </Link>
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

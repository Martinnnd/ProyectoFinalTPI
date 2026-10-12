export default function FeedSidebar({
  authors,
  following,
  onAdd,
  onFollow,
}: {
  authors: string[];
  following: string[];
  onAdd: () => void;
  onFollow: (author: string) => void;
}) {
  return (
    <aside className="feed-sidebar">
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
    </aside>
  );
}

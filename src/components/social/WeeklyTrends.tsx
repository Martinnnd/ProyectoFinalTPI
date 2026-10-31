import { useEffect, useState } from "react";
import { Search, TrendingUp } from "lucide-react";
import { isHashtag, normalizeHashtag, type WeeklyTrend } from "../../hashtags";
import { searchHashtags } from "../../hashtagsApi";

export default function WeeklyTrends({
  trends,
  loading,
  error,
  onRetry,
  onSelect,
}: {
  trends: WeeklyTrend[];
  loading: boolean;
  error: string;
  onRetry: () => void;
  onSelect: (tag: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WeeklyTrend[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const normalized = normalizeHashtag(query);
  const hasQuery = isHashtag(normalized);

  useEffect(() => {
    if (!hasQuery) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setSearching(true);
      setSearchError("");
      searchHashtags(normalized, controller.signal)
        .then((items) => {
          if (!controller.signal.aborted) setResults(items);
        })
        .catch((cause) => {
          if (!controller.signal.aborted) setSearchError((cause as Error).message);
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false);
        });
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [hasQuery, normalized]);

  return (
    <section className="weekly-trends" aria-labelledby="weekly-trends-title">
      <div className="hashtag-search">
        <label htmlFor="hashtag-search-input">
          <Search size={15} aria-hidden="true" /> Buscar hashtags
        </label>
        <input
          id="hashtag-search-input"
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setResults([]);
            setSearchError("");
          }}
          placeholder="Ej: #amanecer"
          onKeyDown={(event) => {
            if (event.key === "Enter" && results.length && hasQuery) onSelect(results[0].tag);
          }}
        />
        {hasQuery && (
          <div className="hashtag-search-results" aria-live="polite">
            {searching ? (
              <p>Buscando hashtags…</p>
            ) : searchError ? (
              <p role="alert">{searchError}</p>
            ) : results.length ? (
              <ul>
                {results.map((item) => (
                  <li key={item.tag}>
                    <button type="button" onClick={() => onSelect(item.tag)}>
                      <strong>#{item.tag}</strong>
                      <small>
                        {item.count} {item.count === 1 ? "recuerdo" : "recuerdos"}
                      </small>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No encontramos hashtags con ese nombre.</p>
            )}
          </div>
        )}
      </div>
      <div className="trends-heading">
        <TrendingUp size={20} aria-hidden="true" />
        <div>
          <h3 id="weekly-trends-title">Trends semanales</h3>
          <p>Lo que estamos recordando juntos</p>
        </div>
        <span className="trends-period">Últimos 7 días</span>
      </div>
      <p className="trends-context">
        Según los recuerdos publicados por la comunidad en los últimos 7 días.
      </p>
      {loading ? (
        <p className="trends-empty">Cargando tendencias…</p>
      ) : error ? (
        <p className="trends-empty" role="alert">
          {error}{" "}
          <button type="button" onClick={onRetry}>
            Reintentar
          </button>
        </p>
      ) : trends.length ? (
        <ol className="trends-list">
          {trends.slice(0, 5).map((trend, index) => (
            <li key={trend.tag}>
              <button
                type="button"
                onClick={() => onSelect(trend.tag)}
                aria-label={`Ver recuerdos con #${trend.tag}`}
              >
                <span className="trend-rank">{String(index + 1).padStart(2, "0")}</span>
                <span className="trend-copy">
                  <strong>#{trend.tag}</strong>
                  <small>
                    {trend.count} {trend.count === 1 ? "recuerdo" : "recuerdos"} · {trend.authors}{" "}
                    {trend.authors === 1 ? "participante" : "participantes"}
                  </small>
                </span>
                <span aria-hidden="true">↗</span>
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="trends-empty">
          Todavía no hay hashtags publicados esta semana. ¡Agregá uno a tu próximo recuerdo!
        </p>
      )}
    </section>
  );
}

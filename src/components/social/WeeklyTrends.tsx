import { TrendingUp } from "lucide-react";
import type { WeeklyTrend } from "../../hashtags";

export default function WeeklyTrends({ trends, onSelect }: {
  trends: WeeklyTrend[];
  onSelect: (tag: string) => void;
}) {
  return (
    <section className="weekly-trends" aria-labelledby="weekly-trends-title">
      <div className="trends-heading">
        <TrendingUp size={20} aria-hidden="true" />
        <div><h3 id="weekly-trends-title">Trends semanales</h3><p>Lo que estamos recordando juntos</p></div>
        <span className="trends-period">Últimos 7 días</span>
      </div>
      <p className="trends-context">Según los filtros del feed. Incluye publicaciones de muestra.</p>
      {trends.length ? (
        <ol className="trends-list">
          {trends.slice(0, 5).map((trend, index) => (
            <li key={trend.tag}>
              <button onClick={() => onSelect(trend.tag)} aria-label={`Abrir hilo #${trend.tag}`}>
                <span className="trend-rank">{String(index + 1).padStart(2, "0")}</span>
                <span className="trend-copy"><strong>#{trend.tag}</strong><small>{trend.count} {trend.count === 1 ? "recuerdo" : "recuerdos"} · {trend.authors} {trend.authors === 1 ? "participante" : "participantes"}</small></span>
                <span aria-hidden="true">↗</span>
              </button>
            </li>
          ))}
        </ol>
      ) : <p className="trends-empty">Todavía no hay hashtags publicados esta semana con estos filtros. ¡Agregá uno a tu próximo recuerdo!</p>}
    </section>
  );
}

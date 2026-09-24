import { availableDecades, eraRegistry } from "../eras/registry";
import { Clock3 } from "lucide-react";
import type { Period } from "../types";
export default function Timeline({
  period,
  onChange,
}: {
  period: Period;
  onChange: (p: Period) => void;
}) {
  return (
    <section className="timeline" aria-label="Viajar en el tiempo">
      <Clock3 className="timeline-clock" size={19} />
      <details className="decade-menu compact-menu">
        <summary>
          {eraRegistry[period.decade].theme.shortLabel}
          <span aria-hidden="true">...</span>
          <span className="sr-only">Cambiar época</span>
        </summary>
        <div className="decades">
          {availableDecades.map((decade) => (
            <button
              key={decade}
              aria-label={`Década de ${decade}`}
              aria-pressed={period.decade === decade}
              className={period.decade === decade ? "active" : ""}
              onClick={(event) => {
                onChange({ decade, year: null });
                event.currentTarget.closest("details")?.removeAttribute("open");
              }}
            >
              {eraRegistry[decade].theme.shortLabel}
            </button>
          ))}
        </div>
      </details>
      <label className="year-picker">
        <span className="sr-only">Año del recuerdo</span>
        <select
          value={period.year ?? ""}
          onChange={(e) =>
            onChange({
              ...period,
              year: e.target.value ? Number(e.target.value) : null,
            })
          }
        >
          <option value="">Toda la década</option>
          {Array.from({ length: 10 }, (_, i) => period.decade + i).map(
            (year) => (
              <option key={year}>{year}</option>
            ),
          )}
        </select>
      </label>
    </section>
  );
}

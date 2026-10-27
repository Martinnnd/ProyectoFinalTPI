import { useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { availableDecades, eraRegistry } from "../eras/registry";
import type { Decade, Memory, Period } from "../types";

export default function EraTimeline({ period, onChange, action, memories }: {
  period: Period;
  onChange: (period: Period) => void;
  action: ReactNode;
  memories?: Memory[];
}) {
  const [preview, setPreview] = useState<number | null>(null);
  const year = preview ?? period.year ?? period.decade;
  const counts = useMemo(() => {
    const years = new Map<number, number>();
    const seen = new Set<string>();
    for (const memory of memories ?? []) {
      if (seen.has(memory.id) || !Number.isInteger(memory.year) || memory.year < 1970 || memory.year > 2019) continue;
      seen.add(memory.id);
      years.set(memory.year, (years.get(memory.year) ?? 0) + 1);
    }
    return years;
  }, [memories]);
  const countLabel = (count: number) => `${count} ${count === 1 ? 'recuerdo' : 'recuerdos'}`;
  function commit(value: number) {
    setPreview(null);
    onChange({ decade: Math.floor(value / 10) * 10 as Decade, year: value });
  }
  return (
    <header className="time-navigation" aria-label="Viajar en el tiempo">
      <div className="time-brand">
        <img src="/nostalgiar-rail-logo.png" alt="" width={50} height={42}/>
        <span>Nostalgiar</span>
      </div>
      <div className="time-scale">
        <div className="time-decades" role="group" aria-label="Elegir década">
          {availableDecades.map(decade => {
            const count = Array.from(counts).reduce((total, [year, value]) => total + (year >= decade && year < decade + 10 ? value : 0), 0);
            return <button key={decade} type="button"
            title={memories ? `${decade}–${decade + 9} · ${countLabel(count)} cargados` : `${decade}–${decade + 9}`}
            aria-label={memories ? `Década de ${decade}, ${countLabel(count)} cargados` : `Década de ${decade}`} aria-pressed={period.decade === decade}
            onClick={() => { setPreview(null); onChange({ decade, year: null }); }}>
            {eraRegistry[decade].theme.shortLabel}
          </button>;
          })}
        </div>
        <div className="time-track" style={{ '--time-progress': `${(year - 1970) / 49 * 100}%` } as CSSProperties}>
          {memories && <div className="time-memory-marks" aria-hidden="true">
            {Array.from(counts, ([memoryYear]) => <i key={memoryYear}
              style={{ left: `${(memoryYear - 1970) / 49 * 100}%` }}/>) }
          </div>}
          <input type="range" min={1970} max={2019} step={1} value={year}
            title={memories ? `${year} · ${countLabel(counts.get(year) ?? 0)} cargados` : String(year)}
            aria-label="Año en la línea de tiempo" aria-valuetext={memories ? `${year}, ${countLabel(counts.get(year) ?? 0)} cargados` : String(year)}
            onChange={event => setPreview(Number(event.currentTarget.value))}
            onPointerUp={event => commit(Number(event.currentTarget.value))}
            onPointerCancel={() => setPreview(null)}
            onKeyUp={event => { if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) commit(Number(event.currentTarget.value)); }}
            onBlur={() => { if (preview !== null) commit(preview); }}/>
        </div>
      </div>
      {action}
    </header>
  );
}

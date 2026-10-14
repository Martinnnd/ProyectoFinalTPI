import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { availableDecades, eraRegistry } from "../eras/registry";
import type { Decade, Period } from "../types";

export default function EraTimeline({ period, onChange, action }: {
  period: Period;
  onChange: (period: Period) => void;
  action: ReactNode;
}) {
  const [preview, setPreview] = useState<number | null>(null);
  const year = preview ?? period.year ?? period.decade;
  function commit(value: number) {
    setPreview(null);
    onChange({ decade: Math.floor(value / 10) * 10 as Decade, year: value });
  }
  return (
    <header className="time-navigation" aria-label="Viajar en el tiempo">
      <div className="time-brand">
        <img src="/nostalgiar-rail-logo.png" alt="" width={42} height={42}/>
        <span>Nostalgiar</span>
        <small>Tu viaje en el tiempo</small>
      </div>
      <div className="time-scale">
        <div className="time-decades" role="group" aria-label="Elegir década">
          {availableDecades.map(decade => <button key={decade} type="button"
            aria-label={`Década de ${decade}`} aria-pressed={period.decade === decade}
            onClick={() => { setPreview(null); onChange({ decade, year: null }); }}>
            {eraRegistry[decade].theme.shortLabel}<span>{decade} — {decade + 9}</span>
          </button>)}
        </div>
        <div className="time-track" style={{ '--time-progress': `${(year - 1970) / 39 * 100}%` } as CSSProperties}>
          <input type="range" min={1970} max={2009} step={1} value={year}
            aria-label="Año en la línea de tiempo" aria-valuetext={String(year)}
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

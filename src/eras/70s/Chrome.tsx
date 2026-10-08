import ActivityDock from "../shared/ActivityDock";
import { Tv } from 'lucide-react';
import type { ChromeProps } from '../contracts';
import { theme } from './theme';
export default function Chrome({ period, count, ...activities }: ChromeProps) {
  const label = period.year ?? `${period.decade}-${period.decade + 9}`;
  return <div className="era-chrome"><div className="newspaper-edition"><span>EL DIARIO DE NUESTROS RECUERDOS</span><span>EDICIÓN ARGENTINA · {label}</span></div><div className="era-shell-top"><span className="shell-caption"><Tv size={14}/>{theme.windowTitle}</span><span>VHF / {label}</span></div><div className="era-atmosphere" aria-hidden="true"/><aside className="tv-console" aria-label="Controles del televisor"><span className="tv-maker">NOSTALGIAR</span><span className="tv-model">SOLID STATE / 1970</span><div className="tv-dial" aria-hidden="true"><span>70</span></div><small>VHF / SINTONÍA</small><div className="tv-dial tv-volume" aria-hidden="true"><span>VOL</span></div><small>SONIDO</small><div className="tv-speaker" aria-hidden="true"/><span className="tv-power">● ENCENDIDO</span></aside><ActivityDock {...activities} title="GUÍA DE PROGRAMAS"/><footer className="press-footer"><span>TELEVISIÓN EN BLANCO Y NEGRO</span><span>{count} recuerdos / {label}</span><span>SEÑAL ARGENTINA</span></footer></div>;
}
  
import { Tv } from 'lucide-react';
import type { ChromeProps } from '../contracts';
import { theme } from './theme';
export default function Chrome({ period, count, onNavigate }: ChromeProps) {
  const label = period.year ?? `${period.decade}-${period.decade + 9}`;
  return <div className="era-chrome"><div className="era-shell-top"><span className="shell-caption"><Tv size={14}/>{theme.windowTitle}</span><span>VHF / {label}</span></div><div className="era-atmosphere" aria-hidden="true"/><aside className="tv-console" aria-label="Controles del televisor"><span className="tv-maker">NOSTALGIA</span><span className="tv-model">SOLID STATE / 1970</span><button className="tv-dial" onClick={() => onNavigate('facts')} aria-label="Sintonizar datos de la época"><span>70</span></button><small>VHF / SINTONÍA</small><button className="tv-dial tv-volume" onClick={() => onNavigate('music')} aria-label="Abrir sonido del televisor"><span>VOL</span></button><small>SONIDO</small><div className="tv-speaker" aria-hidden="true"/><span className="tv-power">● ENCENDIDO</span></aside><footer className="press-footer"><span>TELEVISIÓN EN BLANCO Y NEGRO</span><span>{count} recuerdos / {label}</span><span>SEÑAL ARGENTINA</span></footer></div>;
}

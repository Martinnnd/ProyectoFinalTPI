import ActivityDock from "../shared/ActivityDock";
import { Tv } from 'lucide-react';
import type { ChromeProps } from '../contracts';
import { theme } from './theme';
export default function Chrome({ period, count, ...activities }: ChromeProps) {
  const label = period.year ?? `${period.decade}-${period.decade + 9}`;
  return <div className="era-chrome"><div className="newspaper-edition"><span>EL DIARIO DE NUESTROS RECUERDOS</span><span>EDICIÓN ARGENTINA · {label}</span></div><div className="era-shell-top"><span className="shell-caption"><Tv size={14}/>{theme.windowTitle}</span><span>VHF / {label}</span></div><div className="era-atmosphere" aria-hidden="true"/><ActivityDock {...activities} title="GUÍA DE PROGRAMAS"/><div className="tv-chat-tray" id="chat-taskbar-slot" /></div>;
}
  
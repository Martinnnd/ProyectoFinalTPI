import { BookOpen, Camera, MapPin, Music2 } from "lucide-react";
import type { ChromeProps, Destination } from "../contracts";

const items = [
  { destination: "stories", label: "Historias", Icon: Camera },
  { destination: "facts", label: "La época", Icon: BookOpen },
  { destination: "music", label: "Música", Icon: Music2 },
] as const;

export default function Chrome({ panelOpen, factsOpen, musicOpen, onNavigate }: ChromeProps) {
  const active: Record<Destination, boolean> = { map: !panelOpen && !factsOpen, stories: panelOpen, facts: !!factsOpen, music: musicOpen };
  return <div className="era-chrome pocket-chrome">
    <footer className="system-taskbar" aria-label="Barra de secciones">
      <button type="button" className={active.map ? "task-active" : ""} aria-label="Mapa" aria-pressed={active.map} onClick={() => onNavigate("map")}><MapPin size={17}/> Mapa</button>
      {items.map(({ destination, label, Icon }) => <button key={destination} type="button" className={active[destination] ? "task-active" : ""} aria-expanded={active[destination]} onClick={() => onNavigate(destination)}><Icon size={17}/> {label}</button>)}
      <div className="system-tray" id="chat-taskbar-slot"/>
    </footer>
  </div>;
}

import { BookOpen, Clapperboard, MapPin, Music2 } from "lucide-react";
import type { ChromeProps, Destination } from "../contracts";

const items = [
  { destination: "map", label: "Mapa", Icon: MapPin },
  { destination: "stories", label: "Momentos", Icon: Clapperboard },
  { destination: "facts", label: "Tendencias", Icon: BookOpen },
  { destination: "music", label: "Música", Icon: Music2 },
] as const;

export default function Chrome({ panelOpen, factsOpen, musicOpen, onNavigate }: ChromeProps) {
  const active: Record<Destination, boolean> = {
    map: !panelOpen && !factsOpen,
    stories: panelOpen,
    facts: !!factsOpen,
    music: musicOpen,
  };
  return (
    <div className="era-chrome now-chrome">
      <footer className="system-taskbar" aria-label="Barra de secciones">
        {items.map(({ destination, label, Icon }) => (
          <button
            key={destination}
            type="button"
            className={active[destination] ? "task-active" : ""}
            aria-pressed={active[destination]}
            aria-label={label}
            onClick={() => onNavigate(destination)}
          >
            <Icon size={19} strokeWidth={active[destination] ? 2.3 : 1.8} />
            <span>{label}</span>
          </button>
        ))}
        <div className="system-tray" id="chat-taskbar-slot" />
      </footer>
    </div>
  );
}

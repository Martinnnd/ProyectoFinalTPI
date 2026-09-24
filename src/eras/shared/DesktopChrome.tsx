import { useEffect, useRef } from "react";
import { FolderOpen, Map, Music2 } from "lucide-react";
import type {
  ChromeProps,
  Destination,
  EraModule,
  EraTheme,
} from "../contracts";

interface Props extends ChromeProps {
  theme: EraTheme;
  icons: EraModule["icons"];
  startLabel: string;
  storiesLabel: string;
  menuTitle: string;
}
export default function DesktopChrome({
  period,
  count,
  panelOpen,
  musicOpen,
  onNavigate,
  theme,
  icons,
  startLabel,
  storiesLabel,
  menuTitle,
}: Props) {
  const menu = useRef<HTMLDivElement>(null);
  useEffect(() => {
    menu.current?.hidePopover();
  }, [period.decade]);
  const periodLabel = period.year ?? `${period.decade}–${period.decade + 9}`;
  const MapIcon = icons.map;
  function navigate(destination: Destination) {
    menu.current?.hidePopover();
    onNavigate(destination);
  }
  return (
    <div className="era-chrome">
      <div className="era-shell-top">
        <span className="shell-caption">
          <MapIcon size={14} />
          {theme.windowTitle}
        </span>
        <div className="shell-actions">
          <button
            onClick={() => navigate("facts")}
            aria-label="Abrir datos desde la barra de título"
            title="Datos de época"
          >
            ?
          </button>
          <button
            onClick={() => navigate("map")}
            aria-label="Minimizar paneles y ver el mapa"
            title="Minimizar paneles"
          >
            _
          </button>
        </div>
      </div>
      <footer className="system-taskbar" aria-label="Barra de tareas">
        <button className="start-button" popoverTarget="era-start-menu">
          <span className="system-logo" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          {startLabel}
        </button>
        <span className="taskbar-separator" />
        <button
          className={!panelOpen ? "task-active" : ""}
          onClick={() => navigate("map")}
        >
          <Map size={14} />
          Argentina
        </button>
        <button
          className={panelOpen ? "task-active" : ""}
          onClick={() => navigate("stories")}
        >
          <FolderOpen size={15} />
          {storiesLabel}
        </button>
        <button
          className={musicOpen ? "task-active" : ""}
          onClick={() => navigate("music")}
        >
          <Music2 size={14} />
          Mi música
        </button>
        <span className="system-tray">
          <span className="connection-dot" />
          {count} recuerdos<span className="tray-year">{periodLabel}</span>
        </span>
      </footer>
      <div
        ref={menu}
        popover="auto"
        id="era-start-menu"
        className={`start-menu start-menu-${period.decade}`}
      >
        <div className="start-menu-brand">
          {menuTitle}
          <small>Tu memoria tiene un lugar.</small>
        </div>
        <nav aria-label="Menú de inicio">
          {(
            [
              ["map", "Explorar Argentina"],
              ["stories", "Abrir mis recuerdos"],
              ["facts", "Descubrir la época"],
              ["music", "Escuchar mi música"],
            ] as const
          ).map(([destination, title]) => {
            const Icon = icons[destination];
            return (
              <button key={destination} onClick={() => navigate(destination)}>
                <Icon size={21} />
                <span>{title}</span>
              </button>
            );
          })}
        </nav>
        <div className="start-menu-footer">UNLaM · Demo local</div>
      </div>
    </div>
  );
}

import { BookOpen, Music2, Newspaper } from "lucide-react";
import type { ChromeProps } from "../contracts";
export default function ActivityDock({panelOpen, factsOpen, musicOpen, onNavigate, title}: Pick<ChromeProps,"panelOpen"|"factsOpen"|"musicOpen"|"onNavigate"> & {title:string}) {
  return <nav className="era-activity-dock" aria-label="Actividades de la época">
    <div className="activity-dock-heading"><span aria-hidden="true">●</span> {title}<small>Elegí una opción</small></div>
    <div className="activity-dock-options">
      <button aria-expanded={panelOpen} aria-controls="stories" onClick={() => onNavigate("stories")}><Newspaper size={21}/><span><strong>Historias</strong><small>Recorrer recuerdos</small></span></button>
      <button aria-expanded={!!factsOpen} aria-controls="era-facts" onClick={() => onNavigate("facts")}><BookOpen size={21}/><span><strong>La época</strong><small>Efemérides y cultura</small></span></button>
      <button aria-expanded={musicOpen} aria-controls="music-player" onClick={() => onNavigate("music")}><Music2 size={21}/><span><strong>Música</strong><small>Abrir reproductor</small></span></button>
    </div>
  </nav>;
}

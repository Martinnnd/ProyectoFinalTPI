import {
  ChevronDown,
  Disc3,
  ExternalLink,
  Headphones,
  SkipBack,
  SkipForward,
} from "lucide-react";
import type { PlayerFrameProps } from "../contracts";
export default function PlayerFrame({
  decade,
  expanded,
  track,
  failed,
  onToggle,
  onPrevious,
  onNext,
  onError,
  title,
  label,
  children,
}: PlayerFrameProps) {
  return (
    <section
      className={`music-card device-${decade} ${expanded ? "expanded" : ""}`}
      aria-label="Música de la época"
      id="music-player"
    >
      {expanded && (
        <div className="music-expanded">
          <div className="music-heading">
            <span className="eyebrow">{title}</span>
            <button
              className="icon-button"
              onClick={onToggle}
              aria-label="Cerrar reproductor y detener música"
            >
              <ChevronDown size={18} />
            </button>
          </div>
          <iframe
            key={track.spotifyId}
            className="spotify-player"
            title={`Escuchar ${track.title} de ${track.artist} en Spotify`}
            src={`https://open.spotify.com/embed/track/${track.spotifyId}?utm_source=generator&theme=0`}
            width="100%"
            height="152"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            onError={() => onError()}
          />
          <div className="music-provider-note">
            <span>
              {failed
                ? "No pudimos cargar Spotify. Abrí el tema con el enlace."
                : "Dale play en Spotify. Puede reproducir una vista previa según tu sesión y disponibilidad."}
            </span>
            <a href={track.reference} target="_blank" rel="noreferrer">
              Abrir Spotify <ExternalLink size={12} />
            </a>
          </div>
        </div>
      )}
      <div className="device-body">
        <div className="device-illustration" aria-hidden="true">
          {children}
        </div>
        <div className="music-compact">
          <div className="record-art" aria-hidden="true">
            <Disc3 size={32} />
          </div>
          <button
            className="track-open"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-label={
              expanded ? "Ocultar reproductor" : `Escuchar ${track.title}`
            }
          >
            <span className="eyebrow">
              {label} · {track.year}
            </span>
            <strong>{track.title}</strong>
            <small>{track.artist}</small>
          </button>
          <div className="music-buttons">
            <button
              className="icon-button"
              aria-label="Pista anterior"
              onClick={() => onPrevious()}
            >
              <SkipBack size={15} />
            </button>
            <button
              className="icon-button"
              aria-label="Pista siguiente"
              onClick={() => onNext()}
            >
              <SkipForward size={15} />
            </button>
            <button
              className="listen-button"
              onClick={onToggle}
              aria-label={
                expanded
                  ? "Ocultar música y detener reproducción"
                  : "Abrir reproductor"
              }
            >
              <Headphones size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

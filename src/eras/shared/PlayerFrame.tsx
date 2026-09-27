import SpotifyEmbed from './SpotifyEmbed';
import { useEffect, useRef, useState } from 'react';
import { deviceSound } from './deviceSound';
import SongPicker from './SongPicker';
import { ChevronDown, Disc3, ExternalLink, Headphones, SkipBack, SkipForward } from 'lucide-react';
import type { PlayerFrameProps } from '../contracts';
export default function PlayerFrame({ decade, expanded, track, failed, onToggle, onPrevious, onNext, title, label, pickerTitle, tracks, onSelect, children }: PlayerFrameProps) {
  const [playing, setPlaying] = useState(false);
  const [changing, setChanging] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [muted, setMuted] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  function animate() {
    clearTimeout(timer.current);
    setChanging(true);
    if (!muted) deviceSound(decade);
    timer.current = setTimeout(() => setChanging(false), 1800);
  }
  function select(index: number) { onSelect(index); animate(); }
  return <section className={`music-card device-${decade} ${expanded ? 'expanded' : ''} ${changing ? 'device-changing' : ''} ${dragging ? 'device-dragging' : ''} ${playing && expanded ? 'device-playing' : ''}`} aria-label="Música de la época" id="music-player" onDragStart={() => setDragging(true)} onDragEnd={() => setDragging(false)}>
    <span className="device-change-status" role="status">{changing ? 'Tema cargado · animación de cambio' : ''}</span>
    {expanded && <div className="music-expanded"><div className="music-heading"><span className="eyebrow">{title}</span><button className="icon-button" onClick={onToggle} aria-label="Cerrar reproductor y detener música"><ChevronDown size={18}/></button></div>
      <SpotifyEmbed key={track.spotifyId} id={track.spotifyId} title={`Escuchar ${track.title} de ${track.artist} en Spotify`} onPlaying={setPlaying}/>
      <div className="music-provider-note"><span>{failed ? 'No pudimos cargar Spotify. Abrí el tema con el enlace.' : 'Dale play en Spotify. Puede reproducir una vista previa según tu sesión y disponibilidad.'}</span><a href={track.reference} target="_blank" rel="noreferrer">Abrir Spotify <ExternalLink size={12}/></a></div></div>}
    <div className="device-body" onDragOver={event => { if (event.dataTransfer.types.includes('application/x-nostalgia-track')) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; } }} onDrop={event => {
      const id = event.dataTransfer.getData('application/x-nostalgia-track');
      const index = tracks.findIndex(item => item.spotifyId === id);
      if (index < 0) return;
      event.preventDefault(); select(index); setDragging(false);
      event.currentTarget.closest('section')?.querySelector('dialog')?.close();
    }}><div className="device-illustration" aria-hidden="true">{children}<div className="device-visualizer"><i/><i/><i/><i/><i/></div></div><div className="music-compact"><div className="record-art" aria-hidden="true"><Disc3 size={32}/></div><button className="track-open" onClick={onToggle} aria-expanded={expanded} aria-label={expanded ? 'Ocultar reproductor' : `Escuchar ${track.title}`}><span className="eyebrow">{label} · {track.year}</span><strong>{track.title}</strong><small>{track.artist}</small></button><div className="music-buttons"><button className="icon-button" aria-label="Pista anterior" onClick={() => { onPrevious(); animate(); }}><SkipBack size={15}/></button><button className="icon-button" aria-label="Pista siguiente" onClick={() => { onNext(); animate(); }}><SkipForward size={15}/></button><button className="listen-button" onClick={onToggle} aria-label={expanded ? 'Ocultar música y detener reproducción' : 'Abrir reproductor'}><Headphones size={18}/></button></div></div></div>
    <SongPicker title={pickerTitle} tracks={tracks} track={track} onSelect={select}/>
    {(decade === 1980 || decade === 1990) && <button className="device-sound-toggle" aria-pressed={!muted} onClick={() => setMuted(value => !value)}>Efectos de sonido: {muted ? 'no' : 'sí'}</button>}
  </section>;
}

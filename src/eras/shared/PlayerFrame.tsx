import { useEffect, useId, useRef, useState } from 'react';
import { deviceSound } from './deviceSound';
import SongPicker from './SongPicker';
import { CassetteTape, Disc3, Music2, Pause, Play, Radio, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import type { PlayerFrameProps } from '../contracts';

export default function PlayerFrame({ decade, expanded, onToggle, track, failed, onError, onPrevious, onNext, label, pickerTitle, tracks, onSelect, children }: PlayerFrameProps) {
  const [playing, setPlaying] = useState(false);
  const [changing, setChanging] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [volumeOpen, setVolumeOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const volumeId = useId();
  const volumeControl = useRef<HTMLDivElement>(null);
  const mobileVolumeControl = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const audio = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const element = audio.current;
    return () => {
      if (!element) return;
      element.pause(); element.removeAttribute('src'); element.load();
    };
  }, [track.audioSrc]);
  useEffect(() => { if (audio.current) audio.current.volume = volume; }, [volume, track.audioSrc]);
  useEffect(() => {
    if (!expanded) setVolumeOpen(false);
  }, [expanded]);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!volumeOpen) return;
    const close = (event: PointerEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent) { if (event.key === 'Escape') { event.stopPropagation(); setVolumeOpen(false); } }
      else if (!volumeControl.current?.contains(event.target as Node) && !mobileVolumeControl.current?.contains(event.target as Node)) setVolumeOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', close); };
  }, [volumeOpen]);
  async function togglePlayback() {
    const element = audio.current;
    if (!element) return;
    if (!element.paused) element.pause();
    else { try { await element.play(); } catch { setPlaying(false); onError(); } }
  }
  function animate() {
    clearTimeout(timer.current); setChanging(true);
    if (!muted) deviceSound(decade);
    timer.current = setTimeout(() => setChanging(false), 1800);
  }
  function select(index: number) { onSelect(index); animate(); }
  const seek = (className: string) => <div className={className}>
    <span>{Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')}</span>
    <input type="range" min={0} max={duration || 1} step="0.1" value={Math.min(currentTime, duration || 1)} aria-label="Posición de la canción" onChange={event => {
      if (audio.current && duration) {
        audio.current.currentTime = Number(event.currentTarget.value);
        setCurrentTime(audio.current.currentTime);
      }
    }}/>
    <span>-{Math.floor(Math.max(0, duration - currentTime) / 60)}:{String(Math.floor(Math.max(0, duration - currentTime) % 60)).padStart(2, '0')}</span>
  </div>;
  return <section className={`music-card device-${decade} ${expanded ? 'player-visible' : 'player-hidden'} ${changing ? 'device-changing' : ''} ${dragging ? 'device-dragging' : ''} ${playing ? 'device-playing' : ''}`} aria-label="Música de la época" id="music-player" onDragStart={() => setDragging(true)} onDragEnd={() => setDragging(false)}>
    <span className="device-change-status" role="status">{changing ? 'Tema cargado · animación de cambio' : ''}</span>
    <div className="mobile-player-heading"><button type="button" onClick={onToggle} aria-label="Minimizar reproductor">Minimizar</button></div>
    <audio ref={audio} key={track.audioSrc} hidden preload="metadata" src={track.audioSrc} autoPlay={playing} onLoadedMetadata={event => { setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0); setCurrentTime(0); }} onTimeUpdate={event => setCurrentTime(event.currentTarget.currentTime)} onPlay={() => setPlaying(true)} onPause={event => { if (audio.current === event.currentTarget) setPlaying(false); }} onEnded={() => { setPlaying(true); onNext(); }} onError={() => { setPlaying(false); onError(); }}/>
    {failed && <p className="music-playback-error" role="alert">No se pudo reproducir este tema. Probá otra canción.</p>}
    <div className="device-body" onDragOver={event => { if (event.dataTransfer.types.includes('application/x-nostalgia-track')) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; } }} onDrop={event => {
      const index = tracks.findIndex(item => item.spotifyId === event.dataTransfer.getData('application/x-nostalgia-track'));
      if (index < 0) return;
      event.preventDefault(); select(index); setDragging(false);
      event.currentTarget.closest('section')?.querySelector('dialog')?.close();
    }}>
      <div className="device-illustration" aria-hidden="true">{children}<div className="device-visualizer"><i/><i/><i/><i/><i/></div></div>
      <div className="music-compact">
        <div className="record-art" aria-hidden="true"><Disc3 size={32}/></div>
        <button className="track-open" onClick={() => void togglePlayback()} aria-label={`${playing ? 'Pausar' : 'Reproducir'} ${track.title}`}><span className="eyebrow">{label} · {track.year}</span><strong>{track.title}</strong><small>{track.artist}</small></button>
        {decade === 2010 && seek('pocket-seek')}
        <div className="music-buttons">
          <button className="icon-button" aria-label="Pista anterior" onClick={() => { onPrevious(); animate(); }}><SkipBack size={15}/></button>
          <button className="icon-button" aria-label={playing ? 'Pausar música' : 'Reproducir música'} onClick={() => void togglePlayback()}>{playing ? <Pause size={15}/> : <Play size={15}/>}</button>
          <button className="icon-button" aria-label="Pista siguiente" onClick={() => { onNext(); animate(); }}><SkipForward size={15}/></button>
          <div className="music-volume-control" ref={volumeControl}>
            <button className="icon-button" aria-label="Volumen" aria-expanded={volumeOpen} aria-controls={volumeId} onClick={() => setVolumeOpen(open => !open)}>{volume === 0 ? <VolumeX size={15}/> : <Volume2 size={15}/>}</button>
            {volumeOpen && <div className="music-volume-panel" id={volumeId}><label htmlFor={`${volumeId}-slider`}>Volumen {Math.round(volume * 100)}%</label><input id={`${volumeId}-slider`} type="range" min="0" max="1" step="0.01" value={volume} onChange={event => setVolume(Number(event.target.value))}/></div>}
          </div>
        </div>
      </div>
      {decade !== 2010 && seek('device-seek')}
    </div>
    <div className="mobile-player-mini">
      <div className="mobile-mini-track"><span className="mobile-mini-art" aria-hidden="true">{decade === 1970 ? <Disc3 size={23}/> : decade === 1980 ? <CassetteTape size={23}/> : decade === 1990 ? <Radio size={23}/> : <Music2 size={23}/>}</span><div><small>{label} · {track.year}</small><strong>{track.title}</strong><span>{track.artist}</span></div></div>
      {seek('mobile-mini-seek')}
      <div className="mobile-mini-controls">
        <button className="icon-button" aria-label="Pista anterior" onClick={() => { onPrevious(); animate(); }}><SkipBack size={18}/></button>
        <button className="icon-button mobile-mini-play" aria-label={playing ? 'Pausar música' : 'Reproducir música'} onClick={() => void togglePlayback()}>{playing ? <Pause size={19}/> : <Play size={19}/>}</button>
        <button className="icon-button" aria-label="Pista siguiente" onClick={() => { onNext(); animate(); }}><SkipForward size={18}/></button>
        <div className="mobile-mini-volume" ref={mobileVolumeControl}>
          <button className="icon-button" aria-label="Volumen" aria-expanded={volumeOpen} aria-controls={`${volumeId}-mobile`} onClick={() => setVolumeOpen(open => !open)}>{volume === 0 ? <VolumeX size={18}/> : <Volume2 size={18}/>}</button>
          {volumeOpen && <div className="music-volume-panel" id={`${volumeId}-mobile`}><label htmlFor={`${volumeId}-mobile-slider`}>Volumen {Math.round(volume * 100)}%</label><input id={`${volumeId}-mobile-slider`} type="range" min="0" max="1" step="0.01" value={volume} onChange={event => setVolume(Number(event.target.value))}/></div>}
        </div>
        <SongPicker title={pickerTitle} tracks={tracks} track={track} onSelect={select} compact />
      </div>
    </div>
    <SongPicker title={pickerTitle} tracks={tracks} track={track} onSelect={select}/>
    {(decade === 1980 || decade === 1990) && <button className="device-sound-toggle" aria-pressed={!muted} onClick={() => setMuted(value => !value)}>Efectos de sonido: {muted ? 'no' : 'sí'}</button>}
  </section>;
}

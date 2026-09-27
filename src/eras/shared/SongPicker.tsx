import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronRight, ListMusic, X } from 'lucide-react';
import type { MusicTrack } from '../contracts';

export default function SongPicker({ title, tracks, track, onSelect }: {
  title: string; tracks: MusicTrack[]; track: MusicTrack; onSelect: (index: number) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) {
      if (!dialog.current?.contains(event.target as Node) && !trigger.current?.contains(event.target as Node)) dialog.current?.close();
    }
    function escape(event: KeyboardEvent) { if (event.key === 'Escape') { dialog.current?.close(); trigger.current?.focus(); } }
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);
  function show() {
    const panel = dialog.current;
    if (!panel) return;
    if (window.innerWidth > 900) panel.show(); else panel.showModal();
    const bounds = trigger.current!.closest('.music-card')!.getBoundingClientRect();
    const width = panel.getBoundingClientRect().width;
    const height = panel.getBoundingClientRect().height;
    panel.style.left = `${window.innerWidth > 900 && bounds.right + width + 24 < window.innerWidth ? bounds.right + 12 : (window.innerWidth - width) / 2}px`;
    panel.style.top = `${Math.max(12, Math.min(bounds.bottom - height, window.innerHeight - height - 12))}px`;
    setOpen(true);
  }
  return <>
    <button ref={trigger} className="song-picker-trigger" onClick={show} aria-haspopup="dialog" aria-expanded={open} aria-controls={id}>
      <ListMusic size={15}/><span>Elegir canción</span><small>{tracks.findIndex(item => item.spotifyId === track.spotifyId) + 1} / {tracks.length}</small><ChevronRight size={15}/>
    </button>
    <dialog ref={dialog} id={id} className="song-picker" aria-labelledby={`${id}-title`} onClose={() => setOpen(false)} onClick={event => { if (event.target === event.currentTarget) { const box = event.currentTarget.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.current?.close(); } }}>
      <header className="song-picker-heading"><div><small>COLECCIÓN · {tracks.length} TEMAS</small><h2 id={`${id}-title`}>{title}</h2></div><button className="icon-button" aria-label="Cerrar selección de canciones" onClick={() => dialog.current?.close()}><X size={18}/></button></header>
      <div className="song-collection">
        {tracks.map((item, index) => <button key={item.spotifyId} className="song-choice" draggable onDragStart={event => {
          event.dataTransfer.setData('application/x-nostalgia-track', item.spotifyId);
          event.dataTransfer.effectAllowed = 'move';
        }} aria-pressed={item.spotifyId === track.spotifyId} onClick={() => { onSelect(index); dialog.current?.close(); }}>
          <span className="song-object" aria-hidden="true"><i/><b>{String(index + 1).padStart(2, '0')}</b></span>
          <span className="song-label"><strong>{item.title}</strong><small>{item.artist}</small><em>{item.year}</em></span>
          <span className="song-selected" aria-hidden="true">{item.spotifyId === track.spotifyId ? <Check size={17}/> : <ChevronRight size={17}/>}</span>
        </button>)}
      </div>
      <footer>Elegí un tema o arrastralo al equipo. Abrí Spotify para escucharlo.</footer>
    </dialog>
  </>;
}

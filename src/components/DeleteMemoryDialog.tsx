import { useEffect, useRef, useState } from "react";
import { Trash2, X, Gamepad2 } from "lucide-react";
import type { Memory } from "../types";

export default function DeleteMemoryDialog({memory, onCancel, onConfirm}: {
  memory: Memory; onCancel: () => void; onConfirm: () => string | null;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const locked = useRef(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const era = Math.floor(memory.year / 10) * 10;
  const paper = era === 1970, arcade = era === 1980;
  const title = paper ? "Archivo del diario" : arcade ? "MEMORY ARCADE" : era === 1990 ? "Mi PC — Papelera de reciclaje" : "Papelera de reciclaje";
  function confirm() {
    if (locked.current) return;
    locked.current = true;
    const failure = onConfirm();
    if (failure) {setError(failure);locked.current = false;return;}
    setDeleting(true);
    timer.current = setTimeout(onCancel, matchMedia('(prefers-reduced-motion: reduce)').matches ? 180 : 2100);
  }
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();cancel.current?.focus();
    return () => {clearTimeout(timer.current);if (previous?.isConnected) previous.focus();};
  }, []);
  return <dialog ref={dialog} className={`delete-memory-dialog${deleting ? " is-deleting" : ""}`} aria-labelledby="delete-memory-title" aria-describedby="delete-memory-description" onCancel={e => {e.preventDefault();e.stopPropagation();if(!locked.current)onCancel();}} onKeyDown={e => e.stopPropagation()}>
    <header className="delete-memory-heading"><span>{arcade ? <Gamepad2 size={16}/> : <Trash2 size={16}/>} {title}</span><button type="button" className="icon-button" disabled={deleting} aria-label="Cerrar confirmación" onClick={onCancel}><X size={16}/></button></header>
    <div className={`delete-scene ${paper ? "scene-paper" : arcade ? "scene-arcade" : "scene-desktop"}`} aria-hidden="true">
      <div className="delete-scene-caption">{paper ? "HEMEROTECA / EDICIÓN PERSONAL" : arcade ? "PLAYER 01 · MEMORY SLOT" : "Mis recuerdos"}</div>
      <div className="delete-item">{paper ? <><b>EL DIARIO</b><span className="paper-headline">{memory.title}</span><i/><i/><i/><i/><span className="paper-creases"/></> : arcade ? <><Gamepad2 size={38}/><b>MEMORY</b></> : <><span className="desktop-file"><i/><i/><i/><i/></span><small>recuerdo.txt</small></>}</div>
      {!paper && !arcade && <><div className="desktop-taskbar"><b>{era === 1990 ? "▦ Inicio" : "⊞ inicio"}</b><span>Mis recuerdos</span><small>12:00</small></div><span className="delete-cursor">➤</span><div className="delete-transfer"><span>Eliminando archivo…</span><i/></div></>}
      {paper && <div className="paper-floor-shadow"/>}
      <div className="delete-bin"><svg className="scene-bin-art" width="64" height="72" viewBox="0 0 64 72"><defs><linearGradient id="bin-metal"><stop stopColor="#53676a"/><stop offset=".3" stopColor="#dce8e2"/><stop offset=".65" stopColor="#9caeac"/><stop offset="1" stopColor="#3b5059"/></linearGradient><pattern id="bin-mesh" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M0 0L7 7M7 0L0 7" stroke="#374e54" strokeWidth=".6"/></pattern></defs><ellipse cx="32" cy="65" rx="22" ry="4" fill="#0003"/><path d="M8 17L14 61Q32 72 50 61L56 17Z" fill="url(#bin-metal)"/><path d="M8 17L14 61Q32 72 50 61L56 17Z" fill="url(#bin-mesh)"/><ellipse cx="32" cy="17" rx="24" ry="8" fill="#c0d0ca" stroke="#657978" strokeWidth="2"/><ellipse cx="32" cy="17" rx="20" ry="5" fill="#253d43"/><path className="bin-paper" d="M19 19L16 8L28 11L34 5L45 10L43 20Z" fill="#f2e7ca" stroke="#a89c80"/><path d="M8 20Q32 30 56 20" fill="none" stroke="#dfe9e3" strokeWidth="2"/></svg><small>{paper ? "Papelera" : arcade ? "DELETE" : "Papelera de reciclaje"}</small></div>
      {arcade && <><div className="arcade-burst">{Array.from({length:8},(_,i)=><i key={i} style={{transform:`rotate(${i*45}deg)`}}/>)}</div><div className="arcade-laser"/><div className="arcade-player">▰</div><div className="arcade-controls"><i/><span>● ●</span></div></>}
      <div className="delete-scene-result">{paper ? "Archivo actualizado" : arcade ? "MEMORY CLEARED" : "Archivo eliminado"}</div>
    </div>
    <div className="delete-memory-body">
      <h2 id="delete-memory-title">{deleting ? "Recuerdo eliminado" : "¿Eliminar este recuerdo?"}</h2>
      <p className="delete-memory-name">{memory.title}</p><small>{memory.place} · {memory.year}</small>
      <p id="delete-memory-description">Se quitará de tu perfil, del feed y del mapa. Esta acción no se puede deshacer.</p>
      <span className="sr-only" role="status">{deleting ? "Recuerdo eliminado correctamente." : ""}</span>
      {error && <p role="alert" className="form-error">{error}</p>}
    </div>
    <footer className="delete-memory-footer"><button ref={cancel} disabled={deleting} className="secondary-button" onClick={onCancel}>Cancelar</button><button disabled={deleting} className="primary-button" onClick={confirm}><Trash2 size={15}/> {deleting ? "Eliminado" : "Eliminar recuerdo"}</button></footer>
  </dialog>;
}

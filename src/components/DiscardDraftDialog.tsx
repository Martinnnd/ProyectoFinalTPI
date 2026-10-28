import { useEffect, useRef } from 'react';
import { X, Disc3, Save, MapPin, FilePenLine } from 'lucide-react';
import type { Decade } from '../types';
import styles from './DiscardDraftDialog.module.css';

const labels = {
  1970: ['NOSTALGIAR · STEREO RECORDER', 'CINTA PERSONAL', 'PAUSA / LADO A'],
  1980: ['NOSTALGIAR · VIDEO CLUB', 'MI HISTORIA', 'VHS / PAUSE'],
  1990: ['Mi PC — Recuerdo sin guardar', 'recuerdo.txt', 'DISCO A: / 1.44 MB'],
  2000: ['Nostalgiar — Cambios pendientes', 'Mis recuerdos', 'CD-R / ARCHIVO PERSONAL'],
  2010: ['Nostalgiar · Borrador', 'Foto sin publicar', 'CARRETE / BORRADOR'],
  2020: ['Nostalgiar · Borrador', 'Historia sin publicar', 'TU MOMENTO / BORRADOR'],
};

export default function DiscardDraftDialog({ decade, onContinue, onDiscard }: {
  decade: Decade; onContinue: () => void; onDiscard: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const keep = useRef<HTMLButtonElement>(null);
  const [heading, label, status] = labels[decade];
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const element = dialog.current;
    element?.showModal(); keep.current?.focus();
    return () => { element?.close(); if (previous?.isConnected) previous.focus(); };
  }, []);
  return <dialog ref={dialog} className={styles.dialog} data-era={decade}
    aria-labelledby="discard-title" aria-describedby="discard-description"
    onCancel={event => { event.preventDefault(); event.stopPropagation(); onContinue(); }}
    onKeyDown={event => event.stopPropagation()}>
    <header className={styles.header}><span>{heading}</span><button type="button" aria-label="Cerrar confirmación" onClick={onContinue}><X size={16}/></button></header>
    <div className={styles.content}>
      <div className={styles.scene} aria-hidden="true">
        <span className={styles.status}><i/>{status}</span>
        {decade < 1990 ? <div className={styles.tape}><b>{label}</b><div className={styles.window}><i/><span/><i/></div><small>{decade === 1970 ? 'LOW NOISE · C60' : 'HIGH QUALITY · E-180'}</small><div className={styles.base}/></div>
          : decade === 2020 ? <div className={styles.draft2020}><span className={styles.draft2020Artwork}><MapPin size={27} strokeWidth={1.5}/></span><span className={styles.draft2020Copy}><small>RECUERDO EN PROGRESO</small><strong>{label}</strong><em><FilePenLine size={13}/> Aún sin guardar</em></span></div>
          : <div className={styles.disk}>{decade === 1990 ? <Save strokeWidth={1.2}/> : <Disc3 strokeWidth={1}/>}<span>{label}</span></div>}
        <span className={styles.caption}>TU HISTORIA SIGUE EN BORRADOR</span>
      </div>
      <h2 id="discard-title">¿Salir sin guardar?</h2>
      <p id="discard-description">Todavía no guardaste este recuerdo. Si salís, se perderán los cambios que hiciste en el formulario.</p>
    </div>
    <footer className={styles.actions}><button type="button" onClick={onDiscard}>Descartar cambios</button><button ref={keep} type="button" className={styles.keep} onClick={onContinue}>Seguir editando</button></footer>
  </dialog>;
}

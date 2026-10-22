import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { getMemoryAuthorDisplay } from '../api';
import { API_BASE_URL } from '../apiConfig';
import { safeMediaUrl, youtubeId } from '../media';
import { publicationId } from '../publicationsApi';
import { getFeedPlacePage, getMemoryRelations, getRelatedMapMemory, getRelatedMemories, type MemoryRelations, type RelatedPage } from '../recuerdosRelationsApi';
import type { Memory } from '../types';
import { memoryThumbnail } from './memoryThumbnail';
import styles from './pinMemoryPreview.module.css';
import PublicationMoments from './PublicationMoments';
import { X } from 'lucide-react';

export default function PinMemoryPreview({ memory, onSelect, onOpen, onClose, onMoment }: {
  memory: Memory;
  onSelect: (memory: Memory) => void;
  onOpen?: (memory: Memory) => void;
  onClose?: () => void;
  onMoment?: (id: number) => void;
}) {
  const id = publicationId(memory);
  const thumbnail = memoryThumbnail(memory);
  const [relations, setRelations] = useState<MemoryRelations | null>(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    setRelations(null); setError('');
    if (!id) return;
    const controller = new AbortController();
    getMemoryRelations(id, controller.signal).then(async result => {
      const lugar = await getFeedPlacePage(id, result.lugar, controller.signal);
      if (!controller.signal.aborted) setRelations({ ...result, lugar });
    }).catch(() => {
      if (!controller.signal.aborted) setError('No pudimos cargar los recuerdos relacionados.');
    });
    return () => controller.abort();
  }, [id, revision]);
  return <div className={styles.stack}>
    {relations && <RelatedCarousel key={`${id}-lugar`} id={id!} tipo="lugar" initialPage={relations.lugar} onSelect={onSelect} />}
    <div className={styles.card}>
    {onClose && <button className={styles.close} aria-label="Cerrar vista previa" onClick={onClose}><X size={11} strokeWidth={2.5} aria-hidden="true" /></button>}
    {thumbnail && <img key={thumbnail} className="pin-preview-photo" src={thumbnail} alt={youtubeId(memory.media?.url ?? memory.image ?? '') ? 'Miniatura del video de YouTube' : ''} onError={event => { event.currentTarget.hidden = true; }} />}
    <small>{getMemoryAuthorDisplay(memory)} · {memory.year}</small>
    <strong>{memory.title}</strong>
    <p>{memory.description.length > 140 ? `${memory.description.slice(0, 140)}…` : memory.description}</p>
    {id && onMoment && <PublicationMoments key={id} id={id} onOpen={onMoment} />}
    {onOpen && <button onClick={() => onOpen(memory)}>Ver publicación →</button>}
    {relations && <RelatedCarousel key={`${id}-dia`} id={id!} tipo="dia" initialPage={relations.dia} onSelect={onSelect} />}
    {error && <div role="alert"><p>{error}</p><button onClick={() => setRevision(value => value + 1)}>Reintentar</button></div>}
    </div>
  </div>;
}

function RelatedCarousel({ id, tipo, initialPage, onSelect }: { id: string; tipo: 'dia' | 'lugar'; initialPage: RelatedPage; onSelect: (memory: Memory) => void }) {
  const [page, setPage] = useState<RelatedPage>(initialPage);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [opening, setOpening] = useState<number | null>(null);
  const requests = useRef(new Set<AbortController>());
  const pending = useRef(false);
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; scroll: number; pointer: number } | null>(null);
  const dragged = useRef(false);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const activeRequests = requests.current;
    return () => { activeRequests.forEach(request => request.abort()); activeRequests.clear(); };
  }, []);

  async function more() {
    if (pending.current || !page?.siguienteCursor) return;
    pending.current = true; setBusy(true); setError('');
    const controller = new AbortController(); requests.current.add(controller);
    try {
      const response = await getRelatedMemories(id, tipo, page.siguienteCursor, controller.signal);
      const next = tipo === 'lugar' ? await getFeedPlacePage(id, response, controller.signal) : response;
      if (!controller.signal.aborted) { setPage(current => ({ ...next, items: [...new Map([...current.items, ...next.items].map(item => [item.id, item])).values()] })); return next; }
    } catch {
      if (!controller.signal.aborted) setError('No pudimos cargar más recuerdos. Podés volver a intentar.');
    } finally {
      requests.current.delete(controller); pending.current = false;
      if (!controller.signal.aborted) setBusy(false);
    }
  }
  async function open(target: number) {
    if (pending.current) return;
    pending.current = true; setOpening(target); setError('');
    const controller = new AbortController(); requests.current.add(controller);
    try {
      const memory = await getRelatedMapMemory(target, controller.signal);
      if (!controller.signal.aborted) onSelect(memory);
    } catch (reason) {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'No pudimos abrir ese recuerdo.');
    } finally {
      requests.current.delete(controller); pending.current = false;
      if (!controller.signal.aborted) setOpening(null);
    }
  }
  async function next() {
    if (pending.current) return;
    if (active === page.items.length - 1 && page.hayMas && page.siguienteCursor) {
      const loaded = await more();
      if (loaded) {
        const combined = [...new Map([...page.items, ...loaded.items].map(item => [item.id, item])).values()].sort((a,b) => new Date(a.fecha).getTime()-new Date(b.fecha).getTime() || a.id-b.id);
        const target = loaded.items.find(item => !page.items.some(old => old.id === item.id));
        if (target) setActive(combined.findIndex(item => item.id === target.id));
        else if (!loaded.hayMas) setActive(0);
      }
      return;
    }
    setActive(current => (current + 1) % page.items.length);
  }
  function previous() {
    if (!pending.current) setActive(current => (current - 1 + page.items.length) % page.items.length);
  }
  if (!error && !page?.items.length) return null;

  const title = tipo === 'dia' ? 'También ese día' : 'A través de los años';
  const items = tipo === 'lugar'
    ? [...page.items].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime() || a.id - b.id)
    : page.items;
  return <section className={`${styles.section}${tipo === 'lugar' ? ` ${styles.floating}` : ''}`} aria-label={title}>
    {tipo === 'dia' && <><h3>{title}</h3><small>Misma fecha · a hasta 200 m</small></>}
    {tipo === 'lugar' && page.items.length > 1 && <button className={styles.arrow} aria-label="Recuerdos anteriores de este lugar" disabled={busy || opening !== null} onClick={previous}>‹</button>}
    {!!page?.items.length && <div ref={track} className={styles.track} role="group" aria-label={tipo === 'dia' ? 'Recuerdos del mismo día' : 'Recuerdos de este lugar'} tabIndex={0}
      onKeyDown={event => {
        if (tipo !== 'lugar' || !['ArrowLeft','ArrowRight'].includes(event.key)) return;
        event.preventDefault(); event.stopPropagation();
        if (event.key === 'ArrowRight') void next(); else previous();
      }}
      onMouseDown={event => event.stopPropagation()}
      onPointerDown={event => {
        event.stopPropagation();
        if (tipo !== 'lugar' || event.button !== 0) return;
        dragged.current = false;
        drag.current = { x: event.clientX, scroll: event.currentTarget.scrollLeft, pointer: event.pointerId };
      }}
      onPointerMove={event => {
        if (!drag.current) return;
        event.stopPropagation();
        const delta = event.clientX - drag.current.x;
        if (Math.abs(delta) > 5) {
          dragged.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
        }
        if (dragged.current) {
          event.preventDefault();

        }
      }}
      onPointerUp={event => {
        if (!drag.current) return;
        event.stopPropagation();
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        const delta = event.clientX - drag.current.x;
        drag.current = null;
        if (dragged.current && Math.abs(delta) > 25) { if (delta < 0) void next(); else previous(); }
      }}
      onPointerCancel={() => { drag.current = null; }}
      onClickCapture={event => { if (dragged.current && event.detail !== 0) { event.preventDefault(); event.stopPropagation(); } }}
      onWheel={event => event.stopPropagation()}>
      {items.map((item, index) => {
        let offset = (index-active+items.length)%items.length;
        if (offset > items.length/2) offset -= items.length;
        // Keep sparse carousels at the front; five cards already fill the ring.
        const slots = items.length >= 5 ? items.length : items.length === 4 ? 6 : 8;
        const angle = items.length === 4 && Math.abs(offset) === 2 ? 180 : offset * (360 / slots);
        const radians = angle * Math.PI / 180;
        const depth = (1 - Math.cos(radians)) / 2;
        const rotation = tipo === 'lugar' ? {
          '--carousel-blur': Math.abs(offset) > 1 ? '2.5px' : '0px',
          '--carousel-x': Math.sin(radians),
          '--carousel-y': -depth * 76,
          '--carousel-scale': 1 - depth * .3,
          '--carousel-turn': Math.sin(radians) * 42,
          '--carousel-curve-left': Math.sin(radians) < -.1 ? '12%' : '5%',
          '--carousel-curve-right': Math.sin(radians) > .1 ? '12%' : '5%',
          zIndex: Math.round((1 - depth) * 100),
        } as CSSProperties : undefined;
        const url = item.urlMultimedia ? new URL(item.urlMultimedia, API_BASE_URL).href : '';
        const photo = item.tipoMultimedia === 0 && safeMediaUrl(url, 'image');
        return <button className={styles.item} key={item.id} style={rotation} data-active={tipo === 'lugar' ? offset === 0 : undefined} draggable={false} onDragStart={event => event.preventDefault()} onClick={() => open(item.id)} disabled={opening !== null || busy} aria-label={`Ver en el mapa: ${item.titulo}`}>
          {photo ? <img src={url} alt="" draggable={false} loading="lazy" onError={event => { event.currentTarget.hidden = true; }} /> : <span className={styles.placeholder} aria-hidden="true">{item.tipoMultimedia === 1 ? '▶' : '▧'}</span>}
          <span>{item.titulo}</span>
          <time dateTime={item.fecha}>{tipo === 'lugar' ? new Date(item.fecha).getUTCFullYear() : new Date(item.fecha).toLocaleDateString('es-AR', { timeZone: 'UTC' })}</time>
        </button>;
      })}
      {tipo === 'dia' && page.hayMas && page.siguienteCursor && <button className={styles.more} onClick={more} disabled={busy || opening !== null}>{busy ? 'Cargando…' : 'Ver más'}</button>}
    </div>}
    {tipo === 'lugar' && (items.length > 1 || (page.hayMas && page.siguienteCursor)) && <button className={styles.arrow} aria-label="Más recuerdos de este lugar" disabled={busy || opening !== null} onClick={next}>{busy ? '…' : '›'}</button>}
    {opening !== null && <p role="status">Abriendo recuerdo…</p>}
    {error && <div role="alert"><p>{error}</p></div>}
  </section>;
}


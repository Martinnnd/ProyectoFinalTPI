import { useEffect, useRef, useState } from 'react';
import { getMemoryAuthorDisplay } from '../api';
import { API_BASE_URL } from '../apiConfig';
import { safeMediaUrl } from '../media';
import { publicationId } from '../publicationsApi';
import { getMemoryRelations, getRelatedMapMemory, getRelatedMemories, type MemoryRelations, type RelatedPage } from '../recuerdosRelationsApi';
import type { Memory } from '../types';
import { memoryThumbnail } from './memoryThumbnail';
import styles from './pinMemoryPreview.module.css';
import PublicationMoments from './PublicationMoments';

export default function PinMemoryPreview({ memory, onSelect, onOpen, onClose, onMoment }: {
  memory: Memory;
  onSelect: (memory: Memory) => void;
  onOpen?: (memory: Memory) => void;
  onClose?: () => void;
  onMoment?: (id: number) => void;
}) {
  const id = publicationId(memory);
  const [relations, setRelations] = useState<MemoryRelations | null>(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    setRelations(null); setError('');
    if (!id) return;
    const controller = new AbortController();
    getMemoryRelations(id, controller.signal).then(result => {
      if (!controller.signal.aborted) setRelations(result);
    }).catch(() => {
      if (!controller.signal.aborted) setError('No pudimos cargar los recuerdos relacionados.');
    });
    return () => controller.abort();
  }, [id, revision]);
  return <div className={styles.stack}>
    {relations && <RelatedCarousel key={`${id}-lugar`} id={id!} tipo="lugar" initialPage={relations.lugar} onSelect={onSelect} />}
    <div className={styles.card}>
    {onClose && <button className={styles.close} aria-label="Cerrar vista previa" onClick={onClose}>×</button>}
    {memoryThumbnail(memory) && <img className="pin-preview-photo" src={memoryThumbnail(memory)} alt="" onError={event => { event.currentTarget.hidden = true; }} />}
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
  const [scrollable, setScrollable] = useState({ left: false, right: false });
  function updateScroll() {
    const element = track.current;
    if (element) setScrollable({ left: element.scrollLeft > 2, right: element.scrollLeft + element.clientWidth < element.scrollWidth - 2 });
  }
  useEffect(() => {
    const element = track.current;
    if (!element) return;
    updateScroll();
    const observer = new ResizeObserver(updateScroll);
    observer.observe(element);
    return () => observer.disconnect();
  }, [page]);
  useEffect(() => {
    const activeRequests = requests.current;
    return () => { activeRequests.forEach(request => request.abort()); activeRequests.clear(); };
  }, []);

  async function more() {
    if (pending.current || !page?.siguienteCursor) return;
    pending.current = true; setBusy(true); setError('');
    const controller = new AbortController(); requests.current.add(controller);
    try {
      const next = await getRelatedMemories(id, tipo, page.siguienteCursor, controller.signal);
      if (!controller.signal.aborted) setPage(current => ({ ...next, items: [...new Map([...(current?.items ?? []), ...next.items].map(item => [item.id, item])).values()] }));
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
    if (!scrollable.right && page.hayMas) await more();
    requestAnimationFrame(() => track.current?.scrollBy({ left: 92, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }));
  }
  if (!error && !page?.items.length) return null;

  const title = tipo === 'dia' ? 'También ese día' : 'A través de los años';
  const items = tipo === 'lugar'
    ? [...page.items].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime() || a.id - b.id)
    : page.items;
  return <section className={`${styles.section}${tipo === 'lugar' ? ` ${styles.floating}` : ''}`} aria-label={title}>
    {tipo === 'dia' && <><h3>{title}</h3><small>Misma fecha · a hasta 200 m</small></>}
    {tipo === 'lugar' && scrollable.left && <button className={styles.arrow} aria-label="Recuerdos anteriores de este lugar" onClick={() => track.current?.scrollBy({ left: -92, behavior: 'smooth' })}>‹</button>}
    {!!page?.items.length && <div ref={track} className={styles.track} role="group" aria-label={tipo === 'dia' ? 'Recuerdos del mismo día' : 'Recuerdos de este lugar'} tabIndex={0}
      onScroll={updateScroll}
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
          event.currentTarget.scrollLeft = drag.current.scroll - delta;
        }
      }}
      onPointerUp={event => {
        if (!drag.current) return;
        event.stopPropagation();
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        drag.current = null;
        const element = event.currentTarget;
        if (dragged.current && element.scrollLeft + element.clientWidth >= element.scrollWidth - 2 && page.hayMas) void more();
      }}
      onPointerCancel={() => { drag.current = null; }}
      onClickCapture={event => { if (dragged.current && event.detail !== 0) { event.preventDefault(); event.stopPropagation(); } }}
      onWheel={event => event.stopPropagation()}>
      {items.map(item => {
        const url = item.urlMultimedia ? new URL(item.urlMultimedia, API_BASE_URL).href : '';
        const photo = item.tipoMultimedia === 0 && safeMediaUrl(url, 'image');
        return <button className={styles.item} key={item.id} draggable={false} onDragStart={event => event.preventDefault()} onClick={() => open(item.id)} disabled={opening !== null || busy} aria-label={`Ver en el mapa: ${item.titulo}`}>
          {photo ? <img src={url} alt="" draggable={false} loading="lazy" onError={event => { event.currentTarget.hidden = true; }} /> : <span className={styles.placeholder} aria-hidden="true">{item.tipoMultimedia === 1 ? '▶' : '▧'}</span>}
          <span>{item.titulo}</span>
          <time dateTime={item.fecha}>{tipo === 'lugar' ? new Date(item.fecha).getUTCFullYear() : new Date(item.fecha).toLocaleDateString('es-AR', { timeZone: 'UTC' })}</time>
        </button>;
      })}
      {tipo === 'dia' && page.hayMas && page.siguienteCursor && <button className={styles.more} onClick={more} disabled={busy || opening !== null}>{busy ? 'Cargando…' : 'Ver más'}</button>}
    </div>}
    {tipo === 'lugar' && (scrollable.right || (page.hayMas && page.siguienteCursor)) && <button className={styles.arrow} aria-label="Más recuerdos de este lugar" disabled={busy || opening !== null} onClick={next}>{busy ? '…' : '›'}</button>}
    {opening !== null && <p role="status">Abriendo recuerdo…</p>}
    {error && <div role="alert"><p>{error}</p></div>}
  </section>;
}

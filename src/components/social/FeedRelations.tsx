import { useEffect, useId, useRef, useState } from 'react';
import { CalendarDays, MapPin, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '../../apiConfig';
import { safeMediaUrl } from '../../media';
import { getMemoryRelations, getRelatedMapMemory, getRelatedMemories, type MemoryRelations, type RelatedMemory, type RelatedPage } from '../../recuerdosRelationsApi';
import { getMoment, getMomentPublications } from '../../momentosApi';
import type { Publication } from '../../publicationsApi';
import type { Memory } from '../../types';
import { usePublicationMoments } from '../PublicationMoments';
import styles from './feedRelations.module.css';

type Selection = { type: 'dia' | 'lugar'; title: string } | { type: 'momento'; momentId: number; title: string };
type Card = { id: number; title: string; date: string; url: string; video: boolean };
const geographicCard = (item: RelatedMemory): Card => ({ id: item.id, title: item.titulo, date: item.fecha, url: item.urlMultimedia, video: item.tipoMultimedia === 1 });
const momentCard = (item: Publication): Card => ({ id: item.id, title: item.titulo, date: item.fecha, url: item.urlMultimedia, video: item.tipoMultimedia === 1 });

export default function FeedRelations({ id, onOpen, active = true }: { id: string; onOpen: (memory: Memory) => void; active?: boolean }) {
  const [visible, setVisible] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!active || visible || !container.current) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: '150px' });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, [active, visible]);
  return <div ref={container}>{active && visible && <FeedRelationsContent id={id} onOpen={onOpen} />}</div>;
}

function FeedRelationsContent({ id, onOpen }: { id: string; onOpen: (memory: Memory) => void }) {
  const [relations, setRelations] = useState<MemoryRelations | null>(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [selection, setSelection] = useState<Selection | null>(null);
  const { associations, pending, error: momentError, unavailable, retry } = usePublicationMoments(id);
  const panelId = useId();
  const trigger = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setRelations(null); setError(''); setSelection(null);
    getMemoryRelations(id, controller.signal).then(result => { if (!controller.signal.aborted) setRelations(result); })
      .catch(() => { if (!controller.signal.aborted) setError('No pudimos cargar los recuerdos relacionados.'); });
    return () => controller.abort();
  }, [id, revision]);
  function choose(next: Selection, button: HTMLButtonElement) {
    trigger.current = button;
    setSelection(current => current?.type === next.type && (current.type !== 'momento' || (next.type === 'momento' && current.momentId === next.momentId)) ? null : next);
  }
  function close() { setSelection(null); trigger.current?.focus({ preventScroll: true }); }
  const hasLinks = !!relations?.dia.items.length || !!relations?.lugar.items.length || !!associations?.momentos.length;
  if (!hasLinks && !error && !momentError && !pending && !unavailable) return null;
  return <section className={styles.section} aria-label="Explorar recuerdos relacionados">
    {hasLinks && <div className={styles.links} aria-label="Relaciones del recuerdo">
      {!!relations?.dia.items.length && <button aria-expanded={selection?.type === 'dia'} aria-controls={panelId} onClick={event => choose({ type: 'dia', title: 'También ese día' }, event.currentTarget)}><CalendarDays size={16} aria-hidden="true" />También ese día</button>}
      {!!relations?.lugar.items.length && <button aria-expanded={selection?.type === 'lugar'} aria-controls={panelId} onClick={event => choose({ type: 'lugar', title: 'Este lugar a través de los años' }, event.currentTarget)}><MapPin size={16} aria-hidden="true" />Este lugar a través de los años</button>}
      {associations?.momentos.map(({ momento }) => <button key={momento.id} aria-expanded={selection?.type === 'momento' && selection.momentId === momento.id} aria-controls={panelId} onClick={event => choose({ type: 'momento', momentId: momento.id, title: momento.nombre }, event.currentTarget)}><Sparkles size={16} aria-hidden="true" />Parte de {momento.nombre}</button>)}
    </div>}
    {error && <div role="status">{error} <button onClick={() => setRevision(value => value + 1)}>Reintentar</button></div>}
    {pending && <small role="status">Buscando momentos relacionados…</small>}
    {(momentError || unavailable) && <div role="status">{momentError || 'La detección de momentos no estuvo disponible.'} <button onClick={retry}>Consultar de nuevo</button></div>}
    {selection && <FeedRelationPanel key={selection.type === 'momento' ? `momento-${selection.momentId}` : selection.type} selection={selection}
      originId={relations?.publicacionId ?? associations?.publicacionId ?? Number(id)}
      initialPage={selection.type === 'momento' ? undefined : relations?.[selection.type]}
      panelId={panelId} onClose={close} onOpen={onOpen} />}
  </section>;
}

function FeedRelationPanel({ selection, originId, initialPage, panelId, onClose, onOpen }: {
  selection: Selection; originId: number; initialPage?: RelatedPage; panelId: string; onClose: () => void; onOpen: (memory: Memory) => void;
}) {
  const [cards, setCards] = useState<Card[]>(initialPage?.items.map(geographicCard) ?? []);
  const [cursor, setCursor] = useState(initialPage?.siguienteCursor ?? null);
  const [canonical, setCanonical] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [title, setTitle] = useState(selection.title);
  const [loading, setLoading] = useState(selection.type === 'momento');
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const requests = useRef(new Set<AbortController>());
  const busy = useRef(false);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    panel.current?.focus({ preventScroll: true });
    const active = requests.current;
    return () => { active.forEach(request => request.abort()); active.clear(); };
  }, []);
  const momentId = selection.type === 'momento' ? selection.momentId : null;
  useEffect(() => {
    if (!momentId) return;
    const controller = new AbortController(); requests.current.add(controller);
    setLoading(true); setError(''); setCards([]); setCursor(null);
    async function load() {
      const detail = await getMoment(momentId!, controller.signal);
      const result = await getMomentPublications(detail.id, true, null, controller.signal);
      if (controller.signal.aborted) return;
      setCanonical(detail.id); setDescription(detail.descripcion); setTitle(detail.nombre);
      setCards(result.items.filter(item => item.id !== originId).map(momentCard)); setCursor(result.siguienteCursor);
    }
    void load().catch(() => { if (!controller.signal.aborted) setError('No pudimos cargar los recuerdos de este momento.'); })
      .finally(() => { requests.current.delete(controller); if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [momentId, originId, revision]);
  async function more() {
    if (!cursor || busy.current) return;
    busy.current = true; setLoading(true); setError('');
    const controller = new AbortController(); requests.current.add(controller);
    try {
      const result = selection.type === 'momento'
        ? await getMomentPublications(canonical!, true, cursor, controller.signal)
        : await getRelatedMemories(String(originId), selection.type, cursor, controller.signal);
      if (!controller.signal.aborted) {
        const added = selection.type === 'momento' ? (result.items as Publication[]).filter(item => item.id !== originId).map(momentCard) : (result.items as RelatedMemory[]).map(geographicCard);
        setCards(current => [...new Map([...current, ...added].map(item => [item.id, item])).values()]); setCursor(result.siguienteCursor);
      }
    } catch { if (!controller.signal.aborted) setError('No pudimos cargar más recuerdos.'); }
    finally { requests.current.delete(controller); busy.current = false; if (!controller.signal.aborted) setLoading(false); }
  }
  async function open(id: number) {
    if (busy.current) return;
    busy.current = true; setOpening(true); setError('');
    const controller = new AbortController(); requests.current.add(controller);
    try {
      const memory = await getRelatedMapMemory(id, controller.signal);
      if (!controller.signal.aborted) onOpen(memory);
    } catch { if (!controller.signal.aborted) setError('No pudimos abrir ese recuerdo. Volvé a intentar.'); }
    finally { requests.current.delete(controller); busy.current = false; if (!controller.signal.aborted) setOpening(false); }
  }
  const displayed = selection.type === 'lugar' ? [...cards].sort((a, b) => Date.parse(a.date) - Date.parse(b.date) || a.id - b.id) : cards;
  return <div className={styles.panel} ref={panel} id={panelId} tabIndex={-1} role="region" aria-label={title} onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); onClose(); } }}>
    <header><h4>{title}</h4><button aria-label="Cerrar recuerdos relacionados" onClick={onClose}>×</button></header>
    {description && <p>{description}</p>}
    <div className={styles.cards} aria-label="Publicaciones relacionadas">
      {displayed.map(card => {
        const url = card.url ? new URL(card.url, API_BASE_URL).href : '';
        return <button className={styles.card} key={card.id} disabled={opening || loading} onClick={() => void open(card.id)} aria-label={`Abrir recuerdo relacionado: ${card.title}`}>
          {!card.video && safeMediaUrl(url, 'image') ? <img src={url} alt="" loading="lazy" onError={event => { event.currentTarget.hidden = true; }} /> : <span className={styles.media} aria-hidden="true">{card.video ? '▶' : '▧'}</span>}
          <strong>{card.title}</strong><time dateTime={card.date}>{new Date(card.date).getUTCFullYear()}</time>
        </button>;
      })}
    </div>
    {loading && <small role="status">Cargando recuerdos…</small>}
    {opening && <small role="status">Abriendo recuerdo…</small>}
    {!loading && !cards.length && !error && <p>No hay otros recuerdos disponibles.</p>}
    {error && <div role="alert">{error} {selection.type === 'momento' && !cards.length && <button onClick={() => setRevision(value => value + 1)}>Reintentar</button>}</div>}
    {cursor && <button disabled={loading || opening} onClick={() => void more()}>Más recuerdos relacionados</button>}
  </div>;
}

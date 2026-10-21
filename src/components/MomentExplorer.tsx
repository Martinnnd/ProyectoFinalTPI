import { useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '../apiConfig';
import { getMoment, getMomentPublications, momentPeriod, type MomentoDetalle, type MomentPublications } from '../momentosApi';
import { getRelatedMapMemory } from '../recuerdosRelationsApi';
import { safeMediaUrl } from '../media';
import type { Memory } from '../types';
import styles from './moments.module.css';

export default function MomentExplorer({ id, origin, selectedId, onSelect, onClose, onMoment }: {
  id: number; origin: Memory; selectedId?: string; onSelect: (memory: Memory) => void; onClose: () => void; onMoment: (id: number) => void;
}) {
  const [detail, setDetail] = useState<MomentoDetalle | null>(null);
  const [page, setPage] = useState<MomentPublications | null>(null);
  const [descendants, setDescendants] = useState(true);
  const [detailError, setDetailError] = useState('');
  const [listError, setListError] = useState('');
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [opening, setOpening] = useState<number | null>(null);
  const panel = useRef<HTMLElement>(null);
  const listRequest = useRef<AbortController | null>(null);
  const openRequest = useRef<AbortController | null>(null);
  const loading = useRef(false);
  useEffect(() => {
    panel.current?.focus({ preventScroll: true });
    return () => { listRequest.current?.abort(); openRequest.current?.abort(); };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setDetail(null); setDetailError('');
    getMoment(id, controller.signal).then(result => { if (!controller.signal.aborted) setDetail(result); })
      .catch(() => { if (!controller.signal.aborted) setDetailError('No pudimos abrir este momento. Puede no estar disponible.'); });
    return () => controller.abort();
  }, [id, revision]);
  const canonicalId = detail?.id;
  useEffect(() => {
    setPage(null); setListError(''); setBusy(false); loading.current = false;
    if (!canonicalId) return;
    const controller = new AbortController(); listRequest.current = controller;
    getMomentPublications(canonicalId, descendants, null, controller.signal)
      .then(result => { if (!controller.signal.aborted) setPage(result); })
      .catch(() => { if (!controller.signal.aborted) setListError('No pudimos cargar los recuerdos de este momento.'); });
    return () => { controller.abort(); listRequest.current?.abort(); };
  }, [canonicalId, descendants, revision]);
  async function more() {
    if (!canonicalId || !page?.siguienteCursor || loading.current) return;
    loading.current = true; setBusy(true); setListError('');
    const controller = new AbortController(); listRequest.current = controller;
    try {
      const result = await getMomentPublications(canonicalId, descendants, page.siguienteCursor, controller.signal);
      if (!controller.signal.aborted) setPage(current => ({ ...result, items: [...new Map([...(current?.items ?? []), ...result.items].map(item => [item.id, item])).values()] }));
    } catch { if (!controller.signal.aborted) setListError('No pudimos cargar más recuerdos. Volvé a intentar.'); }
    finally { if (!controller.signal.aborted) { loading.current = false; setBusy(false); } }
  }
  async function open(memoryId: number) {
    if (openRequest.current && !openRequest.current.signal.aborted && opening !== null) return;
    const controller = new AbortController(); openRequest.current = controller;
    setOpening(memoryId); setListError('');
    try {
      const memory = await getRelatedMapMemory(memoryId, controller.signal);
      if (!controller.signal.aborted) onSelect(memory);
    } catch { if (!controller.signal.aborted) setListError('No pudimos ubicar ese recuerdo en el mapa. Volvé a intentar.'); }
    finally { if (!controller.signal.aborted) setOpening(null); }
  }
  return <aside className={styles.panel} aria-label="Explorar un momento" tabIndex={-1} ref={panel} onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); onClose(); } }}>
    <header><span>UN MOMENTO, MUCHOS RECUERDOS</span><button aria-label="Cerrar exploración del momento" onClick={onClose}>×</button></header>
    {!detail && !detailError && <p role="status">Cargando momento…</p>}
    {detailError && <div role="alert"><p>{detailError}</p><button onClick={() => setRevision(value => value + 1)}>Reintentar</button></div>}
    {detail && <>
      <h2>{detail.nombre}</h2>
      {momentPeriod(detail) && <small>{momentPeriod(detail)}</small>}
      {detail.descripcion && <p>{detail.descripcion}</p>}
      {detail.redirigidoDesdeId && <small>Estás viendo el momento actualizado.</small>}
      {detail.padre && <button className={styles.link} onClick={() => onMoment(detail.padre!.id)}>Parte de {detail.padre.nombre} →</button>}
      {!!detail.hijos.length && <div className={styles.hierarchy}>{detail.hijos.map(child => <button key={child.id} onClick={() => onMoment(child.id)}>{child.nombre} →</button>)}</div>}
      <label className={styles.filter}><input type="checkbox" checked={descendants} onChange={event => setDescendants(event.target.checked)} />Incluir acontecimientos dentro de este momento</label>
      <button className={styles.returnButton} onClick={() => onSelect(origin)}>Volver a {origin.title}</button>
      {!page && !listError && <p role="status">Buscando recuerdos…</p>}
      {page && !page.items.length && <p>Todavía no hay recuerdos disponibles en este momento.</p>}
      <div className={styles.list} aria-label="Recuerdos del momento">
        {page?.items.map(item => {
          const url = item.urlMultimedia ? new URL(item.urlMultimedia, API_BASE_URL).href : '';
          return <button className={styles.memory} key={item.id} aria-label={`Explorar recuerdo: ${item.titulo}`} aria-current={String(item.id) === selectedId ? 'true' : undefined} disabled={opening !== null} onClick={() => void open(item.id)}>
            {item.tipoMultimedia === 0 && safeMediaUrl(url, 'image') ? <img src={url} alt="" loading="lazy" onError={event => { event.currentTarget.hidden = true; }} /> : <span className={styles.mediaFallback} aria-hidden="true">{item.tipoMultimedia === 1 ? '▶' : '▧'}</span>}
            <span><strong>{item.titulo}</strong><small>{new Date(item.fecha).getUTCFullYear()} · {item.autor.username}</small></span>
          </button>;
        })}
      </div>
      {opening !== null && <p role="status">Viajando al recuerdo…</p>}
      {listError && <div role="alert"><p>{listError}</p><button onClick={() => page?.siguienteCursor ? void more() : setRevision(value => value + 1)}>Reintentar</button></div>}
      {page?.hayMas && page.siguienteCursor && <button disabled={busy} onClick={() => void more()}>{busy ? 'Cargando…' : 'Más recuerdos del momento'}</button>}
    </>}
  </aside>;
}

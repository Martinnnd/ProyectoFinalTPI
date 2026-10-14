import { useEffect, useRef, useState } from 'react';
import { createComment, getComments } from '../../publicationsApi';
import type { MemoryComment } from '../../socialTypes';

export default function RemoteComments({ memoryId }: { memoryId: string }) {
  const [comments, setComments] = useState<MemoryComment[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [retry, setRetry] = useState(0);
  const busy = useRef(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => {
    const request = new AbortController();
    controller.current = request;
    setLoading(true); setError(''); setComments([]); setCursor(null);
    getComments(memoryId, undefined, request.signal).then(page => {
      if (request.signal.aborted) return;
      setComments(page.items); setCursor(page.cursor);
    }).catch(err => { if (!request.signal.aborted) setError(err.message); })
      .finally(() => { if (!request.signal.aborted) setLoading(false); });
    return () => request.abort();
  }, [memoryId, retry]);
  async function more() {
    if (!cursor || busy.current) return;
    busy.current = true; setLoading(true); setError('');
    const request = controller.current!;
    try {
      const page = await getComments(memoryId, cursor, request.signal);
      if (request.signal.aborted) return;
      setComments(current => [...new Map([...current, ...page.items].map(comment => [comment.id, comment])).values()]);
      setCursor(page.cursor);
    } catch (err) { if (!request.signal.aborted) setError((err as Error).message); }
    finally { busy.current = false; if (!request.signal.aborted) setLoading(false); }
  }
  return <section className="post-comments" aria-label="Comentarios">
    <h4>La conversación</h4>
    {loading && <p role="status">Cargando comentarios…</p>}
    {error && <p role="alert">{error} <button type="button" onClick={() => cursor ? void more() : setRetry(value => value + 1)}>Reintentar</button></p>}
    <div className="comment-list">{comments.map(comment => <article className="comment-item" key={comment.id}>
      <header><strong>{comment.author}</strong> <time dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleString('es-AR')}</time></header>
      <p>{comment.text}</p>
    </article>)}</div>
    {!loading && !error && !comments.length && <p>Todavía no hay comentarios.</p>}
    {cursor && <button type="button" disabled={loading} onClick={() => void more()}>Ver más comentarios</button>}
    <form onSubmit={async event => {
      event.preventDefault();
      if (!draft.trim() || sending) return;
      setSending(true); setError('');
      const request = controller.current!;
      try {
        const comment = await createComment(memoryId, draft);
        if (request.signal.aborted) return;
        setComments(current => [comment, ...current.filter(item => item.id !== comment.id)]); setDraft('');
      } catch (err) { if (!request.signal.aborted) setError((err as Error).message); }
      finally { if (!request.signal.aborted) setSending(false); }
    }}>
      <label htmlFor={`comment-${memoryId}`}>Comentar el recuerdo</label>
      <textarea id={`comment-${memoryId}`} value={draft} required disabled={sending} onChange={event => setDraft(event.target.value)} placeholder="Comentá este recuerdo…"/>
      <button className="primary-button" disabled={sending || !draft.trim()}>{sending ? 'Enviando…' : 'Comentar'}</button>
    </form>
  </section>;
}

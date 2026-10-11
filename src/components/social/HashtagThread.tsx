import { useEffect, useState } from "react";
import { ArrowLeft, MessageCircle, Plus } from "lucide-react";
import { loadContributions, THREAD_STORAGE_KEY, type HashtagContribution } from "../../hashtags";

const demoThreads: Record<string, { author: string; text: string }[]> = {
  cassettes: [
    { author: "Nico", text: "¿También esperaban a que pasara su canción por la radio para grabarla? Siempre se metía la voz del locutor al final." },
    { author: "Vero", text: "¡Sí! Y escribíamos las canciones en la cajita. Todavía guardo una que me regalaron en el colegio." },
  ],
  vinilos: [
    { author: "Miguel", text: "Darle vuelta al disco era parte del ritual. ¿Cuál fue el primer vinilo que compraron?" },
    { author: "Susana", text: "El mío era usado y tenía la funda gastada. Lo intercambiábamos entre hermanos todos los domingos." },
  ],
  autosclasicos: [
    { author: "Ricardo", text: "Los viajes empezaban desplegando el mapa sobre el capó. ¿Qué auto los llevaba de vacaciones?" },
    { author: "Mariela", text: "Un Fiat 128 lleno de bolsos. Siempre nos perdíamos, pero eso era parte de la aventura." },
  ],
  nochesdecine: [
    { author: "Pablo", text: "Todavía guardo las entradas de aquellas salidas. ¿Qué película fueron a ver más de una vez?" },
    { author: "Carla", text: "¡Harry Potter! Nos organizábamos con todo el curso y después discutíamos el libro a la salida." },
  ],
};

export default function HashtagThread({ tag, count, hasDemo, onBack, onAdd }: {
  tag: string;
  count: number;
  hasDemo: boolean;
  onBack: () => void;
  onAdd: () => void;
}) {
  const [contributions, setContributions] = useState<HashtagContribution[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  useEffect(() => {
    function refresh() {
      try { setContributions(loadContributions(window.localStorage)); setError(""); }
      catch { setError("No pudimos leer los aportes guardados. Habilitá el almacenamiento del navegador para participar."); }
    }
    refresh();
    const sync = (event: StorageEvent) => { if (event.key === THREAD_STORAGE_KEY || event.key === null) refresh(); };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || text.length > 1000) { setError("Escribí un aporte de entre 1 y 1000 caracteres."); return; }
    try {
      const next = [...loadContributions(window.localStorage), {
        id: crypto.randomUUID(), tag, author: "Vos", text, createdAt: new Date().toISOString(),
      }];
      window.localStorage.setItem(THREAD_STORAGE_KEY, JSON.stringify(next));
      setContributions(next); setDraft(""); setError(""); setStatus("Tu aporte se agregó al hilo.");
    } catch { setError("No se pudo guardar tu aporte. Revisá el espacio y los permisos del navegador; tu texto sigue acá."); }
  }
  const own = contributions.filter(item => item.tag === tag);
  const demo = hasDemo ? demoThreads[tag] ?? [] : [];
  return (
    <section className="hashtag-thread" aria-labelledby="hashtag-thread-title">
      <button className="feed-back" onClick={onBack}><ArrowLeft size={16} /> Volver a todos los recuerdos</button>
      <div className="thread-heading">
        <span className="thread-symbol" aria-hidden="true">#</span>
        <div><small>HILO COLABORATIVO</small><h3 id="hashtag-thread-title">#{tag}</h3><p>{count} {count === 1 ? "recuerdo relacionado" : "recuerdos relacionados"} con los filtros actuales</p></div>
      </div>
      <p>Una misma etiqueta, muchas historias. Compartí lo que recordás o sumá una publicación al hilo.</p>
      <button className="primary-button" onClick={onAdd}><Plus size={16} /> Sumar un recuerdo a #{tag}</button>
      <details className="thread-conversation" open>
        <summary><MessageCircle size={16} /> Conversación del hilo <span>({demo.length + own.length})</span></summary>
        {demo.length + own.length === 0 && <p>Este hilo recién empieza. ¡Dejá el primer aporte!</p>}
        <ol className="thread-messages">
          {demo.map((item, index) => <li key={`demo-${index}`}><strong>{item.author}</strong><small> · aporte de muestra</small><p>{item.text}</p></li>)}
          {own.map(item => <li key={item.id}><strong>{item.author}</strong><time dateTime={item.createdAt}> · {new Date(item.createdAt).toLocaleDateString("es-AR")}</time><p>{item.text}</p></li>)}
        </ol>
        <form onSubmit={submit} className="thread-composer">
          <label htmlFor="thread-contribution">Tu aporte a #{tag}</label>
          <textarea id="thread-contribution" value={draft} onChange={event => { setDraft(event.target.value); setStatus(""); }} required maxLength={1000} rows={3} placeholder="¿Qué recuerdo te trae este tema?" aria-describedby="thread-storage-note" />
          <small id="thread-storage-note">Tus aportes se guardan en este navegador.</small>
          <button type="submit" className="primary-button" disabled={!draft.trim()}>Publicar aporte</button>
          {error && <p role="alert" className="form-error">{error}</p>}
          {status && <p role="status">{status}</p>}
        </form>
      </details>
      <h4 className="thread-posts-title">Recuerdos de la comunidad</h4>
    </section>
  );
}

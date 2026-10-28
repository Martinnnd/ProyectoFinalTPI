import { ArrowLeft, Plus } from "lucide-react";

export default function HashtagThread({ tag, onBack, onAdd }: {
  tag: string;
  onBack: () => void;
  onAdd: () => void;
}) {
  return (
    <section className="hashtag-thread" aria-labelledby="hashtag-thread-title">
      <button type="button" className="feed-back" onClick={onBack}>
        <ArrowLeft size={16} /> Volver al feed
      </button>
      <div className="thread-heading">
        <span className="thread-symbol" aria-hidden="true">#</span>
        <div>
          <small>RECUERDOS DE LA COMUNIDAD</small>
          <h3 id="hashtag-thread-title">#{tag}</h3>
          <p>Publicaciones de todas las épocas que comparten este hashtag.</p>
        </div>
      </div>
      <p>Cada recuerdo que use #{tag} aparece acá automáticamente.</p>
      <button type="button" className="primary-button" onClick={onAdd}>
        <Plus size={16} /> Sumar un recuerdo a #{tag}
      </button>
      <h4 className="thread-posts-title">Recuerdos con #{tag}</h4>
    </section>
  );
}

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getMemoryAttachments } from '../publicationMedia';
import type { Memory, MemoryAttachment } from '../types';
import { youtubeId, safeMediaUrl, normalizeAttachment } from '../media';
import RetroMediaPlaceholder from './RetroMediaPlaceholder';

export function PostMusic({ music }: { music: Memory['music'] }) {
  const [open, setOpen] = useState(false);
  if (!music || !/^[A-Za-z0-9]{22}$/.test(music.spotifyId)) return null;
  return (
    <div className="post-music">
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span aria-hidden="true">♫</span>
        <span>
          <strong>{music.title}</strong>
          <small>{music.artist} · Spotify</small>
        </span>
        <span>{open ? 'Cerrar' : 'Escuchar'}</span>
      </button>
      {open && (
        <iframe
          title={`${music.title} — ${music.artist}`}
          src={`https://open.spotify.com/embed/track/${music.spotifyId}`}
          height="152"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        />
      )}
    </div>
  );
}

export default function PostMedia({
  memory,
  showFallbackWhenEmpty = true,
}: {
  memory: Memory;
  showFallbackWhenEmpty?: boolean;
}) {
  const attachments = getMemoryAttachments(memory);
  const [selected, setSelected] = useState(0);
  useEffect(() => { setSelected(0); }, [memory.id, attachments.length]);
  if (attachments.length === 0) return showFallbackWhenEmpty
    ? <RetroMediaPlaceholder year={memory.year} title={memory.title} category={memory.category} failed={false} /> : null;
  const current = Math.min(selected, attachments.length - 1);
  if (attachments.length === 1) return <AttachmentContent memory={memory} media={attachments[0]} />;
  return (
    <section className="post-media-gallery" aria-roledescription="carrusel" aria-label={'Adjuntos de ' + memory.title}
      onClick={event => event.stopPropagation()}>
      <AttachmentContent key={current} memory={memory} media={attachments[current]} />
      <div className="post-media-gallery-nav">
        <button type="button" aria-label="Adjunto anterior" disabled={current === 0} onClick={() => setSelected(current - 1)}><ChevronLeft size={19} /></button>
        <span role="status" aria-live="polite">Adjunto {current + 1} de {attachments.length}</span>
        <button type="button" aria-label="Siguiente adjunto" disabled={current === attachments.length - 1} onClick={() => setSelected(current + 1)}><ChevronRight size={19} /></button>
      </div>
    </section>
  );
}

function AttachmentContent({ memory, media }: { memory: Memory; media: MemoryAttachment }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (media.kind === 'youtube') {
    const id = youtubeId(media.url);
    return id ? (
      <div className="post-attachment post-attachment-youtube">
        <iframe
          title={`Video de ${memory.title}`}
          src={`https://www.youtube-nocookie.com/embed/${id}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
        <a href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noreferrer">
          Abrir en YouTube
        </a>
      </div>
    ) : (
      <RetroMediaPlaceholder
        year={memory.year}
        title={memory.title}
        category={memory.category}
        failed={true}
      />
    );
  }

  if (!safeMediaUrl(media.url, media.kind) || failedUrl === media.url) {
    return (
      <RetroMediaPlaceholder
        year={memory.year}
        title={memory.title}
        category={memory.category}
        failed={true}
      />
    );
  }

  return (
    <div className="post-attachment">
      {media.kind === 'video' ? (
        <video
          src={media.url}
          controls
          preload="metadata"
          playsInline
          onError={() => setFailedUrl(media.url)}
        />
      ) : (
        <img
          src={media.url}
          alt={`Imagen adjunta a ${memory.title}`}
          loading="lazy"
          onError={() => setFailedUrl(media.url)}
        />
      )}
      {memory.imageCaption && <small className="attachment-caption">{memory.imageCaption}</small>}
    </div>
  );
}

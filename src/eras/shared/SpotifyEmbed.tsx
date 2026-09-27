import { useEffect, useRef, useState } from 'react';

type Update = { data: { isPaused: boolean; isBuffering: boolean; position: number; duration: number } };
type Controller = { addListener: (event: 'playback_update', callback: (event: Update) => void) => void; destroy: () => void };
type API = { createController: (element: HTMLElement, options: { uri: string; width: string; height: number }, callback: (controller: Controller) => void) => void };
let pending: Promise<API> | undefined;
function loadAPI() {
  if (!pending) pending = new Promise<API>((resolve, reject) => {
    const script = document.createElement('script');
    const timer = window.setTimeout(() => reject(new Error('Spotify API timeout')), 15000);
    (window as Window & { onSpotifyIframeApiReady?: (api: API) => void }).onSpotifyIframeApiReady = api => { clearTimeout(timer); resolve(api); };
    script.src = 'https://open.spotify.com/embed/iframe-api/v1';
    script.async = true;
    script.onerror = () => { clearTimeout(timer); reject(new Error('Spotify API unavailable')); };
    document.head.append(script);
  });
  return pending;
}

export default function SpotifyEmbed({ id, title, onPlaying }: { id: string; title: string; onPlaying: (playing: boolean) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const callback = useRef(onPlaying);
  callback.current = onPlaying;
  const [fallback, setFallback] = useState(false);
  useEffect(() => {
    let disposed = false;
    let unavailable = false;
    let controller: Controller | undefined;
    callback.current(false);
    const container = host.current!;
    const mount = document.createElement('div');
    container.append(mount);
    let timeout: ReturnType<typeof setTimeout>;
    function fail() { if (!disposed && !unavailable) { unavailable = true; clearTimeout(timeout); controller?.destroy(); container.replaceChildren(); callback.current(false); setFallback(true); } }
    timeout = setTimeout(fail, 20000);
    loadAPI().then(api => {
      if (disposed || unavailable) return;
      api.createController(mount, { uri: `spotify:track:${id}`, width: '100%', height: 152 }, result => {
        if (disposed || unavailable) { result.destroy(); return; }
        clearTimeout(timeout);
        controller = result;
        const iframe = container.querySelector('iframe');
        if (iframe) { iframe.classList.add('spotify-player'); iframe.title = title; }
        result.addListener('playback_update', event => {
          if (disposed || unavailable) return;
          const { isPaused, isBuffering, position, duration } = event.data;
          callback.current(isPaused === false && isBuffering === false && !(duration > 0 && position >= duration));
        });
      });
    }).catch(fail);
    return () => { disposed = true; clearTimeout(timeout); controller?.destroy(); container.replaceChildren(); callback.current(false); };
  }, [id, title]);
  return <><div ref={host}/>{fallback && <><iframe className="spotify-player" title={title} src={`https://open.spotify.com/embed/track/${id}`} width="100%" height="152" allow="autoplay; encrypted-media; fullscreen; picture-in-picture"/><small>No se pudo conectar la animación con Spotify. Podés seguir usando el reproductor.</small></>}</>;
}

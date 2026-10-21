'use client';

import { useEffect, useRef, useState } from 'react';
import { Images, Loader2 } from 'lucide-react';
import { cancelGooglePhotos, startGooglePhotos, waitForGooglePhoto } from '../googlePhotos';
import { getStoredSession } from './auth/authStorage';

type Phase = 'idle' | 'connecting' | 'authorizing' | 'selecting' | 'importing' | 'cancelling';
const messages: Record<Phase, string> = {
  idle: '', connecting: 'Conectando con Google…', authorizing: 'Autorizá el acceso en la ventana de Google.',
  selecting: 'Elegí una foto y confirmá la selección en Google Photos.', importing: 'Preparando tu foto…',
  cancelling: 'Cancelando la selección…',
};

export default function GooglePhotosPicker({ disabled, onFile, onBusyChange }: {
  disabled: boolean;
  onFile: (file: File) => Promise<void>;
  onBusyChange: (busy: boolean) => void;
}) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState('');
  const mounted = useRef(true);
  const active = useRef<{ abort: AbortController; popup: Window } | null>(null);
  const callbacks = useRef({ onFile, onBusyChange });
  callbacks.current = { onFile, onBusyChange };

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      active.current?.abort.abort();
      active.current?.popup.close();
    };
  }, []);

  function cancel() {
    active.current?.abort.abort();
    active.current?.popup.close();
    setPhase('cancelling');
  }

  async function start() {
    if (active.current || disabled) return;
    const user = getStoredSession();
    if (!user) { setError('Iniciá sesión en Nostalgiar para elegir fotos de Google.'); return; }
    // Open within the click, before awaiting the API, to avoid popup blocking.
    const popup = window.open('', '_blank', 'popup,width=680,height=780');
    if (!popup) { setError('El navegador bloqueó la ventana. Permití las ventanas emergentes de este sitio y volvé a intentar.'); return; }
    popup.opener = null;
    popup.document.title = 'Conectar Google Photos';
    popup.document.body.textContent = 'Conectando con Google Photos. Podés volver al formulario sin perder tu recuerdo.';
    const run = { abort: new AbortController(), popup };
    active.current = run;
    setError(''); setPhase('connecting'); callbacks.current.onBusyChange(true);
    const key = `nostalgiar:google-photos:${user.usuarioId}`;
    let operationId: string | undefined;
    const status = (value: Phase) => { if (mounted.current && !run.abort.signal.aborted) setPhase(value); };
    try {
      // Recover cleanup after a refresh or an interrupted request; no Google tokens are stored.
      const previous = sessionStorage.getItem(key);
      if (previous) { await cancelGooglePhotos(previous); sessionStorage.removeItem(key); }
      run.abort.signal.throwIfAborted();
      const session = await startGooglePhotos();
      operationId = session.operationId;
      sessionStorage.setItem(key, operationId);
      run.abort.signal.throwIfAborted();
      const url = new URL(session.authorizationUrl);
      if (url.protocol !== 'https:' || url.hostname !== 'accounts.google.com') throw new Error('La dirección de autorización de Google no es válida.');
      popup.location.href = url.href;
      status('authorizing');
      const file = await waitForGooglePhoto(session, run.abort.signal, value =>
        status(value === 'ready' || value === 'imported' ? 'importing' : value));
      run.abort.signal.throwIfAborted();
      if (mounted.current) await callbacks.current.onFile(file);
    } catch (failure) {
      if (mounted.current && !run.abort.signal.aborted) {
        setError(failure instanceof TypeError ? 'No pudimos conectar con el servidor. Comprobá tu conexión y volvé a intentar.'
          : failure instanceof Error && failure.name === 'TimeoutError' ? 'La conexión tardó demasiado. Volvé a intentar en unos momentos.'
          : failure instanceof Error ? failure.message : 'No se pudo importar la foto. Volvé a intentar.');
      }
    } finally {
      popup.close();
      if (operationId) {
        try {
          await cancelGooglePhotos(operationId);
          if (sessionStorage.getItem(key) === operationId) sessionStorage.removeItem(key);
        } catch {
          // Keep the ID so the next attempt can retry cleanup. The backend also expires it.
        }
      }
      if (active.current === run) active.current = null;
      if (mounted.current) { setPhase('idle'); callbacks.current.onBusyChange(false); }
    }
  }

  const busy = phase !== 'idle';
  return <div className="google-photos-picker" aria-busy={busy}>
    <button type="button" className="secondary-button google-photos-button" onClick={() => void start()} disabled={disabled || busy}>
      {busy ? <Loader2 size={18} className="google-photos-spinner" aria-hidden="true" /> : <Images size={18} aria-hidden="true" />}
      Elegir desde Google Photos
    </button>
    <small>Elegí una foto de tu biblioteca. Se publicará cuando guardes el recuerdo.</small>
    {busy && <div className="google-photos-progress">
      <span role="status" aria-live="polite">{messages[phase]}</span>
      <button type="button" className="secondary-button" onClick={cancel} disabled={phase === 'cancelling'}>Cancelar selección</button>
    </div>}
    {error && <p className="form-error" role="alert">{error}</p>}
  </div>;
}

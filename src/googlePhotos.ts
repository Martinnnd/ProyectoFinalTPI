import { API_BASE_URL } from './apiConfig';
import { apiFetch } from './components/auth/apiClient';

const endpoint = `${API_BASE_URL}/api/integraciones/google-photos/sesiones`;
export interface GooglePhotosSession {
  operationId: string;
  authorizationUrl: string;
  expiresAt: string;
}
export interface GooglePhotosStatus {
  status: 'authorizing' | 'selecting' | 'ready' | 'imported';
  pollAfterSeconds: number;
  expiresAt: string;
}
export class GooglePhotosError extends Error {
  constructor(message: string, public readonly status = 0) { super(message); }
}

async function checked(response: Response): Promise<Response> {
  if (response.ok) return response;
  const problem = await response.json().catch(() => null) as { detail?: string } | null;
  const fallback = response.status === 401
    ? 'Iniciá sesión en Nostalgiar para elegir fotos de Google.'
    : response.status === 404
      ? 'Google Photos no está disponible. Verificá que el backend esté actualizado y reiniciado.'
      : 'No se pudo completar la conexión con Google Photos. Volvé a intentar.';
  throw new GooglePhotosError(problem?.detail || fallback, response.status);
}

export async function startGooglePhotos(): Promise<GooglePhotosSession> {
  // Do not abort creation on cancel: receive the ID so the operation can be deleted.
  const response = await checked(await apiFetch(endpoint, { method: 'POST', signal: AbortSignal.timeout(30000) }));
  return response.json();
}

export async function cancelGooglePhotos(id: string): Promise<void> {
  const response = await apiFetch(`${endpoint}/${encodeURIComponent(id)}`, {
    method: 'DELETE', keepalive: true, signal: AbortSignal.timeout(10000),
  });
  if (response.status !== 404 && response.status !== 410) await checked(response);
}

function pause(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const abort = () => { clearTimeout(timer); reject(signal.reason); };
    const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, ms);
    signal.addEventListener('abort', abort, { once: true });
  });
}

export async function waitForGooglePhoto(
  session: GooglePhotosSession,
  signal: AbortSignal,
  onStatus: (status: GooglePhotosStatus['status']) => void,
): Promise<File> {
  let expires = Date.parse(session.expiresAt);
  if (!Number.isFinite(expires)) throw new GooglePhotosError('La sesión de Google Photos no es válida.');
  while (true) {
    signal.throwIfAborted();
    if (Date.now() >= expires) throw new GooglePhotosError('La selección venció. Volvé a conectar Google Photos.', 410);
    const pollSignal = AbortSignal.any([signal, AbortSignal.timeout(Math.max(1, Math.min(30000, expires - Date.now())))]);
    const response = await checked(await apiFetch(`${endpoint}/${encodeURIComponent(session.operationId)}`, { signal: pollSignal }));
    const state = await response.json() as GooglePhotosStatus;
    const serverExpiry = Date.parse(state.expiresAt);
    if (!Number.isFinite(serverExpiry)) throw new GooglePhotosError('Google Photos devolvió una sesión inválida.');
    expires = Math.min(expires, serverExpiry);
    signal.throwIfAborted();
    if (Date.now() >= expires) throw new GooglePhotosError('La selección venció. Volvé a conectar Google Photos.', 410);
    onStatus(state.status);
    if (state.status === 'ready' || state.status === 'imported') {
      const download = await checked(await apiFetch(`${endpoint}/${encodeURIComponent(session.operationId)}/imagen`, {
        method: 'POST', signal: AbortSignal.any([signal, AbortSignal.timeout(120000)]),
      }));
      const blob = await download.blob();
      signal.throwIfAborted();
      const extensions: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
      if (!extensions[blob.type]) throw new GooglePhotosError('La foto tiene un formato no compatible.');
      if (!blob.size || blob.size > 5 * 1024 * 1024) throw new GooglePhotosError('La foto debe tener un tamaño de hasta 5 MB.');
      return new File([blob], `google-photos.${extensions[blob.type]}`, { type: blob.type });
    }
    if (state.status !== 'authorizing' && state.status !== 'selecting')
      throw new GooglePhotosError('Google Photos devolvió un estado inesperado.');
    const seconds = Number.isFinite(state.pollAfterSeconds) ? Math.max(1, state.pollAfterSeconds) : 5;
    await pause(Math.min(seconds * 1000, Math.max(0, expires - Date.now())), signal);
  }
}

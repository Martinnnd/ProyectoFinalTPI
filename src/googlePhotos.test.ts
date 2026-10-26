import { afterEach, expect, it, vi } from 'vitest';
import { cancelGooglePhotos, startGooglePhotos, waitForGooglePhoto } from './googlePhotos';
import { apiFetch } from './components/auth/apiClient';

vi.mock('./components/auth/apiClient', () => ({ apiFetch: vi.fn() }));
const request = vi.mocked(apiFetch);
const session = () => ({ operationId: 'operation', authorizationUrl: 'https://accounts.google.com/oauth', expiresAt: new Date(Date.now() + 60000).toISOString() });
const state = (status: string, seconds = 3) => new Response(JSON.stringify({ status, pollAfterSeconds: seconds, expiresAt: session().expiresAt }));
afterEach(() => { vi.resetAllMocks(); vi.useRealTimers(); });

it('inicia una sesión usando el cliente autenticado existente', async () => {
  const value = session(); request.mockResolvedValue(new Response(JSON.stringify(value)));
  expect(await startGooglePhotos()).toEqual(value);
  expect(request).toHaveBeenCalledWith(expect.stringContaining('/google-photos/sesiones'), expect.objectContaining({ method: 'POST' }));
});

it('respeta el intervalo y devuelve un archivo al completar la selección', async () => {
  vi.useFakeTimers();
  request.mockResolvedValueOnce(state('selecting', 7)).mockResolvedValueOnce(state('ready'))
    .mockResolvedValueOnce(new Response(new Blob(['photo'], { type: 'image/jpeg' })));
  const status = vi.fn();
  const result = waitForGooglePhoto(session(), new AbortController().signal, status);
  await vi.advanceTimersByTimeAsync(6999);
  expect(request).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(1);
  const file = await result;
  expect(file.name).toBe('google-photos.jpg');
  expect(file.type).toBe('image/jpeg');
  expect(await file.text()).toBe('photo');
  expect(status.mock.calls.map(c => c[0])).toEqual(['selecting', 'ready']);
});

it('cancelar detiene las consultas sin descargar la foto', async () => {
  vi.useFakeTimers();
  request.mockResolvedValue(state('authorizing', 20));
  const abort = new AbortController();
  const result = waitForGooglePhoto(session(), abort.signal, vi.fn());
  const rejected = expect(result).rejects.toMatchObject({ name: 'AbortError' });
  await vi.advanceTimersByTimeAsync(1);
  abort.abort();
  await rejected;
  await vi.advanceTimersByTimeAsync(30000);
  expect(request).toHaveBeenCalledTimes(1);
});

it('una sesión vencida no genera nuevas consultas', async () => {
  await expect(waitForGooglePhoto({ ...session(), expiresAt: new Date(0).toISOString() }, new AbortController().signal, vi.fn()))
    .rejects.toMatchObject({ status: 410 });
  expect(request).not.toHaveBeenCalled();
});

it('muestra el detalle del backend cuando se rechaza el consentimiento', async () => {
  request.mockResolvedValue(new Response(JSON.stringify({ detail: 'No se autorizó el acceso.' }), { status: 409 }));
  await expect(waitForGooglePhoto(session(), new AbortController().signal, vi.fn())).rejects.toThrow('No se autorizó el acceso.');
});

it.each(['text/html', 'video/mp4'])('no adjunta una descarga de tipo %s', async mime => {
  request.mockResolvedValueOnce(state('ready')).mockResolvedValueOnce(new Response(new Blob(['wrong'], { type: mime })));
  await expect(waitForGooglePhoto(session(), new AbortController().signal, vi.fn())).rejects.toThrow('formato no compatible');
});

it('rechaza una imagen mayor a 2 MB', async () => {
  request.mockResolvedValueOnce(state('ready')).mockResolvedValueOnce(new Response(new Blob([new Uint8Array(2 * 1024 * 1024 + 1)], { type: 'image/png' })));
  await expect(waitForGooglePhoto(session(), new AbortController().signal, vi.fn())).rejects.toThrow('hasta 2 MB');
});

it('limpiar una operación ya eliminada no impide volver a empezar', async () => {
  request.mockResolvedValue(new Response(null, { status: 404 }));
  await expect(cancelGooglePhotos('old/id')).resolves.toBeUndefined();
  expect(request).toHaveBeenCalledWith(expect.stringContaining('old%2Fid'), expect.objectContaining({ method: 'DELETE', keepalive: true }));
});

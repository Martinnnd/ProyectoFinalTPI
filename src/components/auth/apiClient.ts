import { refreshSessionRequest } from "./authApi";
import { notifyAchievementsChanged } from "../../achievementEvents";
import { feedCache, queryCache } from '../../sessionQueryCache';
import {
  clearStoredSession,
  getStoredSession,
  storeSession,
  waitForAuthInit,
} from "./authStorage";

export async function apiFetch(
  input: string | URL,
  init: RequestInit = {},
  allowRefresh = true,
): Promise<Response> {
  await waitForAuthInit();

  const headers = new Headers(init.headers);
  const session = getStoredSession();
  if (session?.token) headers.set("Authorization", `Bearer ${session.token}`);

  const method = (init.method ?? 'GET').toUpperCase();
  const path = new URL(String(input), 'http://localhost').pathname;
  const cacheable = typeof window !== 'undefined' && method === 'GET' &&
    /^\/api\/(publicaciones|usuario|grupos|momentos)(\/|$)/.test(path) &&
    !/\/publicaciones\/\d+\/(analisis|momentos)$/.test(path) && init.cache !== 'reload' && init.cache !== 'no-store';
  const perform = () => fetch(input, {
    ...init,
    // One shared request can finish even when a route's consumer unmounts.
    signal: cacheable ? undefined : init.signal,
    headers,
    credentials: "include",
  });
  const response = cacheable
    ? (await queryCache.read(`${session?.usuarioId ?? 'guest'}:${String(input)}:${JSON.stringify([...new Headers(init.headers)])}`,
      perform, init.signal, value => value.ok)).clone()
    : await perform();

  if (response.ok && method !== 'GET' && method !== 'HEAD' && !path.endsWith('/impresiones')) {
    queryCache.clear();
    if (/^\/api\/publicaciones(?:\/|$)/.test(path) || path.startsWith('/api/seguimientos') || path === '/api/usuario/me/username') feedCache.clear();
  }

  if (response.status !== 401 || !allowRefresh) {
    if (response.ok && /^(POST|PUT|PATCH|DELETE)$/i.test(init.method ?? "GET") && !path.endsWith('/impresiones') && !path.startsWith('/api/usuario/me/')) {
      notifyAchievementsChanged();
    }
    return response;
  }

  try {
    const renewed = await refreshSessionRequest();
    storeSession(renewed);
    return apiFetch(input, init, false);
  } catch {
    clearStoredSession();
    return response;
  }
}

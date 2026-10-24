import { refreshSessionRequest } from "./authApi";
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

  const response = await fetch(input, {
    ...init,
    headers,
    credentials: "include",
  });

  if (response.status !== 401 || !allowRefresh) return response;

  try {
    const renewed = await refreshSessionRequest();
    storeSession(renewed);
    return apiFetch(input, init, false);
  } catch {
    clearStoredSession();
    return response;
  }
}

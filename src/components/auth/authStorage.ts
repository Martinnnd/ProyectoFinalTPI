import type { AuthSession } from "./authTypes";

export const AUTH_STORAGE_KEY = "nostalgia_auth";
export const AUTH_CHANGE_EVENT = "nostalgiar:auth-change";

let memorySession: AuthSession | null = null;

export function tokenExpiresAt(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(normalized)) as { exp?: number };
    return typeof decoded.exp === "number" ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function getStoredSession(): AuthSession | null {
  const expiresAt = memorySession ? tokenExpiresAt(memorySession.token) : null;
  if (memorySession && (expiresAt === null || expiresAt > Date.now())) return memorySession;
  memorySession = null;
  return null;
}

export function storeSession(session: AuthSession): void {
  memorySession = session;
  if (typeof window !== "undefined") {
    // Limpia el formato anterior: ningún token queda persistido al recargar.
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  }
}

export function clearStoredSession(): void {
  memorySession = null;
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  }
}

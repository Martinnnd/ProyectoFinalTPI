import type { AuthSession } from "./authTypes";
import { clearSessionQueries } from "../../sessionQueryCache";
import { clearLoginAchievements } from "../../loginAchievements";

export const AUTH_STORAGE_KEY = "nostalgia_auth";
export const AUTH_CHANGE_EVENT = "nostalgiar:auth-change";

let memorySession: AuthSession | null = null;
let authInitPromise: Promise<void> | null = null;
let resolveAuthInit: (() => void) | null = null;

export function beginAuthInit(): void {
  if (!authInitPromise) {
    authInitPromise = new Promise<void>((resolve) => {
      resolveAuthInit = resolve;
    });
  }
}

export function completeAuthInit(): void {
  if (resolveAuthInit) {
    resolveAuthInit();
    resolveAuthInit = null;
  }
}

export function waitForAuthInit(): Promise<void> {
  if (!authInitPromise) return Promise.resolve();
  return Promise.race([authInitPromise, new Promise<void>((resolve) => setTimeout(resolve, 8000))]);
}

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
  if (memorySession?.usuarioId !== session.usuarioId) clearSessionQueries();
  memorySession = session;
  completeAuthInit();
  if (typeof window !== "undefined") {
    // Limpia el formato anterior: ningún token queda persistido al recargar.
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  }
}

export function clearStoredSession(): void {
  clearLoginAchievements();
  clearSessionQueries();
  memorySession = null;
  completeAuthInit();
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  }
}

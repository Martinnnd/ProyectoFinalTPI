"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { loginRequest, logoutRequest, refreshSessionRequest, registerRequest } from "./authApi";
import {
  AUTH_CHANGE_EVENT,
  beginAuthInit,
  clearStoredSession,
  completeAuthInit,
  getStoredSession,
  storeSession,
  tokenExpiresAt,
} from "./authStorage";
import type { AuthSession, AuthStatus, LoginCredentials, RegisterCredentials } from "./authTypes";

export type AuthContextValue = {
  session: AuthSession | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthSession>;
  register: (credentials: RegisterCredentials) => Promise<AuthSession>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  if (typeof window !== "undefined") {
    beginAuthInit();
  }

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const stored = getStoredSession();
      if (stored) {
        setSession(stored);
        setStatus("authenticated");
        completeAuthInit();
        return;
      }

      try {
        const refreshed = await refreshSessionRequest();
        if (cancelled) return;
        storeSession(refreshed);
        setSession(refreshed);
        setStatus("authenticated");
      } catch {
        if (cancelled) return;
        clearStoredSession();
        setSession(null);
        setStatus("anonymous");
      } finally {
        completeAuthInit();
      }
    }

    void init();

    function syncFromStorage() {
      const current = getStoredSession();
      setSession(current);
      setStatus(current ? "authenticated" : "anonymous");
    }

    window.addEventListener(AUTH_CHANGE_EVENT, syncFromStorage);
    return () => {
      cancelled = true;
      window.removeEventListener(AUTH_CHANGE_EVENT, syncFromStorage);
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const nextSession = await loginRequest(credentials);
    storeSession(nextSession);
    setSession(nextSession);
    setStatus("authenticated");
    return nextSession;
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    const nextSession = await registerRequest(credentials);
    storeSession(nextSession);
    setSession(nextSession);
    setStatus("authenticated");
    return nextSession;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      clearStoredSession();
      setSession(null);
      setStatus("anonymous");
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      status,
      isAuthenticated: status === "authenticated",
      login,
      register,
      logout,
    }),
    [session, status, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useOptionalAuth(): AuthContextValue | null {
  return useContext(AuthContext);
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider.");
  return context;
}

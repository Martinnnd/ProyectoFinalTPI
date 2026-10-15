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
import {
  loginRequest,
  logoutRequest,
  refreshSessionRequest,
  registerRequest,
} from "./authApi";
import {
  AUTH_CHANGE_EVENT,
  clearStoredSession,
  getStoredSession,
  storeSession,
  tokenExpiresAt,
} from "./authStorage";
import type {
  AuthSession,
  AuthStatus,
  LoginCredentials,
  RegisterCredentials,
} from "./authTypes";

type AuthContextValue = {
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

  useEffect(() => {
    let active = true;
    window.localStorage.removeItem("nostalgia_auth");

    refreshSessionRequest()
      .then((next) => {
        if (!active) return;
        storeSession(next);
        setSession(next);
        setStatus("authenticated");
      })
      .catch(() => {
        if (!active) return;
        clearStoredSession();
        setSession(null);
        setStatus("anonymous");
      });

    const syncSession = () => {
      const next = getStoredSession();
      setSession(next);
      setStatus(next ? "authenticated" : "anonymous");
    };
    window.addEventListener(AUTH_CHANGE_EVENT, syncSession);
    return () => {
      active = false;
      window.removeEventListener(AUTH_CHANGE_EVENT, syncSession);
    };
  }, []);

  useEffect(() => {
    if (!session) return;
    const expiresAt = tokenExpiresAt(session.token);
    if (!expiresAt) return;
    const delay = Math.max(0, expiresAt - Date.now() - 60_000);
    const timeout = window.setTimeout(() => {
      refreshSessionRequest()
        .then(storeSession)
        .catch(clearStoredSession);
    }, delay);
    return () => window.clearTimeout(timeout);
  }, [session]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const next = await loginRequest(credentials);
    storeSession(next);
    return next;
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    const next = await registerRequest(credentials);
    storeSession(next);
    return next;
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    clearStoredSession();
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

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider.");
  return context;
}

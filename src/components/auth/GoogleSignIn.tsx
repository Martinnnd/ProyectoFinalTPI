"use client";

import Script from "next/script";
import { UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "../../apiConfig";
import { useAuth } from "./AuthProvider";
import styles from "./auth.module.css";

type GoogleConfig = { habilitado: false } | { habilitado: true; clientId: string; nonce: string };
type GoogleId = {
  initialize: (options: {
    client_id: string;
    nonce: string;
    auto_select: boolean;
    callback: (response: { credential: string }) => void;
  }) => void;
  renderButton: (
    element: HTMLElement,
    options: { theme: string; size: string; text: string; locale: string },
  ) => void;
  cancel: () => void;
};

export default function GoogleSignIn({
  returnTo,
  onRegistrationChange,
}: {
  returnTo: string;
  onRegistrationChange: (pending: boolean) => void;
}) {
  const { googleLogin } = useAuth();
  const router = useRouter();
  const button = useRef<HTMLDivElement>(null);
  const credential = useRef<string | null>(null);
  const busy = useRef(false);
  const [config, setConfig] = useState<GoogleConfig | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [needsUsername, setNeedsUsername] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    onRegistrationChange(needsUsername);
  }, [needsUsername, onRegistrationChange]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE_URL}/api/auth/google/config`, {
      credentials: "include",
      cache: "no-store",
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10_000)]),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("No pudimos cargar el acceso con Google.");
        setConfig(await response.json());
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError(
            "Google no está disponible en este momento. Podés usar el acceso con contraseña.",
          );
      });
    return () => {
      controller.abort();
      credential.current = null;
    };
  }, []);

  useEffect(() => {
    const google = (window as Window & { google?: { accounts: { id: GoogleId } } }).google;
    if (!scriptReady || !config?.habilitado || !button.current || !google) return;
    let disposed = false;
    google.accounts.id.initialize({
      client_id: config.clientId,
      nonce: config.nonce,
      auto_select: false,
      callback: async (response) => {
        if (disposed || busy.current) return;
        busy.current = true;
        setSubmitting(true);
        setError("");
        try {
          const result = await googleLogin(response.credential);
          if (disposed) return;
          if ("requiereUsername" in result) {
            credential.current = response.credential;
            setNeedsUsername(true);
          } else {
            router.replace(returnTo);
          }
        } catch (cause) {
          if (!disposed)
            setError(
              cause instanceof Error ? cause.message : "No pudimos iniciar sesión con Google.",
            );
        } finally {
          busy.current = false;
          if (!disposed) setSubmitting(false);
        }
      },
    });
    button.current.replaceChildren();
    google.accounts.id.renderButton(button.current, {
      theme: "outline",
      size: "large",
      text: "continue_with",
      locale: "es",
    });
    return () => {
      disposed = true;
      google.accounts.id.cancel();
    };
  }, [config, scriptReady, googleLogin, returnTo, router]);

  if (config && !config.habilitado) return null;
  return (
    <div className={styles.googleAccess} aria-busy={submitting}>
      {config?.habilitado && (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onReady={() => setScriptReady(true)}
          onError={() =>
            setError("No pudimos cargar Google. Revisá tu conexión e intentá nuevamente.")
          }
        />
      )}
      {error && <p role="alert">{error}</p>}
      <div ref={button} hidden={needsUsername || submitting} />
      {submitting && <p role="status">Procesando…</p>}
      {needsUsername && (
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            if (!credential.current || busy.current) return;
            busy.current = true;
            setSubmitting(true);
            setError("");
            try {
              const result = await googleLogin(credential.current, username.trim());
              if (!("requiereUsername" in result)) {
                credential.current = null;
                router.replace(returnTo);
              }
            } catch (cause) {
              setError(cause instanceof Error ? cause.message : "No pudimos crear tu cuenta.");
            } finally {
              busy.current = false;
              setSubmitting(false);
            }
          }}
        >
          <p>Elegí tu nombre de usuario para crear tu cuenta con Google.</p>
          <label className={styles.field}>
            Nombre de usuario
            <span className={styles.inputShell}>
              <UserRound size={18} aria-hidden="true" />
              <input
                autoFocus
                name="googleUsername"
                autoComplete="username"
                required
                minLength={3}
                maxLength={50}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                disabled={submitting}
              />
            </span>
          </label>
          <button type="submit" className={styles.submit} disabled={submitting}>
            Crear mi cuenta con Google
          </button>
          <button
            type="button"
            className={styles.back}
            disabled={submitting}
            onClick={() => {
              credential.current = null;
              setNeedsUsername(false);
              setError("");
            }}
          >
            Usar otra cuenta de Google
          </button>
        </form>
      )}
    </div>
  );
}

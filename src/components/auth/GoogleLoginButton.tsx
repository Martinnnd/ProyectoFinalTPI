"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth } from "./AuthProvider";
import { googleNonceRequest } from "./authApi";
import { AuthError } from "./authErrors";
import type { GoogleLoginCredentials } from "./authTypes";
import styles from "./auth.module.css";

type GoogleIdentity = {
  initialize(config: {
    client_id: string;
    nonce: string;
    ux_mode: "popup";
    callback: (response: { credential: string }) => void;
  }): void;
  renderButton(
    element: HTMLElement,
    options: { size: "large"; text: "signin_with"; shape: "pill"; locale: "es" },
  ): void;
};

type Props = {
  clientId: string;
  returnTo: string;
  disabled: boolean;
  onBusy: (busy: boolean) => void;
};

type ConfirmacionGoogle = { credencial: string; tipo: "vincular" | "crear" };

export default function GoogleLoginButton({ clientId, returnTo, disabled, onBusy }: Props) {
  const router = useRouter();
  const { loginGoogle } = useAuth();
  const contenedor = useRef<HTMLDivElement>(null);
  const enCurso = useRef(false);
  const [scriptListo, setScriptListo] = useState(false);
  const [intento, setIntento] = useState(0);
  const [procesando, setProcesando] = useState(false);
  const [confirmacion, setConfirmacion] = useState<ConfirmacionGoogle | null>(null);
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");

  const ingresar = useCallback(
    async (credentials: GoogleLoginCredentials) => {
      if (enCurso.current) return;
      enCurso.current = true;
      setProcesando(true);
      onBusy(true);
      setError("");
      try {
        await loginGoogle(credentials);
        setConfirmacion(null);
        router.replace(returnTo);
      } catch (reason) {
        if (reason instanceof AuthError && reason.code === "GOOGLE_VINCULACION_REQUERIDA") {
          setConfirmacion({ credencial: credentials.credential, tipo: "vincular" });
        } else if (reason instanceof AuthError && reason.code === "GOOGLE_CREACION_REQUERIDA") {
          setConfirmacion({ credencial: credentials.credential, tipo: "crear" });
        } else {
          setError(
            reason instanceof Error ? reason.message : "No pudimos iniciar sesión con Google.",
          );
          if (reason instanceof AuthError && reason.code === "GOOGLE_CREDENCIAL_INVALIDA") {
            setConfirmacion(null);
            setIntento((actual) => actual + 1);
          }
        }
      } finally {
        setContrasena("");
        setProcesando(false);
        onBusy(false);
        enCurso.current = false;
      }
    },
    [loginGoogle, onBusy, returnTo, router],
  );

  useEffect(() => {
    const destino = contenedor.current;
    if (!scriptListo || !destino) return;
    const google = (window as Window & { google?: { accounts: { id: GoogleIdentity } } }).google;
    const control = new AbortController();

    async function prepararBoton(identidad: GoogleIdentity, elemento: HTMLElement) {
      try {
        const nonce = await googleNonceRequest(control.signal);
        if (control.signal.aborted) return;
        identidad.initialize({
          client_id: clientId,
          nonce,
          ux_mode: "popup",
          callback: ({ credential }) => {
            if (!control.signal.aborted) void ingresar({ credential });
          },
        });
        identidad.renderButton(elemento, {
          size: "large",
          text: "signin_with",
          shape: "pill",
          locale: "es",
        });
      } catch (reason) {
        if (!control.signal.aborted)
          setError(
            reason instanceof Error ? reason.message : "No pudimos cargar el botón de Google.",
          );
      }
    }

    if (google) void prepararBoton(google.accounts.id, destino);
    return () => {
      control.abort();
      destino.replaceChildren();
    };
  }, [clientId, ingresar, intento, scriptListo]);

  function vincular(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (confirmacion?.tipo === "vincular" && !disabled) {
      void ingresar({ credential: confirmacion.credencial, contrasena });
    }
  }

  function crearCuenta() {
    if (confirmacion?.tipo === "crear" && !disabled) {
      void ingresar({ credential: confirmacion.credencial, confirmarCreacion: true });
    }
  }

  function cancelarConfirmacion() {
    setConfirmacion(null);
    setContrasena("");
    setError("");
    setIntento((actual) => actual + 1);
  }

  return (
    <div className={styles.googleLogin}>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => setScriptListo(true)}
        onError={() => setError("No pudimos cargar el botón de Google.")}
      />
      <div className={styles.googleAccion} hidden={Boolean(confirmacion) && !procesando}>
        <div ref={contenedor} hidden={Boolean(confirmacion) || disabled || procesando} />
        {procesando && <p role="status">Verificando con Google…</p>}
      </div>
      {error && <p role="alert">{error}</p>}
      {confirmacion?.tipo === "vincular" && (
        <form className={styles.form} onSubmit={vincular}>
          <label className={styles.field}>
            <span>Ingresá tu contraseña de Nostalgiar para vincular Google</span>
            <span className={styles.inputShell}>
              <input
                name="contrasena"
                type="password"
                autoComplete="current-password"
                value={contrasena}
                onChange={(event) => setContrasena(event.target.value)}
                required
                maxLength={100}
              />
            </span>
          </label>
          <button className={styles.submit} type="submit" disabled={disabled || procesando}>
            Vincular e ingresar
          </button>
        </form>
      )}
      {confirmacion?.tipo === "crear" && (
        <div className={styles.form}>
          <p>En este entorno de Nostalgiar no encontramos una cuenta con el correo que elegiste.</p>
          <button
            type="button"
            className={styles.submit}
            disabled={disabled || procesando}
            onClick={crearCuenta}
          >
            Crear una cuenta nueva
          </button>
        </div>
      )}
      {confirmacion && (
        <button
          type="button"
          className={styles.googleCancelar}
          disabled={procesando}
          onClick={cancelarConfirmacion}
        >
          Cancelar
        </button>
      )}
    </div>
  );
}

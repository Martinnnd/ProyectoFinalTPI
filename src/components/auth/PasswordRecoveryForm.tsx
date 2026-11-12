"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, Loader2, LockKeyhole, Mail } from "lucide-react";
import { requestPasswordRecovery, resetPassword } from "./authApi";
import { AuthError } from "./authErrors";
import { clearStoredSession } from "./authStorage";
import {
  isInvalidRecoveryLink,
  readRecoveryToken,
  recoveryErrorMessage,
  recoveryRequestedMessage,
  validateNewPassword,
  validateRecoveryEmail,
} from "./passwordRecovery";
import styles from "./auth.module.css";

function RecoveryCard({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.card} aria-labelledby="recovery-title">
      <Link className={styles.brand} href="/" aria-label="Volver al inicio de Nostalgiar">
        <Image src="/landing/isotipo-actual.png" alt="" width={60} height={42} priority />
        <span>Nostalgiar</span>
      </Link>
      <p className={styles.eyebrow}>VOLVÉ A TUS RECUERDOS</p>
      <h1 id="recovery-title">{title}</h1>
      <p className={styles.intro}>{intro}</p>
      {children}
      <p className={styles.switchMode}>
        <Link href="/auth/login">Volver a iniciar sesión</Link>
      </p>
    </section>
  );
}

// Cancelamos el pedido si el usuario abandona la pantalla y evitamos envíos duplicados.
function usePendingRequestRef() {
  const requestRef = useRef<AbortController | null>(null);
  useEffect(() => () => requestRef.current?.abort(), []);
  return requestRef;
}

export function RequestPasswordRecoveryForm() {
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const requestRef = usePendingRequestRef();

  // Antes de activar los eventos, evitamos que se escriba un email que React pueda borrar al cargar.
  useEffect(() => {
    setReady(true);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready || requestRef.current) return;
    const validation = validateRecoveryEmail(email);
    setEmailError(validation);
    setError("");
    if (validation) return;
    const controller = new AbortController();
    requestRef.current = controller;
    setSubmitting(true);
    try {
      await requestPasswordRecovery(email, controller.signal);
      if (!controller.signal.aborted) setSent(true);
    } catch (cause) {
      if (!controller.signal.aborted) {
        setError(recoveryErrorMessage(cause));
        if (cause instanceof AuthError) setEmailError(cause.fields.email ?? "");
      }
    } finally {
      requestRef.current = null;
      if (!controller.signal.aborted) setSubmitting(false);
    }
  }

  return (
    <RecoveryCard
      title={sent ? "Revisá tu correo" : "Recuperá tu cuenta"}
      intro={
        sent
          ? "Revisá también la carpeta de spam. El correo puede tardar unos minutos en llegar."
          : "Ingresá el email de tu cuenta y te enviaremos un enlace para elegir una nueva contraseña."
      }
    >
      {sent ? (
        <>
          <p className={styles.successBanner} role="status">
            {recoveryRequestedMessage}
          </p>
          <button
            className={styles.secondary}
            type="button"
            onClick={() => {
              setSent(false);
              setEmail("");
            }}
          >
            Usar otro correo
          </button>
        </>
      ) : (
        <>
          {error && (
            <p className={styles.errorBanner} role="alert">
              {error}
            </p>
          )}
          <form className={styles.form} onSubmit={submit} noValidate aria-busy={submitting}>
            <label className={styles.field} htmlFor="recovery-email">
              Email
            </label>
            <span className={styles.inputShell}>
              <Mail aria-hidden="true" size={18} />
              <input
                id="recovery-email"
                name="email"
                type="email"
                autoComplete="email"
                maxLength={200}
                required
                disabled={!ready || submitting}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={!!emailError}
                aria-describedby={emailError ? "email-error" : undefined}
              />
            </span>
            {emailError && (
              <small id="email-error" role="alert">
                {emailError}
              </small>
            )}
            <button className={styles.submit} type="submit" disabled={!ready || submitting}>
              {submitting && <Loader2 className={styles.spinner} size={18} aria-hidden="true" />}
              {submitting ? "Enviando…" : "Enviar enlace"}
            </button>
          </form>
        </>
      )}
    </RecoveryCard>
  );
}

function NewPasswordField({
  name,
  label,
  value,
  onChange,
  error,
  disabled,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={styles.field}>
      <label htmlFor={name}>{label}</label>
      <span className={styles.inputShell}>
        <LockKeyhole aria-hidden="true" size={18} />
        <input
          id={name}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          minLength={8}
          maxLength={100}
          required
          disabled={disabled}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : "password-hint"}
        />
        <button
          className={styles.reveal}
          type="button"
          disabled={disabled}
          onClick={() => setVisible(!visible)}
          aria-label={`${visible ? "Ocultar" : "Mostrar"} ${label.toLowerCase()}`}
          aria-pressed={visible}
        >
          {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </span>
      {error && (
        <small id={`${name}-error`} role="alert">
          {error}
        </small>
      )}
    </div>
  );
}

export function ResetPasswordForm() {
  const [state, setState] = useState<"reading" | "ready" | "invalid" | "done">("reading");
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const didReadToken = useRef(false);
  const requestRef = usePendingRequestRef();

  useEffect(() => {
    // El enlace trae el token después del #. Se guarda sólo en memoria y se quita de la dirección.
    // La marca evita leerlo otra vez cuando React verifica los efectos en desarrollo.
    if (didReadToken.current) return;
    didReadToken.current = true;
    const value = readRecoveryToken(window.location.hash);
    window.history.replaceState(
      window.history.state,
      "",
      window.location.pathname + window.location.search,
    );
    setToken(value);
    setState(value ? "ready" : "invalid");
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || requestRef.current) return;
    const validation = validateNewPassword(password, confirmation);
    setFieldErrors(validation);
    setError("");
    if (Object.keys(validation).length) return;
    const controller = new AbortController();
    requestRef.current = controller;
    setSubmitting(true);
    try {
      await resetPassword(
        { token, nuevaContrasena: password, confirmacionContrasena: confirmation },
        controller.signal,
      );
      if (!controller.signal.aborted) {
        clearStoredSession();
        setToken(null);
        setPassword("");
        setConfirmation("");
        setState("done");
      }
    } catch (cause) {
      if (!controller.signal.aborted) {
        if (isInvalidRecoveryLink(cause)) {
          setToken(null);
          setPassword("");
          setConfirmation("");
          setState("invalid");
        } else {
          setError(recoveryErrorMessage(cause));
          if (cause instanceof AuthError) setFieldErrors(cause.fields);
        }
      }
    } finally {
      requestRef.current = null;
      if (!controller.signal.aborted) setSubmitting(false);
    }
  }

  const titles = {
    reading: "Nueva contraseña",
    ready: "Nueva contraseña",
    invalid: "Pedí un nuevo enlace",
    done: "Contraseña actualizada",
  };
  const intros = {
    reading: "Preparando el formulario…",
    ready: "Elegí una contraseña para volver a entrar a tu cuenta.",
    invalid:
      "Este enlace no es válido, ya fue utilizado o venció. También podés volver a abrir el enlace completo desde el correo.",
    done: "Ya podés iniciar sesión con tu nueva contraseña.",
  };
  return (
    <RecoveryCard title={titles[state]} intro={intros[state]}>
      {state === "reading" && <p role="status">Cargando…</p>}
      {state === "invalid" && (
        <Link className={styles.secondary} href="/auth/recuperar">
          Solicitar otro enlace
        </Link>
      )}
      {state === "done" && (
        <p className={styles.successBanner} role="status">
          Por seguridad, cerramos las sesiones anteriores de tu cuenta.
        </p>
      )}
      {state === "ready" && (
        <>
          {error && (
            <p className={styles.errorBanner} role="alert">
              {error}
            </p>
          )}
          <form className={styles.form} onSubmit={submit} noValidate aria-busy={submitting}>
            <NewPasswordField
              name="nuevaContrasena"
              label="Nueva contraseña"
              value={password}
              onChange={setPassword}
              error={fieldErrors.nuevaContrasena}
              disabled={submitting}
            />
            <NewPasswordField
              name="confirmacionContrasena"
              label="Confirmar contraseña"
              value={confirmation}
              onChange={setConfirmation}
              error={fieldErrors.confirmacionContrasena}
              disabled={submitting}
            />
            <small id="password-hint">Usá entre 8 y 100 caracteres.</small>
            <button className={styles.submit} type="submit" disabled={submitting}>
              {submitting && <Loader2 className={styles.spinner} size={18} aria-hidden="true" />}
              {submitting ? "Guardando…" : "Guardar contraseña"}
            </button>
          </form>
        </>
      )}
    </RecoveryCard>
  );
}

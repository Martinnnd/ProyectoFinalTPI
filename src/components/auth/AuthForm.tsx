"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, LockKeyhole, Mail, User } from "lucide-react";
import { AuthError } from "./authErrors";
import { useAuth } from "./AuthProvider";
import styles from "./auth.module.css";

type Mode = "login" | "registro";

export default function AuthForm({
  mode,
  returnTo = "/explorar",
}: {
  mode: Mode;
  returnTo?: string;
}) {
  const router = useRouter();
  const { login, register } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const isRegister = mode === "registro";

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {};
    const cleanEmail = email.trim();
    if (isRegister && (username.trim().length < 3 || username.trim().length > 50)) {
      errors.username = "El nombre debe tener entre 3 y 50 caracteres.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errors.email = "Ingresá un email válido.";
    } else if (cleanEmail.length > 200) {
      errors.email = "El email no puede superar los 200 caracteres.";
    }
    if (isRegister && (contrasena.length < 8 || contrasena.length > 100)) {
      errors.contrasena = "La contraseña debe tener entre 8 y 100 caracteres.";
    } else if (!contrasena) {
      errors.contrasena = "Ingresá tu contraseña.";
    }
    if (isRegister && contrasena !== confirmation) {
      errors.confirmation = "Las contraseñas no coinciden.";
    }
    return errors;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validate();
    setFieldErrors(validationErrors);
    setError("");
    if (Object.keys(validationErrors).length) return;

    setSubmitting(true);
    try {
      const credentials = { email: email.trim().toLowerCase(), contrasena };
      if (isRegister) {
        await register({ ...credentials, username: username.trim() });
      } else {
        await login(credentials);
      }
      router.replace(returnTo);
    } catch (cause) {
      if (cause instanceof AuthError) {
        setError(cause.message);
        setFieldErrors(cause.fields);
      } else {
        setError(cause instanceof Error ? cause.message : "Ocurrió un error inesperado.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className={styles.card} aria-labelledby="auth-title">
      <Link className={styles.brand} href="/" aria-label="Volver al inicio de Nostalgiar">
        <Image src="/landing/isotipo-actual.png" alt="" width={60} height={42} priority />
        <span>Nostalgiar</span>
      </Link>

      <p className={styles.eyebrow}>{isRegister ? "EMPEZÁ A RECORDAR" : "QUÉ BUENO VOLVER A VERTE"}</p>
      <h1 id="auth-title">{isRegister ? "Creá tu cuenta" : "Iniciá sesión"}</h1>
      <p className={styles.intro}>
        {isRegister
          ? "Guardá tus recuerdos y conectalos con personas, épocas y lugares."
          : "Entrá para compartir recuerdos y continuar tus conversaciones."}
      </p>

      {error && <div className={styles.errorBanner} role="alert">{error}</div>}

      <form className={styles.form} onSubmit={submit} noValidate>
        {isRegister && (
          <label className={styles.field}>
            <span>Nombre de usuario</span>
            <span className={styles.inputShell}>
              <User aria-hidden="true" size={18} />
              <input
                name="username"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                aria-invalid={!!fieldErrors.username}
                aria-describedby={fieldErrors.username ? "username-error" : undefined}
                minLength={3}
                maxLength={50}
                required
              />
            </span>
            {fieldErrors.username && <small id="username-error">{fieldErrors.username}</small>}
          </label>
        )}

        <label className={styles.field}>
          <span>Email</span>
          <span className={styles.inputShell}>
            <Mail aria-hidden="true" size={18} />
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
              maxLength={200}
              required
            />
          </span>
          {fieldErrors.email && <small id="email-error">{fieldErrors.email}</small>}
        </label>

        <label className={styles.field}>
          <span>Contraseña</span>
          <span className={styles.inputShell}>
            <LockKeyhole aria-hidden="true" size={18} />
            <input
              type={showPassword ? "text" : "password"}
              name="contrasena"
              autoComplete={isRegister ? "new-password" : "current-password"}
              value={contrasena}
              onChange={(event) => setContrasena(event.target.value)}
              aria-invalid={!!fieldErrors.contrasena}
              aria-describedby={fieldErrors.contrasena ? "password-error" : undefined}
              minLength={isRegister ? 8 : undefined}
              maxLength={100}
              required
            />
            <button
              className={styles.reveal}
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
          {fieldErrors.contrasena && <small id="password-error">{fieldErrors.contrasena}</small>}
        </label>

        {isRegister && (
          <label className={styles.field}>
            <span>Confirmar contraseña</span>
            <span className={styles.inputShell}>
              <LockKeyhole aria-hidden="true" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                name="confirmation"
                autoComplete="new-password"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                aria-invalid={!!fieldErrors.confirmation}
                aria-describedby={fieldErrors.confirmation ? "confirmation-error" : undefined}
                required
              />
            </span>
            {fieldErrors.confirmation && <small id="confirmation-error">{fieldErrors.confirmation}</small>}
          </label>
        )}

        <button className={styles.submit} type="submit" disabled={submitting}>
          {submitting && <Loader2 className={styles.spinner} size={18} aria-hidden="true" />}
          {submitting ? "Procesando…" : isRegister ? "Crear mi cuenta" : "Ingresar"}
        </button>
      </form>

      <p className={styles.switchMode}>
        {isRegister ? "¿Ya tenés una cuenta?" : "¿Todavía no tenés cuenta?"}{" "}
        <Link href={isRegister ? "/auth/login" : "/auth/registro"}>
          {isRegister ? "Iniciá sesión" : "Registrate"}
        </Link>
      </p>
      <Link className={styles.back} href="/">← Volver al inicio</Link>
    </section>
  );
}

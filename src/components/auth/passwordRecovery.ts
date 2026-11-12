import { AuthError } from "./authErrors";

export const recoveryRequestedMessage =
  "Si existe una cuenta con ese correo, te enviaremos un enlace para restablecer la contraseña.";

// El backend envía el código de un solo uso después del # del enlace.
export function readRecoveryToken(fragment: string): string | null {
  const values = new URLSearchParams(fragment.replace(/^#/, "")).getAll("token");
  if (values.length !== 1 || !/^[a-f\d]{32}\.[A-Za-z\d_-]{43}$/i.test(values[0])) return null;
  return values[0];
}

export function validateRecoveryEmail(email: string): string {
  const value = email.trim();
  return value.length <= 200 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    ? ""
    : "Ingresá un email válido.";
}

export function validateNewPassword(
  password: string,
  confirmation: string,
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (password.length < 8 || password.length > 100)
    errors.nuevaContrasena = "La contraseña debe tener entre 8 y 100 caracteres.";
  if (!confirmation) errors.confirmacionContrasena = "Tenés que confirmar la contraseña.";
  else if (password !== confirmation)
    errors.confirmacionContrasena = "Las contraseñas no coinciden.";
  return errors;
}

export function recoveryErrorMessage(error: unknown): string {
  if (error instanceof AuthError) {
    if (error.status === 429)
      return "Alcanzaste el límite de intentos. Esperá unos minutos y volvé a probar.";
    if (error.status >= 500)
      return "No pudimos completar la recuperación en este momento. Intentá de nuevo más tarde.";
    return error.message;
  }
  return "No pudimos conectar con el servidor. Revisá tu conexión e intentá de nuevo.";
}

export function isInvalidRecoveryLink(error: unknown): boolean {
  return (
    error instanceof AuthError &&
    error.status === 400 &&
    !error.fields.nuevaContrasena &&
    !error.fields.confirmacionContrasena
  );
}

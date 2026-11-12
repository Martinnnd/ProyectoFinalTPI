import { API_BASE_URL } from "../../apiConfig";
import { rememberLoginAchievements } from "../../loginAchievements";
import type { AchievementState } from "../../profileApi";
import { toAuthError } from "./authErrors";
import type {
  AuthSession,
  LoginCredentials,
  RegisterCredentials,
  ResetPasswordCredentials,
} from "./authTypes";

const authHeaders = {
  "Content-Type": "application/json",
  "X-Nostalgiar-Request": "1",
};

async function postAuth(path: string, body?: object, signal?: AbortSignal): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/auth/${path}`, {
      method: "POST",
      headers: authHeaders,
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(10_000)])
        : AbortSignal.timeout(10_000),
    });
  } catch {
    throw new Error("No pudimos conectar con el servidor. Comprobá que el backend esté encendido.");
  }

  if (!response.ok) throw await toAuthError(response);
  return response;
}

async function authRequest(path: string, body?: object): Promise<AuthSession> {
  const response = await postAuth(path, body);
  const { logrosNuevos, ...session }: AuthSession & { logrosNuevos?: AchievementState[] } =
    await response.json();
  rememberLoginAchievements(session.usuarioId, logrosNuevos);
  return session;
}

export function loginRequest(credentials: LoginCredentials): Promise<AuthSession> {
  return authRequest("login", credentials);
}

export async function requestPasswordRecovery(email: string, signal?: AbortSignal): Promise<void> {
  await postAuth("recuperar-contrasena", { email: email.trim().toLowerCase() }, signal);
}

export async function resetPassword(
  credentials: ResetPasswordCredentials,
  signal?: AbortSignal,
): Promise<void> {
  await postAuth("restablecer-contrasena", credentials, signal);
}

export function registerRequest({
  username,
  email,
  contrasena,
}: RegisterCredentials): Promise<AuthSession> {
  return authRequest("registro", {
    username,
    email,
    contraseña: contrasena,
  });
}

let refreshPromise: Promise<AuthSession> | null = null;

export function refreshSessionRequest(): Promise<AuthSession> {
  refreshPromise ??= authRequest("refresh").finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

export async function logoutRequest(): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: { "X-Nostalgiar-Request": "1" },
      credentials: "include",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new Error("No pudimos cerrar la sesión en el servidor. Intentá nuevamente.");
  }

  if (!response.ok) throw await toAuthError(response);
}

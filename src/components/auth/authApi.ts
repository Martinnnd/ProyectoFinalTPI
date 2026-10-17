import { API_BASE_URL } from "../../apiConfig";
import { toAuthError } from "./authErrors";
import type {
  AuthSession,
  LoginCredentials,
  RegisterCredentials,
} from "./authTypes";

const authHeaders = {
  "Content-Type": "application/json",
  "X-Nostalgiar-Request": "1",
};

async function authRequest(path: string, body?: object): Promise<AuthSession> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/auth/${path}`, {
      method: "POST",
      headers: authHeaders,
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new Error(
      "No pudimos conectar con el servidor. Comprobá que el backend esté encendido.",
    );
  }

  if (!response.ok) throw await toAuthError(response);
  return response.json() as Promise<AuthSession>;
}

export function loginRequest(credentials: LoginCredentials): Promise<AuthSession> {
  return authRequest("login", credentials);
}

export function registerRequest({
  username,
  email,
  contrasena,
}: RegisterCredentials): Promise<AuthSession> {
  return authRequest("registro", {
    username,
    email,
    "contraseña": contrasena,
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

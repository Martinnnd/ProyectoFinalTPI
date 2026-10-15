export interface AuthSession {
  token: string;
  usuarioId: number;
  username: string;
  email: string;
  esAdmin: boolean;
}

export interface LoginCredentials {
  email: string;
  contrasena: string;
}

export interface RegisterCredentials extends LoginCredentials {
  username: string;
}

export type AuthStatus = "loading" | "authenticated" | "anonymous";

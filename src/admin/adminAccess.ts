import type { AuthSession, AuthStatus } from "../components/auth/authTypes";

export type AdminAccess = "loading" | "allowed" | "login" | "forbidden";

export function resolveAdminAccess(status: AuthStatus, session: AuthSession | null): AdminAccess {
  if (status === "loading") return "loading";
  if (!session) return "login";
  return session.esAdmin ? "allowed" : "forbidden";
}

"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../components/auth/AuthProvider";
import { resolveAdminAccess } from "./adminAccess";
import styles from "./admin.module.css";

export default function AdminGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { session, status } = useAuth();
  const access = resolveAdminAccess(status, session);

  useEffect(() => {
    if (access === "login") router.replace("/auth/login?returnTo=/admin");
    if (access === "forbidden") router.replace("/explorar");
  }, [access, router]);

  if (access === "allowed") return children;
  return (
    <main className={styles.gate}>
      <ShieldCheck aria-hidden="true" />
      <strong>{access === "forbidden" ? "Acceso restringido" : "Verificando acceso…"}</strong>
      <span>
        {access === "forbidden"
          ? "Este espacio está reservado para administradores."
          : "Estamos restaurando tu sesión de Nostalgiar."}
      </span>
    </main>
  );
}

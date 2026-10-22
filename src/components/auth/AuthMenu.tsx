"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, UserRound } from "lucide-react";
import { useAuth } from "./AuthProvider";
import styles from "./AuthMenu.module.css";

type AuthMenuProps = {
  profileActive?: boolean;
  onOpenProfile: () => void;
};

export default function AuthMenu({ profileActive = false, onOpenProfile }: AuthMenuProps) {
  const router = useRouter();
  const { session, status, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  if (status === "loading") {
    return <div className={styles.slot} aria-hidden="true" />;
  }

  if (!session) {
    return (
      <div className={styles.slot}>
        <button
          type="button"
          onClick={() => router.push("/auth/login?returnTo=/explorar")}
          aria-label="Iniciar sesión"
        >
          <LogIn />
          <span>Ingresar</span>
        </button>
      </div>
    );
  }

  return (
    <div className={styles.slot}>
      <button
        type="button"
        aria-label="Abrir menú de usuario"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
        title={`Sesión: ${session.username}`}
      >
        <UserRound />
        <span className={styles.username}>{session.username}</span>
      </button>
      {open && (
        <div className={styles.menu} role="menu">
          <strong>{session.username}</strong>
          <span>{session.email}</span>
          {logoutError && <span role="alert">{logoutError}</span>}
          <button
            type="button"
            role="menuitem"
            aria-current={profileActive ? "page" : undefined}
            className={styles.profileAction}
            onClick={() => {
              onOpenProfile();
              setOpen(false);
            }}
          >
            <UserRound size={16} /> Perfil
          </button>
          <button
            type="button"
            role="menuitem"
            className={styles.logoutAction}
            onClick={async () => {
              setLogoutError("");
              try {
                await logout();
                setOpen(false);
              } catch (error) {
                setLogoutError(error instanceof Error ? error.message : "No pudimos cerrar la sesión.");
              }
            }}
          >
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { LogOut } from "lucide-react";
import styles from "../../app/landing.module.css";
import { useAuth } from "../auth/AuthProvider";

export default function LandingHeader() {
  const { session, logout } = useAuth();

  return (
    <nav className={styles.navigation} aria-label="Navegación principal">
      <Link className={styles.brand} href="/" aria-label="Nostalgiar, inicio">
        <Image
          className={styles.headerLogo}
          src="/landing/isotipo-actual.png"
          alt=""
          width={128}
          height={88}
          priority
        />
        <span className={styles.brandName}>Nostalgiar</span>
      </Link>
      <div className={styles.navActions}>
        {!session && (
          <>
            <Link className={styles.navSecondary} href="/auth/login">
              Iniciar sesión
            </Link>
            <Link className={styles.navLink} href="/auth/registro">
              Crear cuenta
            </Link>
          </>
        )}
        {session && (
          <>
            <span className={styles.navUser}>Hola, {session.username}</span>
            <Link className={styles.navLink} href="/explorar">
              Entrar al mapa
            </Link>
            <button className={styles.navLogout} type="button" onClick={logout}>
              <LogOut size={16} aria-hidden="true" />
              <span>Cerrar sesión</span>
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

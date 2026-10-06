import Image from "next/image";
import Link from "next/link";
import styles from "../../app/landing.module.css";

export default function LandingHeader() {
  return (
    <nav className={styles.navigation} aria-label="Navegación principal">
      <Link className={styles.brand} href="/" aria-label="Nostalgiar, inicio">
        <Image
          className={styles.headerLogo}
          src="/landing/nostalgiar-logo.png"
          alt="Nostalgiar"
          width={2170}
          height={725}
          priority
        />
      </Link>
      <Link className={styles.navLink} href="/explorar">
        Entrar al mapa
      </Link>
    </nav>
  );
}

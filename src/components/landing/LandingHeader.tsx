import Image from "next/image";
import Link from "next/link";
import styles from "../../app/landing.module.css";

export default function LandingHeader() {
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
      <Link className={styles.navLink} href="/explorar">
        Entrar al mapa
      </Link>
    </nav>
  );
}

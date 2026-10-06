import Image from "next/image";
import Link from "next/link";
import { Facebook, Instagram, Youtube } from "lucide-react";
import styles from "../../app/landing.module.css";

export default function LandingFooter() {
  return (
    <footer className={styles.footer} id="contacto">
      <div className={styles.footerGrid}>
        <div className={styles.footerBrand}>
          <Image
            className={styles.footerLogo}
            src="/landing/nostalgiar-logo.png"
            alt="Nostalgiar"
            width={2170}
            height={725}
          />
          <p>Un día. Un momento. Un lugar.</p>
          <div className={styles.socialLinks} aria-label="Redes sociales">
            <a href="https://www.instagram.com/" target="_blank" rel="noreferrer">
              <Instagram size={17} aria-hidden="true" />
              <span>Instagram</span>
            </a>
            <a href="https://www.facebook.com/" target="_blank" rel="noreferrer">
              <Facebook size={17} aria-hidden="true" />
              <span>Facebook</span>
            </a>
            <a href="https://www.youtube.com/" target="_blank" rel="noreferrer">
              <Youtube size={18} aria-hidden="true" />
              <span>YouTube</span>
            </a>
          </div>
        </div>

        <div className={styles.footerColumn}>
          <h2>Sobre nosotros</h2>
          <a href="#historia">Nuestra historia</a>
          <a href="#mapa">El mapa de recuerdos</a>
          <a href="#epocas">Las épocas</a>
        </div>

        <div className={styles.footerColumn}>
          <h2>Contacto</h2>
          <a href="mailto:contacto@nostalgiar.com">contacto@nostalgiar.com</a>
          <Link href="/explorar">Entrar a Nostalgiar</Link>
        </div>
      </div>

      <div className={styles.footerBottom}>
        <small>© {new Date().getFullYear()} Nostalgiar</small>
        <small>Historias, lugares y música de nuestras épocas.</small>
      </div>
    </footer>
  );
}

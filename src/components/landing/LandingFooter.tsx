import Image from "next/image";
import Link from "next/link";
import { Instagram, Music2 } from "lucide-react";
import styles from "../../app/landing.module.css";

export default function LandingFooter() {
  return (
    <footer className={styles.footer} id="contacto" data-landing-footer>
      <div className={styles.footerGrid}>
        <div className={styles.footerBrand} data-footer-group data-landing-animate>
          <Image
            className={styles.footerLogo}
            src="/landing/isotipo-actual.png"
            alt=""
            width={128}
            height={88}
          />
          <span className={styles.footerBrandName}>Nostalgiar</span>
          <p>Un día. Un momento. Un lugar.</p>
          <div className={styles.socialLinks} aria-label="Redes sociales">
            <a href="https://www.instagram.com/nostalgi_ar/" target="_blank" rel="noopener noreferrer">
              <Instagram size={17} aria-hidden="true" />
              <span>Instagram</span>
            </a>
            <a href="https://www.tiktok.com/@nostalgi_ar?_r=1&_t=ZS-9Aw2DjgW7i3" target="_blank" rel="noopener noreferrer">
              <Music2 size={17} aria-hidden="true" />
              <span>TikTok</span>
            </a>
          </div>
        </div>

        <div className={styles.footerColumn} data-footer-group data-landing-animate>
          <h2>Sobre nosotros</h2>
          <a href="#historia">Nuestra historia</a>
          <a href="#mapa">El mapa de recuerdos</a>
          <a href="#epocas">Las épocas</a>
        </div>

        <div className={styles.footerColumn} data-footer-group data-landing-animate>
          <h2>Contacto</h2>
          <a href="mailto:contacto@nostalgiar.com">contacto@nostalgiar.com</a>
          <Link href="/explorar">Entrar a Nostalgiar</Link>
        </div>
      </div>

      <div className={styles.footerBottom} data-footer-group data-landing-animate>
        <small>© {new Date().getFullYear()} Nostalgiar</small>
        <small>Historias, lugares y música de nuestras épocas.</small>
      </div>
    </footer>
  );
}

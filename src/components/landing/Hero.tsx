import Link from "next/link";
import { MapPin } from "lucide-react";
import styles from "../../app/landing.module.css";

export default function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="landing-title">
      <div className={styles.heroPins} aria-hidden="true">
        <span className={`${styles.heroPin} ${styles.heroPinOne}`} data-hero-pin data-landing-animate>
          <MapPin />
        </span>
        <span className={`${styles.heroPin} ${styles.heroPinTwo}`} data-hero-pin data-landing-animate>
          <MapPin />
        </span>
        <span className={`${styles.heroPin} ${styles.heroPinThree}`} data-hero-pin data-landing-animate>
          <MapPin />
        </span>
        <span className={`${styles.heroPin} ${styles.heroPinFour}`} data-hero-pin data-landing-animate>
          <MapPin />
        </span>
      </div>
      <div className={styles.heroCopy}>
        <p className={styles.eyebrow} data-hero-eyebrow data-landing-animate>HISTORIAS QUE NOS VUELVEN A ENCONTRAR</p>
        <h1 className={styles.heroTitle} id="landing-title" data-hero-title data-landing-animate>
          Nostalgiar
        </h1>
        <p className={styles.heroTagline} data-hero-tagline data-landing-animate>Un día. Un momento. Un lugar.</p>
        <div className={styles.actions} data-hero-actions>
          <Link className={styles.primaryAction} href="/explorar">
            Explorar recuerdos <span aria-hidden="true">→</span>
          </Link>
          <a className={styles.secondaryAction} href="#epocas">
            Conocer las épocas
          </a>
        </div>
      </div>
    </section>
  );
}

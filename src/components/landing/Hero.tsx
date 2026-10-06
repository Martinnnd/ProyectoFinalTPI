import Link from "next/link";
import { MapPin } from "lucide-react";
import styles from "../../app/landing.module.css";

export default function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="landing-title">
      <div className={styles.heroPins} aria-hidden="true">
        <span className={`${styles.heroPin} ${styles.heroPinOne}`}>
          <MapPin />
        </span>
        <span className={`${styles.heroPin} ${styles.heroPinTwo}`}>
          <MapPin />
        </span>
        <span className={`${styles.heroPin} ${styles.heroPinThree}`}>
          <MapPin />
        </span>
        <span className={`${styles.heroPin} ${styles.heroPinFour}`}>
          <MapPin />
        </span>
      </div>
      <div className={styles.heroCopy}>
        <p className={styles.eyebrow}>HISTORIAS QUE NOS VUELVEN A ENCONTRAR</p>
        <h1 className={styles.heroTitle} id="landing-title">
          Nostalgiar
        </h1>
        <p className={styles.heroTagline}>Un día. Un momento. Un lugar.</p>
        <div className={styles.actions}>
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

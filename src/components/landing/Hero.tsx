import Link from "next/link";
import type { ReactNode } from "react";
import { MapPin, ArrowUpRight, Compass } from "lucide-react";
import styles from "../../app/landing.module.css";

export default function Hero({ dial }: { dial?: ReactNode }) {
  return (
    <section className={styles.hero} aria-labelledby="landing-title">
      <div className={styles.heroPins} aria-hidden="true">
        <span
          className={`${styles.heroPin} ${styles.heroPinOne}`}
          data-hero-pin
          data-landing-animate
        >
          <MapPin />
        </span>
        <span
          className={`${styles.heroPin} ${styles.heroPinTwo}`}
          data-hero-pin
          data-landing-animate
        >
          <MapPin />
        </span>
        <span
          className={`${styles.heroPin} ${styles.heroPinThree}`}
          data-hero-pin
          data-landing-animate
        >
          <MapPin />
        </span>
        <span
          className={`${styles.heroPin} ${styles.heroPinFour}`}
          data-hero-pin
          data-landing-animate
        >
          <MapPin />
        </span>
      </div>
      <div className={styles.heroCopy}>
        <p className={styles.eyebrow} data-hero-eyebrow data-landing-animate>
          HISTORIAS QUE NOS VUELVEN A ENCONTRAR
        </p>
        <h1 className={styles.heroTitle} id="landing-title" data-hero-title data-landing-animate>
          Nostalgiar
        </h1>
        <p className={styles.heroTagline} data-hero-tagline data-landing-animate>
          Un día. Un momento. Un lugar.
        </p>
        <div className={styles.actions} data-hero-actions>
          <Link className={`${styles.primaryAction} ${styles.exploreAction}`} href="/explorar">
            <span className={styles.exploreActionPin} aria-hidden="true">
              <MapPin size={18} />
            </span>
            Explorar recuerdos <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
          <a className={`${styles.secondaryAction} ${styles.epochsAction}`} href="#epocas">
            <span className={styles.epochsActionDial} aria-hidden="true">
              <Compass size={19} />
            </span>
            <span>Conocer las épocas</span>
          </a>
        </div>
      </div>
      {dial}
    </section>
  );
}

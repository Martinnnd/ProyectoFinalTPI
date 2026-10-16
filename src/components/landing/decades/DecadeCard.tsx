import Link from "next/link";
import type { LandingEra } from "./landingEraThemes";
import styles from "./decades.module.css";

type DecadeCardProps = {
  era: LandingEra;
};

export default function DecadeCard({ era }: DecadeCardProps) {
  return (
    <Link
      className={styles.decadeCard}
      href={era.href}
      data-decade-card
      data-era={era.id}
      data-landing-animate
      aria-label={`Explorar recuerdos de los años ${era.year}`}
    >
      <span className={styles.cardChrome}>
        <span>{era.chromeTitle}</span>
        <i aria-hidden="true">— □ ×</i>
      </span>

      <span className={styles.cardBody}>
        <span className={styles.decadeNumber}>{era.year}</span>
        <span className={styles.decadeCopy}>
          <strong>{era.title}</strong>
          <small>{era.description}</small>
        </span>
      </span>

      <span className={styles.cardFooter}>
        <small>{era.chromeStatus}</small>
        <span className={styles.cardArrow} aria-hidden="true">
          ↗
        </span>
      </span>
    </Link>
  );
}

import Link from "next/link";
import styles from "../../app/landing.module.css";

export default function MemoryMapSection() {
  return (
    <section className={styles.mapSection} id="mapa" aria-labelledby="map-title">
      <div className={styles.memoryMap} aria-hidden="true">
        <span className={`${styles.ring} ${styles.ringOne}`} />
        <span className={`${styles.ring} ${styles.ringTwo}`} />
        <span className={`${styles.pin} ${styles.pinOne}`}>
          <i>1977</i>
        </span>
        <span className={`${styles.pin} ${styles.pinTwo}`}>
          <i>1985</i>
        </span>
        <span className={`${styles.pin} ${styles.pinThree}`}>
          <i>1994</i>
        </span>
        <span className={`${styles.pin} ${styles.pinFour}`}>
          <i>2003</i>
        </span>
        <div className={styles.mapMessage}>
          <small>CADA PIN GUARDA</small>
          <strong>una historia</strong>
        </div>
      </div>

      <div className={styles.mapSectionCopy}>
        <p className={styles.eyebrow}>UN MAPA HECHO DE RECUERDOS</p>
        <h2 id="map-title">Cada lugar puede llevarte de vuelta.</h2>
        <p>
          Explorá historias marcadas alrededor del mundo, filtrá por década y
          descubrí qué recuerdos quedaron unidos a cada rincón.
        </p>
        <Link className={styles.mapAction} href="/explorar">
          Recorrer el mapa <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}

import DecadeAtmosphere from "./decades/DecadeAtmosphere";
import DecadeCard from "./decades/DecadeCard";
import styles from "./decades/decades.module.css";
import { landingEras } from "./decades/landingEraThemes";

export default function DecadesSection() {
  return (
    <section
      className={styles.decades}
      id="epocas"
      aria-labelledby="eras-title"
      data-decades-section
    >
      <DecadeAtmosphere />
      <div className={styles.sectionHeading} data-decades-heading>
        <div className={styles.headingCopy}>
          <p className={styles.eyebrow}>CUATRO DÉCADAS, MILES DE RECUERDOS</p>
          <h2 id="eras-title">Deslizá para viajar en el tiempo.</h2>
        </div>
        <div className={styles.eraIndicator} aria-hidden="true">
          <span className={styles.indicatorDefault}>Canal 70 · En el aire</span>
          <span data-era-label="1970">Canal 70 · En el aire</span>
          <span data-era-label="1980">VHS · Reproduciendo</span>
          <span data-era-label="1990">Nostalgiar 95</span>
          <span data-era-label="2000">Messenger · Conectado</span>
        </div>
      </div>
      <div className={styles.decadeGrid}>
        {landingEras.map((era) => (
          <DecadeCard key={era.id} era={era} />
        ))}
      </div>
    </section>
  );
}

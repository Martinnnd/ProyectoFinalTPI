import styles from "./decades.module.css";
import { landingEras } from "./landingEraThemes";

export default function DecadeAtmosphere() {
  return (
    <div className={styles.atmosphere} aria-hidden="true">
      {landingEras.map((era) => (
        <span
          key={era.id}
          className={styles.atmosphereLayer}
          data-era-scene={era.id}
        >
          {era.id === "1970" && (
            <span className={styles.tvControlPanel}>
              <i className={styles.tvDial}><b>CH</b></i>
              <i className={styles.tvDial}><b>VOL</b></i>
              <i className={styles.tvSpeaker} />
              <i className={styles.tvPower} />
            </span>
          )}
        </span>
      ))}
      <span className={styles.texture} />
    </div>
  );
}

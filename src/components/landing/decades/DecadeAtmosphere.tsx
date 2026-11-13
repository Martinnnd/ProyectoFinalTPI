import styles from "./decades.module.css";
import { landingEras } from "./landingEraThemes";

export default function DecadeAtmosphere() {
  return (
    <div className={styles.atmosphere} aria-hidden="true">
      {landingEras.map((era) => (
        <span key={era.id} className={styles.atmosphereLayer} data-era-scene={era.id}>
          {era.id === "1970" && (
            <span className={styles.tvControlPanel}>
              <i className={styles.tvDial}>
                <b>CH</b>
              </i>
              <i className={styles.tvDial}>
                <b>VOL</b>
              </i>
              <i className={styles.tvSpeaker} />
              <i className={styles.tvPower} />
            </span>
          )}
          {era.id === "1980" && (
            <span className={styles.arcadeCabinet}>
              <span className={styles.screenGlass} />
              <span className={styles.arcadeMarquee}>
                NOSTALGIAR <small>ARCADE SYSTEM · 1980</small>
              </span>
              <span className={styles.arcadeDeck}>
                <i className={styles.joystick} />
                <span className={styles.arcadeButtons}>
                  <i />
                  <i />
                  <i />
                </span>
                <small>1 PLAYER · INSERT COIN</small>
              </span>
            </span>
          )}
          {(era.id === "1990" || era.id === "2000") && (
            <span className={styles.monitorCabinet}>
              <span className={styles.screenGlass} />
              <span className={styles.monitorChin}>
                <b>NOSTALGIAR</b>
                <span className={styles.monitorVents} />
                <span className={styles.monitorControls}>
                  <i />
                  <i />
                  <i />
                  <em />
                </span>
              </span>
            </span>
          )}
          {era.id === "2010" && (
            <span className={styles.pocketAtmosphere}>
              <span className={styles.pocketLens} />
              <span className={styles.pocketPhoto}>
                <i />
                <b>UN MOMENTO · 2012</b>
              </span>
              <span className={styles.pocketHome} />
            </span>
          )}
          {era.id === "2020" && <span className={styles.nowAtmosphere} />}
        </span>
      ))}
      <span className={styles.texture} />
    </div>
  );
}

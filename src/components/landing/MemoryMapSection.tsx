"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "../../app/landing.module.css";

export default function MemoryMapSection() {
  const [era, setEra] = useState('1970');
  const section = useRef<HTMLElement>(null);
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let inView = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    const sync = () => {
      clearInterval(timer);
      if (motion.matches || document.hidden || !inView) return;
      timer = setInterval(() => setEra(current => {
        const eras = ['1970', '1980', '1990', '2000', '2010'];
        return eras[(eras.indexOf(current) + 1) % eras.length];
      }), 6500);
    };
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); }, { threshold: .2 });
    if (section.current) observer.observe(section.current);
    motion.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    return () => { clearInterval(timer); observer.disconnect(); motion.removeEventListener('change', sync); document.removeEventListener('visibilitychange', sync); };
  }, []);
  return (
    <section ref={section} className={`${styles.mapSection} ${styles.temporalMapSection}`} id="mapa" aria-labelledby="map-title" data-map-section data-map-era={era}>
      <div className={styles.memoryMap} aria-hidden="true" data-memory-map data-landing-animate>
        <span className={`${styles.ring} ${styles.ringOne}`} data-map-ring="outer" data-landing-animate />
        <span className={`${styles.ring} ${styles.ringTwo}`} data-map-ring="inner" data-landing-animate />
        <span className={`${styles.pin} ${styles.pinOne}`} data-map-pin data-landing-animate>
          <i>1977</i>
        </span>
        <span className={`${styles.pin} ${styles.pinTwo}`} data-map-pin data-landing-animate>
          <i>1985</i>
        </span>
        <span className={`${styles.pin} ${styles.pinThree}`} data-map-pin data-landing-animate>
          <i>1994</i>
        </span>
        <span className={`${styles.pin} ${styles.pinFour}`} data-map-pin data-landing-animate>
          <i>2003</i>
        </span>
        <div className={styles.mapMessage} data-map-message data-landing-animate>
          <small>CADA PIN GUARDA</small>
          <strong>una historia</strong>
        </div>
      </div>

      <div className={styles.mapSectionCopy} data-map-copy>
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

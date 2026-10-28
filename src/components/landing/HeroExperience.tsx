"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import Hero from "./Hero";
import LandingHeader from "./LandingHeader";
import styles from "../../app/landing.module.css";

const eras = [
  { year: '1970', label: '70s', description: 'Sintonizá tus recuerdos' },
  { year: '1980', label: '80s', description: 'Volvé a encender la magia' },
  { year: '1990', label: '90s', description: 'Abrí una ventana al pasado' },
  { year: '2000', label: '2000s', description: 'Conectate con tu historia' },
  { year: '2010', label: '2010s', description: 'Compartí ese instante' },
  { year: '2020', label: '2020s', description: 'Tu historia sigue pasando' },
];

export default function HeroExperience() {
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [visible, setVisible] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const shell = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const index = ((step % eras.length) + eras.length) % eras.length;
  const era = eras[index];

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener('change', sync);
    const syncVisibility = () => setTabVisible(!document.hidden);
    syncVisibility();
    document.addEventListener('visibilitychange', syncVisibility);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    if (shell.current) observer.observe(shell.current);
    return () => { media.removeEventListener('change', sync); observer.disconnect(); document.removeEventListener('visibilitychange', syncVisibility); };
  }, []);

  useEffect(() => {
    if (paused || interacting || reduced || !visible || !tabVisible) return;
    const timer = window.setTimeout(() => {
      if (!document.hidden) setStep(value => value + 1);
    }, 6500);
    return () => window.clearTimeout(timer);
  }, [step, paused, interacting, reduced, visible, tabVisible]);

  function select(next: number) {
    setStep(value => {
      const current = (value % eras.length + eras.length) % eras.length;
      const half = Math.floor(eras.length / 2);
      return value + ((next - current + eras.length + half) % eras.length - half);
    });
  }
  function turn(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    if (Math.hypot(x, y) < 16) return;
    const angle = (Math.atan2(y, x) * 180 / Math.PI + 90 + 360) % 360;
    select(Math.round(angle / (360 / eras.length)) % eras.length);
  }

  return <div ref={shell} className={`${styles.heroShell} ${styles.eraHero}`} data-era={era.year} data-hero-shell>
    <div className={styles.heroMapBackdrop} data-hero-map aria-hidden="true" />
    <LandingHeader />
    <Hero dial={<div className={styles.eraControl}
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => { if (!dragging.current) setInteracting(false); }}
      onFocusCapture={() => setInteracting(true)}
      onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false); }}>
      <div className={styles.eraDial} role="slider" tabIndex={0}
        aria-label="Girar para cambiar de época" aria-valuemin={0} aria-valuemax={eras.length - 1}
        aria-valuenow={index} aria-valuetext={`Década de ${era.year}`}
        onKeyDown={event => {
          if (event.key === ' ') { event.preventDefault(); setPaused(value => !value); }
          if (['ArrowRight', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
            event.preventDefault();
            if (event.key === 'Home') select(0);
            else if (event.key === 'End') select(eras.length - 1);
            else setStep(value => value + (['ArrowRight', 'ArrowUp'].includes(event.key) ? 1 : -1));
          }
        }}
        onPointerDown={event => {
          if (event.button !== 0) return;
          dragging.current = true; setInteracting(true);
          event.currentTarget.setPointerCapture(event.pointerId); turn(event);
        }}
        onPointerMove={event => { if (dragging.current) turn(event); }}
        onPointerUp={() => { dragging.current = false; setInteracting(false); }}
        onPointerCancel={() => { dragging.current = false; setInteracting(false); }}>
        <svg className={styles.dialHitArea} viewBox="0 0 600 600" aria-hidden="true">
          <circle cx="300" cy="300" r="278" />
        </svg>
        <div className={styles.dialAtmosphere} style={{ transform: `rotate(${step * (360 / eras.length)}deg)` }} aria-hidden="true" />
        <div className={styles.dialRotor} style={{ transform: `rotate(${step * (360 / eras.length)}deg)` }} aria-hidden="true"><i /></div>
        {eras.map((item, i) => <span key={item.year} className={styles.dialEraLabel}
          data-active={index === i} style={{ transform: `rotate(${i * (360 / eras.length)}deg)` }} aria-hidden="true">
          <b style={{ transform: `rotate(${-i * (360 / eras.length)}deg)` }}>{item.label}</b>
        </span>)}
      </div>
    </div>} />
  </div>;
}

"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Disc3, CassetteTape, Monitor, MessagesSquare, Camera, ArrowRight, AudioLines } from "lucide-react";
import styles from "../../app/landing.module.css";

const eras = [
  { year: "1970", label: "70s", phrase: "Ese disco que sonaba en casa.", icon: Disc3 },
  { year: "1980", label: "80s", phrase: "El cassette que escuchabas una y otra vez.", icon: CassetteTape },
  { year: "1990", label: "90s", phrase: "Tu primera ventana a otro mundo.", icon: Monitor },
  { year: "2000", label: "2000s", phrase: "Ese chat que no querías terminar.", icon: MessagesSquare },
  { year: "2010", label: "2010s", phrase: "La foto que todavía guardás en el celular.", icon: Camera },
  { year: "2020", label: "2020s", phrase: "Ese momento que todavía estamos viviendo.", icon: AudioLines },
] as const;

export default function FinalCall() {
  const section = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener("change", update);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.2 });
    if (section.current) observer.observe(section.current);
    return () => { preference.removeEventListener("change", update); observer.disconnect(); };
  }, []);
  useEffect(() => {
    if (!visible || reducedMotion) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setActive(current => (current + 1) % eras.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [visible, reducedMotion]);
  return (
    <section ref={section} className={`${styles.finalCall} ${styles.eraInvitation}`} data-final-call data-invitation-era={eras[active].year} aria-labelledby="invitation-title">
      <div className={styles.invitationScenes} aria-hidden="true">
        {eras.map((era, index) => <div key={era.year} className={styles.invitationScene} data-scene={era.year} data-active={index === active}><era.icon strokeWidth={1}/><span>{era.label}</span></div>)}
      </div>
      <div className={styles.invitationContent}>
        <p className={styles.invitationEyebrow}>CADA ÉPOCA TIENE ALGO TUYO</p>
        <h2 id="invitation-title">Tus recuerdos tienen un lugar acá.</h2>
        <div className={styles.invitationPhrases}>
          {eras.map((era, index) => <p key={era.year} data-active={index === active} aria-hidden={index !== active}>{era.phrase}</p>)}
        </div>
        <p className={styles.invitationDescription}>Creá tu cuenta y compartí esa historia que todavía te acompaña.</p>
        <Link className={styles.lightAction} href="/auth/registro">Crear mi cuenta <ArrowRight size={18} aria-hidden="true"/></Link>
      </div>
    </section>
  );
}

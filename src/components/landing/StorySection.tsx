import styles from "../../app/landing.module.css";
import { MapPin, Disc3, Camera, ArrowUpRight } from "lucide-react";

const features = [
  { title: "Explorá el mapa", copy: "Un lugar puede despertar mil recuerdos.", href: "/explorar", icon: MapPin },
  { title: "Viajá entre épocas", copy: "Encontrá el sonido y los colores de tu década.", href: "#epocas", icon: Disc3 },
  { title: "Sumá tu historia", copy: "Una foto, unas palabras. Tu recuerdo también cuenta.", href: "/explorar?action=recordar", icon: Camera },
] as const;

export default function StorySection() {
  return (
    <section className={`${styles.story} ${styles.memoryAlbum}`} id="historia" aria-labelledby="story-title" data-story-section>
      <div className={styles.albumArtwork} aria-hidden="true" data-story-quote data-landing-animate>
        <div className={styles.albumRecord}><span>NOSTALGIAR<br/>LADO A · RECUERDOS</span></div>
        <div className={styles.albumPostcard}>
          <div className={styles.postcardMap}><MapPin size={38}/><span>ACÁ PASÓ ALGO</span></div>
          <p>Hay lugares que siguen en vos.</p>
          <small>ARCHIVO PERSONAL / SIN FECHA DE VENCIMIENTO</small>
        </div>
        <span className={styles.albumNote}>Dale play a tu memoria.</span>
      </div>
      <div data-story-copy>
        <p className={styles.eyebrow}>LA MEMORIA TAMBIÉN ES UN LUGAR</p>
        <h2 id="story-title">Volvé a ese barrio, esa canción, esa tarde.</h2>
        <p>
          Nostalgiar reúne relatos en un mapa vivo: podés explorar historias,
          escuchar la música de cada década y compartir tus propios recuerdos.
        </p>
      <ul className={styles.featureList}>
        {features.map((feature) => (
          <li key={feature.title} data-story-feature data-landing-animate>
            <a href={feature.href}>
              <feature.icon size={22} aria-hidden="true"/>
              <div><strong>{feature.title}</strong><p>{feature.copy}</p></div>
              <ArrowUpRight size={18} aria-hidden="true"/>
            </a>
          </li>
        ))}
      </ul>
      </div>
    </section>
  );
}

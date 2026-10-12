import Link from "next/link";
import styles from "../../app/landing.module.css";

const decades = [
  {
    year: "70",
    title: "Vinilos y rutas",
    description: "Revistas, discos y recuerdos que todavía giran.",
  },
  {
    year: "80",
    title: "Neón y aventuras",
    description: "Arcades, VHS y canciones grabadas de la radio.",
  },
  {
    year: "90",
    title: "Cassettes y ventanas",
    description: "Historias compartidas entre grunge y computadoras.",
  },
  {
    year: "00",
    title: "Chats y nuevas pantallas",
    description: "La época en la que empezamos a vivir conectados.",
  },
] as const;

export default function DecadesSection() {
  return (
    <section className={styles.decades} id="epocas" aria-labelledby="eras-title">
      <div className={styles.sectionHeading}>
        <p className={styles.eyebrow}>CUATRO DÉCADAS, MILES DE RECUERDOS</p>
        <h2 id="eras-title">Elegí una época para empezar el viaje.</h2>
      </div>
      <div className={styles.decadeGrid}>
        {decades.map((decade) => (
          <Link
            key={decade.year}
            className={styles.decadeCard}
            href={`/explorar?era=19${decade.year}`}
          >
            <span className={styles.decadeNumber}>{decade.year}</span>
            <span className={styles.decadeCopy}>
              <strong>{decade.title}</strong>
              <small>{decade.description}</small>
            </span>
            <span className={styles.cardArrow} aria-hidden="true">
              ↗
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

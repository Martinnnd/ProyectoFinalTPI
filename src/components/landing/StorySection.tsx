import styles from "../../app/landing.module.css";

const features = [
  "Explorá el mapa",
  "Viajá entre épocas",
  "Sumá tu historia",
] as const;

export default function StorySection() {
  return (
    <section className={styles.story} id="historia" aria-labelledby="story-title">
      <div className={styles.storyQuote} aria-hidden="true">
        “
      </div>
      <div>
        <p className={styles.eyebrow}>LA MEMORIA TAMBIÉN ES UN LUGAR</p>
        <h2 id="story-title">Volvé a ese barrio, esa canción, esa tarde.</h2>
        <p>
          Nostalgiar reúne relatos en un mapa vivo: podés explorar historias,
          escuchar la música de cada década y guardar tus propios recuerdos en
          este navegador.
        </p>
      </div>
      <ul className={styles.featureList}>
        {features.map((feature, index) => (
          <li key={feature}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{feature}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}

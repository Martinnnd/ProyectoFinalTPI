import Link from "next/link";
import styles from "../../app/landing.module.css";

export default function FinalCall() {
  return (
    <section className={styles.finalCall}>
      <p>Tu próximo recuerdo puede empezar en cualquier lugar.</p>
      <h2>¿A qué época querés volver?</h2>
      <Link className={styles.lightAction} href="/explorar">
        Abrir Nostalgiar <span aria-hidden="true">→</span>
      </Link>
    </section>
  );
}

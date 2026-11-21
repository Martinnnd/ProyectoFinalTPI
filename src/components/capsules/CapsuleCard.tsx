import Link from "next/link";
import { Cloud, LockKeyhole, Globe2, ArrowUpRight } from "lucide-react";
import type { Capsule } from "../../capsulesApi";
import type { Decade } from "../../types";
import { capsuleObjects, capsulePeriod } from "./capsulePresentation";
import styles from "./capsules.module.css";
import CapsuleCover from "./CapsuleCover";

export default function CapsuleCard({ capsule, decade }: { capsule: Capsule; decade: Decade }) {
  const object = capsuleObjects[decade];
  return (
    <Link href={`/capsulas/${capsule.id}`} className={styles.card}>
      <div className={styles.objectStage} aria-hidden="true">
        <div className={styles.object} data-medium={object.medium}>
          <div className={styles.objectCover}>
            <CapsuleCover
              capsule={capsule}
              decorative
              fallback={
                <span>
                  N<span>OSTALGIAR</span>
                </span>
              }
            />
          </div>
          <span className={styles.objectLabel}>{capsule.nombre}</span>
          <span className={styles.reels}>
            <i />
            <i />
          </span>
          {object.medium === "cloud" && <Cloud className={styles.cloudIcon} strokeWidth={1} />}
        </div>
        <span className={styles.objectCaption}>{object.label}</span>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardMeta}>
          <span>{capsulePeriod(capsule)}</span>
          <span>
            {capsule.visibilidad === 0 ? <LockKeyhole size={12} /> : <Globe2 size={12} />}
            {capsule.visibilidad === 0 ? "Privada" : "Pública"}
          </span>
        </div>
        <h2>{capsule.nombre}</h2>
        <p>{capsule.descripcion || "Un lugar para guardar historias que van juntas."}</p>
        <div className={styles.cardFooter}>
          <span>
            {capsule.cantidadRecuerdos} {capsule.cantidadRecuerdos === 1 ? "recuerdo" : "recuerdos"}
          </span>
          <ArrowUpRight size={20} />
        </div>
      </div>
    </Link>
  );
}

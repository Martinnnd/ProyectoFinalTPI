import { Lock, X } from "lucide-react";
import type { RefObject } from "react";
import type { Achievement } from "../../types";
import type { describeTiers } from "../../data";

type Tier = ReturnType<typeof describeTiers>[number];

export default function ProfileDialogs({
  catalogueDialog,
  tiersDialog,
  catalogue,
  unlockedCount,
  tiers,
  onCloseCatalogue,
  onCloseTiers,
}: {
  catalogueDialog: RefObject<HTMLDialogElement | null>;
  tiersDialog: RefObject<HTMLDialogElement | null>;
  catalogue: Achievement[];
  unlockedCount: number;
  tiers: Tier[];
  onCloseCatalogue: () => void;
  onCloseTiers: () => void;
}) {
  return (
    <>
      <dialog
        ref={catalogueDialog}
        className="achievement-dialog"
        onCancel={(event) => { event.preventDefault(); onCloseCatalogue(); }}
        onClick={(event) => { if (event.target === event.currentTarget) onCloseCatalogue(); }}
        aria-labelledby="achievements-title"
      >
        <header>
          <div>
            <h2 id="achievements-title">Todas las insignias</h2>
            <small>{unlockedCount} de {catalogue.length} conseguidas</small>
          </div>
          <button className="icon-button" onClick={onCloseCatalogue} aria-label="Cerrar catálogo de logros">
            <X size={20} />
          </button>
        </header>
        <div className="achievement-dialog-content">
          <ul className="achievement-list">
            {catalogue.map((achievement) => (
              <li key={achievement.id} className={`achievement-card ${achievement.unlocked ? "is-unlocked" : "is-locked"}`}>
                <span className="achievement-media">
                  <img src={achievement.image} alt="" width={64} height={64} loading="lazy" />
                  {!achievement.unlocked && <span className="achievement-lock"><Lock size={14} /></span>}
                </span>
                <span className="achievement-body">
                  <strong>{achievement.name}</strong>
                  <p>{achievement.description}</p>
                  <span className="achievement-state">{achievement.unlocked ? "Conseguida" : "Bloqueada"}</span>
                  {achievement.unlocked && achievement.unlockedAt && <time dateTime={achievement.unlockedAt}>
                    {new Date(achievement.unlockedAt).toLocaleDateString('es-AR')}
                  </time>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </dialog>
      <dialog
        ref={tiersDialog}
        className="tier-dialog"
        onCancel={(event) => { event.preventDefault(); onCloseTiers(); }}
        onClick={(event) => { if (event.target === event.currentTarget) onCloseTiers(); }}
        aria-labelledby="tiers-title"
      >
        <header>
          <div>
            <h2 id="tiers-title">Tu categoría</h2>
            <small>Así avanzás en Nostalgiar</small>
          </div>
          <button className="icon-button" onClick={onCloseTiers} aria-label="Cerrar categorías"><X size={20} /></button>
        </header>
        <div className="tier-dialog-content">
          <ul className="tier-list">
            {tiers.map((tier) => (
              <li key={tier.name} className={`tier-card is-${tier.state}`}>
                <span className="tier-body"><strong>{tier.name}</strong><p>{tier.requirement}</p></span>
                <span className="tier-state">
                  {tier.state === "current" ? "Tu categoría" : tier.state === "reached" ? "Alcanzada" : "Bloqueada"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </dialog>
    </>
  );
}

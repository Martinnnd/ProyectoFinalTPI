import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Film,
  Globe2,
  Music2,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import { factsForPeriod } from "../eraData";
import type { Period } from "../types";
import { eraThemes } from "../themes";
export default function EraFacts({
  period,
  onClose,
}: {
  period: Period;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(() => window.innerWidth >= 900);
  const facts = factsForPeriod(period);
  const fact = facts[index];
  const Icon =
    fact?.kind === "Cine"
      ? Film
      : fact?.kind === "Música"
        ? Music2
        : fact?.kind === "Deportes"
          ? Trophy
          : Globe2;
  return (
    <aside
      id="era-facts"
      className={`era-fact-popup ${expanded ? "fact-expanded" : "fact-collapsed"}`}
      aria-label="Datos de la época"
    >
      <div className="fact-top">
        <span>
          <Sparkles size={15} /> {eraThemes[period.decade].factsTitle}
        </span>
        <button
          className="icon-button"
          aria-label="Cerrar datos de época"
          onClick={onClose}
        >
          <X size={17} />
        </button>
      </div>
      {fact ? (
        <>
          <div
            className={`fact-art fact-${fact.kind.toLowerCase()}`}
            aria-hidden="true"
          >
            <span>{fact.year}</span>
            <Icon size={46} strokeWidth={1.3} />
            <i>ARCHIVO CULTURAL</i>
          </div>
          <div className="fact-body" aria-live="polite">
            <div className="fact-meta">
              <span>{fact.kind}</span>
              <span>{fact.dateLabel}</span>
            </div>
            <h2>{fact.title}</h2>
            <p>{fact.description}</p>
            <div className="fact-source">
              <span>{fact.scope}</span>
              <a href={fact.source} target="_blank" rel="noreferrer">
                {fact.sourceName} <ExternalLink size={11} />
              </a>
            </div>
          </div>
          <div className="fact-pagination">
            <span>
              DATO {index + 1} DE {facts.length}
            </span>
            <button
              className="fact-expand-button"
              aria-expanded={expanded}
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? "Resumir" : "Leer dato"}
            </button>
            <div>
              <button
                className="icon-button"
                aria-label="Dato anterior"
                disabled={facts.length < 2}
                onClick={() =>
                  setIndex((i) => (i - 1 + facts.length) % facts.length)
                }
              >
                <ArrowLeft size={16} />
              </button>
              <button
                className="icon-button"
                aria-label="Siguiente dato"
                disabled={facts.length < 2}
                onClick={() => setIndex((i) => (i + 1) % facts.length)}
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="fact-body">
          <h2>Un año para contar tu historia</h2>
          <p>
            No tenemos datos verificados de {period.year} en esta selección.
            Elegí toda la década para descubrir más.
          </p>
        </div>
      )}
    </aside>
  );
}

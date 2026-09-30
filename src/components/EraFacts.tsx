import { useState } from 'react';
import { ArrowLeft, ArrowRight, ExternalLink, Film, Globe2, Music2, Sparkles, Trophy, X } from 'lucide-react';
import { factsForPeriod } from '../eraData';
import type { Period } from '../types';
import { eraThemes } from '../themes';

export default function EraFacts({ period, onClose }: { period: Period; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(() => window.innerWidth >= 900);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const facts = factsForPeriod(period);
  const fact = facts[index];
  const Icon = fact?.kind === 'Cine' ? Film : fact?.kind === 'Música' ? Music2 : fact?.kind === 'Deportes' ? Trophy : Globe2;
  return <aside id="era-facts" className={`era-fact-popup fact-reader ${expanded ? 'fact-expanded' : 'fact-collapsed'}`} aria-label="Efemérides de la época">
    <div className="fact-top"><span><Sparkles size={16}/> {eraThemes[period.decade].factsTitle}</span><button className="icon-button" aria-label="Cerrar datos de época" onClick={onClose}><X size={17}/></button></div>
    {fact ? <>
      <div className="fact-scroll" key={fact.id}>
        {expanded && <figure className="fact-visual">
          <div className="fact-photo">
            {fact.media && failedImage !== fact.media.url ? <img src={fact.media.url} alt={fact.media.caption} decoding="async" onError={() => setFailedImage(fact.media!.url)}/> : <div className="fact-photo-fallback"><Icon size={62}/><span>Archivo cultural</span></div>}
            <span className="fact-year">{fact.year}</span><span className="fact-kind"><Icon size={14}/>{fact.kind}</span>
          </div>
          {fact.media && failedImage !== fact.media.url && <figcaption><a href={fact.media.source} target="_blank" rel="noreferrer">{fact.media.caption} <ExternalLink size={11}/></a></figcaption>}
        </figure>}
        <div className="fact-body" aria-live="polite">
          <div className="fact-meta"><span>{expanded ? '¿TE ACORDÁS?' : `${fact.year} · ${fact.kind}`}</span><span>{fact.dateLabel}</span></div>
          <h2>{fact.title}</h2>
          {expanded && <><p>{fact.description}</p><div className="fact-source"><span>{fact.scope}</span><a href={fact.source} target="_blank" rel="noreferrer">Seguí explorando en {fact.sourceName} <ExternalLink size={13}/></a></div></>}
        </div>
      </div>
      <div className="fact-pagination"><span>{String(index + 1).padStart(2, '0')} / {String(facts.length).padStart(2, '0')}</span><button className="fact-expand-button" aria-expanded={expanded} onClick={() => setExpanded(v => !v)}>{expanded ? 'Resumir' : 'Leer efeméride'}</button><div><button className="icon-button" aria-label="Dato anterior" disabled={facts.length < 2} onClick={() => setIndex(i => (i - 1 + facts.length) % facts.length)}><ArrowLeft size={19}/></button><button className="icon-button" aria-label="Siguiente dato" disabled={facts.length < 2} onClick={() => setIndex(i => (i + 1) % facts.length)}><ArrowRight size={19}/></button></div></div>
    </> : <div className="fact-body"><h2>Un año para contar tu historia</h2><p>No tenemos datos verificados de {period.year} en esta selección. Elegí toda la década para descubrir más.</p></div>}
  </aside>;
}

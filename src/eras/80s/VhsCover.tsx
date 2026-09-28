import type { Memory } from '../../types';
export default function VhsCover({memory}:{memory:Memory}) {
 return <span className="vhs-cover">
 <span className="vhs-cover-spine">NOSTALGIA · {memory.year} · VHS</span>
 <span className="vhs-cover-front">
 <span className="vhs-cover-edition">VIDEO CLUB / ARCHIVO PERSONAL</span>
 <span className="vhs-cover-art">{memory.image?<img src={memory.image} alt="" loading="lazy"/>:<><span className="vhs-cover-year">{memory.year}</span><span className="vhs-cover-reels"><i/><i/></span></>}</span>
 <span className="vhs-cover-category">{memory.category}</span><strong>{memory.title}</strong>
 <span className="vhs-cover-credit">Una historia de {memory.author}</span>
 <span className="vhs-cover-bottom"><b>VHS</b><span>PAL · COLOR</span><span>▶ VER RECUERDO</span></span>
 </span></span>;
}

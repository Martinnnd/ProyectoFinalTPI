import { useEffect, useRef, useState, useMemo } from "react";
import { Clock3, X, ArrowRight, Radio, ChevronLeft, ChevronRight } from "lucide-react";
import type { Memory } from "../types";
const decadeOf = (year:number) => Math.floor(year/10)*10;
export default function ProfileTimeline({memories,author,onOpen,onAdd}: {
 memories:Memory[];author?:string;onOpen?:(memory:Memory)=>void;onAdd:()=>void;
}) {
 const dialog=useRef<HTMLDialogElement>(null);
 const trigger=useRef<HTMLButtonElement>(null);
 const timer=useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
 const [opened,setOpened]=useState(false);
 const [closing,setClosing]=useState(false);
 const sorted=useMemo(()=>[...memories].sort((a,b)=>a.year-b.year||a.title.localeCompare(b.title)),[memories]);
 const [stationId,setStationId]=useState<string|null>(null);
 const index=Math.max(0,sorted.findIndex(m=>m.id===stationId));
 const active=sorted[index];
 const year=active?.year ?? 1970;
 const era=decadeOf(year);
 const stations=sorted.filter(m=>m.year===year);
 const position=sorted.length>1?index/(sorted.length-1)*100:50;
 const tune=(value:number)=>setStationId(sorted[value]?.id??null);
 const previous=index>0?index-1:undefined;
 const next=index<sorted.length-1?index+1:undefined;
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 function open(){clearTimeout(timer.current);setClosing(false);setOpened(true);dialog.current?.showModal();}
 function close(after?:()=>void){
   if(closing)return;
   setClosing(true);
   timer.current=setTimeout(()=>{dialog.current?.close();setOpened(false);setClosing(false);trigger.current?.focus();after?.();},matchMedia('(prefers-reduced-motion: reduce)').matches?0:320);
 }
 return <>
 <button ref={trigger} className="timeline-drawer-trigger timeline-clock-trigger" aria-label="Abrir línea de tiempo" title="Tu viaje en el tiempo" aria-haspopup="dialog" aria-expanded={opened} onClick={open}><svg className="time-portal-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true"><circle className="portal-orbit" cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.4" strokeDasharray="68 12 22 24"/><g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 12h16M16 36h16M18 12c0 7 2 9 6 12-4 3-6 5-6 12M30 12c0 7-2 9-6 12 4 3 6 5 6 12"/><path d="M21 31h6M22 17h4"/></g><circle cx="24" cy="24" r="2" fill="currentColor"/><circle className="portal-satellite" cx="44" cy="24" r="2.6" fill="currentColor"/></svg></button>
 <dialog ref={dialog} className={`timeline-drawer timeline-wide${closing?' is-closing':''}`} aria-labelledby="timeline-drawer-title" onCancel={e=>{e.preventDefault();e.stopPropagation();close();}} onKeyDown={e=>e.stopPropagation()}>
 <header className="timeline-drawer-header"><div><span className="eyebrow">UN VIAJE POR TUS RECUERDOS</span><h2 id="timeline-drawer-title">{author?`La historia de ${author}`:'Mi línea de tiempo'}</h2></div><button className="icon-button" aria-label="Cerrar línea de tiempo" onClick={()=>close()}><X size={22}/></button></header>
 <div className="timeline-drawer-content">
 <section className="memory-radio" data-memory-fm-era={era} aria-label="Radio de recuerdos">
 <div className="memory-fm-brand"><strong>NOSTALGIAR <span>STEREO</span></strong><small>RECEPTOR DE HISTORIAS · 1970—2009</small><i aria-label={active?'Recuerdo sintonizado':'Sin recuerdos en este año'} data-signal={!!active}/></div>
 <div className="memory-fm-console"><div className="memory-fm-speaker" aria-hidden="true"><span/></div><div className="memory-fm-center">
 <div className="memory-fm-readout"><small>{era===2000?'2000s':`${String(era).slice(2)}s`} · {active?'SEÑAL ENCONTRADA':'BUSCANDO RECUERDOS'}</small><strong>{year}<span>AÑO</span></strong><span className="memory-fm-meter" aria-hidden="true">▂ ▃ ▅ ▆ ▅ ▃ ▂</span></div>
 <div className="memory-fm-tuner"><div className="memory-fm-ticks" aria-hidden="true"/><div className="memory-fm-scale" aria-hidden="true">{sorted.map((m,i)=><span key={m.id} style={{left:`${sorted.length>1?i/(sorted.length-1)*100:50}%`}}>{sorted.length<9 || i===0 || i===sorted.length-1 ? m.year : "·"}</span>)}</div><div className="memory-fm-needle" style={{left:`${position}%`}} aria-hidden="true"/><input type="range" min={0} max={Math.max(1,sorted.length-1)} step={1} value={index} disabled={sorted.length<2} aria-label="Sintonizar recuerdo" aria-valuetext={active?`${year}: ${active.title}`:"Sin recuerdos"} onChange={e=>tune(Number(e.target.value))}/></div>
 <p className="memory-fm-tuning-hint">Arrastrá la aguja para cambiar de recuerdo</p>
 <nav className="memory-fm-presets" aria-label="Sintonizar década">{[1970,1980,1990,2000].map(d=><button key={d} aria-pressed={era===d} disabled={!sorted.some(m=>decadeOf(m.year)===d)} onClick={()=>tune(sorted.findIndex(m=>decadeOf(m.year)===d))}>{d===2000?'2000s':`${String(d).slice(2)}s`}</button>)}</nav>
 </div><div className="memory-fm-speaker" aria-hidden="true"><span/></div></div>
 <div className="memory-fm-bottom"><div className="memory-fm-knob" aria-hidden="true" style={{transform:`rotate(${position*2.8-140}deg)`}}><i/></div><div className="memory-fm-station-buttons"><small>SINTONÍA · RECUERDOS</small><div><button disabled={previous===undefined} aria-label="Recuerdo anterior" onClick={()=>previous!==undefined&&tune(previous)}><ChevronLeft size={18}/></button><button disabled={next===undefined} aria-label="Recuerdo siguiente" onClick={()=>next!==undefined&&tune(next)}><ChevronRight size={18}/></button></div></div><span className="memory-fm-signature">El tiempo también se escucha.</span></div>
 <div className="memory-fm-memory" aria-live="polite">{active?<><small>{active.year} · {active.place}</small><h3>{active.title}</h3><p>{active.description}</p>{stations.length>1&&<div className="memory-fm-stations" aria-label="Recuerdos del año">{stations.map((m,i)=><button key={m.id} aria-pressed={active.id===m.id} onClick={()=>setStationId(m.id)}>{i+1} · {m.title}</button>)}</div>}<button className="memory-fm-open" onClick={()=>close(()=>onOpen?.(active))}>Abrir recuerdo <ArrowRight size={15}/></button></>:<><Radio size={25}/><h3>No hay recuerdos en {year}</h3><p>Mové el dial o usá las flechas para encontrar otro año con historias.</p>{!author&&<button className="memory-fm-open" onClick={()=>close(onAdd)}>Sumar mi recuerdo</button>}</>}</div>
 </section>

 </div></dialog></>;
}

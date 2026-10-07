import { useEffect, useRef, useState, useMemo } from "react";
import { Clock3, X, ArrowRight, Image as ImageIcon, MapPin } from "lucide-react";
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
 const rail=useRef<HTMLDivElement>(null);
 const decades=[...new Set(sorted.map(m=>decadeOf(m.year)))];
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
 <div className="timeline-drawer-content profile-timeline">
 <nav className="timeline-decades" aria-label="Saltar a una década">{decades.map(d=><button key={d} data-decade={d} onClick={()=>{const el=rail.current,item=el?.querySelector<HTMLElement>(`[data-decade="${d}"]`);if(el&&item)el.scrollTo({left:item.offsetLeft-el.offsetLeft,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}}>{d===2000?'2000s':`${String(d).slice(2)}s`}<span>{sorted.filter(m=>decadeOf(m.year)===d).length}</span></button>)}</nav>
 {sorted.length ? <div className="timeline-rail" ref={rail} tabIndex={0} aria-label="Recorrer los recuerdos"><div className="timeline-track">{decades.map(decade=><section className="timeline-decade" data-decade={decade} key={decade}><h4>{decade}<span>— {decade+9}</span></h4><ol>{sorted.filter(m=>decadeOf(m.year)===decade).map(memory=>{
 const index=sorted.findIndex(m=>m.id===memory.id), below=index%2===1;
 const image=memory.media?.kind==='image'?memory.media.url:!memory.media&&memory.image&&!/youtu/i.test(memory.image)?memory.image:undefined;
 return <li key={memory.id} data-position={below?'below':'above'}><svg className="timeline-wave" viewBox="0 0 280 80" preserveAspectRatio="none" aria-hidden="true"><path d={below?'M0 40 C70 40 55 74 140 74 S210 40 280 40':'M0 40 C70 40 55 6 140 6 S210 40 280 40'}/></svg><span className="timeline-year">{memory.year}</span><button className="timeline-memory" onClick={()=>close(()=>onOpen?.(memory))}><div className="timeline-object" aria-hidden="true"><span className="timeline-format">{decade===1970?'33⅓ · VINILO':decade===1980?'VHS · SP':decade===1990?'DVD · VIDEO':'DIGITAL · 5.0 MP'}</span><span className="timeline-reel reel-left"/><span className="timeline-reel reel-right"/><div className="timeline-picture"><ImageIcon size={32}/>{image&&<img src={image} alt="" loading="lazy" onError={e=>{e.currentTarget.hidden=true;}}/>}</div><span className="timeline-object-detail"/><span className="timeline-object-shine"/><span className="timeline-object-screw screw-a"/><span className="timeline-object-screw screw-b"/></div><div className="timeline-card-text"><strong>{memory.title}</strong><small><MapPin size={12}/>{memory.place}</small><span className="timeline-read">Abrir recuerdo →</span></div></button></li>;
 })}</ol></section>)}</div></div>:<div className="timeline-empty"><Clock3 size={32}/><h3>La historia empieza con un recuerdo</h3>{!author&&<button className="primary-button" onClick={()=>close(onAdd)}>Sumar mi recuerdo</button>}</div>}

 </div></dialog></>;
}

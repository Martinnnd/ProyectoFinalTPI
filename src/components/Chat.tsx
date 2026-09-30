import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight, MessageCircle, Minus, Send, X } from "lucide-react";
import type { Decade } from "../types";

const themes: Record<Decade, {title: string; group: string; topic: string}> = {
  1970: {title: "Correspondencia", group: "Rock y vinilos", topic: "ese vinilo que escuchábamos toda la tarde"},
  1980: {title: "CHAT CLUB · 80", group: "Fierros de los 80", topic: "las fotos del auto de tu familia"},
  1990: {title: "Nostalgia Chat — Conectados", group: "Grunge de los 90", topic: "el cassette que llevábamos a todos lados"},
  2000: {title: "Nostalgia Messenger", group: "Cine de los 2000", topic: "aquella salida al cine con todo el grupo"},
};

export default function Chat({decade, fullPage, onOpenPage, hidden}: {decade: Decade; fullPage: boolean; onOpenPage: () => void; hidden: boolean}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const theme = themes[decade];
  const contacts = [{name:"Lucía",initial:"L",text:"¡Qué lindo recuerdo! ¿Tenés más fotos?",time:"12:42"},{name:"Marcos",initial:"M",text:"Me hiciste acordar a esos días.",time:"Ayer"},{name:theme.group,initial:"G",text:"Hay una historia nueva para compartir.",time:"Ayer"}];
  const contact = contacts[selected ?? 0];
  function close() {setOpen(false);trigger.current?.focus();}
  useEffect(() => { if(!open) return; const escape=(e:KeyboardEvent)=>{if(e.key==="Escape")close();};window.addEventListener("keydown",escape);return()=>window.removeEventListener("keydown",escape); },[open]);
  useEffect(()=>{setSelected(null);},[decade]);
  if(hidden) return null;
  const list = <div className="chat-list"><div className="chat-list-label">TUS CONVERSACIONES <span>3</span></div>{contacts.map((person,i)=><button key={i} className={`chat-contact ${selected===i?'is-selected':''}`} onClick={()=>setSelected(i)} aria-pressed={selected===i}><span className="chat-avatar">{person.initial}<i/></span><span className="chat-contact-copy"><strong>{person.name}</strong><small>{person.text}</small></span><time>{person.time}</time></button>)}</div>;
  const conversation = <div className="chat-conversation"><header><button className="icon-button" aria-label="Volver a conversaciones" onClick={()=>setSelected(null)}><ArrowLeft size={18}/></button><span className="chat-avatar">{contact.initial}</span><div><strong>{contact.name}</strong><small>Conversación de muestra</small></div></header><div className="chat-messages"><span className="chat-date">HOY · UN VIAJE A LOS {String(decade).slice(2)}s</span><p className="chat-bubble">¡Hola! Vi tu recuerdo sobre {theme.topic}.</p><p className="chat-bubble own">¡Qué época! Me encanta volver a compartir esas historias.</p><p className="chat-bubble">{contact.text}</p><small className="chat-message-time">12:42</small></div><div className="chat-composer"><span>Próximamente vas a poder escribir acá…</span><Send size={18}/></div></div>;
  const panel = <><header className="chat-titlebar"><MessageCircle size={18}/><strong>{theme.title}</strong>{!fullPage && <><button className="icon-button" onClick={onOpenPage} aria-label="Abrir apartado de chat"><ArrowUpRight size={18}/></button><button className="icon-button" onClick={close} aria-label="Minimizar mensajes"><Minus size={18}/></button></>}</header><div className={`chat-content ${selected!==null?'has-conversation':''}`}>{(fullPage || selected===null) && list}{(fullPage || selected!==null) && conversation}</div><footer className="chat-demo-note">Vista de muestra · Los mensajes no se envían</footer></>;
  if(fullPage) return <main className="chat-page" aria-label="Chat"><div className="chat-page-intro"><span>VOLVÉ A CONECTAR</span><h1>Las historias siguen en una charla.</h1><p>Un lugar para reencontrarte y compartir lo que recordás.</p></div><section className="chat-window">{panel}</section></main>;
  return <div className="chat-dock">{open && <section id="chat-popup" className="chat-window chat-popup" aria-label="Mensajes de muestra">{panel}</section>}<button ref={trigger} className="chat-launcher" aria-expanded={open} aria-controls="chat-popup" onClick={()=>setOpen(v=>!v)}><MessageCircle size={21}/><strong>Mensajes</strong><span className="chat-count">3</span><span className="chat-faces" aria-hidden="true"><i>L</i><i>M</i><i>G</i></span>{open && <X size={16}/>}</button></div>;
}

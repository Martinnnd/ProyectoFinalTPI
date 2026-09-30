import { useState } from 'react';
import { Users, Plus, Search, ArrowUpRight } from 'lucide-react';
import type { CommunityGroup, Decade } from '../types';
export default function CommunityControls({groups,scope,onScope,query,onQuery,onCreate,decade,profile=false}:{groups:CommunityGroup[];scope:string;onScope:(value:string)=>void;query:string;onQuery:(value:string)=>void;onCreate:(group:CommunityGroup)=>string|null;decade:Decade;profile?:boolean}) {
 const [creating,setCreating]=useState(false);const [name,setName]=useState('');const [error,setError]=useState('');
 return <section className="community-controls" aria-label="Grupos en común">
 <header className="community-heading"><span className="community-heading-icon"><Users size={22}/></span><div><small>LA COMUNIDAD</small><strong>{profile?'Mis grupos':'Explorá recuerdos y grupos'}</strong></div><button className="community-create" aria-expanded={creating} onClick={()=>setCreating(v=>!v)}><Plus size={15}/>{creating?'Cancelar':'Crear grupo'}</button></header>
 {!profile && <div className="community-filters"><label><span><Search size={13}/> Buscar recuerdos</span><input type="search" placeholder="Título, autor o recuerdo" value={query} onChange={e=>onQuery(e.target.value)}/></label></div>}
 {(profile || scope==='groups') && <div className="community-cards">{groups.map(g=><button key={g.id} onClick={()=>onScope(g.id)}><span className="community-emblem" aria-hidden="true">{g.id==='autos-80'?<img src="/groups/fierros-80.svg" width={36} height={28} alt="" />:<Users size={26}/>}</span><span className="community-card-copy"><strong>{g.name}</strong><small>{g.decade}–{g.decade+9} · Ver publicaciones</small></span><ArrowUpRight size={18}/></button>)}</div>}
 {groups.find(g=>g.id===scope) && <div><p>{groups.find(g=>g.id===scope)?.description}</p><button onClick={()=>onScope('all')}>Ver todos los recuerdos</button></div>}
 {creating && <form onSubmit={e=>{e.preventDefault();if(!name.trim())return;const message=onCreate({id:crypto.randomUUID(),name:name.trim(),decade,description:`Grupo de la década ${decade}–${decade+9}.`});if(message){setError(message);return;}setCreating(false);setName('');setError('');}}><label>Nombre del grupo<input required maxLength={60} value={name} onChange={e=>setName(e.target.value)}/></label><small>Se creará para {decade}–{decade+9} y se guardará en este navegador.</small><button type="submit">Crear grupo</button>{error&&<p role="alert">{error}</p>}</form>}

 </section>;
}

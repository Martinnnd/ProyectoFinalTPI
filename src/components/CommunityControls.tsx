import { useState } from 'react';
import type { CommunityGroup, Decade } from '../types';
export default function CommunityControls({groups,scope,onScope,query,onQuery,onCreate,decade,profile=false}:{groups:CommunityGroup[];scope:string;onScope:(value:string)=>void;query:string;onQuery:(value:string)=>void;onCreate:(group:CommunityGroup)=>string|null;decade:Decade;profile?:boolean}) {
 const [creating,setCreating]=useState(false);const [name,setName]=useState('');const [error,setError]=useState('');
 return <section className="community-controls" aria-label="Grupos en común">
 <strong>{profile?'Mis grupos en común':'Explorá recuerdos y grupos'}</strong>
 {!profile && <><label>Ver publicaciones<select aria-label="Ver publicaciones" value={scope} onChange={e=>onScope(e.target.value)}><option value="general">Generales</option><option value="own">Mis recuerdos</option><option value="groups">Mis grupos en común</option>{groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></label><label>Buscar<input type="search" placeholder="Título, autor o recuerdo" value={query} onChange={e=>onQuery(e.target.value)}/></label></>}
 {(profile || scope==='groups') && <div className="community-cards">{groups.map(g=><button key={g.id} onClick={()=>onScope(g.id)}><span aria-hidden="true">{g.id==='autos-80'?<img src="/groups/fierros-80.svg" width={36} height={28} alt="" />:'👥'}</span><strong>{g.name}</strong><small>{g.decade}–{g.decade+9} · Ver publicaciones</small></button>)}</div>}
 {groups.find(g=>g.id===scope) && <p>{groups.find(g=>g.id===scope)?.description}</p>}
 <button className="community-create" onClick={()=>setCreating(v=>!v)}>{creating?'Cancelar':'+ Crear grupo'}</button>
 {creating && <form onSubmit={e=>{e.preventDefault();if(!name.trim())return;const message=onCreate({id:crypto.randomUUID(),name:name.trim(),decade,description:`Grupo de la década ${decade}–${decade+9}.`});if(message){setError(message);return;}setCreating(false);setName('');setError('');}}><label>Nombre del grupo<input required maxLength={60} value={name} onChange={e=>setName(e.target.value)}/></label><small>Se creará para {decade}–{decade+9} y se guardará en este navegador.</small><button type="submit">Crear grupo</button>{error&&<p role="alert">{error}</p>}</form>}
 <small className="community-local">Grupos de demostración local · sin conexión entre usuarios todavía.</small>
 </section>;
}

import { useState } from 'react';
import { Users, Plus, Search, ArrowUpRight } from 'lucide-react';
import type { CommunityGroup, Decade } from '../types';
import type { CreateGroupInput } from '../groupsApi';
import GroupCreateForm from './GroupCreateForm';

type CommunityControlsProps = {
 groups: CommunityGroup[];
 scope: string;
 onScope: (value: string) => void;
 query: string;
 onQuery: (value: string) => void;
 onCreate: (group: CreateGroupInput) => Promise<string | null>;
 onAddToGroup: (groupId: string) => void;
 decade: Decade;
 profile?: boolean;
 canCreate?: boolean;
};

export default function CommunityControls({groups,scope,onScope,query,onQuery,onCreate,onAddToGroup,decade,profile=false,canCreate=true}:CommunityControlsProps) {
 const [creating,setCreating]=useState(false);
 const selectedGroup=groups.find(group=>group.id===scope);
 return <section className="community-controls" aria-label="Grupos en común">
 <header className="community-heading"><span className="community-heading-icon"><Users size={22}/></span><div><small>LA COMUNIDAD</small><strong>{profile?'Mis grupos':'Explorá recuerdos y grupos'}</strong></div>{canCreate&&<button type="button" className="community-create" aria-expanded={creating} onClick={()=>setCreating(v=>!v)}><Plus size={15}/>{creating?'Cancelar':'Crear grupo'}</button>}</header>
 {!profile && <div className="community-filters"><label><span><Search size={13}/> Buscar recuerdos</span><input type="search" placeholder="Título, autor o recuerdo" value={query} onChange={e=>onQuery(e.target.value)}/></label></div>}
 {(profile || scope==='groups') && <div className="community-cards">{groups.map(g=><button key={g.id} onClick={()=>onScope(g.id)}><span className="community-emblem" aria-hidden="true">{g.id==='autos-80'?<img src="/groups/fierros-80.svg" width={36} height={28} alt="" />:<Users size={26}/>}</span><span className="community-card-copy"><strong>{g.name}</strong><small>{g.decade}–{g.decade+9} · Ver publicaciones</small></span><ArrowUpRight size={18}/></button>)}</div>}
 {selectedGroup && <div className="community-group-detail"><p>{selectedGroup.description}</p><div className="community-group-actions">{canCreate&&<button type="button" className="community-publish" onClick={()=>onAddToGroup(selectedGroup.id)}><Plus size={15}/>Publicar recuerdo en este grupo</button>}<button type="button" onClick={()=>onScope('all')}>Ver todos los recuerdos</button></div></div>}
 {creating && <GroupCreateForm decade={decade} onCreate={onCreate} onCreated={()=>setCreating(false)}/>}

 </section>;
}

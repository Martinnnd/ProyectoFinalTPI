import { useEffect, useState } from 'react';
import { Users, Plus, Search, ArrowUpRight, Info, DoorOpen, Share2 } from 'lucide-react';
import type { CommunityGroup, Decade } from '../types';
import type { CreateGroupInput } from '../groupsApi';
import GroupCreateForm from './GroupCreateForm';
import GroupSearch from './GroupSearch';

type CommunityControlsProps = {
 groups: CommunityGroup[];
 searchGroups: CommunityGroup[];
 scope: string;
 onScope: (value: string) => void;
 query: string;
 onQuery: (value: string) => void;
 onCreate: (group: CreateGroupInput) => Promise<string | null>;
 onJoinGroup: (groupId: string) => Promise<string | null>;
 onLeaveGroup: (groupId: string) => Promise<string | null>;
 onAddToGroup: (groupId: string) => void;
 onShowInfo: (groupId: string) => void;
 decade: Decade;
 profile?: boolean;
 canCreate?: boolean;
};

export default function CommunityControls({groups,searchGroups,scope,onScope,query,onQuery,onCreate,onJoinGroup,onLeaveGroup,onAddToGroup,onShowInfo,decade,profile=false,canCreate=true}:CommunityControlsProps) {
 const [creating,setCreating]=useState(false);
 const [shareStatus,setShareStatus]=useState('');
 useEffect(()=>setShareStatus(''),[scope]);
 async function shareGroup() {
  try {
   const url = new URL('/feed', window.location.origin);
   url.searchParams.set('scope', scope);
   await navigator.clipboard.writeText(url.href);
   setShareStatus('¡Enlace copiado!');
  } catch {
   setShareStatus('No se pudo copiar el enlace. Intentá de nuevo.');
  }
 }
 const [joining,setJoining]=useState(false);
 const [membershipError,setMembershipError]=useState('');
 const [leaving,setLeaving]=useState(false);
 const [confirmLeave,setConfirmLeave]=useState(false);
 const selectedGroup=searchGroups.find(group=>group.id===scope);
 useEffect(()=>{setJoining(false);setLeaving(false);setConfirmLeave(false);setMembershipError('');},[scope]);
 async function joinSelectedGroup() {
  if (!selectedGroup || joining) return;
  setJoining(true);setMembershipError('');
  const error=await onJoinGroup(selectedGroup.id);
  setJoining(false);
  if(error)setMembershipError(error);
 }
 async function leaveSelectedGroup() {
  if (!selectedGroup || leaving) return;
  setLeaving(true);setMembershipError('');
  try {
   const error=await onLeaveGroup(selectedGroup.id);
   if(error)setMembershipError(error);
   else setConfirmLeave(false);
  } finally {setLeaving(false);}
 }
 if (!profile && scope !== 'groups') return <section className="community-controls" aria-label="Buscar recuerdos">
  <div className="community-filters"><label><span><Search size={13}/> Buscar recuerdos</span><input type="search" placeholder="Título, autor o recuerdo" value={query} onChange={e=>onQuery(e.target.value)}/></label></div>
 </section>;
 return <section className="community-controls" aria-label="Grupos en común">
 <header className="community-heading"><span className="community-heading-icon"><Users size={22}/></span><div><small>LA COMUNIDAD</small><strong>{scope==='groups'?'Elegí un grupo':profile?'Mis grupos':'Explorá recuerdos y grupos'}</strong></div>{canCreate&&<button type="button" className="community-create" aria-expanded={creating} onClick={()=>setCreating(v=>!v)}><Plus size={15}/>{creating?'Cancelar':'Crear grupo'}</button>}</header>
 {!profile && scope!=='groups' && <div className="community-filters"><label><span><Search size={13}/> Buscar recuerdos</span><input type="search" placeholder="Título, autor o recuerdo" value={query} onChange={e=>onQuery(e.target.value)}/></label></div>}
 {(profile || scope==='groups') && searchGroups.length>0 && <GroupSearch groups={searchGroups} onSelect={onScope} onJoin={onJoinGroup}/>}
 {(profile || scope==='groups') && (groups.length ? <div className="community-cards">{groups.map(g=><button type="button" key={g.id} onClick={()=>onScope(g.id)}><span className="community-emblem" aria-hidden="true">{g.id==='autos-80'?<img src="/groups/fierros-80.svg" width={36} height={28} alt="" />:<Users size={26}/>}</span><span className="community-card-copy"><strong>{g.name}</strong><small>{g.decade}–{g.decade+9} · Ver publicaciones</small></span><ArrowUpRight size={18}/></button>)}</div>:<p className="community-empty">Todavía no tenés grupos disponibles. Podés crear el primero desde acá.</p>)}
 {selectedGroup && <div className="community-group-detail"><p>{selectedGroup.description}</p>{!selectedGroup.isMember&&<p className="community-membership-note">Podés explorar sus recuerdos y unirte cuando quieras para poder publicar.</p>}<div className="community-group-actions"><button type="button" onClick={()=>void shareGroup()}><Share2 size={15}/>Compartir grupo</button><button type="button" onClick={()=>onShowInfo(selectedGroup.id)}><Info size={15}/>Información del grupo</button>{canCreate&&!selectedGroup.isMember&&<button type="button" className="community-join" disabled={joining} onClick={()=>void joinSelectedGroup()}><Plus size={15}/>{joining?'Uniéndome…':'Unirme al grupo'}</button>}{canCreate&&selectedGroup.isMember&&<button type="button" className="community-publish" onClick={()=>onAddToGroup(selectedGroup.id)}><Plus size={15}/>Publicar recuerdo en este grupo</button>}<button type="button" onClick={()=>onScope('groups')}>Volver a mis grupos</button></div>{membershipError&&<p role="alert" className="community-form-error">{membershipError}</p>}</div>}
 {selectedGroup && shareStatus && <p role="status">{shareStatus}</p>}
 {selectedGroup?.isMember && !selectedGroup.isCreator && <div className="community-leave-area">{confirmLeave ? <div className="community-leave-confirm"><span>¿Querés salir de {selectedGroup.name}?</span><button type="button" disabled={leaving} onClick={()=>setConfirmLeave(false)}>Cancelar</button><button type="button" className="community-leave-button" disabled={leaving} onClick={()=>void leaveSelectedGroup()}>{leaving?'Saliendo…':'Confirmar salida'}</button></div> : <button type="button" className="community-leave-button" onClick={()=>setConfirmLeave(true)}><DoorOpen size={15}/>Salir del grupo</button>}{membershipError&&<p role="alert" className="community-form-error">{membershipError}</p>}</div>}
 {creating && <GroupCreateForm decade={decade} onCreate={onCreate} onCreated={()=>setCreating(false)}/>}

 </section>;
}

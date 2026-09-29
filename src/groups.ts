import type { CommunityGroup, Memory } from './types';
export const demoGroup: CommunityGroup = { id:'autos-80', name:'FIERROS DE LOS 80', decade:1980, description:'Un lugar para compartir recuerdos sobre los autos que marcaron los ochenta.' };
export const demoGroups: CommunityGroup[] = [
 {id:'vinilos-70',name:'ROCK Y VINILOS DE LOS 70',decade:1970,description:'Discos prestados, tocadiscos y tardes de rock compartidas entre amigos.'},
 demoGroup,
 {id:'grunge-90',name:'GRUNGE DE LOS 90',decade:1990,description:'Nirvana, Pearl Jam, Soundgarden y los cassettes que pasaban de mano en mano.'},
 {id:'cine-2000',name:'CINE DE LOS 2000',decade:2000,description:'Salidas al cine, películas en DVD y sagas que seguimos con amigos.'},
];
export type CommunityScope = 'general' | 'own' | 'groups' | string;
export function filterCommunity(memories: Memory[], scope: CommunityScope, groups: CommunityGroup[], query='') {
 const text=query.trim().toLocaleLowerCase('es');
 return memories.filter(m => (scope==='all' ? true : scope==='general' ? !m.groupId : scope==='own' ? m.source==='local' : scope==='groups' ? groups.some(g=>g.id===m.groupId) : m.groupId===scope)
 && (!text || `${m.title} ${m.description} ${m.author}`.toLocaleLowerCase('es').includes(text)));
}
export function loadGroups(): CommunityGroup[] {
 try { const raw=JSON.parse(localStorage.getItem('nostalgia.groups.v1')??'[]');
 return [...demoGroups,...(Array.isArray(raw)?raw:[]).filter((g):g is CommunityGroup=>g && typeof g.id==='string' && !demoGroups.some(d=>d.id===g.id) && typeof g.name==='string' && g.name.length>0 && g.name.length<=60 && typeof g.description==='string' && [1970,1980,1990,2000].includes(g.decade))];
 } catch { return [...demoGroups]; }
}

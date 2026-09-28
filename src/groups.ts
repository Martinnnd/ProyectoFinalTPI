import type { CommunityGroup, Memory } from './types';
export const demoGroup: CommunityGroup = { id:'autos-80', name:'FIERROS DE LOS 80', decade:1980, description:'Un lugar para compartir recuerdos sobre los autos que marcaron los ochenta.' };
export type CommunityScope = 'general' | 'own' | 'groups' | string;
export function filterCommunity(memories: Memory[], scope: CommunityScope, groups: CommunityGroup[], query='') {
 const text=query.trim().toLocaleLowerCase('es');
 return memories.filter(m => (scope==='general' ? !m.groupId : scope==='own' ? m.source==='local' : scope==='groups' ? groups.some(g=>g.id===m.groupId) : m.groupId===scope)
 && (!text || `${m.title} ${m.description} ${m.author}`.toLocaleLowerCase('es').includes(text)));
}
export function loadGroups(): CommunityGroup[] {
 try { const raw=JSON.parse(localStorage.getItem('nostalgia.groups.v1')??'[]');
 return [demoGroup,...(Array.isArray(raw)?raw:[]).filter((g):g is CommunityGroup=>g && typeof g.id==='string' && g.id!=='autos-80' && typeof g.name==='string' && g.name.length>0 && g.name.length<=60 && typeof g.description==='string' && [1970,1980,1990,2000].includes(g.decade))];
 } catch { return [demoGroup]; }
}

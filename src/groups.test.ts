import { describe, it, expect } from 'vitest';
import { filterCommunity, demoGroup } from './groups';
import { initialMemories } from './data';
import { loadMemories, saveMemories } from './storage';
describe('Grupos en común',()=>{
 it('separa publicaciones generales y del grupo, y permite buscar',()=>{
  expect(filterCommunity(initialMemories,'general',[demoGroup]).every(m=>!m.groupId)).toBe(true);
  expect(filterCommunity(initialMemories,'autos-80',[demoGroup])).toHaveLength(3);
  expect(filterCommunity(initialMemories,'groups',[demoGroup],'Fiat')).toHaveLength(1);
  expect(filterCommunity(initialMemories,'own',[demoGroup])).toHaveLength(0);
 });
 it('conserva el grupo de un recuerdo propio al guardarlo y recuperarlo',()=>{
  let raw=''; const storage={setItem:(_k:string,v:string)=>{raw=v;},getItem:()=>raw};
  const memory={...initialMemories.find(m=>m.groupId==='autos-80')!,source:'local' as const};
  expect(saveMemories([memory],storage)).toBe(true);
  expect(loadMemories(storage).memories[0].groupId).toBe('autos-80');
 });
});

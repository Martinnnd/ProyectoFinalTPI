import type { Decade } from "../types";
export const logoThemes: Record<Decade,{frame: number[]; sand: number[]; asset:string}> = {
  1970:{frame:[145,33,57],sand:[253,189,102],asset:'/logos/1970.png'},
  1980:{frame:[254,37,209],sand:[0,255,255],asset:'/logos/1980.png'},
  1990:{frame:[65,153,243],sand:[43,80,150],asset:'/logos/1990.png'},
  2000:{frame:[0,103,209],sand:[111,195,81],asset:'/logos/2000.png'},
};
export const mixColor=(a:number[],b:number[],t:number)=>a.map((n,i)=>n+(b[i]-n)*t);
export const rgb=(color:number[])=>`rgb(${color.map(Math.round).join(',')})`;

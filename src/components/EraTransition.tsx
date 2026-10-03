import { useEffect, useRef, useState } from "react";
import HourglassLogo from "./HourglassLogo";
import { logoThemes, mixColor, rgb } from "./logoThemes";
import type { Decade, Period } from "../types";

export default function EraTransition({from, next, onCommit, onDone}: {from:Decade; next:Period; onCommit:()=>void; onDone:()=>void}) {
  const source = useRef(from).current;
  const [logoDecade,setLogoDecade] = useState(source);
  const dialog = useRef<HTMLDialogElement>(null);
  const traveler = useRef<HTMLDivElement>(null);
  const callbacks = useRef({onCommit,onDone});
  callbacks.current = {onCommit,onDone};
  useEffect(() => {
    const modal=dialog.current!, logo=traveler.current!;
    let cancelled=false, committed=false;
    const animations: Animation[]=[];
    let sandFrame=0;
    const origins=Array.from(document.querySelectorAll<HTMLElement>('[data-era-logo]'));
    const origin=origins.find(el=>el.getBoundingClientRect().width>0);
    const bounds=()=>origin?.getBoundingClientRect() ?? {left:16,top:16,width:40,height:44};
    const frame=()=>{const r=bounds();return {transform:`translate(${r.left}px, ${r.top}px) scale(${r.width/180})`};};
    const commit=()=>{if(!committed){committed=true;callbacks.current.onCommit();}};
    const finish=()=>{commit();modal.close();origins.forEach(el=>el.classList.remove('logo-in-transit'));callbacks.current.onDone();};
    const animate=async(el:Element,frames:Keyframe[],duration:number)=>{const a=el.animate(frames,{duration,fill:'forwards',easing:'cubic-bezier(.22,.8,.24,1)'});animations.push(a);await a.finished;};
    const upperFull=[52,66,54,81,76,94,87,98,98,94,118,81,128,66,52,66];
    const upperEmpty=Array.from({length:16},(_,i)=>i%2===0?90:98);
    const lowerEmpty=[46,174,60,174,77,173,90,172,103,173,120,174,134,174,46,174];
    const lowerFull=[46,174,46,145,68,135,90,120,112,135,134,145,134,174,46,174];
    const sandPath=(a:number[],b:number[],t:number)=>{const v=a.map((n,i)=>n+(b[i]-n)*t);return `M${v[0]} ${v[1]} C${v.slice(2,8).join(' ')} C${v.slice(8,14).join(' ')} L${v[14]} ${v[15]}Z`;};
    const sourceTheme=logoThemes[source], targetTheme=logoThemes[next.decade];
    const paint=(frame:number[],sand:number[],depth:number)=>{
      const drawing=logo.querySelector('.real-hourglass')!;
      const shades=[mixColor(frame,[255,255,255],.32*depth),frame,mixColor(frame,[0,0,0],.3*depth)];
      drawing.querySelectorAll('#travel-gold stop').forEach((stop,i)=>stop.setAttribute('stop-color',rgb(shades[i])));
      drawing.querySelector('.glass-diagonal')!.setAttribute('stroke',rgb(frame));
      drawing.querySelector('.morph-sand')!.setAttribute('fill',rgb(sand));
      drawing.querySelectorAll('.sand-grain').forEach(el=>el.setAttribute('fill',rgb(mixColor(sand,[255,255,255],.4))));
      drawing.querySelectorAll('.glass-detail').forEach(el=>el.setAttribute('stroke',rgb(mixColor(sand,[255,255,255],.6))));
      modal.style.setProperty('--travel-hue',rgb(frame));
    };
    // Rotate first, then reshape the same gold bars and sand silhouettes in place.
    const morph=async(reverse=false)=>{
      const drawing=logo.querySelector<SVGElement>('.real-hourglass')!;
      const topBar=drawing.querySelector('.glass-top-bar')!,bottomBar=drawing.querySelector('.glass-bottom-bar')!;
      const diagonal=drawing.querySelector('.glass-diagonal')!;
      const upper=drawing.querySelector('.morph-upper')!,lower=drawing.querySelector('.morph-lower')!;
      const upperFrom=[32.5,37.5,33,72,49.5,98.5,77,107,96.5,90,114.5,65,127,37.5,32.5,37.5];
      const upperTo=reverse ? upperEmpty : upperFull;
      const lowerFrom=[61.5,162,67.5,120.5,93,92,106,88.5,134.5,104.5,146.5,130.5,149,162,61.5,162];
      const lowerTo=reverse ? lowerFull : lowerEmpty;
      await new Promise<void>(resolve=>{
        const start=performance.now();
        const tick=(now:number)=>{
          if(cancelled){resolve();return;}
          const progress=Math.min(1,(now-start)/700);
          const eased=progress*progress*progress*(progress*(progress*6-15)+10),t=reverse?1-eased:eased;
          drawing.style.opacity='1';
          svgLogo.style.opacity='0';
          topBar.setAttribute('d',`M${33.5+6.5*t} ${28.5+6.5*t}H${150-10*t}`);
          bottomBar.setAttribute('d',`M${33.5+6.5*t} ${173+2*t}H${150-10*t}`);
          [topBar,bottomBar].forEach(el=>{el.setAttribute('stroke-width',String(24-8*t));el.setAttribute('stroke','url(#travel-gold)');});
          diagonal.setAttribute('stroke-width',String(24*(1-t*t)));
          diagonal.setAttribute('opacity',String(Math.pow(1-t,1.5)));
          upper.setAttribute('d',sandPath(upperFrom,upperTo,t));lower.setAttribute('d',sandPath(lowerFrom,lowerTo,t));
          drawing.querySelectorAll<SVGElement>('.glass-detail').forEach(el=>el.style.opacity=String(t*t));
          const theme=reverse?targetTheme:sourceTheme;
          paint(theme.frame,theme.sand,t);
          if(progress<1)sandFrame=requestAnimationFrame(tick);else resolve();
        };
        sandFrame=requestAnimationFrame(tick);
      });
    };
    const svgLogo=logo.querySelector<SVGElement>('.hourglass-logo')!;
    modal.showModal();
    origins.forEach(el=>el.classList.add('logo-in-transit'));
    const run=async()=>{
      try {
        const cx=(window.innerWidth-180)/2, cy=(window.innerHeight-200)/2-24;
        const center={transform:`translate(${cx}px, ${cy}px) scale(1)`};
        const r=bounds();
        const flight=(from:{x:number;y:number;s:number},to:{x:number;y:number;s:number}) => Array.from({length:31},(_,i)=>{
          const t=i/30,u=1-t;
          // A shallow curved path rather than a straight diagonal, with a soft landing.
          const x=u*u*from.x+2*u*t*(from.x+(to.x-from.x)*.8)+t*t*to.x;
          const y=u*u*from.y+2*u*t*(from.y+(to.y-from.y)*.12)+t*t*to.y;
          return {offset:t,transform:`translate(${x}px,${y}px) scale(${from.s+(to.s-from.s)*t})`};
        });
        const svg=logo.querySelector('.hourglass-logo')!;
        modal.classList.add('time-flowing');
        await Promise.all([
          animate(logo,flight({x:r.left,y:r.top,s:r.width/180},{x:cx,y:cy,s:1}),580),
          animate(svg,[{transform:'rotate(0deg)'},{transform:'rotate(-96deg)',offset:.78},{transform:'rotate(-90deg)'}],650)
        ]);
        if(cancelled)return;
        modal.classList.add('morphing');
        await morph();
        if(cancelled)return;
        modal.classList.add('sand-running');
        const top=logo.querySelector('.morph-upper')!,bottom=logo.querySelector('.morph-lower')!;
        const clock=logo.querySelector<SVGElement>('.real-hourglass')!;
        const grains=Array.from(logo.querySelectorAll('.sand-grain'));
        await new Promise<void>(resolve=>{
          const start=performance.now();
          const tick=(now:number)=>{
            if(cancelled){resolve();return;}
            const t=Math.min(1,(now-start)/1400);
            const blend=t*t*(3-2*t);
            paint(mixColor(sourceTheme.frame,targetTheme.frame,blend),mixColor(sourceTheme.sand,targetTheme.sand,blend),1);
            clock.style.transform=`perspective(650px) rotateY(${360*blend}deg)`;
            top.setAttribute('d',sandPath(upperFull,upperEmpty,t));
            bottom.setAttribute('d',sandPath(lowerEmpty,lowerFull,t));
            const floor=174-49*t;
            grains.forEach((grain,i)=>{
              const phase=((now-start)/420+i/11)%1;
              grain.setAttribute('cy',String(99+phase*(floor-96)));
              grain.setAttribute('cx',String(90+Math.sin(i*7+phase*5)*(1+phase*2)));
              (grain as SVGElement).style.opacity=String(t>.94?(1-t)/.06:.8);
            });
            if(t>.68)commit();
            if(t<1)sandFrame=requestAnimationFrame(tick);else resolve();
          };
          sandFrame=requestAnimationFrame(tick);
        });
        if(cancelled)return;
        setLogoDecade(next.decade);
        modal.classList.add('time-arrived');
        modal.classList.remove('sand-running');
        await morph(true);
        if(cancelled)return;
        logo.querySelector<SVGElement>('.real-hourglass')!.style.opacity='0';
        svgLogo.style.opacity='1';
        await animate(svg,[{transform:'rotate(-90deg)'},{transform:'rotate(3deg)',offset:.8},{transform:'rotate(0deg)'}],320);
        if(cancelled)return;
        modal.classList.remove('time-flowing');
        modal.classList.add('time-returning');
        const end=bounds();
        await animate(logo,flight({x:cx,y:cy,s:1},{x:end.left,y:end.top,s:end.width/180}),530);
        if(!cancelled)finish();
      } catch { if(!cancelled)finish(); }
    };
    const skip=(e:Event)=>{e.preventDefault();cancelled=true;cancelAnimationFrame(sandFrame);animations.forEach(a=>a.cancel());finish();};
    modal.addEventListener('cancel',skip);
    const resize=()=>skip(new Event('resize'));
    window.addEventListener('resize',resize);
    void run();
    return ()=>{cancelled=true;cancelAnimationFrame(sandFrame);animations.forEach(a=>a.cancel());modal.removeEventListener('cancel',skip);window.removeEventListener('resize',resize);modal.close();origins.forEach(el=>el.classList.remove('logo-in-transit'));};
  },[]);
  return <dialog ref={dialog} className="era-travel" aria-label={`Viajando a los ${next.decade}`}><div className="era-travel-glow"/><div ref={traveler} className="era-travel-logo"><HourglassLogo decade={logoDecade}/>
      <svg className="real-hourglass" viewBox="0 0 180 200" fill="none" aria-hidden="true">
        <defs>
          <clipPath id="travel-upper"><path d="M47 38H133C133 69 111 87 93 98H87C69 87 47 69 47 38Z"/></clipPath>
          <clipPath id="travel-lower"><path d="M87 102H93C111 114 133 131 133 172H47C47 131 69 114 87 102Z"/></clipPath>
          <linearGradient id="travel-glass"><stop stopColor="#ffffff" stopOpacity=".22"/><stop offset=".45" stopColor="#ffffff" stopOpacity=".03"/><stop offset="1" stopColor="#ffffff" stopOpacity=".18"/></linearGradient>
          <linearGradient id="travel-gold" gradientUnits="userSpaceOnUse" x1="40" y1="25" x2="125" y2="185"><stop stopColor="#d7ae58"/><stop offset=".5" stopColor="#a67321"/><stop offset="1" stopColor="#82520e"/></linearGradient>
        </defs>
        <path className="glass-detail" d="M47 38H133C133 72 106 89 92 100C106 111 133 132 133 172H47C47 132 74 111 88 100C74 89 47 72 47 38Z" fill="url(#travel-glass)" stroke="#ecdcad" strokeOpacity=".5"/>
        {Array.from({length:11},(_,i)=><circle key={i} className="sand-grain" cx="90" cy="100" r={i%3===0?'.85':'.55'} fill="#f3d895"/>)}
        <path className="glass-detail" d="M54 44C56 67 70 79 79 85M54 162C55 145 62 131 72 122" stroke="#fff4d7" strokeOpacity=".5" strokeWidth="2" strokeLinecap="round"/>
        <g className="morph-sand" fill="#bead70"><path className="morph-upper"/><path className="morph-lower"/></g>
        <path className="glass-top-bar" d="M40 35H140" stroke="#9c6816" strokeWidth="16" strokeLinecap="round"/>
        <path className="glass-bottom-bar" d="M40 175H140" stroke="#9c6816" strokeWidth="16" strokeLinecap="round"/>
        <path className="glass-diagonal" d="M33.5 173L150 28.5" stroke="#9c6816" strokeWidth="24" strokeLinecap="round"/>
        <path className="glass-detail" d="M41 30H139M41 170H139" stroke="#e8c779" strokeOpacity=".65" strokeLinecap="round"/>
      </svg></div><div className="era-travel-caption" role="status"><span>EL TIEMPO NOS VUELVE A ENCONTRAR</span><strong>{next.decade}<small>s</small></strong></div></dialog>;
}

import { paperSound } from "./paperSound";
// Snapshot only the visible paper. It is inert, temporary, and never owns state.
export function turnNewspaperPage(stream: HTMLElement, backwards: boolean): () => void {
  if (getComputedStyle(stream).getPropertyValue('--paper-turn').trim() !== '1' || matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};
  const app = stream.closest('.app');
  if (!app) return () => {};
  const box = stream.getBoundingClientRect();
  const layer = document.createElement('div');
  layer.className = `paper-turn-overlay${backwards ? ' paper-turn-reverse' : ''}`;
  layer.setAttribute('aria-hidden', 'true');
  layer.inert = true;
  Object.assign(layer.style, { left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px` });
  function snapshot() {
    const copy = stream.cloneNode(true) as HTMLElement;
    copy.removeAttribute('id');
    copy.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
    copy.querySelectorAll('iframe,video,audio').forEach(node => node.remove());
    copy.classList.add('paper-turn-snapshot');
    Object.assign(copy.style, { width: `${box.width}px`, height: `${stream.scrollHeight}px`, transform: `translateY(-${stream.scrollTop}px)` });
    return copy;
  }
  const face = document.createElement('div'); face.className = 'paper-turn-face'; face.append(snapshot());
  const fold = document.createElement('div'); fold.className = 'paper-turn-fold';
  const reverse = document.createElement('div'); reverse.className = 'paper-turn-ink'; reverse.append(snapshot()); fold.append(reverse);
  const shadow = document.createElement('div'); shadow.className = 'paper-turn-shadow';
  layer.append(shadow, face, fold); app.append(layer);
  const duration = 1000;
  const stopSound=paperSound(duration);
  let raf=0;
  const start=performance.now();
  const draw=(now:number)=>{
    if(done)return;
    const t=Math.min(1,(now-start)/duration);
    // Gentle lift, accelerating sweep, then a short settling of the trailing edge.
    const progress=t*t*(3-2*t);
    const lift=Math.sin(Math.PI*t);
    const width=Math.max(1,box.width*.22*Math.pow(lift,.75));
    const edge=box.width*(1-progress);
    const skew=box.height*.045*lift*Math.cos(t*Math.PI);
    const curve=box.width*.018*lift;
    const points=Array.from({length:17},(_,i)=>{
      const y=i/16, x=edge+skew*(y-.5)+curve*Math.sin(Math.PI*y);
      return `${backwards?box.width-x:x}px ${y*box.height}px`;
    });
    face.style.clipPath=backwards?`polygon(100% 0,${points.join(',')},100% 100%)`:`polygon(0 0,${points.join(',')},0 100%)`;
    const left=backwards?box.width-edge-width:edge;
    Object.assign(fold.style,{left:`${left}px`,right:'auto',width:`${width}px`,top:'0',height:'100%',opacity:String(Math.min(1,lift*9)),transform:`skewY(${(backwards?-1:1)*skew/box.height*35}deg)`,borderRadius:`${8+lift*12}% ${8+lift*16}% ${8+lift*10}% ${8+lift*8}% / 3% 5% 4% 3%`});
    // The old page bleeds through the reverse side, moving with the printed fold.
    reverse.style.width=`${box.width}px`;
    reverse.style.transform=`translateX(${backwards?-edge:-edge+width}px) scaleX(-1)`;
    Object.assign(shadow.style,{left:`${left-width*.3}px`,right:'auto',width:`${width*1.8+12}px`,opacity:String(lift*.8),transform:`skewY(${skew/box.height*35}deg)`,filter:`blur(${3+lift*8}px)`});
    if(t<1)raf=requestAnimationFrame(draw);else cleanup();
  };
  let done = false;
  function cleanup() {
    if(done) return; done = true;
    cancelAnimationFrame(raf); stopSound(); layer.remove();
    window.removeEventListener('resize', cleanup); observer.disconnect(); clearTimeout(timer);
  }
  const observer = new MutationObserver(cleanup);
  observer.observe(app,{attributes:true,attributeFilter:['class']});
  window.addEventListener('resize',cleanup);
  const timer = setTimeout(cleanup,duration+100);
  raf=requestAnimationFrame(draw);
  return cleanup;
}

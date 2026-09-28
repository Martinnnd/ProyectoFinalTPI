import { animateDetailWindow } from './animateDetailWindow';
import { turnNewspaperPage } from './turnNewspaperPage';

export function transitionFeed(stream: HTMLElement, backwards: boolean, origin?: DOMRect): () => void {
  const style = getComputedStyle(stream);
  if (style.getPropertyValue('--paper-turn').trim() === '1') return turnNewspaperPage(stream, backwards);
  const effect = style.getPropertyValue('--feed-transition').trim();
  if (!effect || matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};
  if (effect === 'win95' || effect === 'messenger') return animateDetailWindow(stream, backwards, origin, effect);
  const app = stream.closest('.app');
  if (!app) return () => {};
  const bounds = stream.getBoundingClientRect();
  const layer = document.createElement('div');
  layer.className = `feed-transition-overlay transition-${effect}${backwards ? ' transition-back' : ''}`;
  layer.inert = true; layer.setAttribute('aria-hidden', 'true');
  Object.assign(layer.style, {position:'fixed',left:`${bounds.left}px`,top:`${bounds.top}px`,width:`${bounds.width}px`,height:`${bounds.height}px`,pointerEvents:'none',zIndex:'510',overflow:'hidden'});
  function element(tag:string, className:string, text='') {const node=document.createElement(tag);node.className=className;node.textContent=text;return node;}
  const frame=element('div','transition-window');
  const animations:Animation[]=[];
  const duration=1100;
    frame.append(element('span','arcade-transition-kicker','NOSTALGIA · MEMORY SYSTEM'),element('strong','arcade-transition-title',backwards?'SELECT MEMORY':'MEMORY UNLOCKED'),element('span','arcade-transition-subtitle',backwards?'VOLVIENDO A LA SELECCIÓN':'ENTRANDO AL RECUERDO'));
    const meter=element('div','arcade-transition-meter');for(let i=0;i<12;i++)meter.append(element('i',''));frame.append(meter);
    for(let i=0;i<8;i++) {const stripe=element('div','arcade-transition-stripe');Object.assign(stripe.style,{top:`${i*12.5}%`,height:'12.6%'});layer.append(stripe);animations.push(stripe.animate([{transform:`translateX(${i%2?-101:101}%)`},{transform:'translateX(0)',offset:.3},{transform:'translateX(0)',offset:.65},{transform:`translateX(${i%2?101:-101}%)`}],{duration:duration-140,delay:i*18,easing:'steps(10,end)',fill:'both'}));}
    animations.push(frame.animate([{opacity:0,transform:'scale(.94)'},{opacity:1,transform:'scale(1)',offset:.32},{opacity:1,offset:.66},{opacity:0,transform:'scale(1.03)'}],{duration,fill:'both'}));
  layer.append(frame);app.append(layer);
  const raf=requestAnimationFrame(()=>{
    const posts=stream.querySelector('.feed-posts');
    if(posts)animations.push(posts.animate([{opacity:0},{opacity:0,offset:.55},{opacity:1}],{duration,fill:'both'}));
  });
  let finished=false;
  function cleanup(){if(finished)return;finished=true;cancelAnimationFrame(raf);animations.forEach(a=>a.cancel());layer.remove();clearTimeout(timer);window.removeEventListener('resize',cleanup);observer.disconnect();}
  const observer=new MutationObserver(cleanup);observer.observe(app,{attributes:true,attributeFilter:['class']});window.addEventListener('resize',cleanup);
  const timer=setTimeout(cleanup,duration+80);
  return cleanup;
}

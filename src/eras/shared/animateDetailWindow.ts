// Animate the actual React window on entry; only closing needs an inert snapshot.
export function animateDetailWindow(stream: HTMLElement, backwards: boolean, origin: DOMRect | undefined, effect: string): () => void {
  const app=stream.closest('.app');
  if(!app)return ()=>{};
  const rect=stream.getBoundingClientRect();
  const target=origin??new DOMRect(rect.left+20,rect.top+60,rect.width*.7,120);
  const small=`translate(${Math.max(0,target.left-rect.left)}px,${Math.max(0,Math.min(rect.height-50,target.top-rect.top))}px) scale(${Math.max(.15,Math.min(1,target.width/rect.width))},${Math.max(.1,Math.min(.65,target.height/rect.height))})`;
  let animation:Animation|undefined;
  let layer:HTMLElement|undefined;
  let finished=false;
  const duration=effect==='win95'?550:650;
  if(backwards){
    const current=stream.querySelector('.detail-window');
    if(current){
      layer=document.createElement('div');layer.className=`feed-transition-overlay transition-${effect} transition-back`;layer.inert=true;layer.setAttribute('aria-hidden','true');
      Object.assign(layer.style,{position:'fixed',left:`${rect.left}px`,top:`${rect.top}px`,width:`${rect.width}px`,height:`${rect.height}px`,pointerEvents:'none',zIndex:'510'});
      const copy=current.cloneNode(true) as HTMLElement;copy.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));copy.querySelectorAll('iframe,video,audio').forEach(e=>e.remove());layer.append(copy);app.append(layer);
      const sourceScroll=current.querySelector('.transition-content');const cloneScroll=copy.querySelector('.transition-content');if(sourceScroll&&cloneScroll)cloneScroll.scrollTop=sourceScroll.scrollTop;
      animation=copy.animate([{transform:'none',opacity:1},{transform:small,opacity:0}],{duration,easing:effect==='win95'?'steps(8,end)':'cubic-bezier(.4,0,.8,.4)',fill:'both'});
    }
  }
  const raf=requestAnimationFrame(()=>{
    if(backwards||finished)return;
    const window=stream.querySelector('.detail-window');
    if(window)animation=window.animate([{transform:small,opacity:.25},{transform:'none',opacity:1}],{duration,easing:effect==='win95'?'steps(8,end)':'cubic-bezier(.16,1,.3,1)',fill:'both'});
  });
  function cleanup(){if(finished)return;finished=true;cancelAnimationFrame(raf);animation?.cancel();layer?.remove();observer.disconnect();clearTimeout(timer);window.removeEventListener('resize',cleanup);}
  const observer=new MutationObserver(cleanup);observer.observe(app,{attributes:true,attributeFilter:['class']});window.addEventListener('resize',cleanup);
  const timer=setTimeout(cleanup,duration+100);
  return cleanup;
}

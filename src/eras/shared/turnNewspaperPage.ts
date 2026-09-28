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
  const duration = 1050;
  const options = { duration, easing: 'cubic-bezier(.32,.04,.2,1)', fill: 'forwards' as const };
  const cuts = backwards ? ['inset(0 0 0 0)', 'inset(0 0 0 12%)','inset(0 0 0 65%)','inset(0 0 0 100%)'] : ['inset(0 0 0 0)', 'inset(0 12% 0 0)','inset(0 65% 0 0)','inset(0 100% 0 0)'];
  const animations = [face.animate(cuts.map((clipPath, i) => ({ clipPath, offset:[0,.2,.7,1][i] })), options)];
  const direction = backwards ? 1 : -1;
  for (const element of [fold, shadow]) animations.push(element.animate([
    { transform:`translateX(${backwards ? -100 : 100}%) scaleX(.04) skewY(0deg)`, opacity:0, offset:0 },
    { transform:`translateX(${direction * box.width * .12}px) scaleX(.75) skewY(${direction * 3}deg)`, opacity:1, offset:.2 },
    { transform:`translateX(${direction * box.width * .65}px) scaleX(1) skewY(${direction * -2}deg)`, opacity:1, offset:.7 },
    { transform:`translateX(${direction * box.width}px) scaleX(.1) skewY(0deg)`, opacity:0, offset:1 }
  ],options));
  let done = false;
  function cleanup() {
    if(done) return; done = true;
    animations.forEach(animation => animation.cancel()); layer.remove();
    window.removeEventListener('resize', cleanup); observer.disconnect(); clearTimeout(timer);
  }
  const observer = new MutationObserver(cleanup);
  observer.observe(app,{attributes:true,attributeFilter:['class']});
  window.addEventListener('resize',cleanup);
  const timer = setTimeout(cleanup,duration+100);
  void animations[0].finished.then(cleanup).catch(() => {});
  return cleanup;
}

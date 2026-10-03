// Original paper rustle: filtered noise, irregular friction and a soft landing.
let context: AudioContext | undefined;
export function paperSound(duration: number): () => void {
  let cancelled=false;
  const sources: AudioBufferSourceNode[]=[];
  try {
    context ??= new AudioContext();
    const audio=context;
    void audio.resume().then(()=>{
      if(cancelled)return;
      const seconds=duration/1000;
      const buffer=audio.createBuffer(1,Math.ceil(audio.sampleRate*seconds),audio.sampleRate);
      const data=buffer.getChannelData(0);
      let previous=0;
      for(let i=0;i<data.length;i++){
        const t=i/audio.sampleRate, p=t/seconds;
        previous=.65*previous+.35*(Math.random()*2-1);
        const sweep=Math.pow(Math.sin(Math.PI*p),1.4);
        const wrinkles=.55+.2*Math.sin(t*73)+.15*Math.sin(t*137);
        const landing=Math.exp(-Math.pow((p-.89)/.035,2))*.4;
        data[i]=previous*(sweep*wrinkles+landing);
      }
      const source=audio.createBufferSource();source.buffer=buffer;sources.push(source);
      const filter=audio.createBiquadFilter();filter.type='bandpass';filter.frequency.setValueAtTime(1700,audio.currentTime);filter.frequency.linearRampToValueAtTime(850,audio.currentTime+seconds);filter.Q.value=.65;
      const gain=audio.createGain();gain.gain.value=.13;
      source.connect(filter);filter.connect(gain);gain.connect(audio.destination);source.start();
      source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
    }).catch(()=>{});
  } catch { /* Paper movement does not depend on audio support. */ }
  return ()=>{cancelled=true;sources.forEach(source=>{try{source.stop();}catch{}});};
}

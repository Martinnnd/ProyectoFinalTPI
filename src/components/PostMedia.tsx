import { useState } from 'react';
import type { Memory } from '../types';
import { youtubeId, safeMediaUrl } from '../media';
export function PostMusic({music}:{music:Memory['music']}) {
 const [open,setOpen]=useState(false);
 if(!music || !/^[A-Za-z0-9]{22}$/.test(music.spotifyId))return null;
 return <div className="post-music"><button onClick={()=>setOpen(v=>!v)} aria-expanded={open}><span aria-hidden="true">♫</span><span><strong>{music.title}</strong><small>{music.artist} · Spotify</small></span><span>{open?'Cerrar':'Escuchar'}</span></button>{open&&<iframe title={`${music.title} — ${music.artist}`} src={`https://open.spotify.com/embed/track/${music.spotifyId}`} height="152" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"/>}</div>;
}
export default function PostMedia({memory}:{memory:Memory}) {
 const [failed,setFailed]=useState(false);
 const media=memory.media??(memory.image?{kind:'image' as const,url:memory.image}:undefined);
 if(!media)return null;
 if(failed)return <p role="status">No se pudo cargar el archivo adjunto.</p>;
 if(media.kind==='youtube'){const id=youtubeId(media.url);return id?<div className="post-attachment"><iframe title={`Video de ${memory.title}`} src={`https://www.youtube-nocookie.com/embed/${id}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin"/><a href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noreferrer">Abrir en YouTube</a></div>:null;}
 if(!safeMediaUrl(media.url,media.kind))return null;
 return <div className="post-attachment">{media.kind==='video'?<video src={media.url} controls preload="metadata" playsInline onError={()=>setFailed(true)}/>:<img src={media.url} alt={`Imagen adjunta a ${memory.title}`} loading="lazy" onError={()=>setFailed(true)}/ >}{memory.imageCaption&&<small className="attachment-caption">{memory.imageCaption}</small>}</div>;
}

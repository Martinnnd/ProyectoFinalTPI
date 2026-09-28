export function youtubeId(value: string): string | null {
 try { const u=new URL(value); if(u.protocol!=='https:')return null;
 const host=u.hostname.replace(/^www\./,'');
 const id=host==='youtu.be'?u.pathname.slice(1):['youtube.com','m.youtube.com','youtube-nocookie.com'].includes(host)?(u.pathname==='/watch'?u.searchParams.get('v'):u.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1]):null;
 return id&&/^[\w-]{11}$/.test(id)?id:null;
 } catch{return null;}
}
export function spotifyId(value:string):string|null {
 try {const u=new URL(value);const id=u.pathname.match(/^\/(?:intl-[a-z]+\/)?track\/([A-Za-z0-9]{22})\/?$/)?.[1];return u.protocol==='https:'&&u.hostname==='open.spotify.com'&&id?id:null;}catch{return null;}
}
export function safeMediaUrl(value:string,kind:'image'|'video') {
 return /^https:\/\//i.test(value) || (kind==='image'?/^data:image\/(?:jpeg|png|webp|gif);base64,/:/^data:video\/(?:mp4|webm|ogg);base64,/).test(value);
}

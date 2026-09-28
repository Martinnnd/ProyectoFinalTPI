import {it,expect} from 'vitest';
import {youtubeId,spotifyId,safeMediaUrl,normalizeAttachment} from './media';
import {isMemory} from './storage';
import {initialMemories} from './data';
it('normaliza enlaces de YouTube sin permitir hosts falsos',()=>{
 for(const url of ['https://youtu.be/dQw4w9WgXcQ','https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10','https://www.youtube.com/shorts/dQw4w9WgXcQ'])expect(youtubeId(url)).toBe('dQw4w9WgXcQ');
 expect(youtubeId('https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ')).toBeNull();
});
it('valida canciones y rechaza URLs ejecutables o SVG subido',()=>{
 expect(spotifyId('https://open.spotify.com/track/2fsl9JbUqYmOGRvv06USem?si=test')).toBe('2fsl9JbUqYmOGRvv06USem');
 expect(safeMediaUrl('javascript:alert(1)','image')).toBe(false);
 expect(safeMediaUrl('data:image/svg+xml;base64,AAA','image')).toBe(false);
});
it('carga recuerdos antiguos y valida adjuntos nuevos',()=>{
 const memory={...initialMemories[0],source:'local'};
 expect(isMemory(memory)).toBe(true);
 expect(isMemory({...memory,media:{kind:'youtube',url:'https://youtu.be/dQw4w9WgXcQ'}})).toBe(true);
 expect(isMemory({...memory,music:{spotifyId:'invalid',title:'test',artist:'test'}})).toBe(false);
});

it('reconoce YouTube aunque el recuerdo se haya guardado como foto o video',()=>{
 for(const kind of ['image','video','youtube'] as const)expect(normalizeAttachment({kind,url:'https://youtu.be/dQw4w9WgXcQ?si=test'})).toEqual({kind:'youtube',url:'https://www.youtube.com/watch?v=dQw4w9WgXcQ'});
 expect(normalizeAttachment({kind:'video',url:'https://example.com/video.mp4'}).kind).toBe('video');
});

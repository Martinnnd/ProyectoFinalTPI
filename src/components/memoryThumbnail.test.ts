import { expect, it } from 'vitest';
import { memoryThumbnail } from './memoryThumbnail';
import { toMemory, type Publication } from '../publicationsApi';
import type { Memory } from '../types';

const memory: Memory = { id: '1', title: 'Recuerdo', description: '', author: 'Ana', year: 1990, category: 'Personales', place: 'Rosario', lat: -32.95, lng: -60.66, source: 'backend' };
const thumbnail = 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg';

it('muestra la miniatura del enlace de YouTube recién publicado', () => {
  expect(memoryThumbnail({ ...memory, media: { kind: 'youtube', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } })).toBe(thumbnail);
  expect(memoryThumbnail({ ...memory, media: { kind: 'youtube', url: 'https://youtu.be/dQw4w9WgXcQ' } })).toBe(thumbnail);
});

it('muestra la miniatura al recuperar el video del backend', () => {
  const publication: Publication = { id: 1, titulo: 'Video', fecha: '1990-01-01T00:00:00Z', categoria: 'Personales', urlMultimedia: 'https://youtu.be/dQw4w9WgXcQ', tipoMultimedia: 'Video', autor: { id: 1, username: 'Ana' } };
  expect(memoryThumbnail(toMemory(publication, memory))).toBe(thumbnail);
});

it('mantiene las fotos y los enlaces antiguos de YouTube y omite videos sin miniatura', () => {
  expect(memoryThumbnail({ ...memory, image: 'https://example.com/foto.jpg' })).toBe('https://example.com/foto.jpg');
  expect(memoryThumbnail({ ...memory, image: 'https://youtu.be/dQw4w9WgXcQ' })).toBe(thumbnail);
  expect(memoryThumbnail({ ...memory, media: { kind: 'video', url: 'https://example.com/video.mp4' } })).toBeUndefined();
  expect(memoryThumbnail({ ...memory, media: { kind: 'youtube', url: 'https://youtube.com/watch?v=invalid' } })).toBeUndefined();
});

import { expect, it } from 'vitest';
import { buildPublicationFormData } from './publicationFormData';
import type { Memory } from './types';

const memory: Memory = {
  id: 'borrador',
  title: 'Mi recuerdo',
  description: 'Una historia personal.',
  year: 1985,
  category: 'Personales',
  place: 'Rosario',
  lat: -32.95,
  lng: -60.66,
  author: 'Vos',
  source: 'local',
  media: { kind: 'video', url: 'https://example.com/video.mp4' },
};

it('arma el multipart compartido para publicaciones generales', () => {
  const form = buildPublicationFormData(memory, 7);
  expect(Object.fromEntries(form.entries())).toMatchObject({
    Titulo: 'Mi recuerdo',
    Descripcion: 'Una historia personal.',
    Categoria: 'Recuerdos_Personales',
    NombreLugar: 'Rosario',
    Latitud: '-32.95',
    Longitud: '-60.66',
    AutorId: '7',
    TipoMultimedia: 'Video',
    UrlArchivo: 'https://example.com/video.mp4',
  });
});

it('omite AutorId cuando el backend obtiene el usuario del token', () => {
  const form = buildPublicationFormData(memory);
  expect(form.has('AutorId')).toBe(false);
});

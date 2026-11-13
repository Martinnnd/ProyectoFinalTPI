import type { Memory } from './types';
import { memoryDateIso } from './memoryDate';

function dataUriToBlob(dataUri: string): Blob {
  const byteString = atob(dataUri.split(',')[1]);
  const mimeString = dataUri.split(',')[0].split(':')[1].split(';')[0];
  const bytes = new Uint8Array(byteString.length);
  for (let index = 0; index < byteString.length; index++) {
    bytes[index] = byteString.charCodeAt(index);
  }
  return new Blob([bytes], { type: mimeString });
}

function backendCategory(category: Memory['category']): string {
  return category === 'Personales' ? 'Recuerdos_Personales' : category;
}

export function buildPublicationFormData(memory: Memory, authorId?: number, gpsUsuario?: {lat: number; lng: number} | null): FormData {
  const formData = new FormData();
  formData.append('Titulo', memory.title);
  formData.append('Descripcion', memory.description);
  // Keep year-only legacy records compatible; new submissions require a full date.
  const date = memory.date ?? `${memory.year}-01-01`;
  const iso = memoryDateIso(date);
  if (!iso) throw new Error('La fecha del recuerdo no es válida.');
  formData.append('Fecha', iso);
  formData.append('Categoria', backendCategory(memory.category));
  formData.append('NombreLugar', memory.place);
  formData.append('Latitud', String(memory.lat));
  formData.append('Longitud', String(memory.lng));
  if (authorId !== undefined) formData.append('AutorId', String(authorId));
  if (gpsUsuario) {
    formData.append('GpsLatitud', String(gpsUsuario.lat));
    formData.append('GpsLongitud', String(gpsUsuario.lng));
  }

  if (memory.attachments && memory.attachments.length > 0) {
    if (memory.attachments.length > 4) throw new Error('Una publicación admite hasta 4 adjuntos.');
    memory.attachments.forEach((attachment, index) => {
      const prefix = 'Adjuntos[' + index + '].';
      formData.append(prefix + 'Tipo', attachment.kind === 'image' ? 'Foto' : 'Video');
      appendMedia(formData, attachment.url, prefix + 'Archivo', prefix + 'Url', index);
    });
  } else {
  const mediaUrl = memory.image || memory.media?.url || '';
  const isVideo = memory.media && memory.media.kind !== 'image';
  formData.append('TipoMultimedia', isVideo ? 'Video' : 'Foto');

  appendMedia(formData, mediaUrl, 'Archivo', 'UrlArchivo', 0);
  }

  if (memory.music) {
    const music = memory.music;
    if (!/^[A-Za-z0-9]{22}$/.test(music.spotifyId)
      || !music.title.trim() || music.title.length > 120
      || !music.artist.trim() || music.artist.length > 120)
      throw new Error('La música requiere una canción de Spotify, título y artista válidos.');
    formData.append('Musica.SpotifyId', music.spotifyId);
    formData.append('Musica.Titulo', music.title.trim());
    formData.append('Musica.Artista', music.artist.trim());
  }

  return formData;
}

function appendMedia(form: FormData, url: string, fileField: string, urlField: string, index: number) {
  if (url.startsWith('data:')) {
    const blob = dataUriToBlob(url);
    const extension = blob.type.split('/')[1] || 'jpg';
    form.append(fileField, blob, 'adjunto-' + index + '.' + extension);
  } else if (url) {
    form.append(urlField, url);
  }
}

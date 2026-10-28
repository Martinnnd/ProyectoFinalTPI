import { safeMediaUrl, youtubeId } from './media';

// Suspensión temporal para la presentación. Volver a true en ambos proyectos
// cuando se reactive la obligatoriedad (ver docs/MULTIMEDIA-OPCIONAL.md).
export const REQUIRE_PUBLICATION_MEDIA = process.env.NEXT_PUBLIC_REQUIRE_PUBLICATION_MEDIA === 'true';

export function publicationMediaError(
  url: string, kind: 'image' | 'video' | 'youtube', required = REQUIRE_PUBLICATION_MEDIA,
): string | null {
  if (!url.trim()) return required ? 'Adjuntá una foto, un video o un enlace válido de YouTube para continuar.' : null;
  if (kind === 'youtube' ? !youtubeId(url) : !safeMediaUrl(url, kind))
    return 'El adjunto debe ser una foto, un video o un enlace válido de YouTube.';
  return null;
}

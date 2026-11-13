import { normalizeAttachment, safeMediaUrl, youtubeId } from "./media";
import type { Memory, MemoryAttachment } from "./types";

// Suspensión temporal para la presentación. Volver a true en ambos proyectos
// cuando se reactive la obligatoriedad (ver docs/MULTIMEDIA-OPCIONAL.md).
export const REQUIRE_PUBLICATION_MEDIA =
  process.env.NEXT_PUBLIC_REQUIRE_PUBLICATION_MEDIA === "true";

export function publicationMediaError(
  url: string,
  kind: "image" | "video" | "youtube",
  required = REQUIRE_PUBLICATION_MEDIA,
): string | null {
  if (!url.trim())
    return required
      ? "Adjuntá una foto, un video o un enlace válido de YouTube para continuar."
      : null;
  if (kind === "youtube" ? !youtubeId(url) : !safeMediaUrl(url, kind))
    return "El adjunto debe ser una foto, un video o un enlace válido de YouTube.";
  return null;
}

export function getMemoryAttachments(memory: Memory): MemoryAttachment[] {
  if (memory.attachments?.length) return memory.attachments.map(normalizeAttachment);
  if (memory.media) return [normalizeAttachment(memory.media)];
  return memory.image ? [normalizeAttachment({ kind: "image", url: memory.image })] : [];
}

export function publicationAttachmentsError(
  attachments: MemoryAttachment[],
  maxAttachments: number,
  required = REQUIRE_PUBLICATION_MEDIA,
): string | null {
  if (attachments.length > maxAttachments)
    return (
      "Tu categoría admite hasta " +
      maxAttachments +
      " adjunto" +
      (maxAttachments === 1 ? "" : "s") +
      " por recuerdo."
    );
  if (attachments.length === 0) return publicationMediaError("", "image", required);
  for (const attachment of attachments) {
    const error = publicationMediaError(attachment.url, attachment.kind, true);
    if (error) return error;
  }
  return null;
}

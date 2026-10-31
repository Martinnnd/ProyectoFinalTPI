import type { Memory } from "../types";
import { safeMediaUrl, youtubeId } from "../media";
export function memoryThumbnail(memory: Memory): string | undefined {
  const videoId = youtubeId(memory.media?.url ?? memory.image ?? "");
  if (videoId) return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  const url =
    memory.media?.kind === "image" ? memory.media.url : !memory.media ? memory.image : undefined;
  return url && safeMediaUrl(url, "image") && !/youtu\.?be/i.test(url) ? url : undefined;
}

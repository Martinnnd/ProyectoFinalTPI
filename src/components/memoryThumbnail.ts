import type { Memory } from "../types";
import { safeMediaUrl } from "../media";
export function memoryThumbnail(memory: Memory): string | undefined {
  const url = memory.media?.kind === "image" ? memory.media.url : !memory.media ? memory.image : undefined;
  return url && safeMediaUrl(url, "image") && !/youtu\.?be/i.test(url) ? url : undefined;
}

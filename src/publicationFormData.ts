import type { Memory } from "./types";
import { memoryDateIso } from "./memoryDate";

function dataUriToBlob(dataUri: string): Blob {
  const byteString = atob(dataUri.split(",")[1]);
  const mimeString = dataUri.split(",")[0].split(":")[1].split(";")[0];
  const bytes = new Uint8Array(byteString.length);
  for (let index = 0; index < byteString.length; index++) {
    bytes[index] = byteString.charCodeAt(index);
  }
  return new Blob([bytes], { type: mimeString });
}

function backendCategory(category: Memory["category"]): string {
  return category === "Personales" ? "Recuerdos_Personales" : category;
}

export function buildPublicationFormData(
  memory: Memory,
  authorId?: number,
  gpsUsuario?: { lat: number; lng: number } | null,
): FormData {
  const formData = new FormData();
  formData.append("Titulo", memory.title);
  formData.append("Descripcion", memory.description);
  // Keep year-only legacy records compatible; new submissions require a full date.
  const date = memory.date ?? `${memory.year}-01-01`;
  const iso = memoryDateIso(date);
  if (!iso) throw new Error("La fecha del recuerdo no es válida.");
  formData.append("Fecha", iso);
  formData.append("Categoria", backendCategory(memory.category));
  formData.append("NombreLugar", memory.place);
  formData.append("Latitud", String(memory.lat));
  formData.append("Longitud", String(memory.lng));
  if (authorId !== undefined) formData.append("AutorId", String(authorId));
  if (gpsUsuario) {
    formData.append("GpsLatitud", String(gpsUsuario.lat));
    formData.append("GpsLongitud", String(gpsUsuario.lng));
  }

  const mediaUrl = memory.image || memory.media?.url || "";
  const isVideo = memory.media && memory.media.kind !== "image";
  formData.append("TipoMultimedia", isVideo ? "Video" : "Foto");

  if (mediaUrl.startsWith("data:")) {
    const blob = dataUriToBlob(mediaUrl);
    const extension = blob.type.split("/")[1] || "jpg";
    formData.append("Archivo", blob, `upload.${extension}`);
  } else if (mediaUrl) {
    formData.append("UrlArchivo", mediaUrl);
  }

  return formData;
}

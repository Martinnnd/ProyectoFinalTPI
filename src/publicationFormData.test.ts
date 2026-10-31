import { expect, it } from "vitest";
import { buildPublicationFormData } from "./publicationFormData";
import type { Memory } from "./types";

const memory: Memory = {
  id: "borrador",
  title: "Mi recuerdo",
  description: "Una historia personal.",
  year: 1985,
  category: "Personales",
  place: "Rosario",
  lat: -32.95,
  lng: -60.66,
  author: "Vos",
  source: "local",
  media: { kind: "video", url: "https://example.com/video.mp4" },
};

it("arma el multipart compartido para publicaciones generales", () => {
  const form = buildPublicationFormData(memory, 7);
  expect(Object.fromEntries(form.entries())).toMatchObject({
    Titulo: "Mi recuerdo",
    Descripcion: "Una historia personal.",
    Categoria: "Recuerdos_Personales",
    NombreLugar: "Rosario",
    Latitud: "-32.95",
    Longitud: "-60.66",
    AutorId: "7",
    TipoMultimedia: "Video",
    UrlArchivo: "https://example.com/video.mp4",
  });
});

it("omite AutorId cuando el backend obtiene el usuario del token", () => {
  const form = buildPublicationFormData(memory);
  expect(form.has("AutorId")).toBe(false);
});

it("envía el día y mes elegidos a medianoche UTC", () => {
  const form = buildPublicationFormData({ ...memory, date: "1991-04-15", year: 1991 });
  expect(form.get("Fecha")).toBe("1991-04-15T00:00:00.000Z");
});

it("acepta el 29 de febrero bisiesto y rechaza fechas inexistentes", () => {
  expect(buildPublicationFormData({ ...memory, date: "2000-02-29", year: 2000 }).get("Fecha")).toBe(
    "2000-02-29T00:00:00.000Z",
  );
  expect(() => buildPublicationFormData({ ...memory, date: "1991-02-29" })).toThrow("fecha");
  expect(() => buildPublicationFormData({ ...memory, date: "1991-04-31" })).toThrow("fecha");
});

it("mantiene las fechas antiguas con solo año en UTC", () => {
  expect(buildPublicationFormData(memory).get("Fecha")).toBe("1985-01-01T00:00:00.000Z");
});

it("crea recuerdos de texto sin agregar un archivo ni inventar una URL", () => {
  const form = buildPublicationFormData({ ...memory, media: undefined, image: undefined });
  expect(form.has("Archivo")).toBe(false);
  expect(form.has("UrlArchivo")).toBe(false);
  expect(form.get("Titulo")).toBe(memory.title);
});

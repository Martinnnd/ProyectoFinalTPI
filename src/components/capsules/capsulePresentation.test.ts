import { describe, expect, it } from "vitest";
import { capsuleObjects, capsulePeriod, mergeCapsuleItems } from "./capsulePresentation";

describe("presentación de cápsulas", () => {
  it("cambia el soporte visual en las seis décadas sin asignar una época al contenido", () => {
    expect(Object.values(capsuleObjects).map((object) => object.medium)).toEqual([
      "cassette",
      "vhs",
      "disc",
      "usb",
      "phone",
      "cloud",
    ]);
  });
  it("calcula la etiqueta con el período real y conserva el año en UTC", () => {
    expect(
      capsulePeriod({ fechaDesde: "2000-01-01T00:00:00Z", fechaHasta: "2022-12-18T00:00:00Z" }),
    ).toBe("2000 — 2022");
    expect(
      capsulePeriod({ fechaDesde: "2000-01-01T00:00:00Z", fechaHasta: "2000-12-31T00:00:00Z" }),
    ).toBe("2000");
    expect(capsulePeriod({ fechaDesde: null, fechaHasta: null })).toBe("Tu historia empieza acá");
  });
  it("une páginas sin duplicar claves, conserva el orden y actualiza los datos repetidos", () => {
    expect(
      mergeCapsuleItems(
        [
          { id: 7, nombre: "Antes" },
          { id: 9, nombre: "Otro" },
        ],
        [
          { id: 9, nombre: "Actualizado" },
          { id: 12, nombre: "Nuevo" },
        ],
      ),
    ).toEqual([
      { id: 7, nombre: "Antes" },
      { id: 9, nombre: "Actualizado" },
      { id: 12, nombre: "Nuevo" },
    ]);
  });
});

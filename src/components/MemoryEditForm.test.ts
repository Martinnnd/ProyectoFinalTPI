import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import MemoryForm from "./MemoryForm";
import type { Memory } from "../types";

describe("Edición de publicaciones", () => {
  it("ofrece únicamente título y descripción, sin los pasos de creación", () => {
    const initial: Memory = {
      id: "42",
      title: "Mi recuerdo",
      description: "Una historia",
      year: 1985,
      date: "1985-01-01",
      category: "Personales",
      author: "Agus",
      place: "Buenos Aires",
      lat: -34.6,
      lng: -58.4,
      image: "https://example.com/photo.jpg",
      source: "backend",
    };
    const html = renderToStaticMarkup(
      createElement(MemoryForm, {
        initial,
        point: { lat: initial.lat, lng: initial.lng },
        decade: 1980,
        onCancel: () => {},
        onSave: () => {},
      }),
    );
    expect(html.match(/<(?:input|textarea|select)\b/g)).toHaveLength(2);
    expect(html).toContain('name="title"');
    expect(html).toContain('name="description"');
    expect(html).toContain("Guardar cambios");
    expect(html).not.toContain("memory-form-progress");
  });
});

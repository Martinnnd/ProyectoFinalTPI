import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import RetroMediaPlaceholder from "./RetroMediaPlaceholder";

describe("RetroMediaPlaceholder", () => {
  it("renderiza el estado 'ARCHIVO SONORO · SIN FOTO ADJUNTA' cuando no hay imagen", () => {
    const html = renderToStaticMarkup(
      createElement(RetroMediaPlaceholder, {
        year: 1985,
        title: "Tarde de vinilos",
        category: "Música",
        failed: false,
      })
    );
    expect(html).toContain("ARCHIVO SONORO · SIN FOTO ADJUNTA");
    expect(html).toContain("1985");
    expect(html).toContain("Tarde de vinilos");
    expect(html).toContain("NOSTALGIAR STEREO");
    expect(html).not.toContain("is-failed");
  });

  it("renderiza el estado 'SEÑAL PERDIDA' cuando la imagen falló", () => {
    const html = renderToStaticMarkup(
      createElement(RetroMediaPlaceholder, {
        year: 1994,
        failed: true,
      })
    );
    expect(html).toContain("SEÑAL PERDIDA · ARCHIVO NO DISPONIBLE");
    expect(html).toContain("is-failed");
    expect(html).toContain("1994");
  });

  it("admite modo compacto para miniaturas de mapa", () => {
    const html = renderToStaticMarkup(
      createElement(RetroMediaPlaceholder, {
        compact: true,
        year: 1978,
      })
    );
    expect(html).toContain("is-compact");
  });
});

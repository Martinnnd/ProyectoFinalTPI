import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import PostRating from "./PostRating";
import NostalgiaPointSelector from "./NostalgiaPointSelector";

describe("Puntuación de publicaciones", () => {
  it("muestra cinco isotipos bloqueados para Errante y los habilita para Nostálgico", () => {
    const locked = renderToStaticMarkup(
      createElement(PostRating, { memoryTitle: "Recuerdo", canRate: false, onRate: () => {} }),
    );
    const enabled = renderToStaticMarkup(
      createElement(PostRating, {
        memoryTitle: "Recuerdo",
        canRate: true,
        value: 3,
        onRate: () => {},
      }),
    );
    expect(locked.match(/src="\/nostalgiar-rail-logo.png"/g)).toHaveLength(5);
    expect(locked.match(/disabled=""/g)).toHaveLength(5);
    expect(enabled).not.toContain('disabled=""');
    expect(enabled.match(/data-filled="true"/g)).toHaveLength(3);
  });
  it("el selector compartido limita los aportes al saldo disponible sin ofrecer quitar votos acumulativos", () => {
    const html = renderToStaticMarkup(
      createElement(NostalgiaPointSelector, {
        title: "Canción",
        canRate: true,
        maxPoints: 2,
        onRate: () => {},
      }),
    );
    expect(html.match(/src="\/nostalgiar-rail-logo.png"/g)).toHaveLength(5);
    expect(html.match(/disabled=""/g)).toHaveLength(3);
    expect(html).toContain("Dar 1 punto de nostalgia a Canción");
    expect(html).toContain("Dar 5 puntos de nostalgia a Canción");
    expect(html).not.toContain("Quitar");
  });
});

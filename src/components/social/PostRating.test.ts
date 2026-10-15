import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import PostRating from "./PostRating";

describe("Puntuación de publicaciones", () => {
  it("muestra cinco isotipos bloqueados para Errante y los habilita para Nostálgico", () => {
    const locked = renderToStaticMarkup(createElement(PostRating, { memoryTitle: "Recuerdo", canRate: false, onRate: () => {} }));
    const enabled = renderToStaticMarkup(createElement(PostRating, { memoryTitle: "Recuerdo", canRate: true, value: 3, onRate: () => {} }));
    expect(locked.match(/src="\/nostalgiar-rail-logo.png"/g)).toHaveLength(5);
    expect(locked.match(/disabled=""/g)).toHaveLength(5);
    expect(enabled).not.toContain('disabled=""');
    expect(enabled.match(/data-filled="true"/g)).toHaveLength(3);
  });
});

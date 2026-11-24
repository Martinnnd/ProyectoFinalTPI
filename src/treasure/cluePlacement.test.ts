import { describe, expect, it } from "vitest";
import { chooseClueAfter, placeClue } from "./cluePlacement";

describe("posición de la pista entre publicaciones", () => {
  it.each([
    [0, 3],
    [0.249, 3],
    [0.25, 4],
    [0.499, 4],
    [0.5, 5],
    [0.749, 5],
    [0.75, 6],
    [0.999, 6],
    [1, 6],
  ])("elige %s dentro de las primeras seis publicaciones", (random, expected) => {
    expect(chooseClueAfter(random)).toBe(expected);
  });
  it("no cambia de posición con likes, consultas de estado o páginas adicionales", () => {
    const first = placeClue(null, "7:1", 5, 8);
    expect(placeClue(first, "7:1", 3, 8)).toBe(first);
    expect(placeClue(first, "7:1", 6, 100)).toBe(first);
  });
  it("ubica la pista al final de un feed corto y conserva ese lugar al paginar", () => {
    const first = placeClue(null, "7:1", 6, 2);
    expect(first.after).toBe(2);
    expect(placeClue(first, "7:1", 6, 10)).toBe(first);
  });
  it("se adapta a las primeras publicaciones si antes no había ninguna", () => {
    const empty = placeClue(null, "7:1", 4, 0);
    expect(empty.after).toBe(0);
    expect(placeClue(empty, "7:1", 4, 8).after).toBe(4);
  });
  it("reinicia la posición para otro usuario o una nueva semana", () => {
    const first = placeClue(null, "7:1", 6, 8);
    expect(placeClue(first, "8:1", 3, 8).after).toBe(3);
    expect(placeClue(first, "7:2", 4, 8).after).toBe(4);
  });
});

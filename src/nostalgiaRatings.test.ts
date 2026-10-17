import { describe, expect, it } from "vitest";
import { totalGivenNostalgia, updateNostalgiaRating } from "./nostalgiaRatings";

describe("Puntos de nostalgia de muestra", () => {
  it("alcanza cinco puntos con una o varias publicaciones y reemplaza la puntuación anterior", () => {
    const first = updateNostalgiaRating({}, "a", 3);
    const second = updateNostalgiaRating(first, "b", 2);
    expect(totalGivenNostalgia(second)).toBe(5);
    expect(totalGivenNostalgia(updateNostalgiaRating(second, "a", 4))).toBe(6);
    expect(totalGivenNostalgia(updateNostalgiaRating(second, "a", 3))).toBe(2);
  });
});

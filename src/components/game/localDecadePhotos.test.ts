import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getLocalDecadePhotos } from "./localDecadePhotos.server";

describe("catálogo de fotografías locales", () => {
  let root: string;
  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "nostalgiar-decadas-"));
  });
  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("descubre nombres arbitrarios y extensiones de imagen dentro de las décadas válidas", async () => {
    await mkdir(join(root, "1980"));
    await mkdir(join(root, "1960"));
    await writeFile(join(root, "1980", "Mi estación.JPG"), "foto");
    await writeFile(join(root, "1980", "plaza.webp"), "foto");
    await writeFile(join(root, "1980", "notas.txt"), "texto");
    await writeFile(join(root, "1960", "fuera.jpg"), "foto");
    const questions = await getLocalDecadePhotos(root);
    expect(questions).toHaveLength(2);
    expect(questions[0]).toEqual({
      id: "local:1980/Mi estación.JPG",
      image: "/juego-decadas/1980/Mi%20estaci%C3%B3n.JPG",
      decade: 1980,
      source: "local",
    });
    expect(questions[1].image).toBe("/juego-decadas/1980/plaza.webp");
  });

  it("incorpora una foto nueva sin editar ninguna lista y tolera carpetas vacías o ausentes", async () => {
    expect(await getLocalDecadePhotos(root)).toEqual([]);
    await mkdir(join(root, "2000"));
    await writeFile(join(root, "2000", "recien-agregada.png"), "foto");
    expect(await getLocalDecadePhotos(root)).toEqual([
      {
        id: "local:2000/recien-agregada.png",
        image: "/juego-decadas/2000/recien-agregada.png",
        decade: 2000,
        source: "local",
      },
    ]);
  });
});

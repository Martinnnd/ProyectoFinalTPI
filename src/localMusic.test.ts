import { existsSync } from "node:fs";
import { expect, it } from "vitest";
import { eraRegistry, availableDecades } from "./eras/registry";
import { localTracks } from "./localMusic";

it("ofrece los MP3 cargados de cada época con rutas válidas y sin duplicados", () => {
  for (const decade of availableDecades) {
    const tracks = localTracks(eraRegistry[decade].content.music);
    expect(tracks).toHaveLength(3);
    expect(new Set(tracks.map((track) => track.audioSrc)).size).toBe(tracks.length);
    for (const track of tracks) {
      expect(existsSync(new URL(`../public${track.audioSrc}`, import.meta.url))).toBe(true);
    }
  }
});

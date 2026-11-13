import { describe, it, expect } from "vitest";
import { filterCommunity } from "./groups";
import { initialMemories } from "./data";
import { loadMemories, saveMemories } from "./storage";
import type { CommunityGroup } from "./types";

const group: CommunityGroup = {
  id: "autos-80",
  name: "Fierros de los 80",
  decade: 1980,
  description: "Autos y recuerdos de los ochenta.",
  isMember: true,
  isCreator: true,
};

describe("Grupos en común", () => {
  it("separa publicaciones generales y del grupo, y permite buscar", () => {
    expect(filterCommunity(initialMemories, "general", [group]).every((m) => !m.groupId)).toBe(
      true,
    );
    expect(filterCommunity(initialMemories, "autos-80", [group])).toHaveLength(3);
    expect(filterCommunity(initialMemories, "groups", [group], "Fiat")).toHaveLength(1);
    expect(filterCommunity(initialMemories, "own", [group])).toHaveLength(0);
  });
  it("conserva el grupo de un recuerdo propio al guardarlo y recuperarlo", () => {
    let raw = "";
    const storage = {
      setItem: (_k: string, v: string) => {
        raw = v;
      },
      getItem: () => raw,
    };
    const memory = {
      ...initialMemories.find((m) => m.groupId === "autos-80")!,
      source: "local" as const,
    };
    expect(saveMemories([memory], storage)).toBe(true);
    expect(loadMemories(storage).memories[0].groupId).toBe("autos-80");
  });
});

it("muestra recuerdos generales y de grupos juntos en la vista completa", () => {
  const all = filterCommunity(initialMemories, "all", [group]);
  expect(all).toHaveLength(initialMemories.length);
  expect(all.some((m) => m.groupId === group.id)).toBe(true);
  expect(all.some((m) => !m.groupId)).toBe(true);
});

import type { CommunityGroup, Memory } from "./types";
export type CommunityScope = "general" | "own" | "groups" | string;
export function filterCommunity(
  memories: Memory[],
  scope: CommunityScope,
  groups: CommunityGroup[],
  query = "",
) {
  const text = query.trim().toLocaleLowerCase("es");
  return memories.filter(
    (m) =>
      (scope === "all"
        ? true
        : scope === "general"
          ? !m.groupId
          : scope === "own"
            ? m.source === "local"
            : scope === "groups"
              ? groups.some((g) => g.id === m.groupId)
              : m.groupId === scope) &&
      (!text || `${m.title} ${m.description} ${m.author}`.toLocaleLowerCase("es").includes(text)),
  );
}

import type { CommunityGroup, Memory } from "./types";
import type { FeedTab } from "./socialTypes";
export type CommunityScope = "general" | "own" | "groups" | string;

export function isGroupFeedScope(scope: string) {
  return !["all", "general", "own"].includes(scope);
}

// La intención de la ruta se conoce antes de descargar el nombre y los datos del grupo.
export function tabForFeedScope(scope: string, preferred: FeedTab): FeedTab {
  return isGroupFeedScope(scope) ? "groups" : preferred === "groups" ? "all" : preferred;
}
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

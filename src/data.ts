// Shared aggregation only. Edit stories inside each era/content.ts.
import { availableDecades, eraRegistry } from "./eras/registry";
import type {
  Decade,
  DescribedTier,
  Memory,
  TierProgress,
  TierRule,
  UserCategory,
  UserTier,
} from "./types";
// Demo activity is anchored to this visit, so the weekly feature can be explored
// without changing the historical year. Production timestamps must come from the API.
const demoActivityTime = new Date().setHours(0, 0, 0, 0);
export const initialMemories: Memory[] = availableDecades
  .flatMap((year) => eraRegistry[year].content.memories)
  .map((memory, index) => ({
    ...memory,
    createdAt: new Date(demoActivityTime - (index % 10) * 86_400_000).toISOString(),
  }));
export const eraContent = Object.fromEntries(
  availableDecades.map((year) => [year, eraRegistry[year].content.introduction]),
) as Record<Decade, { label: string; description: string }>;

// The visitor's tier is derived from their progress, never stored, for the
// same reason badge 01 is: a reload cannot demote them and there is no key to
// keep in sync. Authored in ascending order, so the last tier whose rule is
// satisfied wins. A tier stays locked whenever its input does not exist yet:
// `points` and `subscribed` have no data source, which is what keeps Aedo and
// Mnemosine out of reach without special-casing them here.
export const userTiers: UserTier[] = [
  {
    name: "Errante",
    rule: { kind: "memories", min: 0 },
    requirement: "Sos un usuario nuevo: todavía no publicaste ningún recuerdo.",
  },
  {
    name: "Nostálgico",
    rule: { kind: "memories", min: 1 },
    requirement: "Publicaste tu primer recuerdo en el mapa.",
  },
  {
    name: "Aedo",
    rule: { kind: "points", min: 30 },
    requirement: "Uno de tus recuerdos alcanza los 30 puntos de nostalgia.",
  },
  {
    name: "Mnemosine",
    rule: { kind: "subscription" },
    requirement: "Tenés una suscripción mensual activa.",
  },
];

function meetsRule(rule: TierRule, progress: TierProgress): boolean {
  switch (rule.kind) {
    case "memories":
      return progress.memories >= rule.min;
    case "points":
      return progress.points >= rule.min;
    case "subscription":
      return progress.subscribed;
  }
}

export function resolveUserCategory(progress: TierProgress): UserCategory {
  let current: UserCategory = userTiers[0].name;
  for (const tier of userTiers) {
    if (meetsRule(tier.rule, progress)) current = tier.name;
  }
  return current;
}

// Drives the tiers dialog: everything below the resolved tier was reached on
// the way up, everything above it is still locked.
export function describeTiers(progress: TierProgress): DescribedTier[] {
  const reached = userTiers.findIndex((tier) => tier.name === resolveUserCategory(progress));
  return userTiers.map((tier, index) => ({
    ...tier,
    state: index === reached ? "current" : index < reached ? "reached" : "locked",
  }));
}

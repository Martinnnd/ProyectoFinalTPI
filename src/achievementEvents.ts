export const ACHIEVEMENTS_CHANGED = 'nostalgiar:achievements-changed';
export const ACHIEVEMENTS_UPDATED = 'nostalgiar:achievements-updated';

// Solo se emite después de que el backend confirmó una acción.
export function notifyAchievementsChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(ACHIEVEMENTS_CHANGED));
}

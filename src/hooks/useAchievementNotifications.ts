import { useEffect, useState } from 'react';
import { ACHIEVEMENTS_CHANGED, ACHIEVEMENTS_UPDATED } from '../achievementEvents';
import { getUserProfile, toAchievement } from '../profileApi';
import type { Achievement } from '../types';
import { consumeLoginAchievements } from '../loginAchievements';

export default function useAchievementNotifications(userId: number | null, sessionToken?: string) {
  const [pending, setPending] = useState<{userId: number; items: Achievement[]} | null>(null);
  useEffect(() => {
    setPending(null);
    if (userId === null) return;
    const id = userId;
    const loginAwards = consumeLoginAchievements(id).filter(logro => logro.desbloqueado).map(toAchievement);
    if (loginAwards.length) setPending({userId: id, items: loginAwards});
    const controller = new AbortController();
    let seen: Set<number> | null = null;
    let reading = false;
    let again = false;
    async function refresh() {
      if (reading) { again = true; return; }
      reading = true;
      try {
        do {
          again = false;
          const profile = await getUserProfile(id, controller.signal);
          if (controller.signal.aborted) return;
          const unlocked = profile.logros.filter(logro => logro.desbloqueado);
          // La primera lectura es la referencia: no anuncia logros históricos.
          const previous = seen;
          if (previous !== null) {
            const earned = unlocked.filter(logro => !previous.has(logro.id)).map(toAchievement);
            if (earned.length) {
              setPending(current => ({userId: id, items: [...(current?.userId === id ? current.items : []), ...earned]}));
              window.dispatchEvent(new Event(ACHIEVEMENTS_UPDATED));
            }
          }
          seen = new Set([...(seen ?? []), ...unlocked.map(logro => logro.id)]);
        } while (again && !controller.signal.aborted);
      } catch {
        // Un fallo al consultar avisos no convierte una acción guardada en un error.
        // Se vuelve a consultar en la siguiente acción, al enfocar o en el intervalo.
      } finally { reading = false; }
    }
    const changed = () => { void refresh(); };
    const visible = () => { if (document.visibilityState === 'visible') changed(); };
    window.addEventListener(ACHIEVEMENTS_CHANGED, changed);
    window.addEventListener('focus', changed);
    document.addEventListener('visibilitychange', visible);
    const timer = window.setInterval(visible, 30000);
    changed();
    return () => {
      controller.abort();
      window.clearInterval(timer);
      window.removeEventListener(ACHIEVEMENTS_CHANGED, changed);
      window.removeEventListener('focus', changed);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [userId, sessionToken]);

  return {
    achievement: pending?.userId === userId ? pending.items[0] : undefined,
    dismiss: () => setPending(current => current?.userId === userId ? {...current, items: current.items.slice(1)} : current),
  };
}

import type { AchievementState } from './profileApi';

let pending: {userId: number; achievements: AchievementState[]} | null = null;

export function rememberLoginAchievements(userId: number, achievements: AchievementState[] = []) {
  pending = {userId, achievements};
}
export function consumeLoginAchievements(userId: number): AchievementState[] {
  const achievements = pending?.userId === userId ? pending.achievements : [];
  pending = null;
  return achievements;
}
export function clearLoginAchievements() { pending = null; }

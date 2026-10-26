import { useEffect, useState } from 'react';
import { getUserMemories, getUserProfile, type UserProfile } from '../profileApi';
import { getSeguidores, getSeguidos, type FollowedUser } from '../seguimientosApi';
import type { Memory } from '../types';
import { ACHIEVEMENTS_UPDATED } from '../achievementEvents';

type ProfileData = { profile: UserProfile; memories: Memory[]; followers: FollowedUser[]; following: FollowedUser[] };

export default function useUserProfile(user: number | string | null) {
  const [result, setResult] = useState<{user: number | string; data: ProfileData} | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const refresh = () => setRevision(value => value + 1);
    window.addEventListener(ACHIEVEMENTS_UPDATED, refresh);
    return () => window.removeEventListener(ACHIEVEMENTS_UPDATED, refresh);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setResult(null); setError('');
    if (user === null) { setLoading(false); return; }
    setLoading(true);
    void (async () => {
      try {
        const profile = await getUserProfile(user, controller.signal);
        const [memories, followers, following] = await Promise.all([
          getUserMemories(profile.id, controller.signal),
          getSeguidores(profile.id, controller.signal), getSeguidos(profile.id, controller.signal),
        ]);
        if (!controller.signal.aborted) setResult({user, data: {profile, memories, followers, following}});
      } catch (err) {
        if (!controller.signal.aborted) setError((err as Error).message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [user, revision]);
  return { data: result?.user === user ? result.data : null, error, loading, reload: () => setRevision(value => value + 1) };
}

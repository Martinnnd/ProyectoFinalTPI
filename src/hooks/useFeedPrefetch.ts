import { useEffect } from 'react';
import { useAuth } from '../components/auth/AuthProvider';
import { getInitialFeed } from '../feedCache';

export default function useFeedPrefetch(ready: boolean) {
  const { session } = useAuth();
  useEffect(() => {
    if (!ready || !session) return;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (connection?.saveData) return;
    const controller = new AbortController();
    const prefetch = () => { void getInitialFeed('para-vos', controller.signal).catch(() => {}); };
    if ('requestIdleCallback' in window) {
      const idle = window.requestIdleCallback(prefetch, { timeout: 2000 });
      return () => { window.cancelIdleCallback(idle); controller.abort(); };
    }
    const timer = setTimeout(prefetch, 1000);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [ready, session?.usuarioId]);
}

/** In-memory only: survives route changes, never persists user data to disk. */
export class SessionQueryCache {
  private values = new Map<string, { value: unknown; expires: number }>();
  private pending = new Map<string, Promise<unknown>>();
  private generation = 0;

  get<T>(key: string): T | undefined {
    const entry = this.values.get(key);
    if (!entry) return undefined;
    if (entry.expires <= Date.now()) { this.values.delete(key); return undefined; }
    this.values.delete(key); this.values.set(key, entry);
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttl = 5 * 60_000) {
    this.values.delete(key);
    this.values.set(key, { value, expires: Date.now() + ttl });
    if (this.values.size > 100) this.values.delete(this.values.keys().next().value!);
  }

  clear() { this.generation++; this.values.clear(); this.pending.clear(); }
  delete(key: string) { this.generation++; this.values.delete(key); this.pending.delete(key); }

  async read<T>(key: string, load: () => Promise<T>, signal?: AbortSignal | null, cacheIf: (value: T) => boolean = () => true, ttl = 5 * 60_000): Promise<T> {
    signal?.throwIfAborted();
    const cached = this.get<T>(key);
    if (cached !== undefined) return cached;
    let promise = this.pending.get(key) as Promise<T> | undefined;
    if (!promise) {
      const generation = this.generation;
      promise = load().then(value => {
        if (generation === this.generation && cacheIf(value)) this.set(key, value, ttl);
        return value;
      });
      this.pending.set(key, promise);
      const cleanup = () => { if (this.pending.get(key) === promise) this.pending.delete(key); };
      void promise.then(cleanup, cleanup);
    }
    if (!signal) return promise;
    return new Promise<T>((resolve, reject) => {
      const abort = () => reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
      signal.addEventListener('abort', abort, { once: true });
      void promise!.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
    });
  }
}

export const queryCache = new SessionQueryCache();
export const feedCache = new SessionQueryCache();
export function clearSessionQueries() { queryCache.clear(); feedCache.clear(); }

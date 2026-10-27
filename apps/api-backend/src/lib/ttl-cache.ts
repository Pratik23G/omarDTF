/** Small in-memory TTL cache with a size cap; oldest entries are evicted first. */
export function createTtlCache<T>(ttlMs: number, maxEntries: number) {
  const entries = new Map<string, { value: T; expiresAt: number }>();

  return {
    get(key: string, now = Date.now()): T | undefined {
      const entry = entries.get(key);
      if (!entry) return undefined;
      if (entry.expiresAt <= now) {
        entries.delete(key);
        return undefined;
      }
      return entry.value;
    },
    set(key: string, value: T, now = Date.now()) {
      entries.delete(key);
      entries.set(key, { value, expiresAt: now + ttlMs });
      if (entries.size > maxEntries) entries.delete(entries.keys().next().value as string);
    },
  };
}

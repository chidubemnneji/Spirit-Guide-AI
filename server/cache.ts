// Simple in-memory cache with TTL
// Avoids repeated DB lookups for data that doesn't change often

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class TTLCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private ttlMs: number;

  constructor(ttlSeconds: number) {
    this.ttlMs = ttlSeconds * 1000;
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: T): void {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  invalidatePrefix(prefix: string): void {
    Array.from(this.store.keys()).forEach(key => {
      if (key.startsWith(prefix)) this.store.delete(key);
    });
  }
}

// Cache instances — shared across requests
export const personaCache = new TTLCache<any>(300);      // 5 min — persona rarely changes
export const userCache = new TTLCache<any>(60);           // 1 min — user data
export const journalCache = new TTLCache<any[]>(120);     // 2 min — recent journal entries
export const memoryCache = new TTLCache<string>(300);     // 5 min — formatted memory context

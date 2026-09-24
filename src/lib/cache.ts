/**
 * In-Memory Server-Side Cache Engine with TTL & Tag-based Invalidation
 * Optimized for Next.js Server Actions and Node.js runtime.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  tags: string[];
}

class ServerCache {
  private store = new Map<string, CacheEntry<any>>();
  private tagMap = new Map<string, Set<string>>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Schedule periodic sweep every 2 minutes
    if (typeof setInterval !== "undefined") {
      this.cleanupInterval = setInterval(() => this.sweep(), 2 * 60 * 1000);
      if (this.cleanupInterval.unref) {
        this.cleanupInterval.unref();
      }
    }
  }

  public get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return null;
    }

    return entry.value as T;
  }

  public set<T>(key: string, value: T, ttlSeconds: number = 60, tags: string[] = []): void {
    const expiresAt = Date.now() + Math.max(1, ttlSeconds) * 1000;

    // Remove old tags if key already existed
    this.removeKeyFromTags(key);

    this.store.set(key, { value, expiresAt, tags });

    // Index tags
    for (const tag of tags) {
      if (!this.tagMap.has(tag)) {
        this.tagMap.set(tag, new Set());
      }
      this.tagMap.get(tag)!.add(key);
    }
  }

  public delete(key: string): boolean {
    this.removeKeyFromTags(key);
    return this.store.delete(key);
  }

  public invalidateByTag(tag: string): number {
    const keys = this.tagMap.get(tag);
    if (!keys || keys.size === 0) return 0;

    let count = 0;
    const keyArray = Array.from(keys);
    for (const key of keyArray) {
      if (this.store.delete(key)) {
        count++;
      }
    }
    this.tagMap.delete(tag);
    return count;
  }

  public invalidateByTags(tags: string[]): number {
    let count = 0;
    for (const tag of tags) {
      count += this.invalidateByTag(tag);
    }
    return count;
  }

  public clear(): void {
    this.store.clear();
    this.tagMap.clear();
  }

  public size(): number {
    return this.store.size;
  }

  private removeKeyFromTags(key: string): void {
    const entry = this.store.get(key);
    if (entry && entry.tags) {
      for (const tag of entry.tags) {
        const set = this.tagMap.get(tag);
        if (set) {
          set.delete(key);
          if (set.size === 0) {
            this.tagMap.delete(tag);
          }
        }
      }
    }
  }

  private sweep(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.delete(key);
      }
    }
  }
}

// Global singleton across hot-reloads in development
const globalForCache = globalThis as unknown as {
  serverCacheInstance?: ServerCache;
};

export const cache = globalForCache.serverCacheInstance || new ServerCache();

if (process.env.NODE_ENV !== "production") {
  globalForCache.serverCacheInstance = cache;
}

/**
 * Cache Wrapper Helper with Stale-While-Revalidate prevention
 */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
  tags: string[] = []
): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached !== null && cached !== undefined) {
    return cached;
  }

  const fresh = await fetcher();
  cache.set(key, fresh, ttlSeconds, tags);
  return fresh;
}

// Common Cache Tags Constants
export const CACHE_TAGS = {
  DASHBOARD: "dashboard",
  SCHOOLS: "schools",
  CAMPUSES: "campuses",
  CLASSES: "classes",
  SUBJECTS: "subjects",
  TEACHERS: "teachers",
  STUDENTS: "students",
  SCHEDULES: "schedules",
  JOURNALS: "journals",
  METADATA: "metadata",
} as const;

export default cache;

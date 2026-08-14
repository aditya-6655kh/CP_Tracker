interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class Cache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private defaultTtl: number;
  private sweepTimer: ReturnType<typeof setInterval> | null = null;

  /**
   * @param defaultTtlSeconds  Default time-to-live in seconds (default 300 = 5 min)
   * @param sweepIntervalSeconds  How often to purge expired entries (default 60s)
   */
  constructor(defaultTtlSeconds = 300, sweepIntervalSeconds = 60) {
    this.defaultTtl = defaultTtlSeconds * 1000;

    // periodic sweep to prevent memory leaks from unused keys
    this.sweepTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store) {
        if (entry.expiresAt <= now) this.store.delete(key);
      }
    }, sweepIntervalSeconds * 1000);

    // allow the process to exit even if the timer is running
    if ((this.sweepTimer as any).unref) (this.sweepTimer as any).unref();
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: T, ttlSeconds?: number): void {
    const ttl = ttlSeconds !== undefined ? ttlSeconds * 1000 : this.defaultTtl;
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttl,
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

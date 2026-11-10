export declare class Cache<T> {
    private store;
    private defaultTtl;
    private sweepTimer;
    /**
     * @param defaultTtlSeconds  Default time-to-live in seconds (default 300 = 5 min)
     * @param sweepIntervalSeconds  How often to purge expired entries (default 60s)
     */
    constructor(defaultTtlSeconds?: number, sweepIntervalSeconds?: number);
    get(key: string): T | null;
    set(key: string, data: T, ttlSeconds?: number): void;
    delete(key: string): void;
    clear(): void;
}
//# sourceMappingURL=cache.d.ts.map
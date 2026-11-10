"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cache = void 0;
class Cache {
    /**
     * @param defaultTtlSeconds  Default time-to-live in seconds (default 300 = 5 min)
     * @param sweepIntervalSeconds  How often to purge expired entries (default 60s)
     */
    constructor(defaultTtlSeconds = 300, sweepIntervalSeconds = 60) {
        this.store = new Map();
        this.sweepTimer = null;
        this.defaultTtl = defaultTtlSeconds * 1000;
        // periodic sweep to prevent memory leaks from unused keys
        this.sweepTimer = setInterval(() => {
            const now = Date.now();
            for (const [key, entry] of this.store) {
                if (entry.expiresAt <= now)
                    this.store.delete(key);
            }
        }, sweepIntervalSeconds * 1000);
        // allow the process to exit even if the timer is running
        if (this.sweepTimer.unref)
            this.sweepTimer.unref();
    }
    get(key) {
        const entry = this.store.get(key);
        if (!entry)
            return null;
        if (entry.expiresAt <= Date.now()) {
            this.store.delete(key);
            return null;
        }
        return entry.data;
    }
    set(key, data, ttlSeconds) {
        const ttl = ttlSeconds !== undefined ? ttlSeconds * 1000 : this.defaultTtl;
        this.store.set(key, {
            data,
            expiresAt: Date.now() + ttl,
        });
    }
    delete(key) {
        this.store.delete(key);
    }
    clear() {
        this.store.clear();
    }
}
exports.Cache = Cache;
//# sourceMappingURL=cache.js.map
import type { LeetcodeStats } from "../types/leetcode.types";
export declare class LeetcodeApiError extends Error {
    readonly statusCode: number;
    constructor(message: string, statusCode?: number);
}
export declare function getLeetcodeStats(username: string, skipCache?: boolean): Promise<{
    stats: LeetcodeStats;
    cacheHit: boolean;
}>;
//# sourceMappingURL=leetcode.services.d.ts.map
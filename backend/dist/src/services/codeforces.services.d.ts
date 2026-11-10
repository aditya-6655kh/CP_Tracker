import { CFSubmission, CodeforcesStats, CodeforcesTopicAnalytics } from "../types/codeforces.types";
export declare function computeTopicAnalytics(submissions: readonly CFSubmission[]): CodeforcesTopicAnalytics;
export declare class CodeforcesApiError extends Error {
    readonly statusCode: number;
    constructor(message: string, statusCode?: number);
}
export declare function getCodeForcesStats(handle: string, skipCache?: boolean): Promise<{
    stats: CodeforcesStats;
    cacheHit: boolean;
}>;
//# sourceMappingURL=codeforces.services.d.ts.map
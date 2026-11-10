import type { CFProblem, CFSubmission, CodeforcesTopicAnalytics, CodeforcesRecommendations } from "../types/codeforces.types";
/** Pure ranking; never changes the shared catalog, analytics or submissions. */
export declare function computeRecommendations(catalog: readonly CFProblem[], submissions: readonly CFSubmission[], rating: number | null, analytics: CodeforcesTopicAnalytics): CodeforcesRecommendations;
export declare function getCodeforcesRecommendations(submissions: readonly CFSubmission[], rating: number | null, analytics: CodeforcesTopicAnalytics): Promise<CodeforcesRecommendations>;
//# sourceMappingURL=codeforces-recommendations.service.d.ts.map
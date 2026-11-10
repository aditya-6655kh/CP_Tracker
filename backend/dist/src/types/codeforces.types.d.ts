export interface CFApiResponse<T> {
    status: "OK" | "FAILED";
    result?: T;
    comment?: string;
}
export interface CFUser {
    handle: string;
    rating?: number;
    maxRating?: number;
    rank?: string;
    maxRank?: string;
    contribution: number;
    lastOnlineTimeSeconds: number;
    registrationTimeSeconds: number;
    friendOfCount: number;
    avatar: string;
    titlePhoto: string;
}
export interface CFRatingChange {
    contestId: number;
    contestName: string;
    handle: string;
    rank: number;
    ratingUpdateTimeSeconds: number;
    oldRating: number;
    newRating: number;
}
export interface CFProblem {
    contestId?: number;
    index: string;
    name: string;
    type: "PROGRAMMING" | "QUESTION";
    rating?: number;
    tags: string[];
}
export interface CFProblemStatistics {
    constestId?: number;
    index: string;
    solvedCount: number;
}
export interface CFProblemset {
    problems: CFProblem[];
    problemStatistics: CFProblemStatistics[];
}
export interface CFSubmission {
    id: number;
    contestId?: number;
    creationTimeSeconds: number;
    problem: CFProblem;
    programmingLanguage: string;
    verdict?: string;
    passedTestCount: number;
    timeConsumedMillis: number;
    memoryConsumedBytes: number;
}
export interface CodeforcesActivityDay {
    date: string;
    count: number;
}
export interface CodeforcesStreak {
    current: number;
    max: number;
}
export interface CodeforcesUserInfo {
    handle: string;
    rating: number | null;
    maxRating: number | null;
    rank: string | null;
    maxRank: string | null;
}
export interface CodeforcesRatingPoint {
    contestId: number;
    contestName: string;
    rank: number;
    ratingUpdateTimeSeconds: number;
    oldRating: number;
    newRating: number;
}
export interface CodeforcesSubmissionStats {
    totalSubmissions: number;
    accepted: number;
    wrongAnswer: number;
    timeLimitExceeded: number;
    memoryLimitExceeded: number;
    runtimeError: number;
    compilationError: number;
    other: number;
}
export interface CodeforcesTopicStats {
    tag: string;
    attemptedProblems: number;
    solvedProblems: number;
    /** Fraction from 0 to 1, calculated before display rounding. */
    solveRate: number;
    status: "weak" | "insufficient-data" | "not-flagged";
}
export interface CodeforcesTopicAnalytics {
    topics: CodeforcesTopicStats[];
    submissionsFetched: number;
    excludedSubmissions: number;
    possiblyTruncated: boolean;
    minimumAttemptedProblems: number;
    weakSolveRateThreshold: number;
}
export interface CodeforcesRecommendation {
    id: string;
    contestId: number;
    index: string;
    name: string;
    rating: number;
    tags: string[];
    matchedWeakTags: string[];
    previouslyAttempted: boolean;
    url: string;
}
export interface CodeforcesRecommendations {
    status: "available" | "unavailable";
    mode: "weak-topics" | "general-practice";
    targetRating: number;
    minRating: number;
    maxRating: number;
    usedDefaultRating: boolean;
    weakTags: string[];
    historyPossiblyTruncated: boolean;
    items: CodeforcesRecommendation[];
}
export interface CodeforcesStats {
    userInfo: CodeforcesUserInfo;
    solvedCount: number;
    ratingHistory: CodeforcesRatingPoint[];
    submissionStats: CodeforcesSubmissionStats;
    codeforcesActivity: CodeforcesActivityDay[];
    streak: CodeforcesStreak;
    topicAnalytics: CodeforcesTopicAnalytics;
    recommendations: CodeforcesRecommendations;
}
//# sourceMappingURL=codeforces.types.d.ts.map
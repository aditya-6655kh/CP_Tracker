export interface LCGraphQLResponse<T> {
    data: T | null;
    errors?: {
        message: string;
    }[];
}
export interface LCSubmissionCount {
    difficulty: "Easy" | "Medium" | "Hard" | "All";
    count: number;
    submissions: number;
}
export interface LCMatchedUser {
    username: string;
    profile: {
        ranking: number;
        reputation: number;
        starRating: number;
    };
    submitStats: {
        acSubmissionNum: LCSubmissionCount[];
        totalSubmissionNum: LCSubmissionCount[];
    };
}
export interface LCContestRating {
    attendedContestsCount: number;
    rating: number;
    globalRanking: number;
    totalParticipants: number;
    topPercentage: number;
}
export interface LCRecentSubmission {
    title: string;
    titleSlug: string;
    timestamp: string;
}
export interface LCUserCalendar {
    streak: number;
    totalActiveDays: number;
    submissionCalendar: string;
}
export interface LeetcodeActivityDay {
    date: string;
    count: number;
}
export interface LeetcodeStreak {
    current: number;
    totalActiveDays: number;
}
export interface LeetcodeDifficultyBreakdown {
    easy: number;
    medium: number;
    hard: number;
    total: number;
}
export interface LeetcodeRanking {
    globalRanking: number | null;
    reputation: number;
}
export interface LeetcodeContestStats {
    rating: number | null;
    globalRanking: number | null;
    attendedContest: number;
    topPercentage: number | null;
}
export interface LeetcodeRecentSubmission {
    title: string;
    titleSlug: string;
    timestamp: number;
}
export interface LeetcodeStats {
    username: string;
    solved: LeetcodeDifficultyBreakdown;
    ranking: LeetcodeRanking;
    contest: LeetcodeContestStats | null;
    recentSubmissions: LeetcodeRecentSubmission[];
    activity: LeetcodeActivityDay[];
    streak: LeetcodeStreak;
}
//# sourceMappingURL=leetcode.types.d.ts.map
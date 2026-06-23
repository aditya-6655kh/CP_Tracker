export interface LCGraphQLResponse<T> {
  data: T | null;
  errors?: { message: string }[];
}

export interface LCSubmissionCount {
  difficulty: "Easy" | "Medium" | "Hard" | "All";
  count: number;
  submission: number;
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
  attendedContestCount: number;
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

// processed types

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
  attendedContests: number;
  topPercentage: number | null;
}

export interface LeetcodeRecentSubmission {
  title: string;
  titleSlug: string;
  timestamp: number; // unix seconds
}

export interface LeetcodeStats {
  username: string;
  solved: LeetcodeDifficultyBreakdown;
  ranking: LeetcodeRanking;
  contest: LeetcodeContestStats | null; // null if user never joined a contest
  recentSubmissions: LeetcodeRecentSubmission[];
}

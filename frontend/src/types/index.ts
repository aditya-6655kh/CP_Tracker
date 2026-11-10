export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  userId: string;
  cfHandle: string;
  leetcodeHandle: string;
  gfgHandle: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string[];
}

export interface CodeforcesUserInfo {
  handle: string;
  rating: number | null;
  maxRating: number | null;
  rank: string | null;
  maxRank: string | null;
}

export interface CodeforcesRatingPoint {
  contestId: string;
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

export interface CodeforcesActivityDay{
  date: string;
  count: number;
}

export interface CodeforcesStreak{
  current: number;
  max: number;
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

export interface LeetcodeActivityDay{
  date: string;
  count: number;
}

export interface LeetcodeStreak{
  current: number;
  totalActiveDays: number;
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

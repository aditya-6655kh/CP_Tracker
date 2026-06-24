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

export interface CodeforcesStats {
  userInfo: CodeforcesUserInfo;
  solvedCount: number;
  ratingHistory: CodeforcesRatingPoint[];
  submissionStats: CodeforcesSubmissionStats;
  codeforcesActivity: CodeforcesActivityDay[];
  streak: CodeforcesStreak;
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
}

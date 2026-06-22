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
  totalSubmission: number;
  accepted: number;
  wrongAnswer: number;
  timeLimitExceeded: number;
  memoryLimitExceeded: number;
  runtimeError: number;
  compilationError: number;
  other: number;
}

export interface CodeforcesStats {
  userInfo: CodeforcesUserInfo;
  solvedCount: number;
  ratingHistory: CodeforcesRatingPoint[];
  submissionStats: CodeforcesSubmissionStats;
}

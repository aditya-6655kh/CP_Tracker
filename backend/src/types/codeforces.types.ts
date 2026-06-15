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

// ---------------------------------------------------------------------------
// Processed types (what your API returns to the frontend)
// These are intentionally decoupled from the raw CF shapes above.
// If CF changes their API, only the service layer changes — not your frontend.
// ---------------------------------------------------------------------------

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

export interface CodeforcesStats {
  userInfo: CodeforcesUserInfo;
  solvedCount: number;
  ratingHistory: CodeforcesRatingPoint[];
  submissionStats: CodeforcesSubmissionStats;
}

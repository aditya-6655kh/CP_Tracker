import axios, { AxiosError } from "axios";
import {
  CFApiResponse,
  CFUser,
  CFRatingChange,
  CFSubmission,
  CodeforcesStats,
  CodeforcesUserInfo,
  CodeforcesRatingPoint,
  CodeforcesSubmissionStats,
} from "../types/codeforces.types";
import { resourceUsage } from "node:process";

const CF_BASE_URL = "https://codeforces.com/api";

// custom error class
export class CodeforcesApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.name = "CodeforcesApiError";
  }
}

// raw api fetchers
async function fetchUserInfo(handle: string): Promise<CFUser> {
  try {
    const { data } = await axios.get<CFApiResponse<CFUser[]>>(
      `${CF_BASE_URL}/user.info?handles=${handle}`,
    );

    const user = data.result?.[0];
    if (!user) {
      throw new CodeforcesApiError(
        "User not found in Codeforces response.",
        404,
      );
    }

    return user;
  } catch (err: any) {
    if (err instanceof CodeforcesApiError) throw err;

    const axiosError = err as AxiosError;
    if (axiosError.response?.status === 404) {
      throw new CodeforcesApiError(`CF handle "${handle}" not found`, 404);
    }
    throw new CodeforcesApiError("Failed to fetch user info", 500);
  }
}

async function fetchUserRating(handle: string): Promise<CFRatingChange[]> {
  try {
    const { data } = await axios.get<CFApiResponse<CFRatingChange[]>>(
      `${CF_BASE_URL}/user.rating?handle=${handle}`,
    );

    if (data.status === "FAILED") {
      throw new CodeforcesApiError(
        data.comment ?? "Failed to fetch user rating",
        404,
      );
    }

    return data.result!;
  } catch (error: any) {
    if (error instanceof CodeforcesApiError) throw error;

    throw new CodeforcesApiError("Failed to reach Codeforces API", 503);
  }
}

async function fetchUserStatus(handle: string): Promise<CFSubmission[]> {
  //full pagination will add later
  try {
    const { data } = await axios.get<CFApiResponse<CFSubmission[]>>(
      `${CF_BASE_URL}/user.status?handle=${handle}&from=1&count=10000`,
    );

    if (data.status === "FAILED") {
      throw new CodeforcesApiError(
        data.comment ?? "Failed to fetch user status",
        404,
      );
    }

    return data.result!;
  } catch (error: any) {
    if (error instanceof CodeforcesApiError) throw error;

    throw new CodeforcesApiError("Failed to reach Codeforces API", 503);
  }
}

// raw api response to our api shapes

function transformUserInfo(cfUser: CFUser): CodeforcesUserInfo {
  return {
    handle: cfUser.handle,
    rating: cfUser.rating ?? null,
    maxRating: cfUser.maxRating ?? null,
    rank: cfUser.rank ?? null,
    maxRank: cfUser.maxRank ?? null,
  };
}

function transformRatingHistory(
  ratingChange: CFRatingChange[],
): CodeforcesRatingPoint[] {
  return ratingChange.map((change) => ({
    contestId: change.contestId,
    contestName: change.contestName,
    rank: change.rank,
    ratingUpdateTimeSeconds: change.ratingUpdateTimeSeconds,
    oldRating: change.oldRating,
    newRating: change.newRating,
  }));
}

function computeSolvedCount(submissions: CFSubmission[]): number {
  const solvedSet = new Set<string>();

  for (const submission of submissions) {
    if (submission.verdict === "OK") {
      const key = submission.contestId
        ? `${submission.contestId} - ${submission.problem.index}`
        : submission.problem.name;
      solvedSet.add(key);
    }
  }

  return solvedSet.size;
}

function computeSubmissionStats(
  submissions: CFSubmission[],
): CodeforcesSubmissionStats {
  const stats: CodeforcesSubmissionStats = {
    totalSubmissions: 0,
    accepted: 0,
    wrongAnswer: 0,
    timeLimitExceeded: 0,
    memoryLimitExceeded: 0,
    runtimeError: 0,
    compilationError: 0,
    other: 0,
  };

  for (const { verdict } of submissions) {
    switch (verdict) {
      case "OK":
        stats.accepted++;
        break;
      case "WRONG_ANSWER":
        stats.wrongAnswer++;
        break;
      case "TIME_LIMIT_EXCEEDED":
        stats.timeLimitExceeded++;
        break;
      case "MEMORY_LIMIT_EXCEEDED":
        stats.memoryLimitExceeded++;
        break;
      case "RUNTIME_ERROR":
        stats.runtimeError++;
        break;
      case "COMPILATION_ERROR":
        stats.compilationError++;
        break;
      default:
        stats.other++;
    }
  }
  return stats;
}

// main things controller called 
export async function getCodeForcesStats(handle: string): Promise<CodeforcesStats>{
  const [cfUser, ratingChange, submission] = await Promise.all([
    fetchUserInfo(handle),
    fetchUserRating(handle),
    fetchUserStatus(handle)
  ]);

  return {
    userInfo: transformUserInfo(cfUser),
    solvedCount: computeSolvedCount(submission),
    ratingHistory: transformRatingHistory(ratingChange),
    submissionStats: computeSubmissionStats(submission),
  };
}
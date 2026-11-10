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
  CodeforcesActivityDay,
  CodeforcesStreak,
  CodeforcesTopicAnalytics,
  CodeforcesTopicStats,
} from "../types/codeforces.types";
import { Cache } from "../lib/cache";
import { getCodeforcesRecommendations } from "./codeforces-recommendations.service";

const cfCache = new Cache<CodeforcesStats>(300); // 5 min TTL

const CF_BASE_URL = "https://codeforces.com/api";
const SUBMISSION_LIMIT = 10000;
const MINIMUM_TOPIC_PROBLEMS = 5;
const WEAK_SOLVE_RATE_THRESHOLD = 0.5;
// Only these judged outcomes contribute to the topic heuristic. In particular,
// pending, skipped, system failures and unknown verdicts are not failed attempts.
const TOPIC_VERDICTS = new Set([
  "OK", "WRONG_ANSWER", "TIME_LIMIT_EXCEEDED", "MEMORY_LIMIT_EXCEEDED",
  "RUNTIME_ERROR", "COMPILATION_ERROR", "PRESENTATION_ERROR",
  "IDLENESS_LIMIT_EXCEEDED", "CRASHED", "CHALLENGED",
]);

export function computeTopicAnalytics(
  submissions: readonly CFSubmission[],
): CodeforcesTopicAnalytics {
  const problems = new Map<string, { solved: boolean; tags: Set<string>; submissions: number }>();
  let excludedSubmissions = 0;

  for (const submission of submissions) {
    const contestId = submission.problem.contestId ?? submission.contestId;
    const index = submission.problem.index?.trim();
    if (!TOPIC_VERDICTS.has(submission.verdict ?? "") ||
        !Number.isInteger(contestId) || (contestId ?? 0) <= 0 || !index) {
      excludedSubmissions++;
      continue;
    }

    const key = `${contestId}:${index}`;
    const problem = problems.get(key) ?? { solved: false, tags: new Set<string>(), submissions: 0 };
    problem.submissions++;
    problem.solved ||= submission.verdict === "OK";
    const tags = (submission.problem.tags ?? []).map(tag => tag.trim()).filter(Boolean);
    for (const tag of tags) problem.tags.add(tag);
    // An untagged accepted retry still resolves earlier tagged attempts.
    problems.set(key, problem);
  }

  const counts = new Map<string, { attemptedProblems: number; solvedProblems: number }>();
  for (const problem of problems.values()) {
    if (problem.tags.size === 0) excludedSubmissions += problem.submissions;
    for (const tag of problem.tags) {
      const topic = counts.get(tag) ?? { attemptedProblems: 0, solvedProblems: 0 };
      topic.attemptedProblems++;
      if (problem.solved) topic.solvedProblems++;
      counts.set(tag, topic);
    }
  }

  const topics: CodeforcesTopicStats[] = Array.from(counts, ([tag, counts]) => {
    const solveRate = counts.solvedProblems / counts.attemptedProblems;
    return {
      tag, ...counts, solveRate,
      status: counts.attemptedProblems < MINIMUM_TOPIC_PROBLEMS
        ? "insufficient-data"
        : solveRate < WEAK_SOLVE_RATE_THRESHOLD ? "weak" : "not-flagged",
    };
  });
  const priority = { weak: 0, "not-flagged": 1, "insufficient-data": 2 };
  topics.sort((a, b) => priority[a.status] - priority[b.status] ||
    a.solveRate - b.solveRate || b.attemptedProblems - a.attemptedProblems ||
    (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0));

  return {
    topics, submissionsFetched: submissions.length, excludedSubmissions,
    possiblyTruncated: submissions.length >= SUBMISSION_LIMIT,
    minimumAttemptedProblems: MINIMUM_TOPIC_PROBLEMS,
    weakSolveRateThreshold: WEAK_SOLVE_RATE_THRESHOLD,
  };
}

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
      { timeout: 10000 },
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
      `${CF_BASE_URL}/user.status?handle=${handle}&from=1&count=${SUBMISSION_LIMIT}`,
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

function computeActivityMap(
  submissions: CFSubmission[],
): Record<string, number> {
  const map: Record<string, number> = {};

  for (const sub of submissions) {
    const date = new Date(sub.creationTimeSeconds * 1000)
      .toISOString()
      .slice(0, 10);
    map[date] = (map[date] || 0) + 1;
  }

  return map;
}

function computeStreak(activityMap: Record<string, number>): CodeforcesStreak {
  const dates = Object.keys(activityMap).sort();

  if (dates.length === 0) return { current: 0, max: 0 };

  // compute max streak
  let maxStreak = 1;
  let runningStreak = 1;

  for (let i = 1; i < dates.length; i++) {
    let prevDate = new Date(dates[i - 1]!);
    let currDate = new Date(dates[i]!);

    let dayGap = Math.round(
      (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    runningStreak = dayGap === 1 ? runningStreak + 1 : 1;
    maxStreak = Math.max(maxStreak, runningStreak);
  }

  // compute current streak
  const activeDateSet = new Set(dates);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const todayStr = today.toISOString().slice(0, 10);
  const yesterdayStr = new Date(today.getTime() - 1000 * 60 * 60 * 24)
    .toISOString()
    .slice(0, 10);

  let currentStreak = 0;
  let cursor: Date | null = null;

  if (activeDateSet.has(todayStr)) {
    cursor = today;
  } else if (activeDateSet.has(yesterdayStr)) {
    cursor = new Date(today.getTime() - 1000 * 60 * 60 * 24);
  }

  while (cursor) {
    let cursorStr = cursor.toISOString().slice(0, 10);
    if (!activeDateSet.has(cursorStr)) break;

    currentStreak++;
    cursor = new Date(cursor.getTime() - 1000 * 60 * 60 * 24);
  }

  return { current: currentStreak, max: maxStreak };
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
    stats.totalSubmissions++;
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
export async function getCodeForcesStats(
  handle: string,
  skipCache = false,
): Promise<{ stats: CodeforcesStats; cacheHit: boolean }> {
  if (!skipCache) {
    const cached = cfCache.get(handle);
    if (cached) return { stats: cached, cacheHit: true };
  }

  const [cfUser, ratingChange, submission] = await Promise.all([
    fetchUserInfo(handle),
    fetchUserRating(handle),
    fetchUserStatus(handle),
  ]);

  const activityMap = computeActivityMap(submission);
  const activity = Object.entries(activityMap).map(([date, count]) => ({
    date,
    count,
  }));
  const streak = computeStreak(activityMap);
  const topicAnalytics = computeTopicAnalytics(submission);
  const recommendations = await getCodeforcesRecommendations(submission, cfUser.rating ?? null, topicAnalytics);

  const stats: CodeforcesStats = {
    userInfo: transformUserInfo(cfUser),
    solvedCount: computeSolvedCount(submission),
    ratingHistory: transformRatingHistory(ratingChange),
    submissionStats: computeSubmissionStats(submission),
    codeforcesActivity: activity,
    streak: streak,
    topicAnalytics,
    recommendations,
  };

  cfCache.set(handle, stats);
  return { stats, cacheHit: false };
}

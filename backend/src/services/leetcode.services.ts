import axios from "axios";
import type {
  LCGraphQLResponse,
  LeetcodeDifficultyBreakdown,
  LCMatchedUser,
  LCContestRating,
  LCRecentSubmission,
  LeetcodeStats,
  LCUserCalendar,
  LeetcodeActivityDay,
} from "../types/leetcode.types";
import { Cache } from "../lib/cache";

const lcCache = new Cache<LeetcodeStats>(300); // 5 min TTL

const LEETCODE_GRAPHQL_ENDPOINT = "https://leetcode.com/graphql";

const LC_HEADERS = {
  "Content-Type": "application/json",
  Referer: "https://leetcode.com",
  Origin: "https://leetcode.com",
};

export class LeetcodeApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.name = "LeetcodeApiError";
  }
}

const USER_PROFILE_QUERY = `
  query userPublicProfile($username: String!) {
    matchedUser(username: $username) {
      username
      profile {
        ranking
        reputation
        starRating
      }
      submitStats {
        acSubmissionNum {
          difficulty
          count
          submissions
        }
        totalSubmissionNum {
          difficulty
          count
          submissions
        }
      }
    }
  }
`;

const CONTEST_RANKING_QUERY = `
  query userContestRankingInfo($username: String!) {
    userContestRanking(username: $username) {
      attendedContestsCount
      rating
      globalRanking
      totalParticipants
      topPercentage
    }
  }
`;

const RECENT_SUBMISSIONS_QUERY = `
  query recentAcSubmissions($username: String!, $limit: Int!) {
    recentAcSubmissionList(username: $username, limit: $limit) {
      title
      titleSlug
      timestamp
    }
  }
`;

const USER_CALENDAR_QUERY = `query userProfileCalendar($username: String!, $year: Int!) {
  matchedUser(username: $username) {
    userCalendar(year: $year) {
      streak
      totalActiveDays
      submissionCalendar
    }
  }
}`;

async function fetchUserProfile(username: string): Promise<LCMatchedUser> {
  try {
    const { data } = await axios.post<
      LCGraphQLResponse<{ matchedUser: LCMatchedUser }>
    >(
      LEETCODE_GRAPHQL_ENDPOINT,
      { query: USER_PROFILE_QUERY, variables: { username } },
      { headers: LC_HEADERS, timeout: 10000 },
    );

    if (!data.data?.matchedUser) {
      throw new LeetcodeApiError(
        `Leetcode handle "${username}" not found!`,
        404,
      );
    }

    return data.data.matchedUser;
  } catch (err) {
    if (err instanceof LeetcodeApiError) {
      throw err;
    }

    throw new LeetcodeApiError(
      "failed to reach Leetcode api, try again later!",
      503,
    );
  }
}

async function fetchContestRating(
  username: string,
): Promise<LCContestRating | null> {
  try {
    const { data } = await axios.post<
      LCGraphQLResponse<{ userContestRanking: LCContestRating | null }>
    >(
      LEETCODE_GRAPHQL_ENDPOINT,
      { query: CONTEST_RANKING_QUERY, variables: { username } },
      { headers: LC_HEADERS, timeout: 10000 },
    );

    return data.data?.userContestRanking ?? null;
  } catch {
    return null;
  }
}

async function fetchRecentSubmission(
  username: string,
  limit: number = 10,
): Promise<LCRecentSubmission[]> {
  try {
    const { data } = await axios.post<
      LCGraphQLResponse<{ recentAcSubmissionList: LCRecentSubmission[] }>
    >(
      LEETCODE_GRAPHQL_ENDPOINT,
      { query: RECENT_SUBMISSIONS_QUERY, variables: { username, limit } },
      { headers: LC_HEADERS, timeout: 10000 },
    );

    return data.data?.recentAcSubmissionList ?? [];
  } catch {
    return [];
  }
}

async function fetchUserCalendar(
  username: string,
  year: number,
): Promise<LCUserCalendar | null> {
  try {
    const { data } = await axios.post<
      LCGraphQLResponse<{
        matchedUser: { userCalendar: LCUserCalendar } | null;
      }>
    >(
      LEETCODE_GRAPHQL_ENDPOINT,
      { query: USER_CALENDAR_QUERY, variables: { username, year } },
      { headers: LC_HEADERS, timeout: 10000 },
    );

    return data.data?.matchedUser?.userCalendar ?? null;
  } catch {
    return null;
  }
}

function transformDifficultyBreakdown(
  acSubmissionNum: LCMatchedUser["submitStats"]["acSubmissionNum"],
): LeetcodeDifficultyBreakdown {
  const breakDown: LeetcodeDifficultyBreakdown = {
    easy: 0,
    medium: 0,
    hard: 0,
    total: 0,
  };

  for (const sub of acSubmissionNum) {
    if (sub.difficulty === "Easy") breakDown.easy = sub.count;
    if (sub.difficulty === "Medium") breakDown.medium = sub.count;
    if (sub.difficulty === "Hard") breakDown.hard = sub.count;
  }

  breakDown.total = breakDown.easy + breakDown.medium + breakDown.hard;

  return breakDown;
}

function transformActivity(
  calendars: (LCUserCalendar | null)[],
): LeetcodeActivityDay[] {
  const merged: Record<string, number> = {};

  for (const cal of calendars) {
    if (!cal?.submissionCalendar) continue;

    const parsed: Record<string, number> = JSON.parse(cal.submissionCalendar);

    for (const [unixSeconds, count] of Object.entries(parsed)) {
      const date = new Date(Number(unixSeconds) * 1000)
        .toISOString()
        .slice(0, 10);
      merged[date] = (merged[date] ?? 0) + count;
    }
  }

  return Object.entries(merged).map(([date, count]) => ({ date, count }));
}

export async function getLeetcodeStats(
  username: string,
  skipCache = false,
): Promise<{ stats: LeetcodeStats; cacheHit: boolean }> {
  if (!skipCache) {
    const cached = lcCache.get(username);
    if (cached) return { stats: cached, cacheHit: true };
  }

  const currentYear = new Date().getFullYear();

  const [
    profile,
    contestRanking,
    recentSubmission,
    currentYearCal,
    prevYearCal,
  ] = await Promise.all([
    fetchUserProfile(username),
    fetchContestRating(username),
    fetchRecentSubmission(username),
    fetchUserCalendar(username, currentYear),
    fetchUserCalendar(username, currentYear - 1),
  ]);

  const activity = transformActivity([prevYearCal, currentYearCal]);

  const stats: LeetcodeStats = {
    username: profile.username,
    solved: transformDifficultyBreakdown(profile.submitStats.acSubmissionNum),
    ranking: {
      globalRanking: profile.profile.ranking || null,
      reputation: profile.profile.reputation,
    },
    contest: contestRanking
      ? {
          rating: Math.round(contestRanking.rating),
          globalRanking: contestRanking.globalRanking,
          attendedContests: contestRanking.attendedContestCount,
          topPercentage: contestRanking.topPercentage,
        }
      : null,

    recentSubmissions: recentSubmission.map((sub) => ({
      title: sub.title,
      titleSlug: sub.titleSlug,
      timestamp: Number(sub.timestamp),
    })),

    activity,
    streak: {
      current: currentYearCal?.streak ?? 0,
      totalActiveDays: currentYearCal?.totalActiveDays ?? 0,
    },
  };

  lcCache.set(username, stats);
  return { stats, cacheHit: false };
}

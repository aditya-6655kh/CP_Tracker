import axios from "axios";
import type {
  LCGraphQLResponse,
  LeetcodeDifficultyBreakdown,
  LCMatchedUser,
  LCContestRating,
  LCRecentSubmission,
  LeetcodeStats,
} from "../types/leetcode.types";

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

export async function getLeetcodeStats(
  username: string,
): Promise<LeetcodeStats> {
  const [profile, contestRanking, recentSubmission] = await Promise.all([
    fetchUserProfile(username),
    fetchContestRating(username),
    fetchRecentSubmission(username),
  ]);

  return {
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
  };
}



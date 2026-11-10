"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeetcodeApiError = void 0;
exports.getLeetcodeStats = getLeetcodeStats;
const axios_1 = __importDefault(require("axios"));
const cache_1 = require("../lib/cache");
const lcCache = new cache_1.Cache(300); // 5 min TTL
const LEETCODE_GRAPHQL_ENDPOINT = "https://leetcode.com/graphql";
const LC_HEADERS = {
    "Content-Type": "application/json",
    Referer: "https://leetcode.com",
    Origin: "https://leetcode.com",
};
class LeetcodeApiError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.name = "LeetcodeApiError";
    }
}
exports.LeetcodeApiError = LeetcodeApiError;
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
const USER_CALENDAR_QUERY = `query userProfileCalendar($username: String!) {
  matchedUser(username: $username) {
    userCalendar {
      streak
      totalActiveDays
      submissionCalendar
    }
  }
}`;
async function fetchUserProfile(username) {
    try {
        const { data } = await axios_1.default.post(LEETCODE_GRAPHQL_ENDPOINT, { query: USER_PROFILE_QUERY, variables: { username } }, { headers: LC_HEADERS, timeout: 10000 });
        if (!data.data?.matchedUser) {
            throw new LeetcodeApiError(`Leetcode handle "${username}" not found!`, 404);
        }
        return data.data.matchedUser;
    }
    catch (err) {
        if (err instanceof LeetcodeApiError) {
            throw err;
        }
        throw new LeetcodeApiError("failed to reach Leetcode api, try again later!", 503);
    }
}
async function fetchContestRating(username) {
    try {
        const { data } = await axios_1.default.post(LEETCODE_GRAPHQL_ENDPOINT, { query: CONTEST_RANKING_QUERY, variables: { username } }, { headers: LC_HEADERS, timeout: 10000 });
        return data.data?.userContestRanking ?? null;
    }
    catch {
        return null;
    }
}
async function fetchRecentSubmission(username, limit = 10) {
    try {
        const { data } = await axios_1.default.post(LEETCODE_GRAPHQL_ENDPOINT, { query: RECENT_SUBMISSIONS_QUERY, variables: { username, limit } }, { headers: LC_HEADERS, timeout: 10000 });
        return data.data?.recentAcSubmissionList ?? [];
    }
    catch {
        return [];
    }
}
async function fetchUserCalendar(username) {
    try {
        const { data } = await axios_1.default.post(LEETCODE_GRAPHQL_ENDPOINT, { query: USER_CALENDAR_QUERY, variables: { username } }, { headers: LC_HEADERS, timeout: 10000 });
        return data.data?.matchedUser?.userCalendar ?? null;
    }
    catch (err) {
        console.error("[fetchUserCalendar]", err instanceof Error ? err.message : err);
        return null;
    }
}
function transformDifficultyBreakdown(acSubmissionNum) {
    const breakDown = {
        easy: 0,
        medium: 0,
        hard: 0,
        total: 0,
    };
    for (const sub of acSubmissionNum) {
        if (sub.difficulty === "Easy")
            breakDown.easy = sub.count;
        if (sub.difficulty === "Medium")
            breakDown.medium = sub.count;
        if (sub.difficulty === "Hard")
            breakDown.hard = sub.count;
    }
    breakDown.total = breakDown.easy + breakDown.medium + breakDown.hard;
    return breakDown;
}
function transformActivity(calendars) {
    const merged = {};
    for (const cal of calendars) {
        if (!cal?.submissionCalendar)
            continue;
        const parsed = JSON.parse(cal.submissionCalendar);
        for (const [unixSeconds, count] of Object.entries(parsed)) {
            const date = new Date(Number(unixSeconds) * 1000)
                .toISOString()
                .slice(0, 10);
            merged[date] = (merged[date] ?? 0) + count;
        }
    }
    return Object.entries(merged).map(([date, count]) => ({ date, count }));
}
async function getLeetcodeStats(username, skipCache = false) {
    if (!skipCache) {
        const cached = lcCache.get(username);
        if (cached)
            return { stats: cached, cacheHit: true };
    }
    const [profile, contestRanking, recentSubmission, calendar,] = await Promise.all([
        fetchUserProfile(username),
        fetchContestRating(username),
        fetchRecentSubmission(username),
        fetchUserCalendar(username),
    ]);
    const activity = transformActivity([calendar]);
    const stats = {
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
                attendedContest: contestRanking.attendedContestsCount,
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
            current: calendar?.streak ?? 0,
            totalActiveDays: calendar?.totalActiveDays ?? 0,
        },
    };
    lcCache.set(username, stats);
    return { stats, cacheHit: false };
}
//# sourceMappingURL=leetcode.services.js.map
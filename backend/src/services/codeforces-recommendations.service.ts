import type {
  CFProblem, CFSubmission, CodeforcesTopicAnalytics,
  CodeforcesRecommendation, CodeforcesRecommendations,
} from "../types/codeforces.types";
import { getProblemCatalog } from "./problem-catalog.service";

const LIMIT = 6;

function problemKey(problem: CFProblem, fallbackContestId?: number): string | null {
  const contestId = problem.contestId ?? fallbackContestId;
  const index = problem.index?.trim();
  return Number.isInteger(contestId) && (contestId ?? 0) > 0 && index
    ? `${contestId}:${index}` : null;
}

function recommendationSettings(rating: number | null, analytics: CodeforcesTopicAnalytics) {
  const usedDefaultRating = rating === null || !Number.isFinite(rating);
  const targetRating = Math.max(800, Math.round((usedDefaultRating ? 1000 : rating!) / 100) * 100);
  const weakTags = analytics.topics.filter(topic => topic.status === "weak")
    .slice().sort((a, b) => a.solveRate - b.solveRate ||
      b.attemptedProblems - a.attemptedProblems || a.tag.localeCompare(b.tag))
    .slice(0, 3).map(topic => topic.tag);
  return {
    mode: weakTags.length ? "weak-topics" as const : "general-practice" as const,
    targetRating, minRating: Math.max(800, targetRating - 200), maxRating: targetRating + 200,
    usedDefaultRating, weakTags, historyPossiblyTruncated: analytics.possiblyTruncated,
  };
}

/** Pure ranking; never changes the shared catalog, analytics or submissions. */
export function computeRecommendations(
  catalog: readonly CFProblem[], submissions: readonly CFSubmission[],
  rating: number | null, analytics: CodeforcesTopicAnalytics,
): CodeforcesRecommendations {
  const settings = recommendationSettings(rating, analytics);
  const solved = new Set<string>();
  const attempted = new Set<string>();
  for (const submission of submissions) {
    const key = problemKey(submission.problem, submission.contestId);
    if (!key) continue;
    attempted.add(key);
    if (submission.verdict === "OK") solved.add(key);
  }
  const candidates = new Map<string, CodeforcesRecommendation>();
  for (const problem of catalog) {
    const key = problemKey(problem);
    if (!key || solved.has(key) || candidates.has(key) ||
        problem.type !== "PROGRAMMING" || !Number.isInteger(problem.rating) ||
        problem.rating! < settings.minRating || problem.rating! > settings.maxRating) continue;
    const tags = [...new Set(problem.tags.map(tag => tag.trim()).filter(Boolean))];
    if (tags.includes("*special")) continue;
    const matchedWeakTags = settings.weakTags.filter(tag => tags.includes(tag));
    if (settings.mode === "weak-topics" && matchedWeakTags.length === 0) continue;
    candidates.set(key, {
      id: key, contestId: problem.contestId!, index: problem.index.trim(),
      name: problem.name, rating: problem.rating!, tags, matchedWeakTags,
      previouslyAttempted: attempted.has(key),
      url: `https://codeforces.com/problemset/problem/${problem.contestId}/${encodeURIComponent(problem.index.trim())}`,
    });
  }
  const ranked = [...candidates.values()].sort((a, b) =>
    Math.abs(a.rating - settings.targetRating) - Math.abs(b.rating - settings.targetRating) ||
    a.rating - b.rating || a.contestId - b.contestId || a.index.localeCompare(b.index));
  // Cycle through weak topics so a large topic cannot occupy every slot.
  const items: CodeforcesRecommendation[] = [];
  const selected = new Set<string>();
  if (settings.mode === "weak-topics") {
    while (items.length < LIMIT) {
      const previousSize = items.length;
      for (const tag of settings.weakTags) {
        const next = ranked.find(item => !selected.has(item.id) && item.matchedWeakTags.includes(tag));
        if (next) { items.push(next); selected.add(next.id); }
        if (items.length === LIMIT) break;
      }
      if (items.length === previousSize) break;
    }
  } else {
    items.push(...ranked.slice(0, LIMIT));
  }
  return { ...settings, status: "available", items };
}

export async function getCodeforcesRecommendations(
  submissions: readonly CFSubmission[], rating: number | null, analytics: CodeforcesTopicAnalytics,
): Promise<CodeforcesRecommendations> {
  try {
    return computeRecommendations(await getProblemCatalog(), submissions, rating, analytics);
  } catch (error) {
    console.warn("[Codeforces recommendations]", error instanceof Error ? error.message : "Unavailable");
    return { ...recommendationSettings(rating, analytics), status: "unavailable", items: [] };
  }
}

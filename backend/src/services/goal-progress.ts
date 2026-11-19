import type { CFSubmission } from "../types/codeforces.types";
import type { GoalProgress } from "../types/goals.types";

export function computeGoalProgress(
  goal: { targetCount: number; startsAt: Date; deadline: Date },
  submissions: readonly CFSubmission[], fetchedAt: Date, now = new Date(),
): GoalProgress {
  const start = goal.startsAt.getTime();
  const deadline = goal.deadline.getTime();
  const end = Math.min(deadline, now.getTime());
  const solved = new Set<string>();
  let earliest = Infinity;
  let invalidAccepted = false;
  for (const submission of submissions) {
    const time = submission.creationTimeSeconds * 1000;
    if (Number.isFinite(time)) earliest = Math.min(earliest, time);
    if (submission.verdict !== "OK") continue;
    if (!Number.isFinite(time)) { invalidAccepted = true; continue; }
    if (time < start || time >= end) continue;
    const contestId = submission.problem.contestId ?? submission.contestId;
    const index = submission.problem.index?.trim();
    if (!Number.isInteger(contestId) || (contestId ?? 0) <= 0 || !index) {
      invalidAccepted = true;
      continue;
    }
    solved.add(`${contestId}:${index}`);
  }
  const historyIncomplete = invalidAccepted || (submissions.length >= 10000 && earliest >= start);
  const ended = now.getTime() >= deadline;
  const staleAtDeadline = ended && fetchedAt.getTime() < deadline;
  const status = solved.size >= goal.targetCount ? "completed"
    : ended ? (historyIncomplete || staleAtDeadline ? "unknown" : "expired") : "active";
  return {
    solvedCount: solved.size,
    percent: Math.min(100, Math.floor(solved.size / goal.targetCount * 100)),
    status, checkedAt: fetchedAt.toISOString(), historyIncomplete,
    message: historyIncomplete
      ? "Some goal-period submissions are missing. This count is a lower bound."
      : staleAtDeadline ? "Refresh progress to verify the result after the deadline." : null,
  };
}

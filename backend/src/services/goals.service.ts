import prisma from "../lib/prisma";
import { getCodeforcesSnapshot } from "./codeforces.services";
import { computeGoalProgress } from "./goal-progress";
import type { GoalProgress } from "../types/goals.types";

export class GoalError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = "GoalError";
  }
}

export function validateGoalInput(body: unknown, partial = false, now = new Date()) {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new GoalError("Provide a target and deadline.", 400);
  const input = body as Record<string, unknown>;
  if (Object.keys(input).some(key => key !== "targetCount" && key !== "deadline")) {
    throw new GoalError("Only targetCount and deadline can be changed.", 400);
  }
  const data: { targetCount?: number; deadline?: Date } = {};
  if (!partial || "targetCount" in input) {
    if (typeof input.targetCount !== "number" || !Number.isInteger(input.targetCount) || input.targetCount < 1 || input.targetCount > 1000) {
      throw new GoalError("Target must be a whole number from 1 to 1000.", 400);
    }
    data.targetCount = input.targetCount;
  }
  if (!partial || "deadline" in input) {
    const deadline = typeof input.deadline === "string" ? new Date(input.deadline) : new Date(NaN);
    if (!Number.isFinite(deadline.getTime()) || deadline.toISOString() !== input.deadline) {
      throw new GoalError("Deadline must be an ISO UTC timestamp.", 400);
    }
    if (deadline <= now || deadline.getTime() > now.getTime() + 366 * 86400000) {
      throw new GoalError("Choose a future deadline within one year.", 400);
    }
    data.deadline = deadline;
  }
  if (!Object.keys(data).length) throw new GoalError("Provide a target or deadline to update.", 400);
  return data;
}

export async function createGoal(userId: string, body: unknown) {
  const now = new Date();
  const data = validateGoalInput(body, false, now);
  const profile = await prisma.profile.findUnique({ where: { userId }, select: { cfHandle: true } });
  if (!profile?.cfHandle) throw new GoalError("Link a Codeforces handle before creating a goal.", 400);
  return prisma.goal.create({ data: {
    userId, cfHandle: profile.cfHandle, targetCount: data.targetCount!,
    deadline: data.deadline!, startsAt: now,
  } });
}

export async function updateGoal(userId: string, id: string, body: unknown) {
  const now = new Date();
  const data = validateGoalInput(body, true, now);
  const goal = await prisma.goal.findFirst({ where: { id, userId } });
  if (!goal) throw new GoalError("Goal not found.", 404);
  if (goal.deadline <= now) throw new GoalError("This goal has ended. Create a new goal to continue.", 409);
  const updated = await prisma.goal.updateMany({ where: { id, userId, deadline: { gt: now } }, data });
  if (!updated.count) throw new GoalError("The goal changed. Refresh and try again.", 409);
  return prisma.goal.findFirst({ where: { id, userId } });
}

export async function deleteGoal(userId: string, id: string) {
  const result = await prisma.goal.deleteMany({ where: { id, userId } });
  if (!result.count) throw new GoalError("Goal not found.", 404);
}

export async function listGoals(userId: string, refresh = false) {
  const goals = await prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  const snapshots = new Map(await Promise.all([...new Set(goals.map(goal => goal.cfHandle))].map(async handle => {
    try {
      return [handle, (await getCodeforcesSnapshot(handle, refresh)).snapshot] as const;
    } catch {
      return [handle, null] as const;
    }
  })));
  return goals.map(goal => {
    const snapshot = snapshots.get(goal.cfHandle);
    const progress: GoalProgress = snapshot
      ? computeGoalProgress(goal, snapshot.submissions, snapshot.fetchedAt)
      : { solvedCount: null, percent: null, status: "unknown", checkedAt: null, historyIncomplete: false,
          message: "Codeforces progress is unavailable. Your goal is saved; refresh to retry." };
    return { id: goal.id, cfHandle: goal.cfHandle, targetCount: goal.targetCount,
      startsAt: goal.startsAt.toISOString(), deadline: goal.deadline.toISOString(), progress };
  });
}

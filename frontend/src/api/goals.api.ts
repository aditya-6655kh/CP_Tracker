import api from "./axios";
import type { ApiResponse, Goal, GoalInput } from "../types";

export async function getGoals(refresh = false): Promise<Goal[]> {
  const response = await api.get<ApiResponse<Goal[]>>(refresh ? "goals?refresh=true" : "goals");
  if (!response.data.data) throw new Error("Goals response is missing.");
  return response.data.data;
}
export async function createGoal(input: GoalInput): Promise<void> {
  await api.post("goals", input);
}
export async function updateGoal(id: string, input: GoalInput): Promise<void> {
  await api.patch(`goals/${encodeURIComponent(id)}`, input);
}
export async function deleteGoal(id: string): Promise<void> {
  await api.delete(`goals/${encodeURIComponent(id)}`);
}

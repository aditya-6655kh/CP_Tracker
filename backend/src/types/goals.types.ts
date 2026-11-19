export interface GoalProgress {
  solvedCount: number | null;
  percent: number | null;
  status: "active" | "completed" | "expired" | "unknown";
  checkedAt: string | null;
  historyIncomplete: boolean;
  message: string | null;
}

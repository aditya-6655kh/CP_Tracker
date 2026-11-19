import { getCodeforcesStats } from "../api/stats.api";
import { usePlatformStats } from "./usePlatformStats";

export function useCodeforcesStats(handle: string | null | undefined) {
  return usePlatformStats(handle, getCodeforcesStats, "Failed to load Codeforces stats.");
}

import { getLeetcodeStats } from "../api/stats.api";
import { usePlatformStats } from "./usePlatformStats";

export function useLeetcodeStats(handle: string | null | undefined) {
  return usePlatformStats(handle, getLeetcodeStats, "Failed to load LeetCode stats.");
}

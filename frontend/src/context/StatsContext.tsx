import type { ReactNode } from "react";
import { useCallback } from "react";
import { getCodeforcesStats, getLeetcodeStats } from "../api/stats.api";
import { usePlatformStats } from "../hooks/usePlatformStats";
import { useProfile } from "./profile-context";
import { StatsContext } from "./stats-context";

export function StatsProvider({ children }: { children: ReactNode }) {
  const { profile } = useProfile();
  const cf = usePlatformStats(profile?.cfHandle, getCodeforcesStats, "Failed to load Codeforces stats.");
  const lc = usePlatformStats(profile?.leetcodeHandle, getLeetcodeStats, "Failed to load LeetCode stats.");
  const refreshCf = cf.refresh;
  const refreshLc = lc.refresh;
  const refreshAll = useCallback(() => { refreshCf(); refreshLc(); }, [refreshCf, refreshLc]);
  return <StatsContext.Provider value={{
    cfStats: cf.stats, lcStats: lc.stats,
    cfLoading: cf.loading, lcLoading: lc.loading,
    cfError: cf.error, lcError: lc.error,
    refreshCf: cf.refresh, refreshLc: lc.refresh, refreshAll,
  }}>{children}</StatsContext.Provider>;
}

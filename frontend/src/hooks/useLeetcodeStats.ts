import { useEffect, useState } from "react";
import { getLeetcodeStats } from "../api/stats.api";
import type { LeetcodeStats } from "../types";

export function useLeetcodeStats(handle: string | null | undefined) {
  const [stats, setStats] = useState<LeetcodeStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!handle) {
      setStats(null);
      return;
    }

    setLoading(true);
    setError("");

    getLeetcodeStats()
      .then(setStats)
      .catch((err) =>
        setError(
          err.response?.data?.message ?? "Failed to fetch leetcode stats.",
        ),
      )
      .finally(() => setLoading(false));
  }, [handle]);

  return { stats, loading, error };
}

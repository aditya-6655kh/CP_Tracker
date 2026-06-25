import { useEffect, useState } from "react";
import { getCodeforcesStats } from "../api/stats.api";
import type { CodeforcesStats } from "../types";

export function useCodeforcesStats(handle: string | null | undefined) {
  const [stats, setStats] = useState<CodeforcesStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!handle) {
      setStats(null);
      return;
    }

    setLoading(true);
    setError("");

    getCodeforcesStats()
      .then(setStats)
      .catch((err) =>
        setError(
          err.response?.data?.message ?? "Failed to load codeforces stats.",
        ),
      )
      .finally(() => setLoading(false));
  }, [handle]);

  return { stats, loading, error };
}

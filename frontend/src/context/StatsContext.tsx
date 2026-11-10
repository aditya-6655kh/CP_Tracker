import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { getCodeforcesStats, getLeetcodeStats } from "../api/stats.api";
import { useProfile } from "./ProfileContext";
import type { CodeforcesStats, LeetcodeStats } from "../types";

interface StatsContextType {
  cfStats: CodeforcesStats | null;
  lcStats: LeetcodeStats | null;
  cfLoading: boolean;
  lcLoading: boolean;
  cfError: string;
  lcError: string;
  refreshCf: () => void;
  refreshLc: () => void;
  refreshAll: () => void;
}

const StatsContext = createContext<StatsContextType | null>(null);

export const StatsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { profile } = useProfile();

  const [cfStats, setCfStats] = useState<CodeforcesStats | null>(null);
  const [lcStats, setLcStats] = useState<LeetcodeStats | null>(null);
  const [cfLoading, setCfLoading] = useState(false);
  const [lcLoading, setLcLoading] = useState(false);
  const [cfError, setCfError] = useState("");
  const [lcError, setLcError] = useState("");
  const cfRequestId = useRef(0);

  const fetchCf = useCallback(
    (force = false) => {
      const requestId = ++cfRequestId.current;
      if (!force) setCfStats(null);
      if (!profile?.cfHandle) {
        setCfStats(null);
        setCfLoading(false);
        setCfError("");
        return;
      }

      setCfLoading(true);
      setCfError("");

      getCodeforcesStats(force)
        .then((stats) => {
          if (requestId === cfRequestId.current) setCfStats(stats);
        })
        .catch((err) => {
          if (requestId !== cfRequestId.current) return;
          setCfError(
            err.response?.data?.message ?? "Failed to load codeforces stats.",
          );
        })
        .finally(() => {
          if (requestId === cfRequestId.current) setCfLoading(false);
        });
    },
    [profile?.cfHandle],
  );

  const fetchLc = useCallback(
    (force = false) => {
      if (!profile?.leetcodeHandle) {
        setLcStats(null);
        return;
      }

      setLcLoading(true);
      setLcError("");

      getLeetcodeStats(force)
        .then(setLcStats)
        .catch((err) =>
          setLcError(
            err.response?.data?.message ?? "Failed to fetch leetcode stats.",
          ),
        )
        .finally(() => setLcLoading(false));
    },
    [profile?.leetcodeHandle],
  );

  // initial fetch on mount / handle change
  useEffect(() => {
    const requests = cfRequestId;
    fetchCf();
    return () => { requests.current++; };
  }, [fetchCf]);

  useEffect(() => {
    fetchLc();
  }, [fetchLc]);

  const refreshCf = useCallback(() => fetchCf(true), [fetchCf]);
  const refreshLc = useCallback(() => fetchLc(true), [fetchLc]);
  const refreshAll = useCallback(() => {
    fetchCf(true);
    fetchLc(true);
  }, [fetchCf, fetchLc]);

  return (
    <StatsContext.Provider
      value={{
        cfStats,
        lcStats,
        cfLoading,
        lcLoading,
        cfError,
        lcError,
        refreshCf,
        refreshLc,
        refreshAll,
      }}
    >
      {children}
    </StatsContext.Provider>
  );
};

export const useStats = () => {
  const context = useContext(StatsContext);
  if (!context)
    throw new Error("useStats must be used within StatsProvider");
  return context;
};

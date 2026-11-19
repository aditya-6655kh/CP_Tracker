import { createContext, useContext } from "react";
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

export const StatsContext = createContext<StatsContextType | null>(null);


export const useStats = () => {
  const context = useContext(StatsContext);
  if (!context)
    throw new Error("useStats must be used within StatsProvider");
  return context;
};

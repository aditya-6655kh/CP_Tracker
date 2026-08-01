import api from "./axios";
import type { CodeforcesStats, LeetcodeStats } from "../types";

export const getCodeforcesStats = async (
  force?: boolean,
): Promise<CodeforcesStats> => {
  const url = force ? "stats/codeforces?refresh=true" : "stats/codeforces";
  const res = await api.get(url);
  return res.data.data;
};

export const getLeetcodeStats = async (
  force?: boolean,
): Promise<LeetcodeStats> => {
  const url = force ? "stats/leetcode?refresh=true" : "stats/leetcode";
  const res = await api.get(url);
  return res.data.data;
};
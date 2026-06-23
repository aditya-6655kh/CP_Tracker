import api from "./axios";
import type { CodeforcesStats, LeetcodeStats } from "../types";

export const getCodeforcesStats = async (): Promise<CodeforcesStats> => {
  const res = await api.get("stats/codeforces");
  return res.data.data;
};

export const getLeetcodeStats = async (): Promise<LeetcodeStats> => {
  const res = await api.get("stats/leetcode");
  return res.data.data;
};
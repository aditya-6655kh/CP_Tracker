import api from "./axios";
import type { CodeforcesStats } from "../types";

export const getCodeforcesStats = async (): Promise<CodeforcesStats> => {
  const res = await api.get("stats/codeforces");
  return res.data.data;
};
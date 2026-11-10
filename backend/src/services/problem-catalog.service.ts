import axios from "axios";
import { Cache } from "../lib/cache";
import type { CFApiResponse, CFProblem, CFProblemset } from "../types/codeforces.types";

const catalogCache = new Cache<CFProblem[]>(24 * 60 * 60);
let pendingCatalog: Promise<CFProblem[]> | null = null;

export class ProblemCatalogError extends Error {
  constructor(message: string, public readonly statusCode = 503) {
    super(message);
    this.name = "ProblemCatalogError";
  }
}

/** Shared across handles; personal refresh does not bypass the catalog TTL. */
export async function getProblemCatalog(): Promise<CFProblem[]> {
  const cached = catalogCache.get("CODEFORCES");
  if (cached) return cached;
  if (pendingCatalog) return pendingCatalog;
  pendingCatalog = fetchProblemSet();
  try {
    const problems = await pendingCatalog;
    catalogCache.set("CODEFORCES", problems);
    return problems;
  } finally {
    pendingCatalog = null;
  }
}

async function fetchProblemSet(): Promise<CFProblem[]> {
  try {
    const { data } = await axios.get<CFApiResponse<CFProblemset>>(
      "https://codeforces.com/api/problemset.problems", { timeout: 10000 },
    );
    if (data.status !== "OK" || !Array.isArray(data.result?.problems)) {
      throw new ProblemCatalogError("Invalid Codeforces catalog response.");
    }
    return data.result.problems.filter(problem =>
      problem && Number.isInteger(problem.contestId) && (problem.contestId ?? 0) > 0 &&
      typeof problem.index === "string" && /^[A-Za-z0-9]+$/.test(problem.index) &&
      typeof problem.name === "string" && problem.name.trim().length > 0 &&
      problem.type === "PROGRAMMING" && Number.isInteger(problem.rating) &&
      (problem.rating ?? 0) >= 800 && Array.isArray(problem.tags) &&
      problem.tags.every(tag => typeof tag === "string"),
    );
  } catch (error: unknown) {
    if (error instanceof ProblemCatalogError) throw error;
    throw new ProblemCatalogError("Failed to fetch Codeforces problem catalog.");
  }
}

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProblemCatalogError = void 0;
exports.getProblemCatalog = getProblemCatalog;
const axios_1 = __importDefault(require("axios"));
const cache_1 = require("../lib/cache");
const catalogCache = new cache_1.Cache(24 * 60 * 60);
let pendingCatalog = null;
class ProblemCatalogError extends Error {
    constructor(message, statusCode = 503) {
        super(message);
        this.statusCode = statusCode;
        this.name = "ProblemCatalogError";
    }
}
exports.ProblemCatalogError = ProblemCatalogError;
/** Shared across handles; personal refresh does not bypass the catalog TTL. */
async function getProblemCatalog() {
    const cached = catalogCache.get("CODEFORCES");
    if (cached)
        return cached;
    if (pendingCatalog)
        return pendingCatalog;
    pendingCatalog = fetchProblemSet();
    try {
        const problems = await pendingCatalog;
        catalogCache.set("CODEFORCES", problems);
        return problems;
    }
    finally {
        pendingCatalog = null;
    }
}
async function fetchProblemSet() {
    try {
        const { data } = await axios_1.default.get("https://codeforces.com/api/problemset.problems", { timeout: 10000 });
        if (data.status !== "OK" || !Array.isArray(data.result?.problems)) {
            throw new ProblemCatalogError("Invalid Codeforces catalog response.");
        }
        return data.result.problems.filter(problem => problem && Number.isInteger(problem.contestId) && (problem.contestId ?? 0) > 0 &&
            typeof problem.index === "string" && /^[A-Za-z0-9]+$/.test(problem.index) &&
            typeof problem.name === "string" && problem.name.trim().length > 0 &&
            problem.type === "PROGRAMMING" && Number.isInteger(problem.rating) &&
            (problem.rating ?? 0) >= 800 && Array.isArray(problem.tags) &&
            problem.tags.every(tag => typeof tag === "string"));
    }
    catch (error) {
        if (error instanceof ProblemCatalogError)
            throw error;
        throw new ProblemCatalogError("Failed to fetch Codeforces problem catalog.");
    }
}
//# sourceMappingURL=problem-catalog.service.js.map
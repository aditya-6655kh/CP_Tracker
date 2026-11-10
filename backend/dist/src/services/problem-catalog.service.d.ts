import type { CFProblem } from "../types/codeforces.types";
export declare class ProblemCatalogError extends Error {
    readonly statusCode: number;
    constructor(message: string, statusCode?: number);
}
/** Shared across handles; personal refresh does not bypass the catalog TTL. */
export declare function getProblemCatalog(): Promise<CFProblem[]>;
//# sourceMappingURL=problem-catalog.service.d.ts.map
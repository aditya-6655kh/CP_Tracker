# Architecture Decisions

This document records the reasoning behind specific engineering tradeoffs made in this project — particularly the ones that aren't obvious from reading the code alone. Each decision includes what was considered and why the chosen path won.

---

## 1. GeeksforGeeks integration was deferred

**Decision:** GFG handles are stored in the schema but not used to fetch any stats.

**Why:**
- GFG has no official public API.
- Their profile pages disallow automated access via `robots.txt`, ruling out building a first-party scraper as a clean, ToS-compliant option.
- The alternative — consuming a community-built unofficial wrapper API (several exist, hosted on free platforms like Vercel/Render) — introduces a dependency entirely outside our control. If that third-party service goes down, rate-limits, or disappears, the feature breaks with zero recourse.

**What would change this:** If GFG integration becomes a priority, the right approach is to wrap the chosen community API behind the same service-layer abstraction used for Codeforces/LeetCode (`getGfgStats()`), so the unreliable dependency is isolated to one file and can be swapped or removed without touching controllers or the frontend.

---

## 2. LeetCode activity heatmap and streak tracking — revisited, and implemented

**Original assumption (later corrected):** LeetCode's public GraphQL endpoint (`recentAcSubmissionList`) only exposes roughly the last 20 accepted submissions, with no pagination and no date-range query — this was initially assumed to make an accurate activity heatmap or streak impossible without session-cookie auth.

**What changed:** Further investigation surfaced a separate, also-public, no-auth field: `matchedUser.userCalendar`, queried with a `year` argument, returning `submissionCalendar` (a full year of `{ unixTimestamp: count }` data, JSON-encoded as a string), plus LeetCode's own `streak` and `totalActiveDays` fields directly. This is distinct from `recentAcSubmissionList` and isn't subject to the same 20-item cap — it's the same field several public community tools (e.g. LeetCodeWrapped) rely on.

**Current implementation:** Activity heatmap and streak tracking are now live for both Codeforces and LeetCode. For LeetCode, the current and previous calendar years are fetched in parallel and merged, so a rolling 6-month window that crosses a Jan 1 boundary is still accurate.

**Known caveat:** LeetCode's `streak` field is trusted as-is from their API rather than recomputed from the raw calendar. Their internal streak logic may not follow the exact same "consecutive calendar day" rule used for the Codeforces streak calculation in this project, so the two numbers aren't guaranteed to be perfectly apples-to-apples in edge cases.

**Lesson worth keeping in mind:** the original scoping decision here was made based on one specific field's limitation (`recentAcSubmissionList`), without fully mapping out what else the same public API surface exposed. Worth checking assumptions like this against the actual schema before ruling a feature out, in general.

---

## 2a. LeetCode topic-wise analysis is still scoped out (unlike activity/streak)

**Decision:** Topic-wise analysis and weak-area detection (Phase 4) remain Codeforces-only, even though activity/streak turned out to be feasible for LeetCode.

**Why this is a different situation:** `submissionCalendar` only provides `{ date: count }` — it does not indicate which problems or tags were involved on a given day. Reconstructing tag-level accuracy would require the full list of submitted problems with their tags attached, which LeetCode does not expose through any public, no-auth endpoint found so far. The `problemsetQuestionList` query that includes tags requires session-cookie authentication (`LEETCODE_SESSION`), which reintroduces the same fragility/ToS tradeoff that ruled out GFG.

**What would change this:** If session-based auth becomes acceptable for this project later, tag-level LeetCode analysis would be technically possible — but it would need its own explicit decision about credential handling and risk, not a silent addition alongside the public-API-only features.

---

## 3. Service layer separation (all platforms)

**Decision:** Controllers never call `axios` or any external API directly. All external API logic lives in `src/services/{platform}.service.ts`.

**Why:**
- Controllers should only handle HTTP concerns: extracting params, calling a service, shaping the response.
- If Codeforces or LeetCode ever changes their API shape, only the service file changes — not the controller, not the frontend contract.
- Makes the external API logic independently testable without spinning up Express.

---

## 4. Custom typed errors per platform

**Decision:** `CodeforcesApiError` and `LeetcodeApiError` extend `Error` and carry a `statusCode` property.

**Why:**
- Lets controllers respond with accurate HTTP status codes (`404` for "handle not found", `503` for "platform unreachable", `500` for unexpected failures) without messy `instanceof AxiosError` checks leaking into controller logic.
- Centralizes the mapping from "what went wrong with this external API" to "what should the HTTP response say" in one place per platform.

---

## 5. Fail-soft handling for non-critical fields

**Decision:** LeetCode's contest ranking and recent submissions silently degrade to `null` / `[]` on failure instead of failing the entire stats request.

**Why:**
- A user who has never joined a LeetCode contest is a normal state, not an error — their `userContestRanking` query legitimately returns nothing.
- If contest data or recent submissions fail for any reason, the rest of the user's stats (solved count, ranking, difficulty breakdown) are still valuable and shouldn't be blocked by one non-critical sub-query.
- The core profile fetch (`matchedUser`) is still a hard failure if it doesn't resolve, since that's how we validate the handle exists at all.

---

## 6. Parallel data fetching via `Promise.all`

**Decision:** All independent external API calls per platform run in parallel, not sequentially.

**Why:**
- Codeforces requires 3 separate REST calls (`user.info`, `user.rating`, `user.status`); LeetCode requires 3 separate GraphQL queries. None of these depend on each other's results.
- Running them in parallel cuts total wait time roughly to the slowest single call, instead of the sum of all three.

---

## 7. Phase 3 analytics reuse Phase 2 data — zero new API calls

**Decision:** Rating history, activity heatmap, and streak tracking are all computed from data already being fetched for submission stats (`user.status`).

**Why:**
- The full submission list (with timestamps and verdicts) was already being pulled in Phase 2 to compute the submission breakdown.
- Deriving activity-by-day and streaks from that same dataset means Phase 3 added zero new network requests to Codeforces — just additional processing of data already in memory.

---

## 8. Independent, isolated frontend section components

**Decision:** `CodeforcesSection` and `LeetcodeSection` each manage their own loading/error state and render independently inside `DashboardPage`.

**Why:**
- If the LeetCode API has an outage, Codeforces stats should still render normally, and vice versa.
- `DashboardPage` itself stays a thin orchestrator — it fetches profile + per-platform stats and passes them down, with no platform-specific rendering logic of its own.
- Adding a new platform later means writing one new section component and two lines in the orchestrator, not modifying existing platform logic.

---

## 9. `upsert` over check-then-create for profile updates

**Decision:** `PATCH /api/profile` uses `prisma.profile.upsert()` rather than checking for existence and branching into create/update.

**Why:**
- Atomic — avoids a race condition where two near-simultaneous requests could both see "no profile exists" and attempt to create duplicate rows.
- Simpler code path: one Prisma call instead of a conditional check followed by two possible operations.
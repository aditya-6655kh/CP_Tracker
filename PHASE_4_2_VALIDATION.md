# Phase 4.2 — Codeforces recommendations

## Contract and ranking

`GET /api/stats/codeforces` adds `data.recommendations` to the existing response. Controllers, authentication, routes, profile handling, frontend fetching and existing stats fields are preserved.

The recommendation result contains `status` (`available` or `unavailable`), `mode` (`weak-topics` or `general-practice`), `targetRating`, `minRating`, `maxRating`, `usedDefaultRating`, `weakTags`, `historyPossiblyTruncated`, and `items`.

Each item has a stable contest/index ID, contest ID, index, name, rating, tags, matched weak tags, previous-attempt indicator and a Codeforces problem URL.

- Use at most the three weakest topics from Phase 4.1, ordered by solve rate, sample size, then tag. Sparse/unflagged topics do not become weak topics.
- Target the current user rating rounded to the nearest 100, with a minimum of 800. If the rating is missing/non-finite, use 1000. Accept rated programming problems in the inclusive target ±200 range, with a floor of 800.
- Exclude every problem with any `OK` submission in fetched history, even if later retries failed. Identity uses problem contest ID, falling back to submission contest ID, plus problem index; never match by name. Previously attempted but unsolved problems remain eligible.
- Omit malformed catalog entries, unrated problems, non-programming questions, and `*special` problems. Deduplicate by contest and index.
- Rank by rating distance, lower rating, contest ID and index. Cycle through weak topics to distribute up to six unique suggestions. With no weak topics, return general practice from the same rating range. If targeted candidates run out, return fewer/zero rather than silently broadening the range or topics.

The rating band and ranking are product heuristics. The existing 10,000-submission cap means older solved problems can be suggested; the UI explicitly warns when history may be truncated.

## Catalog and cache behavior

The existing catalog service now fetches the official [problemset.problems endpoint](https://codeforces.com/apiHelp/methods#problemset.problems) and reuses `CFProblem`/`CFProblemset`. [Problem fields](https://codeforces.com/apiHelp/objects#Problem) include optional rating and contest ID, so those are validated before selection.

The catalog uses the existing `Cache<T>` for 24 hours with one shared key. Concurrent cold requests share one pending promise. Invalid responses/network failures are not cached; subsequent requests can retry. The fetch has a 10-second timeout and only starts after core user data succeeds. A cold catalog can therefore add up to that timeout to a stats response; a catalog error returns `recommendations.status = unavailable` without failing the user's stats.

The complete personal response, including recommendations, remains cached for five minutes and in `StatsContext` during navigation. Refresh bypasses these personal caches, refetches submissions and recomputes suggestions, but deliberately does not invalidate the catalog shared across all users. There is no database synchronization, background scheduler, new schema, new endpoint or dependency. The existing Prisma `Problem` model is left intact for future persistent catalog work.

## Automated checks

Run `npm test` in backend and frontend, then type checks/builds and frontend lint. Tests use the existing Node runner, TypeScript compiler and React static renderer, without external API calls or database access.

Coverage: solved/retry identity, missing rating, rating boundaries, tag deduplication, six-result limit, diversity, stable ordering, general/empty modes, input immutability, malformed catalog data, concurrent fetches, 24-hour expiration, failure/retry, real coordination of both backend caches, per-handle isolation, refresh removing newly solved problems, fail-soft core stats, safe external links, explanatory UI states, history warnings, and all Phase 4.1 regressions.

## Browser acceptance checks

These require a running app and linked profile; static rendering tests do not substitute for a live browser run.

1. Check a user with weak topics and an unrated/new user. Verify targeted and general-practice descriptions, ratings and external problem links.
2. Confirm the recommendation section follows weak-area analytics and works on a narrow screen with keyboard navigation.
3. Navigate between Overview/Codeforces/LeetCode; no recommendation-specific request should appear.
4. Solve a suggested problem and Refresh. Once its accepted submission is returned, it must disappear.
5. Simulate a catalog timeout or malformed response: stats/charts remain usable; recommendations show a retry message. A forced refresh should recover when the catalog is available.
6. Verify no-match and truncated-history states, handle changes, and platform independence.

Goal tracking remains outside Phase 4.2.

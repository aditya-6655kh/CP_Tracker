# Phase 4.1 validation

## Scope and contract

`GET /api/stats/codeforces` adds `data.topicAnalytics` while retaining every existing field. It contains topic rows (`tag`, `attemptedProblems`, `solvedProblems`, `solveRate`, `status`), coverage (`submissionsFetched`, `excludedSubmissions`, `possiblyTruncated`), and the two classification thresholds.

The existing three upstream requests and five-minute handle cache are reused. Forced refresh recomputes the complete response. No Prisma migration, catalog sync or dependency installation is required.

## Automated checks

Run in each package:

```sh
npm test
npm run build
```

Run `npm run lint` in the frontend as well; pre-existing lint failures must be distinguished from regressions. Test sources use the existing TypeScript dependency to transpile imports in memory. Builds separately check TypeScript types.

- Backend: aggregation, unique identity, tag normalization, retry deduplication, accepted-then-failed history, input order and immutability, supported/excluded verdicts, sparse samples, exact threshold boundaries, stable ordering, coverage cap, cache hit/miss/expiry/refresh/isolation, failure caching, unchanged existing stats, controller envelope/errors/headers.
- Frontend: actual React static rendering for empty, missing, sparse, weak, unflagged and truncated analytics. A deterministic hook harness checks stale success/failure handling, handle removal, refresh ordering, navigation reuse and unmount cleanup. The harness does not replace browser lifecycle testing.

## Browser acceptance checks

These require a running application with a database and linked test profile; automated static tests do not establish that they passed.

- Sign in with and without a linked Codeforces handle. Confirm existing prompts, loading and error states still render.
- Open Codeforces, inspect the topic table, and navigate to Overview and back. Confirm no navigation-only stats refetch.
- Refresh and confirm `?refresh=true` is sent, the button is disabled while loading, and existing charts and topic analytics refresh together.
- Change/remove the handle while a stats request is pending. Confirm old results never replace the current handle's stats. Repeat with a failed old request and after logout.
- Confirm Codeforces and LeetCode remain independently usable when one platform fails.
- Inspect narrow/mobile layouts, horizontal table scrolling, keyboard navigation and table headers. Verify the old rating chart tooltip still displays rating, rank and contest name.

## Interpretation limits

The threshold (at least five problems, below 50% solved) is a product heuristic. It does not adjust for rating, recency, or contest/practice mode. History is limited to the submissions already fetched, at most 10,000; reaching the cap means possible truncation, not proof of truncation. Missing older accepted solutions can make a topic look weaker.

Only explicitly supported judged verdicts contribute. Missing/unknown/pending/system/skipped verdicts and missing problem identities are excluded. An eligible untagged submission can use tags from another eligible attempt at the same problem; a problem with no tags across eligible attempts is excluded. Tags are trimmed and deduplicated. Any eligible accepted attempt resolves that problem for all its observed tags.

No recommendations or goal tracking are implemented in this phase.

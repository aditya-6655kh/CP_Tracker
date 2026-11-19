# Phase 4.3 — Codeforces goals

## Scope and semantics

Goals persist owner, original Codeforces handle, target, start and deadline. POST starts a goal at server time. PATCH permits only target/deadline, before the current deadline. Targets are integers 1–1,000; deadlines must be canonical ISO UTC strings, in the future and within 366 days. The editor displays local time. Owners can delete any of their goals. Other users receive 404 for mutations; list responses contain only their own goals. All authenticated goal responses use `Cache-Control: no-store`.

Count distinct accepted contest/index identities with timestamps in `[startsAt, min(deadline, now))`. Retries count once; a previously solved problem accepted again inside this window counts. Starts and handles cannot be changed. Changing/unlinking a profile does not move or delete its goals. Expired goals cannot be extended; create a new goal instead.

Progress reuses `CFSubmission`, `CodeforcesStats` and `Cache<T>`. The same five-minute server snapshot stores public stats plus private-to-the-server raw history; raw submissions are never added to the public stats response. Concurrent requests share a pending fetch. The 24-hour public catalog remains unchanged. Goal definitions are never put in the shared handle cache.

Missing/invalid accepted evidence or a 10,000-item history that does not cover the start makes the count a lower bound. Reaching the target proves completion even with incomplete history. Otherwise an ended goal is unknown when history is incomplete or the snapshot predates its deadline; refresh after the deadline to verify it. Upstream failure yields a null count, not a misleading zero, while saved goals remain visible. Goals are not a permanent solve ledger: old progress can become unverifiable as history falls outside the cap, and rejudging can change it.

The dashboard has create/edit forms, inline delete confirmation, progress/status cards, a dedicated refresh, loading/error states and a link-handle prompt. Existing stats refresh also reloads goal progress from the shared snapshot. Outdated reads cannot replace newer mutation/refresh results.

## Migration and prerequisites

`20261110000000_add_goals` adds only the Goal table, owner index, cascade foreign key and target/deadline checks. Apply with `npx prisma migrate deploy`, then `npx prisma generate`; do not reset the database. Existing User, Profile and Problem records remain intact.

Related integration fixes: registration/login return the frontend's expected `{ success, token, user }`, with no password; registration normalizes email and creates its profile atomically. The frontend reads `VITE_API_URL`, and backend `npm start` uses `dist/src/server.js`. No dependency was added.

## Automated validation

Run `npm test` and `npm run build` in both packages. Unit tests require neither a database nor external API access. Coverage includes time boundaries, retries/re-solves, identity fallback, history caps, missing evidence, expired/stale states, owner isolation, input tampering, saved handles, per-handle grouping/outages, cache concurrency, auth response shape, UI rendering, timezone conversion and stale request ordering, plus all earlier analytics/recommendation regressions.

The separate HTTP integration test uses real Express routes, JWT authentication, Prisma and a local PostgreSQL database. External Codeforces responses are fixtures. It creates two randomly named temporary users and cleans up only those users, their profiles and goals. It verifies registration/login, linking, persistence, CRUD, authorization, refresh, unavailable/recovery states and existing stats fields.

After migration, run in backend (PowerShell):

```powershell
$env:RUN_DB_TESTS = '1'
npm run test:integration
Remove-Item Env:RUN_DB_TESTS
```

The test refuses non-local database hosts and skips unless explicitly enabled. Static React rendering and a hook harness do not replace browser interaction checks.

## Browser acceptance checklist

1. Register/login, link a Codeforces handle, and create a goal on Overview. Reload and verify persistence.
2. Verify deadline local-time display, invalid targets/deadlines, keyboard operation and narrow-screen layout.
3. Edit target/deadline and delete with confirmation; cancel retains the goal. Expired goals cannot be edited.
4. Refresh after a qualifying accepted submission: count increases once per distinct problem. Acceptances outside the window do not count.
5. Switch/unlink the profile handle: existing goals retain the original handle, and creating a new goal requires a current handle.
6. Verify completed, expired, incomplete-history and outage states. A failed refresh must retain the saved goal, and retry must recover.
7. Rapidly navigate/refresh/save; older requests must not overwrite newer results. Existing platform stats, topics and recommendations must still work.

## Execution record

- 2026-11-10: Prisma schema validation and client generation passed; the additive migration was applied successfully to local `cp_tracker` PostgreSQL.
- Backend: 50 unit tests passed. The opt-in real database/HTTP lifecycle test passed and removed its temporary records.
- Frontend: 26 tests passed. Both backend and frontend production builds passed; Vite retains a large-bundle warning.
- Browser automation host was unavailable. Interactive browser acceptance checks above remain pending; no live UI or upstream Codeforces run is claimed.
- Full frontend lint has 13 pre-existing errors in profile API, contexts, older hooks and pages. Phase 4.3 files are checked separately; no dependency was added.

## Review fixes — 2026-11-12

- Docker/PostgreSQL is reachable; the real HTTP/database lifecycle test passes and cleans up its temporary records.
- Goal refresh intent survives background stats updates. Backend readers join an in-flight refresh before consulting the previous cache.
- Codeforces and LeetCode share request lifecycle handling that ignores stale completions on handle changes, refreshes and unmount.
- All three Codeforces user requests have a 10-second timeout; failed snapshots release their pending entry so retries can recover.
- Invalid login credentials remain on the login form. Protected-endpoint 401 responses still clear the expired session.
- Context hooks and providers are separate; frontend lint passes without suppressions or dependency changes.
- Verification: 54 backend tests, 41 frontend tests, one real database/HTTP integration test, and both production builds passed. Frontend lint has zero errors or warnings.
- The existing Vite bundle-size warning remains. Browser interaction and live upstream API availability were not tested in this fix pass.

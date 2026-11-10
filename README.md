# CP Tracker

A full-stack Competitive Programming Tracker that connects to Codeforces and LeetCode to display ratings, solved problems, submission analytics, activity history, and streaks in a single dashboard.

Built as a portfolio project to demonstrate production-quality backend architecture, external API integration, and clean React/TypeScript frontend patterns — not a tutorial clone.

---

## Tech Stack

**Frontend:** React, Vite, TypeScript, Tailwind CSS, Recharts
**Backend:** Node.js, Express, TypeScript
**Database:** PostgreSQL (Docker) + Prisma ORM
**Auth:** JWT + bcryptjs

---

## Features by Phase

### Phase 1 — Foundation 
- User registration, login, JWT-based auth, protected `/me` route
- Profile model with editable platform handles (`PATCH /api/profile`)

### Phase 2 — External Stats Integration 
- **Codeforces** — current/max rating, rank, unique problems solved, full submission verdict breakdown (via official REST API)
- **LeetCode** — solved count by difficulty, global ranking, contest rating, recent submissions (via internal GraphQL endpoint)
- **GeeksforGeeks** — intentionally not integrated. See [`ARCHITECTURE_DECISIONS.md`](./ARCHITECTURE_DECISIONS.md) for reasoning.

### Phase 3 — Analytics 
- Codeforces rating history graph (Recharts line chart); LeetCode contest rating shown as a single stat
- Codeforces and LeetCode activity heatmaps (GitHub-style, ~6 months / full year respectively)
- Codeforces and LeetCode current + max streak tracking — LeetCode's is sourced from its own `userCalendar.streak` field rather than recomputed locally

### Caching Layer 
- **Backend** — in-memory TTL cache (5 min) per platform handle, avoids hammering the Codeforces/LeetCode APIs on every dashboard load. Bypassable via `?refresh=true` query param; responses include an `X-Cache: HIT | MISS` header for easy verification.
- **Frontend** — `StatsContext` caches fetched stats for the session (resets on full page reload), so navigating between Overview/Codeforces/LeetCode pages doesn't refetch data already in memory. A manual "Refresh" button per platform page forces a real refetch (bypassing both cache layers) and is disabled while loading. Codeforces requests ignore stale completions after refresh, handle changes, or unmount.

### Phase 4.1 — Codeforces weak-area analytics
- Topic-level unique attempted/solved problems and problem solve rates, derived from the existing submission fetch.
- Topics with at least 5 attempted problems and a solve rate below 50% are flagged for practice; smaller samples show "Insufficient data".
- Retries count once per problem, and any accepted attempt marks it solved. Multi-tag problems count toward each topic.
- Coverage includes fetched/excluded submission counts and a warning when the 10,000-submission cap is reached. These are practice signals, not difficulty-adjusted or lifetime skill assessments.
- Uses the existing endpoint and both cache layers; no catalog sync, new network calls, schema changes, or dependencies.

### Phase 4.2 — Codeforces problem recommendations
- Up to six practice problems, prioritizing the three weakest eligible topics and excluding accepted problems found in fetched submissions.
- Ratings within 200 points of the current rating rounded to the nearest 100 (minimum target 800); unrated users start at 1000. Users without weak topics receive labelled general practice.
- Cards explain the topic match, rating, previous attempts, and link directly to Codeforces. No matches and temporary catalog failure have distinct states.
- The public problem catalog uses the existing TTL cache for 24 hours, shared across handles, with concurrent fetches combined. Personal stats/recommendations retain the five-minute cache and session cache.
- Refresh refetches personal submissions and recomputes suggestions against the shared catalog. Catalog failure preserves existing stats. No new dependencies, database changes, or catalog persistence are required.

### Remaining Phase 4 — Planned
- Goal tracking

### Deliberately Out of Scope
- **Email verification, token-based password reset, and API rate limiting** were considered and scoped out. This is a portfolio project meant to demonstrate specific engineering skills (API integration, caching, service architecture) rather than a production system — these are well-understood, standard patterns that wouldn't add meaningfully to that signal. See [`ARCHITECTURE_DECISIONS.md`](./ARCHITECTURE_DECISIONS.md) for the full reasoning.

---

## Architecture Highlights

- **Service layer separation** — controllers only handle HTTP concerns; all external API logic (Codeforces REST calls, LeetCode GraphQL queries) lives in `src/services/`, decoupled from Express entirely.
- **Custom typed errors per platform** (`CodeforcesApiError`, `LeetcodeApiError`) carry HTTP status codes, so controllers can respond with accurate `404`/`503`/`500` without messy type-checking.
- **Parallel data fetching** — all per-platform API calls run via `Promise.all`, cutting wait time significantly versus sequential awaits.
- **Fail-soft non-critical fields** — e.g. LeetCode contest ranking and recent submissions degrade gracefully to `null`/`[]` rather than failing the entire request if that sub-query errors.
- **Zero extra API calls for Phase 3** — rating history, activity heatmap, and streaks are all derived from data already fetched in Phase 2 (`user.status` / `userCalendar` data), not new network requests.
- **Independent frontend section components** — `CodeforcesSection` and `LeetcodeSection` load and fail independently on the dashboard; one platform's API hiccup never blocks the other's data from rendering.
- **Two-layer caching, working together** — the backend TTL cache protects the external APIs themselves; the frontend `StatsContext` avoids redundant network round-trips during a session. The manual refresh flow deliberately bypasses both in sync (`?refresh=true` on the backend, `force=true` on the frontend), so refreshing always shows genuinely fresh data.

See [`ARCHITECTURE_DECISIONS.md`](./ARCHITECTURE_DECISIONS.md) for the full reasoning behind specific tradeoffs.

---

## Project Structure

```
cp-tracker/
├── backend/
│   └── src/
│       ├── controllers/      # Thin HTTP handlers
│       ├── services/         # External API integration logic + in-memory caches
│       ├── routes/
│       ├── middlewares/      # Auth (JWT verification)
│       ├── types/            # Shared + external API types
│       └── lib/              # Prisma client, cache utility
└── frontend/
    └── src/
        ├── api/               # Axios instance + per-resource API functions
        ├── components/
        │   ├── layouts/       # Sidebar, DashboardLayout
        │   └── dashboard/     # Per-platform sections, charts, shared prompts
        ├── context/           # AuthContext, ProfileContext, StatsContext
        ├── pages/             # Landing, Login, Register, Dashboard (Overview),
        │                      # Codeforces, Leetcode, Profile
        ├── types/
        └── utils/
```

---

## Setup

### Backend

```bash
cd backend
npm install
# Configure .env with DATABASE_URL and JWT_SECRET
npx prisma migrate dev
npm run dev
```

### Frontend

```bash
cd frontend
npm install
# Configure .env with VITE_API_URL
npm run dev
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current authenticated user |
| GET | `/api/profile` | Get current user's profile + handles |
| PATCH | `/api/profile` | Update one or more platform handles |
| GET | `/api/stats/codeforces` | Codeforces stats, topic analytics, and problem recommendations. `?refresh=true` bypasses the personal stats cache; the shared problem catalog retains its 24-hour TTL. |
| GET | `/api/stats/leetcode` | Full LeetCode stats (solved breakdown, ranking, contest, recent submissions, activity, streak). Supports `?refresh=true` to bypass the server-side cache. |
| GET | `/api/health` | Basic health check |

## Validation

Run `npm test` and `npm run build` in both `backend` and `frontend`. Tests use Node's built-in test runner and the existing TypeScript compiler; they do not call external APIs or a database. Frontend tests cover static rendering and request ordering with a deterministic hook harness, not a browser DOM.

See [PHASE_4_1_VALIDATION.md](./PHASE_4_1_VALIDATION.md) for coverage, limitations, and browser checks.
See [PHASE_4_2_VALIDATION.md](./PHASE_4_2_VALIDATION.md) for recommendation rules, cache behavior, and acceptance checks.

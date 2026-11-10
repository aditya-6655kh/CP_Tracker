# CP Tracker — Interview Preparation Guide

> **Purpose:** This document covers every angle an interviewer might explore about this project. Read it end-to-end, then use the Q&A sections as flashcards.

---

## Table of Contents

1. [Elevator Pitch](#1-elevator-pitch)
2. [Tech Stack & Why Each Choice](#2-tech-stack--why-each-choice)
3. [Project Architecture Overview](#3-project-architecture-overview)
4. [Database Design](#4-database-design)
5. [Authentication Flow](#5-authentication-flow)
6. [Backend Deep Dive](#6-backend-deep-dive)
7. [External API Integration](#7-external-api-integration)
8. [Caching System](#8-caching-system)
9. [Frontend Deep Dive](#9-frontend-deep-dive)
10. [Error Handling Strategy](#10-error-handling-strategy)
11. [Security Considerations](#11-security-considerations)
12. [Deliberate Scoping Decisions](#12-deliberate-scoping-decisions)
13. [What I'd Do Differently / Improvements](#13-what-id-do-differently--improvements)
14. [Common Interview Q&A](#14-common-interview-qa)
15. [System Design Angle](#15-system-design-angle)
16. [Code Snippets to Be Ready to Explain](#16-code-snippets-to-be-ready-to-explain)

---

## 1. Elevator Pitch

> *"CP Tracker is a full-stack web application I built that connects to Codeforces and LeetCode APIs to display a unified dashboard of a competitive programmer's stats — ratings, solved problems, submission analytics, GitHub-style activity heatmaps, and streak tracking. It features JWT authentication, a service-layer architecture with custom typed errors, a two-layer caching system (backend TTL cache + frontend session cache), and parallel API fetching via Promise.all. I built it from scratch — not from a tutorial — to demonstrate production-quality backend architecture, external API integration, and clean React/TypeScript patterns."*

**Keep it under 60 seconds. Hit these keywords:** full-stack, TypeScript, external API integration, service-layer separation, caching, JWT auth, parallel fetching, clean architecture.

---

## 2. Tech Stack & Why Each Choice

| Technology | Role | Why I Chose It |
|---|---|---|
| **React 19** | Frontend UI | Component-based, strong ecosystem, industry standard |
| **Vite** | Frontend bundler | Instant HMR, faster than CRA, modern ESM-based |
| **TypeScript** | Both frontend & backend | Type safety catches bugs at compile time, better DX with autocompletion, self-documenting code |
| **Tailwind CSS** | Styling | Rapid UI development, utility-first approach, easy dark mode, no context-switching to CSS files |
| **Node.js + Express** | Backend server | JavaScript/TypeScript across the stack, massive middleware ecosystem, lightweight |
| **PostgreSQL** | Database | Relational data model fits users + profiles, ACID compliance, production-grade |
| **Prisma ORM** | Database access | Type-safe queries auto-generated from schema, easy migrations, great DX |
| **JWT (jsonwebtoken)** | Authentication | Stateless auth — no session store needed, scales easily, industry standard for SPAs |
| **bcryptjs** | Password hashing | Adaptive hash function with salt rounds, battle-tested for password security |
| **Axios** | HTTP client | Interceptors for auth headers, timeout support, better error handling than fetch |
| **Recharts** | Data visualization | React-native charting, responsive containers, clean API for line charts |
| **Lucide React** | Icons | Lightweight, tree-shakeable, consistent icon set |
| **Morgan** | HTTP logging | Dev-mode request logging, helps debug API calls during development |

### Questions to expect:
- **"Why not Next.js?"** — This isn't an SEO-focused app. It's a logged-in dashboard (SPA). No need for SSR/SSG. Vite + React is simpler and faster for this use case.
- **"Why PostgreSQL over MongoDB?"** — The data model is relational (User → Profile, one-to-one). PostgreSQL's strict schema + Prisma's type generation gives compile-time safety. MongoDB's flexibility isn't needed here.
- **"Why not Redis for caching?"** — Single server instance, in-memory `Map` with TTL is sufficient. Redis would add infrastructure complexity for zero benefit at this scale. I'd switch to Redis if I ever needed horizontal scaling.

---

## 3. Project Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + Vite)                     │
│                                                                     │
│  ┌──────────┐  ┌──────────────┐  ┌─────────────┐  ┌────────────┐  │
│  │   Pages  │──│  Components  │──│   Context    │──│  API Layer │  │
│  └──────────┘  └──────────────┘  └─────────────┘  └─────┬──────┘  │
│                                                          │         │
│  AuthContext (JWT token)                                 │         │
│  ProfileContext (user handles)                           │         │
│  StatsContext (CF + LC data, session cache)               │         │
└──────────────────────────────────────────────────────────┼─────────┘
                                                           │ HTTP
                                                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     BACKEND (Express + TypeScript)                   │
│                                                                     │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────────────────┐  │
│  │  Routes  │───▸│ Controllers  │───▸│       Services           │  │
│  │          │    │ (HTTP only)  │    │  (business + API logic)  │  │
│  └──────────┘    └──────────────┘    └───────────┬──────────────┘  │
│       │                                          │                 │
│  ┌────┴─────┐                          ┌─────────┴─────────┐      │
│  │Middleware │                          │  In-Memory Cache  │      │
│  │  (JWT)   │                          │  (TTL = 5 min)    │      │
│  └──────────┘                          └─────────┬─────────┘      │
│                                                  │                 │
│                                    ┌─────────────┴──────────────┐  │
│                                    │    External APIs           │  │
│                                    │  • Codeforces REST API     │  │
│                                    │  • LeetCode GraphQL API    │  │
│                                    └────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────┐                                               │
│  │  Prisma + PostgreSQL  │                                          │
│  │  (User, Profile)      │                                          │
│  └──────────────────┘                                               │
└─────────────────────────────────────────────────────────────────────┘
```

### Key architectural principle:
**Separation of concerns at every level:**
- **Routes** → only define URL mappings
- **Controllers** → only handle HTTP (extract params, call service, shape response)
- **Services** → all business logic, external API calls, data transformation
- **Types** → separate "raw API types" from "processed types" (what frontend receives)

---

## 4. Database Design

```sql
-- Two tables, one-to-one relationship

model User {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  password  String                          -- bcrypt hash, never plaintext
  profile   Profile?                        -- optional one-to-one
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Profile {
  id              String   @id @default(uuid())
  userId          String   @unique         -- ensures 1:1 with User
  cfHandle        String?                  -- nullable, user may not use CF
  leetcodeHandle  String?
  gfgHandle       String?                  -- stored but not actively used
  updatedAt       DateTime @updatedAt
  user            User     @relation(...)
}
```

### Design decisions to explain:
- **Why separate User and Profile?** — Clean separation. User holds auth data (email/password). Profile holds platform-specific data. They change for different reasons.
- **Why `uuid()` for IDs?** — Not sequential, so they don't leak creation order. URL-safe. Standard for modern apps.
- **Why `gfgHandle` exists but isn't used?** — Schema is future-proofed. GFG integration was investigated and deferred due to no official API and `robots.txt` restrictions (documented in ARCHITECTURE_DECISIONS.md).
- **Why `upsert` for profile updates?** — Atomic operation. Avoids race condition where two concurrent requests both see "no profile" and try to create duplicate rows. One Prisma call instead of a check-then-branch.

---

## 5. Authentication Flow

```
                    REGISTRATION
┌────────┐    POST /api/auth/register    ┌────────┐
│Frontend│ ──────────────────────────▸   │Backend │
│        │   {name, email, password}     │        │
│        │                               │  1. Validate inputs (name ≥ 2 chars,
│        │                               │     valid email regex, password ≥ 8)
│        │                               │  2. Check email uniqueness
│        │                               │  3. bcrypt.hash(password, 10)
│        │                               │  4. prisma.user.create()
│        │  ◂──────────────────────────  │  5. Return {id, email, name}
└────────┘     201 Created               └────────┘

                      LOGIN
┌────────┐      POST /api/auth/login     ┌────────┐
│Frontend│ ──────────────────────────▸   │Backend │
│        │   {email, password}           │        │
│        │                               │  1. Find user by email
│        │                               │  2. bcrypt.compare(password, hash)
│        │                               │  3. jwt.sign({userId}, secret,
│        │                               │     {expiresIn: '7d', algorithm: 'HS256'})
│        │  ◂──────────────────────────  │  4. Return {token, user}
│        │                               │
│  Stores token in localStorage          └────────┘
│  Sets AuthContext                      
└────────┘                               

              AUTHENTICATED REQUESTS
┌────────┐  GET /api/stats/codeforces    ┌────────┐
│Frontend│ ──────────────────────────▸   │Backend │
│  Axios │  Authorization: Bearer <JWT>  │        │
│ inter- │                               │ protect middleware:
│ ceptor │                               │  1. Extract token from header
│ auto-  │                               │  2. jwt.verify(token, secret,
│ adds   │                               │     {algorithms: ['HS256']})
│ header │                               │  3. Attach userId to req
│        │  ◂──────────────────────────  │  4. Call next()
└────────┘     200 OK + data             └────────┘
```

### Security measures in auth:
1. **Generic error messages on login** — "Invalid credentials" for both wrong email and wrong password (prevents email enumeration)
2. **bcrypt with 10 salt rounds** — adaptive hashing, resistant to rainbow tables
3. **HS256 algorithm explicitly specified** — prevents algorithm confusion attacks
4. **JWT_SECRET checked at runtime** — server returns 500 if env var is missing (fails closed)
5. **Global 401 interceptor on frontend** — auto-logout + redirect to `/login` if any request returns 401 (token expired)

---

## 6. Backend Deep Dive

### 6.1 Folder Structure

```
backend/src/
├── server.ts              # Entry point: starts Express on PORT
├── app.ts                 # Express app: CORS, JSON parsing, morgan, route mounting
├── controllers/
│   ├── auth.controller.ts     # Register + Login
│   ├── profile.controller.ts  # getProfile + upsertProfile
│   ├── codeforces.controller.ts  # fetchCodeForcesStats
│   └── leetcode.controller.ts    # fetchLeetcodeStats
├── services/
│   ├── codeforces.services.ts  # All CF API logic + transformations + cache
│   └── leetcode.services.ts    # All LC API logic + transformations + cache
├── routes/
│   ├── auth.routes.ts      # POST /register, POST /login, GET /me
│   ├── profile.routes.ts   # GET /, PATCH / (both behind protect)
│   └── stats.routes.ts     # GET /codeforces, GET /leetcode (behind protect)
├── middlewares/
│   └── auth.middleware.ts  # JWT verification, AuthRequest interface
├── lib/
│   ├── prisma.ts           # Singleton PrismaClient instance
│   └── cache.ts            # Generic Cache<T> class with TTL + sweep
└── types/
    ├── codeforces.types.ts # Raw CF API types + processed types
    ├── leetcode.types.ts   # Raw LC API types + processed types
    └── express/            # Express type augmentations
```

### 6.2 Controller Pattern

Controllers are intentionally **thin**. They only do:
1. Check auth (`req.userId`)
2. Look up the user's handle from the database
3. Call the service function
4. Set response headers (`X-Cache`, `Cache-Control`)
5. Return the response

**They never:**
- Call `axios` directly
- Transform data
- Contain business logic

```typescript
// Example: codeforces.controller.ts — the entire controller is ~40 lines
const profile = await prisma.profile.findUnique({
  where: { userId: req.userId },
  select: { cfHandle: true },
});

const skipCache = req.query.refresh === "true";
const { stats, cacheHit } = await getCodeForcesStats(profile.cfHandle, skipCache);
res.setHeader("X-Cache", cacheHit ? "HIT" : "MISS");
res.status(200).json({ success: true, data: stats });
```

### 6.3 Service Pattern

Services encapsulate all external API logic:
1. **Raw API fetchers** — `fetchUserInfo()`, `fetchUserRating()`, `fetchUserStatus()`
2. **Transform functions** — Convert raw API shapes into frontend-friendly shapes
3. **Compute functions** — `computeSolvedCount()`, `computeStreak()`, `computeActivityMap()`
4. **Main orchestrator** — `getCodeForcesStats()` ties everything together with `Promise.all`

---

## 7. External API Integration

### 7.1 Codeforces (REST API)

Three endpoints called in parallel:

| Endpoint | Purpose | Returns |
|---|---|---|
| `user.info?handles=X` | Basic profile info | Rating, rank, maxRating, maxRank |
| `user.rating?handle=X` | Full contest history | Array of rating changes per contest |
| `user.status?handle=X&count=10000` | All submissions | Array of every submission with verdict, timestamp, problem |

**From `user.status` alone**, these are derived (zero extra API calls):
- Unique problems solved (using `Set<contestId-problemIndex>`)
- Submission verdict breakdown (OK, WA, TLE, MLE, RE, CE, Other)
- Activity heatmap (aggregating submission timestamps by date)
- Current streak (walking backwards from today/yesterday)
- Max streak (scanning sorted dates for consecutive gaps of 1 day)

### 7.2 LeetCode (GraphQL API)

Four GraphQL queries called in parallel:

| Query | Purpose | Fail Behavior |
|---|---|---|
| `userPublicProfile` | Username, ranking, solved by difficulty | **Hard fail** — if this fails, handle doesn't exist |
| `userContestRanking` | Contest rating, percentile, contests attended | **Soft fail** → returns `null` |
| `recentAcSubmissions` | Last 10 accepted submissions | **Soft fail** → returns `[]` |
| `userProfileCalendar` | Full year of `{timestamp: count}` data, streak, totalActiveDays | **Soft fail** → returns `null` |

**Why the difference in fail behavior?**
- `matchedUser` is the handle validation query. If it returns null, the user doesn't exist → 404.
- Contest ranking returns null legitimately if a user has never done a contest.
- Recent submissions and calendar are supplementary data. Failing them shouldn't block the entire response.

### 7.3 Codeforces vs LeetCode API Differences

| Aspect | Codeforces | LeetCode |
|---|---|---|
| API type | REST (JSON) | GraphQL |
| Authentication | None needed | None needed (public fields only) |
| Rate limiting | Known to be aggressive | Less documented |
| Streak computation | Computed locally from submission timestamps | Trusted from API's `streak` field directly |
| Activity data | Derived from full submission list | Provided as `submissionCalendar` (JSON string of `{unixTs: count}`) |
| Headers needed | None | `Referer: https://leetcode.com`, `Origin: https://leetcode.com` |

---

## 8. Caching System

### 8.1 Two-Layer Design

```
User clicks "Refresh"
        │
        ▼
┌─────────────────────────────────────────────────┐
│  LAYER 1: Frontend StatsContext (session cache)  │
│  • Stores fetched stats in React state           │
│  • Avoids redundant HTTP round-trips when         │
│    navigating between pages (Overview→CF→LC)      │
│  • Cleared on full page reload                    │
│  • Bypassed when force=true                       │
└────────────────────┬────────────────────────────┘
                     │ HTTP request (only if cache miss or force)
                     ▼
┌─────────────────────────────────────────────────┐
│  LAYER 2: Backend In-Memory Cache (TTL = 5 min)  │
│  • Generic Cache<T> class using Map<string, {    │
│    data: T, expiresAt: number }>                 │
│  • Keyed by platform handle (not userId)         │
│  • Periodic sweep every 60s to evict expired     │
│  • Bypassed when ?refresh=true query param       │
│  • Returns X-Cache: HIT|MISS header              │
└────────────────────┬────────────────────────────┘
                     │ Only on cache miss
                     ▼
┌─────────────────────────────────────────────────┐
│  External APIs (Codeforces REST / LeetCode GQL)  │
└─────────────────────────────────────────────────┘
```

### 8.2 Cache Implementation Details

```typescript
// lib/cache.ts — Generic, reusable class
export class Cache<T> {
  private store = new Map<string, CacheEntry<T>>();
  
  // Periodic sweep to prevent memory leaks
  constructor(defaultTtlSeconds = 300, sweepIntervalSeconds = 60) {
    this.sweepTimer = setInterval(() => {
      for (const [key, entry] of this.store) {
        if (entry.expiresAt <= now) this.store.delete(key);
      }
    }, sweepIntervalSeconds * 1000);
    
    // .unref() so the sweep timer doesn't prevent Node from exiting
    if (this.sweepTimer.unref) this.sweepTimer.unref();
  }
}
```

### 8.3 Why Both Layers Must Bypass Together

When the user clicks "Refresh":
1. Frontend sets `force=true` → skips StatsContext cache, makes a real HTTP call
2. That HTTP call includes `?refresh=true` → backend skips its TTL cache, hits external APIs

**If only one layer bypassed:** The refresh button would appear to do nothing because the other layer would serve stale data.

### 8.4 Cache Keying Decision

Backend cache is keyed by **handle**, not by userId. This means:
- If two different CP Tracker users link the same Codeforces handle (e.g., "tourist"), they share one cache entry.
- This is correct behavior: the Codeforces data for "tourist" is the same regardless of which CP Tracker user is viewing it.
- This also means fewer external API calls for popular handles.

---

## 9. Frontend Deep Dive

### 9.1 Context Architecture

```
<BrowserRouter>
  <AuthProvider>              ← Provides: user, token, login(), logout()
    <Routes>
      <PrivateRoute>
        <ProfileProvider>     ← Provides: profile (handles), refetch()
          <StatsProvider>     ← Provides: cfStats, lcStats, loading, errors, refresh()
            <DashboardLayout> ← Sidebar + <Outlet/>
              <DashboardPage/>
              <CodeforcesPage/>
              <LeetcodePage/>
              <ProfilePage/>
            </DashboardLayout>
          </StatsProvider>
        </ProfileProvider>
      </PrivateRoute>
    </Routes>
  </AuthProvider>
</BrowserRouter>
```

### 9.2 Context Responsibilities

| Context | State | Purpose |
|---|---|---|
| **AuthContext** | `user`, `token`, `isLoading` | JWT storage in localStorage, auto-validation on mount via `GET /api/auth/me`, login/logout helpers |
| **ProfileContext** | `profile`, `loading` | Fetches platform handles once on mount, provides `refetch()` after profile edits |
| **StatsContext** | `cfStats`, `lcStats`, loading/error per platform | Fetches stats when handles change, provides `refreshCf()`, `refreshLc()`, `refreshAll()`. Acts as the frontend session cache. |

### 9.3 Route Protection Pattern

```typescript
// PublicRoute: redirects to /dashboard if already logged in
const PublicRoute = ({ children }) => {
  const { token, isLoading } = useAuth();
  if (isLoading) return null;  // Prevent flash
  return token ? <Navigate to="/dashboard" /> : <>{children}</>;
};

// PrivateRoute: redirects to /login if not authenticated
const PrivateRoute = ({ children }) => {
  const { token, isLoading } = useAuth();
  if (isLoading) return null;  // Prevent flash
  return token ? <>{children}</> : <Navigate to="/login" />;
};
```

**Key: `isLoading` check** — Without it, on page refresh, the token hasn't been validated yet, so `token` is temporarily null → user would flash to the login page before being redirected back. The `isLoading` guard prevents this.

### 9.4 Independent Section Components

`CodeforcesSection` and `LeetcodeSection` are **fully independent**:
- Each manages its own loading/error state
- If LeetCode API is down, Codeforces stats still render (and vice versa)
- Each can be used on the overview dashboard AND on its dedicated page

### 9.5 Axios Interceptors

```typescript
// Request interceptor: auto-attach JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: global 401 handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';   // Hard redirect, clears all state
    }
    return Promise.reject(error);
  }
);
```

### 9.6 Component List

| Component | Purpose |
|---|---|
| `DashboardLayout` | Fixed sidebar + mobile hamburger + `<Outlet/>` |
| `Sidebar` | Navigation links + logout button + user info |
| `CodeforcesSection` | Full CF stats view: rating, solved, submissions, breakdown, chart, heatmap, streak |
| `LeetcodeSection` | Full LC stats view: solved by difficulty, ranking, contest, recent submissions, heatmap, streak |
| `RatingChart` | Recharts `<LineChart>` for CF rating history |
| `ActivityHeatmap` | GitHub-style grid of submission activity (365 days) |
| `CombinedActivityStrip` | 30-day merged CF+LC activity strip for the overview page |
| `StreakCard` | Current streak + max streak display |
| `LinkHandlePrompt` | CTA when a platform handle isn't linked yet |

---

## 10. Error Handling Strategy

### 10.1 Custom Error Classes

```typescript
export class CodeforcesApiError extends Error {
  constructor(message: string, public readonly statusCode: number = 500) {
    super(message);
    this.name = "CodeforcesApiError";
  }
}
```

**Why custom errors?**
- Controllers can do `if (error instanceof CodeforcesApiError)` for clean handling
- Each error carries the appropriate HTTP status code (`404`, `503`, `500`)
- No `instanceof AxiosError` checks leaking into controller logic

### 10.2 Error Mapping

| Scenario | Status Code | Message |
|---|---|---|
| Handle not found on CF/LC | `404` | `CF handle "X" not found` |
| External API unreachable | `503` | `Failed to reach Codeforces API` |
| Unexpected internal error | `500` | `Something went wrong. Please try again.` |
| No handle linked in profile | `400` | `No CF handle linked` |
| Invalid credentials (login) | `401` | `Invalid credentials` (generic) |

### 10.3 Fail-Soft Pattern (LeetCode)

```typescript
// Contest ranking — null is a NORMAL state
async function fetchContestRating(username): Promise<LCContestRating | null> {
  try {
    // ...
    return data.data?.userContestRanking ?? null;
  } catch {
    return null;  // Silently degrade, don't crash the whole request
  }
}
```

The core `fetchUserProfile()` is a **hard fail** — if it errors, the whole request 404s. But contest/submissions/calendar are soft fails because their absence doesn't invalidate the rest of the data.

---

## 11. Security Considerations

### What IS implemented:
1. **Password hashing** — bcrypt with 10 salt rounds
2. **JWT with explicit HS256** — prevents algorithm confusion attacks
3. **Generic login errors** — "Invalid credentials" prevents email enumeration
4. **Input validation** — Name length, email regex, password length, handle format regex
5. **CORS configuration** — Locked to specific frontend origin
6. **Handle validation** — Regex patterns prevent injection through handle fields
7. **No password in JWT payload** — Only `userId` is encoded
8. **Global 401 auto-logout** — Expired tokens are handled gracefully

### What is DELIBERATELY not implemented (and why):
1. **Email verification** — Portfolio project, not production. Standard pattern, wouldn't showcase anything new.
2. **Rate limiting** — Partially covered by 15s frontend cooldown. Full `express-rate-limit` scoped out intentionally.
3. **Token-based password reset** — Would require real email delivery. Simplified to "change password" concept, then deprioritized entirely.
4. **CSRF protection** — Not needed because auth is Bearer token in header (not cookies). CSRF exploits cookie-based auth.
5. **Refresh tokens** — Single JWT with 7-day expiry. Refresh token rotation would be a production addition.

---

## 12. Deliberate Scoping Decisions

These are **critical** for interviews — they show you can think beyond code:

### 12.1 GFG Integration Deferred
- **Why:** No official API. `robots.txt` blocks scraping. Community wrapper APIs are unreliable.
- **How you'd add it:** Wrap it in the same service-layer pattern (`getGfgStats()`), isolate the unreliable dependency to one file.

### 12.2 LeetCode Topic-Wise Analysis Not Possible
- **Why:** `submissionCalendar` only provides `{date: count}`, not which problems/tags. Getting tags requires `LEETCODE_SESSION` cookie (auth-based, fragile, ToS concerns).
- **Shows:** You investigated the actual API schema before ruling a feature out, rather than just assuming.

### 12.3 Phase 3 Analytics = Zero New API Calls
- **How:** Rating history comes from `user.rating`. Activity heatmap and streaks are derived from `user.status` (which was already fetched for the submission breakdown). This was a deliberate optimization.

### 12.4 Streak Computation: CF vs LC
- **CF:** Computed locally — sort dates, walk backwards from today/yesterday, count consecutive days
- **LC:** Trusted from API's `streak` field — different internal logic, may not be apples-to-apples
- **Why trust LC's streak?** — LeetCode provides it directly. Recomputing would require assumptions about their timezone/cutoff logic that could be wrong.

---

## 13. What I'd Do Differently / Improvements

> Always have a thoughtful answer for "What would you improve?"

### Must-haves for production:
1. **Redis cache** instead of in-memory Map (for horizontal scaling)
2. **Rate limiting** with `express-rate-limit`, keyed by userId on stats endpoints
3. **Refresh token rotation** — short-lived access token (15 min) + long-lived refresh token
4. **Email verification** on registration
5. **Proper password reset flow** with email delivery
6. **Input sanitization library** (e.g., `express-validator` or `zod`) instead of manual regex
7. **Centralized error handler middleware** instead of try-catch in every controller
8. **Unit tests** — especially for transform/compute functions which are pure
9. **Integration tests** — for auth flows and API endpoints
10. **CI/CD pipeline** — GitHub Actions for lint, test, build

### Nice-to-haves:
1. **LRU eviction** for cache (bounded memory)
2. **WebSocket** for real-time stat updates
3. **Dark/light theme toggle**
4. **Export data as PDF/CSV**
5. **Comparison view** — compare your stats with a friend
6. **Goal tracking** (Phase 4) — set targets like "solve 5 problems this week"
7. **Mobile app** with React Native

---

## 14. Common Interview Q&A

### Architecture & Design

**Q: Why did you separate controllers and services?**
> Controllers should only handle HTTP concerns — extracting request params, calling a service, shaping the response. If I put external API logic in controllers, they'd become untestable, tightly coupled to Express, and impossible to reuse. If Codeforces changes their API, I only change one service file — not the controller, not the frontend contract.

**Q: Why `Promise.all` and not sequential awaits?**
> Codeforces requires 3 independent API calls (`user.info`, `user.rating`, `user.status`). None depends on the other's result. Sequential awaits would take ~sum of all three response times. `Promise.all` takes ~max of one response time. For 3 calls averaging 200ms each, that's ~200ms vs ~600ms.

**Q: What happens if one of the `Promise.all` calls fails?**
> For Codeforces, all three are essential — if any fails, the whole request fails with the appropriate error (404/503). For LeetCode, I use `Promise.all` but the non-critical calls (`fetchContestRating`, `fetchRecentSubmission`, `fetchUserCalendar`) have internal try-catch that returns null/empty array, so they never reject the Promise — only `fetchUserProfile` can crash the batch.

**Q: Why in-memory cache and not Redis?**
> Single-server app. A `Map<string, {data, expiresAt}>` with a 60-second sweep interval does the same job with zero infrastructure. If I scaled horizontally, I'd need Redis because each server instance would otherwise have inconsistent caches.

**Q: Why is the cache keyed by handle and not userId?**
> Because the external API data is the same for a given handle regardless of which CP Tracker user is viewing it. If 10 users link "tourist" as their CF handle, they should all share one cached response. Keying by userId would result in 10 identical external API calls.

### Frontend

**Q: Why three separate React Contexts instead of one big store?**
> Single Responsibility. `AuthContext` manages login state and shouldn't re-render when stats update. `ProfileContext` holds handles and shouldn't re-render when auth changes. `StatsContext` depends on `ProfileContext` (needs handles to know what to fetch) but not the other way around. Separate contexts mean a stats refresh only re-renders stats-consuming components, not the entire app.

**Q: Why Context API and not Redux/Zustand?**
> The state is relatively simple — auth token, profile object, two stats objects. Context + `useCallback` + `useState` handles this cleanly without the boilerplate of Redux or the extra dependency of Zustand. If state became more complex (many entities, optimistic updates, normalization), I'd switch.

**Q: How does the frontend avoid refetching data when navigating between pages?**
> `StatsContext` stores fetched stats in React state. When you navigate from Overview to Codeforces page and back, the data is already in memory — no new HTTP calls. A full page reload resets this (by design). The manual "Refresh" button bypasses it.

**Q: What's the `isLoading` guard in route protection?**
> On page refresh, `AuthContext` reads the token from localStorage but needs to validate it via `GET /me`. During that async call, `token` state is set but `user` isn't validated yet. Without `isLoading`, there's a flash where the user sees the login page before being redirected to the dashboard. `isLoading` shows nothing until validation completes.

### Backend

**Q: Why `upsert` instead of checking if profile exists then creating/updating?**
> Atomicity. With check-then-create, two concurrent requests could both see "profile doesn't exist" and both try to `CREATE` — causing a unique constraint violation. `upsert` is a single atomic database operation: if the row exists, update it; if not, create it. No race condition possible.

**Q: How do you handle Codeforces being down?**
> The service catches Axios errors, checks if it's a 404 (handle not found) vs network error, and throws a typed `CodeforcesApiError` with the appropriate status code (404 or 503). The controller catches this and returns the right HTTP status. The frontend shows the error message. LeetCode works the same way.

**Q: How do you compute unique solved problems on Codeforces?**
> I use a `Set<string>` where each entry is `${contestId}-${problemIndex}` for contest problems, or `problemName` for non-contest problems. Only submissions with `verdict === "OK"` are counted. `Set.size` gives the unique count.

**Q: How does streak computation work for Codeforces?**
> Two passes over the sorted activity dates:
> 1. **Max streak:** Walk forward, if `date[i] - date[i-1] = 1 day`, increment running streak, track max.
> 2. **Current streak:** Start from today (or yesterday if no submission today). Walk backwards one day at a time. Stop when a day has no submissions.

### Security

**Q: Why do you return "Invalid credentials" for both wrong email and wrong password?**
> To prevent email enumeration. If I said "Email not found" vs "Wrong password," an attacker could use the login endpoint to check which emails are registered, then target those for phishing or credential stuffing.

**Q: Is storing JWT in localStorage safe?**
> It's vulnerable to XSS (if an attacker injects script, they can read localStorage). The alternative is httpOnly cookies, but those introduce CSRF concerns and more complex CORS setup. For a portfolio project, localStorage + Bearer tokens is the standard SPA pattern. In production, I'd consider httpOnly cookies with CSRF tokens.

**Q: What happens if JWT_SECRET is not set in environment?**
> Both the login controller and the auth middleware check for it explicitly. If missing, they log an error and return a 500 — the server fails closed rather than silently proceeding without verification.

### General

**Q: What was the hardest part of this project?**
> Understanding LeetCode's undocumented GraphQL API. There's no official documentation. I had to inspect network requests on leetcode.com, discover available fields through trial and error, and realize that `recentAcSubmissionList` only returns ~20 items (no pagination), but `userCalendar.submissionCalendar` gives a full year of data. The initial assumption that activity heatmaps were impossible was wrong — I had to go back, re-investigate, and correct course.

**Q: What did you learn from this project?**
> 1. **Service-layer thinking** — how to decouple external dependencies from HTTP handling
> 2. **Caching is a system-level concern** — you can't just cache at one layer, you need to think about how layers interact (especially the bypass mechanism)
> 3. **API investigation matters** — don't assume a feature is impossible without fully mapping the available endpoints
> 4. **Typed errors propagate intent** — custom error classes make controller logic dramatically cleaner
> 5. **Parallel fetching is free performance** — `Promise.all` on independent calls is a trivial change with significant impact

**Q: Why not just use an existing tool like LeetCode Tracker extensions?**
> The point wasn't to build the most useful CP tracker — it was to demonstrate specific engineering skills: external API integration, service architecture, caching design, TypeScript patterns, and frontend-backend coordination. Building it from scratch let me make and document deliberate architectural decisions.

---

## 15. System Design Angle

If asked to scale this:

### Current Architecture (single server):
- In-memory cache → would lose data on restart
- Single PostgreSQL instance → single point of failure
- No CDN → all static assets served from origin

### Scaled Architecture:
```
                     ┌─── CDN (static assets) ───┐
                     │                            │
Users ──▸ Load Balancer ──▸ Server 1 ──┐
                          ──▸ Server 2 ──┼──▸ Redis (shared cache)
                          ──▸ Server N ──┘         │
                                                   ▼
                                          PostgreSQL (primary)
                                              │
                                          PostgreSQL (replica)
```

Changes needed:
1. **Redis** replaces in-memory Map (shared across instances)
2. **Load balancer** (Nginx/ALB) distributes traffic
3. **PostgreSQL read replicas** for query scaling
4. **Rate limiting** at load balancer + application level
5. **Queue** (Bull/Redis) for background stat refresh jobs
6. **Monitoring** (Prometheus + Grafana) for cache hit rates, external API latency

---

## 16. Code Snippets to Be Ready to Explain

These are the pieces an interviewer might zoom into. Know them line-by-line:

### 1. Cache class (`lib/cache.ts`)
- Generic `Cache<T>`, `Map`-based, TTL on each entry, periodic sweep with `setInterval`, `.unref()` to not block process exit.

### 2. `getCodeForcesStats()` orchestrator (`services/codeforces.services.ts`)
- Cache check → `Promise.all([fetchUserInfo, fetchUserRating, fetchUserStatus])` → transform → compute activity/streak → cache set → return.

### 3. `computeStreak()` algorithm (`services/codeforces.services.ts`)
- Sort dates, forward pass for max streak, backward pass from today for current streak. Uses `Set<string>` for O(1) date lookups.

### 4. `transformActivity()` for LeetCode (`services/leetcode.services.ts`)
- Merges multiple calendar years, parses JSON string `submissionCalendar`, converts unix timestamps to `YYYY-MM-DD`, deduplicates across year boundaries.

### 5. Auth middleware (`middlewares/auth.middleware.ts`)
- Extracts Bearer token, verifies with explicit `algorithms: ['HS256']`, attaches `userId` to `req`.

### 6. Axios interceptors (`api/axios.ts`)
- Request interceptor auto-attaches token. Response interceptor catches global 401s and redirects.

### 7. `StatsContext` (`context/StatsContext.tsx`)
- `useCallback` for memoized fetch functions, `useEffect` triggers on handle change, `force` parameter bypasses both cache layers.

---

## Quick Reference: File Counts

| Layer | Files | Lines of Code (approx) |
|---|---|---|
| Backend controllers | 4 | ~340 |
| Backend services | 2 | ~560 |
| Backend routes | 3 | ~58 |
| Backend middleware | 1 | ~33 |
| Backend lib | 2 | ~61 |
| Backend types | 2 | ~197 |
| Frontend pages | 7 | ~700 |
| Frontend components | 9 | ~750 |
| Frontend context | 3 | ~246 |
| Frontend API | 4 | ~85 |
| Frontend types | 1 | ~122 |
| Frontend utilities | 2 | ~32 |
| **Total** | **~40 files** | **~3,100 lines** |

---

## Final Tips for the Interview

1. **Lead with the "why"** — Don't just say what you built. Say why you made each decision.
2. **Mention tradeoffs** — Every decision has a downside. Showing you're aware of them is more impressive than pretending there are none.
3. **Reference your ARCHITECTURE_DECISIONS.md** — "I documented 11 specific architectural decisions with full reasoning." This shows engineering maturity.
4. **Don't oversell** — If something is missing (rate limiting, tests), own it and explain why: "This was a deliberate scoping decision for a portfolio project. Here's how I'd add it."
5. **Be ready to live-code** — The streak algorithm, the cache class, and the Promise.all orchestration are all reasonable whiteboard questions.
6. **Know your numbers** — 5-minute TTL, 10-second timeout, 7-day JWT, 10 salt rounds, 3 API calls for CF, 4 for LC. Interviewers love specifics.

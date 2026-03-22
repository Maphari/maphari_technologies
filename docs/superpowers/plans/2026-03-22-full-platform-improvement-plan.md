# Full Platform Improvement Plan — 2026-03-22

**Goal:** Harden security, ship quick wins, and add 24 well-scoped features across auth, infrastructure, and all three portals (Admin / Staff / Client) without breaking existing functionality or TypeScript checks.

**Architecture:**
- Monorepo: `apps/web` (Next.js 16), `apps/gateway` (NestJS), `services/auth`, `services/core` (Fastify + Prisma), `services/notifications`, `services/automation`
- Three portals: Admin (`/admin`), Staff (`/staff`), Client (`/client`) — separate subdomains in production
- Auth: JWT access token in memory + HTTP-only refresh cookie; `withAuthorizedSession` + `callGateway` + `AuthorizedResult<T>`; always call `saveSession(result.nextSession)` after every API call
- CSS: zero inline `style={{}}` ever; use `cx()` from `createCx(styles)`; design tokens `--s1/s2/s3`, `--b1/b2/b3`, `--lime`, `--r-xs/sm/md/lg`
- DB: `pnpm --filter @maphari/core exec prisma db push` (no migrations, shadow DB broken)
- Redis: `RedisCache` from `@maphari/platform`; `REDIS_URL` env var
- TypeScript gate: `pnpm --filter @maphari/web exec tsc --noEmit` — must always be zero errors

**Tech Stack:** TypeScript everywhere, Prisma ORM, NATS pub/sub, Fastify (core), NestJS (gateway), Next.js 16 App Router, CSS Modules

---

## File Structure — Everything Created or Modified

### TIER 1 — AUTH SECURITY
- `apps/web/src/lib/auth/session.ts` — remove dev mock block (lines 94–117)
- `services/auth/src/lib/rate-limit.ts` — **CREATE** Redis rate-limit helpers
- `services/auth/src/routes/auth.ts` — swap Map-based rate limits with Redis; add idle timeout; add revoke-all-sessions endpoint
- `services/auth/prisma/schema.prisma` — add `lastUsedAt` to `RefreshToken`
- `apps/gateway/src/routes/auth.controller.ts` — add `POST auth/revoke-all-sessions`
- `apps/web/src/lib/api/gateway.ts` — add `revokeAllSessions()` helper
- `apps/web/src/components/client/maphari-dashboard/pages/settings-page.tsx` — add "Sign out all devices" button

### TIER 2 — QUICK WINS
- `apps/web/src/components/admin/dashboard/topbar.tsx` — add `<ThemeToggle />`
- `apps/web/src/components/staff/staff-dashboard/topbar.tsx` — add `<ThemeToggle />`
- `services/notifications/src/routes/notifications.ts` — add `PATCH /notifications/mark-all-read`
- `apps/gateway/src/routes/notifications.controller.ts` — proxy for mark-all-read
- `apps/web/src/lib/api/portal/notifications.ts` — add `markAllPortalNotificationsReadWithRefresh`
- `apps/web/src/lib/api/admin/notifications.ts` — add `markAllAdminNotificationsReadWithRefresh`
- `apps/web/src/lib/utils/search-history.ts` — **CREATE** localStorage-based search history
- `apps/web/src/components/client/maphari-dashboard/hooks/use-command-search.ts` — wire search history
- `apps/web/src/app/style/print.css` — **CREATE** `@media print` stylesheet
- `apps/web/src/app/layout.tsx` — import print.css

### TIER 3 — PLATFORM ENHANCEMENTS
- `apps/web/src/components/shared/hooks/use-keyboard-shortcuts.ts` — **CREATE** global keyboard shortcut hook
- `apps/web/src/components/shared/ui/keyboard-shortcuts-modal.tsx` — **CREATE** help overlay
- `services/core/src/routes/notification-prefs.ts` — **CREATE** GET/PATCH notification prefs route
- `apps/gateway/src/routes/notification-prefs.controller.ts` — **CREATE** proxy
- `apps/web/src/lib/api/portal/notification-prefs.ts` — extend with pref helpers
- `apps/web/src/components/client/maphari-dashboard/pages/settings-page.tsx` — add Notifications section
- `services/auth/src/routes/auth.ts` — extend staff 2FA routes if missing
- `apps/web/src/components/auth/login-screen.tsx` — extend TOTP step for STAFF role
- `services/core/src/routes/clients.ts` — add `POST /admin/clients/broadcast`
- `apps/gateway/src/routes/clients.controller.ts` — proxy broadcast
- `apps/web/src/lib/api/admin/clients.ts` — add `broadcastToClientsWithRefresh`
- `apps/web/src/components/admin/dashboard/pages/clients-page.tsx` — add broadcast modal UI

### TIER 4 — NEW FEATURES
- `apps/gateway/src/routes/ai.controller.ts` — add context-assembled AI types
- `apps/web/src/lib/api/portal/ai.ts` — extend `AiGenerateInput.type` union
- `apps/web/src/components/client/maphari-dashboard/pages/ai-insights-page.tsx` — wire Generate buttons
- `services/core/prisma/schema.prisma` — add `ProjectTemplate` model
- `services/core/src/routes/project-templates.ts` — **CREATE** template CRUD + apply
- `apps/gateway/src/routes/project-templates.controller.ts` — **CREATE** proxy
- `apps/web/src/lib/api/admin/project-templates.ts` — **CREATE** API client
- `apps/web/src/components/admin/dashboard/pages/project-templates-page.tsx` — **CREATE** page
- `services/core/src/routes/calendar.ts` — add leave events to unified calendar
- `apps/web/src/components/admin/dashboard/pages/staff-scheduling-page.tsx` — **CREATE** timeline page
- `apps/web/src/components/staff/staff-dashboard/pages/my-capacity-page.tsx` — add approved leave display
- `services/core/src/routes/` — add `POST /portal/invoices/:id/payment-link` if missing
- `apps/web/src/components/client/maphari-dashboard/pages/invoices-page.tsx` — wire Pay Now button
- `apps/web/src/components/admin/dashboard/pages/proposals-page.tsx` — enhance with interactive builder
- `services/automation/src/jobs/weekly-digest.job.ts` — **CREATE** Monday 08:00 SAST cron job
- `apps/web/src/lib/api/portal/notification-prefs.ts` — add digest prefs helpers
- `apps/web/src/components/client/maphari-dashboard/pages/settings-page.tsx` — AI weekly digest toggle
- `apps/web/src/components/admin/dashboard/pages/webhooks-page.tsx` — **CREATE** (backend exists)
- `apps/web/src/lib/api/admin/webhooks.ts` — ensure full CRUD + test-delivery client
- `apps/web/src/app/status/page.tsx` — **CREATE** public status page (no auth)
- `services/core/src/routes/` — add `GET /status/public` (no auth)
- `apps/web/src/components/client/maphari-dashboard/pages/onboarding-page.tsx` — rewrite as multi-step wizard
- `services/core/prisma/schema.prisma` — add `approvalStatus`, `approvedAt`, `approvedBy`, `changeNotes`, `parentFileId` to file model (or equivalent)
- `services/core/src/routes/` — add file approval endpoints
- `apps/web/src/components/client/maphari-dashboard/pages/files-assets-page.tsx` — add approval UI
- `services/core/src/routes/` — add `POST /public/survey/:token` (no auth) + survey token generation
- `apps/web/src/app/survey/[token]/page.tsx` — **CREATE** public survey page
- `services/core/src/routes/` — add `GET /admin/analytics/revenue`, `projects`, `clients`
- `apps/web/src/components/admin/dashboard/pages/analytics-dashboard-page.tsx` — **CREATE** advanced analytics page

---

## TIER 1 — AUTH SECURITY

> Must complete before any client goes live. Zero-downtime changes.

---

### Task 1: Remove dev-mock session bypass

**Files modified:** `apps/web/src/lib/auth/session.ts`

The block starting at the `// ── Dev mock:` comment inside `hydrateSession()` checks `NEXT_PUBLIC_DEV_MOCK_SESSION` and returns a fake session, completely bypassing all auth. This is a critical security hole in any environment where the env var is accidentally set.

#### Steps

- [ ] Open `apps/web/src/lib/auth/session.ts`
- [ ] Locate the block beginning at:
  ```
  // ── Dev mock: bypass gateway when NEXT_PUBLIC_DEV_MOCK_SESSION=staff|admin|client ──
  const devMock = ...
  ```
  and ending just before the `try {` that performs the real gateway call.
- [ ] Delete the entire block: the `devMock` constant declaration and the `if (devMock === "staff" || devMock === "admin" || devMock === "client") { ... }` block including the early return inside it. Keep everything before and after.
- [ ] Verify no other reference to `devMock` or `NEXT_PUBLIC_DEV_MOCK_SESSION` remains in the file.
- [ ] Run TypeScript check:
  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```
- [ ] Confirm zero errors.
- [ ] Commit:
  ```
  git commit -m "security: remove dev-mock session bypass from hydrateSession"
  ```

---

### Task 2: Migrate login rate-limiting to Redis

**Files created:** `services/auth/src/lib/rate-limit.ts`
**Files modified:** `services/auth/src/routes/auth.ts`, `services/auth/src/config.ts` (or wherever `AuthConfig` lives)

The in-memory `loginAttempts` Map (line 150) and `totpAttempts` Map (line 123) in `auth.ts` are reset on every process restart and are not shared across multiple auth service instances. Replace both with Redis-backed counters using `INCR` + `EXPIRE`.

#### Steps

- [ ] Create `services/auth/src/lib/rate-limit.ts` with the following exact implementation:

```typescript
import type { RedisCache } from "@maphari/platform";

const LOGIN_MAX = 5;
const LOGIN_WINDOW_S = 60 * 15; // 15 minutes
const TOTP_MAX = 5;
const TOTP_WINDOW_S = 60 * 5; // 5 minutes

function loginKey(email: string, ip: string): string {
  return `rl:login:${email}:${ip}`;
}

function totpKey(userId: string): string {
  return `rl:totp:${userId}`;
}

export async function checkLoginRateLimit(
  redis: RedisCache,
  email: string,
  ip: string
): Promise<{ blocked: boolean; remainingMs: number }> {
  const key = loginKey(email, ip);
  const raw = await redis.get<{ count: number; resetAt: number }>(key);
  if (!raw) return { blocked: false, remainingMs: 0 };
  if (raw.count >= LOGIN_MAX) {
    return { blocked: true, remainingMs: Math.max(0, raw.resetAt - Date.now()) };
  }
  return { blocked: false, remainingMs: 0 };
}

export async function recordLoginFailure(
  redis: RedisCache,
  email: string,
  ip: string
): Promise<void> {
  const key = loginKey(email, ip);
  const raw = await redis.get<{ count: number; resetAt: number }>(key);
  const now = Date.now();
  if (!raw || raw.resetAt < now) {
    await redis.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_S * 1000 }, LOGIN_WINDOW_S);
  } else {
    await redis.set(key, { count: raw.count + 1, resetAt: raw.resetAt }, LOGIN_WINDOW_S);
  }
}

export async function clearLoginRateLimit(
  redis: RedisCache,
  email: string,
  ip: string
): Promise<void> {
  await redis.del(loginKey(email, ip));
}

export async function checkTotpRateLimit(
  redis: RedisCache,
  userId: string
): Promise<{ blocked: boolean; remainingMs: number }> {
  const key = totpKey(userId);
  const raw = await redis.get<{ count: number; resetAt: number }>(key);
  if (!raw) return { blocked: false, remainingMs: 0 };
  if (raw.count >= TOTP_MAX) {
    return { blocked: true, remainingMs: Math.max(0, raw.resetAt - Date.now()) };
  }
  return { blocked: false, remainingMs: 0 };
}

export async function recordTotpFailure(
  redis: RedisCache,
  userId: string
): Promise<void> {
  const key = totpKey(userId);
  const raw = await redis.get<{ count: number; resetAt: number }>(key);
  const now = Date.now();
  if (!raw || raw.resetAt < now) {
    await redis.set(key, { count: 1, resetAt: now + TOTP_WINDOW_S * 1000 }, TOTP_WINDOW_S);
  } else {
    await redis.set(key, { count: raw.count + 1, resetAt: raw.resetAt }, TOTP_WINDOW_S);
  }
}

export async function clearTotpRateLimit(
  redis: RedisCache,
  userId: string
): Promise<void> {
  await redis.del(totpKey(userId));
}
```

- [ ] In `services/auth/src/routes/auth.ts`:
  - Remove the `loginAttempts` Map declaration and its helper functions (`isLoginBlocked`, `recordLoginFailure`, `clearLogin`).
  - Remove the `totpAttempts` Map declaration and its helper functions.
  - Import the six new functions from `../lib/rate-limit`.
  - Obtain a `RedisCache` instance from the auth app's DI or from `AuthConfig.redis` (pass it into the route registration function the same way `prisma` is passed).
  - Replace every call site: `isLoginBlocked(email, ip)` → `checkLoginRateLimit(redis, email, ip)`, etc.
- [ ] Add `REDIS_URL` to `AuthConfig` with default `"redis://localhost:6379"` and construct the `RedisCache` during app bootstrap.
- [ ] Run:
  ```bash
  cd services/auth && pnpm exec tsc --noEmit
  ```
- [ ] Confirm zero errors, then commit:
  ```
  git commit -m "security: migrate login+totp rate-limiting from in-memory Map to Redis"
  ```

---

### Task 3: Backend session inactivity enforcement

**Files modified:**
- `services/auth/prisma/schema.prisma`
- `services/auth/src/routes/auth.ts`
- `services/auth/src/config.ts`

After a configurable idle period (default 2 hours) with no refresh activity, a refresh token should be considered stale and revoked, even if it hasn't technically expired.

#### Steps

- [ ] Open `services/auth/prisma/schema.prisma` and find the `RefreshToken` model:
  ```prisma
  model RefreshToken {
    id         String    @id @default(uuid())
    tokenHash  String    @unique
    userId     String
    expiresAt  DateTime
    revokedAt  DateTime?
    createdAt  DateTime  @default(now())
    updatedAt  DateTime  @updatedAt
    user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
    @@index([userId])
    @@index([expiresAt])
  }
  ```
  Add `lastUsedAt` field:
  ```prisma
  lastUsedAt DateTime @default(now())
  ```
- [ ] Run `pnpm --filter @maphari/core exec prisma db push` — wait, note this is the **auth** service's own prisma, not core. Run:
  ```bash
  cd services/auth && pnpm exec prisma db push
  ```
- [ ] In `services/auth/src/routes/auth.ts`, locate the `POST /auth/refresh` handler. After the token is validated and the DB record is fetched, add the idle-timeout check **before** issuing a new access token:
  ```typescript
  const IDLE_TIMEOUT_MS = (config.idleTimeoutHours ?? 2) * 60 * 60 * 1000;
  if (Date.now() - tokenRecord.lastUsedAt.getTime() > IDLE_TIMEOUT_MS) {
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: new Date() },
    });
    return reply.code(401).send({ code: "SESSION_IDLE_TIMEOUT" });
  }
  // Update lastUsedAt on every successful use
  await prisma.refreshToken.update({
    where: { id: tokenRecord.id },
    data: { lastUsedAt: new Date() },
  });
  ```
- [ ] Add `idleTimeoutHours: number` to `AuthConfig` with env var `REFRESH_IDLE_TIMEOUT_HOURS`, default `2`.
- [ ] The frontend's existing logout-on-401 flow already handles `SESSION_IDLE_TIMEOUT` — when refresh fails with a 401, the app redirects to login. No frontend changes required.
- [ ] Run `cd services/auth && pnpm exec tsc --noEmit` — confirm zero errors.
- [ ] Commit:
  ```
  git commit -m "security: enforce session idle timeout on refresh token usage"
  ```

---

### Task 4: "Sign out all devices" endpoint

**Files modified:**
- `services/auth/src/routes/auth.ts`
- `apps/gateway/src/routes/auth.controller.ts`
- `apps/web/src/lib/api/gateway.ts`
- `apps/web/src/components/client/maphari-dashboard/pages/settings-page.tsx`

#### Steps

- [ ] In `services/auth/src/routes/auth.ts`, add a new authenticated route `POST /auth/revoke-all-sessions`. The gateway will forward the userId from the decoded JWT. Implementation:
  ```typescript
  fastify.post(
    "/auth/revoke-all-sessions",
    { preHandler: [requireAuth] }, // existing middleware that decodes JWT + attaches req.user
    async (req, reply) => {
      const userId = req.user.id;
      const now = new Date();
      await prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now },
      });
      return { success: true };
    }
  );
  ```
- [ ] In `apps/gateway/src/routes/auth.controller.ts`, add:
  ```typescript
  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("auth/revoke-all-sessions")
  async revokeAllSessions(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.gatewayService.proxyToAuth(req, res, "POST", "/auth/revoke-all-sessions");
  }
  ```
  The gateway's proxy automatically forwards the `Authorization` header so the auth service can decode userId from the JWT.
- [ ] In `apps/web/src/lib/api/gateway.ts`, add:
  ```typescript
  export async function revokeAllSessions(
    session: AuthSession
  ): Promise<AuthorizedResult<{ success: boolean }>> {
    return callGateway<{ success: boolean }>(session, "POST", "/auth/revoke-all-sessions");
  }
  ```
- [ ] In `apps/web/src/components/client/maphari-dashboard/pages/settings-page.tsx`, locate the "Security" section. Add a "Sign out all other devices" button. On click:
  1. Call `revokeAllSessions(session)` (use `withAuthorizedSession` wrapper).
  2. Save `result.nextSession` with `saveSession`.
  3. Call `clearSession()` and redirect to `/login`.
  4. Show a loading spinner while the request is in flight.
- [ ] Run `pnpm --filter @maphari/web exec tsc --noEmit` — confirm zero errors.
- [ ] Commit:
  ```
  git commit -m "security: add revoke-all-sessions endpoint + client settings UI"
  ```

---

## TIER 2 — QUICK WINS

> Small scope, large user impact. Each should take under a day.

---

### Task 5: Dark mode toggle in admin + staff topbars

**Files modified:**
- `apps/web/src/components/admin/dashboard/topbar.tsx`
- `apps/web/src/components/staff/staff-dashboard/topbar.tsx`

The `ThemeToggle` component at `apps/web/src/components/shared/ui/theme-toggle.tsx` is already implemented with `useTheme` hook and `localStorage` persistence. The client topbar uses it. Admin and staff topbars do not.

#### Steps

- [ ] Open `apps/web/src/components/admin/dashboard/topbar.tsx`.
- [ ] Add the import at the top:
  ```typescript
  import { ThemeToggle } from "@/components/shared/ui/theme-toggle";
  ```
- [ ] In the JSX, locate the right-side actions area (near the apps/help icon buttons). Insert `<ThemeToggle />` immediately before the apps button or at the end of the actions row. Do not use inline styles — use the existing `cx()` pattern and existing CSS classes.
- [ ] Open `apps/web/src/components/staff/staff-dashboard/topbar.tsx` and apply the identical import + JSX change.
- [ ] Run `pnpm --filter @maphari/web exec tsc --noEmit` — confirm zero errors.
- [ ] Visually verify in browser: admin topbar and staff topbar both show the theme toggle. Toggling switches `data-theme` on `<html>`.
- [ ] Commit:
  ```
  git commit -m "feat(ui): add dark mode toggle to admin and staff topbars"
  ```

---

### Task 6: "Mark all as read" for notifications (all 3 portals)

**Files modified:**
- `services/notifications/src/routes/notifications.ts`
- `apps/gateway/src/routes/notifications.controller.ts`
- `apps/web/src/lib/api/portal/notifications.ts`
- `apps/web/src/lib/api/admin/notifications.ts`
- Topbar or notification page components for all three portals

#### Steps

**Backend:**
- [ ] In `services/notifications/src/routes/notifications.ts`, add:
  ```typescript
  fastify.patch(
    "/notifications/mark-all-read",
    { preHandler: [requireAuth] },
    async (req, reply) => {
      const { userId, role, clientId } = req.user;
      const where: Prisma.NotificationJobWhereInput = { readAt: null };
      if (role === "CLIENT" && clientId) {
        where.clientId = clientId;
      }
      await prisma.notificationJob.updateMany({
        where,
        data: { readAt: new Date() },
      });
      return { success: true };
    }
  );
  ```
- [ ] In `apps/gateway/src/routes/notifications.controller.ts`, add:
  ```typescript
  @Roles("ADMIN", "STAFF", "CLIENT")
  @Patch("notifications/mark-all-read")
  async markAllRead(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.gatewayService.proxyToNotifications(req, res, "PATCH", "/notifications/mark-all-read");
  }
  ```

**API clients:**
- [ ] In `apps/web/src/lib/api/portal/notifications.ts`, add:
  ```typescript
  export async function markAllPortalNotificationsReadWithRefresh(
    session: AuthSession
  ): Promise<AuthorizedResult<{ success: boolean }>> {
    return withAuthorizedSession(session, (s) =>
      callGateway<{ success: boolean }>(s, "PATCH", "/notifications/mark-all-read")
    );
  }
  ```
- [ ] In `apps/web/src/lib/api/admin/notifications.ts`, add the equivalent `markAllAdminNotificationsReadWithRefresh` function using the same pattern.
- [ ] Staff portal uses the same gateway endpoint with STAFF role — wire the same admin function or create a staff-specific one if the staff notifications client is separate.

**UI:**
- [ ] Find the notifications bell dropdown or notifications page in each portal's topbar. Add a "Mark all read" button that:
  1. Calls the appropriate `markAll*WithRefresh` function.
  2. Saves `result.nextSession`.
  3. Triggers a local state update to show all items as read (optimistic UI: set a `allRead` flag and grey-out the unread count badge).
- [ ] Run `pnpm --filter @maphari/web exec tsc --noEmit` — confirm zero errors.
- [ ] Commit:
  ```
  git commit -m "feat(notifications): add mark-all-read endpoint + UI for all three portals"
  ```

---

### Task 7: Command palette search history (last 5)

**Files created:** `apps/web/src/lib/utils/search-history.ts`
**Files modified:** `apps/web/src/components/client/maphari-dashboard/hooks/use-command-search.ts` (and equivalent in admin/staff)

Pure client-side feature — no API calls, no backend changes.

#### Steps

- [ ] Create `apps/web/src/lib/utils/search-history.ts`:
  ```typescript
  const KEY = "maphari:search-history";
  const MAX = 5;

  export function getSearchHistory(): string[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  }

  export function addToSearchHistory(query: string): void {
    if (typeof window === "undefined") return;
    const trimmed = query.trim();
    if (!trimmed) return;
    const existing = getSearchHistory().filter((q) => q !== trimmed);
    const next = [trimmed, ...existing].slice(0, MAX);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // localStorage may be unavailable
    }
  }

  export function clearSearchHistory(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(KEY);
    } catch {
      // ignore
    }
  }
  ```
- [ ] In `apps/web/src/components/client/maphari-dashboard/hooks/use-command-search.ts`:
  - Import `getSearchHistory`, `addToSearchHistory` from `@/lib/utils/search-history`.
  - Add a `history` state: `const [history, setHistory] = useState<string[]>(() => getSearchHistory())`.
  - After a user selects a result, call `addToSearchHistory(query)` and `setHistory(getSearchHistory())`.
  - When the search query is empty, expose `history` items as a separate list (returned from the hook) so the UI can render them as "Recent searches" chips above the main list.
- [ ] Apply the same pattern to the admin and staff command palette hooks (find those files by searching for the `⌘K` or command palette component in each portal).
- [ ] In the command palette UI component, when `query === ""` and `history.length > 0`, render a "Recent searches" section with chips. Clicking a chip sets the query to that value. Add a "Clear" link to call `clearSearchHistory()` and reset state.
- [ ] Run `pnpm --filter @maphari/web exec tsc --noEmit` — confirm zero errors.
- [ ] Commit:
  ```
  git commit -m "feat(search): add localStorage-backed search history to command palette"
  ```

---

### Task 8: Print CSS for invoices and reports

**Files created:** `apps/web/src/app/style/print.css`
**Files modified:** `apps/web/src/app/layout.tsx`

`window.print()` exists on several pages but the output is the raw dashboard layout. A dedicated print stylesheet hides chrome and formats content for paper.

#### Steps

- [ ] Create `apps/web/src/app/style/print.css`:
  ```css
  @media print {
    /* Hide dashboard chrome */
    [class*="sidebar"],
    [class*="topbar"],
    [class*="actionBtn"],
    [class*="navBtn"],
    [class*="printHide"],
    [class*="modalBackdrop"],
    button {
      display: none !important;
    }

    /* Reset layout to single column */
    body,
    [class*="dashRoot"],
    [class*="mainContent"],
    [class*="pageRoot"] {
      display: block !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
      color: black !important;
    }

    /* Cards full width, clean borders */
    [class*="card"],
    [class*="invoiceCard"],
    [class*="reportSection"],
    [class*="section"] {
      display: block !important;
      width: 100% !important;
      max-width: 100% !important;
      box-shadow: none !important;
      border: 1px solid #ddd !important;
      background: white !important;
      color: black !important;
      page-break-inside: avoid;
      margin-bottom: 16px !important;
    }

    /* Page breaks before major sections */
    [class*="pageBreakBefore"] {
      page-break-before: always;
    }

    /* Branding header */
    [class*="printHeader"] {
      display: block !important;
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    /* Footer with date */
    [class*="printFooter"] {
      display: block !important;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      font-size: 11px;
      color: #666;
      border-top: 1px solid #ddd;
      padding: 4px 0;
    }

    /* Typography */
    * {
      font-family: serif !important;
      font-size: 12pt !important;
    }

    h1 { font-size: 18pt !important; }
    h2 { font-size: 14pt !important; }
    h3 { font-size: 12pt !important; }

    /* Links: show URLs */
    a[href]::after {
      content: " (" attr(href) ")";
      font-size: 10pt;
      color: #666;
    }

    /* Tables */
    table {
      width: 100% !important;
      border-collapse: collapse !important;
    }
    th, td {
      border: 1px solid #ccc !important;
      padding: 6px 8px !important;
      text-align: left !important;
    }
  }
  ```
- [ ] In `apps/web/src/app/layout.tsx`, import the stylesheet:
  ```typescript
  import "./style/print.css";
  ```
  Place this import after the existing global CSS imports.
- [ ] On invoice and report pages, add a hidden `<div className={cx("printHeader")}>Maphari Technologies</div>` and `<div className={cx("printFooter")}>Printed: {new Date().toLocaleDateString()}</div>`. Use `cx()` helper — add corresponding no-op display rules to the page's CSS module so the classes exist.
- [ ] Run `pnpm --filter @maphari/web exec tsc --noEmit` — confirm zero errors.
- [ ] Commit:
  ```
  git commit -m "feat(print): add @media print stylesheet for invoices and reports"
  ```

---

## TIER 3 — PLATFORM ENHANCEMENTS

> Larger scope but well-defined. Plan for 1–2 days each.

---

### Task 9: Keyboard shortcuts (global navigation)

**Files created:**
- `apps/web/src/components/shared/hooks/use-keyboard-shortcuts.ts`
- `apps/web/src/components/shared/ui/keyboard-shortcuts-modal.tsx`

**Files modified:** Dashboard root components for each portal

#### Steps

- [ ] Create `apps/web/src/components/shared/hooks/use-keyboard-shortcuts.ts`:
  ```typescript
  import { useEffect, useRef, useState, useCallback } from "react";

  export interface ShortcutMap {
    [secondKey: string]: { pageId: string; label: string };
  }

  interface UseKeyboardShortcutsOptions {
    shortcuts: ShortcutMap;
    onNavigate: (pageId: string) => void;
  }

  export function useKeyboardShortcuts({
    shortcuts,
    onNavigate,
  }: UseKeyboardShortcutsOptions): {
    showHelp: boolean;
    setShowHelp: (v: boolean) => void;
  } {
    const [showHelp, setShowHelp] = useState(false);
    const pendingG = useRef(false);
    const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const onNavigateRef = useRef(onNavigate);
    onNavigateRef.current = onNavigate;

    const handler = useCallback((e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Ignore events from inputs, textareas, selects, contenteditable
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      if (key === "?") {
        setShowHelp((prev) => !prev);
        return;
      }

      if (key === "escape") {
        setShowHelp(false);
        pendingG.current = false;
        if (resetTimer.current) clearTimeout(resetTimer.current);
        return;
      }

      if (pendingG.current) {
        pendingG.current = false;
        if (resetTimer.current) clearTimeout(resetTimer.current);
        const match = shortcuts[key];
        if (match) {
          onNavigateRef.current(match.pageId);
        }
        return;
      }

      if (key === "g") {
        pendingG.current = true;
        resetTimer.current = setTimeout(() => {
          pendingG.current = false;
        }, 1500);
      }
    }, [shortcuts]);

    useEffect(() => {
      document.addEventListener("keydown", handler);
      return () => {
        document.removeEventListener("keydown", handler);
        if (resetTimer.current) clearTimeout(resetTimer.current);
      };
    }, [handler]);

    return { showHelp, setShowHelp };
  }
  ```

- [ ] Create `apps/web/src/components/shared/ui/keyboard-shortcuts-modal.tsx`:
  ```typescript
  import type { ShortcutMap } from "@/components/shared/hooks/use-keyboard-shortcuts";

  interface Props {
    shortcuts: ShortcutMap;
    onClose: () => void;
  }

  export function KeyboardShortcutsModal({ shortcuts, onClose }: Props) {
    // Render a clean 2-column grid listing all shortcuts
    // Use CSS module classes from whichever shared stylesheet governs modals
    // Do NOT use inline styles
    const entries = Object.entries(shortcuts);
    return (
      // modal structure using existing shared CSS classes
      // caller wraps in a backdrop div if needed
      <div role="dialog" aria-modal aria-label="Keyboard shortcuts">
        <h2>Keyboard Shortcuts</h2>
        <div>
          <div>
            <kbd>g</kbd> then <kbd>h</kbd> — Home
          </div>
          {entries.map(([key, { label }]) => (
            <div key={key}>
              <kbd>g</kbd> then <kbd>{key}</kbd> — {label}
            </div>
          ))}
          <div>
            <kbd>?</kbd> — Toggle this help
          </div>
        </div>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
    );
  }
  ```
  Style it using the portal's existing modal/overlay CSS classes — no inline styles.

- [ ] Wire `useKeyboardShortcuts` into each dashboard root component with portal-specific `shortcuts` maps:
  ```typescript
  // Client portal example shortcut map
  const CLIENT_SHORTCUTS: ShortcutMap = {
    h: { pageId: "home", label: "Home" },
    p: { pageId: "myProjects", label: "Projects" },
    i: { pageId: "invoices", label: "Invoices" },
    m: { pageId: "messages", label: "Messages" },
    n: { pageId: "notifications", label: "Notifications" },
  };
  ```
  Admin uses `pageId` values matching its navigation enum. Staff likewise.
- [ ] When `showHelp` is true, render `<KeyboardShortcutsModal>` (conditionally rendered, not hidden with CSS).
- [ ] Run `pnpm --filter @maphari/web exec tsc --noEmit` — confirm zero errors.
- [ ] Commit:
  ```
  git commit -m "feat(ux): add global keyboard shortcuts with g+letter navigation and ? help modal"
  ```

---

### Task 10: Notification preferences (per-channel, per-event)

**Files created:**
- `services/core/src/routes/notification-prefs.ts`
- `apps/gateway/src/routes/notification-prefs.controller.ts`

**Files modified:**
- `apps/web/src/lib/api/portal/notification-prefs.ts`
- `apps/web/src/components/client/maphari-dashboard/pages/settings-page.tsx`

The `UserPreference` model (`key`, `value`, `userId`) is already in the DB. This task adds a structured API over it for notification channel/event preferences.

#### Steps

- [ ] Create `services/core/src/routes/notification-prefs.ts`:

  **Pref keys** (string constants — put at top of file):
  ```typescript
  export const NOTIF_PREF_KEYS = [
    "notif_email_invoice",
    "notif_email_milestone",
    "notif_email_message",
    "notif_email_announcement",
    "notif_inapp_invoice",
    "notif_inapp_milestone",
    "notif_inapp_message",
    "notif_inapp_announcement",
  ] as const;

  export type NotifPrefKey = typeof NOTIF_PREF_KEYS[number];
  ```

  **GET `/notification-prefs`** (authenticated):
  - Query `UserPreference` for all rows where `userId = req.user.id` and `key IN NOTIF_PREF_KEYS`.
  - For keys not found in DB, default to `"true"`.
  - Return `Record<NotifPrefKey, boolean>`.

  **PATCH `/notification-prefs`** (authenticated):
  - Body: `{ key: NotifPrefKey; value: boolean }`.
  - Upsert: `prisma.userPreference.upsert({ where: { userId_key: { userId, key } }, update: { value }, create: { userId, key, value: String(value) } })`.
  - Return `{ success: true }`.

- [ ] Create `apps/gateway/src/routes/notification-prefs.controller.ts`:
  ```typescript
  @Roles("CLIENT", "STAFF", "ADMIN")
  @Get("notification-prefs")
  async getNotifPrefs(@Req() req, @Res() res): Promise<void> { ... }

  @Roles("CLIENT", "STAFF", "ADMIN")
  @Patch("notification-prefs")
  async updateNotifPref(@Req() req, @Res() res): Promise<void> { ... }
  ```

- [ ] In `apps/web/src/lib/api/portal/notification-prefs.ts`, add:
  ```typescript
  export type NotifPrefKey =
    | "notif_email_invoice"
    | "notif_email_milestone"
    | "notif_email_message"
    | "notif_email_announcement"
    | "notif_inapp_invoice"
    | "notif_inapp_milestone"
    | "notif_inapp_message"
    | "notif_inapp_announcement";

  export async function loadPortalNotifPrefsWithRefresh(
    session: AuthSession
  ): Promise<AuthorizedResult<Record<NotifPrefKey, boolean>>> { ... }

  export async function updatePortalNotifPrefWithRefresh(
    session: AuthSession,
    key: NotifPrefKey,
    value: boolean
  ): Promise<AuthorizedResult<{ success: boolean }>> { ... }
  ```

- [ ] In `apps/web/src/components/client/maphari-dashboard/pages/settings-page.tsx`, add a "Notifications" section below the existing sections with a 2-column table of toggle rows:
  - Rows: Invoice updates, Milestone reached, New message, Announcements
  - Columns: Email, In-App
  - Each cell is a toggle switch (reuse existing toggle pattern — no new component needed)
  - On mount, call `loadPortalNotifPrefsWithRefresh`; on toggle, call `updatePortalNotifPrefWithRefresh`

- [ ] Run `pnpm --filter @maphari/web exec tsc --noEmit` — confirm zero errors.
- [ ] Commit:
  ```
  git commit -m "feat(settings): add per-channel per-event notification preferences"
  ```

---

### Task 11: Two-factor auth for staff portal

**Files modified:**
- `services/auth/src/routes/auth.ts`
- `apps/web/src/components/auth/login-screen.tsx`
- Staff settings page (find the security section)

2FA (TOTP) already works for admin. Extend the same pattern to staff.

#### Steps

- [ ] Search `services/auth/src/routes/auth.ts` for admin 2FA routes (likely `POST /auth/admin/2fa/enable`, `POST /auth/admin/2fa/verify`). Check if equivalent `POST /auth/staff/2fa/*` routes exist.
- [ ] If staff 2FA routes are missing, add them by duplicating the admin routes with namespace `staff`:
  ```
  POST /auth/staff/2fa/setup    — generate TOTP secret, return QR URI
  POST /auth/staff/2fa/enable   — verify first TOTP code, persist secret to User record
  POST /auth/staff/2fa/disable  — verify TOTP, clear secret
  POST /auth/staff/2fa/verify   — verify TOTP during login (called after password OK)
  ```
  The `User` model should already have `totpSecret String?` — verify in auth prisma schema.
- [ ] The `POST /auth/staff/login` endpoint: after successful password validation, check if the staff user has `totpSecret` set. If yes, return `{ requiresTwoFactor: true, tempToken: <short-lived JWT> }` instead of the full session — same pattern as admin login.
- [ ] In `apps/web/src/components/auth/login-screen.tsx`, the `mode="internal"` path handles admin 2FA via a `totpStep` state. Extend the step branching to include STAFF role: when login response has `requiresTwoFactor: true` and `role === "STAFF"`, enter the TOTP challenge UI (which is already built for admin — reuse the same JSX step).
- [ ] In the staff settings page security section, add a 2FA card:
  - If 2FA not enabled: show a "Enable 2FA" button that opens a modal with QR code (call setup endpoint) and a verification input.
  - If 2FA enabled: show status + "Disable 2FA" button.
  - Recovery codes: generate 8 single-use codes on enable, show in modal, download as `.txt`.
- [ ] Run `pnpm --filter @maphari/web exec tsc --noEmit` — confirm zero errors.
- [ ] Commit:
  ```
  git commit -m "feat(auth): extend TOTP two-factor authentication to staff portal"
  ```

---

### Task 12: Bulk email broadcast to clients (admin)

**Files modified:**
- `services/core/src/routes/clients.ts`
- `apps/gateway/src/routes/clients.controller.ts`
- `apps/web/src/lib/api/admin/clients.ts`
- `apps/web/src/components/admin/dashboard/pages/clients-page.tsx`

#### Steps

- [ ] In `services/core/src/routes/clients.ts`, add:
  ```typescript
  fastify.post(
    "/admin/clients/broadcast",
    { preHandler: [requireAdmin] },
    async (req, reply) => {
      const { clientIds, subject, body } = req.body as {
        clientIds: string[];
        subject: string;
        body: string;
      };
      // For each clientId, publish a notification event that notifications service delivers as EMAIL
      const results = await Promise.allSettled(
        clientIds.map((clientId) =>
          nats.publish("notification.created", {
            type: "EMAIL",
            clientId,
            subject,
            body,
            tab: "announcements",
          })
        )
      );
      const sent = results.filter((r) => r.status === "fulfilled").length;
      return { sent, total: clientIds.length };
    }
  );
  ```
- [ ] In `apps/gateway/src/routes/clients.controller.ts`, add:
  ```typescript
  @Roles("ADMIN")
  @Post("admin/clients/broadcast")
  async broadcastToClients(@Req() req, @Res() res): Promise<void> { ... }
  ```
- [ ] In `apps/web/src/lib/api/admin/clients.ts`, add:
  ```typescript
  export async function broadcastToClientsWithRefresh(
    session: AuthSession,
    clientIds: string[],
    subject: string,
    body: string
  ): Promise<AuthorizedResult<{ sent: number; total: number }>> {
    return withAuthorizedSession(session, (s) =>
      callGateway(s, "POST", "/admin/clients/broadcast", { clientIds, subject, body })
    );
  }
  ```
- [ ] In `apps/web/src/components/admin/dashboard/pages/clients-page.tsx`:
  - Add a checkbox column to the clients table (reuse the existing selection pattern from other admin tables).
  - Show a "Broadcast" toolbar button when `selectedClientIds.length > 0`.
  - Clicking "Broadcast" opens a modal with:
    - Subject text input (required)
    - Body textarea (required, min 10 chars)
    - Preview section showing subject + formatted body
    - "Send to {N} clients" confirm button (disabled while loading)
  - On success, show a toast: `Sent to {sent} of {total} clients.`
  - Close modal and clear selection on success.
- [ ] Run `pnpm --filter @maphari/web exec tsc --noEmit` — confirm zero errors.
- [ ] Commit:
  ```
  git commit -m "feat(admin): add bulk email broadcast to selected clients"
  ```

---

## TIER 4 — NEW FEATURES

> Larger multi-day features. Each is fully spec'd.

---

### Task 13: AI Project Briefing (wire up existing page)

**Files modified:**
- `apps/gateway/src/routes/ai.controller.ts`
- `apps/web/src/lib/api/portal/ai.ts`
- `apps/web/src/components/client/maphari-dashboard/pages/ai-insights-page.tsx`

The page exists with 4 cards and refresh buttons. The AI service at port 4011 handles generation. The gateway currently just forwards requests. This task assembles richer context payloads server-side and wires the frontend Generate buttons.

#### Steps

- [ ] In `apps/gateway/src/routes/ai.controller.ts`, extend the portal AI route to handle new `type` values. For each type, fetch existing data from core service and include it as context in the AI payload:

  ```typescript
  // Types and their context assembly:
  // "project-status-summary" → fetch /portal/projects snapshot for clientId
  // "risk-radar"             → fetch /portal/risks + /portal/blockers filtered to clientId
  // "delivery-prediction"    → fetch sprint velocity from /portal/projects sprint data
  // "budget-forecast"        → fetch /portal/invoices totals vs project budget

  // Pattern: intercept the type, fetch context, forward enriched payload to AI service
  ```

  The gateway already has access to authenticated user context (clientId). Use the internal service-to-service fetch pattern that other gateway controllers use (no additional auth needed for internal calls).

- [ ] In `apps/web/src/lib/api/portal/ai.ts`, extend the `AiGenerateInput` type:
  ```typescript
  export type AiInsightType =
    | "general"
    | "project-status-summary"
    | "risk-radar"
    | "delivery-prediction"
    | "budget-forecast";

  export interface AiGenerateInput {
    type: AiInsightType;
    projectId?: string;
    context?: Record<string, unknown>;
  }
  ```

- [ ] In `ai-insights-page.tsx`, wire each of the 4 cards' "Generate" / "Refresh" buttons to the correct type:
  - Card 1 "Project Status Summary" → `type: "project-status-summary"`
  - Card 2 "Risk Radar" → `type: "risk-radar"`
  - Card 3 "Delivery Prediction" → `type: "delivery-prediction"`
  - Card 4 "Budget Forecast" → `type: "budget-forecast"`
  - Each card independently tracks its own `loading` and `content` state.
  - Show a skeleton loader (use existing skeleton pattern) while loading.
  - Render the AI response as formatted text (split on `\n\n` for paragraph breaks). No markdown library — just `<p>` tags.
  - Show "Last generated: {time}" below the content.

- [ ] Run `pnpm --filter @maphari/web exec tsc --noEmit` — confirm zero errors.
- [ ] Commit:
  ```
  git commit -m "feat(ai): wire ai-insights page to context-enriched gateway AI types"
  ```

---

### Task 14: Project templates (admin)

**Files modified:**
- `services/core/prisma/schema.prisma`
- `services/core/src/routes/` (new file `project-templates.ts`)
- `apps/gateway/src/routes/` (new file `project-templates.controller.ts`)
- `apps/web/src/lib/api/admin/` (new file `project-templates.ts`)
- `apps/web/src/components/admin/dashboard/pages/` (new file `project-templates-page.tsx`)

#### Steps

**Schema:**
- [ ] Add to `services/core/prisma/schema.prisma`:
  ```prisma
  model ProjectTemplate {
    id          String   @id @default(uuid())
    name        String
    description String?
    phases      Json     // Array<{ name: string; milestones: Array<{ name: string; days: number }>; tasks: Array<{ name: string }> }>
    createdBy   String?
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt

    @@map("project_templates")
  }
  ```
- [ ] Run `pnpm --filter @maphari/core exec prisma db push`

**Backend:**
- [ ] Create `services/core/src/routes/project-templates.ts` with:

  `GET /admin/project-templates` — list all templates, return `{ id, name, description, phaseCount, taskCount, createdAt }[]`

  `POST /admin/project-templates` — create template. Body: `{ name, description?, phases, sourceProjectId? }`. If `sourceProjectId` provided, auto-extract phases/milestones/tasks from the project's existing data and populate `phases` JSON.

  `DELETE /admin/project-templates/:id` — hard delete.

  `POST /admin/project-templates/:id/apply` — body `{ projectId }`. Iterate the template's `phases` JSON and create `Phase`, `Milestone`, and `Task` records for the target project using existing Prisma models. Return `{ phasesCreated, milestonesCreated, tasksCreated }`.

- [ ] Create `apps/gateway/src/routes/project-templates.controller.ts` with ADMIN-only proxy endpoints for all 4 routes.

**API client:**
- [ ] Create `apps/web/src/lib/api/admin/project-templates.ts`:
  ```typescript
  export interface ProjectTemplateSummary {
    id: string;
    name: string;
    description: string | null;
    phaseCount: number;
    taskCount: number;
    createdAt: string;
  }

  export interface ProjectTemplatePhase {
    name: string;
    milestones: Array<{ name: string; days: number }>;
    tasks: Array<{ name: string }>;
  }

  export async function loadAdminProjectTemplatesWithRefresh(
    session: AuthSession
  ): Promise<AuthorizedResult<ProjectTemplateSummary[]>> { ... }

  export async function createAdminProjectTemplateWithRefresh(
    session: AuthSession,
    payload: { name: string; description?: string; phases: ProjectTemplatePhase[]; sourceProjectId?: string }
  ): Promise<AuthorizedResult<ProjectTemplateSummary>> { ... }

  export async function deleteAdminProjectTemplateWithRefresh(
    session: AuthSession,
    templateId: string
  ): Promise<AuthorizedResult<{ success: boolean }>> { ... }

  export async function applyAdminProjectTemplateWithRefresh(
    session: AuthSession,
    templateId: string,
    projectId: string
  ): Promise<AuthorizedResult<{ phasesCreated: number; milestonesCreated: number; tasksCreated: number }>> { ... }
  ```

**Admin UI:**
- [ ] Create `apps/web/src/components/admin/dashboard/pages/project-templates-page.tsx`:
  - List view: cards per template showing name, description, phase/task counts, created date.
  - "New Template" button → modal with name input, description input, and a phase builder (add phase → add milestones + duration in days → add tasks under each phase).
  - "Save from project" option in the modal: a project selector dropdown; on selection, call the `sourceProjectId` API to auto-populate the phase structure for review before saving.
  - Per-template "Apply" button → project picker modal → calls apply endpoint → success toast with counts.
  - Per-template delete button → confirmation modal.
  - Add this page to the admin sidebar under "Projects" section.

- [ ] Run `pnpm --filter @maphari/web exec tsc --noEmit` — confirm zero errors.
- [ ] Commit:
  ```
  git commit -m "feat(admin): add project templates — create, apply, delete"
  ```

---

### Task 15: Staff scheduling + leave calendar (visual)

**Files modified:**
- `services/core/src/routes/calendar.ts`
- `apps/web/src/components/admin/dashboard/pages/staff-scheduling-page.tsx` (new file)
- `apps/web/src/components/staff/staff-dashboard/pages/my-capacity-page.tsx`

#### Steps

**Backend:**
- [ ] In `services/core/src/routes/calendar.ts`, add staff leave events to the unified `/calendar/events` response. When `role === "ADMIN"` and query includes `type=staff-schedule`, include:
  - All `LeaveRequest` records where `status = "APPROVED"` and the date range overlaps the requested window.
  - Format as calendar events: `{ id, staffId, staffName, type: "LEAVE", startDate, endDate, label: request.leaveType }`.

- [ ] Add `GET /admin/staff-schedule` to `services/core/src/routes/` (extend calendar.ts or add a new route):
  - Accept query params: `weekStart` (ISO date), `weeksAhead` (number, default 8).
  - Return for each staff member:
    ```typescript
    interface StaffScheduleEntry {
      staffId: string;
      staffName: string;
      role: string;
      weeklyCapacity: number; // hours
      weeks: Array<{
        weekStart: string; // ISO
        status: "available" | "partial" | "on-leave";
        leaveReason?: string;
        projectAssignments: Array<{ projectId: string; projectName: string }>;
      }>;
    }
    ```
  - Query `LeaveRequest` for approved leaves, `ProjectTaskCollaborator` for active assignments, and `StaffCapacity` for weekly hours.

**Admin UI:**
- [ ] Create `apps/web/src/components/admin/dashboard/pages/staff-scheduling-page.tsx`:
  - Fetch from `/admin/staff-schedule` on mount.
  - Render a horizontal timeline table:
    - Rows = staff members (sticky left column with avatar + name + role).
    - Columns = weeks (date range header).
    - Each cell: colored chip using design tokens — `--lime` for available, `var(--amber, #f59e0b)` for partial, `var(--red, #ef4444)` for on leave.
    - No external charting library — pure CSS grid table.
  - Clicking a cell opens a side panel (slide-in from right, use existing panel CSS pattern) showing:
    - Week details: project assignments, leave dates.
    - "Assign to Project" dropdown with available projects.
    - Submitting assignment calls the existing project collaborator endpoint.
  - Week navigation: "Previous 4 weeks" / "Next 4 weeks" arrows.
  - Add to admin sidebar under "HR / Staff" section.

**Staff UI:**
- [ ] In `apps/web/src/components/staff/staff-dashboard/pages/my-capacity-page.tsx`, find the calendar events panel. Add an "Approved Leave" section below the current events list showing approved leave periods in a simple list: date range + leave type label.

- [ ] Run `pnpm --filter @maphari/web exec tsc --noEmit` — confirm zero errors.
- [ ] Commit:
  ```
  git commit -m "feat(admin): add staff scheduling timeline + leave visibility in capacity page"
  ```

---

### Task 16: Client payment link (direct invoice payment)

**Files modified:**
- `services/core/src/routes/` — add payment link endpoint if missing
- `apps/web/src/components/client/maphari-dashboard/pages/invoices-page.tsx`

#### Steps

- [ ] Check `services/core/src/routes/` for an existing `POST /portal/invoices/:id/payment-link` endpoint. Search:
  ```bash
  grep -rn "payment-link\|payfast\|PayFast" services/core/src/routes/
  ```
- [ ] If the endpoint does not exist, add it:
  ```typescript
  fastify.post(
    "/portal/invoices/:id/payment-link",
    { preHandler: [requireClient] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const invoice = await prisma.invoice.findFirst({
        where: { id, clientId: req.user.clientId },
      });
      if (!invoice) return reply.code(404).send({ code: "INVOICE_NOT_FOUND" });
      if (invoice.status === "PAID") return reply.code(409).send({ code: "INVOICE_ALREADY_PAID" });

      // Generate signed PayFast URL
      const params = new URLSearchParams({
        merchant_id: config.payfastMerchantId,
        merchant_key: config.payfastMerchantKey,
        amount: (invoice.amountCents / 100).toFixed(2),
        item_name: `Invoice ${invoice.number}`,
        return_url: `${config.clientPortalBaseUrl}/invoices?paid=${id}`,
        cancel_url: `${config.clientPortalBaseUrl}/invoices`,
        notify_url: `${config.gatewayBaseUrl}/api/v1/webhooks/payfast`,
        m_payment_id: invoice.id,
      });
      const paymentUrl = `https://www.payfast.co.za/eng/process?${params.toString()}`;
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 min
      return { paymentUrl, expiresAt };
    }
  );
  ```
  Add `PAYFAST_MERCHANT_ID` and `PAYFAST_MERCHANT_KEY` to `CoreConfig`.

- [ ] Add the gateway proxy in `apps/gateway/src/routes/`.
- [ ] Add `generatePortalPaymentLinkWithRefresh(session, invoiceId)` to `apps/web/src/lib/api/portal/billing-downloads.ts` or the appropriate portal billing API client.
- [ ] In `apps/web/src/components/client/maphari-dashboard/pages/invoices-page.tsx`:
  - Find the "Pay Now" button on unpaid invoices (currently a placeholder).
  - On click: set a per-invoice `generatingLink` state, call `generatePortalPaymentLinkWithRefresh`, then `window.open(result.data.paymentUrl, "_blank")`.
  - Show a spinner inside the button while `generatingLink` is true.
  - Show an inline error message if the API returns `INVOICE_ALREADY_PAID` or a network error.

- [ ] Run `pnpm --filter @maphari/web exec tsc --noEmit` — confirm zero errors.
- [ ] Commit:
  ```
  git commit -m "feat(billing): wire client invoice Pay Now to PayFast payment link generation"
  ```

---

### Task 17: Admin proposal builder

**Files modified:**
- `apps/web/src/components/admin/dashboard/pages/proposals-page.tsx` (or find correct file)
- `apps/web/src/lib/api/admin/` — proposals API client (extend if exists)
- Gateway + core routes — extend `POST /admin/proposals` if not already handling line items

The `Proposal` and `ProposalItem` models already exist. This task adds a drag-to-reorder interactive builder with AI pre-fill and client-facing send.

#### Steps

- [ ] Find the correct proposals admin page file:
  ```bash
  ls apps/web/src/components/admin/dashboard/pages/ | grep -i proposal
  ```
- [ ] Audit the existing proposals page. It may already list proposals. Enhance it with a "New Proposal" flow:

  **"New Proposal" modal / page:**
  - Client selector (dropdown, pulls from `loadAdminClientsWithRefresh`)
  - Title input
  - Summary textarea
  - Valid-until date picker (use `<input type="date">` — no date library)
  - Line items section:
    - Each line item: description text input, amount number input (in ZAR cents displayed as currency), icon name input (Lucide icon name string — rendered via a dynamic lookup)
    - "Add line item" button appends a row
    - Drag to reorder: use `draggable` HTML attribute + `onDragStart` / `onDragOver` / `onDrop` handlers; store order as an integer `order` field. No drag library needed.
    - Remove button per row
  - Live subtotal: `sum(items.map(i => i.amountCents))` displayed in ZAR
  - "AI Fill" button: calls `callPortalAiGenerateWithRefresh` (or admin equivalent) with `type: "proposal"` and `{ clientId, title }` as context. On response, parse the AI output to pre-fill `summary` and append suggested line items. Show a loading spinner on the button while waiting.
  - "Save as Draft" and "Send to Client" buttons:
    - Draft: calls `POST /admin/proposals` with `status: "DRAFT"`
    - Send: calls `POST /admin/proposals` with `status: "PENDING"` — client sees it in their proposals section. Show a confirmation modal before sending.

- [ ] If the proposals API client (`apps/web/src/lib/api/admin/`) doesn't have full CRUD helpers, add them following the `withAuthorizedSession` + `callGateway` pattern.
- [ ] Ensure the `ProposalItem` creation (list of items with `order`, `description`, `amountCents`) is handled in the `POST /admin/proposals` core route — check and extend if needed.

- [ ] Run `pnpm --filter @maphari/web exec tsc --noEmit` — confirm zero errors.
- [ ] Commit:
  ```
  git commit -m "feat(admin): interactive proposal builder with drag-to-reorder line items and AI pre-fill"
  ```

---

### Task 18: Weekly AI digest email (client)

**Files created:**
- `services/automation/src/jobs/weekly-digest.job.ts`

**Files modified:**
- `apps/web/src/lib/api/portal/notification-prefs.ts` — add digest pref helpers
- `apps/web/src/components/client/maphari-dashboard/pages/settings-page.tsx` — digest toggle

#### Steps

**Automation job:**
- [ ] Create `services/automation/src/jobs/weekly-digest.job.ts`. Check the existing automation app structure (`services/automation/src/app.ts`) to understand how cron jobs are registered — follow the same pattern used by any existing jobs.

  ```typescript
  // Cron: 0 6 * * 1 (every Monday 08:00 SAST = 06:00 UTC)
  export async function runWeeklyDigestJob(deps: {
    prisma: PrismaClient;
    nats: NatsEventBus;
    aiServiceUrl: string;
  }): Promise<void> {
    // Find all clients where weekly_digest_enabled preference = "true"
    const prefs = await deps.prisma.userPreference.findMany({
      where: { key: "weekly_digest_enabled", value: "true" },
    });

    for (const pref of prefs) {
      try {
        // Fetch client's project snapshot (via internal HTTP or Prisma direct)
        // Build context payload
        // Call AI service: POST http://localhost:4011/ai/generate
        //   body: { type: "summary", context: { projects, milestones, invoices } }
        // Publish NATS event for notification delivery
        await deps.nats.publish("notification.created", {
          type: "EMAIL",
          userId: pref.userId,
          subject: "Your Weekly Project Digest",
          body: aiResponse.content,
          tab: "projects",
        });
      } catch (err) {
        // Log and continue — don't let one failure stop others
        console.error(`Weekly digest failed for userId=${pref.userId}:`, err);
      }
    }
  }
  ```

- [ ] Register this job in `services/automation/src/app.ts` with cron schedule `"0 6 * * 1"`.

**API:**
- [ ] In `apps/web/src/lib/api/portal/notification-prefs.ts`, add:
  ```typescript
  export async function loadPortalDigestPrefsWithRefresh(
    session: AuthSession
  ): Promise<AuthorizedResult<{ weeklyDigestEnabled: boolean }>> {
    // calls GET /notification-prefs, extracts "weekly_digest_enabled" key
  }

  export async function toggleDigestWithRefresh(
    session: AuthSession,
    enabled: boolean
  ): Promise<AuthorizedResult<{ success: boolean }>> {
    // calls PATCH /notification-prefs with key="weekly_digest_enabled", value=enabled
  }
  ```

**Settings UI:**
- [ ] In `apps/web/src/components/client/maphari-dashboard/pages/settings-page.tsx`, add a "AI Weekly Digest" card in the Notifications section:
  - Toggle switch: "Receive a Monday morning AI summary of your project status by email"
  - "Preview this week's digest" button: calls the AI endpoint with `type: "summary"` on demand → shows result in a read-only modal.
  - Load current pref on mount with `loadPortalDigestPrefsWithRefresh`.

- [ ] Run `pnpm --filter @maphari/web exec tsc --noEmit` — confirm zero errors.
- [ ] Commit:
  ```
  git commit -m "feat(automation): weekly AI project digest email job + client settings toggle"
  ```

---

### Task 19: Webhook admin UI (backend already built)

**Files created:**
- `apps/web/src/components/admin/dashboard/pages/webhooks-page.tsx`

**Files modified:**
- `apps/web/src/lib/api/admin/webhooks.ts` — verify full CRUD + test-delivery methods exist
- Admin sidebar navigation

#### Steps

- [ ] Check `apps/web/src/lib/api/admin/webhooks.ts` already exists (confirmed from file listing). Open it and verify it has:
  - `loadAdminWebhooksWithRefresh(session)`
  - `createAdminWebhookWithRefresh(session, payload)`
  - `updateAdminWebhookWithRefresh(session, id, payload)`
  - `deleteAdminWebhookWithRefresh(session, id)`
  - `testAdminWebhookWithRefresh(session, id)`
  Add any missing functions following the `withAuthorizedSession` + `callGateway` pattern.

- [ ] Create `apps/web/src/components/admin/dashboard/pages/webhooks-page.tsx`:

  **List view:**
  - Table columns: Name, URL (truncated), Events (comma-joined), Active (toggle), Last Fired, Fail Count, Actions
  - Active toggle: calls `updateAdminWebhookWithRefresh(session, id, { active: !current })` and updates local state optimistically
  - "Add Webhook" button top-right

  **Add Webhook modal:**
  - Name input (required)
  - URL input (required, validate starts with `https://`)
  - Events: checkbox list of available event types (get the list from the backend response or hardcode the known events from `services/core/src/routes/webhooks.ts`)
  - Secret input (optional, used for HMAC signature)
  - "Save" calls `createAdminWebhookWithRefresh` then appends to list

  **Test button per row:**
  - Sends a sample payload, shows response status + body in a small inline expandable area below the row
  - Use `testAdminWebhookWithRefresh`

  **Delete:**
  - Trash icon → confirmation modal "Delete webhook {name}? This cannot be undone." → calls `deleteAdminWebhookWithRefresh`

- [ ] Add this page to the admin sidebar navigation. Find the sidebar file (`apps/web/src/components/admin/dashboard/sidebar.tsx`) and add a "Webhooks" item under a "Developer" or "Integrations" section. Use an appropriate Lucide icon (e.g., `Webhook` or `Link`).

- [ ] Run `pnpm --filter @maphari/web exec tsc --noEmit` — confirm zero errors.
- [ ] Commit:
  ```
  git commit -m "feat(admin): webhooks management UI — list, add, test, toggle, delete"
  ```

---

### Task 20: Public status page

**Files created:**
- `apps/web/src/app/status/page.tsx`

**Files modified:**
- `services/core/src/routes/` — add `GET /status/public` (no auth)

#### Steps

**Backend:**
- [ ] Add `GET /status/public` to the core service (or create a minimal route file `services/core/src/routes/status.ts`):
  ```typescript
  fastify.get("/status/public", async (req, reply) => {
    // Check each internal service by hitting their /health endpoints
    // Run checks in parallel with Promise.allSettled + AbortSignal timeout
    const checks = await Promise.allSettled([
      fetchWithTimeout("http://localhost:4000/health", 3000), // gateway
      fetchWithTimeout("http://localhost:5433/health", 3000), // db health check via pg
      fetchWithTimeout("http://localhost:4002/health", 3000), // notifications
      fetchWithTimeout("http://localhost:4011/health", 3000), // AI service
    ]);

    const services = [
      { name: "API Gateway", ...toStatus(checks[0]) },
      { name: "Database", ...toStatus(checks[1]) },
      { name: "Notifications", ...toStatus(checks[2]) },
      { name: "AI Service", ...toStatus(checks[3]) },
    ];

    const overall = services.every((s) => s.status === "operational")
      ? "operational"
      : services.some((s) => s.status === "outage")
      ? "outage"
      : "degraded";

    return { overall, services, checkedAt: new Date().toISOString() };
  });

  function toStatus(result: PromiseSettledResult<Response>): { status: string; latencyMs: number } {
    if (result.status === "rejected") return { status: "outage", latencyMs: -1 };
    if (!result.value.ok) return { status: "degraded", latencyMs: -1 };
    return { status: "operational", latencyMs: 0 }; // measure actual latency if needed
  }
  ```
  This is a **public** endpoint — no auth middleware applied.

- [ ] Add a gateway passthrough for `/status/public` that does not require a JWT.

**Frontend:**
- [ ] Create `apps/web/src/app/status/page.tsx` as a Next.js Server Component (or Client Component with `"use client"` if auto-refresh is needed):
  ```typescript
  // Public route — no auth required
  // Uses landing page design tokens (dark theme, --lime accent)
  // Auto-refreshes every 30 seconds using useEffect + setInterval (client component)
  ```
  Structure:
  - Full-width page using landing page CSS tokens (`.page` class from `landing-reference.module.css` or create a minimal `status.module.css`).
  - Header: Maphari Technologies logo + "System Status" title
  - Overall status banner: green (operational) / amber (degraded) / red (outage) with icon
  - Per-service rows: service name, status chip, last checked time
  - "Last updated: {time}" + manual refresh button
  - Incident history section: last 7 days — initially empty or populated from a JSON file in `/public/incidents.json` (manually updated when incidents occur)
  - Auto-refresh: `setInterval(() => router.refresh(), 30_000)` for Server Component data, or `fetch` polling for Client Component.

- [ ] The status page should work at `https://status.maphari.io` or as a path `/status`. In subdomain routing (`proxy.ts`), ensure the `status` subdomain maps to the `/status` route.

- [ ] Run `pnpm --filter @maphari/web exec tsc --noEmit` — confirm zero errors.
- [ ] Commit:
  ```
  git commit -m "feat(infra): add public /status page with real-time service health checks"
  ```

---

### Task 21: Client self-service onboarding wizard

**Files modified:**
- `apps/web/src/components/client/maphari-dashboard/pages/onboarding-page.tsx` — full rewrite as multi-step wizard

**Files modified (CSS):**
- `apps/web/src/app/style/client/` — add onboarding wizard step classes to the appropriate split CSS file

#### Steps

- [ ] Open `apps/web/src/components/client/maphari-dashboard/pages/onboarding-page.tsx` and read the current implementation.
- [ ] Rewrite it as a multi-step wizard with these 6 steps:

  **Step 1 — Company Profile**
  - Fields: Company name, industry (select), company size (select), website (optional URL)
  - On "Next": calls `updatePortalProfileWithRefresh(session, { companyName, industry, size, website })` (or equivalent client profile endpoint)
  - Validates required fields before allowing Next

  **Step 2 — Brand Kit**
  - Logo upload: `<input type="file" accept="image/*">` — calls existing brand-assets upload endpoint
  - Primary brand colour: `<input type="color">` displayed as a styled swatch (the native colour picker is fine here)
  - Font preference: text input (Google Fonts name or "Let us choose")
  - On "Next": saves via brand-assets API

  **Step 3 — Project Brief**
  - What they want built: textarea (required)
  - Desired timeline: select (1 month / 3 months / 6 months / 12 months / ongoing)
  - Budget range: select (same options as contact form schema: `<5k`, `5k–15k`, `15k–50k`, `50k+`)
  - On "Next": calls `POST /portal/onboarding/brief` or the existing briefs endpoint to create a `ProjectBrief` record

  **Step 4 — Team Access**
  - Invite team members by email: input + "Add" button builds a local list of emails
  - On "Next": calls `POST /portal/team/invite` for each email (sends invite link via notifications service)
  - Skip allowed (not all clients have team members)

  **Step 5 — Meet Your Team**
  - Read-only: fetches assigned staff from existing team API
  - Shows staff member cards: avatar, name, role
  - If no staff assigned yet: "Your team will be assigned soon" message
  - "Next" just advances

  **Step 6 — Done**
  - Confetti animation (CSS-only: use `@keyframes` with multiple coloured pseudo-elements falling from top — no library)
  - "Welcome to Maphari!" message
  - CTA button: "Go to Dashboard" → navigates to home page, marks onboarding complete via `PATCH /portal/onboarding/complete`

- [ ] Add CSS classes for the wizard to the client CSS (whichever split file handles onboarding — `pages-misc.module.css` or create if needed):
  ```css
  .onboardWizard { ... }
  .onboardStepIndicator { ... }
  .onboardStep { ... }
  .onboardStepActive { ... }
  .onboardStepDone { ... }
  .onboardConfetti { ... }
  /* etc. */
  ```

- [ ] Run `pnpm --filter @maphari/web exec tsc --noEmit` — confirm zero errors.
- [ ] Commit:
  ```
  git commit -m "feat(client): rewrite onboarding page as 6-step self-service wizard"
  ```

---

### Task 22: File approval workflow with versioning

**Files modified:**
- `services/core/prisma/schema.prisma` — extend file model
- `services/core/src/routes/` — add file approval endpoints
- `apps/web/src/components/client/maphari-dashboard/pages/files-assets-page.tsx`
- Admin/Staff file views

#### Steps

**Schema:**
- [ ] Find the file model in `services/core/prisma/schema.prisma` (search for `version    Int      @default(1)` — confirmed at line 617, the model is `ProjectBrief` context, so find the actual file/asset model nearby). Add:
  ```prisma
  approvalStatus String    @default("PENDING")  // PENDING | APPROVED | CHANGES_REQUESTED
  approvedAt     DateTime?
  approvedBy     String?   // userId of approver
  changeNotes    String?
  parentFileId   String?   // self-relation: v2 points to v1
  ```
  Add the self-relation if adding `parentFileId`:
  ```prisma
  parent   UploadedFile?  @relation("FileVersions", fields: [parentFileId], references: [id])
  versions UploadedFile[] @relation("FileVersions")
  ```
- [ ] Run `pnpm --filter @maphari/core exec prisma db push`.

**Backend routes** (add to the appropriate core route file):
- [ ] `POST /portal/files/:fileId/approve` — CLIENT role. Sets `approvalStatus = "APPROVED"`, `approvedAt = now()`, `approvedBy = userId`.
- [ ] `POST /portal/files/:fileId/request-changes` — CLIENT role. Body: `{ notes: string }`. Sets `approvalStatus = "CHANGES_REQUESTED"`, `changeNotes = notes`.
- [ ] `POST /admin/files/:fileId/upload-revision` — ADMIN/STAFF role. Body: multipart with new file. Uploads new file, sets `parentFileId = fileId`, increments `version` by 1, resets `approvalStatus = "PENDING"`. Returns new file record.
- [ ] Gateway proxies for all three.

**API clients:**
- [ ] Add to `apps/web/src/lib/api/portal/files.ts`:
  ```typescript
  export async function approvePortalFileWithRefresh(session: AuthSession, fileId: string): Promise<AuthorizedResult<{ success: boolean }>>
  export async function requestPortalFileChangesWithRefresh(session: AuthSession, fileId: string, notes: string): Promise<AuthorizedResult<{ success: boolean }>>
  ```

**Client UI:**
- [ ] In `apps/web/src/components/client/maphari-dashboard/pages/files-assets-page.tsx`:
  - Per-file row: add a version badge `v{n}` using a small pill styled with `--r-xs` and `--s3` background.
  - Approval status chip: "Pending review" (amber), "Approved" (green), "Changes requested" (red).
  - Action buttons (only shown when `approvalStatus === "PENDING"`): "Approve" (calls `approvePortalFileWithRefresh`) and "Request Changes" (opens a modal with a notes textarea, calls `requestPortalFileChangesWithRefresh`).
  - "Show history" toggle per file: expands to list all versions linked via `parentFileId` chain. Show version number, upload date, who uploaded, approval status per version.
  - Change notes thread: show `changeNotes` from previous versions in a subtle blockquote style below the version history.

**Admin/Staff notification:**
- [ ] When a client requests changes, the backend should publish a `notification.created` NATS event for the assigned staff. Add this to the `POST /portal/files/:fileId/request-changes` handler.

- [ ] Run `pnpm --filter @maphari/web exec tsc --noEmit` — confirm zero errors.
- [ ] Commit:
  ```
  git commit -m "feat(files): add per-file approval workflow with version history"
  ```

---

### Task 23: Staff 2-way feedback from clients (public-facing survey)

**Files created:**
- `apps/web/src/app/survey/[token]/page.tsx`

**Files modified:**
- `services/core/src/routes/` — add public survey endpoint + token generation
- `services/core/prisma/schema.prisma` — add `SurveyToken` model if it doesn't exist

#### Steps

**Schema:**
- [ ] Check if a survey token model exists. If not, add to `services/core/prisma/schema.prisma`:
  ```prisma
  model SurveyToken {
    id         String    @id @default(uuid())
    token      String    @unique @default(uuid())
    surveyId   String
    clientId   String
    expiresAt  DateTime
    usedAt     DateTime?
    createdAt  DateTime  @default(now())
    survey     SatisfactionSurvey @relation(fields: [surveyId], references: [id], onDelete: Cascade)

    @@index([token])
    @@map("survey_tokens")
  }
  ```
  Also add `tokens SurveyToken[]` relation to `SatisfactionSurvey`.
- [ ] Run `pnpm --filter @maphari/core exec prisma db push`.

**Backend:**
- [ ] `GET /admin/survey-tokens/:surveyId/generate` — ADMIN role. Creates a `SurveyToken` record with `expiresAt = now() + 7 days`. Returns `{ token, surveyUrl: "https://app.maphari.io/survey/{token}" }`.
- [ ] `GET /public/survey/:token` — NO auth. Returns survey details (questions list, client name) if token is valid and not expired/used. Returns 410 if expired, 404 if not found.
- [ ] `POST /public/survey/:token` — NO auth. Body: `{ npsScore: number; answers: Array<{ question: string; answer: string }> }`. Validates token, marks `usedAt = now()`, creates `SatisfactionResponse` records on the linked `SatisfactionSurvey`, updates `SatisfactionSurvey.npsScore` and `SatisfactionSurvey.status = "COMPLETED"`, sets `completedAt = now()`. Returns `{ success: true }`.
- [ ] Gateway passthrough for public endpoints (no JWT required).

**Frontend:**
- [ ] Create `apps/web/src/app/survey/[token]/page.tsx` as a `"use client"` component:
  - On mount: fetch `GET /public/survey/{token}` to get survey metadata.
  - If token expired/used/not found: show an appropriate message ("This survey link has expired" etc.) with no form.
  - Survey form:
    - NPS question: "How likely are you to recommend Maphari to a colleague?" (0–10 selector using CSS grid of 11 numbered buttons, no external component)
    - 2–3 optional text questions: "What went well?", "What could we improve?"
    - "Submit" button
  - On submit: `POST /public/survey/{token}` with scores + answers.
  - Success: replace form with a thank-you screen ("Thank you for your feedback!") with the Maphari logo.
  - Style using landing page design tokens (dark bg, `--lime` accent) or a minimal clean light theme — no dashboard CSS.

- [ ] Run `pnpm --filter @maphari/web exec tsc --noEmit` — confirm zero errors.
- [ ] Commit:
  ```
  git commit -m "feat(feedback): public tokenized NPS survey page + token generation for admin"
  ```

---

### Task 24: Admin analytics dashboard (advanced)

**Files created:**
- `apps/web/src/components/admin/dashboard/pages/analytics-dashboard-page.tsx`

**Files modified:**
- `services/core/src/routes/` — add `GET /admin/analytics/revenue`, `/projects`, `/clients`
- `apps/gateway/src/routes/analytics.controller.ts` — add proxy endpoints
- `apps/web/src/lib/api/admin/analytics.ts` — add advanced analytics API client methods

Note: `apps/web/src/components/admin/dashboard/pages/admin-analytics-page-client.tsx` exists. Review it first — this task may extend it rather than create a new file.

#### Steps

**Backend aggregate queries:**
- [ ] Add `GET /admin/analytics/revenue` to core (or extend existing analytics route):
  ```typescript
  // Returns:
  interface RevenueAnalytics {
    monthlyRevenue: Array<{ month: string; amountCents: number }>; // last 12 months
    avgLifetimeValueCents: number;
    collectionRate: number; // 0–1
    topClientsByRevenue: Array<{ clientId: string; clientName: string; totalCents: number }>;
  }
  // Uses: prisma.invoice.groupBy({ by: ["month"], _sum: { amountCents } })
  // where status = "PAID"
  ```

- [ ] Add `GET /admin/analytics/projects`:
  ```typescript
  interface ProjectAnalytics {
    avgDurationDays: number;
    onTimeDeliveryRate: number; // milestone hit rate
    staffUtilizationRate: number; // assigned hours / capacity
    projectsByStatus: Array<{ status: string; count: number }>;
    avgDelayDays: number;
  }
  ```

- [ ] Add `GET /admin/analytics/clients`:
  ```typescript
  interface ClientAnalytics {
    activeCount: number;
    churnedCount: number;
    monthlyChurnTrend: Array<{ month: string; churned: number; acquired: number }>;
    avgNpsScore: number;
    avgHealthScore: number;
    npsByMonth: Array<{ month: string; avgScore: number }>;
    byIndustry: Array<{ industry: string; avgHealthScore: number }>;
  }
  ```

  All queries use only existing Prisma models — no new schema. Use `prisma.$queryRaw` for complex date grouping or Prisma `groupBy` + `aggregate`.

- [ ] Add proxy endpoints in `apps/gateway/src/routes/analytics.controller.ts` (the file already exists — add the three new methods under ADMIN role).

**API client:**
- [ ] In `apps/web/src/lib/api/admin/analytics.ts` (already exists), add:
  ```typescript
  export async function loadAdminRevenueAnalyticsWithRefresh(session: AuthSession): Promise<AuthorizedResult<RevenueAnalytics>>
  export async function loadAdminProjectAnalyticsWithRefresh(session: AuthSession): Promise<AuthorizedResult<ProjectAnalytics>>
  export async function loadAdminClientAnalyticsWithRefresh(session: AuthSession): Promise<AuthorizedResult<ClientAnalytics>>
  ```

**Admin UI:**
- [ ] Open `apps/web/src/components/admin/dashboard/pages/admin-analytics-page-client.tsx`. If it's a thin shell, expand it. Otherwise, create `analytics-dashboard-page.tsx` for the new advanced sections and link from the existing page.

  **Revenue section:**
  - Monthly revenue bar chart: pure CSS — a flex row of `<div>` bars where height is proportional to max month revenue. Use `--lime` for the current month, `--s2` for others. Show month labels below, amounts on hover (CSS `:hover` + custom tooltip using `::after`).
  - Average CLV: KPI card
  - Collection rate: radial-style progress arc (CSS `conic-gradient` on a circle div)
  - Top 5 clients by revenue: horizontal bar chart (pure CSS)

  **Project section:**
  - On-time delivery rate: large percentage number + "of milestones hit on time"
  - Average duration: KPI
  - Staff utilization: bar per staff member using existing CSS bar pattern
  - Projects by status: horizontal bar breakdown

  **Client section:**
  - Monthly churn vs. acquisition: stacked bar chart (pure CSS, two colors per bar)
  - Average NPS over time: sparkline using CSS grid column bars
  - NPS by industry: horizontal table rows with bar fill

  All charts: no external libraries. Use the same approach as velocity sparklines built elsewhere in the admin dashboard — CSS grid/flexbox with percentage-based heights/widths computed from the data.

- [ ] Add the analytics page to the admin sidebar as a top-level "Analytics" item or under an existing analytics section.

- [ ] Run `pnpm --filter @maphari/web exec tsc --noEmit` — confirm zero errors.
- [ ] Commit:
  ```
  git commit -m "feat(admin): advanced analytics dashboard — revenue, project, and client insights"
  ```

---

## Execution Order

Execute tasks strictly in tier order. Within each tier, tasks can be parallelized across different service layers (backend vs. frontend) but should be completed before moving to the next tier.

```
Tier 1: Task 1 → Task 2 → Task 3 → Task 4
Tier 2: Tasks 5–8 (can parallelize 5+8, then 6+7)
Tier 3: Tasks 9–12 (can parallelize 9+12 with different devs, then 10+11)
Tier 4: Tasks 13–24 (parallelize by domain: AI=13+18, Admin features=14+17+19+24, Client=16+21+22+23, Infra=15+20)
```

## Definition of Done (per task)

- [ ] All specified files created or modified as described
- [ ] `pnpm --filter @maphari/web exec tsc --noEmit` returns zero errors
- [ ] No inline `style={{}}` anywhere in modified React files
- [ ] `cx()` used for all class names in modified components
- [ ] Committed with the exact commit message specified in each task
- [ ] No new external npm packages added without explicit approval (all features use existing deps)

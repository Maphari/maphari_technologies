# My Portfolio Page — Production Fix & Polish Design Spec

## Goal

Make the My Portfolio page production-ready by replacing three-API client-side join with a single dedicated endpoint, fixing the broken budget-spent calculation (hardcoded as progress-proportional), correcting the `deriveHealth` bug that never returns `"exceeded"`, and adding the missing CSS classes that prevent health/priority chips from rendering correctly.

---

## Problems Being Fixed

| # | Bug | Root Cause |
|---|-----|------------|
| 1 | Budget spent always proportional to progress | No dedicated spend endpoint; frontend estimates `budgetTotal * (progressPercent / 100)` |
| 2 | `"exceeded"` health never shown | `deriveHealth()` has no branch for spent > budget |
| 3 | Health chips invisible | `pfChipGreen`, `pfChipAmber`, `pfChipRed` CSS classes undefined |
| 4 | Health dots invisible | `pfDotGreen`, `pfDotAmber`, `pfDotRed` CSS classes undefined |
| 5 | Priority chips unstyled | `pfPriorityHigh`, `pfPriorityMed`, `pfPriorityLow` CSS classes undefined |
| 6 | Three API calls on load | `getStaffProjects` + `getMyTasks` + `getStaffClients` — unnecessary network round-trips |

---

## Changes

### 1. Backend — New `GET /staff/me/portfolio` endpoint

**File:** `services/core/src/routes/staff-analytics.ts`

Add endpoint after the existing `/staff/me/performance` handler.

**Scope extraction:**
```typescript
const scope  = readScopeHeaders(request);
const userId = scope.userId;
if (!userId) return reply.code(401).send({ error: "Unauthorized" });
```

**Cache key:** `staff:portfolio:${userId}` — TTL 60 seconds, using `withCache`:

```typescript
const cacheKey = `staff:portfolio:${userId}`;
const data = await withCache(cacheKey, 60, async () => {
  // ... all data fetch and computation below
});
return { success: true, data } as ApiResponse<typeof data>;
```

On error:
```typescript
return { success: false, error: { code: "PORTFOLIO_FETCH_FAILED", message: "Unable to load portfolio." } } as ApiResponse;
```

See `/staff/me/performance` handler (line ~682) for the exact pattern.

**Data fetch (inside `withCache` callback):**

1. Get `StaffProfile.grossSalaryCents` for the user:
```typescript
const profile = await prisma.staffProfile.findUnique({
  where: { userId },
  select: { grossSalaryCents: true },
});
const grossSalaryCents = profile?.grossSalaryCents ?? 0;
const internalHourlyRateCents = grossSalaryCents > 0
  ? Math.round(grossSalaryCents / (52 * 40))
  : 0;
```

2. Get all `ProjectTimeEntry` records for this user to find their project IDs (uses `staffUserId`, same as the `/staff/me/performance` handler):
```typescript
const timeEntries = await prisma.projectTimeEntry.findMany({
  where:  { staffUserId: userId },
  select: { projectId: true, minutes: true },
});
```

3. Aggregate logged minutes per project:
```typescript
const minutesByProject = new Map<string, number>();
for (const te of timeEntries) {
  minutesByProject.set(te.projectId, (minutesByProject.get(te.projectId) ?? 0) + te.minutes);
}
const projectIds = [...minutesByProject.keys()];
```

4. Fetch projects with related data:
```typescript
const projects = await prisma.project.findMany({
  where: { id: { in: projectIds } },
  select: {
    id: true, name: true, status: true, priority: true,
    progressPercent: true, dueAt: true, budgetCents: true,
    client: { select: { id: true, name: true } },
    tasks: { select: { id: true, status: true } },
  },
});
```

**Spend and health computation per project:**
```typescript
const totalMinutes  = minutesByProject.get(p.id) ?? 0;
const spentCents    = internalHourlyRateCents > 0
  ? Math.round((totalMinutes / 60) * internalHourlyRateCents)
  : 0;
const budgetCents   = p.budgetCents ?? 0;

let health: "healthy" | "moderate" | "critical" | "exceeded";
if (budgetCents > 0 && spentCents > budgetCents)                          health = "exceeded";
else if (p.status === "AT_RISK" || p.status === "BLOCKED")                health = "critical";
else if (p.status === "ON_HOLD")                                           health = "moderate";
else                                                                        health = "healthy";
```

**Response shape per project:**
```typescript
{
  id:              p.id,
  name:            p.name,
  clientId:        p.client.id,
  clientName:      p.client.name,
  status:          p.status,
  priority:        p.priority,
  progressPercent: p.progressPercent,
  dueAt:           p.dueAt?.toISOString() ?? null,
  budgetCents:     budgetCents,
  spentCents:      spentCents,
  health:          health,
  tasks: {
    total:      p.tasks.length,
    done:       p.tasks.filter((t) => t.status === "DONE").length,
    inProgress: p.tasks.filter((t) => t.status === "IN_PROGRESS").length,
  },
}
```

Return the array wrapped in the standard success envelope.

---

### 2. Gateway — Register new route

**File:** `apps/gateway/src/routes/staff.controller.ts`

Add after the `getMyPerformance` handler (same pattern):

```typescript
// ── GET /staff/me/portfolio ────────────────────────────────────────────────
@Roles("ADMIN", "STAFF")
@Get("staff/me/portfolio")
async getMyPortfolio(
  @Headers("x-user-id")     userId?: string,
  @Headers("x-user-role")   role?: Role,
  @Headers("x-client-id")   clientId?: string,
  @Headers("x-request-id")  requestId?: string,
  @Headers("x-trace-id")    traceId?: string
): Promise<ApiResponse> {
  return proxyRequest(
    `${CORE()}/staff/me/portfolio`,
    "GET",
    undefined,
    scopeHeaders(userId, role, clientId, requestId, traceId)
  );
}
```

---

### 3. Frontend — New type + API client

**File:** `apps/web/src/lib/api/staff/portfolio.ts` (new file)

```typescript
// ════════════════════════════════════════════════════════════════════════════
// portfolio.ts — Staff API client: portfolio endpoint
// Endpoint: GET /staff/me/portfolio
// ════════════════════════════════════════════════════════════════════════════

import type { AuthSession } from "../../auth/session";
import {
  callGateway,
  withAuthorizedSession,
  type AuthorizedResult,
} from "./internal";
// Note: `isUnauthorized` and `toGatewayError` are intentionally omitted —
// this function uses `withAuthorizedSession` which handles auth errors internally.

export interface StaffPortfolioProjectTasks {
  total:      number;
  done:       number;
  inProgress: number;
}

export interface StaffPortfolioProject {
  id:              string;
  name:            string;
  clientId:        string;
  clientName:      string;
  status:          string;
  priority:        string;
  progressPercent: number;
  dueAt:           string | null;
  budgetCents:     number;
  spentCents:      number;
  health:          "healthy" | "moderate" | "critical" | "exceeded";
  tasks:           StaffPortfolioProjectTasks;
}

export async function getMyPortfolio(
  session: AuthSession | null,
): Promise<AuthorizedResult<StaffPortfolioProject[]>> {
  return withAuthorizedSession(session, async (accessToken) => {
    const response = await callGateway<StaffPortfolioProject[]>(
      "/staff/me/portfolio",
      "GET",
      undefined,
      accessToken,
    );
    if (!response.success) throw new Error(response.error ?? "Failed to load portfolio");
    return response.data ?? [];
  });
}
```

---

### 4. Frontend — Update component

**File:** `apps/web/src/components/staff/staff-dashboard/pages/my-portfolio-page.tsx`

**4a. Replace imports**

Remove:
```typescript
import { getStaffProjects, type StaffProject } from "@/lib/api/staff/projects";
import { getMyTasks, type StaffTask } from "@/lib/api/staff/tasks";
import { getStaffClients, type StaffClient } from "@/lib/api/staff/clients";
```

Add:
```typescript
import { getMyPortfolio, type StaffPortfolioProject } from "@/lib/api/staff/portfolio";
```

**4b. Remove local `PortfolioProject` type**

Replace the `PortfolioProject` type with `StaffPortfolioProject` (imported). The `Health` alias becomes:
```typescript
type Health = StaffPortfolioProject["health"];
```

**4c. Fix `deriveHealth`**

Remove the local `deriveHealth(project: StaffProject)` function entirely — health is now computed server-side and returned directly in `StaffPortfolioProject.health`.

**4d. Simplify `normalizePriority`**

Keep the function — it still normalises the priority string from the API.

**4e. Replace the `useEffect` data-fetch block**

Remove the three-API Promise.all block and replace with a single call:

```typescript
useEffect(() => {
  if (!session || !isActive) { setLoading(false); return; }
  let cancelled = false;

  setLoading(true);
  setError(null);
  void (async () => {
    try {
      const result = await getMyPortfolio(session);
      if (cancelled) return;
      if (result.nextSession) saveSession(result.nextSession);
      setProjects(result.data ?? []);
    } catch (err: unknown) {
      if (!cancelled) setError((err as Error)?.message ?? "Failed to load data.");
    } finally {
      if (!cancelled) setLoading(false);
    }
  })();

  return () => { cancelled = true; };
}, [session?.accessToken, isActive]);
```

**4f. Update project mapping in JSX**

All fields are now available directly on `StaffPortfolioProject`. Update references:
- `project.client` → `project.clientName`
- `project.progress` → `project.progressPercent`
- `project.budget.total` → `project.budgetCents / 100`
- `project.budget.spent` → `project.spentCents / 100`
- `project.dueAt` — this is `string | null` (intentionally nullable, mirrors the DB field). Pass directly to `formatDate()` which already accepts `string | null` and returns `"No date"` for null.
- `project.tasks.total`, `.done`, `.inProgress` — same keys, no change

Remove the intermediate `budget` and `tasks` destructuring (they match directly).

**4g. Remove helper functions that are no longer needed**

Remove `deriveHealth`. Keep `normalizePriority`, `healthCfg`, `priorityCfg`, `fmt`, `formatDate`.

**4h. Confirm filter logic for `"exceeded"` health**

The existing filter code already maps `"exceeded"` to the `"risk"` bucket:
```typescript
if (filter === "risk") return project.health === "critical" || project.health === "exceeded";
```
No change needed — this is correct and will work as-is once `health` values are returned from the server.

---

### 5. Frontend — Add missing CSS classes

**File:** `apps/web/src/app/style/staff/pages-e.module.css`

**First**, add `border: 1px solid transparent` to the existing `.pfHealthChip` rule (lines ~541–552) so that the colour variant `border-color` overrides below will render. Without a `border` in the base rule the `border-color` has nothing to act on:

```css
.pfHealthChip {
  /* ... existing properties ... */
  border: 1px solid transparent;  /* ADD THIS LINE */
}
```

**Then**, append after the `.pfPriorityChip` block (after line ~539):

```css
/* Health chip colour variants (applied alongside pfHealthChip) */
.pfChipGreen { background: rgba(52,217,139,0.10); border-color: rgba(52,217,139,0.20); color: var(--green); }
.pfChipAmber { background: rgba(245,166,35,0.08); border-color: rgba(245,166,35,0.18); color: var(--amber); }
.pfChipRed   { background: rgba(239,68,68,0.08);  border-color: rgba(239,68,68,0.18);  color: var(--red);   }

/* Health dot colour variants (applied alongside pfHealthDot) */
.pfDotGreen { background: var(--green); }
.pfDotAmber { background: var(--amber); }
.pfDotRed   { background: var(--red);   }

/* Priority chip colour variants (applied alongside pfPriorityChip which provides the border/shape base) */
.pfPriorityHigh { background: rgba(239,68,68,0.08);   border-color: rgba(239,68,68,0.18);  color: var(--red);   }
.pfPriorityMed  { background: rgba(245,166,35,0.08);  border-color: rgba(245,166,35,0.18); color: var(--amber); }
.pfPriorityLow  { background: rgba(255,255,255,0.04); border-color: var(--b2);             color: var(--muted); }
```

Note: `pfFillGreen`, `pfFillAmber`, `pfFillRed` are already defined in `apps/web/src/app/style/staff/pages-h.module.css` (lines 2935–2937) and do not need to be added.

---

## Files Changed

| File | What changes |
|------|-------------|
| `services/core/src/routes/staff-analytics.ts` | Add `GET /staff/me/portfolio` handler with salary-derived spend |
| `apps/gateway/src/routes/staff.controller.ts` | Register `GET staff/me/portfolio` proxy route |
| `apps/web/src/lib/api/staff/portfolio.ts` | New file — type + API client |
| `apps/web/src/components/staff/staff-dashboard/pages/my-portfolio-page.tsx` | Replace 3-API join with single call, fix health/budget/type bindings |
| `apps/web/src/app/style/staff/pages-e.module.css` | Add `pfChip*`, `pfDot*`, `pfPriority*` colour variant classes |

No schema changes. No migrations. No new UI components.

---

## Constraints

- `StaffPortfolioProject` is the single source of truth — no client-side data joining
- `spentCents` is 0 (not an error) when `grossSalaryCents` is not set — renders as `R0`
- `"exceeded"` health only fires when `budgetCents > 0` — projects with no budget are never marked exceeded
- `progressPercent` and `dueAt` continue to come from the same Prisma `Project` model — no new fields needed
- TypeScript must pass after all changes: `pnpm --filter @maphari/web exec tsc --noEmit`

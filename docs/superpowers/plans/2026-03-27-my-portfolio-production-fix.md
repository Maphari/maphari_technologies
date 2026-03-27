# My Portfolio Production Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the broken 3-API client-side join with a single `/staff/me/portfolio` endpoint that returns salary-derived spend, server-computed health (including "exceeded"), and all project data — then wire the new types and API client into the component and fix missing CSS classes.

**Architecture:** New Fastify GET handler in `staff-analytics.ts` reads `ProjectTimeEntry` to compute per-project logged minutes, derives internal hourly cost from `StaffProfile.grossSalaryCents`, and returns health + spend per project. Gateway proxies the route. Frontend replaces three `Promise.all` calls with a single `getMyPortfolio()` call. CSS variant classes are added to the existing `pages-e.module.css` alongside their base classes.

**Tech Stack:** Fastify + Prisma (backend), NestJS (gateway), React + TypeScript + CSS Modules (frontend), Vitest (backend tests)

---

## File Map

| File | Change |
|------|--------|
| `services/core/src/routes/staff-analytics.ts` | Add `GET /staff/me/portfolio` handler after line ~770 (after `/staff/me/performance` closes) |
| `services/core/src/__tests__/staff-portfolio.integration.test.ts` | New — Vitest integration tests for the new endpoint |
| `apps/gateway/src/routes/staff.controller.ts` | Add `getMyPortfolio` proxy method after line 206 (after `getMyPerformance` closes) |
| `apps/web/src/lib/api/staff/portfolio.ts` | New — `StaffPortfolioProject` type + `getMyPortfolio` client |
| `apps/web/src/components/staff/staff-dashboard/pages/my-portfolio-page.tsx` | Replace 3-API join, remove `PortfolioProject` type, remove `deriveHealth`, update JSX field refs |
| `apps/web/src/app/style/staff/pages-e.module.css` | Add `border` to `.pfHealthChip`, add 10 colour variant classes |

---

## Task 1: Backend — `GET /staff/me/portfolio` endpoint

**Files:**
- Modify: `services/core/src/routes/staff-analytics.ts` (after line ~770, after `/staff/me/performance` closing brace)
- Create: `services/core/src/__tests__/staff-portfolio.integration.test.ts`

### Step 1: Write the failing integration tests

Create `services/core/src/__tests__/staff-portfolio.integration.test.ts`:

```typescript
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCoreApp } from "../app.js";
import { cache } from "../lib/infrastructure.js";
import { prisma } from "../lib/prisma.js";

const userId  = "550e8400-e29b-41d4-a716-446655440001";
const clientId = "550e8400-e29b-41d4-a716-446655440002";
const projectId1 = "550e8400-e29b-41d4-a716-446655440003";
const projectId2 = "550e8400-e29b-41d4-a716-446655440004";

describe("GET /staff/me/portfolio", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(cache, "get").mockResolvedValue(null);
    vi.spyOn(cache, "set").mockResolvedValue(undefined);
  });

  it("returns 401 when x-user-id header is missing", async () => {
    const app = await createCoreApp();
    const response = await app.inject({
      method: "GET",
      url: "/staff/me/portfolio",
      headers: { "x-user-role": "STAFF" },
    });
    expect(response.statusCode).toBe(401);
  });

  it("returns portfolio with salary-derived spend and correct health", async () => {
    // grossSalaryCents = 4_160_000 → hourly = 4_160_000 / (52*40) = 2000 cents/h
    vi.spyOn(prisma.staffProfile, "findUnique").mockResolvedValue({
      grossSalaryCents: 4_160_000,
    } as any);

    // project1: 120 min logged → 2h × 2000c = 4000c spent; budget 3000c → exceeded
    // project2: 60 min logged  → 1h × 2000c = 2000c spent; budget 10000c, status AT_RISK → critical
    vi.spyOn(prisma.projectTimeEntry, "findMany").mockResolvedValue([
      { projectId: projectId1, minutes: 120 },
      { projectId: projectId2, minutes: 60 },
    ] as any);

    vi.spyOn(prisma.project, "findMany").mockResolvedValue([
      {
        id: projectId1,
        name: "Project Alpha",
        status: "ON_TRACK",
        priority: "HIGH",
        progressPercent: 40,
        dueAt: new Date("2026-06-01"),
        budgetCents: 3_000,
        client: { id: clientId, name: "Acme Corp" },
        tasks: [
          { id: "t1", status: "DONE" },
          { id: "t2", status: "IN_PROGRESS" },
          { id: "t3", status: "TODO" },
        ],
      },
      {
        id: projectId2,
        name: "Project Beta",
        status: "AT_RISK",
        priority: "MEDIUM",
        progressPercent: 20,
        dueAt: null,
        budgetCents: 10_000,
        client: { id: clientId, name: "Acme Corp" },
        tasks: [{ id: "t4", status: "TODO" }],
      },
    ] as any);

    const app = await createCoreApp();
    const response = await app.inject({
      method: "GET",
      url: "/staff/me/portfolio",
      headers: { "x-user-id": userId, "x-user-role": "STAFF" },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);

    const alpha = body.data.find((p: any) => p.id === projectId1);
    expect(alpha.health).toBe("exceeded");      // spent 4000 > budget 3000
    expect(alpha.spentCents).toBe(4000);
    expect(alpha.budgetCents).toBe(3000);
    expect(alpha.clientName).toBe("Acme Corp");
    expect(alpha.tasks.total).toBe(3);
    expect(alpha.tasks.done).toBe(1);
    expect(alpha.tasks.inProgress).toBe(1);

    const beta = body.data.find((p: any) => p.id === projectId2);
    expect(beta.health).toBe("critical");       // AT_RISK status
    expect(beta.spentCents).toBe(2000);
    expect(beta.dueAt).toBeNull();
  });

  it("returns empty array when user has no time entries", async () => {
    vi.spyOn(prisma.staffProfile, "findUnique").mockResolvedValue({
      grossSalaryCents: 4_160_000,
    } as any);
    vi.spyOn(prisma.projectTimeEntry, "findMany").mockResolvedValue([] as any);
    vi.spyOn(prisma.project, "findMany").mockResolvedValue([] as any);

    const app = await createCoreApp();
    const response = await app.inject({
      method: "GET",
      url: "/staff/me/portfolio",
      headers: { "x-user-id": userId, "x-user-role": "STAFF" },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/maphari/Projects/maphari_technologies
pnpm --filter @maphari/core exec vitest run src/__tests__/staff-portfolio.integration.test.ts
```

Expected: 3 failures — route not found (404s).

- [ ] **Step 3: Implement the endpoint**

Open `services/core/src/routes/staff-analytics.ts`. After the closing `});` of the `/staff/me/performance` handler (around line 770, just before the `// ── GET /staff/team-performance` comment), insert:

```typescript
  // ── GET /staff/me/portfolio ──────────────────────────────────────────────
  /** Projects the staff member has logged time on, with salary-derived spend */
  app.get("/staff/me/portfolio", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
    }
    const userId = scope.userId;
    if (!userId) {
      return reply.code(401).send({ success: false, error: { code: "UNAUTHORIZED", message: "User ID not found." } } as ApiResponse);
    }
    try {
      const cacheKey = `staff:portfolio:${userId}`;
      const data = await withCache(cacheKey, 60, async () => {
        // 1. Derive internal hourly rate from gross salary
        const profile = await prisma.staffProfile.findUnique({
          where: { userId },
          select: { grossSalaryCents: true },
        });
        const grossSalaryCents = profile?.grossSalaryCents ?? 0;
        const internalHourlyRateCents = grossSalaryCents > 0
          ? Math.round(grossSalaryCents / (52 * 40))
          : 0;

        // 2. Get time entries to discover which projects this user has logged on
        const timeEntries = await prisma.projectTimeEntry.findMany({
          where:  { staffUserId: userId },
          select: { projectId: true, minutes: true },
        });

        // 3. Aggregate minutes per project
        const minutesByProject = new Map<string, number>();
        for (const te of timeEntries) {
          minutesByProject.set(te.projectId, (minutesByProject.get(te.projectId) ?? 0) + te.minutes);
        }
        const projectIds = [...minutesByProject.keys()];

        // 4. Fetch projects with client + tasks
        const projects = projectIds.length > 0
          ? await prisma.project.findMany({
              where: { id: { in: projectIds } },
              select: {
                id: true, name: true, status: true, priority: true,
                progressPercent: true, dueAt: true, budgetCents: true,
                client: { select: { id: true, name: true } },
                tasks:  { select: { id: true, status: true } },
              },
            })
          : [];

        // 5. Compute spend and health per project
        return projects.map((p) => {
          const totalMinutes = minutesByProject.get(p.id) ?? 0;
          const spentCents   = internalHourlyRateCents > 0
            ? Math.round((totalMinutes / 60) * internalHourlyRateCents)
            : 0;
          const budgetCents  = p.budgetCents ?? 0;

          let health: "healthy" | "moderate" | "critical" | "exceeded";
          if (budgetCents > 0 && spentCents > budgetCents)             health = "exceeded";
          else if (p.status === "AT_RISK" || p.status === "BLOCKED")   health = "critical";
          else if (p.status === "ON_HOLD")                              health = "moderate";
          else                                                           health = "healthy";

          return {
            id:              p.id,
            name:            p.name,
            clientId:        p.client.id,
            clientName:      p.client.name,
            status:          p.status,
            priority:        p.priority,
            progressPercent: p.progressPercent,
            dueAt:           p.dueAt?.toISOString() ?? null,
            budgetCents,
            spentCents,
            health,
            tasks: {
              total:      p.tasks.length,
              done:       p.tasks.filter((t) => t.status === "DONE").length,
              inProgress: p.tasks.filter((t) => t.status === "IN_PROGRESS").length,
            },
          };
        });
      });
      return { success: true, data } as ApiResponse<typeof data>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "PORTFOLIO_FETCH_FAILED", message: "Unable to load portfolio." } } as ApiResponse;
    }
  });
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm --filter @maphari/core exec vitest run src/__tests__/staff-portfolio.integration.test.ts
```

Expected: 3 passing.

- [ ] **Step 5: Run full backend test suite**

```bash
pnpm --filter @maphari/core exec vitest run
```

Expected: all existing tests still pass.

- [ ] **Step 6: Commit**

```bash
git add services/core/src/routes/staff-analytics.ts \
        services/core/src/__tests__/staff-portfolio.integration.test.ts
git commit -m "feat(staff): add GET /staff/me/portfolio endpoint with salary-derived spend"
```

---

## Task 2: Gateway — Register proxy route

**Files:**
- Modify: `apps/gateway/src/routes/staff.controller.ts` (after line 206, after `getMyPerformance` closing brace)

No backend tests needed — this is a pure proxy with no logic.

- [ ] **Step 1: Insert the new method**

In `apps/gateway/src/routes/staff.controller.ts`, after the closing `}` of `getMyPerformance` (after line 206), insert:

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

- [ ] **Step 2: TypeScript check for gateway**

```bash
pnpm --filter @maphari/gateway exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/gateway/src/routes/staff.controller.ts
git commit -m "feat(gateway): proxy GET /staff/me/portfolio"
```

---

## Task 3: Frontend — New type + API client

**Files:**
- Create: `apps/web/src/lib/api/staff/portfolio.ts`

- [ ] **Step 1: Create the file**

Create `apps/web/src/lib/api/staff/portfolio.ts` with the following exact content:

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
// `withAuthorizedSession` handles auth errors internally.

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

- [ ] **Step 2: TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

Expected: no errors (new file, no consumers yet).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/api/staff/portfolio.ts
git commit -m "feat(staff): add StaffPortfolioProject type and getMyPortfolio API client"
```

---

## Task 4: Frontend — Update component

**Files:**
- Modify: `apps/web/src/components/staff/staff-dashboard/pages/my-portfolio-page.tsx`

Current state to understand before editing:
- Line 6–8: three API imports (`projects`, `tasks`, `clients`)
- Line 49–59: local `PortfolioProject` type
- Line 65–70: `deriveHealth(project: StaffProject)` function
- Line 155–224: `useEffect` with three-API `Promise.all`
- Line 326: `project.budget.total` and `project.budget.spent` refs
- Line 338: `project.client` and `project.dueAt` refs
- Line 378: `project.progress` ref

- [ ] **Step 1: Replace the three API imports (lines 6–8)**

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

- [ ] **Step 2: Remove the local `PortfolioProject` type (lines 49–59) and replace `Health` alias**

Remove the entire block:
```typescript
type PortfolioProject = {
  id: string;
  name: string;
  client: string;
  progress: number;
  health: "healthy" | "moderate" | "critical" | "exceeded";
  tasks: { total: number; done: number; inProgress: number };
  budget: { total: number; spent: number };
  dueAt: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
};
```

And update the `Health` alias (line 61) from:
```typescript
type Health = PortfolioProject["health"];
```
To:
```typescript
type Health = StaffPortfolioProject["health"];
```

- [ ] **Step 3: Remove `deriveHealth` function (lines 65–70)**

Remove the entire function:
```typescript
function deriveHealth(project: StaffProject): Health {
  if (project.progressPercent >= 100) return "healthy";
  if (project.status === "AT_RISK" || project.status === "BLOCKED") return "critical";
  if (project.status === "ON_HOLD") return "moderate";
  return "healthy";
}
```

- [ ] **Step 4: Update the state type and `useEffect`**

Change the state declaration from:
```typescript
const [projects, setProjects] = useState<PortfolioProject[]>([]);
```
To:
```typescript
const [projects, setProjects] = useState<StaffPortfolioProject[]>([]);
```

Replace the entire `useEffect` block (lines ~155–224) with:
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

- [ ] **Step 5: Fix the aggregate stats and filter logic**

Change `avgProgress` (line ~235):
```typescript
// OLD
const avgProgress = projects.length > 0 ? Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length) : 0;
// NEW
const avgProgress = projects.length > 0 ? Math.round(projects.reduce((s, p) => s + p.progressPercent, 0) / projects.length) : 0;
```

Also fix the `"done"` filter branch (line ~229) — `StaffPortfolioProject` has `progressPercent`, not `progress`:
```typescript
// OLD
if (filter === "done")  return project.progress === 100;
// NEW
if (filter === "done")  return project.progressPercent === 100;
```

- [ ] **Step 6: Fix card-level field references in the `filtered.map` block (lines ~323–420)**

Inside the `filtered.map((project) => { ... })` callback, change:

```typescript
// OLD
const budgetPct = project.budget.total > 0 ? Math.round((project.budget.spent / project.budget.total) * 100) : 0;
const budgetRemaining = project.budget.total - project.budget.spent;
```
To:
```typescript
// NEW
const budgetTotal     = project.budgetCents / 100;
const budgetSpent     = project.spentCents / 100;
const budgetPct       = project.budgetCents > 0 ? Math.round((project.spentCents / project.budgetCents) * 100) : 0;
const budgetRemaining = budgetTotal - budgetSpent;
```

Then update JSX references in the same block:

| Old | New |
|-----|-----|
| `project.client` | `project.clientName` |
| `project.dueAt` | `formatDate(project.dueAt)` |
| `project.progress` (in pfBarPct span) | `project.progressPercent` |
| `project.progress` (in pfProgressFill style) | `project.progressPercent` |
| `{fmt(project.budget.total)}` | `{fmt(budgetTotal)}` |
| `{fmt(project.budget.spent)}` | `{fmt(budgetSpent)}` |
| `{fmt(Math.abs(budgetRemaining))}` | `{fmt(Math.abs(budgetRemaining))}` (unchanged) |

Note: `project.tasks.done`, `project.tasks.inProgress`, `project.tasks.total` are unchanged — same field names on `StaffPortfolioProject`.

Note: `project.dueAt` in the old code was already processed by `formatDate` at construction time. Now `project.dueAt` is a raw ISO string or null — pass it through `formatDate(project.dueAt)` directly in JSX (the function accepts `string | null`).

- [ ] **Step 7: TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/components/staff/staff-dashboard/pages/my-portfolio-page.tsx
git commit -m "feat(staff): wire my-portfolio-page to dedicated portfolio API endpoint"
```

---

## Task 5: CSS — Add missing colour variant classes

**Files:**
- Modify: `apps/web/src/app/style/staff/pages-e.module.css`

The base classes `pfHealthChip` (line ~541), `pfHealthDot` (line ~554), and `pfPriorityChip` (line ~527) exist. The colour variant classes they're paired with in JSX do not.

Important border notes:
- `.pfHealthChip` has **no `border` property** in its base rule → `border-color` overrides have no effect. Fix: add `border: 1px solid transparent` to the base class.
- `.pfPriorityChip` **already has** `border: 1px solid var(--b2)` → do NOT add another `border` line to it. Its colour variants only need to override `border-color` and are fine as-is.

- [ ] **Step 1: Add `border: 1px solid transparent` to `.pfHealthChip` only**

In `apps/web/src/app/style/staff/pages-e.module.css`, find the `.pfHealthChip` rule (line ~541). It currently ends at `text-transform: uppercase;`. Add one line before the closing `}`:

```css
.pfHealthChip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 9px;
  font-weight: 700;
  font-family: var(--font-dm-mono);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border: 1px solid transparent;   /* ADD THIS LINE — pfPriorityChip does NOT need this, it already has border: 1px solid */
}
```

- [ ] **Step 2: Append colour variant classes after `.pfHealthDot` (line ~554)**

Insert after the closing `}` of `.pfHealthDot` (line ~554), keeping all base classes together before the variants:

```css
/* Health chip colour variants (applied alongside pfHealthChip) */
.pfChipGreen { background: rgba(52,217,139,0.10); border-color: rgba(52,217,139,0.20); color: var(--green); }
.pfChipAmber { background: rgba(245,166,35,0.08); border-color: rgba(245,166,35,0.18); color: var(--amber); }
.pfChipRed   { background: rgba(239,68,68,0.08);  border-color: rgba(239,68,68,0.18);  color: var(--red);   }

/* Health dot colour variants (applied alongside pfHealthDot) */
.pfDotGreen { background: var(--green); }
.pfDotAmber { background: var(--amber); }
.pfDotRed   { background: var(--red);   }

/* Priority chip colour variants (applied alongside pfPriorityChip which already has border: 1px solid) */
.pfPriorityHigh { background: rgba(239,68,68,0.08);   border-color: rgba(239,68,68,0.18);  color: var(--red);   }
.pfPriorityMed  { background: rgba(245,166,35,0.08);  border-color: rgba(245,166,35,0.18); color: var(--amber); }
.pfPriorityLow  { background: rgba(255,255,255,0.04); border-color: var(--b2);             color: var(--muted); }
```

Note: `pfFillGreen`, `pfFillAmber`, `pfFillRed` are already defined in `pages-h.module.css` (lines 2935–2937) — do NOT add them here.

- [ ] **Step 3: TypeScript check (CSS changes don't affect TS, but run as a final sanity check)**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/style/staff/pages-e.module.css
git commit -m "fix(staff): add pfChip/pfDot/pfPriority colour variant CSS classes for portfolio page"
```

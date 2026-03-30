# Team Performance Production Fix & UI Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix three silent data bugs in the Team Performance backend (hardcoded zeros, field name mismatch, wrong time window) and elevate the frontend table with sort pills, a utilization bar, self-row highlight, and robust error handling.

**Architecture:** Three-file change — backend route in `staff-analytics.ts` gets real data queries; `pages-g.module.css` gets 7 new CSS classes; the page component is rewritten to use the new classes and add sort/retry. No new files, no schema migrations, no API contract changes (types already match after field rename fix).

**Tech Stack:** Fastify + Prisma (backend), Next.js 15 app router with CSS Modules (frontend), Vitest + Testing Library (tests)

---

## File Map

| File | Role in this change |
|---|---|
| `services/core/src/routes/staff-analytics.ts` | Fixes the `GET /staff/team-performance` handler: week window, real tasksCompleted, department, renamed fields, updated cache key |
| `services/core/src/__tests__/staff-team-performance.integration.test.ts` | **New** integration test for the fixed endpoint |
| `apps/web/src/app/style/staff/pages-g.module.css` | Adds 7 new CSS classes for the redesigned table |
| `apps/web/src/components/staff/staff-dashboard/pages/team-performance-page.tsx` | Full component rewrite — sort, util bar, self-row, error retry |
| `apps/web/src/components/staff/staff-dashboard/pages/team-performance-page.test.tsx` | **New** component test |

---

## Task 1: Backend integration test (write first, run failing)

**Files:**
- Create: `services/core/src/__tests__/staff-team-performance.integration.test.ts`

- [ ] **Step 1.1 — Write the test file**

```typescript
// services/core/src/__tests__/staff-team-performance.integration.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCoreApp } from "../app.js";
import { cache } from "../lib/infrastructure.js";
import { prisma } from "../lib/prisma.js";

const staffId1 = "550e8400-e29b-41d4-a716-446655440010";
const staffId2 = "550e8400-e29b-41d4-a716-446655440011";
const userId1  = "550e8400-e29b-41d4-a716-446655440012";
const userId2  = "550e8400-e29b-41d4-a716-446655440013";

describe("GET /staff/team-performance", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(cache, "getJson").mockResolvedValue(null);
    vi.spyOn(cache, "setJson").mockResolvedValue(undefined);
  });

  it("returns 403 when called with CLIENT role", async () => {
    const app = await createCoreApp();
    const res = await app.inject({
      method: "GET",
      url: "/staff/team-performance",
      headers: { "x-user-id": userId1, "x-user-role": "CLIENT" },
    });
    expect(res.statusCode).toBe(403);
    await app.close();
  });

  it("returns real tasksCompleted, utilizationPct, peerRating, and department", async () => {
    vi.spyOn(prisma.staffProfile, "findMany").mockResolvedValue([
      { id: staffId1, name: "Alice Smith", role: "Developer", department: "Eng",    userId: userId1, avatarInitials: "AS" },
      { id: staffId2, name: "Bob Jones",   role: "Designer",  department: "Design", userId: userId2, avatarInitials: "BJ" },
    ] as any);

    // Alice: 6h logged this week
    vi.spyOn(prisma.projectTimeEntry, "findMany").mockResolvedValue([
      { staffUserId: userId1, minutes: 240 },
      { staffUserId: userId1, minutes: 120 },
    ] as any);

    // Alice: 3 completed tasks; Bob: 0
    vi.spyOn(prisma.projectTaskCollaborator, "findMany").mockResolvedValue([
      { staffUserId: userId1 },
      { staffUserId: userId1 },
      { staffUserId: userId1 },
    ] as any);

    // Alice: peer rating avg 4.8; Bob: no reviews
    vi.spyOn(prisma.peerReview, "findMany").mockResolvedValue([
      { revieweeId: staffId1, score: 4.6 },
      { revieweeId: staffId1, score: 5.0 },
    ] as any);

    const app = await createCoreApp();
    const res = await app.inject({
      method: "GET",
      url: "/staff/team-performance",
      headers: { "x-user-id": userId1, "x-user-role": "STAFF" },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body) as { success: boolean; data: any[] };
    expect(body.success).toBe(true);

    const alice = body.data.find((m) => m.name === "Alice Smith");
    expect(alice.tasksCompleted).toBe(3);
    expect(alice.utilizationPct).toBeGreaterThan(0);
    expect(alice.peerRating).toBe(4.8);   // Math.round((4.6+5.0)/2 * 10)/10
    expect(alice.department).toBe("Eng");
    expect(alice.isSelf).toBe(true);       // userId1 matches x-user-id header

    const bob = body.data.find((m) => m.name === "Bob Jones");
    expect(bob.tasksCompleted).toBe(0);
    expect(bob.peerRating).toBeNull();     // no reviews → null, not 0
    expect(bob.department).toBe("Design");
    expect(bob.isSelf).toBe(false);

    await app.close();
  });

  it("does not include avgTaskTime or onTimeRate in the response", async () => {
    vi.spyOn(prisma.staffProfile, "findMany").mockResolvedValue([
      { id: staffId1, name: "Alice Smith", role: "Developer", department: null, userId: userId1, avatarInitials: "AS" },
    ] as any);
    vi.spyOn(prisma.projectTimeEntry,        "findMany").mockResolvedValue([] as any);
    vi.spyOn(prisma.projectTaskCollaborator, "findMany").mockResolvedValue([] as any);
    vi.spyOn(prisma.peerReview,              "findMany").mockResolvedValue([] as any);

    const app = await createCoreApp();
    const res = await app.inject({
      method: "GET",
      url: "/staff/team-performance",
      headers: { "x-user-id": userId1, "x-user-role": "STAFF" },
    });
    const body = JSON.parse(res.body);
    const member = body.data[0];
    expect(member).not.toHaveProperty("avgTaskTime");
    expect(member).not.toHaveProperty("onTimeRate");
    await app.close();
  });
});
```

- [ ] **Step 1.2 — Run the test to confirm it fails**

```bash
cd /Users/maphari/Projects/maphari_technologies
pnpm --filter @maphari/core exec vitest run src/__tests__/staff-team-performance.integration.test.ts
```

Expected: tests fail (tasksCompleted returns 0, peerRating returns 0 not null, avgTaskTime/onTimeRate still present in response)

---

## Task 2: Fix the backend handler

**Files:**
- Modify: `services/core/src/routes/staff-analytics.ts` (lines ~863–924, the `GET /staff/team-performance` block)

> **Context:** `startOfWeek()` is already a local helper defined at line 29 of this file — no import needed. All date manipulation is done with local helpers (no date-fns). The `pct()` helper at line 41 is already available.

- [ ] **Step 2.1 — Replace the entire `GET /staff/team-performance` handler block**

Find the block that starts with `// ── GET /staff/team-performance` and replace it with:

```typescript
  // ── GET /staff/team-performance ──────────────────────────────────────────
  /** Team benchmarks from StaffProfile + time entries + completed tasks + peer reviews */
  app.get("/staff/team-performance", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role === "CLIENT") {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied." } } as ApiResponse);
    }
    try {
      const now       = new Date();
      const weekStart = startOfWeek(now);
      // stable yyyy-MM-dd cache key — avoids toISOString() timezone drift
      const weekKey   = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, "0")}-${String(weekStart.getDate()).padStart(2, "0")}`;
      const cacheKey  = `staff:team-performance:week:${weekKey}`;

      const data = await withCache(cacheKey, 300, async () => {
        // 1. Active staff profiles (add department)
        const staffList = await prisma.staffProfile.findMany({
          where:  { isActive: true },
          select: { id: true, name: true, role: true, department: true, userId: true, avatarInitials: true },
        });
        const userIds = staffList.map((s) => s.userId).filter(Boolean) as string[];

        // 2. Hours logged this week per user
        const weekEntries = userIds.length > 0
          ? await prisma.projectTimeEntry.findMany({
              where:  { staffUserId: { in: userIds }, createdAt: { gte: weekStart } },
              select: { staffUserId: true, minutes: true },
            })
          : [];
        const userHoursMap = new Map<string, number>();
        for (const entry of weekEntries) {
          if (!entry.staffUserId) continue;
          userHoursMap.set(entry.staffUserId, (userHoursMap.get(entry.staffUserId) ?? 0) + entry.minutes);
        }

        // 3. Real tasks completed this week per user (via ProjectTaskCollaborator → ProjectTask.completedAt)
        const collaborators = userIds.length > 0
          ? await prisma.projectTaskCollaborator.findMany({
              where:  { staffUserId: { in: userIds }, task: { completedAt: { gte: weekStart } } },
              select: { staffUserId: true },
            })
          : [];
        const taskCountMap = new Map<string, number>();
        for (const c of collaborators) {
          if (!c.staffUserId) continue;
          taskCountMap.set(c.staffUserId, (taskCountMap.get(c.staffUserId) ?? 0) + 1);
        }

        // 4. Peer reviews (all-time submitted, not week-scoped)
        const reviews = await prisma.peerReview.findMany({
          where:  { revieweeId: { in: staffList.map((s) => s.id) }, status: "SUBMITTED" },
          select: { revieweeId: true, score: true },
        });
        const reviewMap = new Map<string, number[]>();
        for (const r of reviews) {
          const ex = reviewMap.get(r.revieweeId) ?? [];
          if (r.score != null) ex.push(r.score);
          reviewMap.set(r.revieweeId, ex);
        }

        // 5. Working-hours denominator: days elapsed in current week × 8h
        const dayOfWeek    = now.getDay(); // 0=Sun, 1=Mon … 6=Sat
        const daysElapsed  = dayOfWeek === 0 ? 5 : Math.min(5, dayOfWeek);
        const workingHours = Math.max(1, daysElapsed) * 8;

        const currentUserId = scope.userId;

        return staffList.map((staff) => {
          const mins          = userHoursMap.get(staff.userId ?? "") ?? 0;
          const hoursThisWeek = Math.round(mins / 60 * 10) / 10;
          const utilizationPct = pct(hoursThisWeek, workingHours);
          const tasksCompleted = taskCountMap.get(staff.userId ?? "") ?? 0;
          const ratingsArr     = reviewMap.get(staff.id) ?? [];
          const peerRating     = ratingsArr.length > 0
            ? Math.round(ratingsArr.reduce((s, r) => s + r, 0) / ratingsArr.length * 10) / 10
            : null;

          return {
            id:             staff.id,
            name:           staff.name,
            role:           staff.role,
            department:     staff.department ?? null,
            avatarInitials: staff.avatarInitials ?? staff.name.slice(0, 2).toUpperCase(),
            hoursThisWeek,
            tasksCompleted,
            utilizationPct,
            peerRating,
            isSelf: staff.userId === currentUserId,
          };
        });
      });

      return { success: true, data } as ApiResponse<typeof data>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "TEAM_PERF_FETCH_FAILED", message: "Unable to fetch team performance." } } as ApiResponse;
    }
  });
```

- [ ] **Step 2.2 — Run the integration tests**

```bash
pnpm --filter @maphari/core exec vitest run src/__tests__/staff-team-performance.integration.test.ts
```

Expected: all 3 tests pass

- [ ] **Step 2.3 — Run the full core test suite to check for regressions**

```bash
pnpm --filter @maphari/core exec vitest run
```

Expected: all existing tests still pass

- [ ] **Step 2.4 — Commit**

```bash
git add services/core/src/routes/staff-analytics.ts \
        services/core/src/__tests__/staff-team-performance.integration.test.ts
git commit -m "fix(staff-analytics): real week data for team-performance endpoint

- Switch time window to startOfWeek (Monday) instead of startOfMonth
- Compute real tasksCompleted via ProjectTaskCollaborator join
- Add department to response; rename utilization→utilizationPct, satisfaction→peerRating
- peerRating is null (not 0) when no reviews exist
- Remove hardcoded avgTaskTime and onTimeRate from response
- Week-scoped cache key using yyyy-MM-dd format

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Add 7 new CSS classes

**Files:**
- Modify: `apps/web/src/app/style/staff/pages-g.module.css` (append after the existing `.tpmMetricSep` block)

> **Context:** The existing TPM block in this file ends around `.tpmMetricSep`. Append the new classes after it. The `bgGreen`, `bgAmber`, `bgRed` classes used by `.tpmUtilFill` are already defined in `core.module.css` — do not duplicate them.

- [ ] **Step 3.1 — Append the 7 new classes to `pages-g.module.css`**

Find the last existing `.tpm*` class (`.tpmMetricSep`) and append after it:

```css
/* ── Team Performance — self-row, util bar, sort pills ────────────────────── */

.tpmSelfRow {
  background: rgba(249, 115, 22, 0.05);
  border-top: 1px solid rgba(249, 115, 22, 0.1);
  border-bottom: 1px solid rgba(249, 115, 22, 0.1);
}

.tpmSelfBadge {
  display: inline-block;
  margin-left: 6px;
  padding: 1px 5px;
  background: var(--accent-d);
  border: 1px solid rgba(249, 115, 22, 0.2);
  border-radius: 3px;
  font-size: 8px;
  font-family: var(--font-dm-mono), monospace;
  font-weight: 600;
  color: var(--accent);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  vertical-align: middle;
}

.tpmUtilCell {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: flex-end;
}

.tpmUtilTrack {
  width: 60px;
  height: 4px;
  background: var(--b1);
  border-radius: 2px;
  overflow: hidden;
  flex-shrink: 0;
}

.tpmUtilFill {
  height: 100%;
  border-radius: 2px;
  /* width set inline as a % — capped to 100 in component */
  /* background color applied via bgGreen / bgAmber / bgRed from core.module.css */
}

.tpmSortPill {
  background: var(--s2);
  border: 1px solid var(--b2);
  border-radius: 4px;
  padding: 3px 8px;
  font-size: 9px;
  font-family: var(--font-dm-mono), monospace;
  font-weight: 600;
  color: var(--muted);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 120ms, border-color 120ms, color 120ms;
}

.tpmSortPill:hover {
  background: var(--s3);
  border-color: var(--b3);
  color: var(--text);
}

.tpmSortPillActive {
  background: var(--accent-d);
  border-color: rgba(249, 115, 22, 0.25);
  color: var(--accent);
}

.tpmSortPillActive:hover {
  background: var(--accent-d);
  border-color: rgba(249, 115, 22, 0.4);
}
```

- [ ] **Step 3.2 — Commit**

```bash
git add apps/web/src/app/style/staff/pages-g.module.css
git commit -m "feat(staff-css): add tpm self-row, util bar, and sort pill classes

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 4: Frontend component test (write first, run failing)

**Files:**
- Create: `apps/web/src/components/staff/staff-dashboard/pages/team-performance-page.test.tsx`

- [ ] **Step 4.1 — Write the test file**

```typescript
// apps/web/src/components/staff/staff-dashboard/pages/team-performance-page.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { TeamPerformancePage } from "./team-performance-page";
import { getStaffTeamPerformance } from "@/lib/api/staff/performance";

vi.mock("@/lib/api/staff/performance");

const mockSession = { accessToken: "tok", userId: "u-alice" } as any;

const mockMembers = [
  {
    id: "s1", name: "Alice Smith", role: "Developer", department: "Eng",
    avatarInitials: "AS", hoursThisWeek: 32, tasksCompleted: 8,
    utilizationPct: 92, peerRating: 4.6, isSelf: true,
  },
  {
    id: "s2", name: "Bob Jones", role: "Designer", department: "Design",
    avatarInitials: "BJ", hoursThisWeek: 16, tasksCompleted: 3,
    utilizationPct: 40, peerRating: null, isSelf: false,
  },
  {
    id: "s3", name: "Carol Tan", role: "PM", department: "Ops",
    avatarInitials: "CT", hoursThisWeek: 38, tasksCompleted: 11,
    utilizationPct: 95, peerRating: 4.9, isSelf: false,
  },
];

beforeEach(() => {
  vi.mocked(getStaffTeamPerformance).mockResolvedValue({
    data: mockMembers, error: null, nextSession: null,
  } as any);
});

afterEach(() => vi.clearAllMocks());

// ── Loading & error states ────────────────────────────────────────────────────

describe("TeamPerformancePage — loading state", () => {
  it("shows skeleton blocks while fetching", () => {
    vi.mocked(getStaffTeamPerformance).mockImplementation(() => new Promise(() => {}));
    render(<TeamPerformancePage isActive session={mockSession} />);
    expect(document.querySelector(".skeletonBlock")).toBeTruthy();
  });
});

describe("TeamPerformancePage — error state", () => {
  it("shows error message when API returns result.error", async () => {
    vi.mocked(getStaffTeamPerformance).mockResolvedValue({
      data: null, error: { message: "DB timeout", code: "ERR" }, nextSession: null,
    } as any);
    render(<TeamPerformancePage isActive session={mockSession} />);
    await waitFor(() => expect(screen.getByText("DB timeout")).toBeInTheDocument());
  });

  it("shows a Retry button that re-triggers the fetch", async () => {
    vi.mocked(getStaffTeamPerformance)
      .mockResolvedValueOnce({ data: null, error: { message: "fail", code: "E" }, nextSession: null } as any)
      .mockResolvedValueOnce({ data: mockMembers, error: null, nextSession: null } as any);

    render(<TeamPerformancePage isActive session={mockSession} />);
    await waitFor(() => expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    await waitFor(() => expect(screen.getByText("Alice Smith")).toBeInTheDocument());
    expect(getStaffTeamPerformance).toHaveBeenCalledTimes(2);
  });
});

// ── KPI cards ─────────────────────────────────────────────────────────────────

describe("TeamPerformancePage — KPI cards", () => {
  it("shows team size", async () => {
    render(<TeamPerformancePage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Alice Smith"));
    // Team size = 3 members
    expect(screen.getAllByText("3").length).toBeGreaterThanOrEqual(1);
  });

  it("shows average utilization", async () => {
    render(<TeamPerformancePage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Alice Smith"));
    // Avg util: (92+40+95)/3 = 75.67 → 76
    expect(screen.getByText("76%")).toBeInTheDocument();
  });
});

// ── Member table ─────────────────────────────────────────────────────────────

describe("TeamPerformancePage — member table", () => {
  it("renders all members", async () => {
    render(<TeamPerformancePage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Alice Smith"));
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
    expect(screen.getByText("Carol Tan")).toBeInTheDocument();
  });

  it("shows 'you' badge on the self-row", async () => {
    render(<TeamPerformancePage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Alice Smith"));
    expect(screen.getByText("you")).toBeInTheDocument();
    // Only one 'you' badge
    expect(screen.getAllByText("you").length).toBe(1);
  });

  it("shows real task counts (not always 0)", async () => {
    render(<TeamPerformancePage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Alice Smith"));
    expect(screen.getByText("8")).toBeInTheDocument();  // Alice tasks
    expect(screen.getByText("11")).toBeInTheDocument(); // Carol tasks
  });

  it("shows — for peerRating when null", async () => {
    render(<TeamPerformancePage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Bob Jones"));
    // Bob has peerRating: null → "—" shown in CSAT cell
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it("shows department values", async () => {
    render(<TeamPerformancePage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Alice Smith"));
    expect(screen.getByText("Eng")).toBeInTheDocument();
    expect(screen.getByText("Design")).toBeInTheDocument();
    expect(screen.getByText("Ops")).toBeInTheDocument();
  });
});

// ── Sort pills ────────────────────────────────────────────────────────────────

describe("TeamPerformancePage — sort pills", () => {
  it("renders 4 sort pills", async () => {
    render(<TeamPerformancePage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Alice Smith"));
    expect(screen.getByRole("button", { name: /util/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /name/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tasks/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /csat/i })).toBeInTheDocument();
  });

  it("sorts by Name ascending when Name pill is clicked", async () => {
    render(<TeamPerformancePage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Alice Smith"));
    fireEvent.click(screen.getByRole("button", { name: /^name/i }));
    const rows = screen.getAllByRole("row").slice(1); // skip header
    const names = rows.map((r) => r.querySelector("td")?.textContent ?? "");
    // First name alphabetically: Alice < Bob < Carol
    expect(names[0]).toContain("Alice");
  });

  it("reverses sort direction when active pill is clicked again", async () => {
    render(<TeamPerformancePage isActive session={mockSession} />);
    await waitFor(() => screen.getByText("Alice Smith"));
    const namePill = screen.getByRole("button", { name: /^name/i });
    fireEvent.click(namePill); // asc
    fireEvent.click(namePill); // desc
    const rows = screen.getAllByRole("row").slice(1);
    const names = rows.map((r) => r.querySelector("td")?.textContent ?? "");
    // Last alphabetically first in desc: Carol
    expect(names[0]).toContain("Carol");
  });
});

// ── Empty state ───────────────────────────────────────────────────────────────

describe("TeamPerformancePage — empty state", () => {
  it("shows empty state message when no members returned", async () => {
    vi.mocked(getStaffTeamPerformance).mockResolvedValue({
      data: [], error: null, nextSession: null,
    } as any);
    render(<TeamPerformancePage isActive session={mockSession} />);
    await waitFor(() =>
      expect(screen.getByText(/no team data available/i)).toBeInTheDocument()
    );
  });
});
```

- [ ] **Step 4.2 — Run the tests to confirm they fail**

```bash
cd /Users/maphari/Projects/maphari_technologies
pnpm --filter @maphari/web exec vitest run src/components/staff/staff-dashboard/pages/team-performance-page.test.tsx
```

Expected: multiple failures — "you" badge missing, retry button missing, sort pills missing, task counts are 0

---

## Task 5: Rewrite the frontend component

**Files:**
- Modify: `apps/web/src/components/staff/staff-dashboard/pages/team-performance-page.tsx`

> **Context:** Replace the full file content. The `cx` helper, all imports, and the page wrapper pattern (`section.page.pageBody`) stay the same. The `staffTable` and `numCol` classes used in the table `<thead>` are shared classes already on the page — keep them.

- [ ] **Step 5.1 — Replace the full file with the updated component**

```typescript
// ════════════════════════════════════════════════════════════════════════════
// team-performance-page.tsx — Staff Team Performance
// Data : GET /staff/team-performance → StaffTeamMember[]
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { cx } from "../style";
import { getStaffTeamPerformance, type StaffTeamMember } from "../../../../lib/api/staff/performance";
import type { AuthSession } from "../../../../lib/auth/session";

// ── Props ─────────────────────────────────────────────────────────────────────

type TeamPerformancePageProps = {
  isActive: boolean;
  session:  AuthSession | null;
};

// ── Sort types ────────────────────────────────────────────────────────────────

type SortKey = "util" | "name" | "tasks" | "csat";
type SortDir = "asc" | "desc";

const PILL_LABELS: Record<SortKey, string> = {
  util:  "Util",
  name:  "Name",
  tasks: "Tasks",
  csat:  "CSAT",
};

const DEFAULT_DIR: Record<SortKey, SortDir> = {
  util:  "desc",
  name:  "asc",
  tasks: "desc",
  csat:  "desc",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "tpmAvatarAccent",
  "tpmAvatarBlue",
  "tpmAvatarGreen",
  "tpmAvatarAmber",
  "tpmAvatarPurple",
] as const;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

function avatarCls(name: string): string {
  const hash = name.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function utilizationCls(u: number): string {
  if (u >= 85) return "colorGreen";
  if (u >= 60) return "colorAmber";
  return "colorRed";
}

function utilizationBgCls(u: number): string {
  if (u >= 85) return "bgGreen";
  if (u >= 60) return "bgAmber";
  return "bgRed";
}

function peerRatingCls(r: number | null): string {
  if (r === null) return "colorMuted2";
  if (r >= 4.5)   return "colorGreen";
  if (r >= 4.0)   return "colorAmber";
  return "colorRed";
}

function avgTaskTime(hoursThisWeek: number, tasksCompleted: number): string {
  if (tasksCompleted === 0) return "—";
  return `${Math.round((hoursThisWeek / tasksCompleted) * 10) / 10}h`;
}

function sortMembers(
  members: StaffTeamMember[],
  key: SortKey,
  dir: SortDir,
): StaffTeamMember[] {
  return [...members].sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case "util":  cmp = a.utilizationPct - b.utilizationPct; break;
      case "name":  cmp = a.name.localeCompare(b.name);        break;
      case "tasks": cmp = a.tasksCompleted - b.tasksCompleted; break;
      case "csat":  cmp = (a.peerRating ?? -1) - (b.peerRating ?? -1); break;
    }
    return dir === "asc" ? cmp : -cmp;
  });
}

// ── Page component ────────────────────────────────────────────────────────────

export function TeamPerformancePage({ isActive, session }: TeamPerformancePageProps) {
  const [members,    setMembers]    = useState<StaffTeamMember[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [sortKey,    setSortKey]    = useState<SortKey>("util");
  const [sortDir,    setSortDir]    = useState<SortDir>("desc");

  useEffect(() => {
    if (!session || !isActive) { setLoading(false); return; }
    let cancelled = false;

    setLoading(true);
    setError(null);
    void getStaffTeamPerformance(session).then((result) => {
      if (cancelled) return;
      if (result.error) {
        setError(result.error.message);
        return;
      }
      if (result.data) setMembers(result.data);
    }).catch((err) => {
      if (!cancelled) setError((err as Error)?.message ?? "Failed to load");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [session?.accessToken, isActive, retryCount]);

  function handlePillClick(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(DEFAULT_DIR[key]);
    }
  }

  // ── Derived data ────────────────────────────────────────────────────────────
  const ratedMembers     = members.filter((m) => m.peerRating !== null);
  const teamAvgPeerRating = ratedMembers.length > 0
    ? Math.round((ratedMembers.reduce((s, m) => s + (m.peerRating ?? 0), 0) / ratedMembers.length) * 10) / 10
    : null;
  const teamAvgUtil  = members.length > 0
    ? Math.round(members.reduce((s, m) => s + m.utilizationPct, 0) / members.length)
    : 0;
  const teamAvgTasks = members.length > 0
    ? Math.round(members.reduce((s, m) => s + m.tasksCompleted, 0) / members.length)
    : 0;

  const sorted = sortMembers(members, sortKey, sortDir);

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-team-performance">
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </section>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-team-performance">
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateTitle")}>Something went wrong</div>
          <div className={cx("emptyStateSub")}>{error}</div>
          <button
            className={cx("emptyStateAction")}
            onClick={() => setRetryCount((c) => c + 1)}
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-team-performance">
      {/* Page header */}
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Analytics</div>
        <h1 className={cx("pageTitleText")}>Team Performance</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Team benchmarks for this week</p>
      </div>

      {/* KPI stat grid */}
      <div className={cx("tpmStatGrid")}>
        <div className={cx("tpmStatCard")}>
          <div className={cx("tpmStatCardTop", "colorAccent")}>{members.length}</div>
          <div className={cx("tpmStatCardDivider")} />
          <div className={cx("tpmStatCardBottom")}>Team Size</div>
        </div>
        <div className={cx("tpmStatCard")}>
          <div className={cx("tpmStatCardTop", "colorAccent")}>{teamAvgTasks}</div>
          <div className={cx("tpmStatCardDivider")} />
          <div className={cx("tpmStatCardBottom")}>Avg Tasks / Member</div>
        </div>
        <div className={cx("tpmStatCard")}>
          <div className={cx("tpmStatCardTop", utilizationCls(teamAvgUtil))}>{teamAvgUtil}%</div>
          <div className={cx("tpmStatCardDivider")} />
          <div className={cx("tpmStatCardBottom")}>Avg Utilization</div>
        </div>
        <div className={cx("tpmStatCard")}>
          <div className={cx("tpmStatCardTop", peerRatingCls(teamAvgPeerRating))}>
            {teamAvgPeerRating !== null ? teamAvgPeerRating : "—"}
          </div>
          <div className={cx("tpmStatCardDivider")} />
          <div className={cx("tpmStatCardBottom")}>Avg CSAT</div>
        </div>
      </div>

      {/* Member table */}
      {members.length > 0 && (
        <div className={cx("tpmSection")}>
          {/* Section header + sort pills */}
          <div className={cx("tpmSectionHeader")}>
            <div className={cx("tpmSectionTitle")}>Team Members</div>
            <div style={{ display: "flex", gap: 4 }}>
              {(["util", "name", "tasks", "csat"] as SortKey[]).map((key) => {
                const active = sortKey === key;
                const arrow  = active ? (sortDir === "desc" ? " ↓" : " ↑") : "";
                return (
                  <button
                    key={key}
                    className={cx(active ? "tpmSortPillActive" : "tpmSortPill")}
                    onClick={() => handlePillClick(key)}
                  >
                    {PILL_LABELS[key]}{arrow}
                  </button>
                );
              })}
            </div>
          </div>

          <table className={cx("staffTable")}>
            <thead>
              <tr>
                <th>Member</th>
                <th className="numCol">Tasks</th>
                <th className="numCol">Avg Time</th>
                <th className="numCol">Utilization</th>
                <th>Dept</th>
                <th className="numCol">CSAT</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((m) => (
                <tr key={m.id} className={m.isSelf ? cx("tpmSelfRow") : undefined}>
                  <td>
                    <div className={cx("tpmMemberHead")}>
                      <div className={cx("tpmAvatar", avatarCls(m.name))}>{initials(m.name)}</div>
                      <div>
                        <div className={cx("tpmMemberName")}>
                          {m.name}
                          {m.isSelf && <span className={cx("tpmSelfBadge")}>you</span>}
                        </div>
                        <div className={cx("tpmMemberRole")}>{m.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="numCol">
                    <span className={cx("colorAccent")}>{m.tasksCompleted}</span>
                  </td>
                  <td className="numCol">
                    <span className={cx("colorMuted2")}>{avgTaskTime(m.hoursThisWeek, m.tasksCompleted)}</span>
                  </td>
                  <td className="numCol">
                    <div className={cx("tpmUtilCell")}>
                      <div className={cx("tpmUtilTrack")}>
                        <div
                          className={cx("tpmUtilFill", utilizationBgCls(m.utilizationPct))}
                          style={{ width: `${Math.min(100, m.utilizationPct)}%` }}
                        />
                      </div>
                      <span className={cx(utilizationCls(m.utilizationPct))}>{m.utilizationPct}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={cx("colorMuted2")}>{m.department ?? "—"}</span>
                  </td>
                  <td className="numCol">
                    <span className={cx(peerRatingCls(m.peerRating))}>
                      {m.peerRating !== null
                        ? <>{m.peerRating}<span style={{ opacity: 0.5, fontSize: "0.8em" }}>/5</span></>
                        : "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state */}
      {members.length === 0 && (
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateIcon")}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87"/>
              <path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
          </div>
          <div className={cx("emptyStateTitle")}>No team data available</div>
          <div className={cx("emptyStateSub")}>
            Team performance metrics will appear here once staff have logged time this week.
          </div>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 5.2 — Run the component tests**

```bash
pnpm --filter @maphari/web exec vitest run src/components/staff/staff-dashboard/pages/team-performance-page.test.tsx
```

Expected: all tests pass

- [ ] **Step 5.3 — TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

Expected: no errors

- [ ] **Step 5.4 — Commit**

```bash
git add apps/web/src/components/staff/staff-dashboard/pages/team-performance-page.tsx \
        apps/web/src/components/staff/staff-dashboard/pages/team-performance-page.test.tsx
git commit -m "feat(team-performance): sort pills, util bar, self-row, retry button

- Replace staffKpiStrip with tpmStatGrid/tpmStatCard (richer KPI cards)
- Add sort pills: Util/Name/Tasks/CSAT with direction toggle
- Utilization column: progress bar + text (green/amber/red tiers)
- Self-row: accent tint + 'you' badge from isSelf API flag
- Error state: Retry button increments retryCount to re-trigger fetch
- Fix silent error drop: check result.error before result.data
- Remove inline styles: use tpmMemberHead CSS class
- utilizationCls: add red tier for < 60%

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 6: Final verification

- [ ] **Step 6.1 — Run all web tests**

```bash
pnpm --filter @maphari/web exec vitest run
```

Expected: all pass

- [ ] **Step 6.2 — Run all core tests**

```bash
pnpm --filter @maphari/core exec vitest run
```

Expected: all pass

- [ ] **Step 6.3 — Final TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

Expected: zero errors

- [ ] **Step 6.4 — Final commit (if any outstanding changes)**

```bash
git status
# If clean, nothing to do. If dirty, commit any remaining changes.
```

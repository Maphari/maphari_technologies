# My Performance Page — Production Fix & Polish Design Spec

## Goal

Make the My Performance page production-ready by fixing three critical bugs (broken field names, hardcoded task counts, response times contract mismatch + cache key), adding task completion tracking via a new `completedAt` field, and surfacing the rich response time data the backend already returns but the frontend ignores.

---

## Problems Being Fixed

| # | Bug | Root Cause |
|---|-----|------------|
| 1 | `tasksCompleted` always 0 | Backend hardcodes `tasks: 0`; schema has no `completedAt` field |
| 2 | Weekly data fields silently `undefined` | Backend returns `hours`/`tasks`; frontend expects `hoursLogged`/`tasksCompleted` |
| 3 | Client breakdown fields silently `undefined` | Backend returns `client`/`hours`; frontend expects `clientName`/`hoursLogged` |
| 4 | Response rate KPI always broken | Frontend reads `metCount`/`totalCount` which backend never returns |
| 5 | All staff share one response-times cache | Cache key `staff:response-times:all` instead of per-user |

---

## Changes

### 1. Schema — Add `completedAt` to `ProjectTask`

**File:** `services/core/prisma/schema.prisma`

Add optional field to `ProjectTask`:
```prisma
completedAt DateTime?
```

Add index for performance query:
```prisma
@@index([completedAt])
```

Run `pnpm --filter @maphari/core exec prisma migrate dev --name add-task-completed-at`.

---

### 2. Backend — Wire `completedAt` on task status change

**File:** `services/core/src/routes/projects.ts` — `PATCH /projects/:projectId/tasks/:taskId`

When building the `data` object for `prisma.projectTask.update`:

- If incoming `status === "DONE"` and current `task.status !== "DONE"` → add `completedAt: new Date()`
- If incoming `status` is set to anything other than `"DONE"` and current `task.status === "DONE"` → add `completedAt: null`
- Otherwise → no change to `completedAt`

No other changes to the PATCH handler.

---

### 3. Backend — Fix `/staff/me/performance`

**File:** `services/core/src/routes/staff-analytics.ts`

**3a. Fix weekly data field names and add real task counts**

Current (broken):
```typescript
return { week, hours, tasks: 0, responseTime: 2.0, score: ... };
```

Replace with:
```typescript
return { week, hoursLogged: hours, tasksCompleted: weekTaskCounts.get(week) ?? 0 };
```

To compute `weekTaskCounts`: after fetching time entries, collect the distinct `projectId`s the staff worked on. Then query:
```typescript
const completedTasks = await prisma.projectTask.findMany({
  where: {
    projectId: { in: staffProjectIds },
    completedAt: { gte: eightWeeksAgo, not: null },
  },
  select: { completedAt: true },
});
```

Group by ISO week string (same `toISOWeek()` helper already used in the route) to produce `weekTaskCounts: Map<string, number>`.

**3b. Fix client breakdown field names**

Current (broken):
```typescript
{ client: clientMap.get(cid), hours: ..., tasks: 0, tone: ... }
```

Replace with:
```typescript
{ clientName: clientMap.get(cid) ?? "Unknown", hoursLogged: Math.round(mins / 60 * 10) / 10 }
```

Drop `tasks` and `tone` — not used by the frontend type.

**3c. Remove unused fields from return**

Remove `targets` and `tasksByType` from the return object — not used by the frontend.

---

### 4. Backend — Fix `/staff/me/response-times` cache key

**File:** `services/core/src/routes/staff-analytics.ts`

Change:
```typescript
const cacheKey = `staff:response-times:all`;
```
To:
```typescript
const cacheKey = `staff:response-times:${userId}`;
```

No other changes to this route.

---

### 5. Frontend — Update `StaffResponseTimes` type

**File:** `apps/web/src/lib/api/staff/performance.ts`

Replace the broken `StaffResponseTimes` interface:

```typescript
export interface StaffResponseTimeWeek {
  week:   string;
  avgHrs: number;
}

export interface StaffResponseTimeClient {
  clientId: string;
  name:     string;
  avgHrs:   number;
}

export interface StaffResponseTimes {
  target:      number;
  overallAvg:  number;
  weeklyTrend: StaffResponseTimeWeek[];
  byClient:    StaffResponseTimeClient[];
}
```

Remove the old `StaffResponseTimeRecord` interface and `records` field — they were never populated.

---

### 6. Frontend — Fix component data bindings

**File:** `apps/web/src/components/staff/staff-dashboard/pages/personal-performance-page.tsx`

**6a. Fix response rate KPI**

Replace the `metCount`/`totalCount` response rate calculation:
```typescript
// OLD (broken — metCount/totalCount are never returned)
const responsePct = Math.round((responseTimes.metCount / responseTimes.totalCount) * 100);
```

With `overallAvg` vs `target` display:
```typescript
const responseAvg     = responseTimes?.overallAvg ?? null;
const responseTarget  = responseTimes?.target ?? 2.0;
const responseOnTarget = responseAvg !== null && responseAvg <= responseTarget;
```

The Response Rate KPI card renders:
- Value: `responseAvg !== null ? `${responseAvg.toFixed(1)}h avg` : "—"`
- Sub-label: `target: ${responseTarget}h`
- Progress bar fill: `Math.min(100, Math.round((responseTarget / Math.max(0.1, responseAvg ?? responseTarget)) * 100))`  (100% = on target, lower = over target)
- Color: `responseOnTarget ? --green : --red`

**6b. Add response time sparkline to Overview tab**

Reuse the existing `MiniLineChart` component. Map `weeklyTrend` data:
```typescript
const rtChartData = (responseTimes?.weeklyTrend ?? []).map((w) => ({
  week: w.week,
  value: w.avgHrs,
}));
```

Render a third mini chart card in the Overview alongside the hours and tasks charts:
- Label: "Response Time"
- Value: `responseAvg !== null ? `${responseAvg.toFixed(1)}h` : "—"`
- Sub-label: `target: ${responseTarget}h`
- Color: `responseOnTarget ? --green : --accent`
- `MiniLineChart` receives `data={rtChartData}` with `field="value"`

**6c. Wire `byClient` into Clients tab**

The Clients tab already maps over `perf.clientBreakdown`. For each client row, look up the matching entry from `responseTimes?.byClient` by `clientName === rt.name`:

Add a second column to each client row showing:
- `rt?.avgHrs.toFixed(1)h` in `--muted` if found
- `"—"` if no match
- Column header: "Avg Response"

---

## Files Changed

| File | What changes |
|------|-------------|
| `services/core/prisma/schema.prisma` | Add `completedAt DateTime?` + index to `ProjectTask` |
| `services/core/src/routes/projects.ts` | Set/clear `completedAt` when task status changes to/from `"DONE"` |
| `services/core/src/routes/staff-analytics.ts` | Fix weekly field names, add real task counts, fix client field names, fix cache key |
| `apps/web/src/lib/api/staff/performance.ts` | Replace `StaffResponseTimes` interface with correct shape |
| `apps/web/src/components/staff/staff-dashboard/pages/personal-performance-page.tsx` | Fix response rate KPI, add RT sparkline, wire byClient into Clients tab |

No new files. No API endpoint additions. No prop changes on the component.

---

## Constraints

- No changes to `StaffPerformance`, `StaffPerformanceWeek`, `StaffPerformanceClient`, or `StaffPerformanceMilestone` types — field names are fixed in the backend to match the existing frontend types
- `completedAt` is optional — existing tasks without it are treated as not completed
- Task counts are scoped to projects the staff user has logged time on (proxy for "assigned to"), not by `assigneeName` string matching
- No new UI components — reuse `MiniLineChart` for the response time sparkline
- TypeScript must pass after all changes: `pnpm --filter @maphari/web exec tsc --noEmit`

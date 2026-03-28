# Team Performance Page — Production Fix & UI Redesign

**Date:** 2026-03-28
**Status:** Approved
**Scope:** Full production fix — backend data correctness + frontend UI elevation

---

## Problem Statement

The Team Performance page (`/staff` → Team Performance tab) has three categories of issues:

1. **Dead data** — `tasksCompleted` is hardcoded `0`, `avgTaskTime` is hardcoded `"—"`, `onTimeRate` is hardcoded `100`. None of these reflect actual work.
2. **Field name mismatch** — the backend returns `utilization` and `satisfaction` but the frontend `StaffTeamMember` type expects `utilizationPct` and `peerRating`. The page silently shows zeroes instead of real values.
3. **Time window mismatch** — the UI subtitle says "this week" but the backend aggregates from `startOfMonth`. The subtitle is correct in intent; the backend window is wrong.

Additionally, the UI uses a plain HTML table with inline styles, misses sort controls, and has no retry path on error.

---

## Design

### Backend — `services/core/src/routes/staff-analytics.ts`

**Time window**
- Replace `startOfMonth(now)` with `startOfWeek(now, { weekStartsOn: 1 })` (Monday start).
- `date-fns` is already imported; `startOfWeek` just needs to be added to the import.

**tasksCompleted (real data)**
- After fetching `staffList`, collect all `staffProfile.id` values.
- Query `ProjectTaskCollaborator` where `staffUserId IN userIds` and join to `ProjectTask` where `task.completedAt >= weekStart`. Use Prisma's nested `where` on the relation.
- Build a `Map<staffUserId, count>` and use it per member.
- Note: `ProjectTaskCollaborator.staffUserId` is a UUID of the user account, same as `StaffProfile.userId`. The join is `collaborator.staffUserId === staff.userId`.

**department**
- Add `department: true` to the `staffProfile.findMany` select. It already exists in the schema (`StaffProfile.department String?`).

**Field names**
- Rename `utilization` → `utilizationPct` in the response mapping.
- Rename `satisfaction` → `peerRating` in the response mapping.

**Remove stale fields**
- Remove `avgTaskTime: "—"` from the response — the frontend computes this from `hoursThisWeek / tasksCompleted`.
- Remove `onTimeRate: 100` — no reliable data source; omit rather than mislead.

**Cache key**
- Change from `staff:team-performance:all` (120s) to `staff:team-performance:week:${format(weekStart, 'yyyy-MM-dd')}` (300s) using `date-fns/format`.
- Uses `yyyy-MM-dd` string (not `toISOString()`) to avoid timezone-driven key drift across server restarts.
- Week-scoped key means data is fresh per week and doesn't bleed across week boundaries.

**isSelf**
- `isSelf: true` when `staff.userId === scope.userId` (from the `x-user-id` header forwarded by the gateway). When `scope.userId` is null/undefined all rows return `isSelf: false`.

**peerRating null handling**
- When a staff member has no submitted peer reviews, `peerRating` is returned as `null` (not `0`). The frontend already handles this: `peerRatingCls(null)` returns `colorMuted2` and the cell displays `"—"`.

**Response shape (after fix)**
```typescript
{
  id:             string;
  name:           string;
  role:           string;
  department:     string | null;
  avatarInitials: string;
  hoursThisWeek:  number;
  tasksCompleted: number;      // real count from ProjectTaskCollaborator
  utilizationPct: number;      // renamed from utilization
  peerRating:     number | null; // renamed from satisfaction (null when no reviews)
  isSelf:         boolean;
}
```

---

### Frontend — `apps/web/src/lib/api/staff/performance.ts`

- `StaffTeamMember` interface already has the correct field names (`utilizationPct`, `peerRating`). No type changes needed.

---

### Frontend — `apps/web/src/components/staff/staff-dashboard/pages/team-performance-page.tsx`

**KPI stat cards**
- Replace `staffKpiStrip` / `staffKpiCell` with `tpmStatGrid` / `tpmStatCard` / `tpmStatCardTop` / `tpmStatCardDivider` / `tpmStatCardBottom`. These classes are **already defined** in `pages-g.module.css` — no new CSS needed for this change. They provide a large number on top, a thin divider, and a mono label below.

**Sort pills**
- Add `sortKey: "util" | "name" | "tasks" | "csat"` and `sortDir: "asc" | "desc"` state (defaults: `"util"`, `"desc"`).
- Clicking a pill that is already active toggles direction; clicking a different pill sets it as active (default direction: desc for numbers, asc for name).
- String sort (name) uses `localeCompare`; numeric sorts use subtraction.
- Render 4 pills in the section header: **Util ↓** · **Name** · **Tasks** · **CSAT**. Active pill uses `tpmSortPillActive`, inactive uses `tpmSortPill`.
- Arrow indicator in pill label reflects current direction when active.
- Sorted array replaces the current hardcoded `sort((a,b) => b.utilizationPct - a.utilizationPct)`.

**Utilization column**
- Replace the plain `{m.utilizationPct}%` span with a `tpmUtilCell` div containing:
  - `tpmUtilTrack` div (60px × 4px background track)
  - `tpmUtilFill` div with `style={{ width: \`${Math.min(100, m.utilizationPct)}%\` }}` — clamped to 100 max so values above 100% don't overflow the track
  - Percentage text span showing the raw value (e.g. `103%` is valid and should show as-is, only the bar is capped)
- Color logic (both bar fill and text): green ≥ 85%, amber ≥ 60%, red < 60%.
- Update `utilizationCls()` helper to return `"colorRed"` when `u < 60` (currently falls through to amber). This helper is used for the text colour next to the bar.
- `tasksCompleted: 0` is a valid real value (staff with no completed tasks this week) and renders as `0`, not `"—"`.

**Avg Time column**
- Keep the "Avg Time" column and the local `avgTaskTime()` helper — it computes `hoursThisWeek / tasksCompleted` from local fields and still works correctly after the backend change. When `tasksCompleted` is `0` it returns `"—"` as before.

**Error handling fix**
- The current `useEffect` only calls `setError` inside `.catch` (thrown errors). API-level errors returned as `result.error` are silently dropped. Fix: after the `getStaffTeamPerformance` call, check `result.error` and call `setError(result.error.message)` so the error UI and Retry button are shown for all failure paths.

**Self-row highlight**
- Add `tpmSelfRow` class to the `<tr>` when `m.isSelf === true`.
- In the member name cell, append a `<span className={cx("tpmSelfBadge")}>you</span>` after the name when `m.isSelf`.

**Inline style removal**
- The current `style={{ display: "flex", alignItems: "center", gap: 8 }}` wrapper in the member cell is replaced with `cx("tpmMemberHead")` — this class is already defined in `pages-g.module.css`.

**Error state**
- Add a `retryCount` state variable (number, default 0).
- Error state renders a Retry button that calls `setRetryCount(c => c + 1)`.
- Add `retryCount` to the `useEffect` dependency array so it re-fetches on increment.

---

### CSS — `apps/web/src/app/style/staff/pages-g.module.css`

Seven new classes appended after the existing TPM block (`tpmStatGrid` and related KPI classes are pre-existing and need no additions):

| Class | Purpose |
|---|---|
| `.tpmSelfRow` | Accent-tinted row: `background: rgba(249,115,22,0.05)`, `border-top/bottom: 1px solid rgba(249,115,22,0.1)` |
| `.tpmSelfBadge` | "you" pill: `background: var(--accent-d)`, `border: 1px solid rgba(249,115,22,0.2)`, `color: var(--accent)`, 8px DM Mono, uppercase, `border-radius: 3px`, `padding: 1px 5px` |
| `.tpmUtilCell` | `display: flex; align-items: center; gap: 6px; justify-content: flex-end` |
| `.tpmUtilTrack` | `width: 60px; height: 4px; background: var(--b1); border-radius: 2px; overflow: hidden; flex-shrink: 0` |
| `.tpmUtilFill` | `height: 100%; border-radius: 2px` — width set inline; background color via `bgGreen` / `bgAmber` / `bgRed` utility classes (defined in `core.module.css`, these set `background`, not `color`). Use the same tier thresholds as the text colour. |
| `.tpmSortPill` | `background: var(--s2); border: 1px solid var(--b2); border-radius: 4px; padding: 3px 8px; font-size: 9px; font-family: var(--font-dm-mono); color: var(--muted); letter-spacing: .06em; text-transform: uppercase; cursor: pointer` |
| `.tpmSortPillActive` | `background: var(--accent-d); border-color: rgba(249,115,22,0.25); color: var(--accent)` |

---

## What Does Not Change

- API endpoint path, gateway proxy, auth headers
- `StaffTeamMember` TypeScript interface (already correct)
- Avatar color hash logic (`avatarCls`)
- `initials()` helper
- `peerRatingCls()` thresholds
- Loading skeleton (3 skeleton blocks)
- Empty state copy and icon
- Page header eyebrow / title / subtitle

---

## Files Changed

| File | Change type |
|---|---|
| `services/core/src/routes/staff-analytics.ts` | Backend data fix |
| `apps/web/src/app/style/staff/pages-g.module.css` | 7 new CSS classes |
| `apps/web/src/components/staff/staff-dashboard/pages/team-performance-page.tsx` | UI redesign + sort + retry |

`apps/web/src/lib/api/staff/performance.ts` — **no changes needed** (types already correct).

---

## Out of Scope

- Department filter pill (deferred — can be added in a follow-up)
- On-time rate calculation (no reliable data source in current schema)
- Individual member drill-down / click-through
- Peer review submission flow

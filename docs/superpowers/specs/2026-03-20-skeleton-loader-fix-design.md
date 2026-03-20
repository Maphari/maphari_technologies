# Skeleton Loader Fix — Design Spec

**Date:** 2026-03-20
**Scope:** All 3 dashboards (client, staff, admin) — ~187 pages
**Goal:** Eliminate permanently-stuck skeleton loaders so every page resolves to either real data or a clear empty state within the time it takes for the API to respond.

---

## Problem Statement

Skeleton loaders across all three dashboards never resolve. Users see animated grey bars indefinitely. Root cause is three compounding issues:

1. **Guards without cleanup** — `useEffect` hooks guard on `if (!session || !projectId) return` but never call `setLoading(false)` before returning. If a user has no active project, the skeleton stays forever.
2. **Missing `.finally()` blocks** — Only ~45% of effects that set `loading = true` have a `.finally(() => setLoading(false))`. Any API error leaves the loading state stuck.
3. **Client dashboard missing `isActive` prop** — The client orchestrator (`maphari-client-dashboard.tsx`) conditionally renders pages but never passes `isActive`. Pages that guard effects on `isActive` never fetch.

---

## Architecture

No new components, no new routes, no refactoring of the data layer. This is a pure correctness fix — the same 3-line pattern applied systematically across all affected pages.

### The Fix Pattern

**Before (broken):**
```tsx
const [loading, setLoading] = useState(true);

useEffect(() => {
  if (!session || !projectId) return; // ← loading stays true forever
  setLoading(true);
  loadData(session, projectId)
    .then((res) => setData(res.data))
    .catch(() => notify("error", "Failed to load"));
  // ← no finally
}, [session, projectId]);
```

**After (fixed):**
```tsx
const [loading, setLoading] = useState(true);

useEffect(() => {
  if (!isActive) return;
  if (!session || !projectId) { setLoading(false); return; } // ← always resolves
  setLoading(true);
  loadData(session, projectId)
    .then((res) => {
      setData(res.data);
      if (res.nextSession) saveSession(res.nextSession);
    })
    .catch(() => notify("error", "Failed to load"))
    .finally(() => setLoading(false)); // ← always resolves
}, [isActive, session, projectId]);
```

### The Three Changes

**Change 1: Guard exits call `setLoading(false)`**
Every early return in a `useEffect` that owns a loading state must resolve it before returning.

```tsx
// Every guard becomes:
if (!session || !projectId) { setLoading(false); return; }
```

**Change 2: `.finally()` on every effect that sets loading**
No exceptions. Whether the API call succeeds, fails, or throws, `setLoading(false)` runs.

```tsx
loadData(session, projectId)
  .then(handleSuccess)
  .catch(handleError)
  .finally(() => setLoading(false));
```

**Change 3: Pass `isActive` from client dashboard orchestrator**
`maphari-client-dashboard.tsx` renders pages conditionally but never passes `isActive`. Each page render gets the prop added:

```tsx
// Before:
{nav.activePage === "dashboard" && (
  <DashboardPage projects={...} onNavigate={handleNavigate} />
)}

// After:
{nav.activePage === "dashboard" && (
  <DashboardPage
    isActive={nav.activePage === "dashboard"}
    projects={...}
    onNavigate={handleNavigate}
  />
)}
```

Pages that already accept `isActive` in their props type use it to guard effects. Pages that don't accept it yet get the prop added to their props type.

---

## Scope

### Client Dashboard
- **Orchestrator change:** `maphari-client-dashboard.tsx` — add `isActive` to every page render call (~73 pages)
- **Page changes:** Every page with `useState(true)` loading init — add guard exits + `.finally()` (~51 pages)

### Staff Dashboard
- **Page changes:** Pages with local `useState(true)` loading — add `.finally()` and guard exits (~40 pages)
- No orchestrator change needed (staff already passes `isActive`)

### Admin Dashboard
- **Orchestrator change:** `maphari-dashboard.tsx` — add `isActive` to page render calls (~96 pages)
- **Page changes:** Pages with local `useState(true)` loading — add guard exits + `.finally()` (~63 pages)

### Staff CSS file referenced
- `apps/web/src/app/style/staff/maphari-staff-dashboard.module.css`

---

## Empty State Behaviour

When loading resolves with no data (API returned empty array or null), pages must not show a skeleton. They must show a clear empty state. The shared `emptyState` + `emptyStateTitle` + `emptyStateSub` classes (already defined in the shared CSS module) are used for this.

Pattern:
```tsx
{loading ? (
  <SkeletonCard /> // or existing skeleton markup
) : data.length === 0 ? (
  <div className={cx("emptyState")}>
    <div className={cx("emptyStateTitle")}>No data yet</div>
    <div className={cx("emptyStateSub")}>Check back once your project is active</div>
  </div>
) : (
  <DataList items={data} />
)}
```

---

## What This Does NOT Change

- No API endpoints changed
- No data flow architecture changed
- No component hierarchy changed
- No CSS changed
- Staff dashboard prop-driven pages (which receive data from orchestrator hooks) are out of scope — they have no local loading state to fix

---

## Success Criteria

- Every page in all 3 dashboards resolves its skeleton within API response time
- Pages with no data show an empty state message, not a skeleton
- No "Can't perform a React state update on an unmounted component" warnings in console
- TypeScript compiles clean after changes (`pnpm --filter @maphari/web exec tsc --noEmit`)

---

## File Map

| File | Change |
|------|--------|
| `apps/web/src/components/client/maphari-client-dashboard.tsx` | Add `isActive` prop to all 73 page renders |
| `apps/web/src/components/admin/maphari-dashboard.tsx` | Add `isActive` prop to all 96 page renders |
| `apps/web/src/components/client/maphari-dashboard/pages/*.tsx` | Guard exits + `.finally()` on all ~51 loading pages |
| `apps/web/src/components/staff/staff-dashboard/pages/*.tsx` | `.finally()` on all ~40 loading pages |
| `apps/web/src/components/admin/dashboard/pages/*.tsx` | Guard exits + `.finally()` on all ~63 loading pages |

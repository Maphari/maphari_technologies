# Skeleton Loader Fix — Design Spec

**Date:** 2026-03-20
**Scope:** All 3 dashboards (client ~49 pages, staff ~71 pages, admin ~62 pages = ~182 pages with local loading state)
**Goal:** Eliminate permanently-stuck skeleton loaders so every page resolves to real data, an empty state, or an error state within API response time.

---

## Problem Statement

Skeleton loaders across all three dashboards never resolve. Users see animated grey bars indefinitely. Two compounding root causes:

**Root cause 1 — Guard exits don't resolve loading:**
`useEffect` hooks guard on `if (!session || !projectId) return` but never call `setLoading(false)` before returning. If a user has no active project, loading initialises to `true` and stays there forever because the effect body never runs.

**Root cause 2 — Missing `.finally()` blocks:**
Only ~45% of effects that set `loading = true` call `setLoading(false)` in a `.finally()` block. The rest only call it on the happy path, so any API error leaves the skeleton permanently visible.

> **Note on `isActive`:** Pages in all three dashboards are conditionally rendered with `&&` (e.g. `{activePage === "dashboard" && <DashboardPage />}`). This means pages only mount when active — `isActive` is implicitly always `true` at mount time. No `isActive` prop change is required. The audit initially suggested this as a root cause; further analysis showed it is not.

> **Note on `useState(false)` pages:** A prior fix (`39df08b`) already corrected pages initialised with `useState(false)`. This spec only targets pages where `loading` is initialised to `true`.

---

## The Fix Pattern

### State machine

Every page with a loading state must implement this four-state machine:

| State | Condition | UI |
|-------|-----------|-----|
| `loading` | `loading === true` | Skeleton / spinner |
| `error` | `error !== null` | Error message with retry |
| `empty` | `loading === false && data.length === 0` | Empty state message |
| `data` | `loading === false && data.length > 0` | Content |

### Before (broken)
```tsx
const [loading, setLoading] = useState(true);

useEffect(() => {
  if (!session || !projectId) return; // ← loading stays true forever
  setLoading(true);
  loadData(session, projectId)
    .then((res) => setData(res.data))
    .catch(() => notify("error", "Failed to load"));
  // ← no finally → any error leaves skeleton stuck
}, [session, projectId]);
```

### After (fixed)
```tsx
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  if (!session || !projectId) {
    setLoading(false); // ← always resolves, even with no data to fetch
    return;
  }
  setLoading(true);
  setError(null);
  loadData(session, projectId)
    .then((res) => {
      setData(res.data ?? []);
      if (res.nextSession) saveSession(res.nextSession); // standard session refresh pattern
    })
    .catch(() => setError("Failed to load. Try refreshing the page."))
    .finally(() => setLoading(false)); // ← always resolves
}, [session, projectId]);
```

### JSX state machine
```tsx
{loading ? (
  <SkeletonBlock /> // or existing skeleton markup
) : error ? (
  <div className={cx("emptyState")}>
    <div className={cx("emptyStateTitle")}>Something went wrong</div>
    <div className={cx("emptyStateSub")}>{error}</div>
  </div>
) : data.length === 0 ? (
  <div className={cx("emptyState")}>
    <div className={cx("emptyStateTitle")}>Nothing here yet</div>
    <div className={cx("emptyStateSub")}>Data will appear once your project is active</div>
  </div>
) : (
  <DataList items={data} />
)}
```

### Pages with multiple loading states

Many pages have 2–5 independent `useState(true)` loading flags for different data sections. Each flag follows the same fix independently:

```tsx
const [invoicesLoading, setInvoicesLoading] = useState(true);
const [milestonesLoading, setMilestonesLoading] = useState(true);

// Each useEffect owns exactly one loading flag.
// Guards on that flag's dependencies.
// Calls setXxxLoading(false) in finally AND on early return.
```

Do NOT combine multiple loading states into one boolean unless they genuinely represent a single fetch. Premature combination causes one slow fetch to block all content.

---

## Finding Affected Files

### Discovery — exact grep patterns

**Pages initialised with `useState(true)` (primary target):**
```bash
grep -rln "useState(true)" \
  apps/web/src/components/client/maphari-dashboard/pages/ \
  apps/web/src/components/staff/staff-dashboard/pages/ \
  apps/web/src/components/admin/dashboard/pages/
```

**Pages missing `.finally()`  (check against the above list):**
```bash
grep -rLn "\.finally(" \
  apps/web/src/components/client/maphari-dashboard/pages/ \
  apps/web/src/components/staff/staff-dashboard/pages/ \
  apps/web/src/components/admin/dashboard/pages/
```

**Pages with unguarded early returns (no setLoading call before return):**
```bash
grep -n "return;" apps/web/src/components/client/maphari-dashboard/pages/dashboard-page.tsx
# Repeat per file — look for bare `return;` inside a useEffect that owns a loading state
```

---

## `isActive` Prop Guidance

No `isActive` prop changes are needed in orchestrators. However, some pages already declare `isActive?: boolean` in their props type but don't use it. Leave these as-is — do not remove them (they may be used by future tab-style navigation).

If a page does NOT have `isActive` in its props and you need to add it for a future use case, use the optional form: `isActive?: boolean`.

---

## Error State

The `.catch()` block sets a local `error` state string. It also calls `notify("error", message)` for an immediate toast. Both:

```tsx
.catch((err) => {
  const msg = err?.message ?? "Failed to load";
  setError(msg);
  notify("error", msg);
})
```

The toast gives immediate feedback. The inline error state persists in the UI for users who miss the toast.

---

## Race Condition Policy

Race conditions (two fetches in flight when `session` changes mid-request) are **out of scope** for this fix. They are a pre-existing issue and require `AbortController` integration that is a separate body of work. The `.finally()` fix is sufficient to unblock stuck skeletons; race conditions cause a different symptom (stale data flicker, not permanent skeletons).

---

## Scope

### Client Dashboard — ~49 pages
- **Location:** `apps/web/src/components/client/maphari-dashboard/pages/`
- **Orchestrator:** `apps/web/src/components/client/maphari-client-dashboard.tsx` — no changes needed
- **Fix per page:** Guard exits + `.finally()` + error state

### Staff Dashboard — ~71 pages
- **Location:** `apps/web/src/components/staff/staff-dashboard/pages/`
- **Orchestrator:** `apps/web/src/components/staff/maphari-staff-dashboard.tsx` — no changes needed
- **Fix per page:** `.finally()` + error state (guards largely already correct)

### Admin Dashboard — ~62 pages
- **Location:** `apps/web/src/components/admin/dashboard/pages/`
- **Orchestrator:** `apps/web/src/components/admin/maphari-dashboard.tsx` — no changes needed
- **Fix per page:** Guard exits + `.finally()` + error state

**Total pages with local loading state: ~182**
The remaining ~69 pages in the three dashboards are fully prop-driven (no local loading state) and are not in scope.

---

## Batching Strategy

Apply fixes in 6 batches matching the existing loading-fix commit convention (batches A–H were used for a prior related fix):

| Batch | Dashboard | Pages | Commit prefix |
|-------|-----------|-------|---------------|
| I | Client pages 1–17 | ~17 | `fix(loading): batch I` |
| J | Client pages 18–34 | ~17 | `fix(loading): batch J` |
| K | Client pages 35–49 | ~15 | `fix(loading): batch K` |
| L | Staff pages 1–24 | ~24 | `fix(loading): batch L` |
| M | Staff pages 25–48 | ~24 | `fix(loading): batch M` |
| N | Staff pages 49–71 | ~23 | `fix(loading): batch N` |
| O | Admin pages 1–31 | ~31 | `fix(loading): batch O` |
| P | Admin pages 32–62 | ~31 | `fix(loading): batch P` |

Each batch is a single commit. TypeScript must compile clean before each commit.

---

## What This Does NOT Change

- No API endpoints
- No component hierarchy
- No CSS
- No orchestrator files
- No prop-driven pages (those with no local loading state)

---

## Success Criteria

**Measurable:**
- `pnpm --filter @maphari/web exec tsc --noEmit` — zero errors after all batches
- `grep -rn "useState(true)" apps/web/src/components/*/` returns only intentional uses (e.g. modal open state, not data loading)
- Zero pages show skeleton after 5 seconds with a valid session and active project

**Verification method:**
1. Log in as a client with at least one active project
2. Navigate to each of the 10 highest-traffic client pages (Dashboard, Invoices, Projects, Milestones, Messages, Files, Meetings, Deliverables, Approvals, Reports)
3. Confirm each resolves to content or empty state within 3 seconds
4. Log in as a client with NO active project — confirm pages show empty state, not skeleton
5. Disconnect network mid-load — confirm pages show error state, not skeleton

**Out of scope for verification:** All 154 pages individually. Spot-check by batch after each commit.

# Loading & Error States Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add loading skeleton and error state UI to all 250 dashboard pages that are currently missing them across admin, staff, and client dashboards.

**Architecture:** Two-pass approach — Task 1 adds shared CSS height utilities so skeleton blocks have defined heights in all dashboards. Tasks 2–9 apply the standard loading/error pattern to each page batch. Each page gets: (a) `loading` state rendered as skeleton blocks, (b) `error` state rendered as an error card with message.

**Tech Stack:** React 18, CSS Modules, Next.js 16, TypeScript. CSS class system via `cx()` from `"../style"`. All dashboards share `skeletonBlock` (shimmer animation) from shared utilities. Height utilities `skeleH40/44/68/80` must be in shared CSS so they work in admin and staff (not just client).

---

## Patterns Reference

### Pattern A — Page HAS `loading` state, no skeleton JSX

These pages already declare `const [loading, setLoading] = useState(...)` and set it correctly in their data fetch. They just don't render anything for it.

**Change needed:** Add an early-return block right before the `return (` of the main JSX:

```tsx
if (loading) {
  return (
    <div className={cx("pageBody")}>
      <div className={cx("flexCol", "gap12")}>
        <div className={cx("skeletonBlock", "skeleH68")} />
        <div className={cx("skeletonBlock", "skeleH80")} />
        <div className={cx("skeletonBlock", "skeleH68")} />
      </div>
    </div>
  );
}
```

**Some pages have an existing loading early return** (e.g. `return <div>Loading...</div>` or `return <div className={cx("colorMuted","text13")}>Loading data…</div>`). Replace these with the skeleton block pattern above.

### Pattern B — Page has NO `loading` state, has `useEffect` with API call(s)

**Changes needed:**

1. Add state declarations (after existing `useState` declarations):
```tsx
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

2. Modify the `useEffect` or `load` callback to set loading:
```tsx
// At start of fetch:
setLoading(true);
setError(null);
// After fetch (in .then() or after await):
if (r.error) setError(r.error.message ?? "Failed to load.");
setLoading(false);
// Also handle early exit (no session):
if (!session) { setLoading(false); return; }
```

3. Add early-return blocks before main `return (`:
```tsx
if (loading) {
  return (
    <div className={cx("pageBody")}>
      <div className={cx("flexCol", "gap12")}>
        <div className={cx("skeletonBlock", "skeleH68")} />
        <div className={cx("skeletonBlock", "skeleH80")} />
        <div className={cx("skeletonBlock", "skeleH68")} />
      </div>
    </div>
  );
}

if (error) {
  return (
    <div className={cx("pageBody")}>
      <div className={cx("errorState")}>
        <div className={cx("errorStateIcon")}>✕</div>
        <div className={cx("errorStateTitle")}>Failed to load</div>
        <div className={cx("errorStateSub")}>{error}</div>
      </div>
    </div>
  );
}
```

### Pattern C — Page already calls `onNotify("error", ...)` on API failure

No change needed for error handling — `onNotify` toast already covers it. Just add the skeleton loading block (Pattern A).

### Important: Where to insert the early return

- Find the component's main `return (` statement (the final return)
- Insert the `if (loading)` block **immediately before** it (not inside JSX)
- If there's an existing `if (loading) return <something>`, replace it entirely

### What to SKIP

Do NOT modify these files (they are prop-based/utility/static — no direct data fetch):
- `admin-page-utils.tsx`, `admin-stub-page.tsx`, `shared.tsx` — utility files
- `admin-*-page-client.tsx` wrapper files — server component wrappers
- `dashboard-page.tsx` (staff) — receives all data as props from parent
- `deliverables-page.tsx` (staff) — prop-based
- `kanban-page.tsx` (staff) — prop-based
- `daily-standup-page.tsx` (staff) — prop-based
- `keyboard-shortcuts-page.tsx` (staff) — static, no API
- `focus-mode-page.tsx` (staff) — static
- `settings-page.tsx` (staff) — may be static
- `dashboard-page.tsx` (client) — check if prop-based before modifying
- Pages already in hero page list that have adequate loading: `home-page.tsx` (client), `billing-page.tsx` (client)

---

## File Structure

All TSX changes are in-place modifications. No new files created.

**CSS change:**
- Modify: `apps/web/src/app/style/shared/utilities.module.css` — add 4 skeleton height classes

**TSX changes by batch:**
- Batch A (Task 2): 16 admin pages
- Batch B (Task 3): 16 admin pages
- Batch C (Task 4): 16 admin pages + admin pages needing full Pattern B
- Batch D (Task 5): 20 staff pages
- Batch E (Task 6): 20 staff pages
- Batch F (Task 7): remaining staff pages + staff pages needing Pattern B
- Batch G (Task 8): 20 client pages
- Batch H (Task 9): remaining client pages

---

## Task 1: Add Skeleton Height CSS Utilities to Shared

**Files:**
- Modify: `apps/web/src/app/style/shared/utilities.module.css`

**Context:** `skeletonBlock` is already defined in this file (lines ~1382). `skeleH40`/`skeleH68`/`skeleH80` are only in `client/pages-misc.module.css`, so admin and staff pages can't use them. Admin pages already reference `skeleH40`/`skeleH68` (they silently fail). Add them to shared so all 3 dashboards can use them.

- [ ] **Step 1: Add skeleton height classes after `.skeletonBlock`**

Find the `.skeletonBlock` block in `apps/web/src/app/style/shared/utilities.module.css` and add immediately after its closing `}`:

```css
/* Skeleton height utilities (used by all 3 dashboards) */
.skeleH40  { height: 40px;  border-radius: var(--r-sm, 8px); background: var(--s3); animation: shimmer 1.4s infinite linear; }
.skeleH44  { height: 44px;  border-radius: var(--r-sm, 8px); background: var(--s3); animation: shimmer 1.4s infinite linear; }
.skeleH68  { height: 68px;  border-radius: var(--r-sm, 8px); background: var(--s3); animation: shimmer 1.4s infinite linear; }
.skeleH80  { height: 80px;  border-radius: var(--r-sm, 8px); background: var(--s3); animation: shimmer 1.4s infinite linear; }
.skeleH120 { height: 120px; border-radius: var(--r-sm, 8px); background: var(--s3); animation: shimmer 1.4s infinite linear; }
```

- [ ] **Step 2: Verify TS check passes**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/style/shared/utilities.module.css
git commit -m "feat(css): add skeleH40/44/68/80/120 skeleton height utilities to shared CSS"
```

---

## Task 2: Admin Pages — Skeleton Loading Batch A (Pattern A)

**Files to modify** (all in `apps/web/src/components/admin/dashboard/pages/`):
1. `access-control-page.tsx`
2. `active-health-monitor-page.tsx`
3. `ai-action-recommendations-page.tsx`
4. `automation-audit-trail-page.tsx`
5. `booking-appointments-page.tsx`
6. `brand-control-page.tsx`
7. `business-development-page.tsx`
8. `capacity-forecast-page.tsx`
9. `cash-flow-calendar-page.tsx`
10. `change-request-manager-page.tsx`
11. `client-health-scorecard-page.tsx`
12. `client-onboarding-page.tsx`
13. `client-satisfaction-page.tsx`
14. `closeout-review-page.tsx`
15. `communication-audit-page.tsx`
16. `document-vault-page.tsx`

**Context:** All 16 pages already have `const [loading, setLoading] = useState(...)` but render nothing while loading (Pattern A). The `cx` function is already imported from `"../style"`. `skeletonBlock`, `skeleH68`, `skeleH80` are now in shared utilities.

**Verification command:** `pnpm --filter @maphari/web exec tsc --noEmit`

- [ ] **Step 1: For each of the 16 files, add skeleton loading early-return**

Read each file. Find the component's main `return (` line (the final `return` — usually near the bottom of the component function). Immediately before it, insert:

```tsx
if (loading) {
  return (
    <div className={cx("pageBody")}>
      <div className={cx("flexCol", "gap12")}>
        <div className={cx("skeletonBlock", "skeleH68")} />
        <div className={cx("skeletonBlock", "skeleH80")} />
        <div className={cx("skeletonBlock", "skeleH68")} />
      </div>
    </div>
  );
}
```

**If the file already has a loading early-return** (e.g. `if (loading) return <div>Loading...</div>` or `if (loading) return (<div>Loading data…</div>)`), replace it with the skeleton pattern above.

For pages where `cx` is called with `styles.*` properties (e.g. `cx(styles.pageBody)`), use `cx(styles.pageBody)` instead of `cx("pageBody")`.

**Check per file:** after adding, verify that:
- The `if (loading)` block is BEFORE the main `return (`, not inside JSX
- The `loading` variable is in scope (it's already declared in the component)
- The `cx` function is imported

- [ ] **Step 2: Run TS check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```
Expected: no output. Fix any TS errors before committing.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/admin/dashboard/pages/access-control-page.tsx \
        apps/web/src/components/admin/dashboard/pages/active-health-monitor-page.tsx \
        apps/web/src/components/admin/dashboard/pages/ai-action-recommendations-page.tsx \
        apps/web/src/components/admin/dashboard/pages/automation-audit-trail-page.tsx \
        apps/web/src/components/admin/dashboard/pages/booking-appointments-page.tsx \
        apps/web/src/components/admin/dashboard/pages/brand-control-page.tsx \
        apps/web/src/components/admin/dashboard/pages/business-development-page.tsx \
        apps/web/src/components/admin/dashboard/pages/capacity-forecast-page.tsx \
        apps/web/src/components/admin/dashboard/pages/cash-flow-calendar-page.tsx \
        apps/web/src/components/admin/dashboard/pages/change-request-manager-page.tsx \
        apps/web/src/components/admin/dashboard/pages/client-health-scorecard-page.tsx \
        apps/web/src/components/admin/dashboard/pages/client-onboarding-page.tsx \
        apps/web/src/components/admin/dashboard/pages/client-satisfaction-page.tsx \
        apps/web/src/components/admin/dashboard/pages/closeout-review-page.tsx \
        apps/web/src/components/admin/dashboard/pages/communication-audit-page.tsx \
        apps/web/src/components/admin/dashboard/pages/document-vault-page.tsx
git commit -m "feat(loading): add skeleton loading states to admin pages batch A (16 pages)"
```

---

## Task 3: Admin Pages — Skeleton Loading Batch B (Pattern A)

**Files to modify** (all in `apps/web/src/components/admin/dashboard/pages/`):
1. `eod-digest-page.tsx`
2. `executive-dashboard-page.tsx`
3. `financial-year-closeout-page.tsx`
4. `health-interventions-page.tsx`
5. `legal-page.tsx`
6. `lifecycle-dashboard-page.tsx`
7. `messages-page.tsx`
8. `performance-page.tsx`
9. `pipeline-analytics-page.tsx`
10. `portfolio-risk-register-page.tsx`
11. `pricing-page.tsx`
12. `profitability-per-client-page.tsx`
13. `profitability-per-project-page.tsx`
14. `project-briefing-page.tsx`
15. `referral-tracking-page.tsx`
16. `request-inbox-page.tsx`

**Context:** Same as Task 2 — all have `loading` state, need skeleton JSX.

**Special note for `executive-dashboard-page.tsx`:** This file currently has an early return at approximately line 160 that renders the page header + a text "Loading executive data…". Replace **only the text/loading content** with the skeleton blocks, keeping the page header structure. Or simpler: replace the entire if block with:

```tsx
if (loading) {
  return (
    <div className={styles.pageBody}>
      <div className={cx("flexCol", "gap12")}>
        <div className={cx("skeletonBlock", "skeleH68")} />
        <div className={cx("skeletonBlock", "skeleH80")} />
        <div className={cx("skeletonBlock", "skeleH68")} />
      </div>
    </div>
  );
}
```

- [ ] **Step 1: Apply Pattern A to all 16 files** (same instructions as Task 2 Step 1)

- [ ] **Step 2: Run TS check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/admin/dashboard/pages/eod-digest-page.tsx \
        apps/web/src/components/admin/dashboard/pages/executive-dashboard-page.tsx \
        apps/web/src/components/admin/dashboard/pages/financial-year-closeout-page.tsx \
        apps/web/src/components/admin/dashboard/pages/health-interventions-page.tsx \
        apps/web/src/components/admin/dashboard/pages/legal-page.tsx \
        apps/web/src/components/admin/dashboard/pages/lifecycle-dashboard-page.tsx \
        apps/web/src/components/admin/dashboard/pages/messages-page.tsx \
        apps/web/src/components/admin/dashboard/pages/performance-page.tsx \
        apps/web/src/components/admin/dashboard/pages/pipeline-analytics-page.tsx \
        apps/web/src/components/admin/dashboard/pages/portfolio-risk-register-page.tsx \
        apps/web/src/components/admin/dashboard/pages/pricing-page.tsx \
        apps/web/src/components/admin/dashboard/pages/profitability-per-client-page.tsx \
        apps/web/src/components/admin/dashboard/pages/profitability-per-project-page.tsx \
        apps/web/src/components/admin/dashboard/pages/project-briefing-page.tsx \
        apps/web/src/components/admin/dashboard/pages/referral-tracking-page.tsx \
        apps/web/src/components/admin/dashboard/pages/request-inbox-page.tsx
git commit -m "feat(loading): add skeleton loading states to admin pages batch B (16 pages)"
```

---

## Task 4: Admin Pages — Skeleton Loading Batch C (Pattern A + Pattern B)

**Pattern A pages** (have `loading` state — just add skeleton):
1. `resource-allocation-page.tsx`
2. `revenue-forecasting-page.tsx`
3. `revops-dashboard-page.tsx`
4. `service-catalog-manager-page.tsx`
5. `sla-tracker-page.tsx`
6. `sprint-board-admin-page.tsx`
7. `staff-access-page.tsx`
8. `staff-utilisation-page.tsx`
9. `stakeholder-directory-page.tsx`
10. `support-queue-page.tsx`
11. `team-performance-report-page.tsx`
12. `team-structure-page.tsx`
13. `timeline-gantt-page.tsx`
14. `update-queue-manager-page.tsx`
15. `webhook-hub-page.tsx`

**Pattern B pages** (NO `loading` state — add loading/error state vars + skeleton + error JSX):
16. `announcements-manager-page.tsx`
17. `client-journey-page.tsx`
18. `content-approval-page.tsx`
19. `design-review-admin-page.tsx`
20. `expense-tracker-page.tsx`
21. `handover-management-page.tsx`
22. `knowledge-base-admin-page.tsx`
23. `leads-page.tsx`
24. `learning-development-page.tsx`
25. `leave-absence-page.tsx`
26. `loyalty-credits-page.tsx`
27. `meeting-archive-page.tsx`
28. `notifications-page.tsx`
29. `peer-review-queue-page.tsx`
30. `platform-infrastructure-page.tsx`
31. `project-operations-page.tsx`
32. `prospecting-page.tsx`
33. `quality-assurance-page.tsx`
34. `recruitment-pipeline-page.tsx`
35. `standup-feed-page.tsx`
36. `strategic-client-intelligence-page.tsx`
37. `vendor-cost-control-page.tsx`

**Context:** Pattern B pages have `useEffect` + API calls but no `loading` state. They only take a `session: AuthSession | null` prop (no `onNotify`). Add `loading` + `error` state, wrap the fetch to set them, and render both the skeleton and error states.

All are in `apps/web/src/components/admin/dashboard/pages/`.

- [ ] **Step 1: Apply Pattern A to the 15 Pattern-A files** (same as Tasks 2/3)

- [ ] **Step 2: Apply Pattern B to the 22 Pattern-B files**

For each file:

a. Read the file to understand the `useEffect` data fetch structure.

b. Add state declarations immediately after the existing `useState` declarations at the top of the component:
```tsx
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

c. Modify the `useEffect` to set loading. The typical pattern in these files is:
```tsx
useEffect(() => {
  if (!session) return;
  void loadFooWithRefresh(session).then((r) => {
    if (r.nextSession) saveSession(r.nextSession);
    if (!r.error && r.data) setFoo(r.data);
  });
}, [session]);
```
Change to:
```tsx
useEffect(() => {
  if (!session) { setLoading(false); return; }
  setLoading(true);
  setError(null);
  void loadFooWithRefresh(session).then((r) => {
    if (r.nextSession) saveSession(r.nextSession);
    if (r.error) setError(r.error.message ?? "Failed to load.");
    else if (r.data) setFoo(r.data);
    setLoading(false);
  });
}, [session]);
```
If the page uses `Promise.all()` for multiple fetches, wrap the `.then()` similarly. The `setLoading(false)` must be called in all paths.

d. Add both early-return blocks before the main `return (`:
```tsx
if (loading) {
  return (
    <div className={cx("pageBody")}>
      <div className={cx("flexCol", "gap12")}>
        <div className={cx("skeletonBlock", "skeleH68")} />
        <div className={cx("skeletonBlock", "skeleH80")} />
        <div className={cx("skeletonBlock", "skeleH68")} />
      </div>
    </div>
  );
}

if (error) {
  return (
    <div className={cx("pageBody")}>
      <div className={cx("errorState")}>
        <div className={cx("errorStateIcon")}>✕</div>
        <div className={cx("errorStateTitle")}>Failed to load</div>
        <div className={cx("errorStateSub")}>{error}</div>
      </div>
    </div>
  );
}
```

**Important:** For pages that use `styles.pageBody` (via `cx(styles.pageBody)`), use that. For pages that use `cx("pageBody")` (string utility), use that. Check the existing `return (` to see which pattern the page uses.

- [ ] **Step 3: Run TS check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```
Fix any TS errors. The most common issue: if `useState` isn't imported, add it to the import. Verify `setLoading(false)` is always called (not gated by an if).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/admin/dashboard/pages/
git commit -m "feat(loading): add skeleton + error states to admin pages batch C (37 pages)"
```

---

## Task 5: Staff Pages — Skeleton Loading Batch D (Pattern A)

**Files to modify** (all in `apps/web/src/components/staff/staff-dashboard/pages/`):
1. `appointments-page.tsx`
2. `approval-queue-page.tsx`
3. `auto-draft-updates-page.tsx`
4. `automations-page.tsx`
5. `brand-kit-page.tsx`
6. `change-requests-page.tsx`
7. `client-budget-page.tsx`
8. `client-health-page.tsx`
9. `client-health-summary-page.tsx`
10. `client-journey-page.tsx`
11. `client-onboarding-page.tsx`
12. `client-team-page.tsx`
13. `close-out-report-page.tsx`
14. `contract-viewer-page.tsx`
15. `decision-log-page.tsx`
16. `delivery-status-page.tsx`
17. `estimates-vs-actuals-page.tsx`
18. `feedback-inbox-page.tsx`
19. `handover-checklist-page.tsx`
20. `incident-alerts-page.tsx`

**Context:** All 20 staff pages already have `const [loading, setLoading] = useState(...)`. The `cx` function is imported from `"../style"` in staff pages. Apply Pattern A: add skeleton early-return before the main `return (`.

**Note on staff `cx()` usage:** Staff pages use `cx("pageBody")` as string (not `styles.pageBody`). Verify by looking at the page's existing `return (` — if it uses `cx("pageBody")`, use that in the skeleton too.

- [ ] **Step 1: Apply Pattern A to all 20 files**

Same as Task 2 Step 1. Use `cx("pageBody")` (string) for the skeleton wrapper since staff pages use string class names via `cx()`.

- [ ] **Step 2: Run TS check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/staff/staff-dashboard/pages/appointments-page.tsx \
        apps/web/src/components/staff/staff-dashboard/pages/approval-queue-page.tsx \
        apps/web/src/components/staff/staff-dashboard/pages/auto-draft-updates-page.tsx \
        apps/web/src/components/staff/staff-dashboard/pages/automations-page.tsx \
        apps/web/src/components/staff/staff-dashboard/pages/brand-kit-page.tsx \
        apps/web/src/components/staff/staff-dashboard/pages/change-requests-page.tsx \
        apps/web/src/components/staff/staff-dashboard/pages/client-budget-page.tsx \
        apps/web/src/components/staff/staff-dashboard/pages/client-health-page.tsx \
        apps/web/src/components/staff/staff-dashboard/pages/client-health-summary-page.tsx \
        apps/web/src/components/staff/staff-dashboard/pages/client-journey-page.tsx \
        apps/web/src/components/staff/staff-dashboard/pages/client-onboarding-page.tsx \
        apps/web/src/components/staff/staff-dashboard/pages/client-team-page.tsx \
        apps/web/src/components/staff/staff-dashboard/pages/close-out-report-page.tsx \
        apps/web/src/components/staff/staff-dashboard/pages/contract-viewer-page.tsx \
        apps/web/src/components/staff/staff-dashboard/pages/decision-log-page.tsx \
        apps/web/src/components/staff/staff-dashboard/pages/delivery-status-page.tsx \
        apps/web/src/components/staff/staff-dashboard/pages/estimates-vs-actuals-page.tsx \
        apps/web/src/components/staff/staff-dashboard/pages/feedback-inbox-page.tsx \
        apps/web/src/components/staff/staff-dashboard/pages/handover-checklist-page.tsx \
        apps/web/src/components/staff/staff-dashboard/pages/incident-alerts-page.tsx
git commit -m "feat(loading): add skeleton loading states to staff pages batch D (20 pages)"
```

---

## Task 6: Staff Pages — Skeleton Loading Batch E (Pattern A)

**Files to modify** (all in `apps/web/src/components/staff/staff-dashboard/pages/`):
1. `intervention-actions-page.tsx`
2. `last-touched-page.tsx`
3. `meeting-prep-page.tsx`
4. `milestone-sign-off-page.tsx`
5. `my-analytics-page.tsx`
6. `my-capacity-page.tsx`
7. `my-employment-page.tsx`
8. `my-enps-page.tsx`
9. `my-integrations-page.tsx`
10. `my-portfolio-page.tsx`
11. `my-reports-page.tsx`
12. `my-risks-page.tsx`
13. `my-team-page.tsx`
14. `my-timeline-page.tsx`
15. `offboarding-tasks-page.tsx`
16. `personal-performance-page.tsx`
17. `portal-activity-page.tsx`
18. `private-notes-page.tsx`
19. `project-budget-page.tsx`
20. `project-context-page.tsx`

**Context:** Same as Task 5 — all have `loading` state, apply Pattern A.

- [ ] **Step 1: Apply Pattern A to all 20 files**
- [ ] **Step 2: Run TS check** `pnpm --filter @maphari/web exec tsc --noEmit`
- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/staff/staff-dashboard/pages/intervention-actions-page.tsx \
        apps/web/src/components/staff/staff-dashboard/pages/last-touched-page.tsx \
        apps/web/src/components/staff/staff-dashboard/pages/meeting-prep-page.tsx \
        apps/web/src/components/staff/staff-dashboard/pages/milestone-sign-off-page.tsx \
        apps/web/src/components/staff/staff-dashboard/pages/my-analytics-page.tsx \
        apps/web/src/components/staff/staff-dashboard/pages/my-capacity-page.tsx \
        apps/web/src/components/staff/staff-dashboard/pages/my-employment-page.tsx \
        apps/web/src/components/staff/staff-dashboard/pages/my-enps-page.tsx \
        apps/web/src/components/staff/staff-dashboard/pages/my-integrations-page.tsx \
        apps/web/src/components/staff/staff-dashboard/pages/my-portfolio-page.tsx \
        apps/web/src/components/staff/staff-dashboard/pages/my-reports-page.tsx \
        apps/web/src/components/staff/staff-dashboard/pages/my-risks-page.tsx \
        apps/web/src/components/staff/staff-dashboard/pages/my-team-page.tsx \
        apps/web/src/components/staff/staff-dashboard/pages/my-timeline-page.tsx \
        apps/web/src/components/staff/staff-dashboard/pages/offboarding-tasks-page.tsx \
        apps/web/src/components/staff/staff-dashboard/pages/personal-performance-page.tsx \
        apps/web/src/components/staff/staff-dashboard/pages/portal-activity-page.tsx \
        apps/web/src/components/staff/staff-dashboard/pages/private-notes-page.tsx \
        apps/web/src/components/staff/staff-dashboard/pages/project-budget-page.tsx \
        apps/web/src/components/staff/staff-dashboard/pages/project-context-page.tsx
git commit -m "feat(loading): add skeleton loading states to staff pages batch E (20 pages)"
```

---

## Task 7: Staff Pages — Remaining (Pattern A + Pattern B)

**Pattern A pages** (have `loading` state):
1. `project-documents-page.tsx`
2. `qa-checklist-page.tsx`
3. `rate-card-page.tsx`
4. `recurring-tasks-page.tsx`
5. `request-viewer-page.tsx`
6. `response-time-page.tsx`
7. `retainer-burn-page.tsx`
8. `satisfaction-scores-page.tsx`
9. `sentiment-flags-page.tsx`
10. `sla-tracker-page.tsx`
11. `smart-suggestions-page.tsx`
12. `sprint-burndown-page.tsx`
13. `sprint-planning-page.tsx`
14. `staff-handovers-page.tsx`
15. `system-status-page.tsx`
16. `task-dependencies-page.tsx`
17. `team-performance-page.tsx`
18. `vendor-directory-page.tsx`
19. `workload-heatmap-page.tsx`

**Pattern B pages** (need full loading state added):
20. `clients-page.tsx`
21. `communication-history-page.tsx`
22. `end-of-day-wrap-page.tsx`
23. `expense-submit-page.tsx`
24. `knowledge-base-page.tsx`
25. `my-learning-page.tsx`
26. `my-leave-page.tsx`
27. `my-onboarding-page.tsx`
28. `notifications-page.tsx`
29. `pay-stub-page.tsx`
30. `peer-requests-page.tsx`
31. `service-catalog-page.tsx`
32. `time-log-page.tsx`
33. `trigger-log-page.tsx`

**Context:** Pattern B staff pages typically receive `{ session, isActive }` props and use `useEffect` + direct API calls. Since they have no `onNotify` prop, add `error` state and render error JSX.

- [ ] **Step 1: Apply Pattern A to the 19 Pattern-A files**
- [ ] **Step 2: Apply Pattern B to the 14 Pattern-B files** (same instructions as Task 4 Step 2)
- [ ] **Step 3: Run TS check** `pnpm --filter @maphari/web exec tsc --noEmit`
- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/staff/staff-dashboard/pages/
git commit -m "feat(loading): add skeleton + error states to staff pages batch F (33 pages)"
```

---

## Task 8: Client Pages — Skeleton Loading Batch G (Pattern A)

**Files to modify** (all in `apps/web/src/components/client/maphari-dashboard/pages/`):
1. `activity-feed-page.tsx`
2. `approvals-page.tsx`
3. `change-requests-page.tsx`
4. `change-tracker-page.tsx`
5. `contracts-page.tsx`
6. `contracts-proposals-page.tsx`
7. `design-review-page.tsx`
8. `invoices-page.tsx`
9. `knowledge-access-page.tsx`
10. `messages-page.tsx`
11. `milestone-approvals-page.tsx`
12. `project-brief-page.tsx`
13. `project-reports-page.tsx`
14. `project-roadmap-page.tsx`
15. `quote-acceptance-page.tsx`
16. `reports-page.tsx`
17. `resource-hub-page.tsx`
18. `retainer-dashboard-page.tsx`
19. `retainer-usage-page.tsx`
20. `support-page.tsx`

**Context:** All have `loading` state. Client pages use `cx` from `"../style"`. The client dashboard's `styles` object already has `skeleH68`/`skeleH80` from `pages-misc.module.css` — and they're also now in shared utilities. Apply Pattern A.

**Note on client `cx()` usage:** Client pages typically use `cx("pageBody")` string form. Verify by checking the existing `return (` statement.

- [ ] **Step 1: Apply Pattern A to all 20 files**
- [ ] **Step 2: Run TS check** `pnpm --filter @maphari/web exec tsc --noEmit`
- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/client/maphari-dashboard/pages/activity-feed-page.tsx \
        apps/web/src/components/client/maphari-dashboard/pages/approvals-page.tsx \
        apps/web/src/components/client/maphari-dashboard/pages/change-requests-page.tsx \
        apps/web/src/components/client/maphari-dashboard/pages/change-tracker-page.tsx \
        apps/web/src/components/client/maphari-dashboard/pages/contracts-page.tsx \
        apps/web/src/components/client/maphari-dashboard/pages/contracts-proposals-page.tsx \
        apps/web/src/components/client/maphari-dashboard/pages/design-review-page.tsx \
        apps/web/src/components/client/maphari-dashboard/pages/invoices-page.tsx \
        apps/web/src/components/client/maphari-dashboard/pages/knowledge-access-page.tsx \
        apps/web/src/components/client/maphari-dashboard/pages/messages-page.tsx \
        apps/web/src/components/client/maphari-dashboard/pages/milestone-approvals-page.tsx \
        apps/web/src/components/client/maphari-dashboard/pages/project-brief-page.tsx \
        apps/web/src/components/client/maphari-dashboard/pages/project-reports-page.tsx \
        apps/web/src/components/client/maphari-dashboard/pages/project-roadmap-page.tsx \
        apps/web/src/components/client/maphari-dashboard/pages/quote-acceptance-page.tsx \
        apps/web/src/components/client/maphari-dashboard/pages/reports-page.tsx \
        apps/web/src/components/client/maphari-dashboard/pages/resource-hub-page.tsx \
        apps/web/src/components/client/maphari-dashboard/pages/retainer-dashboard-page.tsx \
        apps/web/src/components/client/maphari-dashboard/pages/retainer-usage-page.tsx \
        apps/web/src/components/client/maphari-dashboard/pages/support-page.tsx
git commit -m "feat(loading): add skeleton loading states to client pages batch G (20 pages)"
```

---

## Task 9: Client Pages — Remaining (Pattern B)

**Pattern B pages** (need full loading state added; all in `apps/web/src/components/client/maphari-dashboard/pages/`):
1. `ai-automation-page.tsx`
2. `announcements-page.tsx`
3. `book-call-page.tsx`
4. `budget-tracker-page.tsx`
5. `communication-history-page.tsx`
6. `content-approval-page.tsx`
7. `data-privacy-page.tsx`
8. `decision-log-page.tsx`
9. `deliverables-page.tsx`
10. `feedback-page.tsx`
11. `feedback-survey-page.tsx`
12. `files-page.tsx`
13. `financial-reports-page.tsx`
14. `health-score-page.tsx`
15. `invoice-history-page.tsx`
16. `knowledge-base-page.tsx`
17. `loyalty-credits-page.tsx`
18. `meeting-archive-page.tsx`
19. `meeting-booker-page.tsx`
20. `meetings-page.tsx`
21. `milestones-page.tsx`
22. `notifications-page.tsx`
23. `offboarding-page.tsx`
24. `onboarding-status-page.tsx`
25. `project-request-page.tsx`
26. `project-wrap-page.tsx`
27. `referral-portal-page.tsx`
28. `referral-program-page.tsx`
29. `risk-register-page.tsx`
30. `satisfaction-survey-page.tsx`
31. `services-growth-page.tsx`
32. `sla-escalation-page.tsx`
33. `sprint-board-page.tsx`
34. `team-page.tsx`
35. `timeline-page.tsx`

**Context:** Client pages use `useProjectLayer()` hook for session: `const { session, projectId } = useProjectLayer();`. They do NOT have an `onNotify` prop — add `error` state and render error JSX. They do direct API calls in `useEffect`.

**Client Pattern B example:**
```tsx
// Current:
export function BudgetTrackerPage({ invoices = [] }: BudgetTrackerPageProps) {
  const { session, projectId } = useProjectLayer();
  const [phaseRows, setPhaseRows] = useState<BudgetPhaseRow[]>([]);

  useEffect(() => {
    if (!session || !projectId) return;
    loadPortalPhasesWithRefresh(session, projectId).then(r => {
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) setPhaseRows(r.data);
    });
  }, [session, projectId]);

// After:
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session || !projectId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    loadPortalPhasesWithRefresh(session, projectId).then(r => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) setError(r.error.message ?? "Failed to load.");
      else if (r.data) setPhaseRows(r.data);
      setLoading(false);
    });
  }, [session, projectId]);
```

**Note:** Some client pages (like `deliverables-page.tsx`, `dashboard-page.tsx`) might receive all data as props from a parent component, not fetching directly. Read each file first to confirm it actually calls an API. If a page only uses props without any `useEffect` + API call, SKIP it (no loading state needed).

- [ ] **Step 1: For each of the 35 files, read the file to verify it has useEffect + API calls**

Skip any file that only uses `props` with no `useEffect` API calls.

- [ ] **Step 2: Apply Pattern B to confirmed API-fetching files** (same as Task 4 Step 2, but using client-style session: `const { session } = useProjectLayer();`)

- [ ] **Step 3: Run TS check** `pnpm --filter @maphari/web exec tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/client/maphari-dashboard/pages/
git commit -m "feat(loading): add skeleton + error states to client pages batch H (up to 35 pages)"
```

---

## Final Verification

After all 9 tasks:

- [ ] Run full TS check: `pnpm --filter @maphari/web exec tsc --noEmit` — must produce no output
- [ ] Verify key pages visually: navigate to admin Invoices, Staff Retainer Burn, Client Budget Tracker — each should show 3 shimmer blocks during load
- [ ] Confirm error state renders correctly: temporarily set `useState(false)` back to trigger loading, or pass a bad session

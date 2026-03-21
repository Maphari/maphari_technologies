# Skeleton Loader Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate permanently-stuck skeleton loaders across all 182 affected pages in all three dashboards so every page resolves to real data, an empty state, or an error state.

**Architecture:** Two mechanical fixes applied to every page with a `useState(true)` loading state: (1) every early-return guard must call `setLoading(false)` before returning, and (2) every `useEffect` that sets loading must call `setLoading(false)` in a `.finally()` block. No orchestrator changes, no API changes, no CSS changes. Applied in 8 batches of ~17–24 pages each.

**Tech Stack:** Next.js 16, React, TypeScript.

---

## The Fix Pattern — Read This First

Every task in this plan applies the same pattern. Understand it once, apply it everywhere.

### Finding what to fix in any file

Open the file. Search for `useState(true)`. Each occurrence is a loading state that might be stuck. For each:

1. Find every `useEffect` that calls `setXxxLoading(true)` or initialises with `useState(true)`.
2. Check every early `return` inside that effect — does it call `setXxxLoading(false)` first? If not, add it.
3. Check the promise chain — does it have `.finally(() => setXxxLoading(false))`? If not, add it.
4. If the page has no `error` state yet, add one: `const [error, setError] = useState<string | null>(null)`.
5. In `.catch()`, call `setError("Failed to load")` (keep any existing `notify` call).

### Before → After

**Before (broken):**
```tsx
const [loading, setLoading] = useState(true);

useEffect(() => {
  if (!session) return;           // ← loading stays true forever if no session
  setLoading(true);
  loadSomething(session)
    .then((res) => setData(res.data))
    .catch(() => notify("error", "Failed to load"));
    // ← no finally → error leaves skeleton stuck
}, [session]);
```

**After (fixed):**
```tsx
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  if (!session) { setLoading(false); return; }  // ← always resolves
  setLoading(true);
  setError(null);
  loadSomething(session)
    .then((res) => {
      setData(res.data ?? []);
      if (res.nextSession) saveSession(res.nextSession);
    })
    .catch((err) => {
      const msg = err?.message ?? "Failed to load";
      setError(msg);
      notify("error", msg);
    })
    .finally(() => setLoading(false));           // ← always resolves
}, [session]);
```

### JSX state machine (add where missing)

If the page currently shows content or skeletons but has no error/empty rendering, add the full four-state pattern:

```tsx
{loading ? (
  /* existing skeleton markup — do not change it */
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
  /* existing content — do not change it */
)}
```

Use the actual variable name (`data`, `invoices`, `meetings`, etc.) and the actual empty-state message that fits the page's purpose. The `cx` helper and `emptyState`/`emptyStateTitle`/`emptyStateSub` classes are already available in every page.

### Multiple loading states

Many pages have 2–5 independent loading flags (e.g. `billingLoading`, `invoicesLoading`, `milestonesLoading`). Fix each one independently — same pattern per flag. Do NOT merge them into one boolean.

### TypeScript check after every batch

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```
Expected: no output. Fix any errors before committing.

---

## File Map

| Batch | Dashboard | Pages | Files |
|-------|-----------|-------|-------|
| I | Client | 17 | activity-feed → decision-log |
| J | Client | 17 | deliverable-status → project-reports |
| K | Client | 15 | project-roadmap → timeline |
| L | Staff | 24 | appointments → intervention-actions |
| M | Staff | 24 | invoice-viewer → portal-activity |
| N | Staff | 23 | private-notes → workload-heatmap |
| O | Admin | 31 | access-control → legal |
| P | Admin | 31 | lifecycle-dashboard → vendor-cost-control |

---

## Task 1 — Client Batch I (17 pages)

**Files — modify all of these:**
- `apps/web/src/components/client/maphari-dashboard/pages/activity-feed-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/ai-automation-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/announcements-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/approvals-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/billing-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/book-call-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/brand-library-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/budget-tracker-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/change-requests-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/change-tracker-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/communication-history-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/company-profile-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/content-approval-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/contracts-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/contracts-proposals-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/data-privacy-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/decision-log-page.tsx`

- [ ] **Step 1: Read and fix each file**

  For each file above, apply the fix pattern:
  1. Find all `useState(true)` loading states
  2. Add `setXxxLoading(false); return;` to every guard exit in effects that own that loading state
  3. Add `.finally(() => setXxxLoading(false))` to every promise chain in those effects
  4. Add `const [error, setError] = useState<string | null>(null)` if missing
  5. Add `setError(...)` to `.catch()` blocks
  6. Ensure JSX shows loading → error → empty → data (add missing states)

- [ ] **Step 2: TypeScript check**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```
  Expected: no output. Fix any errors before continuing.

- [ ] **Step 3: Commit**

  ```bash
  git add apps/web/src/components/client/maphari-dashboard/pages/activity-feed-page.tsx \
          apps/web/src/components/client/maphari-dashboard/pages/ai-automation-page.tsx \
          apps/web/src/components/client/maphari-dashboard/pages/announcements-page.tsx \
          apps/web/src/components/client/maphari-dashboard/pages/approvals-page.tsx \
          apps/web/src/components/client/maphari-dashboard/pages/billing-page.tsx \
          apps/web/src/components/client/maphari-dashboard/pages/book-call-page.tsx \
          apps/web/src/components/client/maphari-dashboard/pages/brand-library-page.tsx \
          apps/web/src/components/client/maphari-dashboard/pages/budget-tracker-page.tsx \
          apps/web/src/components/client/maphari-dashboard/pages/change-requests-page.tsx \
          apps/web/src/components/client/maphari-dashboard/pages/change-tracker-page.tsx \
          apps/web/src/components/client/maphari-dashboard/pages/communication-history-page.tsx \
          apps/web/src/components/client/maphari-dashboard/pages/company-profile-page.tsx \
          apps/web/src/components/client/maphari-dashboard/pages/content-approval-page.tsx \
          apps/web/src/components/client/maphari-dashboard/pages/contracts-page.tsx \
          apps/web/src/components/client/maphari-dashboard/pages/contracts-proposals-page.tsx \
          apps/web/src/components/client/maphari-dashboard/pages/data-privacy-page.tsx \
          apps/web/src/components/client/maphari-dashboard/pages/decision-log-page.tsx
  git commit -m "fix(loading): batch I — guard exits + finally on client pages 1-17"
  ```

---

## Task 2 — Client Batch J (17 pages)

**Files:**
- `apps/web/src/components/client/maphari-dashboard/pages/deliverable-status-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/deliverables-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/design-review-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/feedback-survey-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/files-assets-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/integrations-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/knowledge-access-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/knowledge-base-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/loyalty-credits-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/meeting-archive-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/meeting-booker-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/milestone-approvals-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/notifications-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/offboarding-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/onboarding-status-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/project-brief-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/project-reports-page.tsx`

- [ ] **Step 1: Read and fix each file** — same pattern as Task 1

- [ ] **Step 2: TypeScript check**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add \
    apps/web/src/components/client/maphari-dashboard/pages/deliverable-status-page.tsx \
    apps/web/src/components/client/maphari-dashboard/pages/deliverables-page.tsx \
    apps/web/src/components/client/maphari-dashboard/pages/design-review-page.tsx \
    apps/web/src/components/client/maphari-dashboard/pages/feedback-survey-page.tsx \
    apps/web/src/components/client/maphari-dashboard/pages/files-assets-page.tsx \
    apps/web/src/components/client/maphari-dashboard/pages/integrations-page.tsx \
    apps/web/src/components/client/maphari-dashboard/pages/knowledge-access-page.tsx \
    apps/web/src/components/client/maphari-dashboard/pages/knowledge-base-page.tsx \
    apps/web/src/components/client/maphari-dashboard/pages/loyalty-credits-page.tsx \
    apps/web/src/components/client/maphari-dashboard/pages/meeting-archive-page.tsx \
    apps/web/src/components/client/maphari-dashboard/pages/meeting-booker-page.tsx \
    apps/web/src/components/client/maphari-dashboard/pages/milestone-approvals-page.tsx \
    apps/web/src/components/client/maphari-dashboard/pages/notifications-page.tsx \
    apps/web/src/components/client/maphari-dashboard/pages/offboarding-page.tsx \
    apps/web/src/components/client/maphari-dashboard/pages/onboarding-status-page.tsx \
    apps/web/src/components/client/maphari-dashboard/pages/project-brief-page.tsx \
    apps/web/src/components/client/maphari-dashboard/pages/project-reports-page.tsx
  git commit -m "fix(loading): batch J — guard exits + finally on client pages 18-34"
  ```

---

## Task 3 — Client Batch K (15 pages)

**Files:**
- `apps/web/src/components/client/maphari-dashboard/pages/project-roadmap-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/quote-acceptance-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/referral-portal-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/reports-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/resource-hub-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/retainer-dashboard-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/retainer-usage-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/risk-register-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/satisfaction-survey-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/service-catalog-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/sla-escalation-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/sprint-board-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/sprint-visibility-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/team-access-page.tsx`
- `apps/web/src/components/client/maphari-dashboard/pages/timeline-page.tsx`

- [ ] **Step 1: Read and fix each file** — same pattern as Task 1

- [ ] **Step 2: TypeScript check**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add \
    apps/web/src/components/client/maphari-dashboard/pages/project-roadmap-page.tsx \
    apps/web/src/components/client/maphari-dashboard/pages/quote-acceptance-page.tsx \
    apps/web/src/components/client/maphari-dashboard/pages/referral-portal-page.tsx \
    apps/web/src/components/client/maphari-dashboard/pages/reports-page.tsx \
    apps/web/src/components/client/maphari-dashboard/pages/resource-hub-page.tsx \
    apps/web/src/components/client/maphari-dashboard/pages/retainer-dashboard-page.tsx \
    apps/web/src/components/client/maphari-dashboard/pages/retainer-usage-page.tsx \
    apps/web/src/components/client/maphari-dashboard/pages/risk-register-page.tsx \
    apps/web/src/components/client/maphari-dashboard/pages/satisfaction-survey-page.tsx \
    apps/web/src/components/client/maphari-dashboard/pages/service-catalog-page.tsx \
    apps/web/src/components/client/maphari-dashboard/pages/sla-escalation-page.tsx \
    apps/web/src/components/client/maphari-dashboard/pages/sprint-board-page.tsx \
    apps/web/src/components/client/maphari-dashboard/pages/sprint-visibility-page.tsx \
    apps/web/src/components/client/maphari-dashboard/pages/team-access-page.tsx \
    apps/web/src/components/client/maphari-dashboard/pages/timeline-page.tsx
  git commit -m "fix(loading): batch K — guard exits + finally on client pages 35-49"
  ```

---

## Task 4 — Staff Batch L (24 pages)

**Files:**
- `apps/web/src/components/staff/staff-dashboard/pages/appointments-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/approval-queue-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/auto-draft-updates-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/automations-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/brand-kit-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/change-requests-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/client-budget-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/client-health-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/client-health-summary-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/client-journey-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/client-onboarding-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/client-team-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/close-out-report-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/contract-viewer-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/daily-standup-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/decision-log-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/delivery-status-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/end-of-day-wrap-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/estimates-vs-actuals-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/expense-submit-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/feedback-inbox-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/handover-checklist-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/incident-alerts-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/intervention-actions-page.tsx`

- [ ] **Step 1: Read and fix each file** — same pattern as Task 1

- [ ] **Step 2: TypeScript check**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add \
    apps/web/src/components/staff/staff-dashboard/pages/appointments-page.tsx \
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
    apps/web/src/components/staff/staff-dashboard/pages/daily-standup-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/decision-log-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/delivery-status-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/end-of-day-wrap-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/estimates-vs-actuals-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/expense-submit-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/feedback-inbox-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/handover-checklist-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/incident-alerts-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/intervention-actions-page.tsx
  git commit -m "fix(loading): batch L — guard exits + finally on staff pages 1-24"
  ```

---

## Task 5 — Staff Batch M (24 pages)

**Files:**
- `apps/web/src/components/staff/staff-dashboard/pages/invoice-viewer-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/knowledge-base-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/last-touched-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/meeting-prep-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/milestone-sign-off-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/my-analytics-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/my-capacity-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/my-employment-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/my-enps-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/my-integrations-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/my-learning-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/my-leave-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/my-onboarding-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/my-portfolio-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/my-reports-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/my-risks-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/my-team-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/my-timeline-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/notifications-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/offboarding-tasks-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/pay-stub-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/peer-requests-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/personal-performance-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/portal-activity-page.tsx`

- [ ] **Step 1: Read and fix each file** — same pattern as Task 1

- [ ] **Step 2: TypeScript check**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add \
    apps/web/src/components/staff/staff-dashboard/pages/invoice-viewer-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/knowledge-base-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/last-touched-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/meeting-prep-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/milestone-sign-off-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/my-analytics-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/my-capacity-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/my-employment-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/my-enps-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/my-integrations-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/my-learning-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/my-leave-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/my-onboarding-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/my-portfolio-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/my-reports-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/my-risks-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/my-team-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/my-timeline-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/notifications-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/offboarding-tasks-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/pay-stub-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/peer-requests-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/personal-performance-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/portal-activity-page.tsx
  git commit -m "fix(loading): batch M — guard exits + finally on staff pages 25-48"
  ```

---

## Task 6 — Staff Batch N (23 pages)

**Files:**
- `apps/web/src/components/staff/staff-dashboard/pages/private-notes-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/project-budget-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/project-context-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/project-documents-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/qa-checklist-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/rate-card-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/recurring-tasks-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/request-viewer-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/response-time-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/retainer-burn-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/satisfaction-scores-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/sentiment-flags-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/sla-tracker-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/smart-suggestions-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/sprint-burndown-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/sprint-planning-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/staff-handovers-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/system-status-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/task-dependencies-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/team-performance-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/trigger-log-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/vendor-directory-page.tsx`
- `apps/web/src/components/staff/staff-dashboard/pages/workload-heatmap-page.tsx`

- [ ] **Step 1: Read and fix each file** — same pattern as Task 1

- [ ] **Step 2: TypeScript check**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add \
    apps/web/src/components/staff/staff-dashboard/pages/private-notes-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/project-budget-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/project-context-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/project-documents-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/qa-checklist-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/rate-card-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/recurring-tasks-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/request-viewer-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/response-time-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/retainer-burn-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/satisfaction-scores-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/sentiment-flags-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/sla-tracker-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/smart-suggestions-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/sprint-burndown-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/sprint-planning-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/staff-handovers-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/system-status-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/task-dependencies-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/team-performance-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/trigger-log-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/vendor-directory-page.tsx \
    apps/web/src/components/staff/staff-dashboard/pages/workload-heatmap-page.tsx
  git commit -m "fix(loading): batch N — guard exits + finally on staff pages 49-71"
  ```

---

## Task 7 — Admin Batch O (31 pages)

**Files:**
- `apps/web/src/components/admin/dashboard/pages/access-control-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/active-health-monitor-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/admin-automation-page-client.tsx`
- `apps/web/src/components/admin/dashboard/pages/ai-action-recommendations-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/announcements-manager-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/automation-audit-trail-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/booking-appointments-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/business-development-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/capacity-forecast-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/cash-flow-calendar-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/change-request-manager-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/client-health-scorecard-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/client-onboarding-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/client-satisfaction-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/closeout-review-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/communication-audit-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/content-approval-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/design-review-admin-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/document-vault-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/eod-digest-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/executive-dashboard-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/expense-tracker-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/financial-year-closeout-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/handover-management-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/health-interventions-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/invoice-chasing-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/invoices-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/knowledge-base-admin-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/learning-development-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/leave-absence-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/legal-page.tsx`

- [ ] **Step 1: Read and fix each file** — same pattern as Task 1

- [ ] **Step 2: TypeScript check**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add \
    apps/web/src/components/admin/dashboard/pages/access-control-page.tsx \
    apps/web/src/components/admin/dashboard/pages/active-health-monitor-page.tsx \
    apps/web/src/components/admin/dashboard/pages/admin-automation-page-client.tsx \
    apps/web/src/components/admin/dashboard/pages/ai-action-recommendations-page.tsx \
    apps/web/src/components/admin/dashboard/pages/announcements-manager-page.tsx \
    apps/web/src/components/admin/dashboard/pages/automation-audit-trail-page.tsx \
    apps/web/src/components/admin/dashboard/pages/booking-appointments-page.tsx \
    apps/web/src/components/admin/dashboard/pages/business-development-page.tsx \
    apps/web/src/components/admin/dashboard/pages/capacity-forecast-page.tsx \
    apps/web/src/components/admin/dashboard/pages/cash-flow-calendar-page.tsx \
    apps/web/src/components/admin/dashboard/pages/change-request-manager-page.tsx \
    apps/web/src/components/admin/dashboard/pages/client-health-scorecard-page.tsx \
    apps/web/src/components/admin/dashboard/pages/client-onboarding-page.tsx \
    apps/web/src/components/admin/dashboard/pages/client-satisfaction-page.tsx \
    apps/web/src/components/admin/dashboard/pages/closeout-review-page.tsx \
    apps/web/src/components/admin/dashboard/pages/communication-audit-page.tsx \
    apps/web/src/components/admin/dashboard/pages/content-approval-page.tsx \
    apps/web/src/components/admin/dashboard/pages/design-review-admin-page.tsx \
    apps/web/src/components/admin/dashboard/pages/document-vault-page.tsx \
    apps/web/src/components/admin/dashboard/pages/eod-digest-page.tsx \
    apps/web/src/components/admin/dashboard/pages/executive-dashboard-page.tsx \
    apps/web/src/components/admin/dashboard/pages/expense-tracker-page.tsx \
    apps/web/src/components/admin/dashboard/pages/financial-year-closeout-page.tsx \
    apps/web/src/components/admin/dashboard/pages/handover-management-page.tsx \
    apps/web/src/components/admin/dashboard/pages/health-interventions-page.tsx \
    apps/web/src/components/admin/dashboard/pages/invoice-chasing-page.tsx \
    apps/web/src/components/admin/dashboard/pages/invoices-page.tsx \
    apps/web/src/components/admin/dashboard/pages/knowledge-base-admin-page.tsx \
    apps/web/src/components/admin/dashboard/pages/learning-development-page.tsx \
    apps/web/src/components/admin/dashboard/pages/leave-absence-page.tsx \
    apps/web/src/components/admin/dashboard/pages/legal-page.tsx
  git commit -m "fix(loading): batch O — guard exits + finally on admin pages 1-31"
  ```

---

## Task 8 — Admin Batch P (31 pages)

**Files:**
- `apps/web/src/components/admin/dashboard/pages/lifecycle-dashboard-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/loyalty-credits-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/peer-review-queue-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/performance-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/pipeline-analytics-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/platform-infrastructure-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/portfolio-risk-register-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/pricing-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/profitability-per-client-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/profitability-per-project-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/project-briefing-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/recruitment-pipeline-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/referral-tracking-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/request-inbox-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/resource-allocation-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/revenue-forecasting-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/revops-dashboard-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/service-catalog-manager-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/sla-tracker-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/sprint-board-admin-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/staff-access-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/staff-onboarding-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/staff-utilisation-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/stakeholder-directory-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/standup-feed-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/support-queue-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/team-performance-report-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/team-structure-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/timeline-gantt-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/update-queue-manager-page.tsx`
- `apps/web/src/components/admin/dashboard/pages/vendor-cost-control-page.tsx`

- [ ] **Step 1: Read and fix each file** — same pattern as Task 1

- [ ] **Step 2: TypeScript check**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add \
    apps/web/src/components/admin/dashboard/pages/lifecycle-dashboard-page.tsx \
    apps/web/src/components/admin/dashboard/pages/loyalty-credits-page.tsx \
    apps/web/src/components/admin/dashboard/pages/peer-review-queue-page.tsx \
    apps/web/src/components/admin/dashboard/pages/performance-page.tsx \
    apps/web/src/components/admin/dashboard/pages/pipeline-analytics-page.tsx \
    apps/web/src/components/admin/dashboard/pages/platform-infrastructure-page.tsx \
    apps/web/src/components/admin/dashboard/pages/portfolio-risk-register-page.tsx \
    apps/web/src/components/admin/dashboard/pages/pricing-page.tsx \
    apps/web/src/components/admin/dashboard/pages/profitability-per-client-page.tsx \
    apps/web/src/components/admin/dashboard/pages/profitability-per-project-page.tsx \
    apps/web/src/components/admin/dashboard/pages/project-briefing-page.tsx \
    apps/web/src/components/admin/dashboard/pages/recruitment-pipeline-page.tsx \
    apps/web/src/components/admin/dashboard/pages/referral-tracking-page.tsx \
    apps/web/src/components/admin/dashboard/pages/request-inbox-page.tsx \
    apps/web/src/components/admin/dashboard/pages/resource-allocation-page.tsx \
    apps/web/src/components/admin/dashboard/pages/revenue-forecasting-page.tsx \
    apps/web/src/components/admin/dashboard/pages/revops-dashboard-page.tsx \
    apps/web/src/components/admin/dashboard/pages/service-catalog-manager-page.tsx \
    apps/web/src/components/admin/dashboard/pages/sla-tracker-page.tsx \
    apps/web/src/components/admin/dashboard/pages/sprint-board-admin-page.tsx \
    apps/web/src/components/admin/dashboard/pages/staff-access-page.tsx \
    apps/web/src/components/admin/dashboard/pages/staff-onboarding-page.tsx \
    apps/web/src/components/admin/dashboard/pages/staff-utilisation-page.tsx \
    apps/web/src/components/admin/dashboard/pages/stakeholder-directory-page.tsx \
    apps/web/src/components/admin/dashboard/pages/standup-feed-page.tsx \
    apps/web/src/components/admin/dashboard/pages/support-queue-page.tsx \
    apps/web/src/components/admin/dashboard/pages/team-performance-report-page.tsx \
    apps/web/src/components/admin/dashboard/pages/team-structure-page.tsx \
    apps/web/src/components/admin/dashboard/pages/timeline-gantt-page.tsx \
    apps/web/src/components/admin/dashboard/pages/update-queue-manager-page.tsx \
    apps/web/src/components/admin/dashboard/pages/vendor-cost-control-page.tsx
  git commit -m "fix(loading): batch P — guard exits + finally on admin pages 32-62"
  ```

---

## Final Verification

- [ ] Run full TypeScript check: `pnpm --filter @maphari/web exec tsc --noEmit` — zero errors
- [ ] Verify no stuck `useState(true)` loading states remain:
  ```bash
  # All remaining useState(true) results should be non-loading uses (modal open, toggle state, etc.)
  grep -rn "useState(true)" \
    apps/web/src/components/client/maphari-dashboard/pages/ \
    apps/web/src/components/staff/staff-dashboard/pages/ \
    apps/web/src/components/admin/dashboard/pages/
  ```
- [ ] Log in as client with an active project → navigate to Dashboard, Invoices, Projects, Milestones, Messages, Files, Meetings, Deliverables, Approvals, Reports — all resolve within 3 seconds
- [ ] Log in as client with NO active project → pages show empty state (not skeleton)
- [ ] Disconnect network mid-load → pages show error state (not skeleton)

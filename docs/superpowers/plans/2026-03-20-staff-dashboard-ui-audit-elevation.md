# Staff Dashboard UI Audit & Design Elevation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Audit all 82 staff dashboard pages for structural correctness, fix critical issues, then apply a uniform design elevation pass across all pages.

**Architecture:** Two phases — (1) static grep-based code analysis to find and fix Critical issues (missing CSS classes, bare division, missing keys), then a browser spot-check; (2) add 10 CSS utility classes to the staff CSS module and apply them across 82 pages in 6 batches of ~14, with a TypeScript check and commit after each batch.

**Tech Stack:** Next.js 14, React, CSS Modules, TypeScript. Style helper: `cx()` from `../style`. CSS module: `apps/web/src/app/style/staff/maphari-staff-dashboard.module.css`.

---

## File Map

| File | Role |
|------|------|
| `apps/web/src/app/style/staff/maphari-staff-dashboard.module.css` | Edit `.pageEyebrowText` in-place (line ~3329); append 10 new utility classes at end of file |
| All 82 files in `apps/web/src/components/staff/staff-dashboard/pages/` | Apply elevation classes per Task 5–10; fix structural issues per Task 2 |

---

## Static Analysis Reference

The following grep commands form the basis of Task 1. Run each from the repo root.

**Missing CSS class references** (classes used in `cx()` calls that don't exist in the module):
```bash
# Extract all class names used in cx() across all pages
grep -rh 'cx(' apps/web/src/components/staff/staff-dashboard/pages/ \
  | grep -oP '"[a-zA-Z][a-zA-Z0-9_]+"' | sort -u > /tmp/used_classes.txt
# Extract all class names defined in the CSS module
grep -oP '^\.[a-zA-Z][a-zA-Z0-9_]+' \
  apps/web/src/app/style/staff/maphari-staff-dashboard.module.css \
  | sed 's/^\.//' | sort -u > /tmp/defined_classes.txt
comm -23 /tmp/used_classes.txt /tmp/defined_classes.txt
```

**Missing key props in .map() JSX:**
```bash
grep -rn '\.map(' apps/web/src/components/staff/staff-dashboard/pages/ \
  | grep -v 'key='
```

**Bare division without zero-guard:**
```bash
grep -rn '/ [a-zA-Z]' apps/web/src/components/staff/staff-dashboard/pages/ \
  | grep -v '??' | grep -v '|| 0' | grep -v '> 0'
```

**Pages missing loading skeleton:**
```bash
grep -rL 'if (loading)' apps/web/src/components/staff/staff-dashboard/pages/
```

**Pages missing error state:**
```bash
grep -rL 'setError\|error &&\|if (error)' \
  apps/web/src/components/staff/staff-dashboard/pages/
```

**Bare empty states (plain text, no icon):**
```bash
grep -rn 'emptyState\b' apps/web/src/components/staff/staff-dashboard/pages/ \
  | grep -v 'emptyStateIcon\|emptyStateTitle\|emptyStateSub'
```

---

## Task 1: Static Code Analysis

**Files:**
- Read (no write): all 82 files in `apps/web/src/components/staff/staff-dashboard/pages/`
- Read: `apps/web/src/app/style/staff/maphari-staff-dashboard.module.css`

- [ ] **Step 1: Run missing-class grep**

```bash
grep -rh 'cx(' apps/web/src/components/staff/staff-dashboard/pages/ \
  | grep -oP '"[a-zA-Z][a-zA-Z0-9_]+"' | sort -u > /tmp/used_classes.txt

grep -oP '^\.[a-zA-Z][a-zA-Z0-9_]+' \
  apps/web/src/app/style/staff/maphari-staff-dashboard.module.css \
  | sed 's/^\.//' | sort -u > /tmp/defined_classes.txt

comm -23 /tmp/used_classes.txt /tmp/defined_classes.txt
```

Expected output: a list of class names that are referenced but not defined. Flag each as Critical.

- [ ] **Step 2: Run missing key-prop grep**

```bash
# Find .map( calls — inspect each hit for a missing key= on the returned JSX element
grep -rn '\.map(' apps/web/src/components/staff/staff-dashboard/pages/ \
  | grep -v '\/\/' | grep -v 'key='
```

Note: this is an approximation. For each hit, check whether the immediate returned JSX element has `key=`. Flag any that don't as Critical.

- [ ] **Step 3: Run bare division grep**

```bash
grep -rn '/ [a-zA-Z]' apps/web/src/components/staff/staff-dashboard/pages/ \
  | grep -v '??' | grep -v '|| 0' | grep -v '> 0 ?'
```

This grep is broad by design — it catches all variable divisions, not just those inside `Math.round`. For each match: check whether the result is rendered in JSX (e.g. assigned to a variable that appears in `{}` or returned from a function used in JSX). If it produces a display value with no guard, flag as Critical. Ignore hits inside helper functions that don't produce rendered output (e.g. sorting comparisons, index calculations).

- [ ] **Step 4: Identify pages missing loading skeletons**

```bash
# Pages that have setLoading but no skeleton return
grep -rl 'setLoading' apps/web/src/components/staff/staff-dashboard/pages/ \
  | xargs grep -L 'if (loading)' 2>/dev/null

# Pages that have if(loading) but return just null or empty div
grep -rn 'if (loading) return' apps/web/src/components/staff/staff-dashboard/pages/
```

Flag any page returning `null`, `<></>`, or a single plain div as Warning.

- [ ] **Step 5: Identify pages missing error states**

```bash
grep -rl 'setLoading\|useEffect' apps/web/src/components/staff/staff-dashboard/pages/ \
  | xargs grep -L 'setError\|error &&\|if (error)'
```

Flag pages with data fetching but no error handling as Warning.

- [ ] **Step 6: Identify bare empty states**

```bash
grep -rn 'emptyState' apps/web/src/components/staff/staff-dashboard/pages/
```

For each hit, check whether the surrounding JSX has an icon element, a title, and a subtitle. Flag any that have only plain text as Warning.

- [ ] **Step 7: Document findings in an issues table**

Create a markdown block in your working context (not a file) grouping issues as:
- **Critical:** missing CSS class, bare division, missing key prop
- **Warning:** missing skeleton, missing error state, bare empty state
- **Info:** unused CSS class

---

## Task 2: Fix Critical Issues

**Files:**
- Modify: files identified in Task 1 Step 1–3

- [ ] **Step 1: Fix any missing CSS class references**

For each class name found in Task 1 Step 1 (used but undefined):
- Either add the class to the CSS module (if it's a new utility that was intended)
- Or fix the typo in the JSX (if it's a misspelling of an existing class)

Pattern — adding a missing class at end of CSS module:
```css
.myMissingClass {
  /* minimal definition matching design intent */
}
```

- [ ] **Step 2: Fix bare division expressions**

For each flagged division found in Task 1 Step 3, add a zero-division guard.

Acceptable guard forms (use whichever fits context):
```tsx
// Form 1: ternary
const avg = count > 0 ? Math.round(total / count) : 0;

// Form 2: OR short-circuit
const avg = Math.round(total / count) || 0;

// Form 3: nullish denominator
const avg = Math.round(total / (count ?? 1));
```

- [ ] **Step 3: Fix missing key props**

For each flagged `.map()` call, add a stable `key` prop to the returned JSX element.

Pattern:
```tsx
// Before:
items.map((item) => (
  <div className={cx("row")}>{item.name}</div>
))

// After — use item.id if available, else compound key with index as tiebreaker:
items.map((item, i) => (
  <div key={item.id ?? `item-${i}`} className={cx("row")}>{item.name}</div>
))
```

- [ ] **Step 4: TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/staff/staff-dashboard/pages/
git add apps/web/src/app/style/staff/maphari-staff-dashboard.module.css
git commit -m "fix(staff): resolve critical audit issues — NaN guards, key props, missing CSS classes"
```

---

## Task 3: Browser Spot-Check (12 Key Pages)

**Files:** Read only — navigate and screenshot in browser.

> Staff dashboard runs at `http://localhost:3000`. Login: `phumudzomaphari57@gmail.com` / `Testingjudas@@2001`. After login, navigate to the staff dashboard via the staff subdomain or the `/internal-login` route.

- [ ] **Step 1: Navigate to My Dashboard and screenshot**

Page: `dashboard-page.tsx`. Verify: stat cards render, timer widget shows, no NaN values anywhere.

- [ ] **Step 2: Navigate to My Tasks and screenshot**

Page: `tasks-page.tsx`. Verify: task list renders, tab filters work, no console errors.

- [ ] **Step 3: Navigate to Kanban Board and screenshot**

Page: `kanban-page.tsx`. Verify: columns render, cards appear in correct columns, no layout breaks.

- [ ] **Step 4: Navigate to Clients and screenshot**

Page: `clients-page.tsx`. Verify: client list renders, stat cards visible, no empty state showing unexpectedly.

- [ ] **Step 5: Navigate to Client Threads — list + expanded panel**

Click sidebar "Client Threads". Capture screenshot of list view. Then click an existing conversation row to open the thread panel. Verify:
- Message list renders
- Reply input bar is visible at bottom
- "Internal Notes" section is present
- "Escalations" section is present

Capture both screenshots.

- [ ] **Step 6: Navigate to Time Log and screenshot**

Page: `time-log-page.tsx`. Verify: time entries render, no NaN in duration or totals.

- [ ] **Step 7: Navigate to Deliverables and screenshot**

Page: `deliverables-page.tsx`. Verify: deliverable rows render, status badges correct.

- [ ] **Step 8: Navigate to Notifications and screenshot**

Page: `notifications-page.tsx`. Verify: notification rows render, empty state (if any) has icon.

- [ ] **Step 9: Navigate to Retainer Burn and screenshot**

Page: `retainer-burn-page.tsx`. Verify:
- Avg Burn stat shows `0%` or a valid number, **not `NaN%`**
- If NaN still shows, the zero-guard in Task 2 may not have been applied — re-check `avgBurn` calculation

- [ ] **Step 10: Navigate to Settings and screenshot**

Page: `settings-page.tsx`. Verify: settings form renders, all section headings visible.

- [ ] **Step 11: Navigate to Daily Standup and screenshot**

Page: `daily-standup-page.tsx`. Verify: standup form or log renders correctly.

- [ ] **Step 12: Navigate to Delivery Status and screenshot**

Page: `delivery-status-page.tsx`. Verify: delivery table or cards render, status indicators use correct colors.

- [ ] **Step 13: Document visual issues**

Note any issues not caught by static analysis. These inform the elevation batches.

---

## Task 4: Add CSS Utility Classes

**Files:**
- Modify: `apps/web/src/app/style/staff/maphari-staff-dashboard.module.css`

- [ ] **Step 1: Edit `.pageEyebrowText` in-place (line ~3329)**

Find the existing rule (currently at line ~3329):
```css
.pageEyebrowText {
  font-family: var(--font-dm-mono), monospace;
  font-size: 0.6rem;
  letter-spacing: 0.15em;   /* ← change to 0.08em */
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 6px;        /* ← change to 4px */
}
```

Change only `letter-spacing` and `margin-bottom`. Do NOT change `font-size` (keep `0.6rem`). No JSX changes needed.

- [ ] **Step 2: Append all new utility classes at end of the CSS module**

Add after the last rule in the file:

```css
/* ── Design Elevation Utilities (2026-03-20) ──────────────────────── */

/* Elevated card — stronger border + hover surface */
.cardElevated {
  background: var(--s2);
  border: 1px solid var(--b2);
  border-radius: var(--r-md);
}

/* Accent top stripe on stat cards — uses position:absolute to match
   .staffTimerCard::before pattern. Parent must have position:relative.
   Does NOT set overflow:hidden — cards with dropdowns remain unclipped. */
.cardAccentStripe {
  position: relative;
}
.cardAccentStripe::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--accent), transparent);
  border-radius: 2px 2px 0 0; /* intentional pixel-precise value */
}

/* Elevated page title — add alongside existing pageTitleText */
.pageTitleElevated {
  font-family: var(--font-syne), sans-serif;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.3px;
  color: var(--text);
  margin: 0;
}

/* Elevated page subtitle — add alongside existing pageSubtitleText */
.pageSubtitleElevated {
  font-size: 13px;
  color: var(--muted2);
  margin: 4px 0 0;
  line-height: 1.5;
}

/* Empty state icon ring (teal glow) — use on bare-text empty states ONLY.
   Do NOT replace existing .emptyStateIcon usages — those already have styling. */
.emptyStateIconRing {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(36, 184, 168, 0.08);
  border: 1px solid rgba(36, 184, 168, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
}

.emptyStateTitleElevated {
  font-size: 14px;
  font-weight: 600;
  color: var(--muted);
  margin-bottom: 4px;
}

.emptyStateSubElevated {
  font-size: 12px;
  color: var(--muted2);
  max-width: 280px;
  margin: 0 auto;
  line-height: 1.5;
}

/* DM Mono enforcement on numeric stat values */
.statValueMono {
  font-family: var(--font-dm-mono), monospace;
  font-variant-numeric: tabular-nums;
}

/* Small data label above/below a stat */
.dataLabelMono {
  font-family: var(--font-dm-mono), monospace;
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted2);
}

/* Generic page skeleton block — reuses existing ppSkeleShimmer keyframe.
   Caller MUST set height via inline style prop, e.g. style={{ height: '68px' }}.
   Recommended: 68px for stat rows, 200px for content panels. */
.skelePageBlock {
  background: rgba(255, 255, 255, 0.07);
  border-radius: var(--r-md);
  animation: ppSkeleShimmer 1.4s ease-in-out infinite;
}
```

- [ ] **Step 3: TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/style/staff/maphari-staff-dashboard.module.css
git commit -m "feat(staff-css): add design elevation utility classes + tighten pageEyebrowText"
```

---

## Elevation Pattern Reference

All batches (Tasks 5–10) apply the same patterns. Reference this section for each page.

### Page header (additive — keep existing classes)
```tsx
// Before:
<h1 className={cx("pageTitleText")}>Page Name</h1>
<p className={cx("pageSubtitleText", "mb20")}>Description</p>

// After — add elevated classes alongside, do NOT remove existing:
<h1 className={cx("pageTitleText", "pageTitleElevated")}>Page Name</h1>
<p className={cx("pageSubtitleText", "pageSubtitleElevated", "mb20")}>Description</p>
```

### Stat card with label + value
```tsx
// Before:
<div className={cx("someStatCard")}>
  <div className={cx("someLabel")}>Clients</div>
  <div className={cx("someValue")}>42</div>
</div>

// After — add cardAccentStripe to container, dataLabelMono to label, statValueMono to value:
<div className={cx("someStatCard", "cardAccentStripe")}>
  <div className={cx("someLabel", "dataLabelMono")}>Clients</div>
  <div className={cx("someValue", "statValueMono")}>42</div>
</div>
```

### Cards lacking borders
```tsx
// Before:
<div className={cx("someCard")}>

// After:
<div className={cx("someCard", "cardElevated")}>
```

### Bare empty state (plain text only, no icon)
```tsx
// Before (bare text — upgrade this):
<div className={cx("emptyState")}>No data found.</div>

// After (icon ring + structured title + subtitle):
<div className={cx("emptyState")}>
  <div className={cx("emptyStateIconRing")}>
    <Ic n="inbox" sz={18} c="var(--accent)" />
  </div>
  <div className={cx("emptyStateTitleElevated")}>No data yet</div>
  <div className={cx("emptyStateSubElevated")}>Data will appear once available.</div>
</div>
```

> Choose an appropriate `<Ic>` icon name that matches the page context. Common choices: `"inbox"`, `"list"`, `"activity"`, `"clock"`, `"file"`, `"users"`, `"check-square"`.

> **Do NOT apply `emptyStateIconRing` to pages that already use `.emptyStateIcon`.** Those already have an icon — only add `emptyStateTitleElevated` + `emptyStateSubElevated` to improve their text styling.

### Adding skeleton to pages that have none
```tsx
// In the loading return, replace null/<></>/bare div with:
if (loading) {
  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-example">
      <div className={cx("flexCol", "gap12")}>
        <div className={cx("skelePageBlock")} style={{ height: '68px' }} />
        <div className={cx("skelePageBlock")} style={{ height: '200px' }} />
        <div className={cx("skelePageBlock")} style={{ height: '68px' }} />
      </div>
    </section>
  );
}
```

---

## Task 5: Elevation Batch A — Core Pages (14 pages)

**Files:**
- Modify: `dashboard-page.tsx`, `tasks-page.tsx`, `kanban-page.tsx`, `clients-page.tsx`, `time-log-page.tsx`, `deliverables-page.tsx`, `notifications-page.tsx`, `retainer-burn-page.tsx`, `settings-page.tsx`, `daily-standup-page.tsx`, `delivery-status-page.tsx`, `system-status-page.tsx`, `my-capacity-page.tsx`, `my-analytics-page.tsx`

All files are in `apps/web/src/components/staff/staff-dashboard/pages/`.

- [ ] **Step 1: Apply elevation pattern to `dashboard-page.tsx`**

Using the Elevation Pattern Reference above:
1. Find the page header — add `pageTitleElevated` to `pageTitleText` element, `pageSubtitleElevated` to `pageSubtitleText`
2. Find all stat card containers — add `cardAccentStripe` + `dataLabelMono` on labels + `statValueMono` on values
3. Find any plain-card containers without border — add `cardElevated`
4. Check empty states — if bare text only, upgrade with `emptyStateIconRing`
5. Check loading return — if missing or minimal skeleton, replace with 3 `skelePageBlock` divs

- [ ] **Step 2: Apply elevation pattern to `tasks-page.tsx`**

Same checklist as Step 1.

- [ ] **Step 3: Apply elevation pattern to `kanban-page.tsx`**

Same checklist. Note: Kanban cards may not suit `cardAccentStripe` if they have overflow dropdowns — skip the stripe on those cards.

- [ ] **Step 4: Apply elevation pattern to `clients-page.tsx`**

Same checklist.

- [ ] **Step 5: Apply elevation pattern to `time-log-page.tsx`**

Same checklist. Pay attention to duration values — add `statValueMono` to any time display (e.g. `2h 30m`).

- [ ] **Step 6: Apply elevation pattern to `deliverables-page.tsx`**

Same checklist.

- [ ] **Step 7: Apply elevation pattern to `notifications-page.tsx`**

Same checklist.

- [ ] **Step 8: Apply elevation pattern to `retainer-burn-page.tsx`**

Same checklist. Note: this page already has a skeleton (`SkeletonStat`, `SkeletonCard` components) and already uses `emptyStateIcon` — do not apply `emptyStateIconRing` here. Only add header and stat card elevation classes.

- [ ] **Step 9: Apply elevation pattern to `settings-page.tsx`**

Same checklist. Settings pages often lack stat cards — focus on header elevation.

- [ ] **Step 10: Apply elevation pattern to `daily-standup-page.tsx`**

Same checklist.

- [ ] **Step 11: Apply elevation pattern to `delivery-status-page.tsx`**

Same checklist.

- [ ] **Step 12: Apply elevation pattern to `system-status-page.tsx`**

Same checklist. Note: this page already has a loading skeleton and uses `emptyStateIcon` — skip `emptyStateIconRing`. Apply header + stat card elevation classes only.

- [ ] **Step 13: Apply elevation pattern to `my-capacity-page.tsx`**

Same checklist.

- [ ] **Step 14: Apply elevation pattern to `my-analytics-page.tsx`**

Same checklist.

- [ ] **Step 15: TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 16: Commit Batch A**

```bash
git add apps/web/src/components/staff/staff-dashboard/pages/dashboard-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/tasks-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/kanban-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/clients-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/time-log-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/deliverables-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/notifications-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/retainer-burn-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/settings-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/daily-standup-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/delivery-status-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/system-status-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/my-capacity-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/my-analytics-page.tsx
git commit -m "feat(staff-elevation): batch A — core pages header/stat/empty-state elevation"
```

---

## Task 6: Elevation Batch B — My* Pages (14 pages)

**Files:**
- Modify: `my-employment-page.tsx`, `my-enps-page.tsx`, `my-integrations-page.tsx`, `my-learning-page.tsx`, `my-leave-page.tsx`, `my-onboarding-page.tsx`, `my-portfolio-page.tsx`, `my-reports-page.tsx`, `my-risks-page.tsx`, `my-team-page.tsx`, `my-timeline-page.tsx`, `personal-performance-page.tsx`, `pay-stub-page.tsx`, `peer-requests-page.tsx`

- [ ] **Step 1–14: Apply elevation pattern to each page**

For each file, apply the Elevation Pattern Reference (header, stat cards, empty states, skeleton). Same checklist as Task 5 Step 1.

- [ ] **Step 15: TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 16: Commit Batch B**

```bash
git add apps/web/src/components/staff/staff-dashboard/pages/my-employment-page.tsx \
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
  apps/web/src/components/staff/staff-dashboard/pages/personal-performance-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/pay-stub-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/peer-requests-page.tsx
git commit -m "feat(staff-elevation): batch B — my* pages header/stat/empty-state elevation"
```

---

## Task 7: Elevation Batch C — Client Pages (14 pages)

**Files:**
- Modify: `client-budget-page.tsx`, `client-health-page.tsx`, `client-health-summary-page.tsx`, `client-journey-page.tsx`, `client-onboarding-page.tsx`, `client-team-page.tsx`, `close-out-report-page.tsx`, `contract-viewer-page.tsx`, `decision-log-page.tsx`, `communication-history-page.tsx`, `feedback-inbox-page.tsx`, `invoice-viewer-page.tsx`, `rate-card-page.tsx`, `satisfaction-scores-page.tsx`

- [ ] **Step 1–14: Apply elevation pattern to each page**

Same checklist as Task 5 Step 1.

- [ ] **Step 15: TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 16: Commit Batch C**

```bash
git add \
  apps/web/src/components/staff/staff-dashboard/pages/client-budget-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/client-health-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/client-health-summary-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/client-journey-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/client-onboarding-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/client-team-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/close-out-report-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/contract-viewer-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/decision-log-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/communication-history-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/feedback-inbox-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/invoice-viewer-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/rate-card-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/satisfaction-scores-page.tsx
git commit -m "feat(staff-elevation): batch C — client pages header/stat/empty-state elevation"
```

---

## Task 8: Elevation Batch D — Operations Pages (14 pages)

**Files:**
- Modify: `sprint-planning-page.tsx`, `sprint-burndown-page.tsx`, `task-dependencies-page.tsx`, `recurring-tasks-page.tsx`, `qa-checklist-page.tsx`, `change-requests-page.tsx`, `approval-queue-page.tsx`, `meeting-prep-page.tsx`, `milestone-sign-off-page.tsx`, `handover-checklist-page.tsx`, `offboarding-tasks-page.tsx`, `project-budget-page.tsx`, `project-context-page.tsx`, `project-documents-page.tsx`

- [ ] **Step 1–14: Apply elevation pattern to each page**

Same checklist as Task 5 Step 1.

- [ ] **Step 15: TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 16: Commit Batch D**

```bash
git add \
  apps/web/src/components/staff/staff-dashboard/pages/sprint-planning-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/sprint-burndown-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/task-dependencies-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/recurring-tasks-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/qa-checklist-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/change-requests-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/approval-queue-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/meeting-prep-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/milestone-sign-off-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/handover-checklist-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/offboarding-tasks-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/project-budget-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/project-context-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/project-documents-page.tsx
git commit -m "feat(staff-elevation): batch D — operations pages header/stat/empty-state elevation"
```

---

## Task 9: Elevation Batch E — Analytics & Monitoring Pages (14 pages)

**Files:**
- Modify: `sla-tracker-page.tsx`, `response-time-page.tsx`, `incident-alerts-page.tsx`, `sentiment-flags-page.tsx`, `smart-suggestions-page.tsx`, `workload-heatmap-page.tsx`, `team-performance-page.tsx`, `estimates-vs-actuals-page.tsx`, `last-touched-page.tsx`, `portal-activity-page.tsx`, `trigger-log-page.tsx`, `automations-page.tsx`, `auto-draft-updates-page.tsx`, `intervention-actions-page.tsx`

- [ ] **Step 1–14: Apply elevation pattern to each page**

Same checklist as Task 5 Step 1. Pay attention to analytics pages — many will have numeric stats (percentages, averages) — be thorough with `statValueMono` + `dataLabelMono`.

- [ ] **Step 15: TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 16: Commit Batch E**

```bash
git add \
  apps/web/src/components/staff/staff-dashboard/pages/sla-tracker-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/response-time-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/incident-alerts-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/sentiment-flags-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/smart-suggestions-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/workload-heatmap-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/team-performance-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/estimates-vs-actuals-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/last-touched-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/portal-activity-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/trigger-log-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/automations-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/auto-draft-updates-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/intervention-actions-page.tsx
git commit -m "feat(staff-elevation): batch E — analytics/monitoring pages header/stat/empty-state elevation"
```

---

## Task 10: Elevation Batch F — Remaining Pages (16 pages)

**Files:**
- Modify: `appointments-page.tsx`, `brand-kit-page.tsx`, `end-of-day-wrap-page.tsx`, `expense-submit-page.tsx`, `focus-mode-page.tsx`, `keyboard-shortcuts-page.tsx`, `knowledge-base-page.tsx`, `my-portfolio-page.tsx`, `private-notes-page.tsx`, `request-viewer-page.tsx`, `service-catalog-page.tsx`, `staff-handovers-page.tsx`, `vendor-directory-page.tsx`, `peer-requests-page.tsx`, `my-risks-page.tsx`, `my-onboarding-page.tsx`

> Note: `my-portfolio-page.tsx`, `peer-requests-page.tsx`, `my-risks-page.tsx`, and `my-onboarding-page.tsx` were included in Batch B. Skip those if already done — only pick up pages not covered in prior batches.

Remaining pages not yet in Batches A–E:
`appointments-page.tsx`, `brand-kit-page.tsx`, `end-of-day-wrap-page.tsx`, `expense-submit-page.tsx`, `focus-mode-page.tsx`, `keyboard-shortcuts-page.tsx`, `knowledge-base-page.tsx`, `private-notes-page.tsx`, `request-viewer-page.tsx`, `service-catalog-page.tsx`, `staff-handovers-page.tsx`, `vendor-directory-page.tsx`

- [ ] **Step 1–12: Apply elevation pattern to each page**

Same checklist as Task 5 Step 1.

- [ ] **Step 13: TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 14: Commit Batch F**

```bash
git add \
  apps/web/src/components/staff/staff-dashboard/pages/appointments-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/brand-kit-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/end-of-day-wrap-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/expense-submit-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/focus-mode-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/keyboard-shortcuts-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/knowledge-base-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/private-notes-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/request-viewer-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/service-catalog-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/staff-handovers-page.tsx \
  apps/web/src/components/staff/staff-dashboard/pages/vendor-directory-page.tsx
git commit -m "feat(staff-elevation): batch F — remaining pages header/stat/empty-state elevation"
```

---

## Task 11: Final Browser Verification

**Files:** Read only.

- [ ] **Step 1: Re-check the 12 key pages from Task 3**

Navigate to each page and verify:
- No `NaN%` in any stat
- Page headers show elevated title (slightly bolder, `22px`)
- Stat cards have teal top stripe
- DM Mono on all numbers
- Empty states (if present) have icon + title + subtitle
- No visual regressions (layouts unchanged, no clipping)

- [ ] **Step 2: Spot-check 3 additional pages from different batches**

Choose one page from Batch B, one from Batch D, one from Batch E. Verify the same checklist.

- [ ] **Step 3: Check for TypeScript errors one final time**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Final commit**

```bash
git add -p  # stage any remaining uncommitted changes
git commit -m "feat(staff-elevation): complete — all 82 pages audited and elevated"
```

---

## Success Criteria (from spec)

- [ ] Static analysis finds zero missing CSS class references across all 82 pages
- [ ] All `.map()` renders have `key` props
- [ ] Static analysis confirms every division expression producing a display value has a zero-division guard (`|| 0`, `?? 0`, or `/ (denominator ?? 1)`)
- [ ] No `NaN` values visible in any stat or metric field in the browser spot-check
- [ ] All pages have a skeleton loading state that approximates the real layout
- [ ] All pages have an error state with a user-visible message
- [ ] All empty states have an icon, title, and subtitle
- [ ] All page headers use the updated eyebrow (teal, DM Mono) + elevated title + muted subtitle pattern
- [ ] All stat/metric values use DM Mono (tabular nums)
- [ ] Browser spot-check of 12 key pages shows no visual regressions

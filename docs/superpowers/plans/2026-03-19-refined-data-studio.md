# Refined Data Studio — Visual Elevation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate all 250 dashboard pages via CSS token updates and apply the Refined Data Studio `rdStudio*` class library to 15 hero pages.

**Architecture:** Two-layer approach — (1) update 7 dark-mode tokens + `--font-data` in `dashboard-token-scale.css`; cascades to all 250 pages automatically. (2) Append `rdStudio*` utility classes to `maphari-dashboard-shared.module.css` (already spread into all 3 `style.ts` files); apply to 15 hero pages via the existing `cx()` helper. No new imports, no layout changes, no renames.

**Tech Stack:** Next.js 16, CSS Modules, TypeScript. Class resolution: `cx("existingClass", "rdStudioSection")` — works because `maphari-dashboard-shared.module.css` is already spread into the `styles` object on every dashboard.

**Spec:** `docs/superpowers/specs/2026-03-19-refined-data-studio-design.md`

---

## How `cx()` works (read this before touching any TSX file)

Each dashboard has a `style.ts` that spreads all CSS modules into one `styles` object, then creates `cx = createCx(styles)`. When you write `cx("rdStudioCard")`, the helper looks up `styles["rdStudioCard"]` — which resolves to the hashed class name from `maphari-dashboard-shared.module.css`. You never import CSS modules directly in page files.

```ts
// ✅ correct — already done in every page file
import { cx } from "../style";

// Apply additive classes like this:
<div className={cx("card", "rdStudioCard")}>
<span className={cx("kpiValue", "rdStudioMetric", "rdStudioMetricPos")}>R 248,500</span>
<div className={cx("sectionLabel", "rdStudioLabel")}>Monthly Revenue</div>
<div className={cx("pageSection", "rdStudioSection")}>
```

No new imports. No new files. Just adding class names to existing `cx()` calls or wrapping existing elements.

---

## Task 1: Global token lift

**Files:**
- Modify: `apps/web/src/app/style/dashboard-token-scale.css`

No unit tests for CSS. Verification is TypeScript compilation + visual inspection.

- [ ] **Step 1: Update the 7 dark-mode surface and border tokens**

Open `apps/web/src/app/style/dashboard-token-scale.css`. Find the `[data-theme="dark"]` block (around line 120). **Edit only the values listed below — do not replace the entire block.** The rest of the block (text tokens, shadows, accent colour comments) remains untouched.

```css
[data-theme="dark"] {
  /* Backgrounds */
  --bg-page: #0a0a0d;   /* was #0d0d0f */
  --s1: #11111c;        /* was #161618 */
  --s2: #18182a;        /* was #1e1e22 */
  --s3: #1f1f2e;        /* was #262628 */
  --s4: #272738;        /* was #2e2e32 */

  /* Borders */
  --b1: #222230;        /* was #2a2a2e */
  --b2: #2a2a42;        /* was #323238 */
  /* --b3: leave unchanged */

  /* ... rest of block unchanged ... */
}
```

- [ ] **Step 2: Add `--font-data` to the `:root` block**

In the same file, find the `:root` block. Look for these three consecutive font lines (no section comment — they appear around lines 20–22):

```css
  --font-display: var(--font-syne), sans-serif;
  --font-mono: var(--font-dm-mono), monospace;
  --font-serif: var(--font-instrument-serif), serif;
```

Add one line immediately after `--font-serif`:

```css
  --font-display: var(--font-syne), sans-serif;
  --font-mono: var(--font-dm-mono), monospace;
  --font-serif: var(--font-instrument-serif), serif;
  --font-data: var(--font-mono);   /* ← add this line */
```

`--font-mono` is already defined as `var(--font-dm-mono), monospace`. `--font-data` aliases through it.

- [ ] **Step 3: Verify TypeScript still passes**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

Expected: no output (zero errors).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/style/dashboard-token-scale.css
git commit -m "feat(css): apply Refined Data Studio global token lift (7 dark-mode tokens + --font-data)"
```

---

## Task 2: rdStudio* class library

**Files:**
- Modify: `apps/web/src/app/style/shared/maphari-dashboard-shared.module.css`

**Namespace warning:** Admin and staff `style.ts` spread `shared` first, so any future admin or staff split CSS file that accidentally defines a class named `rdStudio*` would silently shadow the shared definition on that dashboard only. Reserve the `rdStudio*` namespace — never define these class names in any split CSS file.

- [ ] **Step 1: Append the rdStudio* classes to the end of the file**

Open `apps/web/src/app/style/shared/maphari-dashboard-shared.module.css`. Scroll to the very end (past the `@media (max-width: 480px)` block). Append exactly:

```css

/* ── Refined Data Studio — hero page additive classes ────────────────────── */
/* Applied via cx() on 15 hero pages. Purely additive — no existing class     */
/* is renamed or removed. maphari-dashboard-shared.module.css is already      */
/* spread into all 3 style.ts files so no new imports are needed.             */

/* Page root — sets tabular-nums and tighter tracking for the whole page */
.rdStudioPage {
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}

/* Data field labels, column headers, section subtitles */
.rdStudioLabel {
  font-family: var(--font-data);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--text-muted);
}

/* KPI numbers and totals — typography only, compose with a color variant */
.rdStudioMetric {
  font-family: var(--font-data);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

/* Color variants — compose alongside .rdStudioMetric */
.rdStudioMetricPos  { color: var(--green);  } /* positive / achieved */
.rdStudioMetricNeg  { color: var(--red);    } /* negative / over-budget */
.rdStudioMetricWarn { color: var(--amber);  } /* warning / at-risk */
/* neutral: omit variant — inherits --text */

/* Primary data cards — accent identity stripe + tighter chrome */
.rdStudioCard {
  border: 1px solid #2a2a42;
  border-top: 1px solid var(--accent); /* dashboard-specific: admin=purple, staff=teal, client=lime */
  border-radius: 0 0 var(--r-sm) var(--r-sm);
  padding: 16px;
}

/* Table / list rows — dense, tabular */
.rdStudioRow {
  border-bottom: 1px solid var(--b1);
  height: 40px;
  display: flex;
  align-items: center;
  font-variant-numeric: tabular-nums;
}

.rdStudioRow span,
.rdStudioRow td {
  font-family: var(--font-data);
}

/* Section header wrapper — accent left border */
.rdStudioSection {
  border-left: 2px solid var(--accent); /* dashboard-specific accent color */
  padding-left: 12px;
  margin-bottom: 16px;
}
```

- [ ] **Step 2: Verify TypeScript still passes**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/style/shared/maphari-dashboard-shared.module.css
git commit -m "feat(css): add rdStudio* class library to shared dashboard module"
```

---

## Task 3: Admin hero pages

**Files:**
- Modify: `apps/web/src/components/admin/dashboard/pages/executive-dashboard-page.tsx`
- Modify: `apps/web/src/components/admin/dashboard/pages/revenue-forecasting-page.tsx`
- Modify: `apps/web/src/components/admin/dashboard/pages/revops-dashboard-page.tsx`
- Modify: `apps/web/src/components/admin/dashboard/pages/cash-flow-calendar-page.tsx`
- Modify: `apps/web/src/components/admin/dashboard/pages/business-development-page.tsx`

All 5 pages already import `{ cx }` from `"../style"`. No new imports needed.

**What to apply in each file:**

| Element | Class(es) to add |
|---------|-----------------|
| Outermost page wrapper `<div>` | `"rdStudioPage"` |
| Section header wrapper `<div>` | `"rdStudioSection"` |
| The label/subtitle inside that wrapper | `"rdStudioLabel"` |
| KPI/metric number `<span>` or `<div>` | `"rdStudioMetric"` + one of `"rdStudioMetricPos"` / `"rdStudioMetricNeg"` / `"rdStudioMetricWarn"` based on semantic meaning |
| Primary data card `<div>` | `"rdStudioCard"` |
| Table/list row `<div>` | `"rdStudioRow"` |
| Field/column label `<span>` | `"rdStudioLabel"` |

**Per-page targeting guide:**

`executive-dashboard-page.tsx` — Focus on: the KPI number spans in the overview tab (revenue total, active projects count, team headcount), the section header wrappers around each tab panel, and the stat card divs that wrap each major metric.

`revenue-forecasting-page.tsx` — Focus on: the ARR/forecast figure spans, scenario section headers, and scenario comparison rows.

`revops-dashboard-page.tsx` — Focus on: pipeline value span, conversion % span, CAC/LTV metric spans, funnel stage rows.

`cash-flow-calendar-page.tsx` — Focus on: monthly cashflow amount spans, period section headers, balance total span.

`business-development-page.tsx` — Focus on: lead value spans, win rate % span, pipeline stage section headers, lead table rows.

**Apply the root class:** Every hero page gets `"rdStudioPage"` on its outermost rendered `<div>` (the one that wraps the entire page content, not the React fragment).

- [ ] **Step 1: Edit `executive-dashboard-page.tsx`**

Read the file. Find:
1. The outermost `<div className={cx("exdPage"...)}>` (or whatever the root wrapper class is) — add `"rdStudioPage"`
2. Section header `<div>` elements wrapping a label + content — add `"rdStudioSection"` to the wrapper, `"rdStudioLabel"` to the label span inside
3. KPI value spans (revenue numbers, project counts) — add `"rdStudioMetric"` + appropriate color variant
4. Stat card `<div>` elements — add `"rdStudioCard"`

- [ ] **Step 2: Edit `revenue-forecasting-page.tsx`** — same pattern

- [ ] **Step 3: Edit `revops-dashboard-page.tsx`** — same pattern

- [ ] **Step 4: Edit `cash-flow-calendar-page.tsx`** — same pattern

- [ ] **Step 5: Edit `business-development-page.tsx`** — same pattern

- [ ] **Step 6: Verify TypeScript passes**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

Expected: no output.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/admin/dashboard/pages/executive-dashboard-page.tsx \
        apps/web/src/components/admin/dashboard/pages/revenue-forecasting-page.tsx \
        apps/web/src/components/admin/dashboard/pages/revops-dashboard-page.tsx \
        apps/web/src/components/admin/dashboard/pages/cash-flow-calendar-page.tsx \
        apps/web/src/components/admin/dashboard/pages/business-development-page.tsx
git commit -m "feat(admin): apply rdStudio* classes to 5 admin hero pages"
```

---

## Task 4: Staff hero pages

**Files:**
- Modify: `apps/web/src/components/staff/staff-dashboard/pages/dashboard-page.tsx`
- Modify: `apps/web/src/components/staff/staff-dashboard/pages/kanban-page.tsx`
- Modify: `apps/web/src/components/staff/staff-dashboard/pages/sprint-planning-page.tsx`
- Modify: `apps/web/src/components/staff/staff-dashboard/pages/daily-standup-page.tsx`
- Modify: `apps/web/src/components/staff/staff-dashboard/pages/deliverables-page.tsx`

All 5 pages already import `{ cx }` from `"../style"`. No new imports needed.

**Per-page targeting guide:**

`dashboard-page.tsx` (Staff My Dashboard) — Focus on: `openTasksCount`, `openConversationsCount`, `overdueCount` display spans (the prominent number values near the top), the section header wrappers for "Priority Tasks", "SLA Watchlist", "Activity" sections, and the summary stat card divs.

`kanban-page.tsx` — Focus on: the column header `<div>` elements (e.g. "To Do", "In Progress", "Done" — these become `rdStudioSection`), the task count badge/span in each column header (add `"rdStudioMetric"`), and column label text spans (add `"rdStudioLabel"`).

`sprint-planning-page.tsx` — Focus on: velocity/story-point figures (add `"rdStudioMetric"`), sprint section headers (add `"rdStudioSection"`), sprint label text (add `"rdStudioLabel"`), task/backlog rows (add `"rdStudioRow"`).

`daily-standup-page.tsx` — Focus on: each team member's section wrapper (add `"rdStudioSection"`), the status label spans (add `"rdStudioLabel"`). This page has few numbers — focus on section and label classes.

`deliverables-page.tsx` — Focus on: status section header wrappers (add `"rdStudioSection"`), deliverable list rows (add `"rdStudioRow"`), status/due-date label spans (add `"rdStudioLabel"`).

**Apply the root class:** Every hero page gets `"rdStudioPage"` on its outermost rendered `<div>`.

- [ ] **Step 1: Edit `dashboard-page.tsx`**
- [ ] **Step 2: Edit `kanban-page.tsx`**
- [ ] **Step 3: Edit `sprint-planning-page.tsx`**
- [ ] **Step 4: Edit `daily-standup-page.tsx`**
- [ ] **Step 5: Edit `deliverables-page.tsx`**

- [ ] **Step 6: Verify TypeScript passes**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

Expected: no output.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/staff/staff-dashboard/pages/dashboard-page.tsx \
        apps/web/src/components/staff/staff-dashboard/pages/kanban-page.tsx \
        apps/web/src/components/staff/staff-dashboard/pages/sprint-planning-page.tsx \
        apps/web/src/components/staff/staff-dashboard/pages/daily-standup-page.tsx \
        apps/web/src/components/staff/staff-dashboard/pages/deliverables-page.tsx
git commit -m "feat(staff): apply rdStudio* classes to 5 staff hero pages"
```

---

## Task 5: Client hero pages

**Files:**
- Modify: `apps/web/src/components/client/maphari-dashboard/pages/home-page.tsx`
- Modify: `apps/web/src/components/client/maphari-dashboard/pages/my-projects-page.tsx`
- Modify: `apps/web/src/components/client/maphari-dashboard/pages/billing-page.tsx`
- Modify: `apps/web/src/components/client/maphari-dashboard/pages/messages-page.tsx`
- Modify: `apps/web/src/components/client/maphari-dashboard/pages/onboarding-page.tsx`

All 5 pages already import `{ cx }` from `"../style"`. No new imports needed.

**Per-page targeting guide:**

`home-page.tsx` — Focus on: the active project count span, open invoice count, deliverable count (these are the prominent number displays near the top of the page); section header wrappers for "Projects", "Activity", "Invoices" sections; the 2–3 primary summary cards.

`my-projects-page.tsx` — Focus on: project card `<div>` elements (add `"rdStudioCard"`), progress percentage spans (add `"rdStudioMetric"` + `"rdStudioMetricPos"` or `"rdStudioMetricWarn"` depending on progress), milestone count labels (add `"rdStudioLabel"`).

`billing-page.tsx` — Focus on: invoice total amount spans (add `"rdStudioMetric"` + `"rdStudioMetricNeg"` for overdue, `"rdStudioMetricPos"` for paid), invoice section header wrappers (add `"rdStudioSection"`), invoice list rows (add `"rdStudioRow"`), date/status label spans (add `"rdStudioLabel"`).

`messages-page.tsx` — Focus on: unread message count span (add `"rdStudioMetric"`), message thread rows (add `"rdStudioRow"`), timestamp label spans (add `"rdStudioLabel"`).

`onboarding-page.tsx` — Focus on: completion percentage span (add `"rdStudioMetric"` + `"rdStudioMetricPos"`), step section wrappers (add `"rdStudioSection"`), step card divs (add `"rdStudioCard"`), step label spans (add `"rdStudioLabel"`).

**Apply the root class:** Every hero page gets `"rdStudioPage"` on its outermost rendered `<div>`.

- [ ] **Step 1: Edit `home-page.tsx`**
- [ ] **Step 2: Edit `my-projects-page.tsx`**
- [ ] **Step 3: Edit `billing-page.tsx`**
- [ ] **Step 4: Edit `messages-page.tsx`**
- [ ] **Step 5: Edit `onboarding-page.tsx`**

- [ ] **Step 6: Verify TypeScript passes**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

Expected: no output.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/client/maphari-dashboard/pages/home-page.tsx \
        apps/web/src/components/client/maphari-dashboard/pages/my-projects-page.tsx \
        apps/web/src/components/client/maphari-dashboard/pages/billing-page.tsx \
        apps/web/src/components/client/maphari-dashboard/pages/messages-page.tsx \
        apps/web/src/components/client/maphari-dashboard/pages/onboarding-page.tsx
git commit -m "feat(client): apply rdStudio* classes to 5 client hero pages"
```

---

## Task 6: Final TypeScript verification

**Files:** None modified — verification only.

- [ ] **Step 1: Run TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

Expected: no output (zero errors). If there are errors, they will include a file path and line number — fix each one before proceeding.

- [ ] **Step 2: Confirm all 15 hero pages were touched**

```bash
git log --oneline -5
```

Expected: 5 commits visible — tokens, class library, admin pages, staff pages, client pages.

- [ ] **Step 3: Spot-check the rendered output**

Start the dev server (`pnpm dev` from repo root or `pnpm --filter @maphari/web dev`). Open each of these pages and verify:
- Surfaces are visibly darker/cooler than before
- Section headers on hero pages show the accent left-border stripe
- Numeric values on hero pages are monospace and tabular
- No layout shifts — all grids and responsive breakpoints intact
- Non-hero pages still render correctly (spot-check 2–3 admin, 2–3 staff, 2–3 client)

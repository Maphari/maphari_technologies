# Staff Dashboard UI Audit & Design Elevation

**Date:** 2026-03-20
**Scope:** Staff dashboard only — 82 pages
**Goal:** Two-phase improvement: (1) structural audit to fix broken layouts and missing elements, then (2) a uniform design elevation pass to bring every page up to the Precision Industrial standard.

---

## Background

The staff dashboard has recently completed a large batch of loading/error state fixes (commits `batch M–P`). The dashboard now renders correctly without 500 errors. The next step is to audit all 82 pages for structural correctness, then apply a consistent design elevation across all of them.

There is an existing `2026-03-20-frontend-design-elevation.md` plan covering all 3 dashboards. This spec supersedes that plan for the staff dashboard and focuses exclusively on it. Client and admin dashboards will be handled in separate specs.

---

## Design System Reference

| Token | Value | Use |
|-------|-------|-----|
| `--s1` | `#0d0d14` | Default page background |
| `--s2` | `#13131e` | Card / hover surface |
| `--s3` | `#171726` | Input / deepest surface |
| `--b1` | `rgba(255,255,255,0.07)` | Dividers |
| `--b2` | `rgba(255,255,255,0.12)` | Card borders |
| `--b3` | `rgba(255,255,255,0.16)` | Focus / hover borders |
| `--accent` | `#24b8a8` | Staff teal accent |
| `--font-syne` | Syne | Headings, display text |
| `--font-dm-mono` | DM Mono | All data labels, metrics, eyebrows |

CSS module: `apps/web/src/app/style/staff/maphari-staff-dashboard.module.css`
Style util: `apps/web/src/components/staff/staff-dashboard/style.ts`

---

## Phase 1 — Structural Audit

### 1a. Static Code Analysis (all 82 pages)

Scan every file in `apps/web/src/components/staff/staff-dashboard/pages/` and the CSS module for:

| Check | What to look for |
|-------|-----------------|
| Missing CSS classes | Component references a class name that does not exist in the CSS module |
| Missing `key` props | `.map()` calls rendering JSX elements without a `key` prop |
| NaN display values | Calculated values (percentages, averages) that could render `NaN%` due to division by zero or undefined data |
| Missing skeleton states | Pages that have `if (loading) return …` but the returned JSX does not match the actual page layout structure |
| Missing error states | Pages that silently swallow errors (no error boundary, no error message shown to user) |
| Bare empty states | Empty state renders only plain text with no icon, title, or contextual message |
| Unused CSS classes | Classes defined in the module that are never referenced (cleanup opportunity) |

**Output:** A structured issues table grouping findings by severity — Critical (broken), Warning (poor UX), Info (cleanup).

### 1b. Browser Spot-Check (12 key pages)

Navigate to each of the following pages in Chrome and capture a screenshot. Document any visual issues not caught by static analysis:

1. My Dashboard (`dashboard-page.tsx`)
2. My Tasks (`tasks-page.tsx`)
3. Kanban Board (`kanban-page.tsx`)
4. Clients (`clients-page.tsx`)
5. Client Threads (`clients-page.tsx` messaging view)
6. Time Log (`time-log-page.tsx`)
7. Deliverables (`deliverables-page.tsx`)
8. Notifications (`notifications-page.tsx`)
9. Retainer Burn (`retainer-burn-page.tsx`)
10. Settings (`settings-page.tsx`)
11. Daily Standup (`daily-standup-page.tsx`)
12. Delivery Status (`delivery-status-page.tsx`)

**Known issue to verify:** Retainer Burn shows `NaN%` for Avg Burn — root cause to be diagnosed (likely division by zero when `retainerBurnPct` is missing from API response).

---

## Phase 2 — Design Elevation (uniform system pass)

All improvements are CSS + minimal JSX changes. No new pages, no routes, no backend changes.

### 2a. Shared CSS Utilities (new classes in `maphari-staff-dashboard.module.css`)

The following utility classes are added once and reused across all pages:

#### Card surface
```css
/* Elevated card — stronger border + hover surface */
.cardElevated {
  background: var(--s2);
  border: 1px solid var(--b2);
  border-radius: var(--r-md);
}

/* Accent top stripe on stat cards */
.cardAccentStripe::before {
  content: '';
  display: block;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, var(--accent), transparent);
  border-radius: 2px 2px 0 0;
  margin-bottom: 14px;
}
```

#### Page header
```css
/* Teal eyebrow text (breadcrumb / section label) */
.pageEyebrowAccent {
  font-family: var(--font-dm-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 4px;
}

/* Tighter title */
.pageTitleElevated {
  font-family: var(--font-syne);
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.3px;
  color: var(--text);
  margin: 0;
}

/* Muted subtitle */
.pageSubtitleElevated {
  font-size: 13px;
  color: var(--muted2);
  margin: 4px 0 0;
  line-height: 1.5;
}
```

#### Empty states
```css
/* Icon container with teal glow ring */
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
```

#### Data labels & metrics
```css
/* DM Mono enforcement on all numeric stat values */
.statValueMono {
  font-family: var(--font-dm-mono);
  font-variant-numeric: tabular-nums;
}

/* Small data label (above/below a stat) */
.dataLabelMono {
  font-family: var(--font-dm-mono);
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted2);
}
```

#### Skeleton loaders
```css
/* Standard 3-block page skeleton for pages without one */
.skelePageBlock {
  background: var(--s2);
  border-radius: var(--r-md);
  animation: skeletonPulse 1.4s ease-in-out infinite;
}

@keyframes skeletonPulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
```

### 2b. Per-Page Application Rules

For each of the 82 pages, apply the following changes consistently:

| Element | Change |
|---------|--------|
| `pageEyebrowText` class | Replace with `pageEyebrowAccent` (teal, DM Mono, uppercase) |
| `pageTitleText` class | Add `pageTitleElevated` alongside it |
| `pageSubtitleText` class | Add `pageSubtitleElevated` alongside it |
| Stat cards with labels+values | Add `cardAccentStripe` + `dataLabelMono` on labels, `statValueMono` on values |
| Empty state plain text | Replace with `emptyStateIconRing` + `emptyStateTitleElevated` + `emptyStateSubElevated` |
| Loading skeletons | Ensure at least 3 `skelePageBlock` divs approximate the real layout |
| Cards lacking borders | Add `cardElevated` class |

### 2c. Out of Scope

- No changes to routing, data fetching, or API integration
- No new pages or components
- No changes to the client or admin dashboards
- No changes to the shared `maphari-dashboard-shared.module.css` (staff-only elevation)
- No layout restructuring — elevation only, not redesign

---

## File Map

| File | Changes |
|------|---------|
| `apps/web/src/app/style/staff/maphari-staff-dashboard.module.css` | Add elevation utility classes (Phase 2a) |
| All 82 files in `apps/web/src/components/staff/staff-dashboard/pages/` | Apply elevation classes per-page (Phase 2b) |

---

## Success Criteria

- [ ] Static analysis finds zero missing CSS class references across all 82 pages
- [ ] All `.map()` renders have `key` props
- [ ] No `NaN` values rendered in any stat or metric field
- [ ] All pages have a skeleton loading state that approximates the real layout
- [ ] All pages have an error state with a user-visible message
- [ ] All empty states have an icon, title, and subtitle
- [ ] All page headers use the teal eyebrow, elevated title, and muted subtitle pattern
- [ ] All stat/metric values use DM Mono (tabular nums)
- [ ] Browser spot-check of 12 key pages shows no visual regressions

---

## Implementation Order

1. Run static analysis and produce the issues table
2. Fix all Critical issues (missing classes, NaN values, missing keys)
3. Browser spot-check and document remaining visual issues
4. Add elevation utility classes to CSS module
5. Apply elevation classes across all 82 pages (can be batched in groups of ~15)
6. Re-run browser spot-check to verify no regressions

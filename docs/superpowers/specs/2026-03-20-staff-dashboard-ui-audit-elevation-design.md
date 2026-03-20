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
| NaN display values | Division expressions that produce a display value — verify each has a zero-division guard. All three forms are acceptable: `count > 0 ? Math.round(total / count) : 0`, `Math.round(total / count) \|\| 0`, or `Math.round(total / (count ?? 1))`. Flag any bare division with no guard. |
| Missing skeleton states | Pages that have `if (loading) return …` but the returned JSX does not approximate the real page layout |
| Missing error states | Pages that silently swallow errors (no error boundary, no user-visible error message) |
| Bare empty states | Empty state renders only plain text with no icon, title, or contextual message |
| Unused CSS classes | Classes defined in the module that are never referenced in any `.tsx` file (cleanup opportunity) |

**Output:** A structured issues table grouping findings by severity — Critical (broken), Warning (poor UX), Info (cleanup).

### 1b. Browser Spot-Check (12 key pages)

Navigate to each of the following pages in Chrome and capture a screenshot. Document any visual issues not caught by static analysis:

1. My Dashboard (`dashboard-page.tsx`)
2. My Tasks (`tasks-page.tsx`)
3. Kanban Board (`kanban-page.tsx`)
4. Clients (`clients-page.tsx`)
5. Client Threads — click sidebar "Client Threads", then select an existing conversation row to load the thread panel; capture both the list view and the expanded thread panel. Verify: message list renders, reply input bar is visible, and the "Internal Notes" + "Escalations" sections are present.
6. Time Log (`time-log-page.tsx`)
7. Deliverables (`deliverables-page.tsx`)
8. Notifications (`notifications-page.tsx`)
9. Retainer Burn (`retainer-burn-page.tsx`)
10. Settings (`settings-page.tsx`)
11. Daily Standup (`daily-standup-page.tsx`)
12. Delivery Status (`delivery-status-page.tsx`)

**Known issue to verify:** Retainer Burn shows `NaN%` for Avg Burn — root cause is division by zero when `clients.length === 0` or when `retainerBurnPct` is `undefined` on an entry. Fix: add `clients.length > 0 ? Math.round(...) : 0` guard.

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

/* Accent top stripe on stat cards — uses position:absolute to match existing
   stripe pattern (e.g. .staffTimerCard::before). Parent must have position:relative
   and overflow:hidden. Do NOT use on cards that render tooltips or dropdowns that
   overflow the card boundary. */
.cardAccentStripe {
  position: relative;
  overflow: hidden;
}
.cardAccentStripe::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--accent), transparent);
  border-radius: 2px 2px 0 0; /* intentional pixel-precise value — not a design-token radius */
}
```

#### Page header

The existing `.pageEyebrowText` class already renders teal, DM Mono, uppercase text. Rather than adding a new class or replacing 197 JSX usages, **update the CSS definition of `.pageEyebrowText` in-place** — no JSX changes required for the eyebrow. The following spec shows the target styles; implement by editing the existing `.pageEyebrowText` rule:

```css
/* Edit the existing .pageEyebrowText rule — do NOT add a new class */
/* Preserve font-size as 0.6rem (matches existing rule, equivalent to ~10px at default root).
   Only change letter-spacing (0.15em → 0.08em) and margin-bottom (6px → 4px). */
.pageEyebrowText {
  font-family: var(--font-dm-mono), monospace;
  font-size: 0.6rem;         /* unchanged — preserve relative unit */
  letter-spacing: 0.08em;   /* tightened from 0.15em */
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 4px;        /* reduced from 6px */
}

/* New class — add to JSX alongside existing pageTitleText */
.pageTitleElevated {
  font-family: var(--font-syne), sans-serif;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.3px;
  color: var(--text);
  margin: 0;
}

/* New class — add to JSX alongside existing pageSubtitleText */
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
  font-family: var(--font-dm-mono), monospace;
  font-variant-numeric: tabular-nums;
}

/* Small data label (above/below a stat) */
.dataLabelMono {
  font-family: var(--font-dm-mono), monospace;
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted2);
}
```

#### Skeleton loaders

The CSS module already contains `@keyframes ppSkeleShimmer`. Do NOT add a new keyframe. Use `ppSkeleShimmer` and match the existing background value (`rgba(255,255,255,0.07)`, consistent with all other skeleton blocks):

```css
/* Generic page skeleton block — reuses existing ppSkeleShimmer keyframe.
   Callers MUST set an explicit height (e.g. height: 80px) or the block
   renders as 0px. Recommended defaults: 68px for stat rows, 200px for
   content panels. */
.skelePageBlock {
  background: rgba(255, 255, 255, 0.07);
  border-radius: var(--r-md);
  animation: ppSkeleShimmer 1.4s ease-in-out infinite;
}
```

### 2b. Per-Page Application Rules

For each of the 82 pages, apply the following changes consistently:

| Element | Change |
|---------|--------|
| `pageEyebrowText` CSS rule | **Edit CSS in-place** — update `letter-spacing` to `0.08em` and `margin-bottom` to `4px`. Zero JSX changes. |
| `pageTitleText` in JSX | Add `pageTitleElevated` class **alongside** the existing `pageTitleText` (additive, not a replacement) |
| `pageSubtitleText` in JSX | Add `pageSubtitleElevated` class **alongside** the existing `pageSubtitleText` (additive) |
| Stat cards with labels+values | Add `cardAccentStripe` to the card container; add `dataLabelMono` on the stat label; add `statValueMono` on the stat value |
| Empty state plain text | Replace bare text with `emptyStateIconRing` (with an `<Ic>` icon inside) + `emptyStateTitleElevated` + `emptyStateSubElevated` |
| Pages missing skeletons | Add a loading skeleton using 3 `skelePageBlock` divs sized to approximate the real layout |
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
| `apps/web/src/app/style/staff/maphari-staff-dashboard.module.css` | Edit `.pageEyebrowText` in-place; add new elevation utility classes (Phase 2a) |
| All 82 files in `apps/web/src/components/staff/staff-dashboard/pages/` | Apply elevation classes per-page (Phase 2b); fix NaN guards and key props (Phase 1a) |

---

## Success Criteria

- [ ] Static analysis finds zero missing CSS class references across all 82 pages
- [ ] All `.map()` renders have `key` props
- [ ] Static analysis confirms every division expression producing a display value has a zero-division guard (`|| 0` or `?? 0`)
- [ ] No `NaN` values visible in any stat or metric field in the browser spot-check
- [ ] All pages have a skeleton loading state that approximates the real layout
- [ ] All pages have an error state with a user-visible message
- [ ] All empty states have an icon, title, and subtitle
- [ ] All page headers use the updated eyebrow (teal, DM Mono) + elevated title + muted subtitle pattern
- [ ] All stat/metric values use DM Mono (tabular nums)
- [ ] Browser spot-check of 12 key pages shows no visual regressions

---

## Implementation Order

1. Run static analysis and produce the issues table
2. Fix all Critical issues (missing classes, NaN zero-division guards, missing keys)
3. Browser spot-check of 12 key pages; document remaining visual issues
4. Add elevation utility classes to CSS module (edit `.pageEyebrowText` in-place; add new classes)
5. Apply elevation classes across all 82 pages (batch in groups of ~15)
6. Re-run browser spot-check to verify no regressions

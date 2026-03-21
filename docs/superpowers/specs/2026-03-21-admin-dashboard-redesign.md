# Admin Dashboard Redesign — Design Spec

**Date:** 2026-03-21
**Scope:** Visual redesign — CSS rewrites + minimal JSX changes to `sidebar.tsx` and `topbar.tsx` shell components only. Zero changes to page components, hooks, routing, or data flow.
**Approach:** Structured Authority — confident, data-first, purposeful use of purple accent

---

## 1. Design Direction

**Structured Authority.** The admin dashboard is an operational command centre. The design language reflects that: a permanent icon rail anchors the left edge, a live status topbar replaces the generic floating header, and spaced cards with semantic colour accents give every metric a clear identity. No decorative flourishes — every visual element earns its place by communicating state or hierarchy.

---

## 2. Shell Architecture

### 2.1 Icon Rail (replaces 240px sidebar)

- **Width:** 52px (`--rail-w: 52px`), fixed left, full viewport height
- **Background:** `--rail-bg: #09090f`
- **Right border:** 1px `rgba(255,255,255,0.05)`
- **Purple identity stripe:** 2px solid `var(--accent)` running the full height of the rail's right edge, layered as a pseudo-element or border
- **Contents (top to bottom):**
  - Logo mark (20×20px, `border-radius: 4px`, `background: var(--accent)`) — 12px top padding
  - Section icons — one per navigation group (Operations, Experience, Finance, Communication, Governance, Knowledge, Lifecycle, AI/ML, Automation)
  - Section divider marks (4px wide dot, `rgba(255,255,255,0.12)`) between groups
  - Profile avatar pinned to bottom
- **Icon states:**
  - Default: 32×32px, `border-radius: 8px`, `background: rgba(255,255,255,0.04)`
  - Hover: `background: rgba(139,111,255,0.12)`
  - Active (fly-out open for that section): `background: var(--accent)`
- **Tooltips:** Section name on hover, right-aligned, `border-radius: 6px`, `background: #1a1a2e`

### 2.2 Fly-out Panel

- **Trigger:** Clicking a section icon sets `activeSectionId` state in `sidebar.tsx` and opens the fly-out; clicking elsewhere or selecting a page closes it. This requires a small JSX state addition (see Section 6).
- **Width:** 200px (`--flyout-w: 200px`)
- **Position:** Directly to the right of the rail, fixed, full height. Total nav footprint when open = 252px.
- **Background:** `--flyout-bg: #0e0e1a`
- **Right border:** `1px solid rgba(139,111,255,0.12)`
- **Box shadow:** `4px 0 20px rgba(0,0,0,0.4)`
- **Animation:** `transform: translateX(-100%)` → `translateX(0)`, 180ms `ease-out`
- **Contents:**
  - Section heading: 10px small caps, `rgba(139,111,255,0.6)`, `letter-spacing: 0.1em`, `padding: 6px 10px`
  - Nav items: 5px dot (`border-radius: 50%`) + label text, `padding: 6px 10px`, `border-radius: 6px`
  - Active item: `background: rgba(139,111,255,0.2)`, dot `background: var(--accent)`, label `color: var(--text)`
  - Hover item: `background: rgba(255,255,255,0.04)`
  - Badge counts: small pill, right-aligned, amber/red per severity
- **`.main` offset when fly-out open:** `margin-left: calc(var(--rail-w) + var(--flyout-w))` (252px). When closed: `margin-left: var(--rail-w)` (52px). Animate with `transition: margin-left 180ms ease-out`.

### 2.3 Topbar — Live Status Bar

**Layout change from current:** The current topbar is a `position: fixed; top: 16px; height: 64px; border-radius: 12px` floating card. The redesign changes it to a flush full-width bar: `position: fixed; top: 0; height: 44px; border-radius: 0`. The `.main` `padding-top` must update from `calc(64px + 32px)` to `44px`.

- **Height:** 44px (`--topbar-h: 44px`) — **changes from 64px**
- **Position:** `fixed; top: 0; left: var(--rail-w); right: 0` — **changes from floating card with 16px offset**
- **Border-radius:** 0 — **removes the current 12px rounded corners**
- **Background:** `#08080e`
- **Top border:** 2px solid `var(--accent)` (same `--accent` token as rail stripe — visually connects across the top)
- **Bottom border:** `1px solid rgba(255,255,255,0.04)`
- **Box shadow:** none (flush bar replaces the current `0 10px 28px rgba(0,0,0,0.25)` card shadow)
- **Layout (left → right):**
  1. Breadcrumb — `Section / Page` in DM Mono, 10px, root segments `rgba(255,255,255,0.3)`, active segment `var(--text)`. Breadcrumb segments are derived from `visibleNavItems` and current `page` in the existing navigation hook — no new data required.
  2. Divider: 1px × 16px `rgba(255,255,255,0.06)`, 8px horizontal margins
  3. Status pills — conditionally rendered when count > 0:
     - Green: `N clients active` (`rgba(52,217,139,0.08)` bg, `#34d98b` pip)
     - Amber: `N blockers` (`rgba(245,166,35,0.08)` bg, `var(--amber)` pip)
     - Red: `N at risk` (`rgba(255,95,95,0.08)` bg, `var(--red)` pip)
     - Pill height: 22px, `padding: 0 8px`, `border-radius: 4px`, `font-size: 9px`, DM Mono
  4. Spacer (`flex: 1`)
  5. Period chip: current month/quarter in DM Mono, `background: var(--accent-d)`, `border: 1px solid rgba(139,111,255,0.2)`, `height: 26px`, `padding: 0 10px`, `border-radius: 6px`
  6. Notification icon button (28×28px, amber badge dot for unread)
  7. Avatar (28×28px, `border-radius: 50%`, `background: linear-gradient(135deg, var(--accent), var(--accent2))`)

---

## 3. Homepage — Executive Command Brief

Target file: the page component rendered for `page === "executive"` (currently `executive-page.tsx` or equivalent under `apps/web/src/components/admin/dashboard/pages/`). Only CSS class implementations change — JSX structure within the page component adjusts to use the new class names.

### Row 1 — Hero Strip

Full-width card (`background: var(--s2)`, `border: 1px solid rgba(139,111,255,0.12)`, `border-radius: 8px`):

- **Left:** Primary metric — label (`MONTHLY REVENUE`, 10px small caps muted), value (DM Mono 24px bold `var(--text)`), delta (DM Mono 12px `var(--green)` for positive, `var(--amber)` for negative)
- **Center-right:** 2 mini-stat cards stacked — Active Clients, SLA Score (`background: var(--s2)`, `border: 1px solid rgba(255,255,255,0.05)`)
- **Far right column:** Alert feed — `ALERTS` heading (10px small caps muted), then 3–5 alert rows each with a 14×14px coloured icon block + short description + sub-label
- Purple corner glow: `60px × 60px`, `border-radius: 50%`, `background: var(--glow-purple)`, `filter: blur(16px)`, `position: absolute; bottom: -15px; right: -15px`

### Row 2 — Secondary KPI Strip

3-column grid, equal width, `gap: 12px`. Each card uses the stat card spec from Section 4:

| Card | Top Border Token | Corner Glow |
|---|---|---|
| Projects Active | `var(--accent)` | `var(--glow-purple)` |
| At Risk | `var(--amber)` | `var(--glow-amber)` |
| Pipeline Value | `var(--green)` | `var(--glow-green)` |

### Row 3 — Activity Feed

Full-width card — `RECENT ACTIVITY` section header + rule divider, then 5–8 entity rows:
- 12×12px coloured icon block (semantic colour per event type) + activity description + DM Mono timestamp (muted) + status badge

---

## 4. Content & Card System

### Stat Cards

```
background:     var(--s2)                          /* #13131e */
border:         1px solid rgba(139,111,255,0.1)
border-top:     2px solid <semantic-colour>
border-radius:  8px
padding:        14px 16px
position:       relative
overflow:       hidden
```

Semantic top-border colours:
- `var(--accent)` / `#8b6fff` — revenue / primary metrics
- `var(--green)` / `#34d98b` — health / success / green states
- `var(--amber)` / `#f5a623` — risk / warning / amber states
- `var(--blue)` / `#60a5fa` — volume / informational / blue states

Corner glow (all stat cards):
```
position: absolute; bottom: -15px; right: -15px;
width: 60px; height: 60px; border-radius: 50%;
background: <matching-glow-token>;
filter: blur(16px);
pointer-events: none;
```

### Section Headers

```
<small-caps label> ——————————————————— (1px rule)
```

`font-size: 10px`, `letter-spacing: 0.1em`, `color: rgba(255,255,255,0.25)`. Rule is `flex: 1; height: 1px; background: rgba(255,255,255,0.05)`. Implemented as a flex row.

### Entity Rows (clients, projects, staff)

- 20×20px logo/avatar (`border-radius: 4px`) + name block (name + inline 3px progress bar) + status dot (7px, green/amber/red)
- Container: `display: flex; align-items: center; gap: 8px; padding: 6px 8px`
- Hover: `background: rgba(255,255,255,0.03); border-radius: 5px`
- Progress bar: `height: 3px`, `background: rgba(255,255,255,0.05)`, fill colour matches semantic type

### Tables

- Header: 10px small caps muted, `border-bottom: 1px solid rgba(255,255,255,0.05)`, `padding: 6px 10px`
- Rows: `padding: 6px 10px`, `border-bottom: 1px solid rgba(255,255,255,0.03)`, hover lift `rgba(255,255,255,0.02)`
- Status badges inline — existing badge class names **unchanged**

### Badges & Tags

Pill shape (`border-radius: 20px`). Existing dynamic class names **unchanged** — never rename:
`badgeGreen`, `badgeRed`, `badgeAmber`, `badgePurple`, `badgeMuted`, `badgeAccent`

### Empty States

Centred layout: icon (24px, muted) → heading (14px, `var(--text)`) → sub-text (12px, `var(--muted)`). No illustrations.

---

## 5. Design Tokens

### New Tokens (add to `admin/core.module.css` on `.dashboardRoot`)

```css
/* Rail & fly-out */
--rail-w: 52px;
--flyout-w: 200px;
--rail-bg: #09090f;
--flyout-bg: #0e0e1a;

/* Corner glows */
--glow-purple: rgba(139, 111, 255, 0.18);
--glow-green:  rgba(52, 217, 139, 0.15);
--glow-amber:  rgba(245, 166, 35, 0.15);
--glow-blue:   rgba(96, 165, 250, 0.15);
```

### Token Migration — Sidebar Width

`--sw` and `--sidebar-w` are referenced throughout `core.module.css` and `shared/shell.module.css`. To avoid breaking shared CSS that uses these tokens, keep them as aliases:

```css
/* Legacy alias — keeps shared/shell.module.css intact */
--sw: var(--rail-w);
--sidebar-w: var(--sw);
```

All existing `.main`, `.topbar` layout offsets that use `calc(var(--sidebar-w) + 32px)` will then resolve to `calc(52px + 32px) = 84px` by default (rail only). When the fly-out is open, a `.flyoutOpen` class on `.dashboardRoot` overrides:

```css
.flyoutOpen .main,
.flyoutOpen .topbar {
  left: calc(var(--rail-w) + var(--flyout-w));  /* 252px */
}
```

### Existing Tokens — Values Confirmed from Codebase

These match the actual codebase values (do not change):

```css
--s1: #0d0d14    /* page / shell bg */
--s2: #13131e    /* card background  ← use this for stat cards */
--s3: #171726    /* input / nested surface */
--accent: #8b6fff
--accent2: #a989ff
--accent-d: rgba(139, 111, 255, 0.16)
--accent-g: rgba(139, 111, 255, 0.08)
--green: #34d98b
--amber: #f5a623
--red: #ff5f5f
--blue: #60a5fa
--text: #f0ede8
--muted: rgba(240, 237, 232, 0.45)
--topbar-h: 44px    /* changes from 64px */
```

---

## 6. CSS Architecture

### File Structure (unchanged)

```
apps/web/src/app/style/admin/
  core.module.css          ← shell layout, rail, fly-out, topbar, tokens
  pages-a.module.css       ← executive, owner, revops, cashflow pages
  pages-b.module.css       ← payroll, expenses, brand, experience pages
  pages-c.module.css       ← legal, competitor intel pages
  pages-clm.module.css     ← all client-related pages
  pages-analytics.module.css
  pages-misc.module.css    ← automation, access, settings, remaining pages
```

### What Changes

**`admin/core.module.css`**
- Full rewrite of `.shell`, `.sidebar` (renamed to `.rail`), new `.flyout` class
- Topbar: height `64px → 44px`, positioning `top: 16px; left: calc(var(--sidebar-w) + 32px)` → `top: 0; left: var(--rail-w); right: 0; border-radius: 0`
- `.main` padding-top: update from `calc(64px + 32px)` to `calc(var(--topbar-h) + 12px)`
- Add `--rail-w`, `--flyout-w`, `--rail-bg`, `--flyout-bg`, `--glow-*` tokens on `.dashboardRoot`
- Add `--sw: var(--rail-w)` alias to keep shared CSS working
- Add `.flyoutOpen` modifier class for layout offset transitions

**`shared/shell.module.css`**
- Remove any `.sidebar`-specific width overrides that reference `--sw` by value (they will now resolve correctly via the alias)
- Specifically audit and update: `.sidebarMobileOpen` max-width constraint (currently locks to 240px — change to `var(--flyout-w)` for the fly-out drawer on mobile)

**`admin/pages-*.module.css`**
- Update card, stat, entity row, section header, and table styles in place to match the new card system from Section 4
- Target file for homepage/executive page layout: update the existing executive page class grid to match the Command Brief layout (Row 1 hero strip, Row 2 3-col KPIs, Row 3 activity feed)

**`admin.module.css`** (primitives at `apps/web/src/app/style/admin.module.css`)
- Update KPI row top-border pattern to use the new semantic colour tokens
- Update entity table row hover state

### JSX Changes Required

Two shell components require JSX changes (page components are untouched):

**`sidebar.tsx`**
- Add `activeSectionId: string | null` and `flyoutOpen: boolean` local state (or lift to `useAdminNavigation` hook if preferred)
- Render: icon rail (`<nav className={styles.rail}>`) + conditional fly-out panel (`<div className={styles.flyout}>`) listing pages for the active section
- On section icon click: set `activeSectionId`, set `flyoutOpen: true`, add `.flyoutOpen` class to root or pass via context
- On outside click / page navigate: close fly-out
- Existing `visibleNavItems` and `grouped` data from `useAdminNavigation()` drive the fly-out content — no new data fetching

**`topbar.tsx`**
- Replace `topbarTitle` (current page name) with breadcrumb component: section name + separator + page name, both sourced from existing `visibleNavItems` / `page` props
- Add status pills row: reads `navBadgeCounts` from `useAdminNavigation()` (already available) to render conditional green/amber/red pills
- Add period chip (static or from existing date context)
- Remove: apps button, help button, search button (these can be removed or collapsed into profile menu)

### What Does Not Change

- Custom cursor: `.cursor`, `.cursorRing` classes and `cursor: none` on `.dashboardRoot` are **preserved unchanged**
- All 96 page components — zero JSX changes
- `style.ts` spread pattern — unchanged
- All dynamic class names: `badgeGreen`, `badgeRed`, `badgeAmber`, `badgePurple`, `badgeMuted`, `badgeAccent`, `pfPurple`, `pfGreen`, `pfAmber`, `pfRed`, `bgGreen`, `bgAmber`, `bgPurple`, `bgRed`, `topbarStatusGreen`, `topbarStatusAmber`, `topbarStatusRed`, `navBadgeAmber`, `navBadgeRed` — **never rename any of these**
- All hooks: `use-admin-navigation`, `use-admin-data`, `use-admin-automation`, `use-admin-tour`
- `config.ts`, `constants.ts`, page routing logic
- `use-admin-navigation()` data: `page`, `visibleNavItems`, `grouped`, `navBadgeCounts`, `handlePageChange` — all consumed as-is
- Authentication, session management, API calls

---

## 7. Responsive Behaviour

- **≤ 1080px:** Fly-out panel overlays content (fixed position) rather than pushing `.main`
- **≤ 900px:** Rail and fly-out collapse behind the existing hamburger button (`hamburgerBtn` in `maphari-dashboard.tsx` — do not add a duplicate). Opening the hamburger shows the rail + fly-out as a full-height drawer. Update `.sidebarMobileOpen` in `shared/shell.module.css` to use `width: calc(var(--rail-w) + var(--flyout-w))`.
- **≤ 480px:** Single column layouts across all stat grids — existing breakpoints preserved, adjusted for new rail width offset

---

## 8. Out of Scope

- No changes to functionality, data, or API calls
- No changes to client dashboard or staff dashboard
- No new pages or page routing
- No changes to authentication or session management
- No animation beyond fly-out slide-in (180ms) and `.main` margin transition (180ms)
- No changes to the 96 page component JSX files

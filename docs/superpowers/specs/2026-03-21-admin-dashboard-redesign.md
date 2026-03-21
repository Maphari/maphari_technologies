# Admin Dashboard Redesign — Design Spec

**Date:** 2026-03-21
**Scope:** UI/visual redesign only — zero changes to functionality, routing, hooks, or data flow
**Approach:** Structured Authority — confident, data-first, purposeful use of purple accent

---

## 1. Design Direction

**Structured Authority.** The admin dashboard is an operational command centre. The design language reflects that: a permanent icon rail anchors the left edge, a live status topbar replaces the generic header, and spaced cards with semantic colour accents give every metric a clear identity. No decorative flourishes — every visual element earns its place by communicating state or hierarchy.

---

## 2. Shell Architecture

### 2.1 Icon Rail (replaces 240px sidebar)

- **Width:** 52px (`--rail-w: 52px`), fixed left, full viewport height
- **Background:** `--rail-bg: #09090f`
- **Right border:** 1px `rgba(255,255,255,0.05)`
- **Purple identity stripe:** 2px solid `--accent` running the full height of the rail's right edge
- **Contents (top to bottom):**
  - Logo mark (20×20px, `border-radius: 4px`, `background: #8b6fff`) — 12px top padding
  - Section icons — one per navigation group (Operations, Experience, Finance, Communication, Governance, Knowledge, Lifecycle, AI/ML, Automation)
  - Section divider dots (4px wide, `rgba(255,255,255,0.12)`) between groups
  - Profile avatar pinned to bottom
- **Icon states:**
  - Default: 32×32px, `border-radius: 8px`, `background: rgba(255,255,255,0.04)`
  - Hover: `background: rgba(139,111,255,0.12)`
  - Active (fly-out open): `background: #8b6fff`
- **Tooltips:** Section name on hover, right-aligned, `border-radius: 6px`, `background: #1a1a2e`

### 2.2 Fly-out Panel

- **Trigger:** Click section icon to open; click elsewhere or navigate to close
- **Width:** 200px (`--flyout-w: 200px`)
- **Position:** Slides out directly to the right of the rail (total nav width = 252px when open)
- **Background:** `--flyout-bg: #0e0e1a`
- **Right border:** `1px solid rgba(139,111,255,0.12)`
- **Box shadow:** `4px 0 20px rgba(0,0,0,0.4)`
- **Animation:** `translateX` slide-in, 180ms `ease-out`
- **Contents:**
  - Section heading: small caps, `rgba(139,111,255,0.6)`, `letter-spacing: 0.1em`, 8px padding
  - Nav items: dot (5px, `border-radius: 50%`) + label text, `padding: 6px 10px`, `border-radius: 6px`
  - Active item: `background: rgba(139,111,255,0.2)`, dot `background: #8b6fff`, label `color: #f0ede8`
  - Hover item: `background: rgba(255,255,255,0.04)`
  - Badge counts: small pill, right-aligned, amber/red per severity

### 2.3 Topbar — Live Status Bar

- **Height:** 44px (`--topbar-h: 44px`)
- **Background:** `#08080e`
- **Top border:** 2px solid `#8b6fff` (purple identity stripe — continues from rail)
- **Bottom border:** `1px solid rgba(255,255,255,0.04)`
- **Layout (left → right):**
  1. Breadcrumb — `Section / Page` in DM Mono, 10px, root segments `rgba(255,255,255,0.3)`, active segment `#f0ede8`
  2. Divider: 1px × 16px `rgba(255,255,255,0.06)`, 8px margins
  3. Status pills — conditionally rendered when count > 0:
     - Green: `N clients active` (`rgba(52,217,139,0.08)` bg, `#34d98b` pip)
     - Amber: `N blockers` (`rgba(245,166,35,0.08)` bg, `#f5a623` pip)
     - Red: `N at risk` (`rgba(255,95,95,0.08)` bg, `#ff5f5f` pip)
  4. Spacer (flex: 1)
  5. Period chip: `Mar 2026` in DM Mono, `background: rgba(139,111,255,0.1)`, `border: 1px solid rgba(139,111,255,0.2)`
  6. Notification icon button (28×28px, badge dot for unread)
  7. Avatar (28×28px, `border-radius: 50%`, purple gradient)

---

## 3. Homepage — Executive Command Brief

Default landing page when opening the admin dashboard.

### Row 1 — Hero Strip

Full-width card (`background: #0f0f1c`, `border: 1px solid rgba(139,111,255,0.12)`, `border-radius: 8px`):

- **Left:** Primary metric — label (`MONTHLY REVENUE`, small caps muted), value (`$124K` in DM Mono 24px bold white), delta (`↑ +8.4% vs last month` in DM Mono 12px `#34d98b`)
- **Center-right:** 2 mini-stat cards stacked — Active Clients, SLA Score
- **Far right column:** Alert feed — heading `ALERTS` (small caps muted), then 3–5 alert rows each with a coloured icon block (amber/red/green) + short description text + sub-label

Purple corner glow: `60px × 60px`, `border-radius: 50%`, `rgba(139,111,255,0.15)`, `filter: blur(16px)`, bottom-right positioned.

### Row 2 — Secondary KPI Strip

3-column grid, equal width, `gap: 12px`:

| Card | Top Border | Metric |
|---|---|---|
| Projects Active | `#8b6fff` | count |
| At Risk | `#f5a623` | count |
| Pipeline Value | `#34d98b` | currency |

Each card: `background: #0f0f1c`, 2px coloured top border, value in DM Mono bold, label in small caps muted, matching corner glow.

### Row 3 — Activity Feed

Full-width card — `RECENT ACTIVITY` section header + rule divider, then 5–8 entity rows:
- Coloured icon block (12×12px, semantic colour) + activity description + timestamp (DM Mono muted) + status badge

---

## 4. Content & Card System

### Stat Cards

```
background:   #0f0f1c
border:       1px solid rgba(139,111,255,0.1)
border-top:   2px solid <semantic-colour>
border-radius: 8px
padding:      14px 16px
```

Semantic top-border colours:
- `#8b6fff` — revenue / primary metrics
- `#34d98b` — health / success / green states
- `#f5a623` — risk / warning / amber states
- `#60a5fa` — volume / informational / blue states

Corner glow (all stat cards): matching colour at 15–25% opacity, `filter: blur(16px)`, `60px × 60px`, positioned `bottom: -15px; right: -15px`.

### Section Headers

```
<small-caps label> ——————————————————— (1px rule)
```

`font-size: 10px`, `letter-spacing: 0.1em`, `color: rgba(255,255,255,0.25)`. Rule is `1px solid rgba(255,255,255,0.05)`, flex-grows to fill remaining width.

### Entity Rows (clients, projects, staff)

- Logo/avatar (20×20px, `border-radius: 4px`) + name block (name line + inline progress bar) + status dot (7px, green/amber/red)
- Hover: `background: rgba(255,255,255,0.03)`, `border-radius: 5px`
- Progress bar: 3px height, `background: rgba(255,255,255,0.05)`, fill colour matches semantic type

### Tables

- Header: small caps muted, `border-bottom: 1px solid rgba(255,255,255,0.05)`, `padding: 6px 10px`
- Rows: `padding: 6px 10px`, `border-bottom: 1px solid rgba(255,255,255,0.03)`, hover lift
- Status badges inline — existing badge class names unchanged

### Badges & Tags

Pill shape (`border-radius: 20px`). Existing dynamic class names **unchanged**:
`badgeGreen`, `badgeRed`, `badgeAmber`, `badgePurple`, `badgeMuted`, `badgeAccent`

### Empty States

Centred layout: icon (24px, muted) → heading (14px, `#f0ede8`) → sub-text (12px, muted). No illustrations.

---

## 5. Design Tokens

### New / Updated Tokens (in `admin/core.module.css`)

```css
/* Rail & fly-out */
--rail-w: 52px;
--flyout-w: 200px;
--rail-bg: #09090f;
--flyout-bg: #0e0e1a;

/* Surfaces */
--s1: #0d0d14;   /* page background */
--s2: #0f0f1c;   /* card background */
--s3: #13131e;   /* input / nested */

/* Corner glows */
--glow-purple: rgba(139, 111, 255, 0.18);
--glow-green:  rgba(52, 217, 139, 0.15);
--glow-amber:  rgba(245, 166, 35, 0.15);
--glow-blue:   rgba(96, 165, 250, 0.15);
```

### Unchanged Tokens

```css
--bg: #050508
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
--topbar-h: 44px
```

### Typography

- Primary: `var(--font-syne), sans-serif` — all headings, labels, UI text
- Monospace: `var(--font-dm-mono), monospace` — all numbers, currency, percentages, dates, breadcrumbs
- No Instrument Serif on admin (spec rule unchanged)

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

- `core.module.css` — full rewrite of `.shell`, `.sidebar`→`.rail`, new `.flyout`, `.topbar` layout
- `pages-*.module.css` — update card, stat, entity row, section header, table styles in place
- `admin.module.css` — update KPI row and entity table primitives
- `shell.module.css` (shared) — remove sidebar-specific overrides that are superseded

### What Does Not Change

- All hook logic (`use-admin-navigation`, `use-admin-data`, `use-admin-automation`, `use-admin-tour`)
- All 96 page components — JSX untouched, only CSS class implementations updated
- `style.ts` spread pattern
- All dynamic class names (`badgeGreen`, `pfPurple`, `topbarStatusGreen`, etc.)
- Responsive media queries — carried forward, adjusted for new rail width
- `config.ts`, `constants.ts`, routing logic

---

## 7. Responsive Behaviour

- **≤ 1080px:** Fly-out panel overlays content rather than pushing it (fixed position over main area)
- **≤ 900px:** Rail collapses behind hamburger button; fly-out becomes full-height drawer
- **≤ 480px:** Single column layouts across all stat grids (existing breakpoints preserved)

---

## 8. Out of Scope

- No changes to functionality, data, or API calls
- No changes to client dashboard or staff dashboard
- No new pages or page routing
- No changes to authentication or session management
- No animation beyond the fly-out slide-in (180ms)

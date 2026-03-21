# Client Dashboard Redesign — Design Spec
**Date:** 2026-03-21
**Scope:** Full Visual Rebuild — UI/CSS only, no functional or logic changes
**Approach:** Option 2 — Full Visual Rebuild (all CSS files + shell + home page layout)

---

## 1. Design Direction

**Obsidian Precision** — dark canvas, lime green accent, refined and leaner than the current design. Floating island sidebar, glass/atmospheric card surfaces, bold Syne typography. The goal is a premium, intentional feel where every surface has depth and every element is purposefully placed.

---

## 2. Design Token System

### Background & Surfaces
```css
--bg:    #04040a                      /* page canvas (deeper than current #050508) */
--s1:    rgba(255,255,255, 0.04)      /* glass card surface */
--s2:    rgba(255,255,255, 0.07)      /* hover state */
--s3:    rgba(255,255,255, 0.10)      /* active / selected */
```

### Borders
```css
--b1:    rgba(255,255,255, 0.06)      /* dividers */
--b2:    rgba(255,255,255, 0.10)      /* card borders */
--b3:    rgba(255,255,255, 0.16)      /* focus / hover */
--b-top: rgba(255,255,255, 0.12)      /* inset top shimmer on glass cards */
```

### Accent & Semantic Palette (unchanged)
```css
--lime:   #c8f135    --lime2:  #d6f55a   /* primary CTA, active states */
--green:  #4dde8f    --amber:  #f5a623   --red:    #ff5f5f
--cyan:   #3dd9d6    --purple: #8b6fff   --blue:   #5b9cf5
/* All colors retain existing -d (dim) variants */
```

### Text
```css
--text:   #f0ede8
--muted:  rgba(240,237,232, 0.50)     /* bumped up from 0.45 */
--muted2: rgba(240,237,232, 0.28)
```

### Radius Scale (rounder than current)
```css
--r-xs:  8px    /* chips, badges */
--r-sm:  12px   /* buttons, inputs */
--r-md:  16px   /* cards */
--r-lg:  20px   /* sidebar island, modals */
--r-xl:  28px   /* home hero card */
```

### Shadows
```css
--shadow-card:    0 8px 32px rgba(0,0,0,0.40), inset 0 1px 0 var(--b-top)
--shadow-island:  0 16px 48px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)
--shadow-modal:   0 24px 64px rgba(0,0,0,0.60)
```

### Ambient Glow (new)
```css
--glow-lime: radial-gradient(ellipse at 30% 10%, rgba(200,241,53,0.07) 0%, transparent 55%)
--glow-page: radial-gradient(ellipse at 70% 80%, rgba(91,156,245,0.04) 0%, transparent 50%)
```
Applied as `background-image` on `.clientRoot` or page-level containers. Lime top-left, blue bottom-right.

### Typography
```
Headings:     Syne, weight 800, letter-spacing -0.02em
Subheadings:  Syne, weight 700
Body:         Syne, weight 400–500
Labels/chips: DM Mono, weight 500, letter-spacing 0.04em
Eyebrows:     DM Mono, weight 400, uppercase, letter-spacing 0.08em
KPI numbers:  Syne, weight 800, letter-spacing -0.04em
```

---

## 3. Shell Layout

### Sidebar — Floating Island
- **Width:** 52px icon rail
- **Position:** Fixed left with 12px inset margin on all sides
- **Shape:** `border-radius: 20px` — fully rounded on all corners (floats detached from viewport edge)
- **Surface:** `background: rgba(255,255,255,0.05)`, `border: 1px solid rgba(255,255,255,0.09)`, `backdrop-filter: blur(12px)`
- **Shadow:** `var(--shadow-island)`
- **Top shimmer:** `::before` pseudo with `linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent)` at 1px height
- **Contents (top to bottom):**
  - Logo mark (32px, lime gradient, 10px radius, lime glow shadow)
  - Icon nav buttons (40×38px, 11px radius, active state: lime bg 13% + 1px lime border)
  - Section divider (24px wide, 1px, rgba white 8%)
  - Secondary nav icons
  - Spacer (flex: 1)
  - User avatar (30px circle, lime tint bg + border, DM Mono initials)
- **Notification pip:** 6px red dot, absolute top-right of icon, lime border mask
- **Tooltip on hover:** Small glass pill appears to the right with nav label (DM Mono 9px)

### Topbar — Glass Pill
- **Height:** 52px
- **Position:** Inside `.main`, margin `12px 12px 0 0` (floated, not full-width)
- **Shape:** `border-radius: 14px`
- **Surface:** Same glass system as cards — `rgba(255,255,255,0.04)`, backdrop blur, inset shimmer
- **Left:** DM Mono eyebrow (section name) + Syne 800 page title
- **Right:** Search pill (110px wide, ⌘K shortcut), separator, notification button (with red pip), 2× icon buttons, separator, user avatar
- **No lime top border stripe** (removed — replaced by the floating glass aesthetic)

### Content Area
- **Padding:** `12px 12px 12px 0` (no left padding — sidebar island handles its own margin)
- **Background:** Transparent — ambient glow visible through from `.clientRoot`
- **Scroll:** `overflow-y: auto` on `.content`

---

## 4. Glass Card System

Every card across all 72 pages uses this surface pattern:

```css
.card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 16px;                        /* --r-md */
  backdrop-filter: blur(8px);
  box-shadow: var(--shadow-card);
  position: relative;
  overflow: hidden;
}
/* Inset top shimmer */
.card::before {
  content: '';
  position: absolute;
  top: 0; left: 16px; right: 16px; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.09), transparent);
}
```

**Accent-tinted cards** (lime, green, amber, red, purple, blue):
- Border becomes `rgba(<color>, 0.17–0.18)`
- `::before` shimmer becomes `rgba(<color>, 0.25–0.28)`
- Optional: very subtle `rgba(<color>, 0.03–0.05)` background tint

---

## 5. Component Inventory

### KPI / Stat Cards
- Eyebrow: DM Mono 8px uppercase 0.08em spacing, muted2 color
- Value: Syne 800 24–28px, letter-spacing -0.04em
- Subtext: Syne 10px, muted
- Bar: 3px track (`rgba(255,255,255,0.06)`), gradient fill + glow shadow
  - Lime: `linear-gradient(90deg, #c8f135, #8fed0c)` + `box-shadow: 0 0 8px rgba(200,241,53,0.4)`
  - Green: `linear-gradient(90deg, #4dde8f, #2abc70)` + green glow
  - Amber: `linear-gradient(90deg, #f5a623, #e09020)` + amber glow
  - Blue: `linear-gradient(90deg, #5b9cf5, #3a7de0)` + blue glow

### Stat Cards (with accent bar)
- Slim row with left accent bar (3px wide, top/bottom 14% inset, glowing)
- Value: Syne 800 18px
- Label: DM Mono 8px uppercase

### Badges
```
Structure: pip dot (5px circle with glow) + DM Mono 9px text
Radius: 8px (--r-xs)
Border: 1px solid rgba(<color>, 0.22)
Background: rgba(<color>, 0.10)
```
Tones: `lime` `green` `amber` `red` `purple` `muted`

### Buttons
- **Primary:** `background: #c8f135`, `color: #07100a`, Syne 700 11px, 12px radius, lime glow shadow
- **Secondary:** Glass surface + `rgba(255,255,255,0.12)` border
- **Ghost:** Transparent + `rgba(255,255,255,0.09)` border
- **Danger:** `rgba(255,95,95,0.10)` bg + red border + red text
- **Sizes:** Default (9px padding 18px) and `sm` (6px padding 12px, 8px radius)

### Inputs
- Glass surface `rgba(255,255,255,0.05)`, 1px border `rgba(255,255,255,0.10)`, 10px radius
- Placeholder: `--muted2`
- Focus: `border-color: rgba(200,241,53,0.40)`, `box-shadow: 0 0 0 3px rgba(200,241,53,0.08)`
- Label: DM Mono 8.5px uppercase above field

### Progress Bars (large, labeled)
- 5px track height
- Header row: Syne 10px label left + DM Mono 9px percentage right
- Gradient fills with glow shadows (same as KPI bars)

### Activity Rows
- Left: 6–7px circle dot with color glow
- Center: Syne 10–11px event text (flex 1)
- Right: DM Mono time string or badge
- Divider: `border-bottom: 1px solid rgba(255,255,255,0.05)`

### Approval Cards
- Glass card base
- Title: Syne 700 12px
- Subtitle: DM Mono 8px muted2
- Actions row: Primary (approve) + Ghost (request changes) buttons

### Toggles
- Track: 34×18px, 9px radius
- Off: `rgba(255,255,255,0.08)` bg
- On: `rgba(200,241,53,0.20)` bg + lime border
- Thumb: 12px circle; On state → lime fill + glow, translate right

---

## 6. Home Page Layout

Five zones stacked vertically inside the shell:

```
┌─────────────────────────────────────────────────┐
│  HERO CARD (full width)                         │
│  Lime glow dot · Active phase + sprint · CTA    │
├────────┬────────┬────────┬────────────────────── │
│ Health │ Sprint │ Budget │ Milestones            │
│  KPI   │  KPI   │  KPI   │  KPI                 │
├──────────────────────────┬──────────────────────┤
│                          │ APPROVALS             │
│   ACTIVITY FEED          │ Pending items · CTA  │
│   Glowing dot rows       ├──────────────────────┤
│                          │ UPCOMING              │
│                          │ Calls · invoices · ↓ │
└──────────────────────────┴──────────────────────┘
```

- **Hero:** `border-radius: 18px (--r-xl)`, lime tinted border + shimmer, glow dot, DM Mono eyebrow, Syne 800 title, solid lime CTA
- **KPI row:** 4 equal-width glass cards, accent-tinted border matching metric color
- **Activity feed:** `flex: 1.4`, scrollable, 5 most recent events
- **Approvals:** `flex: 1`, lime accent border, red count badge, inline approve/decline
- **Upcoming:** Compact rows with icon, title, countdown badge

---

## 7. CSS File Change Map

| File | Change Type | Notes |
|------|-------------|-------|
| `maphari-dashboard-shared.module.css` | Full rewrite | New shell tokens, island sidebar, glass topbar |
| `shell.module.css` | Full rewrite | Shell layout, sidebar, topbar, mobile overlay |
| `core.module.css` | Restyle | Command search, tour, session warning, loading |
| `pages-home.module.css` | Full rewrite | New 5-zone home page layout |
| `pages-a.module.css` | Token update | Surface/border/radius vars → new system |
| `pages-b.module.css` | Token update | Surface/border/radius vars → new system |
| `pages-c.module.css` | Token update | Surface/border/radius vars → new system |
| `pages-d.module.css` | Token update | Surface/border/radius vars → new system |
| `pages-misc.module.css` | Token update | Surface/border/radius vars → new system |
| `maphari-client-dashboard.module.css` | Token update | Legacy monolith — update `.clientRoot` token defs |

**Dynamic class names preserved (no renames):**
`badgeGreen`, `badgeRed`, `badgeAmber`, `badgePurple`, `badgeMuted`, `badgeAccent`, `pfPurple`, `pfGreen`, `pfAmber`, `pfRed`, `bgGreen`, `bgAmber`, `bgPurple`, `bgRed`, `statBarAccent`, `statBarAmber`, `statBarRed`, `statBarPurple`, `statBarGreen`, `topbarStatusGreen`, `topbarStatusAmber`, `topbarStatusRed`, `progressFillAmber`, `progressFillRed`, `progressFillGreen`, `progressFillPurple`, `activityIconAccent`, `activityIconAmber`, `activityIconRed`, `activityIconPurple`, `actionCardBarAccent`, `actionCardBarAmber`, `actionCardBarRed`, `actionCardBarPurple`, `notifRowAccent`, `notifRowAmber`, `notifRowRed`, `notifRowPurple`, `notifRowGreen`, `navBadgeAmber`, `navBadgeRed`

---

## 8. What Does NOT Change

- All JSX/TSX component files (zero functional changes)
- All hooks (`use-client-data`, `use-client-navigation`, etc.)
- All data fetching, API calls, context providers
- All class names in CSS modules (values change, names stay)
- Page routing logic and navigation structure
- Responsive breakpoints (preserved as-is)
- White-label support in topbar

---

## 9. Success Criteria

- [ ] Shell renders with floating island sidebar and glass topbar
- [ ] Every card across all 72 pages uses glass surface system
- [ ] Ambient glow visible on all page backgrounds
- [ ] All accent colors retained and correctly tinted
- [ ] All dynamic CSS class names present and functional
- [ ] No TypeScript errors introduced
- [ ] No visual regressions on existing responsive breakpoints
- [ ] Home page renders all 5 zones correctly

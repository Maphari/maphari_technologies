# Maphari Technologies — UI Design System
## Three-Dashboard Design Language

**Version:** 3.0 | **Updated:** March 2026
**Scope:** Client Portal (`/portal/*`) · Admin Dashboard (`/admin/*`) · Staff Dashboard (`/admin/*`)
**Status:** Production — Complete

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Colour System](#2-colour-system)
3. [Typography](#3-typography)
4. [Spacing & Layout](#4-spacing--layout)
5. [Component Library](#5-component-library)
   - 5.1 Buttons · 5.2 Status Chips · 5.3 Cards · 5.4 Sidebar · 5.5 Topbar
   - 5.6 Modals · 5.7 Toasts · 5.8 Custom Cursor · 5.9 Data Table
   - 5.10 Tooltip · 5.11 Popover · 5.12 Notification Drawer · 5.13 Dropdown
6. [Icon System](#6-icon-system)
7. [Motion & Animation](#7-motion--animation)
8. [Form Patterns](#8-form-patterns)
9. [Data Display Patterns](#9-data-display-patterns)
10. [Loading & Empty States](#10-loading--empty-states)
11. [Dashboard Profiles](#11-dashboard-profiles)
12. [Architecture Context](#12-architecture-context)
13. [Accessibility](#13-accessibility)
14. [Implementation Reference](#14-implementation-reference)
15. [Navigation Patterns](#15-navigation-patterns)
    - 15.1 Page Tabs · 15.2 Breadcrumbs · 15.3 Pagination · 15.4 Jump Links
16. [Search Pattern](#16-search-pattern)
    - 16.1 Inline Search · 16.2 Global Search / Command Palette
17. [Changelog](#17-changelog)
18. [Contributing Guide](#18-contributing-guide)
19. [UX Feel & Interaction Principles](#19-ux-feel--interaction-principles)
    - 19.1 How the Interface Should Feel · 19.2 Nielsen's 10 Heuristics Applied · 19.3 Laws of UX Applied
    - 19.4 Micro-interactions & Tactile Feedback · 19.5 Progressive Disclosure
20. [Cognitive Load & Information Architecture](#20-cognitive-load--information-architecture)
    - 20.1 Reducing Extraneous Load · 20.2 Gestalt Principles · 20.3 Visual Hierarchy Rules
    - 20.4 Hick's Law — Limiting Choice · 20.5 Chunking & Grouping
21. [UX Writing & Microcopy](#21-ux-writing--microcopy)
    - 21.1 Voice & Tone · 21.2 Error Messages · 21.3 Empty States
    - 21.4 Confirmation & Destructive Actions · 21.5 Button Labels · 21.6 Tooltips & Helper Text
22. [Frontend Design Craft](#22-frontend-design-craft)
    - 22.1 Design Thinking Before Coding · 22.2 Aesthetic Direction & Tone · 22.3 Typography Craft
    - 22.4 Colour & Theme Execution · 22.5 Motion & Animation Craft · 22.6 Spatial Composition
    - 22.7 Backgrounds & Visual Atmosphere · 22.8 What to Avoid · 22.9 Production Readiness Standard

---

## 1. Design Philosophy

**Dark brutalism** — structural honesty as the primary aesthetic. No decorative chrome, no unnecessary softness. Every element earns its place by serving a function.

> "The client feels guided. The staff feels focused. The admin feels in control."

### Core Principles

| Principle | Description |
|-----------|-------------|
| **Structural Clarity** | Layout communicates hierarchy before any content is read. Negative space is a design element, not an absence. |
| **Semantic Colour** | Colour carries meaning. Green means progress. Amber means attention. Red means action required. Accent means identity. This contract never breaks. |
| **Data Density by Role** | Admin surfaces carry the most information. Client surfaces carry the least noise. Staff surfaces optimise for speed of interaction. |
| **Motion as Feedback** | Animation exists to orient the user, not entertain them. Entries are quick. Exits are instant. |
| **Typographic Discipline** | Two families, two purposes. Syne for human-readable content. DM Mono for machine-generated data. Instrument Serif for decorative moments only. |

### Surface Hierarchy

```
Page background (--bg)
  └── Cards & Sidebar (--surface / --s1)
        └── Inputs, inset panels (--surface2 / --s3)
              └── Selected / focused states (--s4)
```

---

## 2. Colour System

### 2.1 Global Foundation

All three dashboards share this base. Never override these with dashboard-specific values — accent layering handles differentiation.

| CSS Variable   | Hex / Value                    | WCAG on `--bg` | Role                            |
|----------------|--------------------------------|----------------|---------------------------------|
| `--bg`         | `#050508`                      | —              | Page background                 |
| `--surface`    | `#0d0d14`                      | —              | Cards, sidebar                  |
| `--surface2`   | `#111118`                      | —              | Inset surfaces, inputs          |
| `--border`     | `rgba(255,255,255,0.07)`        | —              | Default dividers                |
| `--border2`    | `rgba(255,255,255,0.13)`        | —              | Hover / active dividers         |
| `--text`       | `#f0ede8`                      | 17.3:1 ✓ AAA   | Primary text                    |
| `--muted`      | `rgba(240,237,232,0.45)`        | 7.2:1 ✓ AA     | Secondary text, descriptions    |
| `--muted2`     | `rgba(240,237,232,0.22)`        | 4.6:1 ✓ AA     | Tertiary text, labels           |
| `--muted3`     | `rgba(240,237,232,0.08)`        | —              | Ghost backgrounds, hover fills  |

### 2.2 Dashboard Accent Colours

Each dashboard has one primary accent. The accent drives CTAs, active nav states, focus rings, and the topbar identity stripe.

| Dashboard       | Accent Token   | Hex       | WCAG on `--bg` | Personality                          |
|-----------------|----------------|-----------|----------------|--------------------------------------|
| Client Portal   | `--accent`     | `#c8f135` | 12.4:1 ✓ AAA   | Growth, progress, approval, energy   |
| Admin Dashboard | `--accent`     | `#8b6fff` | 6.1:1 ✓ AA     | Authority, control, oversight        |
| Staff Dashboard | `--accent`     | `#3dd9d6` | 8.9:1 ✓ AAA    | Focus, precision, workflow, clarity  |

> **Implementation:** `--accent` is a scoped CSS custom property set on the root dashboard wrapper (`.clientRoot`, `.adminRoot`, `.staffRoot`). All shared components reference `--accent` — never hardcode a hex inside a shared component.

### 2.3 Semantic Colours

Semantic colours are **dashboard-agnostic** — they carry identical meaning across all three surfaces.

| Token      | Hex        | Fill (`-dim`)              | Text contrast on `--bg` | Usage                            |
|------------|------------|----------------------------|-------------------------|----------------------------------|
| `--green`  | `#4dde8f`  | `rgba(77,222,143,0.12)`     | 9.8:1 ✓ AAA             | Success, paid, approved, online  |
| `--amber`  | `#f5a623`  | `rgba(245,166,35,0.12)`     | 8.1:1 ✓ AAA             | Warning, pending, in-progress    |
| `--red`    | `#ff5f5f`  | `rgba(255,95,95,0.12)`      | 5.5:1 ✓ AA              | Error, overdue, declined, danger |
| `--cyan`   | `#3dd9d6`  | `rgba(61,217,214,0.12)`     | 8.9:1 ✓ AAA             | Info, neutral highlight          |
| `--purple` | `#8b6fff`  | `rgba(139,111,255,0.14)`    | 6.1:1 ✓ AA              | Special states, admin identity   |

### 2.4 Design Token Aliases (Client Dashboard)

The client dashboard uses a refined token alias layer for component-level specificity.

| Alias Token  | Maps To               | Purpose                           |
|--------------|-----------------------|-----------------------------------|
| `--s1`       | `--surface`           | Card background                   |
| `--s2`       | `+3% lightness step`  | Hover state background            |
| `--s3`       | `--surface2`          | Input / inset background          |
| `--s4`       | `+6% lightness step`  | Selected / active background      |
| `--b1`       | `--border`            | Subtle dividers                   |
| `--b2`       | `--border2`           | Card borders, component borders   |
| `--b3`       | `rgba(255,255,255,0.22)` | Focus rings, hover states      |
| `--lime`     | `#c8f135`             | Primary accent                    |
| `--lime2`    | `#d6f55a`             | Hover accent (lighter)            |
| `--lime-d`   | `rgba(200,241,53,0.10)` | Accent fill background          |
| `--lime-g`   | `rgba(200,241,53,0.05)` | Ghost accent fill               |
| `--r-xs`     | `6px`                 | Chip, tag radius                  |
| `--r-sm`     | `8px`                 | Button, input radius              |
| `--r-md`     | `12px`                | Card radius                       |
| `--r-lg`     | `16px`                | Modal, panel radius               |

---

## 3. Typography

### 3.1 Font Stack

| Family             | Source        | Role                                            | Weights Used         |
|--------------------|---------------|-------------------------------------------------|----------------------|
| **Syne**           | Google Fonts  | Headings, nav labels, buttons, section titles   | 400, 600, 700, 800   |
| **DM Mono**        | Google Fonts  | Data values, timestamps, chips, metadata, IDs   | 300, 400, 500        |
| **Instrument Serif** | Google Fonts | Decorative subtitles, marketing moments only    | 400 italic           |

**Loading strategy:** Preconnect to `fonts.googleapis.com`. Load `display=swap` to prevent invisible text during font load.

### 3.2 Type Scale

| Role                | Size         | Line Height | Weight  | Family           | Letter Spacing |
|---------------------|--------------|-------------|---------|------------------|----------------|
| Logo / wordmark     | `0.72rem`    | 1           | 800     | Syne             | `0.18em`       |
| Page title (H1)     | `1.7rem`     | 1.1         | 800     | Syne             | `-0.025em`     |
| Section heading (H2)| `1.1rem`     | 1.2         | 700     | Syne             | `-0.015em`     |
| Card title          | `0.82rem`    | 1.3         | 800     | Syne             | —              |
| Item name           | `0.78–0.80rem` | 1.4       | 700     | Syne             | —              |
| Body / description  | `0.80rem`    | 1.55        | 400     | Syne             | —              |
| Section label       | `0.72rem`    | 1           | 800     | Syne             | `0.06em`       |
| Sidebar group label | `0.52rem`    | 1           | 400     | DM Mono          | `0.22em`       |
| Data value (primary)| `0.70rem`    | 1.3         | 500–700 | DM Mono          | —              |
| Data value (secondary)| `0.62rem`  | 1.3         | 400     | DM Mono          | —              |
| Chip / badge text   | `0.52rem`    | 1           | 700     | DM Mono          | `0.06em`       |
| Metadata / caption  | `0.56–0.60rem` | 1.4       | 400     | DM Mono          | —              |
| Eyebrow label       | `0.60rem`    | 1           | 400     | DM Mono          | `0.18em`       |
| Decorative subtitle | `0.90rem`    | 1.4         | 400     | Instrument Serif | italic         |

### 3.3 Typography Rules

- **Uppercase** is reserved for: section labels, eyebrow labels, chip text, sidebar group labels, primary button text.
- **Instrument Serif** appears only in Client Portal — never Admin or Staff surfaces.
- **DM Mono** for any value that could be copy-pasted (IDs, amounts, dates, counts, codes).
- Line length target: 60–75 characters for body text. Use `max-width` on prose containers.

---

## 3.4 Text Look & Feel

This section governs how text must visually appear and emotionally read across all three dashboards. Rules here are non-negotiable — they preserve the **dark brutalist** character while keeping every surface legible, hierarchy-clear, and cognitively light.

---

### 3.4.1 Weight Strategy on Dark Surfaces

Dark backgrounds optically amplify weight. A `font-weight: 400` body sentence reads heavier on `#050508` than on white. Compensate deliberately:

| Context | Weight Rule |
|---|---|
| Body / description text | `400` — never higher unless emphasising |
| Item names, card titles | `700–800` — no in-between |
| Secondary / helper text | `400`, reduced opacity via `--muted` or `--muted2` |
| Eyebrow labels, chips | `700` DM Mono — weight replaces size |
| Data values (primary metric) | `500–700` DM Mono — heavier = more critical |
| Sidebar nav labels (active) | `700` Syne — resting state `400` |
| Buttons | `700–800` Syne, uppercase, never light weight |

**Rules:**
- Never use `font-weight: 300` on dark surfaces — thin strokes disappear below `0.70rem` at normal screen densities.
- Never use `font-weight: 500` for Syne headings — the optical gap between `400` and `700` is the hierarchy signal. `500` muddies it.
- Bold (`700+`) is a scarce resource. Overusing it collapses the hierarchy. If everything is bold, nothing is.

---

### 3.4.2 Text Colour Tiers

The colour system provides four opacity tiers for text. Use them strictly — never introduce ad-hoc rgba values for text.

| Token | Approx. Contrast on `--bg` | Intended Use |
|---|---|---|
| `--text` (`#f0ede8`) | 17.3:1 ✓ AAA | Page titles, item names, primary content — anything the user must read |
| `--muted` (`rgba(240,237,232,0.45)`) | 7.2:1 ✓ AA | Descriptions, supporting copy, secondary labels |
| `--muted2` (`rgba(240,237,232,0.22)`) | 4.6:1 ✓ AA | Captions, metadata, timestamps, helper text |
| `--muted3` (`rgba(240,237,232,0.08)`) | — | Ghost placeholders, disabled text, decorative divider labels only |

**Application rules:**
- Every visible text element must map to exactly one of these four tiers. No exceptions.
- `--muted3` must never be used for functional text — it fails contrast for body copy and is reserved for decorative/placeholder use only.
- Do not lighten `--text` manually for "less important" content — drop to `--muted` instead.
- Semantic colours (`--green`, `--amber`, `--red`, `--lime`) may appear as text **only** for status indicators, badges, and inline emphasis on critical data. Never for body prose.

---

### 3.4.3 Contrast Rules

This system targets WCAG 2.2 AA as a floor, AAA where achievable. Dark-on-dark failures are the most common mistake.

| Text Type | Minimum Ratio | Target |
|---|---|---|
| Normal body text (< 18px) | 4.5:1 | 7:1+ |
| Large text (18px+ or 14px bold) | 3:1 | 5:1+ |
| UI component labels (buttons, chips) | 4.5:1 | AAA |
| Placeholder / ghost text | No minimum | Never functional |

**Critical rules:**
- Never place `--muted` text on a surface that isn't `--bg` or `--s1` without re-checking contrast — elevated surfaces reduce the contrast gap.
- Never use pure white (`#ffffff`) on `--bg`. Use `--text` (`#f0ede8`) — the warmth reduces glare and eye strain over long sessions.
- Never place coloured text (e.g. `--amber`) directly on a coloured background (e.g. `--amber` fill) without a weight or size boost.
- Accent text (`--lime`, `--accent`) achieves 12.4:1 on `--bg`. Do not dilute with opacity — use as-is.

---

### 3.4.4 Line Height & Reading Rhythm

Line height is the primary control for reading comfort. The system distinguishes three reading modes:

| Mode | Context | Line Height |
|---|---|---|
| **Scan** | Labels, chips, nav items, single-line metadata | `1.0–1.1` — no leading, tight optical grouping |
| **Skim** | Card descriptions, table rows, list items | `1.4–1.5` — breathing room between rows |
| **Read** | Prose descriptions, onboarding copy, support text | `1.55–1.65` — optimal for 60–75 char lines |

**Rules:**
- `line-height: 1` is valid **only** for single-line, non-wrapping elements (labels, chips, mono values).
- If text can wrap, it must use a minimum line height of `1.4`.
- DM Mono data values use `1.3` — mono spacing is inherently tighter; additional leading creates misalignment in data grids.
- Never set `line-height` in `px` — always use unitless multipliers so the value scales with font-size.

---

### 3.4.5 Letter Spacing Discipline

Letter spacing modifies the perceived weight and formality of text. Use it surgically — it should never appear arbitrary.

| Context | Spacing | Rationale |
|---|---|---|
| Headings H1 (`1.7rem`) | `-0.025em` | Tight tracking at large sizes prevents gaps between characters |
| Section heading H2 (`1.1rem`) | `-0.015em` | Slight tightening preserves punch |
| Body / description text | `0` | Natural tracking; no modification |
| Section labels (uppercase, small) | `0.06em` | Loosens uppercase cap-height density |
| Sidebar group labels (mono, uppercase) | `0.22em` | Wide tracking makes small uppercase scannable |
| Eyebrow labels (mono) | `0.18em` | Pairs with uppercase for typographic contrast |
| Chip / badge text | `0.06em` | Minimum tracking on compact uppercase mono |
| Logo / wordmark | `0.18em` | Branding requires deliberate spacing |

**Rules:**
- Negative letter spacing is only valid for text `≥ 1.0rem`. Below that, tightening destroys legibility on dark surfaces.
- Positive letter spacing above `0.25em` is a logo/wordmark-only zone. Do not apply to UI copy.
- Never apply letter spacing to DM Mono data values — monospace fonts have built-in metrics for data alignment that custom tracking disrupts.

---

### 3.4.6 Typographic Hierarchy Enforcement

The hierarchy must be obvious in a half-second scan. If a user has to read to understand the structure, the hierarchy has failed.

**The four-level hierarchy:**

```
Level 1 — Title     Syne 800, 1.7rem, --text            Page name, dashboard header
Level 2 — Section   Syne 700, 1.1rem, --text            Card title, section heading
Level 3 — Body      Syne 400, 0.80rem, --muted           Descriptions, supporting copy
Level 4 — Meta      DM Mono 400, 0.56–0.62rem, --muted2  Timestamps, IDs, captions
```

**Rules:**
- Never skip a level. A Level 4 element next to a Level 1 heading with nothing in between signals a broken hierarchy.
- Size alone does not create hierarchy — size + weight + colour tier work together. Changing only one of the three is insufficient.
- Limit to **three** type size variations per card or page section. More creates visual noise.
- Active/selected states communicate hierarchy through `--accent` colour, never through font-size change.

---

### 3.4.7 Text Truncation & Overflow

Long text in data-dense UIs must be handled systematically. Wrapping is the exception, not the default.

| Element | Behaviour | Max Length |
|---|---|---|
| Item names, row labels | Truncate with `…` | ~40 characters |
| Card descriptions | Clamp to 2 lines (`-webkit-line-clamp: 2`) | — |
| Sidebar nav labels | No truncation — labels must fit by design | ≤ 22 characters |
| Chip / badge text | No truncation — chips must not wrap | ≤ 18 characters |
| Data values (DM Mono) | Never truncate — show full value or abbreviate | Use `1M`, `1.2B` |
| Tooltip content | Free-form, max 280 characters | — |

**Rules:**
- Always pair truncation with a `title` attribute or tooltip that exposes the full text.
- Never truncate IDs, amounts, or codes — truncated machine data is worse than no data.
- Abbreviate large numbers using `K` / `M` / `B` suffixes in DM Mono: `12,400 → 12.4K`. Always include the unit.

---

### 3.4.8 Data Formatting Standards

All machine-readable values rendered in DM Mono follow these formatting rules. Consistency here is non-negotiable — users build mental models from patterns.

| Data Type | Format | Example |
|---|---|---|
| Currency | Symbol prefix, 2 decimal places | `$1,234.56` |
| Large currency | Abbreviated suffix | `$1.2M` |
| Percentage | One decimal place | `12.4%` |
| Large integer | Comma-separated | `1,234,567` |
| Abbreviated number | One decimal + suffix | `14.3K`, `2.1M` |
| Date (full) | `DD MMM YYYY` | `13 Mar 2025` |
| Date (short) | `DD MMM` | `13 Mar` |
| Time | 12-hour, no leading zero | `2:30 PM` |
| Relative time | Lowercase, short | `2h ago`, `3d ago` |
| ID / code | Monospace, never truncated | `#INV-00412` |
| Duration | `Xh Ym` format | `1h 30m` |

---

### 3.4.9 Text Do's and Don'ts

#### Do
- Use `--text` for anything the user must act on or read first.
- Drop to `--muted` or `--muted2` to create depth — not size reduction.
- Apply letter spacing to uppercase labels; remove it from flowing prose.
- Pair weight changes with colour-tier changes for compound emphasis.
- Test body text at 1× screen zoom in a dark room — if it strains, it's too light or too small.
- Use `font-variant-numeric: tabular-nums` on all DM Mono data values so columns align in tables.

#### Don't
- Don't use `font-weight: 300` — it vanishes on dark surfaces.
- Don't place more than three levels of typographic weight on a single card.
- Don't apply `text-shadow` or `glow` effects to body copy — this system's brutalist tone rejects decoration.
- Don't use italic in Syne — the family has no designed italic; the browser skew is visually incorrect.
- Don't rely on colour alone to convey meaning — pair colour with weight or position.
- Don't use pure `#ffffff` white for text — use `--text` (`#f0ede8`).
- Don't set `font-size` below `0.52rem` (`~8px`) — below this threshold, DM Mono glyphs lose distinctiveness.
- Don't mix sentence case and title case within the same component — pick one and commit.

---

## 4. Spacing & Layout

### 4.1 Spacing Scale

| Token       | Value    | Primary Usage                          |
|-------------|----------|----------------------------------------|
| `space-xs`  | `4px`    | Icon-to-label gaps, chip inner padding |
| `space-sm`  | `8px`    | Button vertical padding, tight gaps    |
| `space-md`  | `12px`   | Row padding, list item gaps            |
| `space-md+` | `14px`   | Card internal gaps                     |
| `space-lg`  | `16px`   | Card padding (compact), sidebar items  |
| `space-lg+` | `20px`   | Card padding (standard)                |
| `space-xl`  | `24px`   | Section gaps, topbar horizontal pad    |
| `space-xl+` | `28px`   | Section gaps (spacious contexts)       |
| `space-2xl` | `32px`   | Page content horizontal padding        |
| `space-3xl` | `48px`   | Bottom breathing room, hero gaps       |

### 4.2 Layout Architecture

```
┌─────────────────────────────────────────────┐
│              TOPBAR — 60px sticky            │
├────────────┬────────────────────────────────┤
│            │                                │
│  SIDEBAR   │         MAIN CONTENT           │
│  230px     │         flex: 1                │
│  fixed     │         overflow-y: scroll     │
│            │         padding: 32px          │
│            │                                │
└────────────┴────────────────────────────────┘
```

| Region           | Width / Height | Position  | Scroll           |
|------------------|----------------|-----------|------------------|
| Topbar           | 100% × 60px    | `sticky`  | Pins at top      |
| Sidebar          | 230px          | `fixed`   | Independent scroll |
| Main content     | `flex: 1`      | `relative`| `overflow-y: auto` |
| Content padding  | `32px`         | —         | —                |

### 4.3 Responsive Strategy

These are internal dashboards — the primary target is desktop (1280px+). Responsive support is secondary but must not break at common viewport widths.

| Breakpoint     | Viewport    | Behaviour                                   |
|----------------|-------------|---------------------------------------------|
| Desktop (base) | ≥1280px     | Full sidebar + content layout               |
| Laptop         | 1024–1279px | Sidebar collapses to icons only (48px)      |
| Tablet         | 768–1023px  | Sidebar hidden, accessible via hamburger    |
| Mobile         | <768px      | Not officially supported — degraded gracefully |

### 4.4 Content Grid

Inside the main content area, cards and panels follow a responsive CSS grid:

```css
/* Standard dashboard grid */
display: grid;
grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
gap: 16px;

/* Stat cards row */
grid-template-columns: repeat(4, 1fr); /* collapses to 2 at laptop */

/* Detail / form panels */
grid-template-columns: 1fr 360px; /* main content + aside */
```

---

## 4.5 Padding Rules

Padding is a structural decision, not a visual afterthought. These rules are binding across all three dashboards. Every padding value must be derivable from the 4pt grid and applied using the principles below.

---

### 4.5.1 Foundational Grid Rule

**All padding values must be multiples of 4px.**

```
4 · 8 · 12 · 16 · 20 · 24 · 28 · 32 · 40 · 48
```

No padding value outside this sequence is permitted. Arbitrary values (e.g. `10px`, `15px`, `18px`, `22px`) are a sign of guesswork — replace them with the nearest 4pt step.

> **Why 4pt?** 4px divides cleanly into 8pt grid halves. It aligns to device pixel ratios (1×, 1.5×, 2×, 3×) without sub-pixel rendering. It makes the spacing system memorisable and developer-friendly.

---

### 4.5.2 Internal ≤ External Rule

The padding *inside* a component must never exceed the space *surrounding* it. This ensures elements read as distinct objects, not a wall of merged content.

```
Outer gap between cards: 16px
  └── Card internal padding: 16–20px   ✓ equal or just above — acceptable
        └── Inner section gap: 12px    ✓ less than card padding — correct
              └── Icon-label gap: 4px  ✓ tightest — correct
```

If a component's internal padding is larger than its surrounding margin/gap, it visually detaches from the page and becomes an isolated slab. Adjust the outer gap up, or the inner padding down.

---

### 4.5.3 Inset Types

Three inset types exist. Each communicates a different relationship between container and content:

| Type | CSS | Value example | Use when |
|---|---|---|---|
| **Uniform inset** | `padding: N` | `padding: 20px` | Content and container feel balanced — cards, modals, panels |
| **Squish inset** | `padding: N/2 N` | `padding: 8px 16px` | Horizontal emphasis — buttons, chips, tags, nav pills |
| **Stretch inset** | `padding: N*1.5 N` | `padding: 24px 16px` | Content needs vertical breathing room — form sections, empty states |

Never apply a uniform inset to a button — buttons always use squish inset so horizontal text has room and vertical touch targets stay compact.

---

### 4.5.4 Component Padding Specifications

#### Cards

| Density | Padding | Inner section gap | When to use |
|---|---|---|---|
| Compact | `16px` | `8px` | Stat cards, small data widgets, sidebar panels |
| Standard | `20px` | `12px` | Most content cards, project cards, list containers |
| Spacious | `24px` | `16px` | Detail panels, empty states, onboarding cards |

- The card's `padding` applies uniformly on all four sides.
- Inner section gap (`gap` in flex/grid) separates logical groups within the card.
- Never mix density levels within the same card grid row — all cards in a row share the same density.
- Card header and card body are separated by a `1px` divider with `12px` vertical margin above and below it.

#### Buttons

All buttons use squish inset. Horizontal padding is always 2× vertical padding.

| Size | Padding (V × H) | Height | Font size |
|---|---|---|---|
| Small | `6px 12px` | `28px` | `0.70rem` |
| Default | `8px 16px` | `36px` | `0.78rem` |
| Large | `10px 20px` | `44px` | `0.82rem` |
| Icon-only | `8px` (uniform) | `36px` | — |

- Icon buttons use uniform inset — they are square by intention.
- Button group gap: `8px` between adjacent buttons.
- Never add more than `24px` horizontal padding — wide buttons look unbalanced against compact dashboard content.
- Touch target minimum: `44px` height (WCAG 2.5.5). The Large size satisfies this; Default may need a `min-height: 44px` on touch-primary surfaces.

#### Inputs & Form Fields

| Element | Padding (V × H) | Height |
|---|---|---|
| Text input | `8px 12px` | `36px` |
| Textarea | `10px 12px` | `auto` (min `80px`) |
| Select / dropdown trigger | `8px 12px` | `36px` |
| Search input | `8px 12px 8px 36px` | `36px` (left pad reserves icon space) |
| Input label → field gap | `4px` vertical | — |
| Field → field gap | `16px` vertical | — |
| Field group → field group gap | `24px` vertical | — |

- Never reduce input padding below `8px 12px` — it makes the field look undersized and increases tap error rate.
- Search input reserves `36px` on the left for the search icon. The icon is positioned absolute at `left: 10px`, vertically centred.
- Required field asterisk (`*`) sits `4px` to the right of the label, in `--red`, inline.

#### Modals & Drawers

| Region | Padding |
|---|---|
| Modal header | `20px 24px` |
| Modal body | `0 24px 24px` (top handled by header bottom border + gap) |
| Modal footer | `16px 24px` |
| Drawer (side panel) | `24px` uniform |
| Modal header → body divider gap | `0` — divider is flush |
| Footer → body divider gap | `0` — divider is flush |

- Modal width: `480px` default, `640px` for complex forms, `360px` for confirmation dialogs.
- Never exceed `24px` padding in a modal — wider padding on a fixed-width container wastes horizontal space.
- Bottom padding of modal body is `24px`, not `0` — content must not sit flush against the footer divider.

#### Sidebar

| Region | Padding |
|---|---|
| Sidebar shell (left + right) | `12px` |
| Nav item (resting) | `8px 12px` (squish inset) |
| Nav item (active) | `8px 12px` — background extends edge-to-edge within `12px` shell |
| Nav group header label | `4px 12px` — tight, label is decorative |
| Nav item icon → label gap | `8px` |
| Nav section → nav section gap | `16px` |
| Sidebar footer area top border gap | `16px` above, `12px` below |

- Nav items never exceed `40px` height including padding. Taller items suggest a list, not a nav.
- Active state background uses `border-radius: var(--r-sm)` and fills `calc(100% - 0px)` within the shell — no horizontal gap.
- Sub-nav items indent by `16px` additional left padding: `8px 12px 8px 28px`.

#### Topbar

| Region | Padding |
|---|---|
| Topbar shell (left + right) | `24px` |
| Topbar left group gap (logo → nav) | `24px` |
| Topbar right group gap (actions) | `8px` between icon buttons |
| Topbar icon button | `8px` uniform (icon-only squish) |

- Topbar height is fixed at `60px`. Padding adjusts the horizontal rhythm, not the height.
- No vertical padding rule — items are vertically centred with `align-items: center` and `height: 60px`.

#### Data Tables & List Rows

| Context | Row padding (V × H) |
|---|---|
| Dense table rows | `8px 12px` |
| Standard table rows | `12px 16px` |
| Spacious list items | `14px 16px` |
| Table header row | `8px 16px` — same H, less V than body rows |
| Column header → body divider | `1px`, no extra gap |

- Row padding is always squish inset — tables are horizontally scannable.
- The first and last column cells carry an extra `4px` left/right padding respectively, so content doesn't kiss the table border.
- Cell content max-width: apply `white-space: nowrap` + truncation rather than wrapping inside a cell.

#### Chips, Badges & Tags

| Element | Padding |
|---|---|
| Status chip / badge | `2px 8px` (squish — very tight, text is small) |
| Filter tag (interactive) | `4px 10px` |
| Notification count badge | `2px 6px` — or circle at `18px` for single digits |

- Chip padding must never exceed `4px 12px` — chips are not buttons.
- Circle badges (single digit) use `width = height = 18px` with `border-radius: 50%`. No padding — content centres.

#### Tooltips & Popovers

| Element | Padding |
|---|---|
| Tooltip | `6px 10px` — tight, single line |
| Popover / mini-panel | `16px` uniform |
| Popover header → body gap | `12px` |

- Tooltip content must fit in one line where possible. Multi-line tooltips use `max-width: 220px` with `padding: 8px 12px`.
- Popovers are not modals — never exceed `24px` padding or they grow too heavy.

#### Notification Drawer & Rows

| Region | Padding |
|---|---|
| Drawer shell | `0` — rows handle their own padding |
| Notification row | `12px 16px` |
| Notification row icon → content gap | `12px` |
| Row divider gap | `0` — dividers are flush |
| Drawer header | `16px 20px` |

---

### 4.5.5 Padding in Density Contexts

This system uses two density modes for content-heavy areas:

| Mode | Base card padding | Row padding | Gap between cards |
|---|---|---|---|
| **Standard** | `20px` | `12px 16px` | `16px` |
| **Compact** | `16px` | `8px 12px` | `12px` |

- The default for all dashboards is **Standard**.
- **Compact** is available for power-user views (admin tables, staff task lists) where data density is prioritised.
- Never create a third custom density — use one of these two.
- Density mode applies to the entire page view, not individual cards. Mixing densities on the same page is a layout error.

---

### 4.5.6 Padding Do's and Don'ts

#### Do
- Use only multiples of `4px` for all padding values.
- Apply squish inset (`padding: V H` where `H = 2×V`) to all interactive inline elements (buttons, chips, nav items).
- Apply uniform inset to containers (cards, modals, panels, drawers).
- Keep inner padding ≤ surrounding gap. If inner padding must be larger, increase the outer gap first.
- Collapse padding on the open side of flush-edge components (e.g., zero top padding on modal body — the header provides it).
- Reserve `40–48px` padding for page-level whitespace only (hero areas, empty state centring).
- Use `gap` in flex/grid layouts for spacing between children — not margin on children.

#### Don't
- Don't use arbitrary values: `10px`, `15px`, `18px`, `22px` — round to the nearest 4pt step.
- Don't pad an icon-and-label button with uniform inset — it creates a taller-than-wide blob. Use squish.
- Don't reduce card padding below `16px` — below this threshold the content feels trapped inside the border.
- Don't add padding to the topbar or sidebar height — those dimensions are fixed; only horizontal rhythm is padded.
- Don't use `padding` to create spacing between sibling elements — use `gap` or `margin` so the element's hit area stays predictable.
- Don't apply different padding to the same component in different parts of the UI — if a card uses `20px`, every card uses `20px` in that density mode.
- Don't nest more than three levels of padding contexts (page → section → card → cell). Deeper nesting collapses the internal ≤ external rule.

---

## 5. Component Library

### 5.1 Buttons

#### Variants

| Variant       | Background        | Text           | Border              | Hover                              |
|---------------|-------------------|----------------|---------------------|------------------------------------|
| **Primary**   | `--accent`        | `#050508`      | none                | `translateY(-1px)` + shadow lift   |
| **Ghost**     | `transparent`     | `--muted`      | `1px --border`      | `--muted3` fill, `--text` text     |
| **Outline**   | `transparent`     | `--accent`     | `1px --accent`      | `--lime-d` fill                    |
| **Destructive** | `transparent`   | `--red`        | `1px --red`         | `rgba(255,95,95,0.12)` fill        |
| **Icon-only** | `--muted3`        | `--muted`      | none                | `--border2` fill                   |

#### States

All buttons must implement: `default`, `hover`, `active` (scale 0.97), `focus-visible` (2px accent outline, 2px offset), `disabled` (opacity 0.4, no-pointer).

#### Sizing

| Size | Height | Padding (H) | Font size | Letter spacing |
|------|--------|-------------|-----------|----------------|
| sm   | 30px   | 10px        | 0.70rem   | 0.06em         |
| md   | 36px   | 14px        | 0.75rem   | 0.06em         |
| lg   | 42px   | 18px        | 0.80rem   | 0.04em         |

All button text: Syne, weight 800, uppercase.

---

### 5.2 Status Chips / Badges

**Geometry:** `border-radius: 99px` (pill) | `padding: 3px 8px` | `DM Mono 0.52rem 700 uppercase`

| Variant     | Background                  | Text colour   | Use case                      |
|-------------|-----------------------------|---------------|-------------------------------|
| `green`     | `rgba(77,222,143,0.12)`     | `#4dde8f`     | Paid, active, approved, done  |
| `amber`     | `rgba(245,166,35,0.12)`     | `#f5a623`     | Pending, in-review, partial   |
| `red`       | `rgba(255,95,95,0.12)`      | `#ff5f5f`     | Failed, overdue, rejected     |
| `purple`    | `rgba(139,111,255,0.14)`    | `#8b6fff`     | Admin states, flagged         |
| `cyan`      | `rgba(61,217,214,0.12)`     | `#3dd9d6`     | Info, staff assignment        |
| `accent`    | `rgba(200,241,53,0.10)`     | `#c8f135`     | Client identity, highlighted  |
| `muted`     | `rgba(240,237,232,0.07)`    | `--muted`     | Draft, archived, inactive     |

Chips never wrap. Apply `white-space: nowrap; max-width: 140px; overflow: hidden; text-overflow: ellipsis` on truncating contexts.

---

### 5.3 Cards

```
Background:  --surface (--s1)
Border:      1px solid --border (--b2)
Radius:      --r-md (12px)
Padding:     20–22px
Shadow:      --shadow-card
Entry:       fadeSlideUp 320ms ease-out
```

**Card anatomy:**

```
┌─────────────────────────────┐
│ [icon?] Title    [badge?]   │  ← Card header, border-bottom: --border
│─────────────────────────────│
│ Content region              │
│                             │
│─────────────────────────────│
│ [action?]        [action?]  │  ← Card footer (optional)
└─────────────────────────────┘
```

**Variants:**
- **Stat card** — large numeric value + label + trend indicator
- **List card** — header + scrollable row list
- **Detail card** — label/value pairs in two-column grid
- **Action card** — content + primary CTA, coloured left border for category

---

### 5.4 Sidebar

```
Width:         230px
Background:    --surface
Border-right:  1px solid --border
Padding-top:   8px
```

**Sidebar item anatomy:**
- Height: 38px
- Padding: `0 16px`
- Left border: `2px solid transparent` → `2px solid --accent` on active
- Active background: `--lime-g` (or accent-scoped equivalent)
- Icon + label layout: `gap: 10px`, icon `16px × 16px`

**Sidebar group label:** `DM Mono 0.52rem 400 uppercase letter-spacing: 0.22em --muted2`

**Sidebar badge (unread count):** `DM Mono 0.52rem 700`, pill, amber or red variant only. Right-aligned.

---

### 5.5 Topbar

```
Height:     60px
Position:   sticky top:0
Z-index:    100
Background: --bg with backdrop-filter: blur(12px)
Border-bottom: 1px solid --border
```

Contains: logo/wordmark (left), page title (left-center), action cluster (right — notifications, user avatar).

**Identity stripe:** 2px top border in `--accent` colour to reinforce dashboard identity at a glance.

---

### 5.6 Modals

```
Backdrop:   rgba(5,5,8,0.72) blur(8px)
Container:  max-width 480px, width: calc(100% - 48px)
Background: --surface
Border:     1px solid --border2
Radius:     --r-lg (16px)
Padding:    28px
Shadow:     --shadow-modal
Entry:      modalIn 280ms ease-out
```

**Modal anatomy:**
```
┌─────────────────────────────┐
│ Title               [✕]    │
│─────────────────────────────│
│                             │
│  Body content               │
│                             │
│─────────────────────────────│
│ [Secondary CTA]  [Primary]  │
└─────────────────────────────┘
```

**Rules:**
- Destructive confirmation modals: red accent border-top, destructive button variant.
- Always trap focus within open modal.
- Close on `Escape` key and backdrop click (except destructive confirmations — backdrop click only).
- Never open a modal from within a modal.

---

### 5.7 Toasts / Notifications

```
Position:  fixed bottom-right, 24px from edges
Z-index:   9999
Width:     320px
Padding:   14px 16px
Background: --surface
Border:    1px solid --border2
Border-left: 3px solid [semantic colour]
Radius:    --r-sm (8px)
Entry:     toastIn 240ms ease-out
Auto-dismiss: 3400ms (errors: 5000ms, no auto-dismiss)
```

| Type    | Left border | Icon        |
|---------|-------------|-------------|
| Success | `--green`   | check-circle |
| Warning | `--amber`   | alert-triangle |
| Error   | `--red`     | x-circle    |
| Info    | `--cyan`    | info         |

Max 3 toasts visible at once. Excess queues and appears on dismiss.

---

### 5.8 Custom Cursor

```
Dot:  10px × 10px, background: --accent, border-radius: 50%
      mix-blend-mode: difference, pointer-events: none
Ring: 32px × 32px, border: 1.5px solid --accent at 0.35 opacity
      lagging follow: 120ms cubic-bezier(0.23, 1, 0.32, 1)
      pointer-events: none
```

Cursor scales on interactive elements: dot → 6px, ring → 48px.
Cursor hidden on text inputs (system cursor restores).

---

### 5.9 Data Table

```
Background:     --surface
Border:         1px solid --border
Border-radius:  --r-md
Overflow:       hidden
```

| Element       | Style                                                    |
|---------------|----------------------------------------------------------|
| Table header  | `--surface2` bg, `DM Mono 0.60rem 400 uppercase 0.12em` |
| Row           | `border-bottom: 1px solid --border`, 44px min-height    |
| Row hover     | `--muted3` background                                    |
| Row selected  | `--lime-g` background + `--b3` left border              |
| Cell padding  | `12px 16px`                                              |
| Numeric cells | `DM Mono`, right-aligned                                 |
| Sortable col  | Arrow icon appears on header hover                       |

Pagination: DM Mono, ghost buttons for prev/next, current page chip.

---

### 5.10 Tooltip

Tooltips surface supplemental context on hover or focus. They never contain interactive content.

```
Background:    --surface2
Border:        1px solid --border2
Border-radius: --r-xs (6px)
Padding:       6px 10px
Font:          DM Mono 0.60rem 400 --text
Max-width:     220px
Shadow:        0 4px 12px rgba(0,0,0,0.4)
Z-index:       9000
Entry:         fadeIn 150ms ease-out after 400ms hover delay
Exit:          opacity:0 80ms — instant feel
```

**Placement priority:** top → bottom → right → left. Shifts automatically if viewport edge is hit.

**Rules:**
- Tooltip delay on hover: `400ms` (prevents flicker on cursor passing over)
- Tooltip delay on focus: `0ms` (immediate for keyboard users)
- Never put links, buttons, or form elements inside a tooltip — use a Popover instead
- `role="tooltip"` + `aria-describedby` on the trigger element
- Max one line where possible. Two lines max. Never wrap more than that.

---

### 5.11 Popover

Popovers are positioned overlays that can contain interactive content — filters, quick forms, confirmation prompts, rich previews.

```
Background:    --surface
Border:        1px solid --border2
Border-radius: --r-md (12px)
Padding:       16px
Min-width:     200px
Max-width:     320px
Shadow:        --shadow-modal
Z-index:       8000
Entry:         scaleIn 200ms ease-out
Exit:          opacity:0 + scale(0.97) 120ms
```

**Placement:** same priority as Tooltip. Arrow indicator (6px triangle) points to trigger.

**Dismissal:**
- Click outside closes
- `Escape` closes and returns focus to trigger
- Clicking the trigger again closes (toggle behaviour)

**Focus management:** On open, focus moves to the first interactive element inside the popover. On close, focus returns to trigger.

**Variants:**
- **Info popover** — read-only, rich content (user card, project preview)
- **Action popover** — list of contextual actions (right-click / kebab menu equivalent)
- **Filter popover** — checkbox/radio groups for table column filtering
- **Confirm popover** — inline yes/no for low-stakes destructive actions (avoids full modal overhead)

---

### 5.12 Notification Drawer

The notification bell in the topbar opens a drawer panel anchored to the topbar right edge.

```
Width:          360px
Height:         calc(100vh - 60px)
Position:       fixed top:60px right:0
Background:     --surface
Border-left:    1px solid --border
Z-index:        500
Entry:          translateX(360px) → 0, 280ms ease-out
Exit:           translateX(360px), 200ms ease-in-out
Backdrop:       none (drawer does not block content, topbar bell re-dismisses)
```

**Drawer anatomy:**

```
┌─────────────────────────────┐
│ Notifications     [Mark all]│  ← Header, border-bottom: --border
│─────────────────────────────│
│ [TODAY]                     │  ← Group label: DM Mono 0.52rem uppercase --muted2
│                             │
│  ●  Actor did something     │  ← Unread row (--muted3 bg, accent left dot)
│     Project name · 2m ago   │
│─────────────────────────────│
│  ○  Actor did something     │  ← Read row (no bg, no dot)
│     Project name · 1h ago   │
│                             │
│ [YESTERDAY]                 │
│  ○  ...                     │
│─────────────────────────────│
│        Load more            │  ← Ghost button, DM Mono
└─────────────────────────────┘
```

**Notification row spec:**

```
Height:         min 56px
Padding:        12px 16px
Border-bottom:  1px solid --border
Unread dot:     6px circle, --accent, position: left of row content
Read state:     no dot, body text drops to --muted
Timestamp:      DM Mono 0.56rem --muted2, right-aligned or below actor line
Hover:          --muted3 background
```

**Notification types and their left border accent:**

| Type         | Accent        | Example trigger                          |
|--------------|---------------|------------------------------------------|
| Project      | `--accent`    | New project created, status changed      |
| Invoice      | `--green`     | Invoice paid, new invoice issued         |
| Contract     | `--purple`    | Contract sent for signing, signed        |
| Task         | `--cyan`      | Task assigned, task completed            |
| Urgent       | `--amber`     | Payment overdue, deadline approaching    |
| System       | `--muted`     | Maintenance notice, session expiry       |

**Bell badge:**
- Shows unread count up to `99+`
- Amber variant for 1–5 unread, red variant for 6+ unread
- Disappears when drawer is opened and all items are marked read

**State management:**
- Optimistically marks notifications as read on drawer open
- Persists read state via `PATCH /api/v1/notifications/read-all`
- Polling interval: `30s` when dashboard is active (WebSocket preferred when Chat service is available)

---

### 5.13 Dropdown Menu

Context menus and action menus triggered by a button (kebab `⋯`, chevron, or explicit "Actions" button).

```
Background:    --surface
Border:        1px solid --border2
Border-radius: --r-md (12px)
Padding:       6px
Min-width:     160px
Max-width:     240px
Shadow:        --shadow-modal
Z-index:       7000
Entry:         scaleIn 160ms ease-out (origin: trigger position)
Exit:          opacity:0 100ms
```

**Menu item spec:**

```
Height:         34px
Padding:        0 10px
Border-radius:  --r-sm (8px)
Font:           Syne 0.78rem 400 --text
Icon:           16px, --muted, gap: 8px
Hover:          --muted3 background
Destructive:    --red text, --red-d hover background
Disabled:       opacity: 0.4, no-pointer, no-hover
Separator:      1px solid --border, margin: 4px 0
```

**Keyboard navigation:**
- `ArrowDown` / `ArrowUp` moves focus through items
- `Enter` / `Space` activates focused item
- `Escape` closes and returns focus to trigger
- `Home` / `End` jump to first / last item
- Type-ahead: first character jumps to matching item

**Group labels:** DM Mono `0.52rem` 400 uppercase `--muted2`, padding `6px 10px 2px`, non-interactive.

---

## 6. Icon System

- **Library:** Lucide React (consistent stroke weight, tree-shakeable)
- **Default size:** `16px × 16px` in components, `20px` for standalone/topbar actions
- **Stroke width:** `1.5px` default, `2px` for emphasis contexts
- **Colour:** inherits `currentColor` — never hardcode icon colours
- **Accessibility:** decorative icons use `aria-hidden="true"`. Meaningful icons require `aria-label` on the parent button/link.

Icon-only interactive targets must be minimum `32px × 32px` touch target with visible hover state.

---

## 7. Motion & Animation

### 7.1 Core Easing

```css
--ease-out:    cubic-bezier(0.23, 1, 0.32, 1);   /* Default — aggressive ease-out */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);     /* Tab transitions, page changes */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* Micro-interactions only */
```

**Rule:** No `ease-in` on any visible enter animation. `ease-in` is perceived as sluggish.

### 7.2 Keyframe Definitions

| Name         | Keyframes                                                | Duration | Usage                        |
|--------------|----------------------------------------------------------|----------|------------------------------|
| `fadeSlideUp`| `translateY(8px) + opacity:0` → rest                    | 320ms    | Cards, list items, panels    |
| `fadeIn`     | `opacity:0` → `opacity:1`                               | 180ms    | Tooltips, overlays           |
| `modalIn`    | `scale(0.97) + translateY(10px) + opacity:0` → rest     | 280ms    | Modal open                   |
| `toastIn`    | `translateY(10px) + opacity:0` → rest                   | 240ms    | Toast appear                 |
| `slideInLeft`| `translateX(-12px) + opacity:0` → rest                  | 260ms    | Sidebar panels, drawers      |
| `scaleIn`    | `scale(0.94) + opacity:0` → rest                        | 200ms    | Dropdowns, popovers          |

### 7.3 Stagger Rules

| Context              | Stagger interval |
|----------------------|------------------|
| Standard card grid   | `index × 0.06s`  |
| Dense list rows      | `index × 0.04s`  |
| Stat cards           | `index × 0.05s`  |
| Max stagger children | 8 (beyond 8, all animate at once) |

### 7.4 Duration Guidelines

| Type                          | Duration     |
|-------------------------------|--------------|
| Micro-interactions (hover)    | 100–150ms    |
| Component transitions         | 180–240ms    |
| Page-level transitions        | 260–320ms    |
| Modals, overlays              | 240–300ms    |
| Nothing should exceed         | 400ms        |

### 7.5 Reduced Motion

All animations must respect `prefers-reduced-motion: reduce`. Wrap all `@keyframes` usage with:

```css
@media (prefers-reduced-motion: no-preference) {
  .component { animation: fadeSlideUp 320ms var(--ease-out); }
}
```

---

## 8. Form Patterns

### 8.1 Input Fields

```
Height:         40px
Background:     --surface2 (--s3)
Border:         1px solid --border (--b1)
Border-radius:  --r-sm (8px)
Padding:        0 12px
Font:           Syne 0.80rem 400
Color:          --text
Placeholder:    --muted2
```

**States:**

| State      | Border                         | Background     | Shadow                        |
|------------|--------------------------------|----------------|-------------------------------|
| Default    | `1px --border`                 | `--s3`         | none                          |
| Hover      | `1px --b2`                     | `--s3`         | none                          |
| Focus      | `1px --accent` + 2px offset ring | `--s3`       | `0 0 0 3px --lime-g`          |
| Error      | `1px --red`                    | `rgba(255,95,95,0.05)` | `0 0 0 3px rgba(255,95,95,0.08)` |
| Disabled   | `1px --b1`                     | `--muted3`     | opacity: 0.5                  |
| Read-only  | `1px --b1`                     | `transparent`  | cursor: default               |

### 8.2 Labels & Help Text

- **Label:** Syne `0.72rem` 700, `--text`, `margin-bottom: 6px`
- **Required indicator:** `--red` asterisk after label text
- **Help text:** DM Mono `0.60rem` 400, `--muted`, `margin-top: 4px`
- **Error text:** DM Mono `0.60rem` 400, `--red`, `margin-top: 4px`, prefixed with `⚠`

### 8.3 Select / Dropdown

Custom-styled to match input fields. Uses a native `<select>` behind a styled wrapper for accessibility, or a custom listbox with full keyboard navigation (`ArrowUp/Down`, `Enter`, `Escape`, type-ahead).

### 8.4 Checkbox & Radio

- Size: `16px × 16px`
- Checked state: `--accent` fill, `#050508` checkmark
- Focus: `2px solid --accent` outline, `2px offset`
- Error: `--red` border

### 8.5 Form Layout Rules

- One column on forms in modals (`max-width: 480px`)
- Two-column grid allowed for settings pages (label width: `200px` fixed)
- Field groups (`fieldset`) use `--border` separator with `8px` gap
- Submit actions always bottom-right aligned

---

## 9. Data Display Patterns

### 9.1 Stat Cards

```
Large value:   DM Mono 1.4–1.8rem 700 --text
Label:         DM Mono 0.60rem 400 uppercase --muted2
Trend:         DM Mono 0.60rem 500, --green (↑) / --red (↓) / --muted (→)
Period label:  DM Mono 0.56rem 400 --muted2
```

Trend values show delta from previous period: `+12.4%`, `-3.1%`. Never show raw delta without percentage.

### 9.2 Progress Bars

```
Track:         --muted3, border-radius: 99px, height: 4–6px
Fill:          --accent (standard) or semantic colour by context
Animated fill: width transition 600ms ease-out on mount
```

Colour variants: `accent`, `green`, `amber`, `red`, `purple`. Determined by value threshold or explicit prop.

### 9.3 Activity Feeds

Row anatomy: `[icon] [actor name] [action text] [target] [timestamp]`

- Icon: 28px circle background (`--muted3`) with semantic colour icon
- Actor: Syne `0.78rem` 700 `--text`
- Action text: Syne `0.78rem` 400 `--muted`
- Timestamp: DM Mono `0.56rem` 400 `--muted2`, right-aligned

### 9.4 Empty States

```
Container: centered, padding 48px 32px
Illustration: muted icon, 40–48px, --muted2
Heading: Syne 0.90rem 700 --muted
Body: Syne 0.78rem 400 --muted2, max-width: 280px, centered
CTA: Primary button (if action available)
```

Empty states are never an error. Copy should explain what goes here and provide a path forward.

---

## 10. Loading & Empty States

### 10.1 Skeleton Loading

Skeleton replaces content during async data load. Never show a spinner for content that has a known shape.

```css
background: linear-gradient(
  90deg,
  --muted3 25%,
  rgba(255,255,255,0.04) 50%,
  --muted3 75%
);
background-size: 200% 100%;
animation: shimmer 1.4s ease-in-out infinite;
border-radius: [match component radius]
```

Skeleton elements mirror the exact geometry of the content they replace.

### 10.2 Spinner

Used only for: full-page load, modal async actions, button loading state.

- Size: `16px` (inline/button) or `24px` (standalone)
- Colour: `--accent` or `--muted` depending on context
- `stroke-dasharray` CSS spinner (no GIF, no external library)

### 10.3 Error States

Full-page or card-level errors include:
- Semantic icon in `--red`
- Heading: "Something went wrong"
- Body: human-readable cause if available
- Retry button (ghost variant)
- Error reference code if applicable (DM Mono, `--muted2`)

---

## 11. Dashboard Profiles

### 11.1 Client Portal — "The Guided Partner"

**Accent:** `#c8f135` Lime
**Tone:** Warm · Transparent · Reassuring · Action-oriented

| Decision | Rationale |
|----------|-----------|
| Lime CTAs for all primary actions | Trustworthy visibility, high contrast |
| Green chips dominate status displays | Reinforces that things are progressing |
| Amber for pending items, never red unless truly blocked | Avoids alarming the client unnecessarily |
| Team member attribution on activity items | Human warmth, accountability |
| Instrument Serif in page headers | Premium feel, personalised tone |
| No raw data tables — data is interpreted | Clients need insight, not raw numbers |
| Contract, Invoice, and Project views are simplified | Scope is narrowed to what the client owns |

**Route prefix:** `/portal/*`
**Auth role:** `CLIENT`
**Data scope:** `WHERE clientId = scopedClientId` enforced server-side (ADR-010)

---

### 11.2 Admin Dashboard — "The Control Tower"

**Accent:** `#8b6fff` Purple
**Tone:** Dense · Authoritative · Comprehensive · Strategic

| Decision | Rationale |
|----------|-----------|
| Highest information density of all three surfaces | Admins need the full picture at a glance |
| Purple across all admin-specific states | Signals authority, not urgency |
| Destructive actions always gated behind confirmation modals | No accidental data loss |
| All actions logged with actor attribution | Full audit trail required |
| Cross-client visibility by default | Admins see all; scope is explicit when needed |
| Bulk action patterns on all list views | Operational efficiency at scale |

**Route prefix:** `/admin/*` (filtered by role middleware)
**Auth role:** `ADMIN`
**Data scope:** Full access — no client-scoping unless explicitly filtered

---

### 11.3 Staff Dashboard — "The Focused Executor"

**Accent:** `#3dd9d6` Cyan
**Tone:** Efficient · Task-oriented · Clear · Fast

| Decision | Rationale |
|----------|-----------|
| Task-first navigation, not entity-first | Staff work tasks, not browse records |
| Active work surfaced at the top of every page | No hunting for current responsibilities |
| 1–2 click maximum for time and status logging | Logging friction kills adoption |
| Minimal decorative chrome | Screen time is work time |
| No Instrument Serif | Functional context only |
| Client context shown in-line on tasks | Staff need to know who they're working for |

**Route prefix:** `/admin/*` (shared route, differentiated by role)
**Auth role:** `STAFF`
**Data scope:** Assigned tasks/projects only — no cross-client data

---

## 12. Architecture Context

### 12.1 System Overview

```
┌──────────────────────────────────────────────────────┐
│                   Next.js Frontend                    │
│         /portal/*   |   /admin/* (ADMIN/STAFF)        │
└──────────────────────┬───────────────────────────────┘
                       │ /api/v1/* only (ADR-006)
┌──────────────────────▼───────────────────────────────┐
│                  NestJS API Gateway                   │
└──┬──────┬──────┬──────┬──────┬──────┬──────┬────────┘
   │      │      │      │      │      │      │
 Auth   Core  Chat  Files Billing Auto   AI  Analytics
```

### 12.2 Service Boundaries

| Service     | Responsibility                              | UI Surface                         |
|-------------|---------------------------------------------|------------------------------------|
| Auth        | JWT issuance, refresh rotation, RBAC        | Login, session management          |
| Core        | Projects, tasks, clients, staff management  | All dashboards — primary content   |
| Chat        | Threaded messaging, notifications           | Topbar notification bell, chat page |
| Files       | Upload, versioning, CDN delivery            | File attachments, document pages   |
| Billing     | Invoices, contracts, payment tracking       | Billing page (client + admin)      |
| Automation  | Webhook triggers, scheduled actions         | Admin automation rules page        |
| AI          | Copilot features, summarisation             | Inline AI features (future scope)  |
| Analytics   | Aggregated metrics, reporting               | Admin analytics, client summaries  |

### 12.3 Auth Flow

- JWT access token: `15 min` expiry
- Refresh token: `7-day rotation` (ADR-009) — each refresh issues a new token pair
- Tokens stored in `httpOnly` cookies — never `localStorage`
- Role encoded in JWT payload: `CLIENT | STAFF | ADMIN`
- All API calls: `Authorization: Bearer <token>` via interceptor
- 401 response triggers silent refresh; if refresh fails, redirect to login

### 12.4 Data Isolation Rules

- **CLIENT queries:** `WHERE clientId = scopedClientId` enforced at the service layer (ADR-010) — never rely on frontend filtering
- **STAFF queries:** scoped to assigned projects/tasks — not cross-client
- **ADMIN queries:** full access — client context is an optional filter, never a hard scope
- No direct service-to-service calls from the frontend. All traffic through `/api/v1/*` gateway (ADR-006)

### 12.5 Frontend Architecture

- Framework: **Next.js** (App Router)
- Styling: **CSS Modules** + global CSS custom properties
- Component pattern: co-located module files (`component.tsx` + `component.module.css`)
- Class name utility: `createCx(styles)` from `@/lib/utils/cx`
- State: React `useState`/`useReducer` for local; `useContext` for cross-component dashboard state
- Data fetching: custom hooks wrapping `fetch` with auth interceptor
- DB: **PostgreSQL** — schema-per-service (ADR-002)

---

## 13. Accessibility

### 13.1 Standards Target

**WCAG 2.2 Level AA** compliance across all three dashboards (published October 2023, updated December 2024). WCAG 2.2 supersedes 2.1 — all 2.1 AA criteria still apply, plus nine new criteria.

### 13.2 Colour Contrast

All text/background combinations verified against WCAG 2.2 SC 1.4.3 (AA: 4.5:1 for normal text, 3:1 for large text) and SC 1.4.11 (UI components and graphical objects: 3:1 against adjacent colours):

| Pairing                          | Ratio   | Result      |
|----------------------------------|---------|-------------|
| `--text` on `--bg`               | 17.3:1  | ✓ AAA       |
| `--muted` on `--bg`              | 7.2:1   | ✓ AA        |
| `--muted2` on `--bg`             | 4.6:1   | ✓ AA        |
| Lime `#c8f135` on `--bg`         | 12.4:1  | ✓ AAA       |
| Purple `#8b6fff` on `--bg`       | 6.1:1   | ✓ AA        |
| Cyan `#3dd9d6` on `--bg`         | 8.9:1   | ✓ AAA       |
| Green `#4dde8f` on `--bg`        | 9.8:1   | ✓ AAA       |
| Amber `#f5a623` on `--bg`        | 8.1:1   | ✓ AAA       |
| Red `#ff5f5f` on `--bg`          | 5.5:1   | ✓ AA        |
| `#050508` on Lime (primary btn)  | 12.4:1  | ✓ AAA       |
| Focus ring (Lime) on `--bg`      | 12.4:1  | ✓ SC 1.4.11 |

### 13.3 Keyboard Navigation

- All interactive elements reachable by `Tab` in logical DOM order (left-to-right, top-to-bottom)
- `focus-visible` styles on all interactive elements: `2px solid var(--accent)` outline, `2px offset`
- **SC 2.4.11 Focus Not Obscured (AA):** When a component receives keyboard focus it must not be entirely hidden by sticky headers, drawers, or overlays. Sticky topbar accounts for scroll offset.
- **SC 2.4.12 Focus Not Obscured — Enhanced (AAA target):** Focused component is not even partially hidden by author content
- Custom dropdowns and listboxes implement full ARIA keyboard patterns
- Modal focus trap: focus locked inside open modal, returns to trigger on close
- Sidebar navigation: `←/→` for expand/collapse, `↑/↓` for item traversal
- Command palette: `⌘K` / `Ctrl+K` opens, `Escape` closes, `↑/↓` navigates, `Enter` activates
- After SPA page navigation, focus moves to the page `<h1>` element

### 13.4 Semantic HTML

| Element    | Usage                                            |
|------------|--------------------------------------------------|
| `<main>`   | Primary content area                             |
| `<aside>`  | Sidebar                                          |
| `<nav>`    | Sidebar navigation, topbar nav cluster           |
| `<header>` | Topbar                                           |
| `<section>`| Logical page sections with `aria-labelledby`    |
| `<button>` | All interactive controls (never `<div onClick>`) |
| `<table>`  | Tabular data only (not layout)                   |
| `<h1>`     | One per page — page title below breadcrumb       |
| `<h2>–<h4>`| Section and card headings, never skip levels     |

### 13.5 ARIA Patterns

- Status chips: `role="status"` or `aria-label` describing state
- Notifications bell: `aria-label="Notifications, X unread"`
- Loading skeletons: `aria-busy="true"` on container, `aria-label="Loading…"` on region
- Modals: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to modal title
- Toast region: `role="log"`, `aria-live="polite"` (error toasts: `aria-live="assertive"`)
- Icon-only buttons: always carry `aria-label` describing the action
- Expanded/collapsed sections: `aria-expanded` toggled by the control that opens them
- Progress bars: `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Data tables: `<th scope="col">` / `<th scope="row">`, `aria-sort` on sortable columns

### 13.6 Touch & Pointer Targets

- Minimum touch target: `44px × 44px` per WCAG 2.5.5 (AA) — raised from 34px
- Icon buttons padded to minimum target without expanding visual size
- Table rows: minimum `44px` height
- **SC 2.5.7 Dragging Movements (AA — new in 2.2):** Any functionality that uses drag must have a non-drag alternative (e.g. a button to reorder). No drag-only interactions permitted.
- **SC 2.5.8 Target Size Minimum (AA — new in 2.2):** Interactive targets must be at least `24px × 24px`. Targets smaller than `24px` must have `24px` spacing between them. Primary targets (primary buttons, nav items) remain `44px`.

### 13.7 Motion Accessibility

All animations wrapped in `prefers-reduced-motion: no-preference`. When reduced motion is active:
- Keyframe animations disabled
- Transitions reduced to `opacity` only or removed entirely
- No parallax or scroll-based motion
- **SC 2.3.3 (AAA):** No animation triggered by interaction unless the user has not activated a preference to limit motion

### 13.8 Cognitive Accessibility (WCAG 2.2 New Criteria)

- **SC 3.2.6 Consistent Help (A — new in 2.2):** Help mechanisms (support link, live chat trigger) appear in the same location across all pages within the portal
- **SC 3.3.7 Redundant Entry (A — new in 2.2):** Data the user already entered is not asked for again in the same session (e.g. pre-fill project name when creating a sub-task from a project)
- **SC 3.3.8 Accessible Authentication (AA — new in 2.2):** Login flow must not require cognitive function tests (e.g. CAPTCHA involving transcription). Magic-link / passwordless auth satisfies this.
- **SC 3.3.9 Accessible Authentication — Enhanced (AAA target):** No cognitive function test at all in the auth flow

### 13.9 Screen Reader Support

- Decorative images: `alt=""` or `aria-hidden="true"`
- Meaningful icons: wrapped in `<span aria-hidden="true">` with adjacent visible or `aria-label` text
- Dynamic content updates: use `aria-live` regions for in-page data refreshes
- Page title (`<title>`) updated on SPA navigation to match the current page heading
- Avoid `title` attribute on interactive elements — use `aria-label` or visible text instead

### 13.10 Colour-Blindness Safety

Colour is **never the only** means of conveying information. Every state signalled by colour also has:
- A distinct icon or glyph
- A text label
- Or a pattern/shape distinction

Examples: error state uses red + `✕` icon + "Error" text; success uses green + `✓` icon + "Success" text; amber warnings include a `△` icon.

---

## 14. Implementation Reference

### 14.1 CSS Custom Property Declaration

Properties set on the dashboard root wrapper class (e.g. `.clientRoot`):

```css
.clientRoot {
  /* Surfaces */
  --bg:       #050508;
  --surface:  #0d0d14;
  --surface2: #111118;

  /* Borders */
  --border:   rgba(255,255,255,0.07);
  --border2:  rgba(255,255,255,0.13);

  /* Text */
  --text:   #f0ede8;
  --muted:  rgba(240,237,232,0.45);
  --muted2: rgba(240,237,232,0.22);
  --muted3: rgba(240,237,232,0.08);

  /* Accent — Client */
  --accent:   #c8f135;
  --accent-d: rgba(200,241,53,0.10);
  --accent-g: rgba(200,241,53,0.05);

  /* Semantic */
  --green:  #4dde8f;  --green-d:  rgba(77,222,143,0.12);
  --amber:  #f5a623;  --amber-d:  rgba(245,166,35,0.12);
  --red:    #ff5f5f;  --red-d:    rgba(255,95,95,0.12);
  --cyan:   #3dd9d6;  --cyan-d:   rgba(61,217,214,0.12);
  --purple: #8b6fff;  --purple-d: rgba(139,111,255,0.14);

  /* Radius */
  --r-xs: 6px;
  --r-sm: 8px;
  --r-md: 12px;
  --r-lg: 16px;

  /* Shadows */
  --shadow-card:  0 1px 3px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.2);
  --shadow-modal: 0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.3);

  /* Easing */
  --ease-out:    cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

Override only `--accent`, `--accent-d`, `--accent-g` for Admin and Staff root classes.

### 14.2 Dynamic CSS Class Naming Conventions

The following class names are referenced dynamically in TypeScript — **never rename without updating all call sites**:

**Badge variants:** `badgeGreen`, `badgeRed`, `badgeAmber`, `badgePurple`, `badgeMuted`, `badgeAccent`, `badgeCyan`

**Progress fills:** `pfAccent`, `pfPurple`, `pfGreen`, `pfAmber`, `pfRed`

**Background tones:** `bgGreen`, `bgAmber`, `bgPurple`, `bgRed`, `bgCyan`

**Stat bars:** `statBarAccent`, `statBarAmber`, `statBarRed`, `statBarPurple`, `statBarGreen`

**Topbar status dots:** `topbarStatusGreen`, `topbarStatusAmber`, `topbarStatusRed`

**Progress fills (progress bar component):** `progressFillAmber`, `progressFillRed`, `progressFillGreen`, `progressFillPurple`

**Activity icons:** `activityIconAccent`, `activityIconAmber`, `activityIconRed`, `activityIconPurple`

**Action card bars:** `actionCardBarAccent`, `actionCardBarAmber`, `actionCardBarRed`, `actionCardBarPurple`

**Notification rows:** `notifRowAccent`, `notifRowAmber`, `notifRowRed`, `notifRowPurple`, `notifRowGreen`

**Nav badges:** `navBadgeAmber`, `navBadgeRed`

### 14.3 File Structure

```
apps/web/src/
├── app/
│   └── style/
│       ├── dashboard-token-scale.css           # Root CSS custom properties
│       ├── client/
│       │   └── maphari-client-dashboard.module.css
│       └── shared/
│           └── maphari-dashboard-shared.module.css
├── components/
│   └── client/
│       ├── maphari-client-dashboard.tsx
│       └── maphari-dashboard/
│           ├── sidebar.tsx
│           ├── topbar.tsx
│           ├── style.ts                        # Shared style helpers
│           ├── hooks/
│           │   └── use-notifications.ts
│           └── pages/
│               ├── overview-page.tsx
│               ├── projects-page.tsx
│               ├── contracts-page.tsx
│               └── billing-page.tsx
└── lib/
    └── utils/
        └── cx.ts                               # createCx(styles) helper
```

### 14.4 CSS Module Usage Pattern

```tsx
import styles from './component.module.css'
import { createCx } from '@/lib/utils/cx'

const cx = createCx(styles)

// Static class
<div className={cx('card')} />

// Conditional class
<div className={cx('row', isActive && 'rowActive')} />

// Dynamic class (badge tone)
<span className={cx(`badge${tone}`)} />   // tone = 'Green' | 'Amber' | 'Red' ...
```

---

## 15. Navigation Patterns

### 15.1 Page Tabs

Used when a single page has multiple distinct content views (e.g. Project — Overview / Files / Activity / Settings).

```
Container:     border-bottom: 1px solid --border, margin-bottom: 24px
Tab item:      Syne 0.78rem 600 --muted, padding: 10px 0, margin-right: 24px
Active tab:    --text, border-bottom: 2px solid --accent (overlaps container border)
Hover tab:     --text
Indicator:     2px solid --accent, bottom: -1px (flush with container border)
Transition:    border-color 160ms ease-out, color 160ms ease-out
```

**Rules:**
- Tabs are navigation — each tab is a URL segment (`/project/123/files`), not a state toggle
- Never use tabs for filtering (use a filter bar instead)
- Maximum 6 tabs visible. Beyond that, use a "More" overflow dropdown
- Active tab is never scrolled out of view

---

### 15.2 Breadcrumbs

Used on pages that are children of a parent entity (e.g. Project > Contract > Invoice).

```
Font:          DM Mono 0.60rem 400
Separator:     / character, --muted2
Current page:  --muted (non-linked)
Parent items:  --muted, underline on hover, cursor: pointer
Height:        24px, margin-bottom: 8px (sits above page H1)
```

**Example:**
```
Clients / Acme Corp / Projects / Website Redesign
```

**Rules:**
- Never show breadcrumbs on top-level pages (Overview, Clients list, etc.)
- The final crumb is always the current page — not a link
- Maximum depth: 4 levels. If deeper, collapse middle levels with `…`

---

### 15.3 Pagination

Used below data tables and long lists when total records exceed the page size.

```
Container:     flex, align-center, gap: 8px, padding-top: 16px, border-top: 1px solid --border
Page size:     25 (default) | 50 | 100 — selector on right side
```

**Anatomy:**
```
[← Prev]  [1]  [2]  [3]  ...  [12]  [Next →]    Showing 26–50 of 312
```

**Page button spec:**
- Default: Ghost variant, `32px × 32px`, DM Mono `0.70rem`
- Current page: `--accent` background, `#050508` text, no hover
- Ellipsis `...`: non-interactive, `--muted2`

**Showing label:** DM Mono `0.60rem` 400 `--muted2`, right-aligned — always shows `{start}–{end} of {total}`.

**Rules:**
- Preserve page number in URL query param (`?page=3`)
- On filter change, reset to page 1
- If total pages = 1, hide pagination entirely

---

### 15.4 In-Page Navigation (Jump Links)

For long single-page content (e.g. settings pages, admin configuration), an anchored sticky sidebar nav provides jump links.

```
Position:      sticky top: 80px (below topbar)
Width:         160px
Font:          DM Mono 0.60rem 400 --muted2 uppercase letter-spacing: 0.10em
Active:        --text, left border 2px --accent
Gap:           2px between items
```

Active state updates on scroll via `IntersectionObserver`.

---

## 16. Search Pattern

### 16.1 Inline Search (Table / List Filter)

Local search within a visible list or table. Does not navigate away.

```
Width:         240–280px
Height:        36px
Background:    --surface2
Border:        1px solid --border
Border-radius: --r-sm (8px)
Padding:       0 10px 0 32px  (space for search icon left)
Font:          Syne 0.78rem 400
Icon:          search icon, 14px, --muted2, position: absolute left: 10px
Clear button:  × icon, 14px, --muted2, position: absolute right: 10px (appears when input has value)
```

- Results filter as the user types with `300ms` debounce
- Matching text is highlighted in results: `--accent` or `--amber` background, `--bg` text
- No results: show empty state inline — "No results for `{query}`"

---

### 16.2 Global Search (Command Palette)

Full-screen command palette triggered by `⌘K` / `Ctrl+K` from anywhere in the dashboard.

```
Backdrop:      rgba(5,5,8,0.80) blur(6px)
Container:     max-width 560px, width: calc(100% - 48px)
Position:      fixed top: 20%, left: 50%, transform: translateX(-50%)
Background:    --surface
Border:        1px solid --border2
Border-radius: --r-lg (16px)
Shadow:        --shadow-modal
Z-index:       9999
Entry:         scaleIn 180ms ease-out
```

**Input bar:**
```
Height:         52px
Padding:        0 16px 0 44px
Font:           Syne 1.0rem 400 --text
Placeholder:    "Search anything…" — --muted2
Search icon:    20px, --muted2, left: 14px
Border-bottom:  1px solid --border
Background:     transparent
```

**Results list:**
```
Max-height:     400px, overflow-y: auto
Padding:        8px
```

**Result item:**
```
Height:         44px
Padding:        0 10px
Border-radius:  --r-sm (8px)
Layout:         [icon] [label] [breadcrumb path] [keyboard hint]
Icon:           16px, semantic colour by result type
Label:          Syne 0.80rem 600 --text
Path:           DM Mono 0.58rem --muted2, right side
Keyboard hint:  DM Mono 0.56rem --muted2, far right (e.g. "↵ Open")
Hover / focus:  --muted3 background
```

**Result sections:**
- Recent (shown before typing)
- Projects
- Clients
- Invoices & Contracts
- Staff (Admin only)
- Actions (e.g. "Create new project", "Go to billing")

**Keyboard behaviour:**
- `↑` / `↓` navigates results
- `Enter` opens selected result
- `Escape` closes palette
- `Tab` moves between section groups

---

## 17. Changelog

All breaking changes, additions, and deprecations are tracked here. Increment the version number on any change that affects consuming components.

### v2.0 — March 2026
**Added**
- Sections 15–18 (Navigation Patterns, Search, Changelog, Contributing Guide)
- Tooltip spec (§5.10)
- Popover spec (§5.11)
- Notification Drawer full spec (§5.12)
- Dropdown Menu spec (§5.13)
- Global Search / Command Palette spec (§16.2)
- Breadcrumb, Pagination, and Page Tabs patterns (§15)
- Complete WCAG contrast table for all colour pairings (§13.2)
- Responsive breakpoint strategy (§4.3)
- Form patterns full spec — input states, labels, help text (§8)

**Updated**
- Colour system: added WCAG ratios, token alias layer documented
- Component Library: all components now include states, sizing, rules
- Architecture Context: added service boundary table, auth flow detail, data isolation rules
- Implementation Reference: complete CSS custom property block (§14.1)

### v3.0 — March 2026
- Upgraded accessibility target from WCAG 2.1 AA → WCAG 2.2 AA (§13.1)
- Added 9 new WCAG 2.2 success criteria across §13.6–13.8
- Raised minimum touch target from 34 px → 44 px (§13.6, SC 2.5.5) — §18.5 checklist updated to match
- Added §13.10 Colour-Blindness Safety rule
- Added §19 UX Feel & Interaction Principles (Nielsen heuristics, Laws of UX, micro-interactions, progressive disclosure)
- Added §20 Cognitive Load & Information Architecture (Gestalt, Hick's Law, chunking, hierarchy)
- Added §21 UX Writing & Microcopy (voice & tone, errors, empty states, confirmations, labels)
- Added §22 Frontend Design Craft (design thinking, aesthetic direction, typography craft, colour execution, motion craft, spatial composition, visual atmosphere, anti-patterns, production readiness standard)

### v2.1 — March 2026
Font stack corrected: JetBrains Mono → DM Mono. Token fixes: `--purple` decoupled from `--blue`, `--muted3` defined, `--green` corrected. Layout dimensions aligned to spec. Toast system centralised via `DashboardToastCtx`.

### v2.0 — March 2026
Second major iteration. Added shared module patterns, badge and progress fill dynamic class library, topbar identity stripe, sidebar dimension token, shadow scale.

### v1.0 — March 2026
Initial release of the design system.

---

## 18. Contributing Guide

### 18.1 When to Update This Document

Update this document when:
- A new component is built and used in more than one place
- A design decision is made that affects multiple surfaces
- A token, class name, or pattern is changed or deprecated
- A new dashboard section or page introduces a new pattern

Do **not** add one-off component specs that only exist in a single page.

### 18.2 Adding a New Component

1. **Check for an existing pattern first.** Extend an existing component before creating a new one.
2. **Document the spec before building.** Add the section here, get a review, then implement.
3. **Required spec fields:** geometry, all interactive states, keyboard behaviour, ARIA roles, and any dynamic class names.
4. **Add dynamic class names** to §14.2 if the component uses runtime-constructed class names.
5. **Verify contrast** for any new colour pairing using the WCAG guidelines in §13.2.

### 18.3 Token and Naming Rules

- New CSS custom properties follow the `--category-name` pattern: `--shadow-lg`, `--r-2xl`
- Never add a token for a one-off value — use the closest existing token
- New semantic colours require a full / dim pair: `--colour` + `--colour-d`
- Renaming a token: add the new name, keep the old as an alias for one version, remove the alias in the next version

### 18.4 Breaking Changes

A change is **breaking** if it:
- Renames or removes a CSS custom property
- Renames or removes a dynamic CSS class name (see §14.2)
- Changes the DOM structure of a shared component
- Changes a component's keyboard or ARIA behaviour

Breaking changes require:
1. An entry in the Changelog (§17)
2. A grep across the codebase to find all affected callsites
3. All callsites updated in the same commit as the design system change

### 18.5 Review Checklist

Before merging any UI change, verify:

- [ ] Component matches the spec in this document (or spec has been updated to reflect the change)
- [ ] All interactive states are implemented (hover, focus, active, disabled)
- [ ] `focus-visible` outline is present and uses `--accent`
- [ ] No hardcoded hex values — all colours reference CSS custom properties
- [ ] Dynamic class names are listed in §14.2
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Touch targets are minimum 44px (WCAG 2.5.5)
- [ ] Icon-only buttons have `aria-label`
- [ ] TypeScript types have been updated if component props changed

---

## 19. UX Feel & Interaction Principles

This section defines **how the product should feel** to use — the qualities a user experiences beyond what they see. A technically correct interface that feels wrong is still broken.

### 19.1 How the Interface Should Feel

The Maphari dashboards are professional tools used under real work pressure. The interaction quality target is:

| Quality | Description |
|---------|-------------|
| **Immediate** | The UI responds before the user finishes thinking. Hover states appear in ≤100ms. Every click produces instant visual feedback even if the server hasn't responded. |
| **Predictable** | The same action always produces the same result in the same place. No surprises. Users build mental models quickly and navigate without thinking. |
| **Forgiving** | Mistakes are easy to recover from. Destructive actions have confirmation steps. Forms preserve input on error. Navigation is never a dead end. |
| **Efficient** | Power users can accomplish tasks without reaching for the mouse. Keyboard shortcuts shorten the path. The most common action on every page is always the most visually prominent. |
| **Quiet** | The interface does not demand attention. It does not flash, bounce, or chime unless genuinely warranted. Notifications inform without interrupting. |
| **Trustworthy** | Data is never silently dropped. Loading states show progress. Errors are explicit. The system explains what happened and what to do. |

### 19.2 Nielsen's 10 Usability Heuristics — Applied

Jakob Nielsen's heuristics are the gold standard for usability evaluation. Every component and pattern in this system is designed to satisfy them.

| # | Heuristic | How it applies to Maphari |
|---|-----------|---------------------------|
| 1 | **Visibility of system status** | Loading spinners, skeleton screens, progress bars, and toast notifications keep users informed at all times. The topbar `SAMPLE DATA` badge communicates data source mode. |
| 2 | **Match between system and real world** | Labels use client-facing language ("Your Projects", "Pending Approvals") not backend jargon ("ENTITY_STATUS_PENDING"). Dates are formatted naturally ("Due today", "3 days ago"). |
| 3 | **User control and freedom** | Modals have explicit close buttons (`✕`) and `Escape` dismissal. Destructive actions have confirmation dialogs. Navigation never traps the user — the sidebar is always visible. |
| 4 | **Consistency and standards** | One visual pattern per concept. Primary actions are always Lime buttons. Danger actions are always Red. Status chips use the same semantic colour contract everywhere. |
| 5 | **Error prevention** | Form fields validate inline before submission. Irreversible actions (delete, sign contract) require confirmation. Default states are safe. |
| 6 | **Recognition rather than recall** | Navigation items have icons and labels. Recent activity is surfaced. Search provides suggestions. Users should never need to remember a path or ID. |
| 7 | **Flexibility and efficiency of use** | Keyboard shortcuts for all major navigation (§7 of Implementation Reference). Command palette (`⌘K`) for power users. Most common actions available from multiple entry points. |
| 8 | **Aesthetic and minimalist design** | Every element earns its place (§1 Design Philosophy). Destructive information is never shown alongside routine information. Progress indicators show only what is relevant. |
| 9 | **Help users recognise, diagnose, recover from errors** | Error messages use plain language, state what happened, and offer a next step. See §21.2 for error copy standards. |
| 10 | **Help and documentation** | Contextual tooltips on all non-obvious controls. Help icon in topbar links to documentation. Onboarding tour introduces the product to first-time users. |

### 19.3 Laws of UX — Applied

Psychological and perceptual laws that govern how users experience digital interfaces.

#### Fitts's Law
> *The time to acquire a target is a function of the distance to and size of the target.*

- Primary action buttons are large (`44px` height minimum) and positioned where the user's focus already is after completing the preceding step
- The most frequent action on any page (e.g. "View All Projects" on the dashboard) is the most prominent button
- Destructive actions are small and distant from the confirm button to reduce accidental activation
- Touch targets are never smaller than `44px × 44px` (see §13.6)

#### Hick's Law
> *The time to make a decision increases with the number and complexity of choices.*

- The sidebar is organised into labelled groups with ≤8 items per group — not a flat list of all pages
- Dropdowns never exceed 10 items before introducing search or pagination
- Forms reveal optional fields progressively rather than upfront (see §19.5)
- Dashboards surface the 3–5 most important metrics first; secondary data is one click away

#### Miller's Law
> *The average person can hold 7 ± 2 chunks in working memory.*

- Data tables paginate at 15–25 rows — never dump hundreds of rows
- Status summaries show a count ("3 pending"), not a raw list, until the user explicitly requests detail
- Onboarding tour is limited to 6 steps — long enough to cover essentials, short enough to complete

#### Doherty Threshold
> *Productivity soars when a computer and its users interact at < 400ms.*

- All in-page navigations are instant (no full-page reload)
- Optimistic UI: mutations update the UI immediately; rollback only if the API fails
- Perceived performance: skeleton screens appear within one frame of the request initiating

#### Jakob's Law
> *Users spend most of their time on other sites. They prefer your site to work the same way as all the other sites they already know.*

- Standard keyboard shortcuts are not reinvented (Escape = close, Enter = submit, Tab = next field)
- Data tables behave like spreadsheets for column sorting
- The sidebar/topbar layout matches the mental model of every major SaaS product the client has used before

#### Postel's Law
> *Be liberal in what you accept, conservative in what you send.*

- Forms accept flexible input formats (dates with or without slashes, amounts with or without currency symbols) and normalise on submission
- Outputs are always precisely formatted: consistent date formats, consistent currency notation, consistent status vocabulary

### 19.4 Micro-interactions & Tactile Feedback

Micro-interactions are the small moments of feedback that make a UI feel alive and responsive. They operate below the threshold of conscious awareness but their absence is immediately felt.

| Trigger | Response | Duration |
|---------|----------|----------|
| Button hover | Background lightens by `--s2` level; cursor changes to pointer | `120ms ease` |
| Button click / press | Scale to `0.97` | `80ms` |
| Form field focus | Border transitions from `--b1` to `--b3` (accent) | `150ms ease` |
| Toggle switch | Thumb slides with spring-feel easing (`cubic-bezier(0.34, 1.56, 0.64, 1)`) | `220ms` |
| Toast entry | Slides in from bottom-right | `280ms ease-out` |
| Toast exit | Slides out and fades | `220ms ease-in` |
| Nav item activate | Active indicator slides to new position | `200ms ease` |
| Modal open | Scales from `0.95` to `1.0` with fade | `250ms ease-out` |
| Sidebar collapse | Width animates smoothly; labels fade | `200ms ease` |
| Data row hover | Background transitions to `--s2` | `80ms ease` |
| Badge increment | Number ticks up with a brief scale pulse | `150ms` |

**Rules:**
- Never use micro-interactions to compensate for slow data loading — fix the latency instead
- Hover states serve a functional purpose (previewing the effect of a click) not decoration
- All micro-interactions must be disabled when `prefers-reduced-motion: reduce` is set

### 19.5 Progressive Disclosure

Show users only what they need to make the next decision. Complexity is revealed on demand.

**Levels of disclosure:**
1. **Summary level** — dashboard cards show counts and status ("4 Active Projects")
2. **Overview level** — clicking expands to a list with key attributes per item
3. **Detail level** — clicking an item opens the full record
4. **Edit level** — editing requires explicit intent (a dedicated edit button or mode)

**Applied patterns:**
- Dashboard page shows aggregate numbers → click leads to full-page list
- Long forms split into logical steps or collapsible sections
- Advanced filters are hidden behind a "More filters" toggle; only 2–3 filters are visible by default
- Secondary table columns are hidden on narrower viewports; a "Show more columns" control reveals them
- Help text for complex fields is hidden behind a `?` info icon tooltip, not shown by default

---

## 20. Cognitive Load & Information Architecture

Cognitive load is the mental effort required to understand and use an interface. Unnecessary cognitive load is a design failure. This section defines how to eliminate it.

### 20.1 Reducing Extraneous Cognitive Load

Extraneous load is caused by **how** information is presented rather than the information itself. Eliminate it by:

- **Removing decoration** — borders, dividers, and visual separators should only be used when they actively help distinguish sections. Gratuitous chrome adds visual noise.
- **One task per screen** — each page focuses on a single job. A billing page is not also a project management page.
- **Consistent element positions** — the primary action button is always top-right. The page title is always top-left. Navigation is always in the sidebar. Predictability reduces the mental work of searching.
- **Scannable layouts** — data tables, stat rows, and card grids follow consistent rhythm so users can scan without reading every cell.
- **No jargon** — internal field names from the database never reach the UI. Every label must be written for the client's frame of reference.

### 20.2 Gestalt Principles in Layout

Gestalt psychology describes how humans automatically group and interpret visual information.

| Principle | Definition | Applied in Maphari |
|-----------|------------|--------------------|
| **Proximity** | Elements close together are perceived as a group | Sidebar nav items are grouped with section headers and vertical spacing between groups. Form fields are grouped by purpose. |
| **Similarity** | Elements that look alike are perceived as related | All status chips use the same pill shape and typography. All primary buttons share the same Lime colour. |
| **Continuity** | The eye follows lines and curves | Progress bars and timeline tracks guide the eye left-to-right through a sequence. |
| **Closure** | The mind fills in incomplete shapes | Card borders give a complete enclosure without needing a solid fill — the eye perceives a complete container. |
| **Common Region** | Elements within a boundary are perceived as belonging together | Cards group related data. Modal overlays isolate a task from the rest of the UI. |
| **Figure/Ground** | Elements are perceived as either in the foreground or background | The surface hierarchy (`--bg` → `--s1` → `--s2` → `--s3`) creates clear depth. Content always reads as figure, not ground. |
| **Focal Point** | A standout element captures attention first | Accent-coloured primary buttons are the visual entry point for action on every page. |

### 20.3 Visual Hierarchy Rules

Visual hierarchy directs attention before a single word is read. These rules govern how hierarchy is expressed in the system:

1. **Size** — page title (`h1`, Syne, 32–48px) > section title (`h2`, Syne, 20–24px) > card title (`h3`, Syne, 16px) > label (DM Mono, 11–12px)
2. **Weight** — bold for headings and counts; regular for descriptions; medium (500) for monospace data labels
3. **Colour** — `--text` for primary content; `--muted` for supporting detail; `--muted2` for tertiary labels; `--muted3` for background fills only (never for readable text)
4. **Position** — most important information is top-left or top-centre. Secondary detail is below or to the right.
5. **Contrast** — only one element per screen should have maximum contrast (the primary action button or the page's key metric). Everything else recedes.
6. **Whitespace** — generous padding around important elements increases their perceived importance. Dense sections feel lower-priority.

### 20.4 Hick's Law — Limiting Choice

When users have too many options, decision time increases non-linearly. Apply this by:

- **Sidebar navigation:** maximum 8 items per labelled group before requiring a "More" section
- **Dropdown menus:** show at most 10 options inline; beyond 10, add a search input
- **Filter bars:** default to 2–3 most-used filters; additional filters available behind "More filters"
- **Action menus on rows:** show at most 2 inline actions; additional actions in a `⋯` overflow menu
- **Dashboard stat cards:** show exactly the metrics that need action; never show "nice-to-have" stats at the same prominence as actionable ones

### 20.5 Chunking & Grouping

Working memory holds 7 ± 2 chunks (Miller's Law). Structure information into digestible chunks:

- **Form sections** — group related fields under a section heading. Billing details in one group; contact details in another. Never list 15+ fields in a flat vertical stack.
- **Table columns** — group conceptually related columns (e.g., date columns together, amount columns together)
- **Long numbers** — format with thousand separators: `$12,450.00` not `$12450`
- **Dates** — always disambiguated relative dates for recent items ("3 days ago"), ISO-style for absolute dates ("12 Mar 2026")
- **Status dashboards** — lead with a single aggregate health indicator (e.g. Health Score), then break it down by category below
- **Multi-step flows** — break into labelled steps with a visible step indicator; never present all steps simultaneously

---

## 21. UX Writing & Microcopy

The words in the interface are part of the design. Poorly written microcopy increases cognitive load, erodes trust, and breaks the experience just as badly as a broken component.

### 21.1 Voice & Tone

**Voice** is who we are (consistent). **Tone** is how we speak in context (varies).

| Attribute | Description | Example |
|-----------|-------------|---------|
| **Direct** | No filler words. Say the thing. | "View invoice" not "Click here to view your invoice" |
| **Professional, not corporate** | Clear and precise without sounding like a legal document | "Your session has expired" not "Authentication token invalidation event detected" |
| **Human, not robotic** | Acknowledge the user's context | "Looks like there's nothing here yet" not "No records found" |
| **Active voice** | Subject acts; object receives | "Maphari sent your contract" not "Your contract was sent" |
| **Sentence case** | Labels, headings, buttons | "View all projects" not "View All Projects" (exception: proper nouns, brand names) |

**Tone by context:**

| Context | Tone | Example |
|---------|------|---------|
| Empty state | Friendly, encouraging | "No projects yet. Your team will add them here." |
| Error state | Clear, calm, helpful | "Couldn't load invoices. Check your connection and try again." |
| Destructive action | Serious, precise | "Delete this contract? This can't be undone." |
| Success | Concise, affirming | "Invoice sent." |
| Loading | Neutral, informative | "Loading your projects…" |
| Onboarding | Warm, orienting | "Welcome. This is your command centre." |

### 21.2 Error Messages

Error messages are a critical trust moment. They must never feel like a dead end.

**Structure of a good error message:**
1. **What happened** — state the problem plainly
2. **Why it happened** (if known and useful to the user)
3. **What to do** — one clear next step

| ✗ Bad | ✓ Good |
|-------|--------|
| "Error 500" | "Something went wrong on our end. Try again in a moment." |
| "Invalid input" | "Enter a valid email address (e.g. you@company.com)" |
| "Request failed" | "Couldn't save your changes. Check your connection and try again." |
| "Unauthorised" | "You don't have access to this. Contact your Maphari account manager." |
| "File upload error" | "That file is too large. Maximum size is 25 MB." |
| "Operation not permitted" | "Contracts can only be signed by the primary contact on the account." |

**Rules:**
- Never blame the user ("you entered an invalid…" → "that doesn't look like a valid…")
- Never use technical jargon or error codes as the primary message
- Always offer a next step or a contact path
- Keep error messages to 1–2 sentences maximum
- For form errors: place the message immediately below the relevant field, not only at the top of the form

### 21.3 Empty States

Empty states are an opportunity, not a failure. They orient the user and reduce anxiety.

**Three types of empty states:**

| Type | Example | Copy approach |
|------|---------|---------------|
| **First use** | No projects yet | Explain what will appear here and set expectations ("Your active projects will appear here once your team gets started.") |
| **User cleared** | Filtered to zero results | Acknowledge the filter ("No projects match this filter.") + offer a way out ("Clear filter") |
| **System empty** | No notifications | Reassure ("You're all caught up.") |

**Structure:**
- Icon or illustration relevant to the content type (never a generic 404 ghost)
- Heading: 3–6 words, states what is empty
- Body: 1–2 sentences of context or next step
- CTA (optional): only if there is a meaningful action the user can take to fill the space

### 21.4 Confirmation & Destructive Actions

Friction is intentional for destructive or irreversible actions. The UI slows the user down enough to confirm intent without being a bureaucratic obstacle.

**Rules:**
- All destructive actions (delete, archive, terminate, sign) require a confirmation step
- The confirmation dialog states **exactly what will be deleted/changed** — not a generic "Are you sure?"
- The destructive action button uses Red styling and is positioned secondary to the Cancel button
- The confirmation copy echoes the object's name or count ("Delete 'Brand Identity 2026'? This can't be undone.")
- Reversible actions (archive vs delete) should be labelled distinctly — never label an archive as "Delete"
- Modal title: short noun ("Delete Contract", "Sign Agreement")
- Confirm button label matches the action: "Delete", "Sign", "Archive" — never just "OK" or "Confirm"

**Cancel placement:** The cancel / safe-exit option is always positioned to the left of or above the destructive option. Never place the destructive option first.

### 21.5 Button Labels & CTA Copy

Buttons must answer the question: "What will happen when I click this?"

| ✗ Vague | ✓ Specific |
|---------|------------|
| Submit | Send invoice |
| OK | Got it |
| Continue | Review contract |
| Yes | Delete project |
| Process | Pay $2,400 |
| Update | Save changes |

**Rules:**
- Lead with a verb ("Send", "Download", "Schedule", "Approve")
- If the action has a cost or consequence, state it in the button ("Pay $2,400", "Delete 3 files")
- Maximum 3 words on a button
- Do not use ellipsis (…) to imply a following step — just name the step
- Primary button = the single most likely next action. Secondary button = an alternative. Tertiary / ghost = low-commitment (cancel, back)

### 21.6 Tooltips & Helper Text

Tooltips provide just-in-time context without cluttering the layout.

**When to use a tooltip:**
- Icon-only buttons (always)
- Truncated text that cannot be expanded inline
- Technical or specialised terms the user might not know
- Fields where the expected format isn't obvious

**When NOT to use a tooltip:**
- As a substitute for a clear label (fix the label first)
- For information that all users will always need (put it inline instead)
- On disabled buttons — show a tooltip explaining *why* it is disabled, not that it is

**Rules:**
- Tooltip text: maximum 1 sentence, 15 words
- Appear after a hover delay of `500ms` — not instantly (avoids jitter when scanning the UI)
- Dismiss on mouse-out, `Escape`, or focus-out
- Never contain interactive content (links, buttons)
- `role="tooltip"` + `aria-describedby` connecting the trigger to the tooltip
- Position: prefer above-centre; avoid positions that would go off-screen

---

## 22. Frontend Design Craft

This section defines the standard of **craftsmanship** expected of every interface built at Maphari. It covers how to think before writing a single line of code, the aesthetic choices that make the product unforgettable, and the anti-patterns that produce generic, forgettable work.

> "Production-grade is a floor, not a ceiling. The question is never just 'does it work?' — it's 'does it feel like it was made with intention?'"

---

### 22.1 Design Thinking Before Coding

Before touching a component or a stylesheet, answer four questions:

| Question | Why it matters |
|----------|---------------|
| **What problem does this solve?** | Every design decision should serve the user's actual goal. Decoration that doesn't serve function is waste. |
| **Who is using this, and in what state of mind?** | A client checking an overdue invoice is anxious. A staff member logging time is in a hurry. Design for the emotional state, not an abstract user. |
| **What is the one thing someone will remember after using this?** | If you can't answer this, the design isn't distinct enough. The answer could be a colour, a transition, a layout, or a word. |
| **What are the technical constraints?** | Performance budget, accessibility target, viewport range, framework in use. Constraints are inputs, not obstacles. |

Only after answering these should you commit to an aesthetic direction and begin implementation. Committing late is the source of generic work — the tool defaults take over because there was no intention to override them.

---

### 22.2 Aesthetic Direction & Tone

Maphari uses **dark brutalism** as its system-wide aesthetic (§1). Within that frame, individual pages and components have room for tonal variation. The key is **intentionality** — pick a clear direction and execute it with precision. Bold maximalism and refined minimalism both work. The failure mode is neither: it is timid middle-ground design that is nothing at all.

**Tonal spectrum available within the system:**

| Tone | When appropriate | Character |
|------|-----------------|-----------|
| **Brutally minimal** | Dense data views, settings, configuration | Pure function. No chrome. Everything is a content element. |
| **Structured & authoritative** | Admin surfaces, audit views, analytics | Strong grid, high information density, controlled hierarchy |
| **Refined & premium** | Client portal moments, contract signing, billing summaries | Generous whitespace, Instrument Serif accents, measured pace |
| **Urgent & operational** | Staff task queues, time-sensitive actions | High contrast, compact layout, clear call-to-action priority |
| **Warm & guided** | Onboarding, empty states, first-use experiences | Human copy, lower information density, forward momentum |

**The commitment rule:** Once a tonal direction is chosen for a surface, all design decisions reinforce it. A premium layout does not get a cluttered header. A brutally minimal view does not get decorative icons. Internal inconsistency is more damaging than a bold choice.

---

### 22.3 Typography Craft

Typography is the most powerful lever in the system. Most interfaces fail typographically before they fail visually.

**The Maphari type contract (from §3):**

| Voice | Family | Role |
|-------|--------|------|
| Human, editorial | **Syne** | Headings, navigation labels, primary copy |
| Machine, precise | **DM Mono** | Data, metadata, chips, timestamps, IDs |
| Decorative, premium | **Instrument Serif** | Client portal accents only — sparingly |

**Typographic craft rules:**

- **Never use a system font or fallback as a design choice.** System fonts are an accident, not an aesthetic. Every rendered surface must reflect the intentional font stack.
- **Weight contrast is as important as size contrast.** A 700-weight heading and a 400-weight body at the same size is more legible than two different sizes at the same weight.
- **Tracking (letter-spacing) is not decoration.** Uppercase DM Mono labels use `0.06–0.22em` tracking for legibility at small sizes. Never add tracking to normal body text — it is not a style, it is a crutch.
- **Line length governs readability.** 60–75 characters per line for body text. Data values have no line length constraint. Never let prose lines run full-width in a 1280px layout.
- **Type scale is hierarchy, not just size.** Using two type sizes at random is noise. Every size step in the scale (§3.2) represents a distinct role in the information hierarchy.
- **Pair deliberately.** Syne's geometric weight-forward character and DM Mono's monospaced exactness are intentional opposites. The pairing creates tension — human vs machine — that is core to the product's identity.

**What to avoid:**

- Inter, Roboto, Arial, or any system-stack font as a visible design choice
- Generic sans-serif body copy without a meaningful secondary family
- Mixing three or more type families on a single surface
- Using Instrument Serif as a heading font (it is accent-only)
- Italic text in DM Mono (use weight instead)

---

### 22.4 Colour & Theme Execution

The token system (§2) defines what colours are available. This section defines how to use them with craft.

**Dominant + accent principle:** One colour dominates a surface (almost always the dark background family). One colour is the sharp accent (the dashboard's `--accent`). Everything else is a variation of muted neutrals. Evenly-distributed palettes with five colours at equal prominence produce visual noise — nothing reads as important.

**Colour as signal, not decoration:**

- Lime is not "a nice colour." It is the client's identity colour. It signals: primary action, trust, progress.
- Red is not a styling choice. It signals: something is wrong and requires action.
- Amber does not mean "interesting." It means: attention needed.
- Using a semantic colour decoratively (e.g. a green border on a card for aesthetic reasons when the card is not in a "success" state) breaks the semantic contract and makes the next real signal harder to trust.

**Opacity as depth:**

The muted token scale (`--muted`, `--muted2`, `--muted3`) is a depth system, not just a grey scale. Use it consistently:
- `--muted` (45% white): readable supporting text — descriptions, secondary labels
- `--muted2` (22% white): low-priority labels — column headers, timestamps, eyebrows
- `--muted3` (8% white): ghost fills — hover backgrounds, skeleton pulse, inactive states

Text that needs to be read uses `--muted` at minimum. `--muted2` is for reference, not reading. `--muted3` is never for text — it is below the WCAG readable threshold.

---

### 22.5 Motion & Animation Craft

Motion is defined in §7. This section covers the **craft** of implementing it — the difference between motion that feels intentional and motion that feels like a template.

**The hierarchy of motion impact:**

1. **Page / section entry** — the most impactful. A well-orchestrated staggered entry (`fadeSlideUp` with `index × 60ms` delay) creates a sense of the interface assembling itself with purpose. One of these per page, done well, creates more delight than a dozen hover animations.

2. **State transitions** — focus rings, active nav indicators, tab switches. These should be felt, not seen. They confirm actions and orient the user. Duration: 150–200ms.

3. **Micro-interactions** — button press scale, badge pulse, toggle spring. Present on every interaction, but operating below conscious awareness. If the user is noticing them, they are too loud.

4. **Loading states** — skeleton shimmer. Should be visually calming, not distracting. The shimmer direction (left-to-right, 1.4s) matches natural reading direction.

**Execution rules:**

- **Stagger is earned.** A list of 3 items doesn't need a stagger — it's a list. A grid of 12 project cards benefits from a stagger because it reads as an environment assembling itself.
- **Exits are fast.** Exit animations should be 60–80% the duration of entry animations. The user decided to leave; don't hold them.
- **Never block interaction.** Animations run in the background. A user who clicks a button during its hover animation should not be penalised. `pointer-events` is never disabled during decorative transitions.
- **One dramatic thing per page.** Too many animated elements fighting for attention is the equivalent of everyone in a room shouting at once. Choose the one element that should command presence on arrival, and let everything else be quiet.

**The `prefers-reduced-motion` rule is not optional.** Every animation must be wrapped (§7.5). This is a WCAG criterion, a safety consideration for users with vestibular disorders, and a performance benefit on low-power devices.

---

### 22.6 Spatial Composition

Layout is not a grid you fill. It is a composition you design. The difference between a dashboard that feels professional and one that feels corporate-template is almost entirely spatial.

**Principles:**

- **Negative space is active.** Empty space focuses attention on what remains. When a card has generous padding, its content feels important. When everything is packed together, nothing is.
- **Hierarchy through position.** The most important element on a page should occupy the most visually prominent position — usually top-left or centred above the fold. Everything else is measured relative to it.
- **Asymmetry over symmetry.** Perfect symmetry reads as template. Controlled asymmetry (e.g. a two-column layout where one column is wider, a stat row where one card is more prominent) creates visual interest and guides the eye.
- **Rhythm in repetition.** Repeated elements (table rows, card grids, stat bars) should have consistent internal spacing. The rhythm of repetition is itself a form of visual organisation.
- **Grid-breaking for emphasis.** An element that breaks the grid is noticed. Use this rarely and intentionally — a full-bleed section between two padded sections, a number that extends into the padding zone, a headline that runs wider than its container.

**Spatial anti-patterns to avoid:**

- Uniform `16px` padding on everything regardless of context (padding should be proportional to the importance and scale of the container)
- Centering everything (centre alignment is for moments of emphasis, not a default)
- Zero whitespace between sections (sections need breathing room to read as distinct)
- Maximum-width content in minimum-width containers (content should fit its container with room to breathe)

---

### 22.7 Backgrounds & Visual Atmosphere

The background of an interface is not an afterthought — it is the atmosphere that everything else lives in. A flat `#050508` background is correct per the token spec, but within that there are layers to work with.

**Depth techniques used in the system:**

- **Surface layering** — the `--bg` → `--s1` → `--s2` → `--s3` progression creates perceived depth through lightness. Cards rise off the background. Inputs are inset into cards. Selected states feel elevated.
- **Backdrop blur** — used on the topbar and modal overlays (`backdrop-filter: blur`). Creates a frosted-glass effect that signals layering without a hard edge.
- **Gradient accents** — subtle radial gradients from the accent colour (`--lime-g`, `--lime-d`) at key focal points. Used at very low opacity (3–8%) to create warmth and identity in the background field. Never a full background gradient.
- **Border as atmosphere** — `1px solid rgba(255,255,255,0.07)` borders in dark themes are not visible as lines — they are visible as a slight glow that separates surfaces. This is different from a visible structural border.

**Atmospheric effects available:**

| Effect | CSS approach | Use case |
|--------|-------------|----------|
| Surface depth | `background: --s1` on cards, `--bg` outside | Default card/page separation |
| Focal warm glow | `radial-gradient(circle at 30% 20%, var(--lime-g), transparent 50%)` | Hero areas, empty state backgrounds |
| Frosted overlay | `backdrop-filter: blur(12px)` + semi-transparent bg | Topbar, modals |
| Noise grain | `url("data:image/svg+xml,...")` SVG filter | Premium texture on surfaces (use sparingly) |
| Shimmer pulse | `@keyframes shimmer` with gradient background-size | Skeleton loading states |

**Rule:** Never use a background effect that competes with content legibility or creates a WCAG contrast failure. Atmosphere supports content — it does not fight it.

---

### 22.8 What to Avoid — The Generic AI Aesthetic

The following patterns produce interfaces that feel generic, AI-generated, or template-derived. None of these are acceptable in production.

**Typography:**

| ✗ Avoid | ✓ Maphari system |
|---------|----------------|
| Inter, Roboto, Arial as primary typefaces | Syne (display) + DM Mono (data) |
| System font stack as a visible design choice | Loaded custom fonts with `display: swap` |
| Three or more families on one surface | Maximum two families per surface |
| `font-weight: 500` as the "medium" workhorse everywhere | Deliberate weight scale with distinct roles |

**Colour:**

| ✗ Avoid | ✓ Maphari system |
|---------|----------------|
| Purple gradients on white backgrounds | Dark field, single accent, semantic colours |
| Five evenly-prominent palette colours | Dominant dark + one sharp accent |
| Decorative use of semantic colours (green because "nice") | Semantic colours carry meaning — not decoration |
| Brand blue for every interactive element | Per-dashboard accent scoped to `--accent` |
| Light mode as the default (for this product) | Dark-native, dark-first |

**Layout:**

| ✗ Avoid | ✓ Maphari system |
|---------|----------------|
| Card-everything (wrapping every content unit in a rounded card) | Cards only for logically grouped, independently actionable content |
| 16px padding everywhere at every scale | Context-proportional spacing (§4.1) |
| Perfectly centred, symmetrical hero sections | Asymmetric composition, hierarchy through position |
| Grid gaps wider than the content inside them | Gap proportional to content density |

**Motion:**

| ✗ Avoid | ✓ Maphari system |
|---------|----------------|
| Animations on every hover and every focus | Selective animation — entry, state change, confirmation |
| `ease-in` on visible enter animations | `ease-out` always for entries (§7.1) |
| Animations exceeding 400ms | Max 400ms for any single animation |
| `transition: all 0.3s` as a global rule | Specific property transitions only |
| No `prefers-reduced-motion` consideration | All animations wrapped in media query (§7.5) |

**Copy:**

| ✗ Avoid | ✓ Maphari system (§21) |
|---------|----------------------|
| "Error 500" or "Something went wrong" with no action | Specific error with next step |
| "No data found" empty states | Contextual, human empty state copy |
| "Submit", "OK", "Confirm" as button labels | Action-specific verb labels |
| Technical jargon or database field names in the UI | Client-facing language always |

---

### 22.9 Production Readiness Standard

A frontend implementation is not complete until it satisfies every point in this checklist. "It works" is not the bar — "it was made with craft" is.

**Visual fidelity:**
- [ ] All fonts are loading from the correct source with `display: swap`
- [ ] No hardcoded hex values — all colours reference CSS custom properties
- [ ] All interactive states are implemented: hover, focus-visible, active, disabled
- [ ] Focus rings are present and use `2px solid var(--accent)` with `2px offset`
- [ ] Skeleton loading states match the geometry of the content they replace
- [ ] Empty states have a relevant icon, a human heading, and a body copy line

**Spacing and layout:**
- [ ] Content has appropriate breathing room — nothing feels cramped or padded inconsistently
- [ ] The primary action on the page is visually dominant
- [ ] Typography follows the type scale (§3.2) — no arbitrary font sizes
- [ ] Line length on prose is capped at 65–75 characters

**Motion:**
- [ ] Entry animations use `ease-out` or `--ease-out` easing
- [ ] All animations wrapped in `prefers-reduced-motion: no-preference`
- [ ] No animation exceeds 400ms
- [ ] Button press scale (`0.97`) is present on primary and secondary buttons

**Accessibility:**
- [ ] All colour pairings meet WCAG 2.2 AA contrast (§13.2)
- [ ] All interactive elements are keyboard-reachable in logical order
- [ ] Icon-only buttons have `aria-label`
- [ ] Touch targets are `44px × 44px` minimum (§13.6)
- [ ] Dynamic content updates use `aria-live` where appropriate

**Code quality:**
- [ ] CSS values reference design tokens — no magic numbers
- [ ] Dynamic class names are listed in §14.2 (if new ones are introduced)
- [ ] No `!important` flags (specificity should be handled through the module system)
- [ ] Component works at 1280px, 1024px, and degrades gracefully at 768px

---

*Maphari Technologies Design System v3.0 — Internal*
*Updated March 2026 | For questions, consult the project lead*

# Client Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fully restyle the client portal dashboard — floating island sidebar, glass/atmospheric surfaces, bolder typography, ambient glow canvas — without touching any JSX, hooks, or logic.

**Architecture:** All changes are CSS-only. Design tokens are updated in `.clientRoot` (the cascade root), which causes the new values to propagate automatically to the 8 split CSS files. The shell (sidebar + topbar) is rewritten in `maphari-dashboard-shared.module.css`. The home page layout is rewritten in `pages-home.module.css`. Pages A–misc get a token-update pass to adopt the new surface/border/radius values.

**Tech Stack:** CSS Modules, Next.js 16, TypeScript — verification via `pnpm --filter @maphari/web exec tsc --noEmit` and visual check at `http://localhost:3000`

---

## File Map

| File | Action | Why |
|------|--------|-----|
| `apps/web/src/app/style/client/maphari-client-dashboard.module.css` | Modify lines 1–52 | `.clientRoot` token block — root of entire cascade |
| `apps/web/src/app/style/shared/maphari-dashboard-shared.module.css` | Modify lines 121–1313 | Sidebar island + topbar glass + layout gaps |
| `apps/web/src/app/style/client/core.module.css` | Restyle (full file, 904 lines) | Command search, tour overlay, session warning, loading fallback |
| `apps/web/src/app/style/client/pages-home.module.css` | Full rewrite (4776 lines) | New 5-zone home page layout |
| `apps/web/src/app/style/client/pages-a.module.css` | Token update (8860 lines) | Surface/border/radius vars → new token values |
| `apps/web/src/app/style/client/pages-b.module.css` | Token update (2641 lines) | Surface/border/radius vars → new token values |
| `apps/web/src/app/style/client/pages-c.module.css` | Token update (2846 lines) | Surface/border/radius vars → new token values |
| `apps/web/src/app/style/client/pages-d.module.css` | Token update (7770 lines) | Surface/border/radius vars → new token values |
| `apps/web/src/app/style/client/pages-misc.module.css` | Token update (5604 lines) | Surface/border/radius vars → new token values |

**No TSX files are touched.** Class names are never renamed — only CSS values change.

---

## Task 1: Update `.clientRoot` Design Tokens

**File:**
- Modify: `apps/web/src/app/style/client/maphari-client-dashboard.module.css:1-52`

- [ ] **Step 1: Replace the `.clientRoot` token block**

Open `apps/web/src/app/style/client/maphari-client-dashboard.module.css`. Lines 1–52 are the entire `.clientRoot` block. Replace the block with:

```css
.clientRoot {
  /* ─── Background & surfaces ───────────────────────────────────────── */
  --bg: var(--palette-bg, #04040a);
  --s1: rgba(255, 255, 255, 0.04);
  --s2: rgba(255, 255, 255, 0.07);
  --s3: rgba(255, 255, 255, 0.10);
  --s4: rgba(255, 255, 255, 0.13);

  /* ─── Borders ─────────────────────────────────────────────────────── */
  --b1: rgba(255, 255, 255, 0.06);
  --b2: rgba(255, 255, 255, 0.10);
  --b3: rgba(255, 255, 255, 0.16);
  --b-top: rgba(255, 255, 255, 0.12);

  /* ─── Accent palette (unchanged) ─────────────────────────────────── */
  --lime: var(--palette-accent, #c8f135);
  --lime2: var(--palette-accent-2, #d6f55a);
  --green: #4dde8f;
  --green-d: rgba(77, 222, 143, 0.12);
  --amber: #f5a623;
  --amber-d: rgba(245, 166, 35, 0.12);
  --red: #ff5f5f;
  --red-d: rgba(255, 95, 95, 0.12);
  --cyan: #3dd9d6;
  --cyan-d: rgba(61, 217, 214, 0.12);
  --purple: #8b6fff;
  --purple-d: rgba(139, 111, 255, 0.14);
  --blue: #5b9cf5;
  --blue-d: rgba(91, 156, 245, 0.12);

  /* ─── Text ────────────────────────────────────────────────────────── */
  --text: var(--palette-text, #f0ede8);
  --muted: var(--palette-muted, rgba(240, 237, 232, 0.50));
  --muted2: var(--palette-muted-2, rgba(240, 237, 232, 0.28));
  --muted3: rgba(240, 237, 232, 0.08);

  /* ─── Accent aliases ──────────────────────────────────────────────── */
  --accent: var(--palette-accent, var(--lime));
  --accent2: var(--palette-accent-2, var(--lime2));
  --accent-d: var(--palette-accent-dim, color-mix(in oklab, var(--accent) 16%, transparent));
  --accent-g: var(--palette-accent-glow, color-mix(in oklab, var(--accent) 8%, transparent));
  --lime-d: var(--accent-d);
  --lime-g: var(--accent-g);
  --accent-dim: var(--accent-d);
  --accent-glow: var(--accent-g);
  --purple-dim: var(--purple-d);
  --amber-dim: var(--amber-d);
  --red-dim: var(--red-d);

  /* ─── Legacy surface/border aliases (keep for backward compat) ────── */
  --surface: var(--s1);
  --surface2: var(--s2);
  --border: var(--b1);
  --border2: var(--b2);

  /* ─── Shadows ─────────────────────────────────────────────────────── */
  --shadow-card: 0 8px 32px rgba(0, 0, 0, 0.40), inset 0 1px 0 var(--b-top);
  --shadow-island: 0 16px 48px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  --shadow-modal: 0 24px 64px rgba(0, 0, 0, 0.60);

  /* ─── Radius scale (all values increase intentionally) ───────────── */
  --r-xxs: 4px;
  --r-xs: 8px;   /* was 6px */
  --r-sm: 12px;  /* was 8px */
  --r-md: 16px;  /* was 12px */
  --r-lg: 20px;  /* was 16px */
  --r-xl: 28px;  /* new — hero cards */

  /* ─── Layout ──────────────────────────────────────────────────────── */
  --sw: 68px;    /* sidebar island width (was 230px) */

  /* ─── Ambient glow ────────────────────────────────────────────────── */
  --glow-lime: radial-gradient(ellipse at 30% 10%, rgba(200, 241, 53, 0.07) 0%, transparent 55%);
  --glow-page: radial-gradient(ellipse at 70% 80%, rgba(91, 156, 245, 0.04) 0%, transparent 50%);

  /* ─── Apply ambient glow to page canvas ──────────────────────────── */
  background-image: var(--glow-lime), var(--glow-page);
}
```

- [ ] **Step 2: Verify TypeScript still compiles**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

Expected: no errors (CSS changes don't affect TS types)

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/style/client/maphari-client-dashboard.module.css
git commit -m "style(client): update clientRoot design tokens — glass surfaces, new radius scale, ambient glow"
```

---

## Task 2: Rewrite Sidebar — Floating Island

**File:**
- Modify: `apps/web/src/app/style/shared/maphari-dashboard-shared.module.css:121-1304` (sidebar section)

The existing sidebar is a full-height 230px panel. Replace the sidebar with a floating 68px icon rail. The key structural change is: `.sidebar` now IS the island (glass bg, rounded all sides, 68px wide, 12px inset). Nav text labels are hidden via `display: none`. Icon buttons become centered squares.

- [ ] **Step 1: Replace the sidebar block**

Find `.sidebar {` at line 121 through the end of all sidebar-related classes (approximately lines 121–1300 cover logo, nav sections, nav items, user card, collapse toggle, project picker, search). Replace the entire sidebar CSS section with the following. Leave the `.main`, `.topbar`, `.content` classes (line 1306+) untouched.

```css
/* ─── Sidebar — Floating Island ────────────────────────────────────── */

.sidebar {
  width: var(--sw); /* 68px */
  position: fixed;
  top: 12px;
  left: 12px;
  bottom: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: var(--r-lg); /* 20px */
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 0 12px;
  gap: 4px;
  z-index: 20;
  box-shadow: var(--shadow-island);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  overflow: visible;
  transition: none;
}

/* Top shimmer */
.sidebar::before {
  content: "";
  position: absolute;
  top: 0;
  left: 16px;
  right: 16px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.14), transparent);
  pointer-events: none;
}

/* ─── Logo mark ─────────────────────────────────────────────────────── */

.sidebarLogo {
  padding: 0;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.logoMark {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, var(--lime) 0%, #8fed0c 100%);
  color: #061009;
  display: grid;
  place-items: center;
  font-size: 0.7rem;
  font-weight: 800;
  flex-shrink: 0;
  border-radius: 10px;
  clip-path: none;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(200, 241, 53, 0.3);
}

/* Hide text logo — icon-only sidebar */
.logoOverlay,
.logoTextBlock,
.logoText,
.dashboardChip,
.adminChip,
.staffChip {
  display: none;
}

/* ─── Nav sections ──────────────────────────────────────────────────── */

.sidebarNav {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: 100%;
  padding: 0 6px;
  flex: 1;
  overflow: hidden;
}

.navSectionLabel {
  display: none; /* hidden in icon rail */
}

.navSection {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: 100%;
}

/* Divider between nav groups */
.navSectionDivider {
  width: 24px;
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 5px 0;
  flex-shrink: 0;
}

/* ─── Nav items ─────────────────────────────────────────────────────── */

.navItem {
  width: 44px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  transition: background 0.15s ease, box-shadow 0.15s ease;
  text-decoration: none;
  color: rgba(240, 237, 232, 0.45);
  background: transparent;
  border: none;
  padding: 0;
  flex-shrink: 0;
}

.navItem:hover {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(240, 237, 232, 0.75);
}

.navItemActive,
.navItem[data-active="true"] {
  background: rgba(200, 241, 53, 0.13);
  box-shadow: 0 0 0 1px rgba(200, 241, 53, 0.22);
  color: var(--lime);
}

/* Hide text labels — icon only */
.navLabel,
.navBadge,
.navRowEnd,
.navSubItem,
.navItemChevron {
  display: none;
}

/* Active indicator bar — hide (replaced by bg highlight) */
.navActiveBar {
  display: none;
}

/* ─── Notification pip ──────────────────────────────────────────────── */

.navBadgeAmber,
.navBadgeRed {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  border: 1.5px solid #04040a;
  display: block; /* override hide above */
  font-size: 0;   /* no number, just dot */
  min-width: 0;
  padding: 0;
}

.navBadgeAmber {
  background: var(--amber);
}

.navBadgeRed {
  background: var(--red);
  box-shadow: 0 0 6px rgba(255, 95, 95, 0.5);
}

/* ─── Project picker — hidden in icon rail ──────────────────────────── */

.sidebarProjectPicker,
.projectPickerBtn,
.projectPickerLabel,
.projectPickerName,
.projectPickerChevron,
.projectPickerMenu,
.projectPickerItem {
  display: none;
}

/* ─── Search — hidden in icon rail ─────────────────────────────────── */

.navSearchBtn,
.navSearchIcon,
.navSearchLabel,
.navSearchKbd {
  display: none;
}

/* ─── User card ─────────────────────────────────────────────────────── */

.sidebarUserCard {
  margin-top: auto;
  padding: 0;
  border-top: none;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebarUserAvatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(200, 241, 53, 0.12);
  border: 1.5px solid rgba(200, 241, 53, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--lime);
  font-family: var(--font-dm-mono), monospace;
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.04em;
  cursor: pointer;
  flex-shrink: 0;
}

.sidebarUserName,
.sidebarUserEmail,
.sidebarUserPlan,
.sidebarUserMeta,
.sidebarUserInfo,
.sidebarOnlineIndicator {
  display: none;
}

/* ─── Collapse toggle — hidden (always collapsed) ───────────────────── */

.sidebarToggle,
.sidebarToggleIcon {
  display: none;
}

/* ─── Collapsed state — no-op (already icon-only) ──────────────────── */

.sidebarCollapsed {
  /* sidebar is already collapsed-width by default */
}

/* ─── Mobile drawer ─────────────────────────────────────────────────── */

.sidebarMobileOpen {
  transform: translateX(0);
}

@media (max-width: 900px) {
  .sidebar {
    transform: translateX(calc(-1 * (var(--sw) + 24px)));
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .sidebarMobileOpen {
    transform: translateX(0);
    overflow-y: auto;
    max-height: 100dvh;
  }
}
```

- [ ] **Step 2: Update `.main` left margin to match new sidebar width**

Find `.main {` at approximately line 1306 and update margin-left:

```css
.main {
  height: 100%;
  margin-left: calc(var(--sw) + 20px); /* 68px island + 20px gap */
  padding-top: calc(var(--layout-topbar-h, 64px) + 12px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
```

- [ ] **Step 3: Verify TypeScript still compiles**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

Expected: no errors

**Note on tooltips:** The spec mentions a hover tooltip showing the nav label for each icon. Implementing a CSS-only tooltip (`:hover::after`) requires adding `data-tooltip` attributes to nav buttons in `sidebar.tsx`. Since the spec prohibits TSX changes, tooltips are deferred — the nav labels are still accessible via the browser's native `title` attribute which `sidebar.tsx` may already set. Do not add TSX changes to implement custom tooltips here.

**Note on `shell.module.css`:** This file lives in `apps/web/src/app/style/shared/shell.module.css` and is used by the **staff** dashboard, not the client. Do not edit it. All client shell classes live in `maphari-dashboard-shared.module.css`.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/style/shared/maphari-dashboard-shared.module.css
git commit -m "style(client): floating island sidebar — 68px icon rail, glass surface, rounded"
```

---

## Task 3: Rewrite Topbar — Glass Pill

**File:**
- Modify: `apps/web/src/app/style/shared/maphari-dashboard-shared.module.css` (topbar section ~lines 1315–1660)

Remove the lime top border stripe. Convert topbar to a glass pill that floats with margin from the viewport edge. Add DM Mono eyebrow support via `.topbarEyebrow`.

- [ ] **Step 1: Replace the topbar block**

Find `.topbar {` at approximately line 1315. Replace the `.topbar` rule and all its child rules through `.content {` (approximately lines 1315–1658) with:

```css
/* ─── Topbar — Glass Pill ───────────────────────────────────────────── */

.topbar {
  height: 56px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-top: 1px solid rgba(255, 255, 255, 0.08); /* no accent stripe */
  position: fixed;
  top: 12px;
  left: calc(var(--sw) + 28px); /* island width + gap */
  right: 12px;
  z-index: 15;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 14px;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  overflow: hidden;
}

/* Top shimmer */
.topbar::before {
  content: "";
  position: absolute;
  top: 0;
  left: 18px;
  right: 18px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.11), transparent);
  pointer-events: none;
}

/* Eyebrow label above the page title */
.topbarEyebrow {
  font-family: var(--font-dm-mono), monospace;
  font-size: 8px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(240, 237, 232, 0.28);
  line-height: 1;
}

/* Title block (eyebrow stacked above title) */
.topbarTitle {
  display: flex;
  flex-direction: column;
  gap: 1px;
  font-size: 0.95rem;
  font-weight: 800;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: -0.02em;
}

.topbarTitle span {
  font-family: inherit;
  font-style: normal;
  font-weight: 400;
  color: var(--muted);
}

.topbarActions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.topbarIcon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  color: rgba(240, 237, 232, 0.5);
  transition: background 0.15s ease, color 0.15s ease;
}

.topbarIcon:hover {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(240, 237, 232, 0.8);
}

/* Search bar pill */
.searchBar {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 120px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  padding: 6px 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.searchBar:hover {
  border-color: rgba(255, 255, 255, 0.14);
}

.searchBar input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: rgba(240, 237, 232, 0.25);
  font-family: var(--font-dm-mono), monospace;
  font-size: 9px;
  letter-spacing: 0.02em;
}

.searchBar input::placeholder {
  color: rgba(240, 237, 232, 0.25);
}

/* Topbar separator */
.topbarSep {
  width: 1px;
  height: 20px;
  background: rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

/* User avatar in topbar */
.topbarUserMenu {
  position: relative;
}

.topbarUserBtn {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  background: transparent;
  border: none;
  padding: 0;
}

.topbarUserAvatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(200, 241, 53, 0.12);
  border: 1.5px solid rgba(200, 241, 53, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--lime);
  font-family: var(--font-dm-mono), monospace;
  font-size: 9px;
  font-weight: 500;
}

.topbarUserLabel {
  display: none; /* icon-only topbar */
}

/* Dropdown */
.topbarUserDropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 220px;
  background: rgba(14, 14, 24, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: var(--r-md);
  box-shadow: var(--shadow-modal);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  z-index: 50;
  overflow: hidden;
}

.topbarDropdownId,
.topbarDropdownAvatarRow,
.topbarDropdownAvatarLg,
.topbarDropdownNameGroup,
.topbarDropdownNameText,
.topbarDropdownEmailText,
.topbarDropdownBadgeRow,
.topbarDropdownSection,
.topbarDropdownFooter,
.topbarDropdownIconWrap,
.topbarDropdownSignOut {
  /* keep existing layout — these are rarely modified, preserve as-is */
}

.topbarUserEmail {
  font-family: var(--font-dm-mono), monospace;
  font-size: 10px;
  color: var(--muted2);
}

.topbarUserItem {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  cursor: pointer;
  color: var(--muted);
  font-size: 0.85rem;
  transition: background 0.12s ease;
}

.topbarUserItem:hover {
  background: var(--s2);
  color: var(--text);
}

/* Notification badge on topbar icon */
.topbarNotifPip {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--red);
  border: 1px solid rgba(4, 4, 10, 0.8);
  box-shadow: 0 0 5px rgba(255, 95, 95, 0.5);
}

/* Topbar status dots */
.topbarStatusGreen { color: var(--green); }
.topbarStatusAmber { color: var(--amber); }
.topbarStatusRed   { color: var(--red); }

/* ─── Content area ──────────────────────────────────────────────────── */

.content {
  flex: 1;
  overflow-y: auto;
  padding: 12px 12px 12px 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;
  z-index: 1;
}

/* Mobile overlay */
.mobileOverlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 19;
  backdrop-filter: blur(2px);
}

/* Mobile hamburger */
.hamburgerBtn {
  display: none;
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 25;
  width: 36px;
  height: 36px;
  border-radius: var(--r-xs);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text);
}

@media (max-width: 900px) {
  .hamburgerBtn {
    display: flex;
  }

  .topbar {
    left: 60px;
  }

  .main {
    margin-left: 0;
    padding-top: calc(56px + 24px);
  }

  .content {
    padding: 12px;
  }
}
```

- [ ] **Step 2: Verify TypeScript still compiles**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Visual check — open the dashboard**

Navigate to `http://localhost:3000` (start with `pnpm dev` if not running). Confirm:
- Sidebar is a narrow floating island with rounded corners on all sides
- Topbar is a glass pill with no lime top border stripe
- Page title visible in topbar

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/style/shared/maphari-dashboard-shared.module.css
git commit -m "style(client): glass pill topbar, floating layout — remove lime stripe, add backdrop blur"
```

---

## Task 4: Restyle `core.module.css` — Command Search, Tour, Session Warning

**File:**
- Modify: `apps/web/src/app/style/client/core.module.css` (904 lines)

Update all surface references to use the new glass token system. Key components: `.cmdOverlay`, `.cmdPanel`, `.tourOverlay`, `.tourCard`, `.sessionWarning`, `.sessionCard`, `.loadingFallback`, `.approvalCard`, `.shortcutsPanel`.

- [ ] **Step 1: Replace surface/border/shadow values throughout**

The pattern to find and update across the entire file. **Note:** `backdrop-filter` is a separate property — add it on a new line after `background`, do not append it to the background value.

**Background values:**

| Find (old) | Replace `background` value with |
|------------|----------------------------------|
| `background: var(--s1)` or `background: var(--surface)` | `background: rgba(255,255,255,0.04)` + add new line: `backdrop-filter: blur(12px);` |
| `background: var(--s2)` or `background: var(--surface2)` | `background: rgba(255,255,255,0.07)` |
| `border: 1px solid var(--b2)` or `border: 1px solid var(--border2)` | `border: 1px solid rgba(255,255,255,0.10)` |
| `border: 1px solid var(--b1)` or `border: 1px solid var(--border)` | `border: 1px solid rgba(255,255,255,0.06)` |

**Token-based values — leave as-is** (tokens resolve automatically):

| Property | Action |
|----------|--------|
| `border-radius: var(--r-md)` etc | Leave — `--r-md` now resolves to 16px automatically |
| `box-shadow: var(--shadow-card)` | Leave — token value updated in Task 1 |
| `box-shadow: var(--shadow-modal)` | Leave — token value updated in Task 1 |

Additionally update these specific components:

**Command panel** — find `.cmdPanel {` and ensure it has `backdrop-filter: blur(16px)`:
```css
.cmdPanel {
  background: rgba(10, 10, 20, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: var(--r-md);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: var(--shadow-modal);
  /* keep all other existing properties */
}
```

**Approval card** — find `.approvalCard {` in `maphari-client-dashboard.module.css` (line ~57) and update:
```css
.approvalCard {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.09);
  padding: 16px 20px;
  border-radius: var(--r-md);
  backdrop-filter: blur(8px);
  box-shadow: var(--shadow-card);
  position: relative;
  overflow: hidden;
}

.approvalCard::before {
  content: "";
  position: absolute;
  top: 0;
  left: 16px;
  right: 16px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.09), transparent);
}
```

- [ ] **Step 2: Verify TypeScript still compiles**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

- [ ] **Step 3: Visual check — open command search**

Press `⌘K` in the dashboard. Confirm command panel has glass blur treatment.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/style/client/core.module.css apps/web/src/app/style/client/maphari-client-dashboard.module.css
git commit -m "style(client): glass surface treatment on command search, tour, session warning, approval card"
```

---

## Task 5: Rewrite `pages-home.module.css` — 5-Zone Home Layout

**File:**
- Full rewrite: `apps/web/src/app/style/client/pages-home.module.css` (4776 lines)

The current home page uses a mix of hero card, velocity dots, health arc, phase bars. The new layout has 5 zones: hero → KPI row → activity feed + approvals + upcoming. All existing class names must be preserved (they are referenced in `home-page.tsx`).

- [ ] **Step 1: Read the current home page component to identify all class names used**

```bash
grep -o 'styles\.\w\+' apps/web/src/components/client/maphari-dashboard/pages/home-page.tsx | sort -u
```

This catches direct `styles.className` accesses. Also check for bracket-notation lookups and `cx()` calls which the grep above misses:

```bash
grep -n 'styles\[' apps/web/src/components/client/maphari-dashboard/pages/home-page.tsx
grep -n 'cx(' apps/web/src/components/client/maphari-dashboard/pages/home-page.tsx
```

Collect all class names from all three commands — every one must exist in the rewritten CSS file.

- [ ] **Step 2: Rewrite `pages-home.module.css`**

The file must preserve all existing class names but update their values to the new 5-zone layout. Key layout classes and their new CSS:

```css
/* ─── Home Page — 5-Zone Layout ─────────────────────────────────────── */

/* Outer page wrapper */
.homePage,
.homeRoot {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-height: 0;
}

/* ── Zone 1: Hero card ─────────────────────────────────────────────── */

.homeHero,
.heroCard,
.phaseHeroCard {
  background: rgba(200, 241, 53, 0.055);
  border: 1px solid rgba(200, 241, 53, 0.17);
  border-radius: var(--r-xl); /* 28px */
  padding: 15px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.28);
}

.homeHero::before,
.heroCard::before {
  content: "";
  position: absolute;
  top: 0;
  left: 20px;
  right: 20px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(200, 241, 53, 0.32), transparent);
}

.heroGlowDot,
.phaseGlowDot {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(200, 241, 53, 0.5) 0%, transparent 70%);
  position: relative;
  flex-shrink: 0;
}

.heroGlowDot::after,
.phaseGlowDot::after {
  content: "";
  position: absolute;
  inset: 12px;
  border-radius: 50%;
  background: var(--lime);
  box-shadow: 0 0 16px rgba(200, 241, 53, 0.65);
}

.heroBody,
.phaseHeroBody {
  flex: 1;
  min-width: 0;
}

.heroEyebrow,
.phaseLabel {
  font-family: var(--font-dm-mono), monospace;
  font-size: 8px;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: rgba(200, 241, 53, 0.55);
  margin-bottom: 4px;
}

.heroTitle,
.phaseTitle {
  font-size: 0.9rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.heroSub,
.phaseSub {
  font-size: 0.65rem;
  color: var(--muted);
  margin-top: 3px;
}

.heroCta,
.phaseCtaBtn {
  background: var(--lime);
  color: #061009;
  font-weight: 700;
  font-size: 0.7rem;
  padding: 8px 16px;
  border-radius: var(--r-sm);
  border: none;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  box-shadow: 0 4px 14px rgba(200, 241, 53, 0.28);
  transition: opacity 0.15s ease;
}

.heroCta:hover,
.phaseCtaBtn:hover {
  opacity: 0.9;
}

/* ── Zone 2: KPI row ───────────────────────────────────────────────── */

.homeKpiRow,
.kpiRow,
.statsRow {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.homeKpiCard,
.kpiCard,
.statCard {
  flex: 1;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: var(--r-md);
  padding: 12px 14px;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(8px);
  box-shadow: var(--shadow-card);
}

.homeKpiCard::before,
.kpiCard::before {
  content: "";
  position: absolute;
  top: 0;
  left: 14px;
  right: 14px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.09), transparent);
}

/* Accent-tinted KPI variants */
.kpiCardLime  { border-color: rgba(200, 241, 53, 0.18); }
.kpiCardLime::before  { background: linear-gradient(90deg, transparent, rgba(200, 241, 53, 0.28), transparent); }
.kpiCardGreen { border-color: rgba(77, 222, 143, 0.18); }
.kpiCardAmber { border-color: rgba(245, 166, 35, 0.17); }
.kpiCardBlue  { border-color: rgba(91, 156, 245, 0.17); }

.kpiEyebrow,
.statEyebrow {
  font-family: var(--font-dm-mono), monospace;
  font-size: 8px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted2);
  margin-bottom: 4px;
}

.kpiValue,
.statValue {
  font-size: 1.4rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1;
  color: var(--text);
}

.kpiSub,
.statSub {
  font-size: 0.65rem;
  color: var(--muted);
  margin-top: 3px;
}

.kpiBar,
.statBar {
  height: 3px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 2px;
  margin-top: 10px;
  overflow: hidden;
}

.kpiBarFill,
.statBarFill {
  height: 100%;
  border-radius: 2px;
}

/* Bar fill accent tones */
.statBarAccent { background: linear-gradient(90deg, var(--lime), #8fed0c); box-shadow: 0 0 8px rgba(200,241,53,0.4); }
.statBarGreen  { background: linear-gradient(90deg, var(--green), #2abc70); box-shadow: 0 0 6px rgba(77,222,143,0.4); }
.statBarAmber  { background: linear-gradient(90deg, var(--amber), #e09020); box-shadow: 0 0 6px rgba(245,166,35,0.35); }
.statBarRed    { background: linear-gradient(90deg, var(--red), #e04040); box-shadow: 0 0 6px rgba(255,95,95,0.35); }
.statBarPurple { background: linear-gradient(90deg, var(--purple), #5b3fd6); box-shadow: 0 0 6px rgba(139,111,255,0.4); }

/* ── Zone 3: Body (activity + approvals + upcoming) ────────────────── */

.homeBody,
.bodyRow {
  display: flex;
  gap: 10px;
  flex: 1;
  min-height: 0;
}

/* ── Activity feed ─────────────────────────────────────────────────── */

.activityFeed,
.feedCard {
  flex: 1.4;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: var(--r-md);
  padding: 14px;
  overflow-y: auto;
  backdrop-filter: blur(8px);
  box-shadow: var(--shadow-card);
  position: relative;
}

.activityFeed::before,
.feedCard::before {
  content: "";
  position: absolute;
  top: 0;
  left: 14px;
  right: 14px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.09), transparent);
}

.feedHeader,
.activityHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.feedLabel,
.activityLabel {
  font-family: var(--font-dm-mono), monospace;
  font-size: 8px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted2);
}

.feedViewAll {
  font-family: var(--font-dm-mono), monospace;
  font-size: 8px;
  color: rgba(200, 241, 53, 0.5);
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
}

.activityRow,
.feedRow {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.activityRow:last-child,
.feedRow:last-child {
  border-bottom: none;
}

.activityDot,
.feedDot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Activity dot accent tones */
.activityIconAccent { background: var(--lime); box-shadow: 0 0 6px rgba(200,241,53,0.6); }
.activityIconAmber  { background: var(--amber); }
.activityIconRed    { background: var(--red); box-shadow: 0 0 6px rgba(255,95,95,0.5); }
.activityIconPurple { background: var(--purple); box-shadow: 0 0 6px rgba(139,111,255,0.5); }

.activityText,
.feedText {
  flex: 1;
  font-size: 0.68rem;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.activityTime,
.feedTime {
  font-family: var(--font-dm-mono), monospace;
  font-size: 8px;
  color: var(--muted2);
  flex-shrink: 0;
}

/* ── Right column (approvals + upcoming) ───────────────────────────── */

.rightCol {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
}

/* ── Approvals card ────────────────────────────────────────────────── */

.approvalsCard,
.pendingCard {
  flex: 1;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(200, 241, 53, 0.17);
  border-radius: var(--r-md);
  padding: 13px 14px;
  overflow-y: auto;
  backdrop-filter: blur(8px);
  box-shadow: var(--shadow-card);
  position: relative;
}

.approvalsCard::before {
  content: "";
  position: absolute;
  top: 0;
  left: 14px;
  right: 14px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(200, 241, 53, 0.28), transparent);
}

.approvalsHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.approvalsLabel {
  font-family: var(--font-dm-mono), monospace;
  font-size: 8px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted2);
}

.approvalItem {
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.approvalItem:last-child {
  border-bottom: none;
}

.approvalItemTitle {
  font-size: 0.72rem;
  font-weight: 700;
  color: rgba(240, 237, 232, 0.8);
}

.approvalItemSub {
  font-family: var(--font-dm-mono), monospace;
  font-size: 8px;
  color: var(--muted2);
  margin-top: 2px;
}

.approvalItemActions {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.approveBtn {
  background: var(--lime);
  color: #061009;
  font-weight: 700;
  font-size: 0.65rem;
  padding: 5px 12px;
  border-radius: var(--r-xs);
  border: none;
  cursor: pointer;
  flex: 1;
}

.changesBtn {
  background: rgba(255, 255, 255, 0.06);
  color: var(--muted);
  font-size: 0.65rem;
  padding: 5px 12px;
  border-radius: var(--r-xs);
  border: 1px solid rgba(255, 255, 255, 0.10);
  cursor: pointer;
  flex: 1;
}

/* ── Upcoming card ─────────────────────────────────────────────────── */

.upcomingCard,
.upcomingSection {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: var(--r-md);
  padding: 13px 14px;
  backdrop-filter: blur(8px);
  box-shadow: var(--shadow-card);
  position: relative;
}

.upcomingCard::before {
  content: "";
  position: absolute;
  top: 0;
  left: 14px;
  right: 14px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.09), transparent);
}

.upcomingLabel {
  font-family: var(--font-dm-mono), monospace;
  font-size: 8px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted2);
  margin-bottom: 8px;
}

.upcomingRow {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.upcomingRow:last-child {
  border-bottom: none;
}

.upcomingIcon {
  width: 26px;
  height: 26px;
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.09);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.upcomingBody {
  flex: 1;
  min-width: 0;
}

.upcomingTitle {
  font-size: 0.68rem;
  color: rgba(240, 237, 232, 0.65);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.upcomingWhen {
  font-family: var(--font-dm-mono), monospace;
  font-size: 8px;
  color: var(--muted2);
  margin-top: 1px;
}

/* ── Badges used in home page ──────────────────────────────────────── */

.badgeAccent { background: rgba(200,241,53,0.10); border: 1px solid rgba(200,241,53,0.22); color: var(--lime); }
.badgeGreen  { background: rgba(77,222,143,0.10); border: 1px solid rgba(77,222,143,0.22); color: var(--green); }
.badgeAmber  { background: rgba(245,166,35,0.10); border: 1px solid rgba(245,166,35,0.22); color: var(--amber); }
.badgeRed    { background: rgba(255,95,95,0.10);  border: 1px solid rgba(255,95,95,0.22);  color: var(--red); }
.badgePurple { background: rgba(139,111,255,0.10);border: 1px solid rgba(139,111,255,0.22);color: #a78bff; }
.badgeMuted  { background: rgba(255,255,255,0.05);border: 1px solid rgba(255,255,255,0.10);color: var(--muted); }
.badgeBlue   { background: rgba(91,156,245,0.10); border: 1px solid rgba(91,156,245,0.22); color: var(--blue); }
.badgeCyan   { background: rgba(61,217,214,0.10); border: 1px solid rgba(61,217,214,0.22); color: var(--cyan); }

/* Badge base */
.badge,
.badgeAccent, .badgeGreen, .badgeAmber, .badgeRed,
.badgePurple, .badgeMuted, .badgeBlue, .badgeCyan {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-dm-mono), monospace;
  font-size: 8.5px;
  font-weight: 500;
  padding: 3px 8px;
  border-radius: var(--r-xs);
  letter-spacing: 0.02em;
  white-space: nowrap;
}

/* Progress fills used in home stats */
.progressFillAmber  { background: linear-gradient(90deg, var(--amber), #e09020); box-shadow: 0 0 6px rgba(245,166,35,0.35); }
.progressFillRed    { background: linear-gradient(90deg, var(--red), #e04040);   box-shadow: 0 0 6px rgba(255,95,95,0.35); }
.progressFillGreen  { background: linear-gradient(90deg, var(--green), #2abc70); box-shadow: 0 0 6px rgba(77,222,143,0.4); }
.progressFillPurple { background: linear-gradient(90deg, var(--purple), #5b3fd6);box-shadow: 0 0 6px rgba(139,111,255,0.4); }
.pfAmber   { background: linear-gradient(90deg, var(--amber), #e09020); }
.pfRed     { background: linear-gradient(90deg, var(--red), #e04040); }
.pfGreen   { background: linear-gradient(90deg, var(--green), #2abc70); }
.pfPurple  { background: linear-gradient(90deg, var(--purple), #5b3fd6); }

/* Background tones */
.bgGreen   { background: var(--green-d); }
.bgAmber   { background: var(--amber-d); }
.bgPurple  { background: var(--purple-d); }
.bgRed     { background: var(--red-d); }

/* Notification row tones */
.notifRowAccent  { border-left: 3px solid var(--lime); }
.notifRowAmber   { border-left: 3px solid var(--amber); }
.notifRowRed     { border-left: 3px solid var(--red); }
.notifRowPurple  { border-left: 3px solid var(--purple); }
.notifRowGreen   { border-left: 3px solid var(--green); }

/* Action card bars */
.actionCardBarAccent { background: var(--lime); }
.actionCardBarAmber  { background: var(--amber); }
.actionCardBarRed    { background: var(--red); }
.actionCardBarPurple { background: var(--purple); }
```

Any class names found in Step 1 that are NOT in the above — add them as no-op or minimal stubs to prevent missing-class errors.

- [ ] **Step 2: Verify TypeScript still compiles**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

- [ ] **Step 3: Visual check — home page**

Navigate to the home page. Confirm: hero card with lime glow dot at top, 4 KPI cards, activity feed on left, approvals + upcoming on right.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/style/client/pages-home.module.css
git commit -m "style(client): rewrite home page — 5-zone layout with hero, KPIs, activity, approvals, upcoming"
```

---

## Task 6: Token Update Pass — `pages-a.module.css` + `pages-b.module.css`

**Files:**
- Modify: `apps/web/src/app/style/client/pages-a.module.css` (8860 lines)
- Modify: `apps/web/src/app/style/client/pages-b.module.css` (2641 lines)

These files use hardcoded surface values and old token names. Update them to use the new glass token system. The radius scale bumps automatically because `--r-md` etc. now resolve to new values — only hardcoded hex values or rgba values need manual updating.

- [ ] **Step 1: Find all hardcoded surface values in pages-a and pages-b**

```bash
grep -n "#0d0d14\|#13131e\|#171726\|#050508\|rgba(255, 255, 255, 0.07)\|rgba(255, 255, 255, 0.12)\|rgba(255, 255, 255, 0.07)" \
  apps/web/src/app/style/client/pages-a.module.css \
  apps/web/src/app/style/client/pages-b.module.css | head -30
```

- [ ] **Step 2: Replace hardcoded surface colors with glass tokens**

For every `background:` or `border:` that uses a hardcoded surface hex, replace:

| Old value | New CSS value |
|-----------|--------------|
| `#0d0d14` (s1) | `rgba(255, 255, 255, 0.04)` |
| `#13131e` (s2) | `rgba(255, 255, 255, 0.07)` |
| `#171726` (s3/s4) | `rgba(255, 255, 255, 0.10)` |
| `rgba(255,255,255,0.07)` borders | `rgba(255, 255, 255, 0.06)` |
| `rgba(255,255,255,0.12)` borders | `rgba(255, 255, 255, 0.10)` |

For `background` properties on card-like containers, also add `backdrop-filter: blur(8px)` if not present.

- [ ] **Step 3: Verify TypeScript still compiles**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

- [ ] **Step 4: Visual check — project request form and finance pages**

Navigate to "New Project" (project-request page) and "Invoices" page. Confirm glass treatment on form cards and invoice rows.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/style/client/pages-a.module.css apps/web/src/app/style/client/pages-b.module.css
git commit -m "style(client): glass token update — pages-a (project request, billing) and pages-b (finance)"
```

---

## Task 7: Token Update Pass — `pages-c.module.css` + `pages-d.module.css`

**Files:**
- Modify: `apps/web/src/app/style/client/pages-c.module.css` (2846 lines)
- Modify: `apps/web/src/app/style/client/pages-d.module.css` (7770 lines)

Same token update pattern as Task 6.

- [ ] **Step 1: Find hardcoded surface values**

```bash
grep -n "#0d0d14\|#13131e\|#171726\|#050508\|rgba(255, 255, 255, 0.07)\|rgba(255, 255, 255, 0.12)" \
  apps/web/src/app/style/client/pages-c.module.css \
  apps/web/src/app/style/client/pages-d.module.css | head -30
```

- [ ] **Step 2: Replace surface values using the same table as Task 6**

Apply all substitutions from Task 6 Step 2 to both files.

- [ ] **Step 3: Verify TypeScript still compiles**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

- [ ] **Step 4: Visual check — meetings and sprint board**

Navigate to "Messages/Design Review" (pages-c) and "Sprint Board" (pages-d). Confirm glass cards.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/style/client/pages-c.module.css apps/web/src/app/style/client/pages-d.module.css
git commit -m "style(client): glass token update — pages-c (meetings, design review) and pages-d (timeline, sprint board)"
```

---

## Task 8: Token Update Pass — `pages-misc.module.css`

**File:**
- Modify: `apps/web/src/app/style/client/pages-misc.module.css` (5604 lines)

- [ ] **Step 1: Find hardcoded surface values**

```bash
grep -n "#0d0d14\|#13131e\|#171726\|#050508\|rgba(255, 255, 255, 0.07)\|rgba(255, 255, 255, 0.12)" \
  apps/web/src/app/style/client/pages-misc.module.css | head -20
```

- [ ] **Step 2: Apply surface token substitutions**

Same table as Task 6 Step 2.

- [ ] **Step 3: Verify TypeScript still compiles**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/style/client/pages-misc.module.css
git commit -m "style(client): glass token update — pages-misc (onboarding, settings, team, reports)"
```

---

## Task 9: Visual Regression Spot-Check

**No file changes.** Verify the redesign looks correct on 8 pages at 3 breakpoints.

- [ ] **Step 1: Start dev server if not running**

```bash
pnpm dev
```

Navigate to `http://localhost:3000`

- [ ] **Step 2: Check each page at 1280px viewport**

Open browser devtools, set viewport to 1280px. Verify:

| Page | What to check |
|------|--------------|
| `home` | 5-zone layout visible, hero top, KPIs row, activity + approvals side-by-side |
| `dashboard` | Phase/milestone grid uses glass cards, no broken layouts |
| `sprint-board` | Kanban columns use glass card treatment |
| `invoices` | Table/list rows visible, glass card wrappers |
| `project-request` | Multi-step stepper form, glass input surfaces |
| `settings` | Form fields glass-styled, toggles functional |
| `files-assets` | Grid/list view renders with glass cards |
| `notifications` | Feed list with glowing dot colors |

- [ ] **Step 3: Check at 900px viewport**

Set viewport to 900px. Verify:
- Sidebar hides (mobile overlay expected)
- Multi-column grids collapse to 2-col (existing responsive CSS)
- Topbar still renders correctly

- [ ] **Step 4: Check at 480px viewport**

Set viewport to 480px. Verify:
- 2-col grids collapse to 1-col
- Hero card stacks vertically (CTA wraps below text)
- No horizontal scroll

- [ ] **Step 5: Final TypeScript check**

```bash
pnpm --filter @maphari/web exec tsc --noEmit
```

Expected: zero errors

- [ ] **Step 6: Final commit**

```bash
git add \
  apps/web/src/app/style/client/maphari-client-dashboard.module.css \
  apps/web/src/app/style/shared/maphari-dashboard-shared.module.css \
  apps/web/src/app/style/client/core.module.css \
  apps/web/src/app/style/client/pages-home.module.css \
  apps/web/src/app/style/client/pages-a.module.css \
  apps/web/src/app/style/client/pages-b.module.css \
  apps/web/src/app/style/client/pages-c.module.css \
  apps/web/src/app/style/client/pages-d.module.css \
  apps/web/src/app/style/client/pages-misc.module.css
git commit -m "style(client): complete redesign — obsidian precision, glass surfaces, floating island sidebar"
```

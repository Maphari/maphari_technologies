# Admin Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the admin dashboard shell and content styles to the "Structured Authority" direction — 52px icon rail + fly-out panel nav, flush live-status topbar, spaced stat cards with semantic colour accents — without touching any page logic or functionality.

**Architecture:** Replace the 240px sidebar with a 52px icon rail + 200px fly-out panel (open per section on click). Rewrite the topbar from a floating 64px card to a flush 44px status bar with live system-health pills. Update all card/stat/table CSS across the 7 admin CSS files to match the new card system.

**Tech Stack:** Next.js 14, React, CSS Modules, TypeScript. No new dependencies.

---

## File Map

| File | Change |
|---|---|
| `apps/web/src/app/style/admin/core.module.css` | Full shell rewrite — rail, fly-out, topbar, tokens |
| `apps/web/src/app/style/shared/shell.module.css` | `.sidebarMobileOpen` width, remove hardcoded 240px |
| `apps/web/src/components/admin/dashboard/sidebar.tsx` | Replace sidebar JSX with rail + fly-out |
| `apps/web/src/components/admin/dashboard/topbar.tsx` | Add status pills prop, restyle breadcrumb |
| `apps/web/src/components/admin/dashboard/hooks/use-admin-navigation.ts` | Expose `statusBar` counts for topbar pills |
| `apps/web/src/components/admin/maphari-dashboard.tsx` | Pass `statusBar` prop to `AdminTopbar` |
| `apps/web/src/app/style/admin/pages-a.module.css` | Card system + executive page Command Brief layout |
| `apps/web/src/app/style/admin/pages-b.module.css` | Card system update |
| `apps/web/src/app/style/admin/pages-c.module.css` | Card system update |
| `apps/web/src/app/style/admin/pages-clm.module.css` | Card system update |
| `apps/web/src/app/style/admin/pages-analytics.module.css` | Card system update |
| `apps/web/src/app/style/admin/pages-misc.module.css` | Card system update |
| `apps/web/src/app/style/admin.module.css` | KPI row semantic top-borders |

**Never rename these dynamic class names** (used via `cx()` lookups):
`badgeGreen`, `badgeRed`, `badgeAmber`, `badgePurple`, `badgeMuted`, `badgeAccent`,
`pfPurple`, `pfGreen`, `pfAmber`, `pfRed`, `bgGreen`, `bgAmber`, `bgPurple`, `bgRed`,
`topbarStatusGreen`, `topbarStatusAmber`, `topbarStatusRed`, `navBadgeAmber`, `navBadgeRed`,
`progressFillAmber`, `progressFillRed`, `progressFillGreen`, `progressFillPurple`

---

## Task 1: Design Tokens & Shell Layout (core.module.css)

**Files:**
- Modify: `apps/web/src/app/style/admin/core.module.css`

This is the structural foundation — everything else depends on the new layout primitives defined here.

- [ ] **Step 1: Add new tokens to `.dashboardRoot`**

  Open `apps/web/src/app/style/admin/core.module.css`. Inside the `.dashboardRoot { ... }` block, add the following after the existing token declarations:

  ```css
  /* Rail & fly-out */
  --rail-w: 52px;
  --flyout-w: 200px;
  --rail-bg: #09090f;
  --flyout-bg: #0e0e1a;

  /* Sidebar width aliases — keeps shared/shell.module.css intact */
  --sw: var(--rail-w);
  --sidebar-w: var(--sw);

  /* Topbar height (changes from 64px) */
  --topbar-h: 44px;

  /* Corner glows for stat cards */
  --glow-purple: rgba(139, 111, 255, 0.18);
  --glow-green:  rgba(52, 217, 139, 0.15);
  --glow-amber:  rgba(245, 166, 35, 0.15);
  --glow-blue:   rgba(96, 165, 250, 0.15);
  ```

- [ ] **Step 2: Rewrite the `.shell` layout**

  Find the `.shell { ... }` class in `core.module.css` and replace it with:

  ```css
  .shell {
    display: flex;
    flex-direction: row;
    min-height: 100vh;
    background: var(--bg);
    position: relative;
  }
  ```

- [ ] **Step 3: Add the `.rail` class (replaces `.sidebar`)**

  Find the existing `.sidebar { ... }` block and replace it entirely with:

  ```css
  .rail {
    width: var(--rail-w);
    min-height: 100vh;
    background: var(--rail-bg);
    border-right: 1px solid rgba(255, 255, 255, 0.05);
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 30;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 0;
    gap: 2px;
    /* Purple identity stripe on right edge */
    box-shadow: inset -2px 0 0 var(--accent);
  }

  .railLogo {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    background: var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 800;
    color: #fff;
    margin-bottom: 12px;
    flex-shrink: 0;
  }

  .railSectionIcon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.04);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border: none;
    color: rgba(255, 255, 255, 0.4);
    transition: background 120ms ease, color 120ms ease;
    position: relative;
    flex-shrink: 0;
  }

  .railSectionIcon:hover {
    background: rgba(139, 111, 255, 0.12);
    color: var(--accent2);
  }

  .railSectionIcon.railSectionActive {
    background: var(--accent);
    color: #fff;
  }

  .railDivider {
    width: 16px;
    height: 1px;
    background: rgba(255, 255, 255, 0.08);
    margin: 4px 0;
    flex-shrink: 0;
  }

  .railFooter {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding-bottom: 4px;
  }

  .railAvatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    color: #fff;
    cursor: pointer;
    border: none;
  }

  /* Tooltip shown on rail icon hover */
  .railTooltip {
    position: absolute;
    left: calc(var(--rail-w) + 8px);
    top: 50%;
    transform: translateY(-50%);
    background: #1a1a2e;
    border: 1px solid rgba(139, 111, 255, 0.2);
    color: var(--text);
    font-size: 11px;
    font-family: var(--font-syne), sans-serif;
    padding: 4px 10px;
    border-radius: 6px;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: opacity 120ms ease;
    z-index: 100;
  }

  .railSectionIcon:hover .railTooltip {
    opacity: 1;
  }
  ```

- [ ] **Step 4: Add the `.flyout` class**

  After the `.rail` block, add:

  ```css
  .flyout {
    width: var(--flyout-w);
    min-height: 100vh;
    background: var(--flyout-bg);
    border-right: 1px solid rgba(139, 111, 255, 0.12);
    box-shadow: 4px 0 20px rgba(0, 0, 0, 0.4);
    position: fixed;
    left: var(--rail-w);
    top: 0;
    bottom: 0;
    z-index: 29;
    display: flex;
    flex-direction: column;
    padding: 10px 8px;
    gap: 1px;
    overflow-y: auto;
    transform: translateX(-100%);
    opacity: 0;
    transition: transform 180ms ease-out, opacity 180ms ease-out;
    pointer-events: none;
  }

  .flyout.flyoutOpen {
    transform: translateX(0);
    opacity: 1;
    pointer-events: auto;
  }

  .flyoutSectionLabel {
    font-size: 9px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(139, 111, 255, 0.6);
    padding: 6px 8px 3px;
    font-family: var(--font-syne), sans-serif;
  }

  .flyoutItem {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border-radius: 6px;
    cursor: pointer;
    border: none;
    background: transparent;
    width: 100%;
    text-align: left;
    font-family: var(--font-syne), sans-serif;
    font-size: 12px;
    color: rgba(240, 237, 232, 0.55);
    transition: background 100ms ease, color 100ms ease;
  }

  .flyoutItem:hover {
    background: rgba(255, 255, 255, 0.04);
    color: var(--text);
  }

  .flyoutItem.flyoutItemActive {
    background: rgba(139, 111, 255, 0.2);
    color: var(--text);
  }

  .flyoutDot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.18);
    flex-shrink: 0;
  }

  .flyoutItem.flyoutItemActive .flyoutDot {
    background: var(--accent);
  }

  .flyoutItemLabel {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .flyoutBadge {
    font-size: 9px;
    font-family: var(--font-dm-mono), monospace;
    padding: 1px 5px;
    border-radius: 10px;
    background: rgba(245, 166, 35, 0.18);
    color: var(--amber);
    flex-shrink: 0;
  }

  .flyoutBadge.flyoutBadgeRed {
    background: rgba(255, 95, 95, 0.18);
    color: var(--red);
  }

  /* Backdrop for closing fly-out on outside click */
  .flyoutBackdrop {
    display: none;
    position: fixed;
    inset: 0;
    z-index: 28;
  }

  .flyoutBackdrop.flyoutBackdropVisible {
    display: block;
  }
  ```

- [ ] **Step 5: Add `.flyoutOpen` modifier on `.main` for layout offset**

  Find the `.main { ... }` block. Update `margin-left` and add the fly-out-open override:

  ```css
  .main {
    flex: 1;
    margin-left: var(--rail-w);  /* 52px — default (flyout closed) */
    padding-top: calc(var(--topbar-h) + 12px);
    min-width: 0;
    transition: margin-left 180ms ease-out;
  }

  /* When fly-out is open, push content right */
  .flyoutIsOpen .main {
    margin-left: calc(var(--rail-w) + var(--flyout-w));
  }
  ```

  Add `.flyoutIsOpen` to `dashboardRoot` as a class toggled from sidebar JSX via a prop.

- [ ] **Step 6: Rewrite the `.topbar` block**

  Find the `.topbar { ... }` block (currently at line ~375) and replace it entirely:

  ```css
  .topbar {
    height: var(--topbar-h);      /* 44px — was 64px */
    position: fixed;
    top: 0;                        /* was top: 16px */
    left: var(--rail-w);           /* was calc(var(--sidebar-w) + 32px) */
    right: 0;
    z-index: 20;
    display: flex;
    align-items: center;
    gap: 0;
    padding: 0 16px;
    background: #08080e;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    border-radius: 0;              /* was var(--r-md) */
    box-shadow: none;              /* was 0 10px 28px rgba(0,0,0,0.25) */
    /* Purple accent stripe — connects visually with rail's right edge */
    border-top: 2px solid var(--accent);
    transition: left 180ms ease-out;
  }

  .flyoutIsOpen .topbar {
    left: calc(var(--rail-w) + var(--flyout-w));
  }

  .topbarBreadcrumb {
    display: flex;
    align-items: center;
    gap: 5px;
    font-family: var(--font-dm-mono), monospace;
    font-size: 10px;
    flex-shrink: 0;
  }

  .topbarBcSection {
    color: rgba(255, 255, 255, 0.3);
  }

  .topbarBcSep {
    color: rgba(255, 255, 255, 0.18);
  }

  .topbarBcPage {
    color: var(--text);
    font-weight: 600;
  }

  .topbarDivider {
    width: 1px;
    height: 16px;
    background: rgba(255, 255, 255, 0.06);
    margin: 0 10px;
    flex-shrink: 0;
  }

  .topbarStatusPills {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .topbarPill {
    display: flex;
    align-items: center;
    gap: 4px;
    height: 22px;
    padding: 0 8px;
    border-radius: 4px;
    font-size: 9px;
    font-family: var(--font-dm-mono), monospace;
    white-space: nowrap;
  }

  .topbarPillPip {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .topbarPillGreen {
    background: rgba(52, 217, 139, 0.08);
    color: rgba(52, 217, 139, 0.8);
  }

  .topbarPillGreen .topbarPillPip {
    background: var(--green);
  }

  .topbarPillAmber {
    background: rgba(245, 166, 35, 0.08);
    color: rgba(245, 166, 35, 0.8);
  }

  .topbarPillAmber .topbarPillPip {
    background: var(--amber);
  }

  .topbarPillRed {
    background: rgba(255, 95, 95, 0.08);
    color: rgba(255, 95, 95, 0.8);
  }

  .topbarPillRed .topbarPillPip {
    background: var(--red);
  }

  .topbarSpacer {
    flex: 1;
  }

  .topbarPeriodChip {
    height: 26px;
    padding: 0 10px;
    border-radius: 6px;
    background: var(--accent-d);
    border: 1px solid rgba(139, 111, 255, 0.2);
    font-size: 10px;
    font-family: var(--font-dm-mono), monospace;
    color: var(--accent2);
    display: flex;
    align-items: center;
    white-space: nowrap;
    flex-shrink: 0;
  }
  ```

  Keep the existing `.topbarActions`, `.topbarIcon`, `.topbarUserMenu`, `.topbarUserBtn`, `.topbarUserAvatar`, `.topbarUserDropdown`, `.topbarUserEmail`, `.topbarUserItem` classes — only reskin them slightly:
  - `.topbarActions`: keep as flex row, update `gap: 6px`
  - `.topbarIcon`: keep existing, update size to 16px if needed

- [ ] **Step 7: Verify TypeScript still compiles**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```

  Expected: no errors (this is CSS-only, no TypeScript changes yet)

- [ ] **Step 8: Commit**

  ```bash
  git add apps/web/src/app/style/admin/core.module.css
  git commit -m "feat(admin-ui): redesign tokens, rail, flyout, topbar layout in core.module.css"
  ```

---

## Task 2: Shared Shell — Mobile Override Update

**Files:**
- Modify: `apps/web/src/app/style/shared/shell.module.css`

- [ ] **Step 1: Find the `.sidebarMobileOpen` class**

  Open `apps/web/src/app/style/shared/shell.module.css`. Search for `.sidebarMobileOpen`. It currently sets `max-width` or `width` to `240px` or a hardcoded value.

- [ ] **Step 2: Update `.sidebarMobileOpen` to use the fly-out width token**

  Change the width/max-width to:

  ```css
  .sidebarMobileOpen {
    /* Use combined rail + flyout width for mobile drawer */
    width: calc(var(--rail-w, 52px) + var(--flyout-w, 200px));
    max-width: 100vw;
    overflow-y: auto;
    max-height: 100dvh;
  }
  ```

  The `var(--rail-w, 52px)` fallback ensures graceful handling if the token isn't present in shared context.

- [ ] **Step 3: Search for any other hardcoded `240px` sidebar references in shell.module.css and update them**

  ```bash
  grep -n "240px\|--sidebar-w\|sidebar-w" apps/web/src/app/style/shared/shell.module.css
  ```

  For any occurrence that sets layout offsets based on the old sidebar width, update to use `var(--rail-w, 52px)` or remove if superseded by `core.module.css`.

- [ ] **Step 4: Commit**

  ```bash
  git add apps/web/src/app/style/shared/shell.module.css
  git commit -m "feat(admin-ui): update shared shell mobile sidebar width to rail+flyout tokens"
  ```

---

## Task 3: Sidebar JSX — Icon Rail + Fly-out Panel

**Files:**
- Modify: `apps/web/src/components/admin/dashboard/sidebar.tsx`
- Modify: `apps/web/src/components/admin/maphari-dashboard.tsx` (add `flyoutIsOpen` class)

The current sidebar renders a single scrollable nav panel. Replace it with: icon rail (always visible) + fly-out panel (open per section). Preserve the `showAllPages` popup modal entirely — it's still useful and accessible via rail footer button.

- [ ] **Step 1: Add `activeSectionId` and `flyoutOpen` state**

  At the top of the `AdminSidebar` component, add:

  ```tsx
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  ```

  Also add a prop `onFlyoutChange` to notify the parent so it can toggle the `.flyoutIsOpen` class on `.dashboardRoot`:

  ```tsx
  onFlyoutChange?: (open: boolean) => void;
  ```

  Add it to the destructured props and to the type definition.

- [ ] **Step 2: Build the section icon list from `grouped`**

  Add this derived value inside the component (after existing `useMemo` calls):

  ```tsx
  const sectionList = useMemo(() => Object.keys(grouped), [grouped]);
  ```

  `sectionList` will be something like: `["Operations", "Experience", "Finance", "Communication", "Governance", "Knowledge", "Lifecycle", "AI/ML", "Automation"]`.

- [ ] **Step 3: Add section icon click handler**

  ```tsx
  function handleSectionClick(sectionId: string): void {
    if (activeSectionId === sectionId && flyoutOpen) {
      setFlyoutOpen(false);
      setActiveSectionId(null);
      onFlyoutChange?.(false);
    } else {
      setActiveSectionId(sectionId);
      setFlyoutOpen(true);
      onFlyoutChange?.(true);
    }
  }

  function closeFlyout(): void {
    setFlyoutOpen(false);
    setActiveSectionId(null);
    onFlyoutChange?.(false);
  }
  ```

  Also close the fly-out when a page is selected:

  ```tsx
  function handlePageSelect(id: PageId): void {
    onPageChange(id);
    closeFlyout();
  }
  ```

- [ ] **Step 4: Add section abbreviation map**

  The icons in the rail need a short label or icon. Since we're using lucide/SVG icons via `NavIcon`, we'll use the first letter of each section as a text fallback with a consistent icon approach. Add this map:

  ```tsx
  const sectionAbbrev: Record<string, string> = {
    Operations: "Op",
    Experience: "Ex",
    Finance: "Fi",
    Communication: "Co",
    Governance: "Go",
    Knowledge: "Kn",
    Lifecycle: "Lc",
    "AI/ML": "AI",
    Automation: "Au",
  };
  ```

- [ ] **Step 5: Rewrite the return JSX**

  Replace the entire `return (...)` block with:

  ```tsx
  return (
    <>
      {/* Backdrop — click outside closes fly-out */}
      <div
        className={`${styles.flyoutBackdrop}${flyoutOpen ? ` ${styles.flyoutBackdropVisible}` : ""}`}
        onClick={closeFlyout}
        aria-hidden="true"
      />

      <aside
        className={`${styles.rail}${mobileOpen ? ` ${styles.sidebarMobileOpen}` : ""}`}
        aria-label="Section navigation"
      >
        {/* Logo */}
        <div className={styles.railLogo} aria-hidden="true">M</div>

        {/* Section icons */}
        {sectionList.map((section, index) => (
          <button
            key={section}
            type="button"
            className={`${styles.railSectionIcon}${activeSectionId === section && flyoutOpen ? ` ${styles.railSectionActive}` : ""}`}
            onClick={() => handleSectionClick(section)}
            aria-label={`Open ${section} navigation`}
            aria-expanded={activeSectionId === section && flyoutOpen}
          >
            {sectionAbbrev[section] ?? section.slice(0, 2)}
            <span className={styles.railTooltip} aria-hidden="true">{section}</span>
          </button>
        ))}

        {/* Footer */}
        <div className={styles.railFooter}>
          {/* All Pages button */}
          <button
            type="button"
            className={styles.railSectionIcon}
            onClick={openAllPages}
            aria-label="Browse all pages"
            title="All pages"
          >
            ⊞
          </button>
          {/* User avatar */}
          <button
            type="button"
            className={styles.railAvatar}
            aria-label={`User: ${email}`}
            title={email}
          >
            {email[0]?.toUpperCase() ?? "A"}
          </button>
        </div>
      </aside>

      {/* Fly-out panel */}
      <div
        className={`${styles.flyout}${flyoutOpen ? ` ${styles.flyoutOpen}` : ""}`}
        aria-hidden={!flyoutOpen}
      >
        {activeSectionId && grouped[activeSectionId] ? (
          <>
            <div className={styles.flyoutSectionLabel}>{activeSectionId}</div>
            {grouped[activeSectionId].map((item) => (
              <button
                key={item.id}
                type="button"
                className={`${styles.flyoutItem}${page === item.id ? ` ${styles.flyoutItemActive}` : ""}`}
                onClick={() => handlePageSelect(item.id)}
              >
                <span className={styles.flyoutDot} aria-hidden="true" />
                <span className={styles.flyoutItemLabel}>
                  {sidebarLabel[item.id] ?? item.label}
                </span>
                {typeof navBadgeCounts[item.id] === "number" &&
                (navBadgeCounts[item.id] ?? 0) > 0 ? (
                  <span className={`${styles.flyoutBadge}${item.badgeRed ? ` ${styles.flyoutBadgeRed}` : ""}`}>
                    {navBadgeCounts[item.id]}
                  </span>
                ) : null}
              </button>
            ))}
          </>
        ) : null}
      </div>

      {/* All Pages modal — unchanged from original */}
      {showAllPages ? (
        <div className={styles.navPopupBackdrop} onClick={closeAllPages}>
          <div
            ref={popupPanelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-app-grid-title"
            aria-describedby="admin-app-grid-desc"
            className={styles.navPopupPanel}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.navPopupHeader}>
              <div>
                <div id="admin-app-grid-title" className={styles.navPopupTitle}>All Pages</div>
                <div id="admin-app-grid-desc" className={styles.navPopupSubtitle}>
                  Use search and section grouping to jump directly to any admin page. Press Esc to close.
                </div>
              </div>
              <button type="button" className={styles.navPopupClose} onClick={closeAllPages} aria-label="Close all pages dialog">
                Close
              </button>
            </div>
            <div className={styles.navPopupSearchRow}>
              <input
                ref={allPagesInputRef}
                type="text"
                value={allPagesQuery}
                onChange={(event) => setAllPagesQuery(event.target.value)}
                placeholder="Find page by name, id, or section"
                className={styles.navPopupSearch}
              />
              <button
                type="button"
                className={styles.navPopupClear}
                onClick={() => { setAllPagesQuery(""); allPagesInputRef.current?.focus(); }}
                disabled={!allPagesQuery}
              >
                Clear
              </button>
            </div>
            <div className={styles.navPopupMeta}>
              <span>{allPagesFiltered.length} pages · {Object.keys(groupedPageResults).length} sections</span>
              <span>Enter to open</span>
            </div>
            {allPagesFiltered.length === 0 ? (
              <div className={styles.navPopupEmpty}>No pages match your search. Try a broader term.</div>
            ) : (
              <div className={styles.navPopupSections}>
                {Object.entries(groupedPageResults).map(([section, items]) => (
                  <section key={section} className={styles.navPopupSection}>
                    <div className={styles.navPopupSectionHeader}>
                      <div className={styles.navPopupSectionTitle}>{section}</div>
                      <div className={styles.navPopupSectionCount}>{items.length}</div>
                    </div>
                    <div className={styles.navPageGrid}>
                      {items.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className={`${styles.navPageTile}${page === item.id ? ` ${styles.navPageTileActive}` : ""}`}
                          onClick={() => { onPageChange(item.id); closeAllPages(); }}
                        >
                          <span className={styles.navPageTileIcon}>
                            <NavIcon id={item.id} className={styles.navIcon} />
                          </span>
                          <div>
                            <div className={styles.navPageTileLabel}>{item.label}</div>
                            <div className={styles.navPageTileMeta}>{item.id}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
  ```

- [ ] **Step 6: Wire `flyoutIsOpen` class in `maphari-dashboard.tsx`**

  In `apps/web/src/components/admin/maphari-dashboard.tsx`:

  1. Add `const [flyoutIsOpen, setFlyoutIsOpen] = useState(false);` near the other state declarations.
  2. Pass `onFlyoutChange={setFlyoutIsOpen}` to `<AdminSidebar>`.
  3. On the root `<div>` (which has `className={...styles.dashboardRoot...}`), add the `flyoutIsOpen` class conditionally:

  ```tsx
  <div
    className={`${styles.dashboardRoot} ${styles.root} dashboardScale dashboardThemeAdmin${flyoutIsOpen ? ` ${styles.flyoutIsOpen}` : ""}`}
  >
  ```

- [ ] **Step 7: TypeScript check**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```

  Expected: no errors. Fix any prop type mismatches.

- [ ] **Step 8: Commit**

  ```bash
  git add apps/web/src/components/admin/dashboard/sidebar.tsx \
          apps/web/src/components/admin/maphari-dashboard.tsx
  git commit -m "feat(admin-ui): replace sidebar with icon rail + fly-out panel"
  ```

---

## Task 4: Topbar JSX — Breadcrumb + Status Pills

**Files:**
- Modify: `apps/web/src/components/admin/dashboard/hooks/use-admin-navigation.ts`
- Modify: `apps/web/src/components/admin/dashboard/topbar.tsx`
- Modify: `apps/web/src/components/admin/maphari-dashboard.tsx`

The topbar already receives `title: [string, string]` (section + page). We need to add `statusBar` data and a period chip.

- [ ] **Step 1: Expose `statusBar` from `use-admin-navigation.ts`**

  Inside `use-admin-navigation.ts`, find the `navBadgeCounts` `useMemo`. Right after it, add a new `statusBar` memo using the same inputs:

  ```tsx
  const statusBar = useMemo(() => {
    const clientsActive = snapshot.clients.filter(
      (client) => client.status === "ACTIVE",
    ).length;
    const blockers = projectBlockers.filter(
      (blocker) => blocker.status !== "RESOLVED",
    ).length;
    const atRisk = snapshot.clients.filter(
      (client) => client.status !== "ACTIVE",
    ).length;
    return { clientsActive, blockers, atRisk };
  }, [projectBlockers, snapshot.clients]);
  ```

  Add `statusBar` to the `return` object at the bottom of the hook.

- [ ] **Step 2: Add `statusBar` and `periodLabel` props to `AdminTopbar`**

  In `topbar.tsx`, add to the props type:

  ```tsx
  statusBar?: { clientsActive: number; blockers: number; atRisk: number };
  ```

  `periodLabel` can be derived inside the component from `new Date()` — no prop needed.

- [ ] **Step 3: Build the period label inside the component**

  Add this inside `AdminTopbar`:

  ```tsx
  const periodLabel = new Date().toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  }); // e.g. "Mar 2026"
  ```

- [ ] **Step 4: Rewrite the topbar JSX**

  Replace the `return (...)` in `AdminTopbar` with:

  ```tsx
  return (
    <header className={styles.topbar}>
      {onMenuToggle ? (
        <button
          type="button"
          className={styles.hamburger}
          aria-label="Toggle navigation"
          onClick={onMenuToggle}
        >
          <svg width="20" height="20" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <rect x="1" y="4"    width="16" height="1.5" rx="0.75" fill="currentColor"/>
            <rect x="1" y="8.25" width="16" height="1.5" rx="0.75" fill="currentColor"/>
            <rect x="1" y="12.5" width="16" height="1.5" rx="0.75" fill="currentColor"/>
          </svg>
        </button>
      ) : null}

      {/* Breadcrumb */}
      <div className={styles.topbarBreadcrumb}>
        <span className={styles.topbarBcSection}>{title[0]}</span>
        <span className={styles.topbarBcSep}>/</span>
        <span className={styles.topbarBcPage}>{title[1]}</span>
      </div>

      {/* Status pills */}
      {statusBar && (statusBar.clientsActive > 0 || statusBar.blockers > 0 || statusBar.atRisk > 0) ? (
        <>
          <div className={styles.topbarDivider} aria-hidden="true" />
          <div className={styles.topbarStatusPills}>
            {statusBar.clientsActive > 0 ? (
              <span className={`${styles.topbarPill} ${styles.topbarPillGreen}`}>
                <span className={styles.topbarPillPip} aria-hidden="true" />
                {statusBar.clientsActive} active
              </span>
            ) : null}
            {statusBar.blockers > 0 ? (
              <span className={`${styles.topbarPill} ${styles.topbarPillAmber}`}>
                <span className={styles.topbarPillPip} aria-hidden="true" />
                {statusBar.blockers} blockers
              </span>
            ) : null}
            {statusBar.atRisk > 0 ? (
              <span className={`${styles.topbarPill} ${styles.topbarPillRed}`}>
                <span className={styles.topbarPillPip} aria-hidden="true" />
                {statusBar.atRisk} at risk
              </span>
            ) : null}
          </div>
        </>
      ) : null}

      <div className={styles.topbarSpacer} />

      {/* Period chip */}
      <span className={styles.topbarPeriodChip}>{periodLabel}</span>

      {/* Actions */}
      <div className={styles.topbarActions}>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={onOpenNotifications}
          aria-label="Open notifications"
        >
          <DashboardUtilityIcon kind="notifications" className={styles.topbarIcon} />
          {unreadNotificationsCount > 0 ? (
            <span className={styles.dot} />
          ) : null}
        </button>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={onOpenMessages}
          aria-label="Open messages"
        >
          <DashboardUtilityIcon kind="messages" className={styles.topbarIcon} />
        </button>
        <div className={styles.topbarUserMenu} ref={profileMenuRef}>
          <button
            title="Open profile menu"
            type="button"
            className={styles.topbarUserBtn}
            onClick={() => setProfileMenuOpen((v) => !v)}
            aria-expanded={profileMenuOpen}
          >
            <span className={styles.topbarUserAvatar}>
              {email[0]?.toUpperCase() ?? "A"}
            </span>
          </button>
          {profileMenuOpen ? (
            <div className={styles.topbarUserDropdown}>
              <div className={styles.topbarUserEmail}>{email}</div>
              <button
                type="button"
                className={styles.topbarUserItem}
                onClick={onLogout}
                disabled={loggingOut}
              >
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
  ```

  Note: `apps`, `help` buttons removed from topbar — they were non-essential and the "All Pages" action is now on the rail footer.

- [ ] **Step 5: Pass `statusBar` from `maphari-dashboard.tsx` to `AdminTopbar`**

  In `maphari-dashboard.tsx`:
  1. Destructure `statusBar` from `useAdminNavigation()` (which now returns it).
  2. Pass it to `<AdminTopbar statusBar={statusBar} ... />`.

- [ ] **Step 6: TypeScript check**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```

  Expected: no errors. If the `openAppGrid` function removal causes a linter warning (it dispatches `admin:open-app-grid` which `sidebar.tsx` listens for), that's fine — the listener in sidebar still works for external triggers.

- [ ] **Step 7: Commit**

  ```bash
  git add apps/web/src/components/admin/dashboard/hooks/use-admin-navigation.ts \
          apps/web/src/components/admin/dashboard/topbar.tsx \
          apps/web/src/components/admin/maphari-dashboard.tsx
  git commit -m "feat(admin-ui): topbar — live status pills, breadcrumb restyle, period chip"
  ```

---

## Task 5: Card System Primitives (core.module.css additions)

**Files:**
- Modify: `apps/web/src/app/style/admin/core.module.css`

Add shared card, section header, entity row, and table styles that page CSS files can inherit from. These go at the end of `core.module.css`.

- [ ] **Step 1: Add the stat card base class**

  Append to `core.module.css`:

  ```css
  /* ─── Shared Card System ─────────────────────────────────── */

  /* Base stat card — apply topBorderPurple/Green/Amber/Blue modifier */
  .statCard {
    background: var(--s2);
    border: 1px solid rgba(139, 111, 255, 0.1);
    border-top: 2px solid var(--accent);
    border-radius: 8px;
    padding: 14px 16px;
    position: relative;
    overflow: hidden;
  }

  .statCard::after {
    content: "";
    position: absolute;
    bottom: -15px;
    right: -15px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: var(--glow-purple);
    filter: blur(16px);
    pointer-events: none;
  }

  .statCardGreen {
    border-top-color: var(--green);
  }
  .statCardGreen::after { background: var(--glow-green); }

  .statCardAmber {
    border-top-color: var(--amber);
  }
  .statCardAmber::after { background: var(--glow-amber); }

  .statCardBlue {
    border-top-color: var(--blue);
  }
  .statCardBlue::after { background: var(--glow-blue); }

  .statCardValue {
    font-size: 22px;
    font-weight: 700;
    font-family: var(--font-dm-mono), monospace;
    color: var(--text);
    line-height: 1;
    margin-bottom: 4px;
  }

  .statCardLabel {
    font-size: 9px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
    font-family: var(--font-syne), sans-serif;
  }

  .statCardDelta {
    font-size: 11px;
    font-family: var(--font-dm-mono), monospace;
    margin-top: 4px;
    color: var(--green);
  }

  .statCardDeltaNeg {
    color: var(--amber);
  }

  /* ─── Section header (label + rule) ─────────────────────── */

  .sectionHeader {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
  }

  .sectionHeaderLabel {
    font-size: 9px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.25);
    font-family: var(--font-syne), sans-serif;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .sectionHeaderRule {
    flex: 1;
    height: 1px;
    background: rgba(255, 255, 255, 0.05);
  }

  /* ─── Entity row ─────────────────────────────────────────── */

  .entityRow {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 8px;
    border-radius: 5px;
    transition: background 80ms ease;
  }

  .entityRow:hover {
    background: rgba(255, 255, 255, 0.03);
  }

  .entityLogo {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    background: rgba(139, 111, 255, 0.15);
    flex-shrink: 0;
  }

  .entityNameBlock {
    flex: 1;
    min-width: 0;
  }

  .entityName {
    font-size: 12px;
    font-weight: 600;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .entityProgress {
    height: 3px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 2px;
    margin-top: 4px;
    overflow: hidden;
  }

  .entityProgressFill {
    height: 100%;
    border-radius: 2px;
    background: var(--accent);
  }

  .entityStatusDot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--green);
    flex-shrink: 0;
  }

  .entityStatusDotAmber { background: var(--amber); }
  .entityStatusDotRed   { background: var(--red); }

  /* ─── Data table ─────────────────────────────────────────── */

  .dataTableHead {
    display: grid;
    padding: 6px 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .dataTableHeadCell {
    font-size: 9px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.3);
    font-family: var(--font-syne), sans-serif;
  }

  .dataTableRow {
    display: grid;
    padding: 7px 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    transition: background 80ms ease;
  }

  .dataTableRow:last-child {
    border-bottom: none;
  }

  .dataTableRow:hover {
    background: rgba(255, 255, 255, 0.02);
  }

  /* ─── Empty state ─────────────────────────────────────────── */

  .emptyState {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    gap: 8px;
    text-align: center;
  }

  .emptyStateHeading {
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
  }

  .emptyStateSub {
    font-size: 12px;
    color: var(--muted);
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add apps/web/src/app/style/admin/core.module.css
  git commit -m "feat(admin-ui): add shared card system primitives to core.module.css"
  ```

---

## Task 6: Executive Page — Command Brief Layout (pages-a.module.css)

**Files:**
- Modify: `apps/web/src/app/style/admin/pages-a.module.css`

The executive page is the admin homepage. Update its layout classes for the Command Brief: hero strip + secondary KPI row + activity feed.

- [ ] **Step 1: Locate the executive page classes**

  Open `apps/web/src/app/style/admin/pages-a.module.css`. Search for the executive page section (look for comments like `/* Executive */` or class names like `.execPage`, `.execHero`, `.execKpiGrid`, etc.).

  Also open the executive page component:
  ```bash
  ls apps/web/src/components/admin/dashboard/pages/ | grep -i exec
  ```
  Read the component to understand which CSS class names it uses.

- [ ] **Step 2: Add/update the Command Brief layout classes**

  Add or replace the executive page layout classes in `pages-a.module.css`:

  ```css
  /* ─── Executive Page — Command Brief Layout ───────────────── */

  .execLayout {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 20px 24px;
  }

  /* Row 1: Hero strip */
  .execHeroStrip {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 12px;
    align-items: stretch;
    background: var(--s2);
    border: 1px solid rgba(139, 111, 255, 0.12);
    border-radius: 8px;
    padding: 20px 24px;
    position: relative;
    overflow: hidden;
  }

  .execHeroStrip::after {
    content: "";
    position: absolute;
    bottom: -20px;
    right: -20px;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: var(--glow-purple);
    filter: blur(20px);
    pointer-events: none;
  }

  .execHeroPrimary {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
  }

  .execHeroLabel {
    font-size: 9px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted);
    font-family: var(--font-syne), sans-serif;
  }

  .execHeroValue {
    font-size: 28px;
    font-weight: 700;
    font-family: var(--font-dm-mono), monospace;
    color: var(--text);
    line-height: 1;
  }

  .execHeroDelta {
    font-size: 11px;
    font-family: var(--font-dm-mono), monospace;
    color: var(--green);
    margin-top: 2px;
  }

  .execHeroMiniStats {
    display: flex;
    flex-direction: column;
    gap: 8px;
    justify-content: center;
  }

  .execHeroMiniStat {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 6px;
    padding: 8px 14px;
    min-width: 100px;
  }

  .execAlertFeed {
    display: flex;
    flex-direction: column;
    gap: 4px;
    justify-content: center;
    min-width: 180px;
  }

  .execAlertFeedTitle {
    font-size: 8px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.2);
    margin-bottom: 4px;
  }

  .execAlertItem {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
  }

  .execAlertIcon {
    width: 14px;
    height: 14px;
    border-radius: 3px;
    flex-shrink: 0;
  }

  .execAlertIconAmber { background: rgba(245, 166, 35, 0.2); }
  .execAlertIconRed   { background: rgba(255, 95, 95, 0.2); }
  .execAlertIconGreen { background: rgba(52, 217, 139, 0.15); }
  .execAlertIconPurple { background: rgba(139, 111, 255, 0.2); }

  .execAlertText {
    font-size: 11px;
    color: var(--muted);
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Row 2: Secondary KPI strip */
  .execKpiStrip {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  /* Row 3: Activity feed card */
  .execActivityCard {
    background: var(--s2);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 16px 20px;
  }

  .execActivityList {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .execActivityItem {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  }

  .execActivityItem:last-child {
    border-bottom: none;
  }

  .execActivityIcon {
    width: 12px;
    height: 12px;
    border-radius: 3px;
    flex-shrink: 0;
  }

  .execActivityDesc {
    flex: 1;
    font-size: 12px;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .execActivityTime {
    font-size: 10px;
    font-family: var(--font-dm-mono), monospace;
    color: var(--muted);
    flex-shrink: 0;
  }
  ```

- [ ] **Step 3: Update the executive page component JSX to use the new classes**

  Open the executive page component (found in Step 1). Update it to use the new layout classes. The structure should be:

  ```tsx
  <div className={styles.execLayout}>
    {/* Row 1 */}
    <div className={styles.execHeroStrip}>
      <div className={styles.execHeroPrimary}>
        <div className={styles.execHeroLabel}>Monthly Revenue</div>
        <div className={styles.execHeroValue}>{formatCurrency(mrr)}</div>
        <div className={styles.execHeroDelta}>↑ +8.4% vs last month</div>
      </div>
      <div className={styles.execHeroMiniStats}>
        <div className={styles.execHeroMiniStat}>
          <div className={styles.statCardLabel}>Clients</div>
          <div className={styles.statCardValue}>{clientCount}</div>
        </div>
        <div className={styles.execHeroMiniStat}>
          <div className={styles.statCardLabel}>SLA</div>
          <div className={styles.statCardValue}>{slaScore}%</div>
        </div>
      </div>
      <div className={styles.execAlertFeed}>
        <div className={styles.execAlertFeedTitle}>Alerts</div>
        {/* Alert items */}
      </div>
    </div>

    {/* Row 2 */}
    <div className={styles.execKpiStrip}>
      <div className={`${styles.statCard}`}>...</div>
      <div className={`${styles.statCard} ${styles.statCardAmber}`}>...</div>
      <div className={`${styles.statCard} ${styles.statCardGreen}`}>...</div>
    </div>

    {/* Row 3 */}
    <div className={styles.execActivityCard}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionHeaderLabel}>Recent Activity</span>
        <span className={styles.sectionHeaderRule} />
      </div>
      <div className={styles.execActivityList}>
        {/* Activity items */}
      </div>
    </div>
  </div>
  ```

  Adapt to whatever data is currently available in the page component — use real prop values, not hardcoded strings.

- [ ] **Step 4: TypeScript check**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add apps/web/src/app/style/admin/pages-a.module.css \
          apps/web/src/components/admin/dashboard/pages/executive-page.tsx
  git commit -m "feat(admin-ui): executive page Command Brief layout — hero strip, KPI row, activity feed"
  ```

---

## Task 7: Card System — Remaining Pages CSS Files

**Files:**
- Modify: `apps/web/src/app/style/admin/pages-a.module.css` (non-executive pages)
- Modify: `apps/web/src/app/style/admin/pages-b.module.css`
- Modify: `apps/web/src/app/style/admin/pages-c.module.css`
- Modify: `apps/web/src/app/style/admin/pages-clm.module.css`
- Modify: `apps/web/src/app/style/admin/pages-analytics.module.css`
- Modify: `apps/web/src/app/style/admin/pages-misc.module.css`

For each file: update any locally-defined stat card, KPI block, entity row, and table header patterns to use the new card system visual language (background `var(--s2)`, semantic top-border, corner glow). These files contain many page-specific layout classes — do not touch layout grids. Only update visual patterns: card backgrounds, border colours, table header styles.

Do the files one at a time, commit after each.

- [ ] **Step 1: pages-b.module.css — visual pattern update**

  Search for classes that:
  - Set card/panel backgrounds: update to `var(--s2)` where currently set to a hardcoded surface value
  - Define KPI/stat blocks: add `border-top: 2px solid var(--accent)` and corner glow pseudo-element
  - Style table headers: update to 9px small caps muted pattern

  ```bash
  grep -n "background.*#0[df]\|background.*surface\|kpi\|KPI\|stat\|Stat" \
    apps/web/src/app/style/admin/pages-b.module.css | head -30
  ```

  Use the search results to identify which classes to update. Apply the card system from Task 5.

- [ ] **Step 2: Commit pages-b**

  ```bash
  git add apps/web/src/app/style/admin/pages-b.module.css
  git commit -m "feat(admin-ui): pages-b card system update"
  ```

- [ ] **Step 3: pages-c.module.css — same process**

  ```bash
  git add apps/web/src/app/style/admin/pages-c.module.css
  git commit -m "feat(admin-ui): pages-c card system update"
  ```

- [ ] **Step 4: pages-clm.module.css — same process**

  ```bash
  git add apps/web/src/app/style/admin/pages-clm.module.css
  git commit -m "feat(admin-ui): pages-clm card system update"
  ```

- [ ] **Step 5: pages-analytics.module.css — same process**

  ```bash
  git add apps/web/src/app/style/admin/pages-analytics.module.css
  git commit -m "feat(admin-ui): pages-analytics card system update"
  ```

- [ ] **Step 6: pages-misc.module.css — same process**

  ```bash
  git add apps/web/src/app/style/admin/pages-misc.module.css
  git commit -m "feat(admin-ui): pages-misc card system update"
  ```

- [ ] **Step 7: pages-a.module.css non-executive sections — same process**

  ```bash
  git add apps/web/src/app/style/admin/pages-a.module.css
  git commit -m "feat(admin-ui): pages-a non-executive card system update"
  ```

---

## Task 8: Admin Primitives (admin.module.css)

**Files:**
- Modify: `apps/web/src/app/style/admin.module.css`

This file defines shared entity tables and KPI row primitives used across pages.

- [ ] **Step 1: Update KPI row top-border pattern**

  Open `apps/web/src/app/style/admin.module.css`. Find KPI row / KPI card classes (search for `kpi`, `KPI`, `kpiRow`, `kpiCard`).

  For each KPI card class that defines a border or border-top, update to use the semantic token system:
  - Primary: `border-top: 2px solid var(--accent)`
  - Green: `border-top: 2px solid var(--green)`
  - Amber: `border-top: 2px solid var(--amber)`
  - Blue: `border-top: 2px solid var(--blue)`

- [ ] **Step 2: Update entity table row hover state**

  Find entity table row classes. Update hover background to:
  ```css
  background: rgba(255, 255, 255, 0.02);
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add apps/web/src/app/style/admin.module.css
  git commit -m "feat(admin-ui): admin.module.css KPI semantic borders + entity row hover"
  ```

---

## Task 9: Final Verification

- [ ] **Step 1: TypeScript check — full clean compile**

  ```bash
  pnpm --filter @maphari/web exec tsc --noEmit
  ```

  Expected: exit 0, no errors.

- [ ] **Step 2: Check dynamic class names are all still present**

  These must all still exist (never renamed). Run:

  ```bash
  grep -r "badgeGreen\|badgeRed\|badgeAmber\|pfPurple\|pfGreen\|topbarStatusGreen\|navBadgeAmber\|navBadgeRed" \
    apps/web/src/app/style/admin/ | wc -l
  ```

  Expected: count > 0 (all class names still present in CSS files).

- [ ] **Step 3: Start dev server and visually verify the shell**

  The dev server runs on port 3000 as a background Node process. If not already running:

  ```bash
  pnpm --filter @maphari/web dev &
  ```

  Navigate to the admin dashboard at `http://localhost:3000` (set `NEXT_PUBLIC_APP_TYPE=both` in `.env.local` if needed).

  Verify:
  - [ ] 52px icon rail visible on left, purple right-edge stripe
  - [ ] Clicking a section icon opens labeled fly-out panel
  - [ ] Clicking outside or navigating closes fly-out
  - [ ] `.main` content shifts right when fly-out opens
  - [ ] Topbar is flush, 44px, purple top border
  - [ ] Breadcrumb `Section / Page` in DM Mono visible in topbar
  - [ ] Status pills appear (green/amber/red) when counts > 0
  - [ ] Period chip `Mar 2026` visible
  - [ ] Executive page shows Command Brief: hero strip, KPI row, activity feed
  - [ ] Notifications button + avatar still work
  - [ ] All Pages modal still opens from rail footer button

- [ ] **Step 4: Final commit if any small fixes were made during review**

  ```bash
  git add -p   # stage only what was changed
  git commit -m "fix(admin-ui): post-review visual tweaks"
  ```

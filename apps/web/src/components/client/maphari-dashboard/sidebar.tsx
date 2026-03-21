"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { NavIcon } from "./ui";
import { cx, styles } from "./style";
import type { NavItem, PageId } from "./types";
import { capitalize } from "./utils";

// ── Section icon map ───────────────────────────────────────────────────────
const SECTION_ICONS: Record<string, React.ReactNode> = {
  Overview: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  Projects: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <line x1="12" y1="12" x2="12" y2="16" />
      <line x1="10" y1="14" x2="14" y2="14" />
    </svg>
  ),
  Finance: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="1" y="4" width="22" height="16" rx="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  Communication: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Files: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Reporting: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  Growth: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  Support: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <line x1="4.93" y1="4.93" x2="9.17" y2="9.17" />
      <line x1="14.83" y1="14.83" x2="19.07" y2="19.07" />
      <line x1="14.83" y1="9.17" x2="19.07" y2="4.93" />
      <line x1="4.93" y1="19.07" x2="9.17" y2="14.83" />
    </svg>
  ),
  Account: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
};

// Fallback icon for unknown sections
function DefaultSectionIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

type ClientSidebarProps = {
  navSections: Array<[string, NavItem[]]>;
  allPagesSections?: Array<[string, NavItem[]]>;
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  clientName: string;
  companyName: string;
  clientInitials: string;
  planLabel?: string;
  activeProjectName?: string;
  projects?: Array<{ id: string; name: string }>;
  onProjectChange?: (projectId: string) => void;
  onOpenSearch?: () => void;
  mobileOpen?: boolean;
  onActiveSectionChange?: (id: string | null) => void;
};

export function ClientSidebar({
  navSections,
  allPagesSections,
  activePage,
  onNavigate,
  clientName,
  companyName,
  clientInitials,
  planLabel,
  activeProjectName,
  projects,
  onProjectChange,
  onOpenSearch,
  mobileOpen = false,
  onActiveSectionChange,
}: ClientSidebarProps) {

  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [showAllPages, setShowAllPages] = useState(false);
  const [allPagesQuery, setAllPagesQuery] = useState("");

  const flyoutRef = useRef<HTMLDivElement | null>(null);
  const railRef = useRef<HTMLElement | null>(null);
  const popupPanelRef = useRef<HTMLDivElement | null>(null);
  const allPagesInputRef = useRef<HTMLInputElement | null>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);

  // Which section does the current active page belong to?
  const activeSection = useMemo(
    () => navSections.find(([, items]) => items.some((i) => i.id === activePage))?.[0] ?? null,
    [navSections, activePage],
  );

  const allPages = useMemo(
    () => (allPagesSections ?? navSections).flatMap(([, items]) => items),
    [allPagesSections, navSections],
  );

  const allPagesFiltered = useMemo(() => {
    const query = allPagesQuery.trim().toLowerCase();
    if (!query) return allPages;
    return allPages.filter((item) => {
      const section = item.section?.toLowerCase() ?? "";
      return (
        item.label.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query) ||
        section.includes(query)
      );
    });
  }, [allPages, allPagesQuery]);

  const groupedPageResults = useMemo(() => {
    return allPagesFiltered.reduce<Record<string, NavItem[]>>((acc, item) => {
      const key = item.section || "Other";
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [allPagesFiltered]);

  function toggleSection(section: string): void {
    setActiveSectionId((prev) => (prev === section ? null : section));
  }

  function closeSection(): void {
    setActiveSectionId(null);
  }

  // Notify parent after activeSectionId is committed — never during render
  useEffect(() => {
    onActiveSectionChange?.(activeSectionId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSectionId]);

  function openAllPages(): void {
    lastFocusedElementRef.current = document.activeElement as HTMLElement | null;
    setShowAllPages(true);
  }

  function closeAllPages(): void {
    setShowAllPages(false);
    setAllPagesQuery("");
  }

  // Close flyout on outside click or Esc
  useEffect(() => {
    if (!activeSectionId) return;
    function onPointerDown(e: PointerEvent): void {
      if (
        flyoutRef.current && !flyoutRef.current.contains(e.target as Node) &&
        railRef.current && !railRef.current.contains(e.target as Node)
      ) {
        closeSection();
      }
    }
    function onKeyDown(e: KeyboardEvent): void {
      if (e.key === "Escape") closeSection();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [activeSectionId]);

  // Close flyout when mobile drawer opens
  useEffect(() => {
    if (mobileOpen) closeSection();
  }, [mobileOpen]);

  // ⌘K toggle
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (showAllPages) closeAllPages();
        else openAllPages();
      }
    }
    function onOpenAllPagesEvent(): void {
      if (!showAllPages) openAllPages();
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("client:open-app-grid", onOpenAllPagesEvent as EventListener);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("client:open-app-grid", onOpenAllPagesEvent as EventListener);
    };
  }, [showAllPages]);

  // All-pages popup focus trap
  useEffect(() => {
    if (!showAllPages) return;
    document.body.style.overflow = "hidden";
    allPagesInputRef.current?.focus();

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        event.preventDefault();
        closeAllPages();
        return;
      }
      if (event.key === "Enter") {
        const first = allPagesFiltered[0];
        if (first) {
          event.preventDefault();
          onNavigate(first.id);
          closeAllPages();
        }
        return;
      }
      if (event.key !== "Tab" || !popupPanelRef.current) return;
      const focusable = popupPanelRef.current.querySelectorAll<HTMLElement>(
        'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      lastFocusedElementRef.current?.focus();
    };
  }, [allPagesFiltered, onNavigate, showAllPages]);

  // Active pages for the open flyout section
  const flyoutPages = activeSectionId
    ? (navSections.find(([s]) => s === activeSectionId)?.[1] ?? [])
    : [];

  return (
    <aside className={`${styles.sidebar} ${styles.cSidebar} ${mobileOpen ? styles.sidebarMobileOpen : ""}`}>

      {/* ── Logo ──────────────────────────────────────────────────── */}
      <div className={styles.sidebarLogo}>
        <div
          className={styles.logoMark}
          role="button"
          tabIndex={0}
          onClick={() => closeSection()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); closeSection(); }
          }}
          title="Maphari"
        >
          M
        </div>
        <div className={styles.logoTextBlock}>
          <div className={styles.logoText}>
            Maph<span>a</span>ri
          </div>
          <div className={styles.portalChip}>Client</div>
        </div>
      </div>

      {/* ── Project switcher ────────────────────────────────────────── */}
      {projects && projects.length > 0 ? (
        <div className={styles.projectSwitcherWrap}>
          <label className={styles.projectSwitcherLabel}>Project</label>
          <select
            title="Switch project"
            className={styles.projectSwitcher}
            value={projects.find((p) => p.name === activeProjectName)?.id ?? ""}
            onChange={(event) => onProjectChange?.(event.target.value)}
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {/* ── Rail (one icon per section) ────────────────────────────── */}
      <nav ref={railRef} className={styles.cRail} aria-label="Section navigation">
        {navSections.map(([section, items]) => {
          const hasNotif = items.some((i) => i.badge);
          const isOpen = activeSectionId === section;
          const isCurrent = activeSection === section;
          return (
            <button
              key={section}
              type="button"
              className={`${styles.cRailBtn} ${(isOpen || isCurrent) ? styles.cRailBtnActive : ""} ${isCurrent && !isOpen ? styles.cRailBtnCurrent : ""}`}
              onClick={() => toggleSection(section)}
              title={section}
              aria-pressed={isOpen}
            >
              {SECTION_ICONS[section] ?? <DefaultSectionIcon />}
              {hasNotif && <span className={styles.cRailNotifDot} aria-hidden="true" />}
            </button>
          );
        })}
      </nav>

      {/* ── Flyout (pages within active section) ──────────────────── */}
      <div
        ref={flyoutRef}
        className={`${styles.cFlyout} ${!activeSectionId ? styles.cFlyoutHidden : ""}`}
        aria-hidden={!activeSectionId}
      >
        {activeSectionId ? (
          <>
            <div className={styles.cFlyoutSectionName}>{activeSectionId}</div>
            <div className={styles.cFlyoutPages}>
              {flyoutPages.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.cFlyoutPageBtn} ${activePage === item.id ? styles.cFlyoutPageBtnActive : ""}`}
                  onClick={() => {
                    onNavigate(item.id);
                    closeSection();
                  }}
                >
                  <span>{item.label}</span>
                  {item.badge ? (
                    <span className={styles.cFlyoutBadge}>{item.badge.value}</span>
                  ) : null}
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>

      {/* ── All Pages popup ─────────────────────────────────────────── */}
      {showAllPages ? createPortal(
        <div className={`${styles.clientRoot} ${styles.navPopupBackdrop}`} onClick={closeAllPages}>
          <div
            ref={popupPanelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="client-app-grid-title"
            aria-describedby="client-app-grid-desc"
            className={styles.navPopupPanel}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.navPopupHeader}>
              <div>
                <div id="client-app-grid-title" className={styles.navPopupTitle}>All Pages</div>
                <div id="client-app-grid-desc" className={styles.navPopupSubtitle}>
                  Use search and section grouping to jump quickly across client pages.
                </div>
              </div>
              <button
                type="button"
                className={styles.navPopupClose}
                onClick={closeAllPages}
                aria-label="Close all pages dialog"
              >
                Close <span className={styles.navPopupCloseKbd}>Esc</span>
              </button>
            </div>

            <div className={styles.navPopupSearchRow}>
              <div className={styles.navPopupSearchWrap}>
                <svg
                  className={styles.navSearchIcon}
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  ref={allPagesInputRef}
                  type="text"
                  value={allPagesQuery}
                  onChange={(event) => setAllPagesQuery(event.target.value)}
                  placeholder="Search pages by name or section…"
                  className={styles.navPopupSearch}
                />
              </div>
              <button
                type="button"
                className={styles.navPopupClear}
                onClick={() => {
                  setAllPagesQuery("");
                  allPagesInputRef.current?.focus();
                }}
                disabled={!allPagesQuery}
              >
                Clear
              </button>
            </div>

            <div className={styles.navPopupMeta}>
              <span>
                {allPagesFiltered.length}
                {allPagesQuery ? ` of ${allPages.length}` : ""} pages
              </span>
              <span className={styles.navPopupMetaHints}>
                <span className={styles.navKbd}>⌘K</span> toggle
                <span className={styles.navKbd}>↵</span> open first
                <span className={styles.navKbd}>Esc</span> close
              </span>
            </div>

            {allPagesFiltered.length === 0 ? (
              <div className={styles.navPopupEmpty}>
                No pages match your search. Try a broader term.
              </div>
            ) : (
              <div className={styles.navPopupSections}>
                {Object.entries(groupedPageResults).map(([section, items]) => (
                  <section key={section} className={styles.navPopupSection}>
                    <div className={styles.navPopupSectionHeader}>
                      <div className={styles.navPopupSectionTitle}>{section}</div>
                      <div className={styles.navPopupSectionCount}>{items.length} pages</div>
                    </div>
                    <div className={styles.navPageGrid}>
                      {items.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className={`${styles.navPageTile} ${activePage === item.id ? styles.navPageTileActive : ""}`}
                          onClick={() => {
                            onNavigate(item.id);
                            closeAllPages();
                          }}
                        >
                          <span className={styles.navPageTileIcon}>
                            <NavIcon id={item.id} className={styles.navIcon} />
                          </span>
                          <div>
                            <div className={styles.navPageTileLabel}>{item.label}</div>
                            <div className={styles.navPageTileMeta}>{item.section ?? item.id}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body,
      ) : null}

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <div className={styles.sidebarFooter}>
        {/* User card */}
        <div
          className={styles.userCard}
          role="button"
          tabIndex={0}
          onClick={() => onNavigate("profile")}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onNavigate("profile");
            }
          }}
        >
          <div className={styles.userAvatar}>{clientInitials}</div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{clientName}</div>
            <div className={styles.userRole}>{companyName}</div>
          </div>
          <svg
            width="11"
            height="11"
            viewBox="0 0 12 12"
            fill="none"
            className={styles.navChevron}
            aria-hidden="true"
          >
            <path d="M5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </aside>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { NavIcon } from "./ui";
import { cx, styles } from "./style";
import type { NavItem, PageId } from "./types";
import { capitalize } from "./utils";

type ClientSidebarProps = {
  navSections: Array<[string, NavItem[]]>;
  allPagesSections?: Array<[string, NavItem[]]>;
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  clientName: string;
  companyName: string;
  clientInitials: string;
  activeProjectName?: string;
  projects?: Array<{ id: string; name: string }>;
  onProjectChange?: (projectId: string) => void;
};

export function ClientSidebar({
  navSections,
  allPagesSections,
  activePage,
  onNavigate,
  clientName,
  companyName,
  clientInitials,
  activeProjectName,
  projects,
  onProjectChange,
}: ClientSidebarProps) {
  const navLinkTextStyle = {
    fontSize: "var(--text-aside-link, 0.82rem)",
    lineHeight: 1.2,
    fontFamily: "var(--font-syne), sans-serif",
    fontWeight: 600,
  } as const;

  const [showAllPages, setShowAllPages] = useState(false);
  const [allPagesQuery, setAllPagesQuery] = useState("");
  const popupPanelRef = useRef<HTMLDivElement | null>(null);
  const allPagesInputRef = useRef<HTMLInputElement | null>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);

  const allPages = useMemo(() => (allPagesSections ?? navSections).flatMap(([, items]) => items), [allPagesSections, navSections]);
  const allPagesFiltered = useMemo(() => {
    const query = allPagesQuery.trim().toLowerCase();
    if (!query) return allPages;
    return allPages.filter((item) => {
      const section = item.section?.toLowerCase() ?? "";
      return item.label.toLowerCase().includes(query) || item.id.toLowerCase().includes(query) || section.includes(query);
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

  function openAllPages(): void {
    lastFocusedElementRef.current = document.activeElement as HTMLElement | null;
    setShowAllPages(true);
  }

  function closeAllPages(): void {
    setShowAllPages(false);
    setAllPagesQuery("");
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (showAllPages) closeAllPages();
        else openAllPages();
      }
    }

    function onOpenAllPages(): void {
      if (!showAllPages) openAllPages();
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("client:open-app-grid", onOpenAllPages as EventListener);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("client:open-app-grid", onOpenAllPages as EventListener);
    };
  }, [showAllPages]);

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
      const focusable = popupPanelRef.current.querySelectorAll<HTMLElement>('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');
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

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarLogo}>
        <div className={styles.logoMark}>M</div>
        <div className={styles.logoTextBlock}>
          <div className={styles.logoText}>
            Maph<span>a</span>ri
          </div>
          <div className={styles.portalChip}>Client</div>
        </div>
      </div>

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

      <nav className={styles.sidebarNav}>
        {navSections.map(([section, items]) => (
          <div key={section}>
            <div className={styles.navSection}>{section}</div>
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`${styles.navItem} ${activePage === item.id ? styles.navItemActive : ""}`}
                style={navLinkTextStyle}
                onClick={() => onNavigate(item.id)}
              >
                <NavIcon id={item.id} className={styles.navIcon} />
                {item.label}
                {item.badge ? (
                  <span className={cx("navBadge", `navBadge${capitalize(item.badge.tone)}`)}>
                    {item.badge.value}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {showAllPages ? (
        <div className={styles.navPopupBackdrop} onClick={closeAllPages}>
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
                <div id="client-app-grid-desc" className={styles.navPopupSubtitle}>Use search and section grouping to jump quickly across client pages.</div>
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
              <span>{allPagesFiltered.length} pages</span>
              <span>Enter to open first match</span>
            </div>

            {allPagesFiltered.length === 0 ? (
              <div className={styles.navPopupEmpty}>No pages match your search. Try a broader term.</div>
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

      <div className={styles.sidebarFooter}>
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
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" className={styles.navChevron}>
            <path d="M5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </aside>
  );
}

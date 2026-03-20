"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
// NavIcon import removed — sidebar is rebuilt in Task 1.4
import { cx, styles } from "./style";
import type { NavItem, PageId } from "./types";
import { capitalize } from "./utils";

type StaffSidebarProps = {
  navSections: Array<[string, NavItem[]]>;
  allPagesSections?: Array<[string, NavItem[]]>;
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  staffInitials: string;
  staffName: string;
  staffRole: string;
  mobileOpen?: boolean;
  quickActionProjects?: Array<{ id: string; name: string }>;
  onQuickLogTime?: (projectId: string, minutes: number, label: string) => Promise<void>;
  onQuickAddTask?: () => void;
};

export function StaffSidebar({
  navSections,
  allPagesSections,
  activePage,
  onNavigate,
  staffInitials,
  staffName,
  staffRole,
  mobileOpen = false,
  quickActionProjects = [],
  onQuickLogTime,
  onQuickAddTask,
}: StaffSidebarProps) {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("staff-sidebar-collapsed") === "1";
  });

  const [showAllPages, setShowAllPages] = useState(false);
  const [allPagesQuery, setAllPagesQuery] = useState("");
  const popupPanelRef = useRef<HTMLDivElement | null>(null);
  const allPagesInputRef = useRef<HTMLInputElement | null>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);

  // ── Quick Actions: Log Time mini form ──────────────────────────
  const [showLogTimeForm, setShowLogTimeForm] = useState(false);
  const [logTimeProjectId, setLogTimeProjectId] = useState("");
  const [logTimeMinutes, setLogTimeMinutes] = useState("");
  const [logTimeLabel, setLogTimeLabel] = useState("");
  const [loggingTime, setLoggingTime] = useState(false);

  async function handleQuickLogTime() {
    if (!onQuickLogTime || !logTimeProjectId || !logTimeMinutes) return;
    const mins = parseInt(logTimeMinutes, 10);
    if (!mins || mins <= 0) return;
    setLoggingTime(true);
    await onQuickLogTime(logTimeProjectId, mins, logTimeLabel || "Quick log");
    setLoggingTime(false);
    setLogTimeMinutes("");
    setLogTimeLabel("");
    setShowLogTimeForm(false);
    closeAllPages();
  }

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

  function toggleCollapsed(): void {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("staff-sidebar-collapsed", next ? "1" : "0");
      return next;
    });
  }

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
    window.addEventListener("staff:open-app-grid", onOpenAllPages as EventListener);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("staff:open-app-grid", onOpenAllPages as EventListener);
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

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""} ${mobileOpen ? styles.sidebarMobileOpen : ""}`}>

      {/* ── Logo ──────────────────────────────────────────────────── */}
      <div className={styles.sidebarLogo}>
        <div
          className={`${styles.logoMark} ${styles.pointerCursor}`}
          role="button"
          tabIndex={0}
          onClick={toggleCollapsed}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleCollapsed(); }
          }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          M
        </div>
        <div className={styles.logoTextBlock}>
          <div className={styles.logoText}>
            Maph<span>a</span>ri
          </div>
          <div className={styles.staffChip}>Staff</div>
        </div>
      </div>

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav className={styles.sidebarNav}>
        {navSections.map(([section, items]) => (
          <div key={section}>
            <div className={styles.navSection}>{section}</div>
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`${styles.navItem} ${activePage === item.id ? styles.navItemActive : ""}`}
                onClick={() => onNavigate(item.id)}
                title={collapsed ? item.label : undefined}
              >
                <span className={styles.navIcon} aria-hidden />
                <span className={styles.navLabel}>{item.label}</span>
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

      {/* ── All Pages popup ─────────────────────────────────────────── */}
      {showAllPages ? createPortal(
        <div className={`${styles.staffRoot} ${styles.navPopupBackdrop}`} onClick={closeAllPages}>
          <div
            ref={popupPanelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="staff-app-grid-title"
            aria-describedby="staff-app-grid-desc"
            className={styles.navPopupPanel}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.navPopupHeader}>
              <div>
                <div id="staff-app-grid-title" className={styles.navPopupTitle}>All Pages</div>
                <div id="staff-app-grid-desc" className={styles.navPopupSubtitle}>
                  Use search and section grouping to jump quickly across staff pages.
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

            {/* ── Quick Actions strip ─────────────────────────────────── */}
            {(onQuickAddTask || onQuickLogTime) && (
              <div className={styles.navQuickActions}>
                <div className={styles.navQuickActionsLabel}>Quick actions</div>
                <div className={styles.navQuickActionsList}>
                  {onQuickAddTask && (
                    <button
                      type="button"
                      className={styles.navQuickActionBtn}
                      onClick={() => {
                        onQuickAddTask();
                        closeAllPages();
                      }}
                    >
                      <span className={styles.navQuickActionIcon}>+</span>
                      Add Task
                    </button>
                  )}
                  {onQuickLogTime && (
                    <button
                      type="button"
                      className={`${styles.navQuickActionBtn} ${showLogTimeForm ? styles.navQuickActionBtnActive : ""}`}
                      onClick={() => setShowLogTimeForm((v) => !v)}
                    >
                      <span className={styles.navQuickActionIcon}>⏱</span>
                      Log Time
                    </button>
                  )}
                </div>
                {showLogTimeForm && onQuickLogTime && (
                  <div className={styles.navLogTimeForm}>
                    <select
                      className={styles.navLogTimeSelect}
                      value={logTimeProjectId}
                      onChange={(e) => setLogTimeProjectId(e.target.value)}
                      aria-label="Select project to log time"
                    >
                      <option value="">Select project…</option>
                      {quickActionProjects.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <div className={styles.navLogTimeRow}>
                      <input
                        type="number"
                        min="1"
                        max="480"
                        className={styles.navLogTimeInput}
                        value={logTimeMinutes}
                        onChange={(e) => setLogTimeMinutes(e.target.value)}
                        placeholder="Minutes"
                        aria-label="Minutes to log"
                      />
                      <input
                        type="text"
                        className={styles.navLogTimeLabelInput}
                        value={logTimeLabel}
                        onChange={(e) => setLogTimeLabel(e.target.value)}
                        placeholder="Task label (optional)"
                        aria-label="Task label"
                        onKeyDown={(e) => { if (e.key === "Enter") void handleQuickLogTime(); }}
                      />
                      <button
                        type="button"
                        className={styles.navLogTimeSubmit}
                        onClick={() => void handleQuickLogTime()}
                        disabled={loggingTime || !logTimeProjectId || !logTimeMinutes}
                      >
                        {loggingTime ? "…" : "Log"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

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
                            <span className={styles.navIcon} aria-hidden />
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
        {/* Status + plan row */}
        <div className={styles.sidebarStatusRow}>
          <span className={styles.sidebarStatusDot} />
          <span className={styles.sidebarStatusLabel}>Online</span>
          <span className={styles.sidebarPlanBadge}>Staff</span>
        </div>

        {/* User card */}
        <div
          className={styles.userCard}
          role="button"
          tabIndex={0}
          onClick={() => onNavigate("settings")}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onNavigate("settings");
            }
          }}
          title={collapsed ? `${staffName} · ${staffRole}` : undefined}
        >
          <div className={styles.userAvatar}>{staffInitials}</div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{staffName}</div>
            <div className={styles.userRole}>{staffRole}</div>
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

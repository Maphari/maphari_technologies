"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { styles } from "./style";
import type { NavItem, PageId } from "./config";
import { NavIcon } from "./nav-icon";

export function AdminSidebar({
  grouped,
  allItems,
  page,
  pinnedPages,
  recentPages,
  navBadgeCounts,
  email,
  onPageChange,
}: {
  grouped: Record<string, NavItem[]>;
  allItems: NavItem[];
  page: PageId;
  pinnedPages: PageId[];
  recentPages: PageId[];
  navBadgeCounts: Partial<Record<PageId, number>>;
  email: string;
  onPageChange: (page: PageId) => void;
}) {
  const primaryIds: PageId[] = [
    "dashboard",
    "leads",
    "clients",
    "projects",
    "invoices",
    "staff",
    "automation",
    "reports",
    "audit",
    "settings",
  ];
  const [showAllPages, setShowAllPages] = useState(false);
  const [allPagesQuery, setAllPagesQuery] = useState("");
  const allPagesInputRef = useRef<HTMLInputElement | null>(null);
  const popupPanelRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);

  const primaryItems = useMemo(
    () =>
      primaryIds
        .map((id) => allItems.find((item) => item.id === id))
        .filter((item): item is NavItem => Boolean(item)),
    [allItems],
  );

  const pinnedItems = useMemo(
    () =>
      pinnedPages
        .map((id) => allItems.find((item) => item.id === id))
        .filter((item): item is NavItem => Boolean(item)),
    [allItems, pinnedPages],
  );

  const recentItems = useMemo(
    () =>
      recentPages
        .map((id) => allItems.find((item) => item.id === id))
        .filter((item): item is NavItem => Boolean(item)),
    [allItems, recentPages],
  );

  const allPagesFiltered = useMemo(() => {
    const query = allPagesQuery.trim().toLowerCase();
    const sectionOrder = Object.keys(grouped);
    const scoped = !query
      ? allItems
      : allItems.filter((item) =>
          `${item.label} ${item.id} ${item.section}`
            .toLowerCase()
            .includes(query),
        );
    return [...scoped].sort((a, b) => {
      const aSection = sectionOrder.indexOf(a.section);
      const bSection = sectionOrder.indexOf(b.section);
      if (aSection !== bSection) return aSection - bSection;
      return a.label.localeCompare(b.label);
    });
  }, [allItems, allPagesQuery, grouped]);

  const groupedPageResults = useMemo(() => {
    return allPagesFiltered.reduce<Record<string, NavItem[]>>((acc, item) => {
      if (!acc[item.section]) acc[item.section] = [];
      acc[item.section].push(item);
      return acc;
    }, {});
  }, [allPagesFiltered]);

  function openAllPages(): void {
    setShowAllPages(true);
    setTimeout(() => allPagesInputRef.current?.focus(), 0);
  }

  function closeAllPages(): void {
    setShowAllPages(false);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openAllPages();
      }
      if (event.key === "Escape") {
        closeAllPages();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    function onOpenAppGrid(): void {
      openAllPages();
    }
    function onCloseAppGrid(): void {
      closeAllPages();
    }
    window.addEventListener(
      "admin:open-app-grid",
      onOpenAppGrid as EventListener,
    );
    window.addEventListener(
      "admin:close-app-grid",
      onCloseAppGrid as EventListener,
    );
    return () => {
      window.removeEventListener(
        "admin:open-app-grid",
        onOpenAppGrid as EventListener,
      );
      window.removeEventListener(
        "admin:close-app-grid",
        onCloseAppGrid as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    if (!showAllPages) return;
    lastFocusedElementRef.current =
      document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key !== "Tab") return;
      const panel = popupPanelRef.current;
      if (!panel) return;
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute("disabled"));
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
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
  }, [showAllPages]);

  function renderNavItem(item: NavItem) {
    return (
      <button
        key={item.id}
        type="button"
        className={`${styles.navItem} ${page === item.id ? styles.navItemActive : ""}`}
        onClick={() => onPageChange(item.id)}
      >
        <NavIcon id={item.id} className={styles.navIcon} />
        <span>{item.label}</span>
        {typeof navBadgeCounts[item.id] === "number" &&
        (navBadgeCounts[item.id] ?? 0) > 0 ? (
          <span
            className={`${styles.navBadge} ${item.badgeRed ? styles.navBadgeRed : ""}`}
          >
            {navBadgeCounts[item.id]}
          </span>
        ) : null}
      </button>
    );
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarLogo}>
        <div className={styles.logoMark}>M</div>
        <div className={styles.logoTextBlock}>
          <div className={styles.logoText}>
            Maph<span>a</span>ri
          </div>
          <div className={styles.adminChip}>Admin</div>
        </div>
      </div>

      <nav className={styles.sidebarNav}>
        <div>
          <div className={styles.navSectionLabel}>Primary</div>
          {primaryItems.map((item) => renderNavItem(item))}
        </div>

        {pinnedItems.length > 0 ? (
          <div>
            <div className={styles.navSectionLabel}>Pinned</div>
            {pinnedItems.map((item) => renderNavItem(item))}
          </div>
        ) : null}

        {recentItems.length > 0 ? (
          <div>
            <div className={styles.navSectionLabel}>Recent</div>
            {recentItems.map((item) => renderNavItem(item))}
          </div>
        ) : null}

        <div className={styles.navSectionActions}>
          <button
            type="button"
            className={styles.navActionBtn}
            onClick={() => (showAllPages ? closeAllPages() : openAllPages())}
          >
            {showAllPages ? "Close app grid" : "Open app grid"}{" "}
            <span className={styles.navActionHint}>⌘/Ctrl+K</span>
          </button>
        </div>
      </nav>

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
                <div id="admin-app-grid-title" className={styles.navPopupTitle}>
                  All Pages
                </div>
                <div
                  id="admin-app-grid-desc"
                  className={styles.navPopupSubtitle}
                >
                  Use search and section grouping to jump directly to any admin
                  page. Press Esc to close.
                </div>
              </div>
              <button
                type="button"
                className={styles.navPopupClose}
                onClick={closeAllPages}
                aria-label="Close all pages dialog"
              >
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
              <span>
                {allPagesFiltered.length} pages ·{" "}
                {Object.keys(groupedPageResults).length} sections
              </span>
              <span>Enter to open</span>
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
                      <div className={styles.navPopupSectionTitle}>
                        {section}
                      </div>
                      <div className={styles.navPopupSectionCount}>
                        {items.length}
                      </div>
                    </div>
                    <div className={styles.navPageGrid}>
                      {items.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className={`${styles.navPageTile} ${page === item.id ? styles.navPageTileActive : ""}`}
                          onClick={() => {
                            onPageChange(item.id);
                            closeAllPages();
                          }}
                        >
                          <span className={styles.navPageTileIcon}>
                            <NavIcon id={item.id} className={styles.navIcon} />
                          </span>
                          <div>
                            <div className={styles.navPageTileLabel}>
                              {item.label}
                            </div>
                            <div className={styles.navPageTileMeta}>
                              {item.id}
                            </div>
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
        <div className={styles.userCard}>
          <div className={`${styles.userAvatar} ${styles.userAvatarAdmin}`}>
            {email[0]?.toUpperCase() ?? "A"}
          </div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{email}</div>
            <div className={styles.userRole}>Admin · Maphari</div>
          </div>
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            className={styles.navChevronIcon}
          >
            <path
              d="M6 12l4-4-4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </aside>
  );
}

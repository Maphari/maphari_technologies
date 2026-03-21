"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { styles } from "./style";
import type { NavItem, PageId } from "./config";
import { NavIcon } from "./nav-icon";

export function AdminSidebar({
  grouped,
  allItems,
  page,
  pinnedPages: _pinnedPages,
  recentPages: _recentPages,
  navBadgeCounts,
  email,
  onPageChange,
  mobileOpen = false,
  onFlyoutChange,
}: {
  grouped: Record<string, NavItem[]>;
  allItems: NavItem[];
  page: PageId;
  pinnedPages: PageId[];
  recentPages: PageId[];
  navBadgeCounts: Partial<Record<PageId, number>>;
  email: string;
  onPageChange: (page: PageId) => void;
  mobileOpen?: boolean;
  onFlyoutChange?: (open: boolean) => void;
}) {
  const sidebarLabel: Partial<Record<PageId, string>> = {
    dashboard: "BizDev",
    executive: "Executive",
    experience: "Journey",
    bookingAppointments: "Bookings",
    sprintBoardAdmin: "Sprint Board",
    gantt: "Gantt",
    comms: "Comms Audit",
    interventions: "Health",
    loyaltyCredits: "Loyalty",
    revenueForecasting: "Forecasting",
    profitability: "Client Profit",
    projectProfitability: "Proj Profit",
    cashflow: "Cash Flow",
    fyCloseout: "FY Closeout",
    announcementsManager: "Announcements",
    staff: "Staff",
    staffOnboarding: "Staff Onboard",
    leaveAbsence: "Leave",
    recruitment: "Recruiting",
    learningDev: "Learning",
    contentApproval: "Content",
    meetingArchive: "Archive",
    staffSatisfaction: "Staff NPS",
    employmentRecords: "Records",
    owner: "Workspace",
    team: "Team",
    market: "Market",
    healthScorecard: "Health Score",
    performance: "Performance",
    teamPerformanceReport: "Team Perf",
    portfolioRiskRegister: "Risk Reg.",
    crisis: "Crisis",
    access: "Access",
    audit: "Audit Log",
    knowledgeBaseAdmin: "Knowledge",
    decisionRegistry: "Decisions",
    handoverManagement: "Handovers",
    closeoutReview: "Closeout",
    staffTransitionPlanner: "Transitions",
    serviceCatalogManager: "Catalog",
    requestInbox: "Req. Inbox",
    changeRequestManager: "Changes",
    supportQueue: "Support",
    lifecycleDashboard: "Lifecycle",
    stakeholderDirectory: "Stakeholders",
    aiActionRecommendations: "AI Rec.",
    updateQueueManager: "Updates",
    standupFeed: "Standup",
    eodDigest: "EOD",
    peerReviewQueue: "Peer Review",
    automationAuditTrail: "Auto Audit",
    projectBriefing: "Briefing",
    activeHealthMonitor: "Health Mon.",
    designReviewAdmin: "Design Rev.",
    onboarding: "Onboarding",
    offboarding: "Offboarding",
    satisfaction: "Satisfaction",
    vault: "Vault",
    intelligence: "Intel",
  };

  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [flyoutOpen, setFlyoutOpen] = useState(false);

  const sectionList = useMemo(() => Object.keys(grouped), [grouped]);

  const sectionIcon: Record<string, React.ReactNode> = {
    Operations: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.9"/>
        <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.9"/>
        <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.9"/>
        <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.9"/>
      </svg>
    ),
    Experience: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 13.5C8 13.5 2 9.8 2 5.5a3 3 0 0 1 6-0.5 3 3 0 0 1 6 0.5C14 9.8 8 13.5 8 13.5Z" fill="currentColor" opacity="0.9"/>
      </svg>
    ),
    Finance: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="1" y="9" width="3" height="5" rx="1" fill="currentColor" opacity="0.9"/>
        <rect x="6" y="6" width="3" height="8" rx="1" fill="currentColor" opacity="0.9"/>
        <rect x="11" y="2" width="3" height="12" rx="1" fill="currentColor" opacity="0.9"/>
      </svg>
    ),
    Communication: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M2 3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H5l-3 2V3Z" fill="currentColor" opacity="0.9"/>
      </svg>
    ),
    Governance: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 1.5L2 4v4c0 3.3 2.7 5.8 6 6.5C11.3 13.8 14 11.3 14 8V4L8 1.5Z" fill="currentColor" opacity="0.9"/>
      </svg>
    ),
    Knowledge: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M3 2h7.5L13 4.5V14H3V2Z" fill="currentColor" opacity="0.25"/>
        <path d="M3 2h7.5L13 4.5V14H3V2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
        <line x1="5.5" y1="6.5" x2="10.5" y2="6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        <line x1="5.5" y1="9" x2="9" y2="9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
    Lifecycle: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 2a6 6 0 1 1-4.24 1.76" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M3 2l.76 2.76L6.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    "AI/ML": (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="2" fill="currentColor"/>
        <circle cx="8" cy="2" r="1.2" fill="currentColor" opacity="0.7"/>
        <circle cx="8" cy="14" r="1.2" fill="currentColor" opacity="0.7"/>
        <circle cx="2" cy="8" r="1.2" fill="currentColor" opacity="0.7"/>
        <circle cx="14" cy="8" r="1.2" fill="currentColor" opacity="0.7"/>
        <line x1="8" y1="3.2" x2="8" y2="6" stroke="currentColor" strokeWidth="1.1"/>
        <line x1="8" y1="10" x2="8" y2="12.8" stroke="currentColor" strokeWidth="1.1"/>
        <line x1="3.2" y1="8" x2="6" y2="8" stroke="currentColor" strokeWidth="1.1"/>
        <line x1="10" y1="8" x2="12.8" y2="8" stroke="currentColor" strokeWidth="1.1"/>
      </svg>
    ),
    Automation: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M9.5 1.5L4 8.5h4L6.5 14.5L13 7H9L9.5 1.5Z" fill="currentColor" opacity="0.9"/>
      </svg>
    ),
  };

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

  function handlePageSelect(id: PageId): void {
    onPageChange(id);
    closeFlyout();
  }

  const [showAllPages, setShowAllPages] = useState(false);
  const [allPagesQuery, setAllPagesQuery] = useState("");
  const allPagesInputRef = useRef<HTMLInputElement | null>(null);
  const popupPanelRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);

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
        {sectionList.map((section) => (
          <button
            key={section}
            type="button"
            className={`${styles.railSectionIcon}${activeSectionId === section && flyoutOpen ? ` ${styles.railSectionActive}` : ""}`}
            onClick={() => handleSectionClick(section)}
            aria-label={`Open ${section} navigation`}
            aria-expanded={activeSectionId === section && flyoutOpen}
          >
            {sectionIcon[section] ?? <span style={{fontSize: 9, fontWeight: 700}}>{section.slice(0, 2)}</span>}
            <span className={styles.railTooltip} aria-hidden="true">{section}</span>
          </button>
        ))}

        {/* Footer */}
        <div className={styles.railFooter}>
          <button
            type="button"
            className={styles.railSectionIcon}
            onClick={openAllPages}
            aria-label="Browse all pages"
            title="All pages"
          >
            ⊞
          </button>
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
                <span className={styles.flyoutItemLabel}>
                  {sidebarLabel[item.id] ?? item.label}
                </span>
                {typeof navBadgeCounts[item.id] === "number" &&
                (navBadgeCounts[item.id] ?? 0) > 0 ? (
                  <span
                    className={`${styles.flyoutBadge}${item.badgeRed ? ` ${styles.flyoutBadgeRed}` : ""}`}
                  >
                    {navBadgeCounts[item.id]}
                  </span>
                ) : null}
              </button>
            ))}
          </>
        ) : null}
      </div>

      {/* All Pages modal — preserved from original */}
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
}

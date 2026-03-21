"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
            {sectionAbbrev[section] ?? section.slice(0, 2)}
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
                <span className={styles.flyoutDot} aria-hidden="true" />
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

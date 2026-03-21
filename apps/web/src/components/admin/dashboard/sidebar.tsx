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
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <rect x="2" y="2" width="9" height="9" rx="2"/>
        <rect x="13" y="2" width="9" height="9" rx="2"/>
        <rect x="2" y="13" width="9" height="9" rx="2"/>
        <rect x="13" y="13" width="9" height="9" rx="2"/>
      </svg>
    ),
    Experience: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 21C12 21 3 15 3 8.5a4.5 4.5 0 0 1 9-0.5 4.5 4.5 0 0 1 9 0.5C21 15 12 21 12 21Z"/>
      </svg>
    ),
    Finance: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <rect x="2" y="14" width="5" height="8" rx="1.5"/>
        <rect x="9.5" y="9" width="5" height="13" rx="1.5"/>
        <rect x="17" y="3" width="5" height="19" rx="1.5"/>
      </svg>
    ),
    Communication: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7l-4 3V5Z"/>
      </svg>
    ),
    Governance: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2L3 6v6c0 5 3.9 9.3 9 10.9C17.1 21.3 21 17 21 12V6L12 2Z"/>
      </svg>
    ),
    Knowledge: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 3h11l5 5v13H4V3Z" fill="currentColor" opacity="0.3"/>
        <path d="M4 3h11l5 5v13H4V3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        <line x1="8" y1="10" x2="16" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="8" y1="14" x2="13" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    Lifecycle: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3a9 9 0 1 1-6.36 2.64" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M4 3l1 4 4-1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    "AI/ML": (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <circle cx="12" cy="12" r="3"/>
        <circle cx="12" cy="3" r="2" opacity="0.7"/>
        <circle cx="12" cy="21" r="2" opacity="0.7"/>
        <circle cx="3" cy="12" r="2" opacity="0.7"/>
        <circle cx="21" cy="12" r="2" opacity="0.7"/>
        <rect x="11" y="5" width="2" height="4"/>
        <rect x="11" y="15" width="2" height="4"/>
        <rect x="5" y="11" width="4" height="2"/>
        <rect x="15" y="11" width="4" height="2"/>
      </svg>
    ),
    Automation: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M14 2L6 13h6L8 22 19 11h-6L14 2Z"/>
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
            style={{ all: "unset", display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", cursor: "pointer", borderRadius: "8px", position: "relative", flexShrink: 0, color: "rgba(255,255,255,0.65)" } as React.CSSProperties}
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
                style={{ all: "unset", display: "flex", alignItems: "center", gap: "8px", width: "100%", cursor: "pointer" } as React.CSSProperties}
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

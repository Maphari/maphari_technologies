"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { cx } from "./style";
import { NavIcon } from "./nav-icon";
import type { PageId, NavItem } from "./types";

interface SidebarProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  navSections: [string, NavItem[]][];
  notificationCounts?: Record<string, number>;
  userInitials?: string;
  onMobileClose?: () => void;
  mobileOpen?: boolean;
}

// Semantic SVG icons mapped to each section name — stroke-based, familiar shapes
const S = (path: React.ReactNode, key: string) => (
  <svg key={key} width="16" height="16" viewBox="0 0 16 16" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    {path}
  </svg>
);

const SECTION_ICON_MAP: Record<string, React.ReactNode> = {
  // Workspace — grid of 4 squares (dashboard)
  "Workspace": S(<><rect x="1.5" y="1.5" width="5" height="5" rx="1"/><rect x="9.5" y="1.5" width="5" height="5" rx="1"/><rect x="1.5" y="9.5" width="5" height="5" rx="1"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/></>, "workspace"),
  // Client Work — speech bubble (communication)
  "Client Work": S(<path d="M14 2H2a1 1 0 00-1 1v8a1 1 0 001 1h3l3 3 3-3h3a1 1 0 001-1V3a1 1 0 00-1-1z"/>, "client-work"),
  // Tracking — clock (time)
  "Tracking": S(<><circle cx="8" cy="8" r="6"/><path d="M8 4.5V8l2.5 1.5"/></>, "tracking"),
  // Workflow — checkbox with check (approvals)
  "Workflow": S(<><rect x="2" y="2" width="12" height="12" rx="1.5"/><path d="M5.5 8l2 2 3-3"/></>, "workflow"),
  // Project Management — briefcase
  "Project Management": S(<><rect x="1" y="5" width="14" height="9" rx="1.5"/><path d="M5.5 5V3.5A1.5 1.5 0 017 2h2a1.5 1.5 0 011.5 1.5V5"/><line x1="1" y1="9" x2="15" y2="9"/></>, "project-mgmt"),
  // Client Lifecycle — user with arrow (onboarding/offboarding)
  "Client Lifecycle": S(<><circle cx="6" cy="5" r="2.5"/><path d="M1 14c0-3 2.2-5 5-5"/><path d="M11 10l3 2-3 2M14 12h-4"/></>, "client-lifecycle"),
  // Governance — shield (oversight)
  "Governance": S(<path d="M8 1.5L2 4v4.5c0 3.2 2.5 5.8 6 7 3.5-1.2 6-3.8 6-7V4L8 1.5z"/>, "governance"),
  // Analytics — bar chart
  "Analytics": S(<><rect x="1.5" y="8" width="3" height="6.5" rx="0.75"/><rect x="6.5" y="4.5" width="3" height="10" rx="0.75"/><rect x="11.5" y="1.5" width="3" height="13" rx="0.75"/></>, "analytics"),
  // Settings — gear/cog
  "Settings": S(<><circle cx="8" cy="8" r="2.5"/><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4"/></>, "settings"),
  // Account — user silhouette
  "Account": S(<><circle cx="8" cy="5.5" r="3"/><path d="M2 14.5c0-3.3 2.7-6 6-6s6 2.7 6 6"/></>, "account"),
  // HR — people/users
  "HR": S(<><circle cx="5.5" cy="5" r="2.5"/><path d="M1 13.5c0-2.5 2-4.5 4.5-4.5"/><circle cx="11" cy="5" r="2"/><path d="M15 13.5c0-2.2-1.8-4-4-4"/></>, "hr"),
  // Knowledge — book
  "Knowledge": S(<><path d="M3 2h9a1 1 0 011 1v11a1 1 0 01-1 1H3"/><path d="M3 2a1 1 0 00-1 1v11a1 1 0 001 1"/><path d="M7 6h5M7 9h5M7 12h3"/></>, "knowledge"),
  // Finance — dollar in circle
  "Client Finance": S(<><circle cx="8" cy="8" r="6.5"/><path d="M8 4.5v7M9.5 6H7a1.5 1.5 0 000 3h2a1.5 1.5 0 010 3H6.5"/></>, "client-finance"),
  // Personal Finance — wallet
  "Personal Finance": S(<><rect x="1.5" y="4" width="13" height="10" rx="1.5"/><path d="M1.5 7h13"/><circle cx="11" cy="10.5" r="1"/></>, "personal-finance"),
  // Quality — target/badge
  "Quality": S(<><circle cx="8" cy="8" r="6.5"/><circle cx="8" cy="8" r="3.5"/><circle cx="8" cy="8" r="1"/></>, "quality"),
};

// Fallback for unmapped sections
const FALLBACK_ICON = S(<><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="12" height="5" rx="1"/></>, "fallback");

function SidebarInner({
  activePage,
  onNavigate,
  navSections,
  notificationCounts = {},
  userInitials = "?",
  onMobileClose,
  mobileOpen = false,
}: SidebarProps) {
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("maphari:staff-rail-collapsed") === "true";
  });
  const flyoutRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);

  // Close flyout on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        flyoutRef.current &&
        !flyoutRef.current.contains(e.target as Node) &&
        railRef.current &&
        !railRef.current.contains(e.target as Node)
      ) {
        setActiveSectionId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close flyout on Esc
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveSectionId(null);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Close flyout when mobile drawer opens
  useEffect(() => {
    if (mobileOpen) setActiveSectionId(null);
  }, [mobileOpen]);

  const toggleSection = useCallback((sectionId: string) => {
    setActiveSectionId(prev => (prev === sectionId ? null : sectionId));
  }, []);

  const toggleCollapse = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem("maphari:staff-rail-collapsed", String(next));
      if (next) setActiveSectionId(null);
      return next;
    });
  }, []);

  const handlePageClick = useCallback(
    (page: PageId) => {
      onNavigate(page);
      setActiveSectionId(null);
      onMobileClose?.();
    },
    [onNavigate, onMobileClose]
  );

  // Pages shown in the flyout
  const flyoutSection = navSections.find(([id]) => id === activeSectionId);
  const flyoutPages = flyoutSection?.[1] ?? [];
  const flyoutName = flyoutSection?.[0] ?? "";

  return (
    <>
      {/* Icon Rail */}
      <div
        ref={railRef}
        className={cx("rail", collapsed && "railCollapsed")}
        role="navigation"
        aria-label="Section navigation"
      >
        {/* Logo */}
        <div className={cx("railLogo")} aria-label="Maphari Technologies">
          M
        </div>

        {/* Section divider */}
        <div className={cx("railSectionDivider")} />

        {/* Section icons */}
        {navSections.map(([sectionId, pages]) => {
          const hasNotif = pages.some(
            p => (notificationCounts[p.id] ?? 0) > 0
          );
          const isSectionActive = activeSectionId === sectionId;
          const hasCurrent = pages.some(p => p.id === activePage);
          return (
            <NavIcon
              key={sectionId}
              sectionId={sectionId}
              icon={SECTION_ICON_MAP[sectionId] ?? FALLBACK_ICON}
              label={sectionId}
              isActive={isSectionActive}
              hasCurrent={hasCurrent}
              hasNotification={hasNotif}
              onClick={() => toggleSection(sectionId)}
            />
          );
        })}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Collapse toggle */}
        <button
          className={cx("railCollapseBtn")}
          onClick={toggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            {collapsed ? (
              <path d="M2 6l4-4v8L2 6zM8 2h2v8H8z"/>
            ) : (
              <path d="M10 6L6 2v8l4-4zM2 2h2v8H2z"/>
            )}
          </svg>
        </button>

        {/* User avatar */}
        <div className={cx("railAvatar")} title={`Signed in: ${userInitials}`}>
          {userInitials.slice(0, 2).toUpperCase()}
        </div>
      </div>

      {/* Expand trigger — always visible on the left edge when rail is collapsed */}
      {collapsed && (
        <button
          className={cx("railExpandTrigger")}
          onClick={toggleCollapse}
          aria-label="Expand sidebar"
          title="Expand sidebar"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M2 6l4-4v8L2 6zM8 2h2v8H8z"/>
          </svg>
        </button>
      )}

      {/* Flyout Panel */}
      <div
        ref={flyoutRef}
        className={cx("flyout", (!activeSectionId || collapsed) && "flyoutHidden")}
        aria-hidden={!activeSectionId || collapsed}
        role={activeSectionId && !collapsed ? "navigation" : undefined}
        aria-label={activeSectionId && !collapsed ? `${flyoutName} pages` : undefined}
      >
        {flyoutName && (
          <div className={cx("flyoutSectionName")}>{flyoutName}</div>
        )}
        {flyoutPages.map(page => (
          <button
            key={page.id}
            className={cx(
              "flyoutPageBtn",
              page.id === activePage && "flyoutPageBtnActive"
            )}
            onClick={() => handlePageClick(page.id)}
          >
            {page.label}
            {(notificationCounts[page.id] ?? 0) > 0 && (
              <span className={cx("flyoutBadge")}>
                {notificationCounts[page.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          className={cx("drawerBackdrop")}
          onClick={onMobileClose}
          aria-hidden
        />
      )}

      {/* Mobile drawer */}
      <nav
        className={cx("drawer", mobileOpen && "drawerOpen")}
        aria-label="Mobile navigation"
        aria-hidden={!mobileOpen}
      >
        {navSections.map(([sectionId, pages]) => (
          <div key={sectionId} className={cx("drawerSection")}>
            <div className={cx("drawerSectionName")}>{sectionId}</div>
            {pages.map(page => (
              <button
                key={page.id}
                className={cx(
                  "drawerPageBtn",
                  page.id === activePage && "drawerPageBtnActive"
                )}
                onClick={() => handlePageClick(page.id)}
              >
                {page.label}
              </button>
            ))}
          </div>
        ))}
      </nav>
    </>
  );
}

export const Sidebar = React.memo(SidebarInner);

// ─── Backward-compat shim ──────────────────────────────────────────────────
// The parent component (maphari-staff-dashboard.tsx) still uses the old
// StaffSidebar name and prop shape. This shim maps old props → new Sidebar.
interface StaffSidebarProps {
  navSections: [string, NavItem[]][];
  allPagesSections?: [string, NavItem[]][];
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  staffInitials: string;
  staffName: string;
  staffRole: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  quickActionProjects?: Array<{ id: string; name: string }>;
  onQuickLogTime?: (projectId: string, minutes: number, label: string) => Promise<void>;
  onQuickAddTask?: () => void;
}

export function StaffSidebar({
  navSections,
  activePage,
  onNavigate,
  staffInitials,
  mobileOpen,
  onMobileClose,
}: StaffSidebarProps) {
  return (
    <Sidebar
      navSections={navSections}
      activePage={activePage}
      onNavigate={onNavigate}
      userInitials={staffInitials}
      mobileOpen={mobileOpen}
      onMobileClose={onMobileClose}
    />
  );
}

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

// Simple placeholder SVG icons — one per section index, cycles through shapes
const SECTION_ICONS = [
  <svg key="0" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>,
  <svg key="1" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" fillOpacity="0.8"/></svg>,
  <svg key="2" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="6" fillOpacity="0.8"/></svg>,
  <svg key="3" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="2.5" width="12" height="1.5" rx="0.75"/><rect x="2" y="7.5" width="12" height="1.5" rx="0.75"/><rect x="2" y="12.5" width="8" height="1.5" rx="0.75"/></svg>,
  <svg key="4" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2L9.5 6H14L10.5 8.5L12 13L8 10.5L4 13L5.5 8.5L2 6H6.5L8 2Z"/></svg>,
  <svg key="5" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="14" height="10" rx="2" fillOpacity="0.8"/><path d="M5 14h6M8 11v3"/></svg>,
  <svg key="6" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3v4l3 2"/></svg>,
  <svg key="7" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="3" width="12" height="2" rx="1" fillOpacity="0.6"/><rect x="2" y="7" width="8" height="2" rx="1" fillOpacity="0.6"/><rect x="2" y="11" width="10" height="2" rx="1" fillOpacity="0.6"/></svg>,
  <svg key="8" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2C5.8 2 4 3.8 4 6c0 3.5 4 8 4 8s4-4.5 4-8c0-2.2-1.8-4-4-4zm0 5.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/></svg>,
  <svg key="9" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M13 2H3a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V3a1 1 0 00-1-1z"/></svg>,
  <svg key="10" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2 8a6 6 0 1012 0A6 6 0 002 8zm5-1h2v4H7zm0-2.5h2V7H7z" fillRule="evenodd"/></svg>,
  <svg key="11" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="12" height="5" rx="1"/></svg>,
  <svg key="12" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zM7 4h2v5H7zm0 6h2v2H7z"/></svg>,
];

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
        <div className={cx("railLogo")} aria-hidden />

        {/* Section divider */}
        <div className={cx("railSectionDivider")} />

        {/* Section icons */}
        {navSections.map(([sectionId, pages], index) => {
          const hasNotif = pages.some(
            p => (notificationCounts[p.id] ?? 0) > 0
          );
          const isSectionActive = activeSectionId === sectionId;
          return (
            <NavIcon
              key={sectionId}
              sectionId={sectionId}
              icon={SECTION_ICONS[index % SECTION_ICONS.length]}
              label={sectionId}
              isActive={isSectionActive}
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

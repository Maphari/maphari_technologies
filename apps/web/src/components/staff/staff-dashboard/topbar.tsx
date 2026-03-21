"use client";
import React from "react";
import { cx } from "./style";

// ─── New canonical props ──────────────────────────────────────────────────────

interface TopbarProps {
  sectionName: string;
  pageName: string;
  notifCount: number;
  onSearch: () => void;
  onAdd: () => void;
  onHamburger: () => void;
  /** Accepted for interface completeness; avatar lives in sidebar */
  userInitials?: string;
}

export function Topbar({
  sectionName,
  pageName,
  notifCount,
  onSearch,
  onAdd,
  onHamburger,
}: TopbarProps) {
  return (
    <header className={cx("topbar")}>
      {/* Mobile hamburger — hidden on desktop via CSS */}
      <button
        type="button"
        className={cx("topbarHamburger")}
        onClick={onHamburger}
        aria-label="Open navigation"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <rect y="2"  width="16" height="2" rx="1"/>
          <rect y="7"  width="16" height="2" rx="1"/>
          <rect y="12" width="16" height="2" rx="1"/>
        </svg>
      </button>

      {/* Breadcrumb */}
      <div className={cx("topbarBreadcrumb")}>
        <span className={cx("topbarSection")}>{sectionName}</span>
        <span className={cx("topbarSep")}>›</span>
        <span className={cx("topbarPage")}>{pageName}</span>
      </div>

      {/* Search trigger */}
      <button
        type="button"
        className={cx("topbarSearch")}
        onClick={onSearch}
        aria-label="Search or jump to…"
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <circle cx="5.5" cy="5.5" r="4"/>
          <path d="M9 9l2.5 2.5"/>
        </svg>
        <span className={cx("topbarSearchText")}>Search or jump to…</span>
        <kbd className={cx("topbarSearchKbd")}>⌘K</kbd>
      </button>

      {/* Right actions */}
      <div className={cx("topbarActions")}>
        {/* Notification bell */}
        <button
          type="button"
          className={cx("topbarIconBtn")}
          aria-label={
            notifCount > 0
              ? `Notifications (${notifCount} unread)`
              : "Notifications"
          }
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 1a5 5 0 00-5 5v3l-1.5 2h13L13 9V6a5 5 0 00-5-5zM6.5 13a1.5 1.5 0 003 0H6.5z"/>
          </svg>
          {notifCount > 0 && (
            <span className={cx("topbarNotifBadge")} aria-hidden="true" />
          )}
        </button>

        {/* Add button */}
        <button
          type="button"
          className={cx("topbarAddBtn")}
          onClick={onAdd}
        >
          + Add
        </button>
      </div>
    </header>
  );
}

// ─── Backward-compat shim ─────────────────────────────────────────────────────
// The root component (maphari-staff-dashboard.tsx) imports `StaffTopbar` and
// passes the old rich prop set. This shim maps those props onto the new Topbar.

type StaffTopbarProps = {
  eyebrow: string;
  title: string;
  onOpenApps: () => void;
  onOpenNotifications: () => void;
  onOpenMessages: () => void;
  unreadNotificationsCount: number;
  onLogout: () => void;
  staffInitials: string;
  staffName: string;
  staffEmail: string;
  staffRole: string;
  isLoggingOut?: boolean;
  onOpenHelp?: () => void;
  onNavigateSettings?: () => void;
  onNavigateProfile?: () => void;
  onMenuToggle?: () => void;
  onNewTask?: () => void;
  onStartTimer?: () => void;
  onOpenFiles?: () => void;
};

export function StaffTopbar({
  eyebrow,
  title,
  onOpenNotifications,
  unreadNotificationsCount,
  onMenuToggle,
  staffInitials,
}: StaffTopbarProps) {
  return (
    <Topbar
      sectionName={eyebrow}
      pageName={title}
      notifCount={unreadNotificationsCount}
      onSearch={() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
      }}
      onAdd={() => {
        window.dispatchEvent(new CustomEvent("staff:quick-add"));
      }}
      onHamburger={onMenuToggle ?? (() => {})}
      userInitials={staffInitials}
    />
  );
}

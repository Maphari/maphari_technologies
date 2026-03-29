"use client";
import React, { useEffect, useRef, useState } from "react";
import { cx } from "./style";

// ─── New canonical props ──────────────────────────────────────────────────────

interface TopbarProps {
  sectionName: string;
  pageName: string;
  notifCount: number;
  onSearch: () => void;
  onAdd: () => void;
  onHamburger: () => void;
  userInitials?: string;
  userName?: string;
  userEmail?: string;
  onLogout?: () => void;
  isLoggingOut?: boolean;
  onNotifClick?: () => void;
  onNavigateSettings?: () => void;
  onNavigateProfile?: () => void;
}

export function Topbar({
  sectionName,
  pageName,
  notifCount,
  onSearch,
  onAdd,
  onHamburger,
  userInitials,
  userName,
  userEmail,
  onLogout,
  isLoggingOut,
  onNotifClick,
  onNavigateSettings,
  onNavigateProfile,
}: TopbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

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

      {/* Right actions */}
      <div className={cx("topbarActions")}>
        {/* Search trigger pill */}
        <button
          type="button"
          className={cx("topbarSearch")}
          onClick={onSearch}
          aria-label="Search or jump to… (⌘K)"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <circle cx="5" cy="5" r="3.5"/>
            <path d="M8 8l2 2" strokeLinecap="round"/>
          </svg>
          <span className={cx("topbarSearchText")}>Search…</span>
          <kbd className={cx("topbarSearchKbd")}>⌘K</kbd>
        </button>

        {/* Notification bell */}
        <button
          type="button"
          className={cx("topbarIconBtn")}
          onClick={onNotifClick}
          aria-label={notifCount > 0 ? `Notifications (${notifCount} unread)` : "Notifications"}
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

        {/* Profile / logout */}
        {onLogout && (
          <div className={cx("topbarUserMenu")} ref={menuRef}>
            <button
              type="button"
              className={cx("topbarUserBtn")}
              onClick={() => setMenuOpen(v => !v)}
              aria-expanded={menuOpen}
              aria-label="Open profile menu"
            >
              <span className={cx("topbarUserAvatar")}>
                {userInitials ?? "S"}
              </span>
              <span className={`${cx("topbarUserChevron")} ${menuOpen ? cx("topbarUserChevronOpen") : ""}`}>
                ▾
              </span>
            </button>
            {menuOpen && (
              <div className={cx("topbarUserDropdown")}>
                {(userName || userEmail) && (
                  <div className={cx("topbarUserInfo")}>
                    {userName && <div className={cx("topbarUserName")}>{userName}</div>}
                    {userEmail && <div className={cx("topbarUserEmail")}>{userEmail}</div>}
                  </div>
                )}
                {(onNavigateProfile || onNavigateSettings) && (
                  <div className={cx("topbarUserDivider")} />
                )}
                {onNavigateProfile && (
                  <button
                    type="button"
                    className={cx("topbarUserItem")}
                    onClick={() => { setMenuOpen(false); onNavigateProfile(); }}
                  >
                    My Employment
                  </button>
                )}
                {onNavigateSettings && (
                  <button
                    type="button"
                    className={cx("topbarUserItem")}
                    onClick={() => { setMenuOpen(false); onNavigateSettings(); }}
                  >
                    Settings
                  </button>
                )}
                {(onNavigateProfile || onNavigateSettings) && (
                  <div className={cx("topbarUserDivider")} />
                )}
                <button
                  type="button"
                  className={`${cx("topbarUserItem")} ${cx("topbarSignOut")}`}
                  onClick={() => { setMenuOpen(false); onLogout(); }}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? "Signing out…" : "Sign Out"}
                </button>
              </div>
            )}
          </div>
        )}
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
  staffName,
  staffEmail,
  onLogout,
  isLoggingOut,
  onNewTask,
  onNavigateSettings,
  onNavigateProfile,
}: StaffTopbarProps) {
  return (
    <Topbar
      sectionName={eyebrow}
      pageName={title}
      notifCount={unreadNotificationsCount}
      onSearch={() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
      }}
      onAdd={onNewTask ?? (() => {})}
      onNotifClick={onOpenNotifications}
      onHamburger={onMenuToggle ?? (() => {})}
      userInitials={staffInitials}
      userName={staffName}
      userEmail={staffEmail}
      onLogout={onLogout}
      isLoggingOut={isLoggingOut}
      onNavigateSettings={onNavigateSettings}
      onNavigateProfile={onNavigateProfile}
    />
  );
}

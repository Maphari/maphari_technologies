"use client";

import { useEffect, useRef, useState } from "react";
import { styles } from "./style";
import { Ic } from "./ui";
import { DashboardUtilityIcon } from "@/components/shared/dashboard-utility-icon";
import { ThemeToggle } from "@/components/shared/ui/theme-toggle";

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

const STAFF_QUICK_ACTIONS = [
  { icon: "check",   label: "New Task"    },
  { icon: "clock",   label: "Start Timer" },
  { icon: "message", label: "New Message" },
  { icon: "upload",  label: "Upload File" },
] as const;

const PROFILE_LINKS = [
  { icon: "settings",   label: "Settings"   },
  { icon: "users",      label: "My Profile" },
  { icon: "headphones", label: "Help"       },
] as const;

export function StaffTopbar({
  eyebrow,
  title,
  onOpenApps,
  onOpenNotifications,
  onOpenMessages,
  unreadNotificationsCount,
  onLogout,
  staffInitials,
  staffName,
  staffEmail,
  staffRole,
  isLoggingOut = false,
  onOpenHelp,
  onNavigateSettings,
  onNavigateProfile,
  onMenuToggle,
  onNewTask,
  onStartTimer,
  onOpenFiles,
}: StaffTopbarProps) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const quickMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocumentClick(event: MouseEvent): void {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
      if (quickMenuRef.current && !quickMenuRef.current.contains(event.target as Node)) {
        setQuickOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setProfileMenuOpen(false);
        setQuickOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocumentClick);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocumentClick);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  function handleQuickAction(label: string): void {
    setQuickOpen(false);
    if (label === "New Task")    { onNewTask?.();    return; }
    if (label === "Start Timer") { onStartTimer?.(); return; }
    if (label === "New Message") { onOpenMessages(); return; }
    if (label === "Upload File") { onOpenFiles?.();  return; }
    onOpenApps();
  }

  function handleProfileLink(label: string): void {
    setProfileMenuOpen(false);
    if (label === "Settings")   { onNavigateSettings?.(); return; }
    if (label === "My Profile") { onNavigateProfile?.();  return; }
    if (label === "Help")       { onOpenHelp?.();         return; }
  }

  return (
    <header className={styles.topbar}>
      {/* ── Mobile hamburger ─────────────────────────────────────────── */}
      {onMenuToggle ? (
        <button
          type="button"
          className={styles.hamburger}
          aria-label="Toggle navigation"
          onClick={onMenuToggle}
        >
          <svg width="26" height="26" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <rect x="1" y="4"    width="16" height="1.5" rx="0.75" fill="currentColor"/>
            <rect x="1" y="8.25" width="16" height="1.5" rx="0.75" fill="currentColor"/>
            <rect x="1" y="12.5" width="16" height="1.5" rx="0.75" fill="currentColor"/>
          </svg>
        </button>
      ) : null}

      {/* ── Left: breadcrumb ─────────────────────────────────────────── */}
      <div className={styles.topbarTitle}>
        {eyebrow} <span>/ {title}</span>
      </div>

      {/* ── Right: action strip ──────────────────────────────────────── */}
      <div className={styles.topbarActions}>
        {/* Online status pill */}
        <div className={styles.topbarOnlinePill}>
          <span className={styles.topbarOnlineDot} />
          <span className={styles.topbarOnlineLabel}>Online</span>
        </div>

        {/* Quick create "+" */}
        <div ref={quickMenuRef} className={`${styles.topbarUserMenu} ${styles.topbarQuickMenu}`}>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => setQuickOpen((v) => !v)}
            aria-label="Quick create"
            aria-expanded={quickOpen}
          >
            <Ic n="plus" sz={16} c="var(--muted)" />
          </button>

          {quickOpen ? (
            <div className={`${styles.topbarUserDropdown} ${styles.topbarQuickDropdown}`}>
              <div className={`${styles.topbarUserEmail} ${styles.mb4}`}>
                Quick Actions
              </div>
              {STAFF_QUICK_ACTIONS.map(({ icon, label }) => (
                <button
                  key={label}
                  type="button"
                  className={`${styles.topbarUserItem} ${styles.topbarMenuItemRow}`}
                  onClick={() => handleQuickAction(label)}
                >
                  <span className={styles.topbarMenuIconAccent}>
                    <Ic n={icon} sz={12} c="var(--accent)" />
                  </span>
                  {label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Apps grid */}
        <button
          type="button"
          className={`${styles.iconBtn} ${styles.topbarAppsBtn}`}
          onClick={onOpenApps}
          aria-label="Open app grid"
        >
          <DashboardUtilityIcon kind="apps" className={styles.topbarIcon} />
        </button>

        {/* Notifications with numeric badge */}
        <button
          type="button"
          className={styles.iconBtn}
          onClick={onOpenNotifications}
          aria-label="Open notifications"
        >
          <DashboardUtilityIcon kind="notifications" className={styles.topbarIcon} />
          {unreadNotificationsCount > 0 ? (
            <span className={styles.topbarNotifBadge}>
              {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
            </span>
          ) : null}
        </button>

        {/* Messages */}
        <button
          type="button"
          className={styles.iconBtn}
          onClick={onOpenMessages}
          aria-label="Open messages"
        >
          <DashboardUtilityIcon kind="messages" className={styles.topbarIcon} />
        </button>

        {/* Help */}
        <button
          type="button"
          className={`${styles.iconBtn} ${styles.topbarHelpBtn}`}
          aria-label="Open help center"
          onClick={onOpenHelp}
        >
          <DashboardUtilityIcon kind="help" className={styles.topbarIcon} />
        </button>

        {/* Separator */}
        <div className={styles.topbarSep} />

        {/* Profile menu */}
        <div className={styles.topbarUserMenu} ref={profileMenuRef}>
          <button
            type="button"
            className={styles.topbarUserBtn}
            onClick={() => setProfileMenuOpen((v) => !v)}
            aria-expanded={profileMenuOpen}
            aria-label="Open account menu"
          >
            <span className={styles.topbarUserAvatar}>{staffInitials}</span>
            <span className={styles.topbarUserLabel}>Staff</span>
          </button>

          {profileMenuOpen ? (
            <div className={`${styles.topbarUserDropdown} ${styles.topbarProfileDropdown}`}>
              {/* Identity block */}
              <div className={styles.topbarProfileHead}>
                <div className={`${styles.flexRow} ${styles.gap10}`}>
                  <div className={styles.topbarProfileAvatarLg}>
                    {staffInitials}
                  </div>
                  <div className={styles.minW0}>
                    <div className={styles.topbarProfileName}>{staffName}</div>
                    <div className={styles.topbarProfileEmail}>{staffEmail}</div>
                  </div>
                </div>
                <div className={`${styles.flexRow} ${styles.gap6}`}>
                  <span className={styles.topbarRoleBadge}>{staffRole}</span>
                  <span className={styles.topbarActiveBadge}>Active</span>
                </div>
              </div>

              {/* Navigation links */}
              <div className={styles.topbarProfileLinks}>
                {PROFILE_LINKS.map(({ icon, label }) => (
                  <button
                    key={label}
                    type="button"
                    className={`${styles.topbarUserItem} ${styles.topbarMenuItemRow}`}
                    onClick={() => handleProfileLink(label)}
                  >
                    <span className={styles.topbarMenuIconNeutral}>
                      <Ic n={icon} sz={12} c="var(--muted)" />
                    </span>
                    {label}
                  </button>
                ))}
              </div>

              {/* Sign out */}
              <div className={styles.topbarProfileSignOut}>
                <button
                  type="button"
                  className={`${styles.topbarUserItem} ${styles.topbarMenuItemRow} ${isLoggingOut ? styles.topbarSignOutRowMuted : styles.topbarSignOutRow}`}
                  onClick={() => { setProfileMenuOpen(false); onLogout(); }}
                  disabled={isLoggingOut}
                >
                  <span className={isLoggingOut ? styles.topbarMenuIconNeutral : styles.topbarMenuIconRed}>
                    <Ic n="x" sz={12} c={isLoggingOut ? "var(--muted)" : "var(--red)"} />
                  </span>
                  {isLoggingOut ? "Signing out…" : "Sign Out"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

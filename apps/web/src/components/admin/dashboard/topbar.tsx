"use client";

import { useEffect, useRef, useState } from "react";
import { styles } from "./style";
import { DashboardUtilityIcon } from "@/components/shared/dashboard-utility-icon";
import { ThemeToggle } from "@/components/shared/ui/theme-toggle";

export function AdminTopbar({
  title,
  unreadNotificationsCount,
  email,
  loggingOut,
  onOpenNotifications,
  onOpenMessages,
  onLogout,
  onMenuToggle,
  onOpenHelp,
}: {
  title: [string, string];
  unreadNotificationsCount: number;
  email: string;
  loggingOut: boolean;
  onOpenNotifications: () => void;
  onOpenMessages: () => void;
  onLogout: () => void;
  onMenuToggle?: () => void;
  onOpenHelp?: () => void;
}) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocumentClick(event: MouseEvent): void {
      if (!profileMenuRef.current) return;
      if (!profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") setProfileMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocumentClick);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocumentClick);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  function openAppGrid(): void {
    window.dispatchEvent(new CustomEvent("admin:open-app-grid"));
  }

  return (
    <header className={styles.topbar}>
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
      <div className={styles.topbarTitle}>
        {title[0]} <span>/ {title[1]}</span>
      </div>
      <div className={styles.topbarActions}>
        <button
          type="button"
          className={`${styles.iconBtn} ${styles.topbarAppsBtn}`}
          onClick={openAppGrid}
          aria-label="Open app grid"
        >
          <DashboardUtilityIcon kind="apps" className={styles.topbarIcon} />
        </button>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={onOpenNotifications}
          aria-label="Open notifications"
        >
          <DashboardUtilityIcon kind="notifications" className={styles.topbarIcon} />
          {unreadNotificationsCount > 0 ? (
            <span className={styles.dot} />
          ) : null}
        </button>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={onOpenMessages}
          aria-label="Open messages"
        >
          <DashboardUtilityIcon kind="messages" className={styles.topbarIcon} />
        </button>
        <button
          type="button"
          className={`${styles.iconBtn} ${styles.topbarHelpBtn}`}
          aria-label="Open help center"
          onClick={onOpenHelp}
        >
          <DashboardUtilityIcon kind="help" className={styles.topbarIcon} />
        </button>
        <div className={styles.topbarUserMenu} ref={profileMenuRef}>
          <button
            title="Open profile menu"
            type="button"
            className={styles.topbarUserBtn}
            onClick={() => setProfileMenuOpen((value) => !value)}
            aria-expanded={profileMenuOpen}
          >
            <span className={styles.topbarUserAvatar}>
              {email[0]?.toUpperCase() ?? "A"}
            </span>
            <span className={`${styles.topbarUserLabel} ${styles.topbarLabel}`}>Admin</span>
          </button>
          {profileMenuOpen ? (
            <div className={styles.topbarUserDropdown}>
              <div className={styles.topbarUserEmail}>{email}</div>
              <button
                type="button"
                className={styles.topbarUserItem}
                onClick={onLogout}
                disabled={loggingOut}
              >
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { styles } from "./style";
import { DashboardUtilityIcon } from "@/components/shared/dashboard-utility-icon";
import Link from "next/link";

type StaffTopbarProps = {
  eyebrow: string;
  title: string;
  onOpenApps: () => void;
  onOpenNotifications: () => void;
  onOpenMessages: () => void;
  unreadNotificationsCount: number;
  onLogout: () => void;
  staffInitials: string;
  staffEmail: string;
  staffRole: string;
  isLoggingOut?: boolean;
};

export function StaffTopbar({
  eyebrow,
  title,
  onOpenApps,
  onOpenNotifications,
  onOpenMessages,
  unreadNotificationsCount,
  onLogout,
  staffInitials,
  staffEmail,
  staffRole,
  isLoggingOut = false
}: StaffTopbarProps) {
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

  return (
    <header className={styles.topbar}>
      <div className={styles.topbarTitle}>
        {eyebrow} <span>/ {title}</span>
      </div>
      <div className={styles.topbarActions}>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={onOpenApps}
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
        <Link
          href="https://designsystem.digital.gov/components/header/"
          target="_blank"
          rel="noreferrer"
          className={styles.iconBtn}
          aria-label="Open help docs"
        >
          <DashboardUtilityIcon kind="help" className={styles.topbarIcon} />
        </Link>
        <div className={styles.topbarUserMenu} ref={profileMenuRef}>
          <button type="button" className={styles.topbarUserBtn} onClick={() => setProfileMenuOpen((value) => !value)} aria-expanded={profileMenuOpen}>
            <span className={styles.topbarUserAvatar}>{staffInitials}</span>
            <span className={styles.topbarUserLabel}>{staffRole}</span>
          </button>
          {profileMenuOpen ? (
            <div className={styles.topbarUserDropdown}>
              <div className={styles.topbarUserEmail}>{staffEmail}</div>
              <button type="button" className={styles.topbarUserItem} onClick={onLogout} disabled={isLoggingOut}>
                {isLoggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

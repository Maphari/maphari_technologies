"use client";

import { useEffect, useRef, useState } from "react";
import { styles } from "./style";
import { DashboardUtilityIcon } from "@/components/shared/dashboard-utility-icon";
import Link from "next/link";

type ClientTopbarProps = {
  eyebrow: string;
  title: string;
  onOpenApps: () => void;
  onOpenNotifications: () => void;
  onNewMessage: () => void;
  unreadCount: number;
  onLogout: () => void;
  clientInitials: string;
  clientEmail: string;
  isLoggingOut?: boolean;
};

export function ClientTopbar({
  eyebrow,
  title,
  onOpenApps,
  onOpenNotifications,
  onNewMessage,
  unreadCount,
  onLogout,
  clientInitials,
  clientEmail,
  isLoggingOut = false,
}: ClientTopbarProps) {
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
    onOpenApps();
  }

  return (
    <header className={styles.topbar}>
      <div className={styles.topbarTitle}>
        {eyebrow} <span>/ {title}</span>
      </div>

      <div className={styles.topbarActions}>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={openAppGrid}
          aria-label="Open app grid"
        >
          <DashboardUtilityIcon kind="apps" className={styles.topbarIcon} />
        </button>
        <button type="button" className={styles.iconBtn} onClick={onOpenNotifications} aria-label="Open notifications">
          <DashboardUtilityIcon kind="notifications" className={styles.topbarIcon} />
          {unreadCount > 0 ? <span className={styles.dot} /> : null}
        </button>

        <button type="button" className={styles.iconBtn} onClick={onNewMessage} aria-label="Open messages">
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
          <button
            type="button"
            className={styles.topbarUserBtn}
            onClick={() => setProfileMenuOpen((value) => !value)}
            aria-expanded={profileMenuOpen}
            aria-label="Open account menu"
          >
            <span className={styles.topbarUserAvatar}>{clientInitials}</span>
            <span className={styles.topbarUserLabel}>Client</span>
          </button>
          {profileMenuOpen ? (
            <div className={styles.topbarUserDropdown}>
              <div className={styles.topbarUserEmail}>{clientEmail}</div>
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

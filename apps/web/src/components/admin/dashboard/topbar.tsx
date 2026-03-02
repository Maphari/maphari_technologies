"use client";

import { useEffect, useRef, useState } from "react";
import { styles } from "./style";
import Link from "next/link";
import { DashboardUtilityIcon } from "@/components/shared/dashboard-utility-icon";

export function AdminTopbar({
  title,
  unreadNotificationsCount,
  email,
  loggingOut,
  onOpenNotifications,
  onOpenMessages,
  onLogout,
}: {
  title: [string, string];
  unreadNotificationsCount: number;
  email: string;
  loggingOut: boolean;
  onOpenNotifications: () => void;
  onOpenMessages: () => void;
  onLogout: () => void;
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
      <div className={styles.topbarTitle}>
        {title[0]} <span>/ {title[1]}</span>
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
            <span className={styles.topbarUserLabel}>Admin</span>
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

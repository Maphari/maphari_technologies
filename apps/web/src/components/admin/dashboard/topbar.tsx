"use client";

import { useEffect, useRef, useState } from "react";
import { styles } from "./style";
import { DashboardUtilityIcon } from "@/components/shared/dashboard-utility-icon";

export function AdminTopbar({
  title,
  unreadNotificationsCount,
  email,
  loggingOut,
  onOpenNotifications,
  onOpenMessages,
  onLogout,
  onMenuToggle,
  statusBar,
}: {
  title: [string, string];
  unreadNotificationsCount: number;
  email: string;
  loggingOut: boolean;
  onOpenNotifications: () => void;
  onOpenMessages: () => void;
  onLogout: () => void;
  onMenuToggle?: () => void;
  statusBar?: { clientsActive: number; blockers: number; atRisk: number };
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

  const periodLabel = new Date().toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });

  return (
    <header className={styles.topbar}>
      {onMenuToggle ? (
        <button
          type="button"
          className={styles.hamburger}
          aria-label="Toggle navigation"
          onClick={onMenuToggle}
        >
          <svg width="20" height="20" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <rect x="1" y="4"    width="16" height="1.5" rx="0.75" fill="currentColor"/>
            <rect x="1" y="8.25" width="16" height="1.5" rx="0.75" fill="currentColor"/>
            <rect x="1" y="12.5" width="16" height="1.5" rx="0.75" fill="currentColor"/>
          </svg>
        </button>
      ) : null}

      {/* Breadcrumb */}
      <div className={styles.topbarBreadcrumb}>
        <span className={styles.topbarBcSection}>{title[0]}</span>
        <span className={styles.topbarBcSep}>/</span>
        <span className={styles.topbarBcPage}>{title[1]}</span>
      </div>

      {/* Status pills */}
      {statusBar && (statusBar.clientsActive > 0 || statusBar.blockers > 0 || statusBar.atRisk > 0) ? (
        <>
          <div className={styles.topbarDivider} aria-hidden="true" />
          <div className={styles.topbarStatusPills}>
            {statusBar.clientsActive > 0 ? (
              <span className={`${styles.topbarPill} ${styles.topbarPillGreen}`}>
                <span className={styles.topbarPillPip} aria-hidden="true" />
                {statusBar.clientsActive} active
              </span>
            ) : null}
            {statusBar.blockers > 0 ? (
              <span className={`${styles.topbarPill} ${styles.topbarPillAmber}`}>
                <span className={styles.topbarPillPip} aria-hidden="true" />
                {statusBar.blockers} blockers
              </span>
            ) : null}
            {statusBar.atRisk > 0 ? (
              <span className={`${styles.topbarPill} ${styles.topbarPillRed}`}>
                <span className={styles.topbarPillPip} aria-hidden="true" />
                {statusBar.atRisk} at risk
              </span>
            ) : null}
          </div>
        </>
      ) : null}

      <div className={styles.topbarSpacer} />

      {/* Period chip */}
      <span className={styles.topbarPeriodChip}>{periodLabel}</span>

      {/* Actions */}
      <div className={styles.topbarActions}>
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
        <div className={styles.topbarUserMenu} ref={profileMenuRef}>
          <button
            title="Open profile menu"
            type="button"
            className={styles.topbarUserBtn}
            onClick={() => setProfileMenuOpen((v) => !v)}
            aria-expanded={profileMenuOpen}
          >
            <span className={styles.topbarUserAvatar}>
              {email[0]?.toUpperCase() ?? "A"}
            </span>
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

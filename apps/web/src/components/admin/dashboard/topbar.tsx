"use client";

import { useEffect, useRef, useState } from "react";
import { styles } from "./style";
import Link from "next/link";

function UtilityIcon({
  kind,
}: {
  kind: "apps" | "notifications" | "messages" | "help";
}) {
  switch (kind) {
    case "apps":
      return (
        <svg viewBox="0 0 16 16" className={styles.navIcon} aria-hidden="true">
          <rect x="2" y="2" width="4" height="4" />
          <rect x="10" y="2" width="4" height="4" />
          <rect x="2" y="10" width="4" height="4" />
          <rect x="10" y="10" width="4" height="4" />
        </svg>
      );
    case "notifications":
      return (
        <svg viewBox="0 0 16 16" className={styles.navIcon} aria-hidden="true">
          <path d="M8 2.2a3.8 3.8 0 0 1 3.8 3.8v2.3L13.4 11H2.6l1.6-2.7V6A3.8 3.8 0 0 1 8 2.2Z" />
          <path d="M6.2 12a1.8 1.8 0 0 0 3.6 0" />
        </svg>
      );
    case "messages":
      return (
        <svg viewBox="0 0 16 16" className={styles.navIcon} aria-hidden="true">
          <path d="M2 2.5h12v8H8.8L6 13v-2.5H2z" />
        </svg>
      );
    case "help":
      return (
        <svg viewBox="0 0 16 16" className={styles.navIcon} aria-hidden="true">
          <circle cx="8" cy="8" r="6" />
          <path d="M6.6 6.2a1.7 1.7 0 1 1 2.8 1.3c-.7.5-1 .9-1 1.7" />
          <circle cx="8" cy="11.8" r=".6" />
        </svg>
      );
    default:
      return null;
  }
}

export function AdminTopbar({
  title,
  topbarSearch,
  unreadNotificationsCount,
  email,
  loggingOut,
  onSearchChange,
  onSearchSubmit,
  onOpenNotifications,
  onOpenMessages,
  onLogout,
}: {
  title: [string, string];
  topbarSearch: string;
  unreadNotificationsCount: number;
  email: string;
  loggingOut: boolean;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
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
      <div className={styles.searchBar}>
        <span className={styles.searchIcon}>⌕</span>
        <input
          type="text"
          placeholder="Search pages or actions (Ctrl+K)"
          value={topbarSearch}
          onChange={(event) => onSearchChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onSearchSubmit();
            }
          }}
        />
      </div>
      <div className={styles.topbarActions}>
        <button
          type="button"
          className={`${styles.btnSm} ${styles.btnGhost}`}
          onClick={openAppGrid}
        >
          <UtilityIcon kind="apps" />
          Apps
        </button>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={onOpenNotifications}
          aria-label="Open notifications"
        >
          <UtilityIcon kind="notifications" />
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
          <UtilityIcon kind="messages" />
        </button>
        <Link
          href="https://designsystem.digital.gov/components/header/"
          target="_blank"
          rel="noreferrer"
          className={styles.iconBtn}
          aria-label="Open help docs"
        >
          <UtilityIcon kind="help" />
        </Link>
        <div className={styles.topbarUserMenu} ref={profileMenuRef}>
          <button
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

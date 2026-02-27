"use client";

import { useEffect, useRef, useState } from "react";
import { cx, styles } from "./style";

type StaffTopbarProps = {
  eyebrow: string;
  title: string;
  searchValue: string;
  searchPlaceholder: string;
  onSearchChange: (value: string) => void;
  onNewTask: () => void;
  onLogout: () => void;
  staffInitials: string;
  staffEmail: string;
  staffRole: string;
  isLoggingOut?: boolean;
};

function UtilityIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <circle cx="8" cy="8" r="6" />
      <path d="M8 6v.1M8 11V8.2" />
    </svg>
  );
}

export function StaffTopbar({
  eyebrow,
  title,
  searchValue,
  searchPlaceholder,
  onSearchChange,
  onNewTask,
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
        {eyebrow} <em>/ {title}</em>
      </div>
      <div className={styles.search}>
        <span className={styles.searchIcon}>⌕</span>
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
      <div className={styles.topbarActions}>
        <a href="https://designsystem.digital.gov/components/header/" target="_blank" rel="noreferrer" className={styles.iconButton} aria-label="Open help docs">
          <UtilityIcon />
        </a>
        <button className={cx("button", "buttonBlue")} type="button" onClick={onNewTask}>+ New Task</button>
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

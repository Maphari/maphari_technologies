"use client";

import { cx, styles } from "./style";

type StaffTopbarProps = {
  eyebrow: string;
  title: string;
  searchValue: string;
  searchPlaceholder: string;
  onSearchChange: (value: string) => void;
  notificationCount: number;
  onOpenNotifications: () => void;
  onNewTask: () => void;
  onQuickTime: () => void;
  onLogout: () => void;
  isLoggingOut?: boolean;
};

export function StaffTopbar({
  eyebrow,
  title,
  searchValue,
  searchPlaceholder,
  onSearchChange,
  notificationCount,
  onOpenNotifications,
  onNewTask,
  onQuickTime,
  onLogout,
  isLoggingOut = false
}: StaffTopbarProps) {
  return (
    <div className={styles.topbar}>
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
        <button className={styles.iconButton} type="button" onClick={onOpenNotifications} aria-label="Open notifications">
          🔔
          {notificationCount > 0 ? <span className={styles.dot} /> : null}
        </button>
        <button className={styles.iconButton} type="button" title="Quick log time" onClick={onQuickTime}>⏱</button>
        <button className={cx("button", "buttonBlue")} type="button" onClick={onNewTask}>+ New Task</button>
        <button className={cx("button", "buttonGhost")} type="button" onClick={onLogout} disabled={isLoggingOut}>
          {isLoggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>
    </div>
  );
}

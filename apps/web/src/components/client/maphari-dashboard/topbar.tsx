import { styles } from "./style";

type TopbarDateRange = "7d" | "30d" | "90d" | "all";

type TopbarProps = {
  topbarEyebrow: string;
  topbarTitle: string;
  activeProjectId: string | null;
  projectOptions: Array<{ id: string; name: string }>;
  dateRange: TopbarDateRange;
  notificationCount: number;
  onProjectChange: (projectId: string | null) => void;
  onDateRangeChange: (value: TopbarDateRange) => void;
  onOpenCommandSearch: () => void;
  onOpenNotifications: () => void;
  onOpenMessages: () => void;
};

export function ClientTopbar({
  topbarEyebrow,
  topbarTitle,
  activeProjectId,
  projectOptions,
  dateRange,
  notificationCount,
  onProjectChange,
  onDateRangeChange,
  onOpenCommandSearch,
  onOpenNotifications,
  onOpenMessages,
}: TopbarProps) {
  return (
    <div className={styles.topbar}>

      {/* ── Breadcrumb title (editorial) ─────────────────────────── */}
      <div className={styles.topbarTitle}>
        <span className={styles.topbarEyebrow}>{topbarEyebrow} ›</span>{" "}
        {topbarTitle}
      </div>

      {/* ── Search pill (center) ─────────────────────────────────── */}
      <button
        className={styles.shortcutButton}
        type="button"
        aria-label="Open command search"
        onClick={onOpenCommandSearch}
      >
        Search
        <span>⌘K</span>
      </button>

      {/* ── Filters ─────────────────────────────────────────────── */}
      <div className={styles.topbarFilters}>
        <select
          className={styles.topbarSelect}
          aria-label="Filter by project"
          value={activeProjectId ?? "__all__"}
          onChange={(event) =>
            onProjectChange(event.target.value === "__all__" ? null : event.target.value)
          }
        >
          <option value="__all__">All projects</option>
          {projectOptions.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>

        <select
          className={styles.topbarSelect}
          aria-label="Date range"
          value={dateRange}
          onChange={(event) => onDateRangeChange(event.target.value as TopbarDateRange)}
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      {/* ── Actions ─────────────────────────────────────────────── */}
      <div className={styles.topbarActions}>
        <button
          className={styles.iconButton}
          title="Notifications"
          type="button"
          aria-label={
            notificationCount > 0
              ? `Notifications (${notificationCount} unread)`
              : "Notifications"
          }
          onClick={onOpenNotifications}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
            <path
              d="M12 3a6 6 0 0 0-6 6v2.6l-1.4 2.8A1 1 0 0 0 5.5 16h13a1 1 0 0 0 .9-1.6L18 11.6V9a6 6 0 0 0-6-6Zm0 18a3 3 0 0 0 2.8-2H9.2A3 3 0 0 0 12 21Z"
              fill="currentColor"
            />
          </svg>
          {notificationCount > 0 ? (
            <span className={styles.notifCount}>
              {notificationCount > 99 ? "99+" : String(notificationCount)}
            </span>
          ) : null}
        </button>

        <button
          className={`${styles.button} ${styles.buttonAccent}`}
          type="button"
          onClick={onOpenMessages}
          aria-label="Compose a new message"
        >
          + Message
        </button>
      </div>
    </div>
  );
}

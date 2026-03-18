"use client";

import { styles } from "../style";

// ---------------------------------------------------------------------------
// Shared utility components and helpers used across admin page components.
// ---------------------------------------------------------------------------

export function EmptyState({
  title,
  subtitle,
  compact = false,
  variant = "data",
  action,
}: {
  title: string;
  subtitle?: string;
  compact?: boolean;
  variant?: "data" | "message" | "security";
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className={`${styles.emptyState} ${compact ? styles.emptyStateCompact : ""}`}>
      <div className={styles.emptyIcon}>
        {variant === "message" ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H11l-3.5 4V16H6.5A2.5 2.5 0 0 1 4 13.5z" />
            <path d="M8 8h8M8 11h5" />
          </svg>
        ) : null}
        {variant === "security" ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3 19 6v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
            <path d="m9.5 12.2 1.8 1.8 3.2-3.2" />
          </svg>
        ) : null}
        {variant === "data" ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 9.5a2.5 2.5 0 0 1 2.5-2.5h11A2.5 2.5 0 0 1 20 9.5v7A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z" />
            <path d="M8 7V5.8A1.8 1.8 0 0 1 9.8 4h4.4A1.8 1.8 0 0 1 16 5.8V7" />
            <path d="M4 11h16" />
          </svg>
        ) : null}
      </div>
      <div className={styles.emptyTitle}>{title}</div>
      {subtitle ? <div className={styles.emptySub}>{subtitle}</div> : null}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          style={{
            marginTop: 12,
            padding: "8px 18px",
            background: "var(--accent)",
            color: "var(--bg)",
            border: "none",
            borderRadius: 8,
            fontSize: "0.76rem",
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export function toneClass(color: string): string {
  if (color === "var(--accent)") return "toneAccent";
  if (color === "var(--red)") return "toneRed";
  if (color === "var(--amber)") return "toneAmber";
  if (color === "var(--blue)") return "toneBlue";
  if (color === "var(--purple)") return "tonePurple";
  if (color === "var(--muted)") return "toneMuted";
  if (color === "var(--green)") return "toneAccent";
  return "toneText";
}

export function colorClass(color: string): string {
  if (color === "var(--red)") return "colorRed";
  if (color === "var(--blue)") return "colorBlue";
  if (color === "var(--amber)") return "colorAmber";
  if (color === "var(--purple)") return "colorPurple";
  if (color === "var(--muted)") return "colorMuted";
  return "colorAccent";
}

export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(date);
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

"use client";

import { useState } from "react";
import { cx, styles } from "./style";
import type { PageId } from "./types";

export function NavIcon({ id, className }: { id: PageId; className: string }) {
  if (id === "dashboard") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" stroke="currentColor" strokeWidth="1.3" />
        <rect x="9" y="1" width="6" height="6" stroke="currentColor" strokeWidth="1.3" />
        <rect x="1" y="9" width="6" height="6" stroke="currentColor" strokeWidth="1.3" />
        <rect x="9" y="9" width="6" height="6" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    );
  }
  if (id === "tasks") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="14" height="14" rx="1" stroke="currentColor" strokeWidth="1.3" />
        <path d="M4 5h8M4 8h6M4 11h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "kanban") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="4" height="14" rx="1" stroke="currentColor" strokeWidth="1.3" />
        <rect x="6" y="1" width="4" height="10" rx="1" stroke="currentColor" strokeWidth="1.3" />
        <rect x="11" y="1" width="4" height="7" rx="1" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    );
  }
  if (id === "clients") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.3" />
        <path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "deliverables") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <path d="M3 1h10v14H3z" stroke="currentColor" strokeWidth="1.3" />
        <path d="M5 5h6M5 8h4M5 11h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "timelog") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="9" r="6" stroke="currentColor" strokeWidth="1.3" />
        <path d="M8 6v3l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M6 1h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "automations") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none">
        <path d="M6 2h4v4H6zM2 10h4v4H2zM10 10h4v4h-4z" stroke="currentColor" strokeWidth="1.3" />
        <path d="M8 6v2M6 10H4M10 10h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.42 1.42M11.54 11.54l1.41 1.41M3.05 12.95l1.42-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function ActivityRow({ icon, tone, color, text, detail, time }: { icon: string; tone: string; color: string; text: string; detail: string; time: string }) {
  return (
    <div className={styles.activityItem}>
      <div className={styles.activityIcon} style={{ background: tone, color }}>{icon}</div>
      <div className={styles.activityMain}>
        <strong>{text}</strong> {detail}
        <div className={styles.activityTime}>{time}</div>
      </div>
    </div>
  );
}

export function ToggleRow({
  label,
  desc,
  defaultOn = false,
  enabled,
  onToggle
}: {
  label: string;
  desc: string;
  defaultOn?: boolean;
  enabled?: boolean;
  onToggle?: (next: boolean) => void;
}) {
  const [localEnabled, setLocalEnabled] = useState(defaultOn);
  const isControlled = typeof enabled === "boolean";
  const isEnabled = isControlled ? Boolean(enabled) : localEnabled;
  return (
    <div className={styles.toggleRow}>
      <div>
        <div className={styles.toggleLabel}>{label}</div>
        <div className={styles.toggleDesc}>{desc}</div>
      </div>
      <button
        className={cx("toggle", isEnabled ? "toggleOn" : "toggleOff")}
        type="button"
        onClick={() => {
          const next = !isEnabled;
          if (isControlled) {
            onToggle?.(next);
            return;
          }
          setLocalEnabled(next);
          onToggle?.(next);
        }}
      >
        <span className={styles.toggleKnob} />
      </button>
    </div>
  );
}

export function TimeEntry({ dot, project, task, duration, date }: { dot: string; project: string; task: string; duration: string; date: string }) {
  return (
    <div className={styles.timeEntry}>
      <div className={styles.timeDot} style={{ background: dot }} />
      <div style={{ flex: 1 }}>
        <div className={styles.timeProject}>{project}</div>
        <div className={styles.timeTask}>{task}</div>
      </div>
      <div className={styles.timeDuration}>{duration}</div>
      <div className={styles.timeDate}>{date}</div>
    </div>
  );
}

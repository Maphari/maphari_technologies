"use client";

import { useEffect, useRef, useState } from "react";
import { cx } from "../style";
import { StaffEmptyState, EmptyIcons } from "../empty-state";
import { getStaffClients } from "../../../../lib/api/staff/clients";
import {
  loadStaffNotificationsWithRefresh,
  markAllStaffNotificationsReadWithRefresh,
  setStaffNotificationReadStateWithRefresh,
  type StaffNotificationJob
} from "../../../../lib/api/staff/notifications";
import { saveSession } from "../../../../lib/auth/session";
import type { AuthSession } from "../../../../lib/auth/session";
import type { PageId } from "../config";

type ClientRow = {
  id: string;
  name: string;
  avatar: string;
};

type NotificationType =
  | "message"
  | "milestone"
  | "invoice"
  | "approval"
  | "overdue"
  | "mention"
  | "system"
  | "suggestion"
  | "login";

type NotificationPriority = "critical" | "high" | "normal" | "low";

type NotificationItem = {
  id: string;
  clientId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body: string;
  time: string;
  createdAt: string;
  read: boolean;
  pinned: boolean;
};

function humanizeEnum(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatUsd(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function sanitizeText(input: string): string {
  return input
    .replace(/\(requested by [^)]+\)/gi, "")
    .replace(/agreement file [^;.\n]+[;.]?/gi, "")
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/ ;/g, ";")
    .trim();
}

function parseEmbeddedJson(input: string): Record<string, unknown> | null {
  const start = input.indexOf("{");
  const end = input.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(input.slice(start, end + 1));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function toFriendlyCopy(job: StaffNotificationJob): { title: string; body: string } {
  const cleanSubject = sanitizeText(job.subject ?? "");
  const cleanMessage = sanitizeText(job.message);
  const embedded = parseEmbeddedJson(job.message);

  const quotedNameMatch = cleanMessage.match(/requested a new project:\s*"([^"]+)"/i);
  const scopePrompt =
    typeof embedded?.scopePrompt === "string" && embedded.scopePrompt.trim().length > 0
      ? embedded.scopePrompt.trim().split("\n")[0]
      : null;
  const projectName = quotedNameMatch?.[1]?.trim() || scopePrompt;

  const looksLikeProjectRequest =
    /requested a new project/i.test(cleanMessage) ||
    /project_requested/i.test(cleanMessage) ||
    typeof embedded?.serviceType === "string";

  if (looksLikeProjectRequest) {
    const serviceType =
      typeof embedded?.serviceType === "string"
        ? humanizeEnum(embedded.serviceType)
        : (() => {
            const serviceMatch = cleanMessage.match(/service\s+([A-Z_]+)/i);
            return serviceMatch?.[1] ? humanizeEnum(serviceMatch[1]) : null;
          })();
    const estimateCents =
      typeof embedded?.estimatedQuoteCents === "number" ? embedded.estimatedQuoteCents : null;
    const depositCents =
      typeof embedded?.depositAmountCents === "number" ? embedded.depositAmountCents : null;
    const summaryParts = [
      serviceType ? `Service: ${serviceType}` : null,
      estimateCents !== null ? `Estimate: ${formatUsd(estimateCents)}` : null,
      depositCents !== null ? `Deposit: ${formatUsd(depositCents)}` : null
    ].filter((part): part is string => Boolean(part));

    return {
      title: projectName ? `New project request: ${projectName}` : "New project request",
      body:
        summaryParts.length > 0
          ? `${summaryParts.join(" · ")}. Review and assign staff.`
          : "A client submitted a new project request. Review and assign staff."
    };
  }

  const normalizedTitle = cleanSubject
    ? (/^[A-Z_]+$/.test(cleanSubject) ? humanizeEnum(cleanSubject) : cleanSubject)
    : "";
  const normalizedBody = cleanMessage.replace(/;/g, " · ").trim();

  return {
    title: normalizedTitle || typeConfig[tabToType(job.tab)].label,
    body: normalizedBody || "Open this notification to view details."
  };
}

// Clients loaded from API in component

const typeConfig: Record<NotificationType, { label: string; icon: React.ReactNode }> = {
  message: {
    label: "Message",
    icon: (
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M2 3.5A1.5 1.5 0 013.5 2h9A1.5 1.5 0 0114 3.5v7A1.5 1.5 0 0112.5 12H9l-3 2v-2H3.5A1.5 1.5 0 012 10.5v-7z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
      </svg>
    )
  },
  milestone: {
    label: "Milestone",
    icon: (
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.25"/>
        <circle cx="8" cy="8" r="2" fill="currentColor"/>
      </svg>
    )
  },
  invoice: {
    label: "Invoice",
    icon: (
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="3" y="2" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.25"/>
        <path d="M6 5.5h4M6 8h4M6 10.5h2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
      </svg>
    )
  },
  approval: {
    label: "Approval",
    icon: (
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M3 8.5l3.5 3.5 6.5-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  overdue: {
    label: "Overdue",
    icon: (
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.25"/>
        <path d="M8 5v3.5l2 1.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  mention: {
    label: "Mention",
    icon: (
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.25"/>
        <path d="M10.5 8a2.5 2.5 0 11-5 0 5 5 0 1010 0 5 5 0 00-5-5" stroke="currentColor" strokeWidth="1.25"/>
      </svg>
    )
  },
  system: {
    label: "System",
    icon: (
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.25"/>
        <path d="M8 5v3M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
  },
  suggestion: {
    label: "Suggestion",
    icon: (
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 2a4.5 4.5 0 011.5 8.74V12a.5.5 0 01-.5.5H7a.5.5 0 01-.5-.5v-1.26A4.5 4.5 0 018 2z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
        <path d="M6.5 14h3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
      </svg>
    )
  },
  login: {
    label: "Portal login",
    icon: (
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M9 3h3.5A1.5 1.5 0 0114 4.5v7A1.5 1.5 0 0112.5 13H9" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
        <path d="M6 10.5L3.5 8 6 5.5M3.5 8H10" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  }
};

const ALL_TYPES = Object.keys(typeConfig) as NotificationType[];

const initialNotifications: NotificationItem[] = [];
const NOTIFICATIONS_UI_KEY = "staff_notifications_ui_state_v1";

const priorityOrder: Record<NotificationPriority, number> = { critical: 0, high: 1, normal: 2, low: 3 };

const prefs: Array<{ key: NotificationType; label: string; default: boolean }> = [
  { key: "message",    label: "Client messages",   default: true  },
  { key: "milestone",  label: "Milestone activity", default: true  },
  { key: "invoice",    label: "Invoice alerts",     default: true  },
  { key: "approval",   label: "Approvals",          default: true  },
  { key: "overdue",    label: "Overdue warnings",   default: true  },
  { key: "mention",    label: "Mentions",           default: true  },
  { key: "suggestion", label: "Smart suggestions",  default: true  },
  { key: "login",      label: "Portal logins",      default: false },
  { key: "system",     label: "System reminders",   default: false }
];

type NotificationsUiState = {
  pinnedIds: string[];
  dismissedIds: string[];
};

function loadNotificationsUiState(userId: string): NotificationsUiState {
  if (typeof window === "undefined") return { pinnedIds: [], dismissedIds: [] };
  try {
    const raw = localStorage.getItem(`${NOTIFICATIONS_UI_KEY}:${userId}`);
    if (!raw) return { pinnedIds: [], dismissedIds: [] };
    const parsed = JSON.parse(raw) as Partial<NotificationsUiState>;
    return {
      pinnedIds: Array.isArray(parsed.pinnedIds) ? parsed.pinnedIds.filter((id): id is string => typeof id === "string") : [],
      dismissedIds: Array.isArray(parsed.dismissedIds) ? parsed.dismissedIds.filter((id): id is string => typeof id === "string") : []
    };
  } catch {
    return { pinnedIds: [], dismissedIds: [] };
  }
}

function saveNotificationsUiState(userId: string, state: NotificationsUiState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${NOTIFICATIONS_UI_KEY}:${userId}`, JSON.stringify(state));
  } catch {
    // no-op: localStorage can be unavailable in strict browser modes
  }
}

function timeGroup(createdAt: string): "Today" | "Yesterday" | "Earlier" {
  const ts = new Date(createdAt).getTime();
  if (!Number.isFinite(ts)) return "Earlier";
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  if (ts >= startOfToday) return "Today";
  if (ts >= startOfYesterday) return "Yesterday";
  return "Earlier";
}

function ActionBtn({ label, tone, onClick }: { label: string; tone: NotificationType; onClick?: () => void }) {
  return (
    <button type="button" className={cx("snActionBtn")} data-tone={tone} onClick={onClick}>
      {label}
      <span className={cx("snActionBtnIcon")} aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path d="M3 8h9M8.5 3.5L13 8l-4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    </button>
  );
}

function PinIcon({ active }: { active: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M10.7 2.5l2.8 2.8-2 2v2L9.8 11v2.5L8.3 12 6 14.3V11L4.5 9.5v-2l-2-2 2.8-2.8z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
      {active ? <path d="M6.5 6.5h3v2.8h-3z" fill="currentColor" /> : null}
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3.5 3.5l9 9m0-9l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function CaretIcon({ open }: { open: boolean }) {
  return (
    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true" className={cx("snTypeMenuCaretIcon", open && "snTypeMenuCaretIconOpen")}>
      <path d="M4 6.5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function tabToType(tab: string): NotificationType {
  const map: Record<string, NotificationType> = {
    messages: "message",
    projects: "milestone",
    invoices: "invoice",
    dashboard: "system",
    settings: "system",
    operations: "system"
  };
  return map[tab] ?? "system";
}

export function NotificationsPage({
  isActive,
  session,
  onNavigate
}: {
  isActive: boolean;
  session: AuthSession | null;
  onNavigate?: (page: PageId) => void;
}) {
  const [notifs, setNotifs] = useState(initialNotifications);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<ClientRow[]>([{ id: "internal", name: "Internal", avatar: "IN" }]);
  const [filter, setFilter] = useState<"all" | "unread" | "pinned">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | NotificationType>("all");
  const [showPrefs, setShowPrefs] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const [enabled, setEnabled] = useState<Record<NotificationType, boolean>>(
    () => Object.fromEntries(prefs.map((p) => [p.key, p.default])) as Record<NotificationType, boolean>
  );
  const [selected, setSelected] = useState<NotificationItem | null>(null);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const typeMenuRef = useRef<HTMLDivElement | null>(null);

  const syncNotificationsUiState = (rows: NotificationItem[]) => {
    if (!session) return;
    const state: NotificationsUiState = {
      pinnedIds: rows.filter((row) => row.pinned).map((row) => row.id),
      dismissedIds: []
    };
    const previous = loadNotificationsUiState(session.user.id);
    saveNotificationsUiState(session.user.id, { ...state, dismissedIds: previous.dismissedIds });
  };

  useEffect(() => {
    if (!session || !isActive) return;
    let cancelled = false;
    void getStaffClients(session).then((r) => {
      if (cancelled) return;
      if (r.nextSession) saveSession(r.nextSession);
      if (r.data) {
        setClients([
          { id: "internal", name: "Internal", avatar: "IN" },
          ...r.data.map((c) => ({
            id: c.id,
            name: c.name,
            avatar: c.name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase()
          }))
        ]);
      }
    });
    return () => { cancelled = true; };
  }, [session, isActive]);

  useEffect(() => {
    if (!session || !isActive) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    const uiState = loadNotificationsUiState(session.user.id);
    const pinnedSet = new Set(uiState.pinnedIds);
    const dismissedSet = new Set(uiState.dismissedIds);
    void loadStaffNotificationsWithRefresh(session).then((r) => {
      if (cancelled) return;
      if (r.nextSession) saveSession(r.nextSession);
      if (r.data) {
        setNotifs(
          r.data
            .filter((job) => !dismissedSet.has(job.id))
            .map((job) => {
            const copy = toFriendlyCopy(job);
            return {
            id: job.id,
            clientId: job.clientId ?? "internal",
            type: tabToType(job.tab),
            priority: (job.status === "FAILED" ? "critical" : "normal") as NotificationPriority,
            title: copy.title,
            body: copy.body,
            createdAt: job.createdAt,
            time: (() => {
              const diffMs = Date.now() - new Date(job.createdAt).getTime();
              const mins = Math.floor(diffMs / 60000);
              if (mins < 60) return `${mins}min ago`;
              const hours = Math.floor(mins / 60);
              if (hours < 24) return `${hours}h ago`;
              if (hours < 48) return "Yesterday";
              return new Date(job.createdAt).toLocaleDateString();
            })(),
            read: job.readAt !== null,
            pinned: pinnedSet.has(job.id)
          };
          })
        );
      }
    }).catch(() => {
      // silently swallow — notifications are non-critical; list stays empty
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [session, isActive]);

  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    const interval = window.setInterval(() => setPulse((p) => !p), 1400);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!filtersOpen) setTypeMenuOpen(false);
  }, [filtersOpen]);

  useEffect(() => {
    function onDocumentClick(event: MouseEvent): void {
      if (!typeMenuOpen) return;
      if (typeMenuRef.current && !typeMenuRef.current.contains(event.target as Node)) {
        setTypeMenuOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") setTypeMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocumentClick);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocumentClick);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [typeMenuOpen]);

  const markRead = (id: string) => {
    setNotifs((prev) => {
      const updated = prev.map((row) => (row.id === id ? { ...row, read: true } : row));
      const target = updated.find((row) => row.id === id);
      if (target?.id && session) {
        void setStaffNotificationReadStateWithRefresh(session, target.id, true).then((r) => {
          if (r.nextSession) saveSession(r.nextSession);
        });
      }
      return updated;
    });
  };

  const markAllRead = async () => {
    if (!session || markingAllRead) return;
    setMarkingAllRead(true);
    try {
      const result = await markAllStaffNotificationsReadWithRefresh(session);
      if (result.nextSession) saveSession(result.nextSession);
      if (!result.error) {
        setNotifs((prev) => prev.map((row) => ({ ...row, read: true })));
      }
    } finally {
      setMarkingAllRead(false);
    }
  };

  const dismiss = (id: string) => {
    setNotifs((prev) => {
      const updated = prev.filter((row) => row.id !== id);
      if (session) {
        const previous = loadNotificationsUiState(session.user.id);
        const dismissedIds = Array.from(new Set([...previous.dismissedIds, id]));
        saveNotificationsUiState(session.user.id, {
          pinnedIds: updated.filter((row) => row.pinned).map((row) => row.id),
          dismissedIds
        });
      }
      return updated;
    });
    setSelected((prev) => (prev?.id === id ? null : prev));
  };

  const togglePin = (id: string) => {
    setNotifs((prev) => {
      const updated = prev.map((row) => (row.id === id ? { ...row, pinned: !row.pinned } : row));
      syncNotificationsUiState(updated);
      return updated;
    });
    setSelected((prev) => (prev?.id === id ? { ...prev, pinned: !prev.pinned } : prev));
  };

  const toggleType = (key: NotificationType) =>
    setEnabled((prev) => ({ ...prev, [key]: !prev[key] }));

  const open = (row: NotificationItem) => {
    setSelected(row);
    markRead(row.id);
  };

  const allEnabled = prefs.every((p) => enabled[p.key]);
  const toggleAll = () => {
    const next = !allEnabled;
    setEnabled(Object.fromEntries(prefs.map((p) => [p.key, next])) as Record<NotificationType, boolean>);
  };

  const visible = notifs
    .filter((row) => enabled[row.type])
    .filter((row) => (filter === "all" ? true : filter === "unread" ? !row.read : row.pinned))
    .filter((row) => typeFilter === "all" || row.type === typeFilter)
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      const priorityDelta = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDelta !== 0) return priorityDelta;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const unread = notifs.filter((row) => !row.read && enabled[row.type]).length;
  const critical = notifs.filter((row) => row.priority === "critical" && !row.read).length;
  const pinned = notifs.filter((row) => row.pinned).length;
  const grouped = (["Today", "Yesterday", "Earlier"] as const).reduce(
    (acc, group) => {
      const items = visible.filter((row) => timeGroup(row.createdAt) === group);
      if (items.length > 0) acc[group] = items;
      return acc;
    },
    {} as Partial<Record<"Today" | "Yesterday" | "Earlier", NotificationItem[]>>
  );

  return (
    <section className={cx("page", "pageBody", "notificationsPage", isActive && "pageActive")} id="page-notifications">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className={cx("pageHeaderBar", "snHeader")}>
        <div className={cx("flexBetween", "gap24", "mb20")}>
          <div>
            <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Communication</div>
            <h1 className={cx("pageTitleText")}>Notifications</h1>
            <p className={cx("pageSubtitleText")}>Queue triage · Delivery status · Channel health</p>
          </div>

          <div className={cx("pageActions", "snHeaderActions")}>
            {unread > 0 && (
              <div className={cx("snUnreadPulse")}>
                <span className={cx("snUnreadDot", pulse ? "snUnreadDotOn" : "snUnreadDotOff")} />
                <span className={cx("text10", "tracking", "uppercase", "colorRed")}>{unread} unread</span>
              </div>
            )}

            <div className={cx("snTopStats")}>
              {[
                { label: "Critical", value: critical, toneClass: critical > 0 ? "colorRed"    : "colorMuted2" },
                { label: "Pinned",   value: pinned,   toneClass: pinned   > 0 ? "colorAmber"  : "colorMuted2" },
                { label: "Unread",   value: unread,   toneClass: unread   > 0 ? "colorAccent" : "colorMuted2" }
              ].map((stat) => (
                <div key={stat.label} className={cx("snStatCard")}>
                  <div className={cx("statLabelNew")}>{stat.label}</div>
                  <div className={cx("statValueNew", stat.toneClass)}>{stat.value}</div>
                </div>
              ))}
            </div>

            <div className={cx("snHeaderBtns")}>
              <button
                type="button"
                className={cx("snIconBtn", "snPrefsBtn", showPrefs && "snPrefsBtnActive")}
                onClick={() => setShowPrefs((p) => !p)}
              >
                {showPrefs ? "Back" : "Preferences"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter strip (only in list view) ───────────────────────── */}
      {!showPrefs && (
        <div className={cx("snFilterWrap")}>
          <div className={cx("snFilterRow", !filtersOpen && "snFilterRowCollapsed")}>
            <button
              type="button"
              className={cx("snFilterToggle", filtersOpen && "snFilterToggleOpen")}
              onClick={() => setFiltersOpen((prev) => !prev)}
              aria-expanded={filtersOpen}
              aria-controls="sn-filter-controls"
            >
              Filters
            </button>

            <div id="sn-filter-controls" className={cx("snFilterControls")}>
              {/* Status pills */}
              {(["all", "unread", "pinned"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={cx("snFilterPill", filter === f ? "snFilterPillActive" : "snFilterPillIdle")}
                  onClick={() => setFilter(f)}
                >
                  {f === "all" ? "All" : f === "unread" ? `Unread${unread > 0 ? ` · ${unread}` : ""}` : `Pinned${pinned > 0 ? ` · ${pinned}` : ""}`}
                </button>
              ))}

              <div className={cx("snFilterDivider")} />

              {/* Type menu */}
              <div ref={typeMenuRef} className={cx("snTypeMenu")}>
                <button
                  type="button"
                  className={cx("snTypeMenuBtn", typeMenuOpen && "snTypeMenuBtnActive")}
                  onClick={() => setTypeMenuOpen((prev) => !prev)}
                  aria-haspopup="menu"
                  aria-expanded={typeMenuOpen}
                >
                  <span className={cx("snTypeMenuLabel")}>
                    {typeFilter === "all" ? "All types" : typeConfig[typeFilter].label}
                  </span>
                  <span className={cx("snTypeMenuCaret")} aria-hidden="true">
                    <CaretIcon open={typeMenuOpen} />
                  </span>
                </button>

                {typeMenuOpen && (
                  <div className={cx("snTypeMenuList")} role="menu">
                    <button
                      type="button"
                      role="menuitemradio"
                      aria-checked={typeFilter === "all"}
                      className={cx("snTypeMenuItem", typeFilter === "all" ? "snTypeMenuItemActive" : "snTypeMenuItemIdle")}
                      data-type="system"
                      onClick={() => { setTypeFilter("all"); setTypeMenuOpen(false); }}
                    >
                      All types
                    </button>
                    {ALL_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        role="menuitemradio"
                        aria-checked={typeFilter === type}
                        className={cx("snTypeMenuItem", typeFilter === type ? "snTypeMenuItemActive" : "snTypeMenuItemIdle")}
                        data-type={type}
                        onClick={() => { setTypeFilter(type); setTypeMenuOpen(false); }}
                      >
                        {typeConfig[type].label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Mark all read – pushed right */}
              <div className={cx("snMarkAllWrap")}>
                {unread > 0 && (
                  <button type="button" className={cx("snIconBtn", "snMarkAllBtn")} onClick={() => { void markAllRead(); }} disabled={markingAllRead}>
                    {markingAllRead ? "Marking..." : "Mark all read"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Preferences panel ──────────────────────────────────────── */}
      {showPrefs ? (
        <div className={cx("snPrefsPanel")}>
          <div className={cx("flexBetween", "mb6")}>
            <div>
              <div className={cx("snPrefsTitle")}>Notification Preferences</div>
              <div className={cx("snPrefsSub")}>Choose which notifications appear in your centre.</div>
            </div>
            <button
              type="button"
              className={cx("snIconBtn", "snMarkAllBtn", "noWrap")}
              onClick={toggleAll}
            >
              {allEnabled ? "Disable all" : "Enable all"}
            </button>
          </div>

          {prefs.map((pref) => (
            <div key={pref.key} className={cx("snPrefRow")}>
              <div className={cx("snPrefLeft")}>
                <span className={cx("snPrefIcon")} data-type={pref.key}>
                  {typeConfig[pref.key].icon}
                </span>
                <span className={cx("snPrefLabel")}>{pref.label}</span>
              </div>

              <button
                type="button"
                className={cx("snToggle", "snToggleTrack", enabled[pref.key] ? "snToggleTrackOn" : "snToggleTrackOff")}
                onClick={() => toggleType(pref.key)}
                aria-label={`Toggle ${pref.label}`}
                aria-pressed={enabled[pref.key]}
              >
                <span className={cx("snToggleText")}>{enabled[pref.key] ? "On" : "Off"}</span>
              </button>
            </div>
          ))}
        </div>

      ) : (

        /* ── Notification list + detail pane ───────────────────────── */
        <div className={cx("snLayout", selected && "snLayoutWithDetail")}>

          {/* List pane */}
          <div className={cx("snListPane", selected && "snListPaneWithDetail")}>
            {loading ? (
              <div className={cx("snEmptyState")}>
                <div className={cx("snEmptyText", "colorMuted2")}>Loading notifications…</div>
              </div>
            ) : visible.length === 0 ? (
              <StaffEmptyState icon={EmptyIcons.bell} title="All caught up" sub="No notifications match the current filter." />
            ) : null}

            {(["Today", "Yesterday", "Earlier"] as const).map((group) => {
              const items = grouped[group];
              if (!items?.length) return null;

              return (
                <div key={group} className={cx("snGroup")}>
                  <div className={cx("staffSectionHd", "snGroupHeader")}>
                    <span className={cx("staffSectionTitle", "snGroupLabel")}>{group}</span>
                  </div>

                  <div className={cx("snGroupList")}>
                    {items.map((row) => {
                      const tc = typeConfig[row.type];
                      const cl = clients.find((c) => c.id === row.clientId);
                      const isNew = !row.read;
                      const isSelected = selected?.id === row.id;

                      return (
                        <div
                          key={row.id}
                          className={cx(
                            "staffListRow",
                            "snNotifRow",
                            "snRowCard",
                            isSelected && "snRowSelected",
                            isNew ? "snRowUnread" : "snRowRead",
                            isNew && "staffNotifUnread"
                          )}
                          data-priority={row.priority}
                          data-pinned={row.pinned ? "true" : "false"}
                          role="button"
                          tabIndex={0}
                          onClick={() => open(row)}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(row); } }}
                        >
                          <span
                            className={cx("snPriorityDot")}
                            data-new={isNew ? "true" : "false"}
                            data-priority={row.priority}
                          />

                          <div className={cx("snTypeIcon")} data-type={row.type}>{tc.icon}</div>

                          <div className={cx("snRowMain")}>
                            <div className={cx("snRowMeta")}>
                              {cl && <span className={cx("snClientName")} data-client-id={String(cl.id)}>{cl.name}</span>}
                              {row.pinned && (
                                <span className={cx("snPinnedGlyph")} aria-label="Pinned">
                                  <PinIcon active />
                                </span>
                              )}
                              {row.priority === "critical" && <span className={cx("snCriticalBadge")}>CRITICAL</span>}
                              {row.priority === "high"     && <span className={cx("snHighBadge")}>HIGH</span>}
                            </div>

                            <div className={cx("snRowTitle", isNew ? "snRowTitleUnread" : "snRowTitleRead")}>{row.title}</div>
                            <div className={cx("snRowBody", "truncate")}>{row.body}</div>
                          </div>

                          <div className={cx("snRowSide")}>
                            <span className={cx("snRowTime")}>{row.time}</span>
                            <div className={cx("snRowActions")}>
                              <button
                                type="button"
                                className={cx("snIconBtn", "snRowPinBtn", row.pinned && "snRowPinBtnActive")}
                                title={row.pinned ? "Unpin" : "Pin"}
                                onClick={(e) => { e.stopPropagation(); togglePin(row.id); }}
                              >
                                <PinIcon active={row.pinned} />
                              </button>
                              <button
                                type="button"
                                className={cx("snIconBtn", "snRowDismissBtn")}
                                title="Dismiss"
                                onClick={(e) => { e.stopPropagation(); dismiss(row.id); }}
                              >
                                <CloseIcon />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail pane */}
          {selected && (() => {
            const tc = typeConfig[selected.type];
            const cl = clients.find((c) => c.id === selected.clientId);

            return (
              <div className={cx("snDetailPane")}>
                <div className={cx("snDetailHeader")}>
                  <div className={cx("snTypeIcon", "snDetailTypeIcon")} data-type={selected.type}>{tc.icon}</div>
                  <div>
                    <div className={cx("snTypeLabel")} data-type={selected.type}>{tc.label}</div>
                    <div className={cx("text10", "colorMuted2")}>{selected.time}</div>
                  </div>
                  <button
                    type="button"
                    className={cx("snIconBtn", "snDetailClose")}
                    aria-label="Close detail"
                    onClick={() => setSelected(null)}
                  >
                    <CloseIcon />
                  </button>
                </div>

                {cl && (
                  <div className={cx("snClientChip")} data-client-id={String(cl.id)}>
                    <div className={cx("snClientAvatarMini")} data-client-id={String(cl.id)}>{cl.avatar}</div>
                    <span className={cx("snClientName", "snClientNameSm")} data-client-id={String(cl.id)}>{cl.name}</span>
                  </div>
                )}

                <div>
                  <div className={cx("snDetailTitle")}>{selected.title}</div>
                  <div className={cx("snDetailBody")}>{selected.body}</div>
                </div>

                <div className={cx("snDetailActions")}>
                  {selected.type === "message"    && <ActionBtn label="Reply to message"  tone="message"    onClick={() => { markRead(selected.id); setSelected(null); onNavigate?.("comms"); }} />}
                  {selected.type === "milestone"   && <ActionBtn label="Open milestone"    tone="milestone"  onClick={() => { markRead(selected.id); setSelected(null); onNavigate?.("deliverables"); }} />}
                  {selected.type === "invoice"     && <ActionBtn label="View invoice"      tone="invoice"    onClick={() => { markRead(selected.id); setSelected(null); onNavigate?.("invoiceviewer"); }} />}
                  {selected.type === "overdue"     && <ActionBtn label="Escalate now"      tone="overdue"    onClick={() => { markRead(selected.id); setSelected(null); onNavigate?.("deliverables"); }} />}
                  {selected.type === "approval"    && <ActionBtn label="View approvals"    tone="approval"   onClick={() => { markRead(selected.id); setSelected(null); onNavigate?.("approvalqueue"); }} />}
                  {selected.type === "suggestion"  && <ActionBtn label="View suggestion"   tone="suggestion" onClick={() => { markRead(selected.id); setSelected(null); onNavigate?.("smartsuggestions"); }} />}
                  {selected.type === "mention"     && <ActionBtn label="View thread"       tone="mention"    onClick={() => { markRead(selected.id); setSelected(null); onNavigate?.("comms"); }} />}
                  {selected.type === "system"      && <ActionBtn label="Open operations"   tone="system"     onClick={() => { markRead(selected.id); setSelected(null); onNavigate?.("automations"); }} />}
                  {selected.type === "login"       && <ActionBtn label="Open security"     tone="login"      onClick={() => { markRead(selected.id); setSelected(null); onNavigate?.("settings"); }} />}

                  <button
                    type="button"
                    className={cx("snDetailActionBtn", selected.pinned ? "snDetailActionBtnPinned" : "colorMuted2")}
                    onClick={() => togglePin(selected.id)}
                  >
                    {selected.pinned ? "Unpin notification" : "Pin notification"}
                  </button>

                  <button
                    type="button"
                    className={cx("snDetailActionBtn", "snDismissBtn", "colorMuted2")}
                    onClick={() => dismiss(selected.id)}
                  >
                    Dismiss notification
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </section>
  );
}

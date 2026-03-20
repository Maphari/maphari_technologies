"use client";

import { useEffect, useRef, useState } from "react";
import { cx } from "../style";
import { getStaffClients } from "../../../../lib/api/staff/clients";
import {
  loadStaffNotificationsWithRefresh,
  setStaffNotificationReadStateWithRefresh
} from "../../../../lib/api/staff/notifications";
import { saveSession } from "../../../../lib/auth/session";
import type { AuthSession } from "../../../../lib/auth/session";

type ClientRow = {
  id: number;
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
  id: number;
  clientId: number;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body: string;
  time: string;
  read: boolean;
  pinned: boolean;
  _apiId?: string;
};

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

function timeGroup(value: string): "Today" | "Yesterday" | "Earlier" {
  if (value.includes("min") || value.includes("h ago")) return "Today";
  if (value.startsWith("Yesterday")) return "Yesterday";
  return "Earlier";
}

function ActionBtn({ label, tone, onClick }: { label: string; tone: NotificationType; onClick?: () => void }) {
  return (
    <button type="button" className={cx("snActionBtn")} data-tone={tone} onClick={onClick}>
      {label} →
    </button>
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

export function NotificationsPage({ isActive, session }: { isActive: boolean; session: AuthSession | null }) {
  const [notifs, setNotifs] = useState(initialNotifications);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<ClientRow[]>([{ id: 0, name: "Internal", avatar: "IN" }]);
  const [filter, setFilter] = useState<"all" | "unread" | "pinned">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | NotificationType>("all");
  const [showPrefs, setShowPrefs] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const [enabled, setEnabled] = useState<Record<NotificationType, boolean>>(
    () => Object.fromEntries(prefs.map((p) => [p.key, p.default])) as Record<NotificationType, boolean>
  );
  const [selected, setSelected] = useState<NotificationItem | null>(null);
  const typeMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!session || !isActive) return;
    let cancelled = false;
    void getStaffClients(session).then((r) => {
      if (cancelled) return;
      if (r.nextSession) saveSession(r.nextSession);
      if (r.data) {
        setClients([
          { id: 0, name: "Internal", avatar: "IN" },
          ...r.data.map((c, i) => ({
            id: i + 1,
            name: c.name,
            avatar: c.name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase()
          }))
        ]);
      }
    });
    return () => { cancelled = true; };
  }, [session, isActive]);

  useEffect(() => {
    if (!session || !isActive) return;
    let cancelled = false;
    setLoading(true);
    void loadStaffNotificationsWithRefresh(session).then((r) => {
      if (cancelled) return;
      if (r.nextSession) saveSession(r.nextSession);
      if (r.data) {
        setNotifs(
          r.data.map((job, idx) => ({
            id: idx + 1,
            clientId: 0,
            type: tabToType(job.tab),
            priority: (job.status === "FAILED" ? "critical" : "normal") as NotificationPriority,
            title: job.subject ?? job.message.slice(0, 60),
            body: job.message,
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
            pinned: false,
            _apiId: job.id
          })) as Array<NotificationItem & { _apiId: string }>
        );
      }
    }).catch(() => {
      // silently swallow — notifications are non-critical; list stays empty
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [session?.accessToken, isActive]);

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

  const markRead = (id: number) => {
    setNotifs((prev) => {
      const updated = prev.map((row) => (row.id === id ? { ...row, read: true } : row));
      const target = updated.find((row) => row.id === id);
      if (target?._apiId && session) {
        void setStaffNotificationReadStateWithRefresh(session, target._apiId, true).then((r) => {
          if (r.nextSession) saveSession(r.nextSession);
        });
      }
      return updated;
    });
  };

  const markAllRead = () => setNotifs((prev) => prev.map((row) => ({ ...row, read: true })));

  const dismiss = (id: number) => {
    setNotifs((prev) => prev.filter((row) => row.id !== id));
    setSelected((prev) => (prev?.id === id ? null : prev));
  };

  const togglePin = (id: number) => {
    setNotifs((prev) => prev.map((row) => (row.id === id ? { ...row, pinned: !row.pinned } : row)));
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
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

  const unread = notifs.filter((row) => !row.read && enabled[row.type]).length;
  const critical = notifs.filter((row) => row.priority === "critical" && !row.read).length;
  const pinned = notifs.filter((row) => row.pinned).length;
  const grouped = (["Today", "Yesterday", "Earlier"] as const).reduce(
    (acc, group) => {
      const items = visible.filter((row) => timeGroup(row.time) === group);
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

            <button
              type="button"
              className={cx("snIconBtn", "snPrefsBtn", showPrefs && "snPrefsBtnActive")}
              onClick={() => setShowPrefs((p) => !p)}
            >
              {showPrefs ? "← Back" : "Preferences"}
            </button>
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
                    {typeMenuOpen ? "▲" : "▼"}
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
                  <button type="button" className={cx("snIconBtn", "snMarkAllBtn")} onClick={markAllRead}>
                    Mark all read
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
                <span className={cx("snToggleKnob", enabled[pref.key] ? "snToggleKnobOn" : "snToggleKnobOff")} />
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
              <div className={cx("snEmptyState")}>
                <div className={cx("snEmptyIcon")}>
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                    <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.5" opacity="0.25"/>
                    <path d="M11 16.5l3.5 3.5 6.5-7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className={cx("snEmptyText")}>All caught up</div>
              </div>
            ) : null}

            {(["Today", "Yesterday", "Earlier"] as const).map((group) => {
              const items = grouped[group];
              if (!items?.length) return null;

              return (
                <div key={group} className={cx("snGroup")}>
                  <div className={cx("snGroupHeader")}>
                    <span className={cx("snGroupLabel")}>{group}</span>
                    <div className={cx("snGroupLine")} />
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
                          className={cx("snNotifRow", "snRowCard", isSelected && "snRowSelected", isNew ? "snRowUnread" : "snRowRead")}
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
                              {row.pinned && <span className={cx("snPinnedGlyph")}>◈</span>}
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
                                {row.pinned ? "◈" : "◇"}
                              </button>
                              <button
                                type="button"
                                className={cx("snIconBtn", "snRowDismissBtn")}
                                title="Dismiss"
                                onClick={(e) => { e.stopPropagation(); dismiss(row.id); }}
                              >
                                ×
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
                    ×
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
                  {selected.type === "message"    && <ActionBtn label="Reply to message"  tone="message"    onClick={() => { markRead(selected.id); setSelected(null); }} />}
                  {selected.type === "milestone"   && <ActionBtn label="Open milestone"    tone="milestone"  onClick={() => { markRead(selected.id); setSelected(null); }} />}
                  {selected.type === "invoice"     && <ActionBtn label="View invoice"      tone="invoice"    onClick={() => { markRead(selected.id); setSelected(null); }} />}
                  {selected.type === "overdue"     && <ActionBtn label="Escalate now"      tone="overdue"    onClick={() => { markRead(selected.id); setSelected(null); }} />}
                  {selected.type === "approval"    && <ActionBtn label="View milestone"    tone="approval"   onClick={() => { markRead(selected.id); setSelected(null); }} />}
                  {selected.type === "suggestion"  && <ActionBtn label="View suggestion"   tone="suggestion" onClick={() => { markRead(selected.id); setSelected(null); }} />}
                  {selected.type === "mention"     && <ActionBtn label="View note"         tone="mention"    onClick={() => { markRead(selected.id); setSelected(null); }} />}

                  <button
                    type="button"
                    className={cx("snDetailActionBtn", selected.pinned ? "snDetailActionBtnPinned" : "colorMuted2")}
                    onClick={() => togglePin(selected.id)}
                  >
                    {selected.pinned ? "◈ Unpin notification" : "◇ Pin notification"}
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

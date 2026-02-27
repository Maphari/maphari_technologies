"use client";

import { useEffect, useState } from "react";
import { cx } from "../style";

type ClientRow = {
  id: number;
  name: string;
  avatar: string;
  color: string;
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
};

const clients: ClientRow[] = [
  { id: 0, name: "Internal", avatar: "IN", color: "#a0a0b0" },
  { id: 1, name: "Volta Studios", avatar: "VS", color: "var(--accent)" },
  { id: 2, name: "Kestrel Capital", avatar: "KC", color: "#a78bfa" },
  { id: 3, name: "Mira Health", avatar: "MH", color: "#60a5fa" },
  { id: 4, name: "Dune Collective", avatar: "DC", color: "#f5c518" },
  { id: 5, name: "Okafor & Sons", avatar: "OS", color: "#ff8c00" }
];

const typeConfig: Record<NotificationType, { icon: string; color: string; label: string; bg: string }> = {
  message: { icon: "✉", color: "#60a5fa", label: "Message", bg: "rgba(96,165,250,0.1)" },
  milestone: { icon: "◎", color: "#a78bfa", label: "Milestone", bg: "rgba(167,139,250,0.1)" },
  invoice: { icon: "₹", color: "var(--accent)", label: "Invoice", bg: "color-mix(in srgb, var(--accent) 10%, transparent)" },
  approval: { icon: "✓", color: "var(--accent)", label: "Approval", bg: "color-mix(in srgb, var(--accent) 10%, transparent)" },
  overdue: { icon: "⚑", color: "#ff4444", label: "Overdue", bg: "rgba(255,68,68,0.1)" },
  mention: { icon: "@", color: "#f5c518", label: "Mention", bg: "rgba(245,197,24,0.1)" },
  system: { icon: "◈", color: "#a0a0b0", label: "System", bg: "rgba(160,160,176,0.08)" },
  suggestion: { icon: "◉", color: "#ff8c00", label: "Suggestion", bg: "rgba(255,140,0,0.1)" },
  login: { icon: "◌", color: "#ff8c00", label: "Portal login", bg: "rgba(255,140,0,0.1)" }
};

const initialNotifications: NotificationItem[] = [
  {
    id: 1,
    clientId: 4,
    type: "overdue",
    priority: "critical",
    title: "Dune Collective - 6 days silent",
    body: "Kofi Asante has not responded to 3 follow-ups. Milestone 12 days overdue. Consider escalating.",
    time: "2 min ago",
    read: false,
    pinned: true
  },
  {
    id: 2,
    clientId: 2,
    type: "invoice",
    priority: "high",
    title: "Invoice overdue - Kestrel Capital",
    body: "INV-0038 (R21,000) is 7 days past due. Marcus mentioned AP delays but no payment confirmed.",
    time: "18 min ago",
    read: false,
    pinned: true
  },
  {
    id: 3,
    clientId: 1,
    type: "message",
    priority: "normal",
    title: "New message from Lena Muller",
    body: "Re: Logo direction - Love the amber palette shift. Can we see the wordmark in a dark version?",
    time: "1h ago",
    read: false,
    pinned: false
  },
  {
    id: 4,
    clientId: 3,
    type: "login",
    priority: "normal",
    title: "Mira Health logged into portal",
    body: "Dr. Amara Nkosi viewed the revised wireframes. No action taken yet.",
    time: "2h ago",
    read: false,
    pinned: false
  },
  {
    id: 5,
    clientId: 5,
    type: "approval",
    priority: "normal",
    title: "Milestone approved - Okafor & Sons",
    body: "Chidi Okafor approved the Layout & Typesetting milestone. Ready to begin cover design.",
    time: "3h ago",
    read: true,
    pinned: false
  },
  {
    id: 6,
    clientId: 2,
    type: "milestone",
    priority: "normal",
    title: "Kestrel Capital viewed strategy deck",
    body: "Marcus Rehn spent 8 minutes reviewing the Campaign Strategy deck.",
    time: "4h ago",
    read: true,
    pinned: false
  },
  {
    id: 7,
    clientId: 0,
    type: "suggestion",
    priority: "normal",
    title: "Smart suggestion: Pitch 2026 retainer",
    body: "Okafor project nearing close. High satisfaction score. Good time to propose a recurring engagement.",
    time: "5h ago",
    read: false,
    pinned: false
  },
  {
    id: 8,
    clientId: 1,
    type: "system",
    priority: "low",
    title: "Retainer approaching 80% burn",
    body: "Volta Studios retainer is at 78% with 8 days remaining in the cycle.",
    time: "Yesterday 4 PM",
    read: true,
    pinned: false
  },
  {
    id: 9,
    clientId: 3,
    type: "mention",
    priority: "normal",
    title: "You were mentioned in a note",
    body: "Admin left a note: @you - please confirm clinical review timeline with Mira before Thursday.",
    time: "Yesterday 2 PM",
    read: false,
    pinned: false
  },
  {
    id: 10,
    clientId: 0,
    type: "system",
    priority: "low",
    title: "Standup log not submitted",
    body: "You have not submitted today's standup log. Reminder to complete before end of day.",
    time: "Yesterday 9 AM",
    read: true,
    pinned: false
  },
  {
    id: 11,
    clientId: 4,
    type: "overdue",
    priority: "high",
    title: "Dune retainer exceeded",
    body: "Dune Collective retainer exceeded by 4.5 hours. Flag to account manager before logging more time.",
    time: "Feb 21",
    read: true,
    pinned: false
  },
  {
    id: 12,
    clientId: 1,
    type: "approval",
    priority: "normal",
    title: "Milestone approved - Volta Studios",
    body: "Lena Muller approved the Brand Colour System milestone. Well done.",
    time: "Feb 20",
    read: true,
    pinned: false
  }
];

const priorityOrder: Record<NotificationPriority, number> = { critical: 0, high: 1, normal: 2, low: 3 };

const prefs: Array<{ key: NotificationType; label: string; default: boolean }> = [
  { key: "message", label: "Client messages", default: true },
  { key: "milestone", label: "Milestone activity", default: true },
  { key: "invoice", label: "Invoice alerts", default: true },
  { key: "approval", label: "Approvals", default: true },
  { key: "overdue", label: "Overdue warnings", default: true },
  { key: "mention", label: "Mentions", default: true },
  { key: "suggestion", label: "Smart suggestions", default: true },
  { key: "login", label: "Portal logins", default: false },
  { key: "system", label: "System reminders", default: false }
];

function timeGroup(value: string): "Today" | "Yesterday" | "Earlier" {
  if (value.includes("min") || value.includes("h ago")) return "Today";
  if (value.startsWith("Yesterday")) return "Yesterday";
  return "Earlier";
}

function ActionBtn({ label, color }: { label: string; color: string }) {
  return (
    <button
      style={{
        padding: "10px 14px",
        background: `${color}10`,
        border: `1px solid ${color}30`,
        borderRadius: 3,
        color,
        fontSize: 11,
        cursor: "pointer",
        fontFamily: "'DM Mono',monospace",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        textAlign: "left"
      }}
    >
      -&gt; {label}
    </button>
  );
}

export function NotificationsPage({ isActive }: { isActive: boolean }) {
  const [notifs, setNotifs] = useState(initialNotifications);
  const [filter, setFilter] = useState<"all" | "unread" | "pinned">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | NotificationType>("all");
  const [showPrefs, setShowPrefs] = useState(false);
  const [enabled, setEnabled] = useState<Record<NotificationType, boolean>>(
    () => Object.fromEntries(prefs.map((pref) => [pref.key, pref.default])) as Record<NotificationType, boolean>
  );
  const [selected, setSelected] = useState<NotificationItem | null>(null);
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    const interval = window.setInterval(() => setPulse((previous) => !previous), 1400);
    return () => window.clearInterval(interval);
  }, []);

  const markRead = (id: number) =>
    setNotifs((previous) => previous.map((row) => (row.id === id ? { ...row, read: true } : row)));
  const markAllRead = () => setNotifs((previous) => previous.map((row) => ({ ...row, read: true })));
  const dismiss = (id: number) => setNotifs((previous) => previous.filter((row) => row.id !== id));
  const togglePin = (id: number) =>
    setNotifs((previous) => previous.map((row) => (row.id === id ? { ...row, pinned: !row.pinned } : row)));
  const toggleType = (key: NotificationType) =>
    setEnabled((previous) => ({ ...previous, [key]: !previous[key] }));

  const open = (row: NotificationItem) => {
    setSelected(row);
    markRead(row.id);
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

  const grouped: Partial<Record<"Today" | "Yesterday" | "Earlier", NotificationItem[]>> = ["Today", "Yesterday", "Earlier"].reduce(
    (acc, group) => {
      const items = visible.filter((row) => timeGroup(row.time) === group);
      if (items.length > 0) acc[group as "Today" | "Yesterday" | "Earlier"] = items;
      return acc;
    },
    {} as Partial<Record<"Today" | "Yesterday" | "Earlier", NotificationItem[]>>
  );

  return (
    <section className={cx("page", isActive && "pageActive")} id="page-notifications">
      <style>{`
        .notif-row { transition: all 0.12s ease; cursor: pointer; }
        .notif-row:hover { background: color-mix(in srgb, var(--accent) 2%, transparent)!important; border-color: color-mix(in srgb, var(--accent) 15%, transparent)!important; }
        .notif-row:hover .row-actions { opacity: 1!important; }
        .filter-btn { transition: all 0.12s ease; cursor: pointer; border: none; font-family: 'DM Mono',monospace; }
        .icon-btn { transition: all 0.12s ease; cursor: pointer; background: none; border: none; font-family: 'DM Mono',monospace; }
        .icon-btn:hover { opacity: 0.7; }
        .toggle { transition: all 0.15s ease; cursor: pointer; }
      `}</style>

      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>Staff Dashboard</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>Notifications</h1>
              {unread > 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", background: "rgba(255,68,68,0.1)", border: "1px solid rgba(255,68,68,0.25)", borderRadius: 2 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff4444", opacity: pulse ? 1 : 0.3, transition: "opacity 0.7s ease" }} />
                  <span style={{ fontSize: 10, color: "#ff4444", letterSpacing: "0.1em" }}>{unread} UNREAD</span>
                </div>
              ) : null}
            </div>
          </div>
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
            {[
              { label: "Critical", value: critical, color: critical > 0 ? "#ff4444" : "var(--muted2)" },
              { label: "Pinned", value: pinned, color: pinned > 0 ? "#f5c518" : "var(--muted2)" },
              { label: "Unread", value: unread, color: unread > 0 ? "#a0a0b0" : "var(--muted2)" }
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>{stat.label}</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</div>
              </div>
            ))}
            <button
              className="icon-btn"
              onClick={() => setShowPrefs((previous) => !previous)}
              style={{ padding: "8px 14px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: showPrefs ? "var(--accent)" : "var(--muted2)", fontSize: 11, marginLeft: 8, letterSpacing: "0.06em" }}
            >
              {showPrefs ? "<- Back" : "Preferences"}
            </button>
          </div>
        </div>

        {!showPrefs ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {[{ key: "all", label: "All" }, { key: "unread", label: "Unread" }, { key: "pinned", label: "Pinned" }].map((f) => (
              <button
                key={f.key}
                className="filter-btn"
                onClick={() => setFilter(f.key as "all" | "unread" | "pinned")}
                style={{
                  padding: "5px 12px",
                  fontSize: 10,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  borderRadius: 2,
                  background: filter === f.key ? "rgba(255,255,255,0.08)" : "transparent",
                  color: filter === f.key ? "var(--text)" : "var(--muted2)"
                }}
              >
                {f.label}
              </button>
            ))}
            <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.08)" }} />
            {(Object.keys(typeConfig) as NotificationType[]).slice(0, 6).map((type) => (
              <button
                key={type}
                className="filter-btn"
                onClick={() => setTypeFilter(typeFilter === type ? "all" : type)}
                style={{
                  padding: "5px 10px",
                  fontSize: 10,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  borderRadius: 2,
                  background: typeFilter === type ? typeConfig[type].bg : "transparent",
                  color: typeFilter === type ? typeConfig[type].color : "var(--muted2)",
                  border: "none"
                }}
              >
                {typeConfig[type].icon} {typeConfig[type].label}
              </button>
            ))}
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              {unread > 0 ? (
                <button
                  className="icon-btn"
                  onClick={markAllRead}
                  style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.06em", textTransform: "uppercase" }}
                >
                  Mark all read
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {showPrefs ? (
        <div style={{ padding: "28px 0", maxWidth: 480 }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 6 }}>Notification Preferences</div>
          <div style={{ fontSize: 12, color: "var(--muted2)", marginBottom: 24 }}>Choose which notifications appear in your centre.</div>
          {prefs.map((pref) => (
            <div key={pref.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 14, color: typeConfig[pref.key].color, width: 20 }}>{typeConfig[pref.key].icon}</span>
                <span style={{ fontSize: 13, color: "#a0a0b0" }}>{pref.label}</span>
              </div>
              <div
                className="toggle"
                onClick={() => toggleType(pref.key)}
                style={{ width: 36, height: 20, borderRadius: 10, background: enabled[pref.key] ? "var(--accent)" : "rgba(255,255,255,0.08)", position: "relative" }}
              >
                <div style={{ position: "absolute", top: 3, left: enabled[pref.key] ? 19 : 3, width: 14, height: 14, borderRadius: "50%", background: enabled[pref.key] ? "#050508" : "var(--muted2)", transition: "left 0.15s ease" }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 380px" : "1fr", minHeight: "calc(100vh - 185px)" }}>
          <div style={{ padding: "20px 0", borderRight: selected ? "1px solid rgba(255,255,255,0.06)" : "none", overflowY: "auto" }}>
            {visible.length === 0 ? (
              <div style={{ textAlign: "center", paddingTop: 60, color: "var(--muted2)" }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>◎</div>
                <div style={{ fontSize: 13 }}>All caught up</div>
              </div>
            ) : null}
            {(["Today", "Yesterday", "Earlier"] as Array<"Today" | "Yesterday" | "Earlier">).map((group) => {
              const items = grouped[group];
              if (!items?.length) return null;
              return (
                <div key={group} style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <span style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase" }}>{group}</span>
                    <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.04)" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {items.map((row) => {
                      const tc = typeConfig[row.type];
                      const cl = clients.find((client) => client.id === row.clientId);
                      const isNew = !row.read;
                      const isSelected = selected?.id === row.id;
                      const priorityColor: Record<NotificationPriority, string> = {
                        critical: "#ff4444",
                        high: "#ff8c00",
                        normal: "transparent",
                        low: "transparent"
                      };
                      return (
                        <div
                          key={row.id}
                          className="notif-row"
                          onClick={() => open(row)}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 12,
                            padding: "12px 14px",
                            border: `1px solid ${isSelected ? "color-mix(in srgb, var(--accent) 25%, transparent)" : isNew ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)"}`,
                            borderLeft: `3px solid ${
                              row.pinned
                                ? "#f5c518"
                                : priorityColor[row.priority] !== "transparent"
                                  ? priorityColor[row.priority]
                                  : isNew
                                    ? "rgba(255,255,255,0.15)"
                                    : "transparent"
                            }`,
                            borderRadius: "0 4px 4px 0",
                            background: isSelected ? "color-mix(in srgb, var(--accent) 2%, transparent)" : isNew ? "rgba(255,255,255,0.015)" : "transparent",
                            opacity: row.read && !isSelected ? 0.65 : 1
                          }}
                        >
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: isNew ? (row.priority === "critical" ? "#ff4444" : row.priority === "high" ? "#ff8c00" : "#60a5fa") : "transparent", flexShrink: 0, marginTop: 5 }} />
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: tc.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: tc.color, flexShrink: 0 }}>{tc.icon}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                              {cl ? <span style={{ fontSize: 10, color: cl.color }}>{cl.name}</span> : null}
                              {row.pinned ? <span style={{ fontSize: 10, color: "#f5c518" }}>◈</span> : null}
                              {row.priority === "critical" ? (
                                <span style={{ fontSize: 8, padding: "1px 5px", background: "rgba(255,68,68,0.12)", color: "#ff4444", borderRadius: 2, letterSpacing: "0.1em" }}>CRITICAL</span>
                              ) : null}
                              {row.priority === "high" ? (
                                <span style={{ fontSize: 8, padding: "1px 5px", background: "rgba(255,140,0,0.12)", color: "#ff8c00", borderRadius: 2, letterSpacing: "0.1em" }}>HIGH</span>
                              ) : null}
                            </div>
                            <div style={{ fontSize: 12, color: isNew ? "var(--text)" : "#a0a0b0", marginBottom: 3, fontWeight: isNew ? 500 : 400 }}>{row.title}</div>
                            <div style={{ fontSize: 11, color: "var(--muted2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.body}</div>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                            <span style={{ fontSize: 9, color: "var(--muted2)" }}>{row.time}</span>
                            <div className="row-actions" style={{ display: "flex", gap: 4, opacity: 0, transition: "opacity 0.12s" }}>
                              <button
                                className="icon-btn"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  togglePin(row.id);
                                }}
                                style={{ fontSize: 11, color: row.pinned ? "#f5c518" : "var(--muted2)", padding: "1px 4px" }}
                              >
                                {row.pinned ? "◈" : "◇"}
                              </button>
                              <button
                                className="icon-btn"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  dismiss(row.id);
                                }}
                                style={{ fontSize: 13, color: "var(--muted2)", padding: "0 4px" }}
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

          {selected ? (
            (() => {
              const tc = typeConfig[selected.type];
              const cl = clients.find((client) => client.id === selected.clientId);
              return (
                <div style={{ padding: "24px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: tc.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: tc.color }}>{tc.icon}</div>
                    <div>
                      <div style={{ fontSize: 11, color: tc.color, letterSpacing: "0.08em", textTransform: "uppercase" }}>{tc.label}</div>
                      <div style={{ fontSize: 10, color: "var(--muted2)" }}>{selected.time}</div>
                    </div>
                    <button className="icon-btn" onClick={() => setSelected(null)} style={{ marginLeft: "auto", fontSize: 18, color: "var(--muted2)" }}>×</button>
                  </div>

                  {cl ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: `${cl.color}08`, border: `1px solid ${cl.color}30`, borderRadius: 3 }}>
                      <div style={{ width: 22, height: 22, borderRadius: 2, background: `${cl.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: cl.color }}>{cl.avatar}</div>
                      <span style={{ fontSize: 12, color: cl.color }}>{cl.name}</span>
                    </div>
                  ) : null}

                  <div>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 700, color: "#fff", lineHeight: 1.3, marginBottom: 10 }}>{selected.title}</div>
                    <div style={{ fontSize: 13, color: "#a0a0b0", lineHeight: 1.8 }}>{selected.body}</div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                    {selected.type === "message" ? <ActionBtn label="Reply to message" color="#60a5fa" /> : null}
                    {selected.type === "milestone" ? <ActionBtn label="Open milestone" color="#a78bfa" /> : null}
                    {selected.type === "invoice" ? <ActionBtn label="View invoice" color="var(--accent)" /> : null}
                    {selected.type === "overdue" ? <ActionBtn label="Escalate now" color="#ff4444" /> : null}
                    {selected.type === "approval" ? <ActionBtn label="View milestone" color="var(--accent)" /> : null}
                    {selected.type === "suggestion" ? <ActionBtn label="View suggestion" color="#ff8c00" /> : null}
                    {selected.type === "mention" ? <ActionBtn label="View note" color="#f5c518" /> : null}
                    <button
                      onClick={() => {
                        togglePin(selected.id);
                        setSelected((previous) => (previous ? { ...previous, pinned: !previous.pinned } : previous));
                      }}
                      style={{ padding: "9px 14px", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: selected.pinned ? "#f5c518" : "var(--muted2)", fontSize: 11, cursor: "pointer", fontFamily: "'DM Mono',monospace", letterSpacing: "0.06em", textAlign: "left" }}
                    >
                      {selected.pinned ? "◈ Unpin notification" : "◇ Pin notification"}
                    </button>
                    <button
                      onClick={() => {
                        dismiss(selected.id);
                        setSelected(null);
                      }}
                      style={{ padding: "9px 14px", background: "transparent", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 3, color: "var(--muted2)", fontSize: 11, cursor: "pointer", fontFamily: "'DM Mono',monospace", letterSpacing: "0.06em", textAlign: "left" }}
                    >
                      Dismiss notification
                    </button>
                  </div>
                </div>
              );
            })()
          ) : null}
        </div>
      )}
    </section>
  );
}

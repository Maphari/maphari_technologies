"use client";

import { useEffect, useState } from "react";
import { cx } from "../style";

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
};

const clients: ClientRow[] = [
  { id: 0, name: "Internal", avatar: "IN" },
  { id: 1, name: "Volta Studios", avatar: "VS" },
  { id: 2, name: "Kestrel Capital", avatar: "KC" },
  { id: 3, name: "Mira Health", avatar: "MH" },
  { id: 4, name: "Dune Collective", avatar: "DC" },
  { id: 5, name: "Okafor & Sons", avatar: "OS" }
];

const typeConfig: Record<NotificationType, { icon: string; label: string }> = {
  message: { icon: "✉", label: "Message" },
  milestone: { icon: "◎", label: "Milestone" },
  invoice: { icon: "₹", label: "Invoice" },
  approval: { icon: "✓", label: "Approval" },
  overdue: { icon: "⚑", label: "Overdue" },
  mention: { icon: "@", label: "Mention" },
  system: { icon: "◈", label: "System" },
  suggestion: { icon: "◉", label: "Suggestion" },
  login: { icon: "◌", label: "Portal login" }
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

function ActionBtn({ label, tone }: { label: string; tone: NotificationType }) {
  return (
    <button type="button" className={cx("snActionBtn")} data-tone={tone}>
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

  const dismiss = (id: number) => {
    setNotifs((previous) => previous.filter((row) => row.id !== id));
    setSelected((previous) => (previous?.id === id ? null : previous));
  };

  const togglePin = (id: number) => {
    setNotifs((previous) => previous.map((row) => (row.id === id ? { ...row, pinned: !row.pinned } : row)));
    setSelected((previous) => (previous?.id === id ? { ...previous, pinned: !previous.pinned } : previous));
  };

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
    <section className={cx("page", "pageBody", "notificationsPage", isActive && "pageActive")} id="page-notifications">
      <div className={cx("pageHeader", "snHeader")}>
        <div>
          <div className={cx("pageEyebrow")}>Staff Dashboard / Communication</div>
          <div className={cx("pageTitle")}>Notifications</div>
          <div className={cx("pageSub")}>Queue triage · Delivery status · Channel health</div>
        </div>

        <div className={cx("pageActions", "snHeaderActions")}>
          {unread > 0 ? (
            <div className={cx("snUnreadPulse")}>
              <span className={cx("snUnreadDot", pulse ? "snUnreadDotOn" : "snUnreadDotOff")} />
              <span className={cx("text10", "tracking", "uppercase", "colorRed")}>{unread} unread</span>
            </div>
          ) : null}

          <div className={cx("snTopStats")}>
            {[
              { label: "Critical", value: critical, toneClass: critical > 0 ? "colorRed" : "colorMuted2" },
              { label: "Pinned", value: pinned, toneClass: pinned > 0 ? "colorAmber" : "colorMuted2" },
              { label: "Unread", value: unread, toneClass: unread > 0 ? "colorAccent" : "colorMuted2" }
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
            onClick={() => setShowPrefs((previous) => !previous)}
          >
            {showPrefs ? "&lt;- Back" : "Preferences"}
          </button>
        </div>
      </div>

      {!showPrefs ? (
        <div className={cx("snFilterRow")}>
          <select
            className={cx("filterSelect")}
            aria-label="Filter notifications"
            value={filter}
            onChange={(event) => setFilter(event.target.value as "all" | "unread" | "pinned")}
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="pinned">Pinned</option>
          </select>
          <select
            className={cx("filterSelect")}
            aria-label="Filter notification type"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as "all" | NotificationType)}
          >
            <option value="all">All types</option>
            {(Object.keys(typeConfig) as NotificationType[]).slice(0, 6).map((type) => (
              <option key={type} value={type}>
                {typeConfig[type].label}
              </option>
            ))}
          </select>

          <div className={cx("snMarkAllWrap")}>
            {unread > 0 ? (
              <button type="button" className={cx("snIconBtn", "snMarkAllBtn")} onClick={markAllRead}>
                Mark all read
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {showPrefs ? (
        <div className={cx("snPrefsPanel")}>
          <div className={cx("snPrefsTitle")}>Notification Preferences</div>
          <div className={cx("snPrefsSub")}>Choose which notifications appear in your centre.</div>

          {prefs.map((pref) => (
            <div key={pref.key} className={cx("snPrefRow")}>
              <div className={cx("snPrefLeft")}>
                <span className={cx("snPrefIcon")} data-type={pref.key}>{typeConfig[pref.key].icon}</span>
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
        <div className={cx("snLayout", selected && "snLayoutWithDetail")}>
          <div className={cx("snListPane", selected && "snListPaneWithDetail")}>
            {visible.length === 0 ? (
              <div className={cx("snEmptyState")}>
                <div className={cx("snEmptyIcon")}>◎</div>
                <div className={cx("snEmptyText")}>All caught up</div>
              </div>
            ) : null}

            {(["Today", "Yesterday", "Earlier"] as Array<"Today" | "Yesterday" | "Earlier">).map((group) => {
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
                      const cl = clients.find((client) => client.id === row.clientId);
                      const isNew = !row.read;
                      const isSelected = selected?.id === row.id;

                      return (
                        <div
                          key={row.id}
                          className={cx("snNotifRow", "snRowCard", isSelected && "snRowSelected", isNew ? "snRowUnread" : "snRowRead")}
                          data-priority={row.priority}
                          data-pinned={row.pinned ? "true" : "false"}
                          onClick={() => open(row)}
                        >
                          <span
                            className={cx("snPriorityDot")}
                            data-new={isNew ? "true" : "false"}
                            data-priority={row.priority}
                          />

                          <div className={cx("snTypeIcon")} data-type={row.type}>{tc.icon}</div>

                          <div className={cx("snRowMain")}>
                            <div className={cx("snRowMeta")}>
                              {cl ? <span className={cx("snClientName")} data-client-id={String(cl.id)}>{cl.name}</span> : null}
                              {row.pinned ? <span className={cx("snPinnedGlyph")}>◈</span> : null}
                              {row.priority === "critical" ? <span className={cx("snCriticalBadge")}>CRITICAL</span> : null}
                              {row.priority === "high" ? <span className={cx("snHighBadge")}>HIGH</span> : null}
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
                                onClick={(event) => {
                                  event.stopPropagation();
                                  togglePin(row.id);
                                }}
                              >
                                {row.pinned ? "◈" : "◇"}
                              </button>

                              <button
                                type="button"
                                className={cx("snIconBtn", "snRowDismissBtn")}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  dismiss(row.id);
                                }}
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
                <div className={cx("snDetailPane")}>
                  <div className={cx("snDetailHeader")}>
                    <div className={cx("snTypeIcon", "snDetailTypeIcon")} data-type={selected.type}>{tc.icon}</div>
                    <div>
                      <div className={cx("snTypeLabel")} data-type={selected.type}>{tc.label}</div>
                      <div className={cx("text10", "colorMuted2")}>{selected.time}</div>
                    </div>
                    <button type="button" className={cx("snIconBtn", "snDetailClose")} onClick={() => setSelected(null)}>×</button>
                  </div>

                  {cl ? (
                    <div className={cx("snClientChip")} data-client-id={String(cl.id)}>
                      <div className={cx("snClientAvatarMini")} data-client-id={String(cl.id)}>{cl.avatar}</div>
                      <span className={cx("snClientName", "snClientNameSm")} data-client-id={String(cl.id)}>{cl.name}</span>
                    </div>
                  ) : null}

                  <div>
                    <div className={cx("snDetailTitle")}>{selected.title}</div>
                    <div className={cx("snDetailBody")}>{selected.body}</div>
                  </div>

                  <div className={cx("snDetailActions")}>
                    {selected.type === "message" ? <ActionBtn label="Reply to message" tone="message" /> : null}
                    {selected.type === "milestone" ? <ActionBtn label="Open milestone" tone="milestone" /> : null}
                    {selected.type === "invoice" ? <ActionBtn label="View invoice" tone="invoice" /> : null}
                    {selected.type === "overdue" ? <ActionBtn label="Escalate now" tone="overdue" /> : null}
                    {selected.type === "approval" ? <ActionBtn label="View milestone" tone="approval" /> : null}
                    {selected.type === "suggestion" ? <ActionBtn label="View suggestion" tone="suggestion" /> : null}
                    {selected.type === "mention" ? <ActionBtn label="View note" tone="mention" /> : null}

                    <button
                      type="button"
                      className={cx("snDetailActionBtn", selected.pinned ? "snDetailActionBtnPinned" : "colorMuted2")}
                      onClick={() => togglePin(selected.id)}
                    >
                      {selected.pinned ? "◈ Unpin notification" : "◇ Pin notification"}
                    </button>

                    <button type="button" className={cx("snDetailActionBtn", "snDismissBtn", "colorMuted2")} onClick={() => dismiss(selected.id)}>
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

"use client";

import { useEffect, useMemo, useState } from "react";
import { cx, styles } from "../style";

type CommFilter =
  | "All"
  | "Messages"
  | "Calls"
  | "Approvals"
  | "Emails"
  | "Scope Changes"
  | "Invoices";

type CommType =
  | "message"
  | "call"
  | "approval"
  | "email"
  | "scope"
  | "mention"
  | "invoice"
  | "payment";

type CommEntry = {
  icon: string;
  title: string;
  text: string;
  type: CommType;
  time: string;
  chip: "badgeGreen" | "badgeAccent" | "badgePurple" | "badgeAmber" | "badgeMuted" | "badgeBlue";
  chipLabel: string;
};

type CommGroup = {
  date: string;
  entries: CommEntry[];
};

const FILTERS: CommFilter[] = [
  "All",
  "Messages",
  "Calls",
  "Approvals",
  "Emails",
  "Scope Changes",
  "Invoices",
];

const TYPE_MAP: Record<CommType, CommFilter> = {
  message: "Messages",
  call: "Calls",
  approval: "Approvals",
  email: "Emails",
  scope: "Scope Changes",
  mention: "Messages",
  invoice: "Invoices",
  payment: "Invoices",
};

const ALL_EVENTS: CommGroup[] = [
  {
    date: "Today",
    entries: [
      {
        icon: "💬",
        title: "Message from Sipho Ndlovu",
        text: "Dashboard UI is looking great — analytics widget has been pushed. You should now see it in the portal.",
        type: "message",
        time: "11:34",
        chip: "badgeAccent",
        chipLabel: "Portal Message",
      },
      {
        icon: "✅",
        title: "You approved Homepage Design v2",
        text: "Formal approval recorded. The team has been notified and will proceed to frontend.",
        type: "approval",
        time: "10:12",
        chip: "badgeGreen",
        chipLabel: "Approval",
      },
    ],
  },
  {
    date: "Yesterday · Feb 20",
    entries: [
      {
        icon: "📞",
        title: "Discovery call — sprint review",
        text: "45-minute call. Attendees: Naledi D., Sipho N., Lerato M. Decision: proceed with lime accent and defer dark mode to Phase 2.",
        type: "call",
        time: "14:00",
        chip: "badgePurple",
        chipLabel: "Call",
      },
      {
        icon: "📧",
        title: "Email: Weekly project update",
        text: "Automated digest sent — 3 milestones completed, 2 upcoming, no blockers. Budget currently at 41%.",
        type: "email",
        time: "08:00",
        chip: "badgeMuted",
        chipLabel: "Auto-Email",
      },
    ],
  },
  {
    date: "Feb 18",
    entries: [
      {
        icon: "🔄",
        title: "Scope change requested by Sipho Ndlovu",
        text: "Added Zulu language support to all screens. Impact: +R 2,400 and +3 days. Awaiting your approval.",
        type: "scope",
        time: "16:20",
        chip: "badgeAmber",
        chipLabel: "Scope Change",
      },
      {
        icon: "💬",
        title: "You were mentioned in a task",
        text: "@Naledi your brand guideline approval is needed before mobile screens can start. No rush, just flagging.",
        type: "mention",
        time: "11:02",
        chip: "badgeBlue",
        chipLabel: "Mention",
      },
    ],
  },
  {
    date: "Feb 14",
    entries: [
      {
        icon: "✅",
        title: "You approved Brand Identity Suite",
        text: "Logo, guidelines, and colour palette approved. Formal sign-off recorded with timestamp.",
        type: "approval",
        time: "15:30",
        chip: "badgeGreen",
        chipLabel: "Approval",
      },
      {
        icon: "📧",
        title: "Invoice #002 sent",
        text: "Brand Identity phase invoice for R 20,000 delivered to naledi@veldt.co.za.",
        type: "invoice",
        time: "16:00",
        chip: "badgeAmber",
        chipLabel: "Invoice",
      },
      {
        icon: "💳",
        title: "Payment received — Invoice #002",
        text: "R 20,000 received via EFT. Receipt generated and filed.",
        type: "payment",
        time: "17:45",
        chip: "badgeGreen",
        chipLabel: "Payment",
      },
    ],
  },
];

export function NotificationsPage() {
  const [filter, setFilter] = useState<CommFilter>("All");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ title: string; subtitle: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const filtered = useMemo(
    () =>
      ALL_EVENTS.map((group) => ({
        ...group,
        entries: group.entries.filter((entry) => {
          const matchFilter = filter === "All" || TYPE_MAP[entry.type] === filter;
          const query = search.trim().toLowerCase();
          const matchSearch =
            query.length === 0 ||
            entry.title.toLowerCase().includes(query) ||
            entry.text.toLowerCase().includes(query);
          return matchFilter && matchSearch;
        }),
      })).filter((group) => group.entries.length > 0),
    [filter, search],
  );

  function notify(title: string, subtitle: string): void {
    setToast({ title, subtitle });
  }

  return (
    <div className={cx("pageBody", styles.commLogRoot)}>
      <div className={styles.commLogLayout}>
        <aside className={styles.commLogSidebar}>
          <div className={styles.commLogSection}>Log</div>
          {["All", "Messages", "Calls", "Approvals"].map((item, idx) => (
            <button
              key={item}
              type="button"
              className={cx(styles.commLogSideItem, filter === item && styles.commLogSideItemActive)}
              onClick={() => setFilter(item as CommFilter)}
            >
              <span
                className={styles.commLogDot}
                style={{
                  background:
                    idx === 0 ? "var(--accent)" : idx === 1 ? "var(--blue)" : idx === 2 ? "var(--purple)" : "var(--green)",
                }}
              />
              <span>{item}</span>
            </button>
          ))}

          <div className={styles.commLogDivider} />
          {["Emails", "Scope Changes", "Invoices"].map((item, idx) => (
            <button
              key={item}
              type="button"
              className={cx(styles.commLogSideItem, filter === item && styles.commLogSideItemActive)}
              onClick={() => setFilter(item as CommFilter)}
            >
              <span
                className={styles.commLogDot}
                style={{ background: idx === 0 ? "var(--amber)" : idx === 1 ? "var(--red)" : "var(--muted2)" }}
              />
              <span>{item}</span>
            </button>
          ))}

          <div className={styles.commLogDivider} />
          <div className={styles.commLogHintCard}>
            <div className={styles.commLogHintText}>
              Complete audit trail from project start. <strong>Every interaction logged</strong>, nothing lost.
            </div>
          </div>
        </aside>

        <section className={styles.commLogMain}>
          <div className={styles.commLogHeader}>
            <div>
              <div className={cx("pageEyebrow")}>Veldt Finance · Comms</div>
              <h1 className={cx("pageTitle")}>Communication Log</h1>
              <p className={cx("pageSub")}>
                Every message, call, approval, email, and decision — timestamped and searchable.
              </p>
            </div>
            <div className={styles.commLogHeaderActions}>
              <div className={styles.commLogSearchWrap}>
                <span className={styles.commLogSearchIcon}>🔍</span>
                <input
                  className={styles.commLogSearch}
                  placeholder="Search communications..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <button
                type="button"
                className={cx("btnSm", "btnGhost")}
                onClick={() => notify("Exported", "Full communication log downloaded")}
              >
                Export
              </button>
            </div>
          </div>

          <div className={styles.commLogFilterBar}>
            {FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                className={cx(styles.commLogFilterBtn, filter === item && styles.commLogFilterBtnActive)}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className={styles.commLogContent}>
            <div className={styles.commLogTimeline}>
              {filtered.map((group) => (
                <div key={group.date} className={styles.commLogGroup}>
                  <div className={styles.commLogDate}>{group.date}</div>
                  {group.entries.map((entry) => (
                    <div key={`${group.date}-${entry.title}-${entry.time}`} className={styles.commLogEntry}>
                      <span className={styles.commLogEntryIcon}>{entry.icon}</span>
                      <div className={styles.commLogEntryBody}>
                        <div className={styles.commLogEntryTitle}>{entry.title}</div>
                        <div className={styles.commLogEntryText}>{entry.text}</div>
                        <div className={styles.commLogEntryMeta}>
                          <span className={styles.commLogTime}>{entry.time}</span>
                          <span className={cx("badge", entry.chip)}>{entry.chipLabel}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              {filtered.length === 0 ? (
                <div className={styles.commLogEmpty}>No results for "{search || filter}"</div>
              ) : null}
            </div>
          </div>
        </section>
      </div>

      {toast ? (
        <div className={cx("toastStack")}>
          <div className={cx("toast", "toastSuccess")}>
            <strong>{toast.title}</strong>
            <div>{toast.subtitle}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

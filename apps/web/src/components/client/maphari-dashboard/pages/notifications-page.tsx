"use client";
import { useState, useMemo, useEffect } from "react";
import { cx } from "../style";
import { Ic, Av } from "../ui";
import { saveSession } from "../../../../lib/auth/session";
import { useProjectLayer } from "../hooks/use-project-layer";
import {
  archiveAllPortalNotificationsWithRefresh,
  loadPortalNotificationsWithRefresh,
  markAllPortalNotificationsReadWithRefresh,
  restoreSnoozedPortalNotificationsWithRefresh,
  setPortalNotificationArchiveStateWithRefresh,
  setPortalNotificationReadStateWithRefresh,
  setPortalNotificationSnoozeStateWithRefresh,
  type PortalNotificationJob,
} from "../../../../lib/api/portal";
import {
  getPortalPreferenceWithRefresh,
  setPortalPreferenceWithRefresh,
} from "../../../../lib/api/portal/settings";

// ── Types ─────────────────────────────────────────────────────────────────

type NGroup    = "Today" | "Yesterday" | "Earlier";
type NTab      = "all" | "approvals" | "finance" | "messages" | "projects" | "urgent";
type NPriority = "high" | "normal";

interface Notif {
  id:              string;
  group:           NGroup;
  tab:             NTab;
  icon:            string;
  color:           string;
  badge:           string;
  badgeLbl:        string;
  title:           string;
  body:            string;
  detail?:         string;
  time:            string;
  unread:          boolean;
  priority:        NPriority;
  sender:          string;
  senderInitials:  string;
  action:          string | null;
  actionCls:       string;
  secondaryAction?: string;
  snoozedUntil?:   string | null;
  archivedAt?:     string | null;
}

// ── Mapper: PortalNotificationJob → Notif ─────────────────────────────────

function getGroup(isoDate: string | undefined): NGroup {
  if (!isoDate) return "Earlier";
  const diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return "Earlier";
}

const TAB_CFG: Record<string, { icon: string; color: string; badge: string; badgeLbl: string }> = {
  finance:    { icon: "dollar",  color: "var(--green)",  badge: "badgeGreen",  badgeLbl: "Finance"  },
  invoices:   { icon: "dollar",  color: "var(--green)",  badge: "badgeGreen",  badgeLbl: "Finance"  },
  messages:   { icon: "message", color: "var(--purple)", badge: "badgePurple", badgeLbl: "Message"  },
  projects:   { icon: "rocket",  color: "var(--lime)",   badge: "badgeAccent", badgeLbl: "Project"  },
  operations: { icon: "layers",  color: "var(--blue)",   badge: "badgeMuted",  badgeLbl: "Update"   },
};

const EVENT_TITLE: Record<string, string> = {
  "chat.message.created":       "New Message",
  "project.created":            "Project Created",
  "project.updated":            "Project Updated",
  "project.status.changed":     "Project Status Update",
  "deliverable.created":        "New Deliverable",
  "deliverable.approved":       "Deliverable Approved",
  "deliverable.rejected":       "Deliverable Needs Revision",
  "invoice.created":            "New Invoice",
  "invoice.paid":               "Invoice Paid",
  "milestone.reached":          "Milestone Reached",
  "approval.requested":         "Action Required",
  "approval.approved":          "Approval Confirmed",
  "approval.rejected":          "Approval Declined",
  "file.uploaded":              "New File Uploaded",
  "meeting.scheduled":          "Meeting Scheduled",
};

function humanizeTitle(subject: string | null | undefined): string {
  if (!subject) return "Notification";
  // e.g. "Event: chat.message.created" → look up the event key
  const match = subject.match(/Event:\s*(.+)/i);
  if (match) {
    const key = match[1].trim().toLowerCase();
    return EVENT_TITLE[key] ?? subject;
  }
  return subject;
}

function sanitizeBody(rawTab: string, message: string | null | undefined, title: string): string {
  if (!message) return "";
  // Strip admin-facing UUIDs / internal copy from project notifications
  if (rawTab === "projects" && (/[0-9a-f]{8}-[0-9a-f]{4}/i.test(message) || /review and assign/i.test(message))) {
    const nameMatch = title.match(/:\s*(.+)$/);
    const name = nameMatch ? `"${nameMatch[1].trim()}" ` : "";
    return `Your project request ${name}has been received. Our team will review it and reach out to you shortly.`;
  }
  return message;
}

function inferTabFromSubject(subject: string | null | undefined): string | null {
  if (!subject) return null;
  const ev = subject.match(/Event:\s*(.+)/i)?.[1]?.trim().toLowerCase() ?? "";
  if (ev.startsWith("chat.") || ev.startsWith("message.")) return "messages";
  if (ev.startsWith("invoice.") || ev.startsWith("payment.")) return "invoices";
  if (ev.startsWith("approval.")) return "approvals";
  if (ev.startsWith("project.") || ev.startsWith("deliverable.") || ev.startsWith("milestone.")) return "projects";
  return null;
}

function inferPriority(
  subject: string | null | undefined,
  metadata: Record<string, string | number | boolean> | undefined,
): NPriority {
  const ev = subject?.match(/Event:\s*(.+)/i)?.[1]?.trim().toLowerCase() ?? "";
  const severity = String(metadata?.severity ?? "").toUpperCase();
  const alertType = String(metadata?.alertType ?? "").toLowerCase();
  if (severity === "HIGH" || severity === "CRITICAL") return "high";
  if (ev.startsWith("approval.requested")) return "high";
  if (alertType.includes("overdue") || alertType.includes("risk") || alertType.includes("escalated")) return "high";
  return "normal";
}

function inferSender(
  rawTab: string,
  metadata: Record<string, string | number | boolean> | undefined,
): { sender: string; senderInitials: string } {
  const projectName = typeof metadata?.projectName === "string" ? metadata.projectName.trim() : "";
  if (projectName) return { sender: projectName, senderInitials: "PR" };
  if (rawTab === "messages") return { sender: "Project Team", senderInitials: "PT" };
  if (rawTab === "invoices" || rawTab === "finance") return { sender: "Billing", senderInitials: "BL" };
  if (rawTab === "approvals") return { sender: "Approvals Desk", senderInitials: "AP" };
  if (rawTab === "projects") return { sender: "Delivery Team", senderInitials: "DT" };
  return { sender: "System", senderInitials: "SY" };
}

function mapJobToNotif(job: PortalNotificationJob): Notif {
  // "dashboard" is the backend's generic fallback — treat it as unset and infer from subject
  const rawTab = (!job.tab || job.tab === "dashboard")
    ? (inferTabFromSubject(job.subject) ?? "operations")
    : job.tab;
  const cfg = TAB_CFG[rawTab] ?? { icon: "bell", color: "var(--muted2)", badge: "badgeMuted", badgeLbl: "Update" };
  const priority = inferPriority(job.subject, job.metadata);
  const ntfTab: NTab =
    rawTab === "approvals" ? "approvals" :
    rawTab === "invoices" ? "finance" :
    rawTab === "messages" ? "messages" :
    rawTab === "projects" ? "projects" :
    priority === "high" ? "urgent" : "all";
  const title = humanizeTitle(job.subject);
  const sender = inferSender(rawTab, job.metadata);
  return {
    id:             job.id,
    group:          getGroup(job.createdAt),
    tab:            ntfTab,
    icon:           cfg.icon,
    color:          cfg.color,
    badge:          cfg.badge,
    badgeLbl:       cfg.badgeLbl,
    title,
    body:           sanitizeBody(rawTab, job.message, title),
    time:           job.createdAt
      ? new Date(job.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })
      : "",
    unread:         job.readAt === null,
    priority,
    sender:         sender.sender,
    senderInitials: sender.senderInitials,
    action:         null,
    actionCls:      "",
    snoozedUntil:   job.snoozedUntil ?? null,
    archivedAt:     job.archivedAt ?? null,
  };
}

const TABS: { id: NTab; label: string; icon: string }[] = [
  { id: "all",       label: "All",       icon: "list"    },
  { id: "approvals", label: "Approvals", icon: "check"   },
  { id: "finance",   label: "Finance",   icon: "dollar"  },
  { id: "messages",  label: "Messages",  icon: "message" },
  { id: "projects",  label: "Projects",  icon: "layers"  },
  { id: "urgent",    label: "Urgent",    icon: "alert"   },
];

const GROUPS: NGroup[] = ["Today", "Yesterday", "Earlier"];

const CATS: Exclude<NTab, "all">[] = ["approvals", "finance", "messages", "projects", "urgent"];

const CAT_COLOR: Record<Exclude<NTab, "all">, string> = {
  approvals: "var(--lime)",
  finance:   "var(--green)",
  messages:  "var(--purple)",
  projects:  "var(--blue)",
  urgent:    "var(--red)",
};

const CAT_ICON: Record<Exclude<NTab, "all">, string> = {
  approvals: "check",
  finance:   "dollar",
  messages:  "message",
  projects:  "layers",
  urgent:    "alert",
};

// ── Component ─────────────────────────────────────────────────────────────

export function NotificationsPage() {
  const { session } = useProjectLayer();
  const [activeTab, setActiveTab] = useState<NTab>("all");
  const [notifs,    setNotifs]    = useState<Notif[]>([]);
  const [expanded,  setExpanded]  = useState<string | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [currentTime] = useState(() => Date.now());

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) setLoading(true);
    });
    setError(null);
    void Promise.all([
      loadPortalNotificationsWithRefresh(session, {}),
      getPortalPreferenceWithRefresh(session, "notificationMutes"),
    ]).then(([notifsR, prefR]) => {
      if (notifsR.nextSession) saveSession(notifsR.nextSession);
      if (prefR.nextSession) saveSession(prefR.nextSession);
      if (notifsR.error) { setError(notifsR.error.message ?? "Failed to load."); return; }
      if (notifsR.data) setNotifs(notifsR.data.map(mapJobToNotif));
      if (prefR.data?.value) {
        try { setMuted(new Set(JSON.parse(prefR.data.value))); } catch { /* ignore */ }
      }
    }).finally(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken, refreshTick]);
  const [showPrefs, setShowPrefs] = useState(false);
  const [muted,     setMuted]     = useState<Set<Exclude<NTab, "all">>>(new Set());

  const visible = useMemo(
    () => notifs.filter((n) => {
      if (muted.has(n.tab as Exclude<NTab, "all">)) return false;
      if (n.archivedAt) return false;
      if (n.snoozedUntil && new Date(n.snoozedUntil).getTime() > currentTime) return false;
      return true;
    }),
    [notifs, muted, currentTime],
  );

  const filtered = useMemo(
    () => activeTab === "all" ? visible : visible.filter(n => n.tab === activeTab),
    [visible, activeTab],
  );

  const unreadCount    = visible.filter(n => n.unread).length;
  const snoozedCount   = notifs.filter((n) => Boolean(n.snoozedUntil && new Date(n.snoozedUntil).getTime() > currentTime)).length;
  const actionRequired = visible.filter(n => n.unread && n.priority === "high").length;
  const todayCount     = visible.filter(n => n.group === "Today").length;

  const tabUnread = (tab: NTab) =>
    visible.filter(n => n.unread && (tab === "all" || n.tab === tab)).length;

  const markAllRead = () => {
    setNotifs(prev => prev.map(n => ({ ...n, unread: false })));
    if (session) {
      void markAllPortalNotificationsReadWithRefresh(session).then((r) => {
        if (r.nextSession) saveSession(r.nextSession);
      });
    }
  };
  const markRead    = (id: string) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
    if (session) {
      void setPortalNotificationReadStateWithRefresh(session, id, true).then((r) => {
        if (r.nextSession) saveSession(r.nextSession);
      });
    }
  };
  const dismiss     = (id: string) => {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
    setExpanded((p) => p === id ? null : p);
    if (session) {
      void setPortalNotificationArchiveStateWithRefresh(session, id, true).then((r) => {
        if (r.nextSession) saveSession(r.nextSession);
      });
    }
  };
  const snooze      = (id: string) => {
    const until = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, snoozedUntil: until, unread: false } : n));
    markRead(id);
    if (session) {
      void setPortalNotificationSnoozeStateWithRefresh(session, id, until).then((r) => {
        if (r.nextSession) saveSession(r.nextSession);
      });
    }
  };
  const toggleMute  = (cat: Exclude<NTab, "all">) =>
    setMuted(prev => {
      const s = new Set(prev);
      if (s.has(cat)) {
        s.delete(cat);
      } else {
        s.add(cat);
      }
      if (session) {
        void setPortalPreferenceWithRefresh(session, {
          key: "notificationMutes",
          value: JSON.stringify([...s]),
        }).then((r) => { if (r.nextSession) saveSession(r.nextSession); });
      }
      return s;
    });
  const toggleExpand = (id: string) => { setExpanded(prev => prev === id ? null : id); markRead(id); };

  // Category stats
  const catCounts = CATS.map(c => ({
    cat: c,
    count:  visible.filter(n => n.tab === c).length,
    unread: visible.filter(n => n.tab === c && n.unread).length,
  }));
  const maxCount = Math.max(...catCounts.map(c => c.count), 1);

  // Top senders
  const senderMap: Record<string, { initials: string; count: number; unread: number }> = {};
  visible.forEach(n => {
    if (!senderMap[n.sender]) senderMap[n.sender] = { initials: n.senderInitials, count: 0, unread: 0 };
    senderMap[n.sender].count++;
    if (n.unread) senderMap[n.sender].unread++;
  });
  const topSenders = Object.entries(senderMap).sort((a, b) => b[1].count - a[1].count).slice(0, 4);

  if (loading) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("errorState")}>
          <div className={cx("errorStateIcon")}>✕</div>
          <div className={cx("errorStateTitle")}>Failed to load</div>
          <div className={cx("errorStateSub")}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cx("pageBody")}>

      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Overview · Notifications</div>
          <h1 className={cx("pageTitle")}>Notification Center</h1>
          <p className={cx("pageSub")}>
            Stay on top of every update, approval request, and alert from your project.
          </p>
        </div>
        <div className={cx("pageActions")}>
          {unreadCount > 0 && (
            <span className={cx("badge", unreadCount >= 5 ? "badgeRed" : "badgeAmber")}>
              {unreadCount} unread
            </span>
          )}
          <button type="button" className={cx("btnSm", "btnGhost", "colorInherit")}
            onClick={() => setRefreshTick((value) => value + 1)}>
            Refresh
          </button>
          <button type="button" className={cx("btnSm", "btnGhost", "colorInherit")} onClick={markAllRead}
            disabled={unreadCount === 0}>
            Mark all read
          </button>
          <button type="button" className={cx("btnSm", "btnGhost", "colorInherit", "flexRow", "gap6")} onClick={() => setShowPrefs(p => !p)}>
            <Ic n="settings" sz={13} c={showPrefs ? "var(--lime)" : "var(--muted2)"} />
            <span className={cx("dynColor")} style={{ "--color": showPrefs ? "var(--lime)" : "inherit" } as React.CSSProperties}>Preferences</span>
          </button>
        </div>
      </div>

      {/* ── Stat Cards ────────────────────────────────────────────────── */}
      <div className={cx("topCardsStack", "mb20")}>
        {[
          { label: "Unread",           value: unreadCount,    color: unreadCount > 0 ? "statCardAmber" : "statCardAccent" },
          { label: "Today",            value: todayCount,     color: "statCardAccent" },
          { label: "Requiring Action", value: actionRequired, color: actionRequired > 0 ? "statCardRed" : "statCardAccent" },
          { label: "Snoozed",          value: snoozedCount,   color: snoozedCount > 0 ? "statCardBlue" : "statCardAccent" },
        ].map(s => (
          <div key={s.label} className={cx("statCard", s.color)}>
            <div className={cx("statLabel")}>{s.label}</div>
            <div className={cx("statValue")}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Overview Row ──────────────────────────────────────────────── */}
      <div className={cx("grid2", "mb20", "gap16")}>

        {/* Category Activity */}
        <div className={cx("card", "p0", "overflowHidden")}>
          <div className={cx("cardHd")}>
            <div className={cx("flexRow", "gap8")}>
              <Ic n="activity" sz={14} c="var(--muted2)" />
              <span className={cx("cardHdTitle")}>Activity by Category</span>
            </div>
            <span className={cx("text10", "colorMuted")}>{visible.length} total</span>
          </div>
          <div className={cx("p0x18x16")}>
            {catCounts.map(({ cat, count, unread }, i) => (
              <div key={cat} className={cx("py9_0", i > 0 && "borderT")}>
                <div className={cx("flexRow", "flexCenter", "gap10", "mb7")}>
                  <div className={cx("ntfCatIconBox", "dynBgColor")} style={{ "--bg-color": `color-mix(in oklab, ${CAT_COLOR[cat]} 12%, var(--s2))`, "--color": `color-mix(in oklab, ${CAT_COLOR[cat]} 25%, transparent)` } as React.CSSProperties}>
                    <Ic n={CAT_ICON[cat]} sz={12} c={CAT_COLOR[cat]} />
                  </div>
                  <span className={cx("text12", "fw600", "flex1", "capitalize")}>{cat}</span>
                  <span className={cx("text11", "colorMuted")}>{count}</span>
                  {unread > 0 && (
                    <span className={cx("ntfUnreadBadge", "dynBgColor", "dynColor")} style={{ "--bg-color": `color-mix(in oklab, ${CAT_COLOR[cat]} 14%, var(--s3))`, "--color": CAT_COLOR[cat] } as React.CSSProperties}>{unread} new</span>
                  )}
                </div>
                <div className={cx("ntfCatTrack")}>
                  <div className={cx("ntfCatFill", "dynBgColor")} style={{ "--pct": `${(count / maxCount) * 100}%`, "--bg-color": CAT_COLOR[cat] } as React.CSSProperties} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Senders + Quick Actions */}
        <div className={cx("card", "p0", "overflowHidden")}>
          <div className={cx("cardHd")}>
            <div className={cx("flexRow", "gap8")}>
              <Ic n="users" sz={14} c="var(--muted2)" />
              <span className={cx("cardHdTitle")}>Top Senders</span>
            </div>
          </div>
          <div className={cx("p0x18x4")}>
            {topSenders.map(([name, info], i) => (
              <div key={name} className={cx("flexRow", "gap12", "py9_0", i > 0 && "borderT")}>
                <Av initials={info.initials} size={32} />
                <div className={cx("flex1")}>
                  <div className={cx("text12", "fw600")}>{name}</div>
                  <div className={cx("text10", "colorMuted")}>{info.count} notification{info.count !== 1 ? "s" : ""}</div>
                </div>
                {info.unread > 0 && (
                  <span className={cx("badge", "badgeAmber")}>{info.unread} unread</span>
                )}
              </div>
            ))}
          </div>
          <div className={cx("ntfQuickActions")}>
            <div className={cx("text10", "colorMuted", "fw700", "ls006", "mb10")}>
              QUICK ACTIONS
            </div>
            <div className={cx("flexRow", "gap8", "flexWrap")}>
              <button type="button" className={cx("btnSm", "btnGhost", "colorInherit", "flexRow", "gap5")} onClick={markAllRead}>
                <Ic n="check" sz={11} c="var(--muted2)" /> Mark all read
              </button>
              <button type="button" className={cx("btnSm", "btnGhost", "colorInherit", "flexRow", "gap5")}
                onClick={() => {
                  setNotifs((prev) => prev.filter((n) => muted.has(n.tab as Exclude<NTab, "all">)));
                  if (session) {
                    void archiveAllPortalNotificationsWithRefresh(session).then((r) => {
                      if (r.nextSession) saveSession(r.nextSession);
                    });
                  }
                }}>
                <Ic n="trash" sz={11} c="var(--muted2)" /> Clear all
              </button>
              {snoozedCount > 0 && (
                <button type="button" className={cx("btnSm", "btnGhost", "colorInherit", "flexRow", "gap5")} onClick={() => {
                  if (session) {
                    void restoreSnoozedPortalNotificationsWithRefresh(session).then((r) => {
                      if (r.nextSession) saveSession(r.nextSession);
                      setRefreshTick((value) => value + 1);
                    });
                  }
                }}>
                  <Ic n="refresh" sz={11} c="var(--muted2)" /> Restore snoozed ({snoozedCount})
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Preferences Panel ─────────────────────────────────────────── */}
      {showPrefs && (
        <div className={cx("card", "borderLeftAccent", "mb16", "p16x18")}>
          <div className={cx("flexRow", "flexCenter", "gap8", "mb14")}>
            <Ic n="settings" sz={14} c="var(--lime)" />
            <span className={cx("fw700", "text13")}>Notification Preferences</span>
            <button type="button" className={cx("btnSm", "btnGhost", "mlAuto", "colorInherit")} onClick={() => setShowPrefs(false)}>
              Close
            </button>
          </div>
          <div className={cx("grid2Cols", "gap8")}>
            {CATS.map(cat => (
              <div key={cat} className={cx("flexRow", "gap10", "p10x14", "rSm", "bgS3", "borderB1")}>
                <div className={cx("ntfPrefIconBox", "dynBgColor")} style={{ "--bg-color": `color-mix(in oklab, ${CAT_COLOR[cat]} 12%, var(--s2))` } as React.CSSProperties}>
                  <Ic n={CAT_ICON[cat]} sz={11} c={CAT_COLOR[cat]} />
                </div>
                <span className={cx("text12", "flex1", "capitalize")}>{cat}</span>
                {/* Toggle pill */}
                <button type="button" onClick={() => toggleMute(cat)} className={cx("ntfTogglePill", "dynBgColor")} style={{ "--bg-color": muted.has(cat) ? "var(--b2)" : CAT_COLOR[cat] } as React.CSSProperties}>
                  <div className={cx("ntfToggleThumb")} style={{ "--left": muted.has(cat) ? "2px" : "18px", "--bg-color": muted.has(cat) ? "var(--muted2)" : "var(--bg, #0a0a0a)" } as React.CSSProperties} />
                </button>
              </div>
            ))}
          </div>
          <div className={cx("text10", "colorMuted", "mt10")}>
            Muted categories are hidden from all views until re-enabled here.
          </div>
        </div>
      )}

      {/* ── Priority Alert Banner ─────────────────────────────────────── */}
      {actionRequired > 0 && (
        <div className={cx("card", "ntfAlertCard", "dynBorderLeft3")} style={{ "--color": "var(--red)" } as React.CSSProperties}>
          <div className={cx("flexRow", "gap12")}>
            <div className={cx("ntfAlertIconBox")}>
              <Ic n="alert" sz={15} c="var(--red)" />
            </div>
            <div className={cx("flex1")}>
              <div className={cx("fw700", "text12", "colorRed")}>Urgent attention required</div>
              <div className={cx("text11", "colorMuted")}>
                {actionRequired} high-priority item{actionRequired !== 1 ? "s need" : " needs"} your immediate action
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Filter Tabs ───────────────────────────────────────────────── */}
      <div className={cx("ntfTabRow", "mb12")}>
        {TABS.map(tab => {
          const count = tabUnread(tab.id);
          return (
            <button key={tab.id} type="button"
              className={cx("ntfTab", activeTab === tab.id ? "ntfTabActive" : "", "dynColor")}
              onClick={() => setActiveTab(tab.id)}
              style={{ "--color": activeTab === tab.id ? "#050508" : "inherit" } as React.CSSProperties}>
              <Ic n={tab.icon} sz={11} c={activeTab === tab.id ? "#050508" : "var(--muted2)"} />
              {tab.label}
              {count > 0 && <span className={cx("ntfTabBadge")}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* ── Notification List ─────────────────────────────────────────── */}
      <div className={cx("card")}>
        {filtered.length === 0 ? (
          <div className={cx("ntfEmpty")}>
            <div className={cx("ntfEmptyIco")}>
              <Ic n="bell" sz={20} c="var(--muted2)" />
            </div>
            <div className={cx("emptyStateTitle")}>All caught up</div>
            <div className={cx("emptyStateDesc")}>
              No notifications in this category. We&apos;ll alert you the moment something needs attention.
            </div>
          </div>
        ) : (
          GROUPS.map(group => {
            const rows = filtered.filter(n => n.group === group);
            if (rows.length === 0) return null;
            return (
              <div key={group}>
                <div className={cx("ntfGroupLabel")}>{group.toUpperCase()}</div>

                {rows.map(n => {
                  const isExpanded = expanded === n.id;
                  return (
                    <div key={n.id} className={cx("ntfRow", n.unread ? "ntfRowUnread" : "")}>

                      {/* Priority / color accent bar */}
                      <div className={cx("ntfAccent", "dynBgColor")} style={{ "--bg-color": n.color, "--op": n.priority === "high" ? 1 : 0.6 } as React.CSSProperties} />

                      {/* Tinted icon box */}
                      <div className={cx("ntfIconBox", "dynBgColor")} style={{ "--bg-color": `color-mix(in oklab, ${n.color} 20%, var(--s3))`, "--color": `color-mix(in oklab, ${n.color} 40%, transparent)` } as React.CSSProperties}>
                        <Ic n={n.icon} sz={16} c={n.color} />
                      </div>

                      {/* Content */}
                      <div className={cx("ntfContent", "pointer")} onClick={() => toggleExpand(n.id)} >
                        <div className={cx("ntfHead")}>
                          <span className={cx("ntfTitle", !n.unread ? "ntfTitleRead" : "")}>{n.title}</span>
                          {n.unread && <span className={cx("ntfDot")} aria-label="Unread" />}
                          <span className={cx("badge", n.badge)}>{n.badgeLbl}</span>
                          {n.priority === "high" && (
                            <span className={cx("badge", "badgeRed", "flexRow", "flexCenter", "gap3")}>
                              <Ic n="alert" sz={8} c="currentColor" /> Urgent
                            </span>
                          )}
                        </div>

                        <div className={cx("ntfBody")}>{n.body}</div>

                        {/* Expanded detail */}
                        {isExpanded && n.detail && (
                          <div className={cx("mt8", "p10x12", "rSm", "bgS3", "borderB1")}>
                            <p className={cx("text11", "colorMuted", "lineH175")}>{n.detail}</p>
                          </div>
                        )}

                        <div className={cx("ntfMeta")}>
                          <Av initials={n.senderInitials} size={16} />
                          <span className={cx("ntfTime")}>{n.sender}</span>
                          <span className={cx("ntfTime")}>·</span>
                          <span className={cx("ntfTime")}>{n.time}</span>
                          {n.detail && (
                            <>
                              <span className={cx("ntfTime")}>·</span>
                              <span className={cx("ntfTime", "flexRow", "flexCenter", "gap2")}>
                                <Ic n={isExpanded ? "chevronDown" : "chevronRight"} sz={9} c="var(--muted2)" />
                                {isExpanded ? "less" : "more"}
                              </span>
                            </>
                          )}
                        </div>

                        {n.action && (
                          <div className={cx("ntfActionRow")}>
                            <button type="button" className={cx("btnSm", n.actionCls, "dynColor")} style={{ "--color": "inherit" } as React.CSSProperties}
                              onClick={e => { e.stopPropagation(); markRead(n.id); }}>
                              {n.action}
                            </button>
                            {n.secondaryAction && (
                              <button type="button" className={cx("btnSm", "btnGhost", "dynColor")} style={{ "--color": "inherit" } as React.CSSProperties}
                                onClick={e => e.stopPropagation()}>
                                {n.secondaryAction}
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right: dismiss + snooze */}
                      <div className={cx("ntfRight")}>
                        <button type="button" className={cx("ntfDismiss")} aria-label="Dismiss"
                          onClick={e => { e.stopPropagation(); dismiss(n.id); }}>
                          ×
                        </button>
                        <button type="button" aria-label="Snooze for 24h" title="Snooze"
                          onClick={e => { e.stopPropagation(); snooze(n.id); }}
                          className={cx("ntfSnoozeBtn")}
                          onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                          onMouseLeave={e => (e.currentTarget.style.opacity = "0.35")}
                        >
                          <Ic n="clock" sz={12} c="var(--muted2)" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}

        {/* Snoozed strip */}
        {snoozedCount > 0 && (
          <div className={cx("p10x16", "bgS3", "flexRow", "gap8", filtered.length > 0 && "borderT")}>
            <Ic n="clock" sz={12} c="var(--muted2)" />
            <span className={cx("text11", "colorMuted")}>
              {snoozedCount} notification{snoozedCount !== 1 ? "s" : ""} snoozed
            </span>
            <button type="button" className={cx("btnSm", "btnGhost", "mlAuto", "colorInherit")} onClick={() => {
              if (session) {
                void restoreSnoozedPortalNotificationsWithRefresh(session).then((r) => {
                  if (r.nextSession) saveSession(r.nextSession);
                  setRefreshTick((value) => value + 1);
                });
              }
            }}>
              Restore all
            </button>
          </div>
        )}

        {filtered.length > 0 && (
          <div className={cx("ntfFooter")}>
            <span className={cx("text11", "colorMuted")}>
              Showing all {filtered.length} notification{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

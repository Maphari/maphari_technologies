import { useEffect, useMemo, useState } from "react";
import type { DashboardNotificationJobLite } from "../../../../lib/types/dashboard";
import { cx, styles } from "../style";
import { formatDateShort, formatRelative } from "../utils";

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */

type TimelineEvent = {
  id: string;
  projectId: string | null;
  category: "PROJECT" | "LEAD" | "BLOCKER";
  title: string;
  detail: string | null;
  createdAt: string;
};

type NotificationAction = {
  label: string;
  accent?: boolean;
};

type NotificationRow = {
  id: string;
  group: string;
  unread: boolean;
  icon: string;
  iconBg: string;
  iconColor: string;
  dot: string;
  tag: string;
  tagStyle: "tag-green" | "tag-purple" | "tag-amber" | "tag-red" | "tag-muted";
  title: string;
  desc: string;
  time: string;
  actions: NotificationAction[];
};

type ActivityRow = {
  id: string;
  day: string;
  time: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  dot: string;
  category: "projects" | "invoices" | "messages" | "documents" | "operations";
  tag: "ev-green" | "ev-purple" | "ev-amber" | "ev-red" | "ev-muted";
  tagLabel: string;
  project: string;
  title: string;
  desc: string;
  highlighted: boolean;
  action: NotificationAction | null;
  timestamp: number;
};

type NotificationsPageProps = {
  active: boolean;
  notifications: DashboardNotificationJobLite[];
  selectedNotificationId: string | null;
  timelineEvents: TimelineEvent[];
  onClose: () => void;
  onSelectNotification: (notificationId: string) => void;
  onToggleRead: (notificationId: string, nextRead: boolean) => void;
  onMarkAllRead: () => void;
};

type SideFilterId =
  | "all"
  | "projects"
  | "invoices"
  | "messages"
  | "documents"
  | "operations"
  | "approvals";

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────── */

const NOTIF_TABS = [
  "All",
  "Unread",
  "Projects",
  "Invoices",
  "Messages",
] as const;
const ACT_TABS = ["All", "Today", "This Week", "Older"] as const;

type NotifTab = (typeof NOTIF_TABS)[number];
type ActivityTab = (typeof ACT_TABS)[number];

/* ─────────────────────────────────────────────────────────────
   FALLBACK DATA  (shown when real data is empty)
───────────────────────────────────────────────────────────── */

const FALLBACK_NOTIFS: NotificationRow[] = [
  {
    id: "n1",
    group: "Today",
    unread: true,
    icon: "🧾",
    iconBg: "var(--red-dim)",
    iconColor: "var(--red)",
    dot: "var(--red)",
    tag: "invoices",
    tagStyle: "tag-red",
    title: "INV-2026-011 is overdue",
    desc: "Invoice for Client Portal v2 — R 16,000 — was due Feb 03. Immediate action required.",
    time: "2m ago",
    actions: [{ label: "Pay now", accent: true }, { label: "Dismiss" }],
  },
  {
    id: "n2",
    group: "Today",
    unread: true,
    icon: "✓",
    iconBg: "var(--accent-dim)",
    iconColor: "var(--accent)",
    dot: "var(--accent)",
    tag: "projects",
    tagStyle: "tag-green",
    title: "UAT sign-off requested",
    desc: "James M. needs you to approve UAT checklist items 1–7 on Lead Pipeline Rebuild before Friday.",
    time: "2h ago",
    actions: [{ label: "Review", accent: true }, { label: "Skip" }],
  },
  {
    id: "n3",
    group: "Today",
    unread: true,
    icon: "💬",
    iconBg: "var(--purple-dim)",
    iconColor: "var(--purple)",
    dot: "var(--purple)",
    tag: "messages",
    tagStyle: "tag-purple",
    title: "New message from Thabo K.",
    desc: "Stripe integration is live on staging. Awaiting your confirmation to proceed to production.",
    time: "5h ago",
    actions: [{ label: "Reply", accent: true }],
  },
  {
    id: "n4",
    group: "Yesterday",
    unread: false,
    icon: "→",
    iconBg: "var(--amber-dim)",
    iconColor: "var(--amber)",
    dot: "var(--amber)",
    tag: "projects",
    tagStyle: "tag-amber",
    title: "Milestone approval pending",
    desc: "Backend API delivery milestone needs your sign-off to unlock production deployment.",
    time: "Yesterday",
    actions: [{ label: "Approve", accent: true }, { label: "Reject" }],
  },
  {
    id: "n5",
    group: "Yesterday",
    unread: false,
    icon: "📄",
    iconBg: "var(--purple-dim)",
    iconColor: "var(--purple)",
    dot: "var(--muted2)",
    tag: "documents",
    tagStyle: "tag-muted",
    title: "New file uploaded",
    desc: "Lerato N. uploaded updated screens to Figma. Export added to your document library.",
    time: "Yesterday",
    actions: [],
  },
  {
    id: "n6",
    group: "This Week",
    unread: false,
    icon: "✓",
    iconBg: "var(--accent-dim)",
    iconColor: "var(--accent)",
    dot: "var(--accent)",
    tag: "invoices",
    tagStyle: "tag-green",
    title: "Payment received — R 22,000",
    desc: "INV-2026-008 (Veldt Finance Risk Dashboard) has been marked as paid. Receipt is available.",
    time: "Feb 18",
    actions: [{ label: "Download PDF" }],
  },
  {
    id: "n7",
    group: "This Week",
    unread: false,
    icon: "⚠",
    iconBg: "var(--red-dim)",
    iconColor: "var(--red)",
    dot: "var(--amber)",
    tag: "operations",
    tagStyle: "tag-amber",
    title: "Project milestone SLA closing",
    desc: "Design sign-off window closes in 2 days. Delay may push production launch to Q2.",
    time: "Feb 17",
    actions: [{ label: "View timeline" }],
  },
];

const FALLBACK_EVENTS: Omit<ActivityRow, "timestamp">[] = [
  {
    id: "e1",
    day: "Today",
    time: "09:14",
    icon: "🧾",
    iconBg: "var(--red-dim)",
    iconColor: "var(--red)",
    dot: "var(--red)",
    category: "invoices",
    tag: "ev-red",
    tagLabel: "Invoice",
    project: "Client Portal v2",
    title: "INV-2026-011 Overdue — R 16,000",
    desc: "Payment is 18 days overdue. Client has been notified via email. Immediate action required to avoid service pause.",
    highlighted: true,
    action: { label: "Pay Now", accent: true },
  },
  {
    id: "e2",
    day: "Today",
    time: "08:52",
    icon: "✓",
    iconBg: "var(--accent-dim)",
    iconColor: "var(--accent)",
    dot: "var(--accent)",
    category: "projects",
    tag: "ev-green",
    tagLabel: "Milestone",
    project: "Lead Pipeline Rebuild",
    title: "UAT Sign-off Requested",
    desc: "James M. has marked the UAT checklist ready. Items 1–7 require client approval before the production deployment window opens.",
    highlighted: true,
    action: { label: "Review", accent: true },
  },
  {
    id: "e3",
    day: "Today",
    time: "06:30",
    icon: "💬",
    iconBg: "var(--purple-dim)",
    iconColor: "var(--purple)",
    dot: "var(--purple)",
    category: "messages",
    tag: "ev-purple",
    tagLabel: "Message",
    project: "Client Portal v2",
    title: "Thabo K. replied in thread",
    desc: "Stripe integration confirmed live on staging. Deployment token and checklist shared in thread.",
    highlighted: false,
    action: { label: "Reply", accent: false },
  },
  {
    id: "e4",
    day: "Yesterday",
    time: "17:44",
    icon: "→",
    iconBg: "var(--amber-dim)",
    iconColor: "var(--amber)",
    dot: "var(--amber)",
    category: "projects",
    tag: "ev-amber",
    tagLabel: "Approval",
    project: "Lead Pipeline Rebuild",
    title: "Milestone Approval Pending",
    desc: "Backend API delivery milestone is awaiting client decision. Blocking UAT entry and final integration tests.",
    highlighted: false,
    action: { label: "Decide", accent: true },
  },
  {
    id: "e5",
    day: "Yesterday",
    time: "14:20",
    icon: "📄",
    iconBg: "var(--purple-dim)",
    iconColor: "var(--purple)",
    dot: "var(--muted2)",
    category: "documents",
    tag: "ev-muted",
    tagLabel: "File",
    project: "Automation Suite",
    title: "Updated Screens Exported to Document Library",
    desc: "Lerato N. pushed 14 updated screens from Figma. All files indexed and available in Documents.",
    highlighted: false,
    action: { label: "View", accent: false },
  },
  {
    id: "e6",
    day: "Yesterday",
    time: "11:05",
    icon: "⚙",
    iconBg: "var(--accent-dim)",
    iconColor: "var(--accent)",
    dot: "var(--accent)",
    category: "operations",
    tag: "ev-green",
    tagLabel: "Automation",
    project: "All Projects",
    title: "Invoice Reminder Engine Triggered",
    desc: "3 automated reminders dispatched to billing contacts for overdue and due-soon invoices.",
    highlighted: false,
    action: null,
  },
  {
    id: "e7",
    day: "Feb 18",
    time: "16:00",
    icon: "✓",
    iconBg: "var(--accent-dim)",
    iconColor: "var(--accent)",
    dot: "var(--accent)",
    category: "invoices",
    tag: "ev-green",
    tagLabel: "Invoice",
    project: "Veldt Finance",
    title: "Payment Received — R 22,000",
    desc: "INV-2026-008 marked as paid. Receipt auto-generated and stored in document library.",
    highlighted: false,
    action: { label: "PDF", accent: false },
  },
  {
    id: "e8",
    day: "Feb 18",
    time: "10:30",
    icon: "⚠",
    iconBg: "var(--amber-dim)",
    iconColor: "var(--amber)",
    dot: "var(--amber)",
    category: "projects",
    tag: "ev-amber",
    tagLabel: "Risk",
    project: "Client Portal v2",
    title: "SLA Window Closing in 48 Hours",
    desc: "Design sign-off deadline is approaching. Missing the window may push the production launch from Mar 14 to Q2.",
    highlighted: false,
    action: { label: "Act", accent: true },
  },
  {
    id: "e9",
    day: "Feb 17",
    time: "15:12",
    icon: "💬",
    iconBg: "var(--purple-dim)",
    iconColor: "var(--purple)",
    dot: "var(--purple)",
    category: "messages",
    tag: "ev-purple",
    tagLabel: "Message",
    project: "Lead Pipeline Rebuild",
    title: "James M. sent UAT checklist",
    desc: "Full UAT checklist shared via thread. 7 items require sign-off. Deadline is end of this week.",
    highlighted: false,
    action: { label: "Open", accent: false },
  },
  {
    id: "e10",
    day: "Feb 17",
    time: "09:00",
    icon: "🚀",
    iconBg: "var(--accent-dim)",
    iconColor: "var(--accent)",
    dot: "var(--accent)",
    category: "projects",
    tag: "ev-green",
    tagLabel: "Progress",
    project: "Lead Pipeline Rebuild",
    title: "Backend API Deployed to Staging",
    desc: "All 14 endpoints deployed and documented in Notion. Load testing pending UAT sign-off.",
    highlighted: false,
    action: null,
  },
  {
    id: "e11",
    day: "Feb 15",
    time: "14:32",
    icon: "📋",
    iconBg: "var(--amber-dim)",
    iconColor: "var(--amber)",
    dot: "var(--amber)",
    category: "projects",
    tag: "ev-amber",
    tagLabel: "Approval",
    project: "Automation Suite",
    title: "New Scope Request Submitted",
    desc: "Client submitted a change request for 3 additional workflow automations. Pending admin estimate.",
    highlighted: false,
    action: { label: "Review", accent: false },
  },
  {
    id: "e12",
    day: "Feb 12",
    time: "10:00",
    icon: "📣",
    iconBg: "var(--purple-dim)",
    iconColor: "var(--purple)",
    dot: "var(--purple)",
    category: "operations",
    tag: "ev-purple",
    tagLabel: "System",
    project: "All Projects",
    title: "Q1 Kickoff Notes Shared",
    desc: "Meeting summary and project priorities for Q1 attached to the General thread.",
    highlighted: false,
    action: { label: "Read", accent: false },
  },
];

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */

function groupFromDate(value?: string): string {
  if (!value) return "This Week";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "This Week";
  const now = new Date();
  const startNow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const startDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
  const diff = Math.floor((startNow - startDate) / 86_400_000);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return "This Week";
  return formatDateShort(value);
}

function labelizeKey(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function parseJsonRecord(value: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed)
    ) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }
  return null;
}

function normalizeMessage(message: string | null | undefined): string | null {
  if (!message) return null;
  const trimmed = message.trim();
  const parsed = parseJsonRecord(trimmed);
  if (!parsed) return trimmed;
  const text =
    typeof parsed.message === "string"
      ? parsed.message
      : typeof parsed.detail === "string"
        ? parsed.detail
        : null;
  if (text) return text;
  const pairs = Object.entries(parsed)
    .slice(0, 3)
    .map(([key, val]) => `${labelizeKey(key)}: ${String(val)}`);
  return pairs.length > 0 ? pairs.join(" · ") : trimmed;
}

function explainMetadata(
  metadata?: Record<string, string | number | boolean>,
): string | null {
  if (!metadata || Object.keys(metadata).length === 0) return null;
  const lines = Object.entries(metadata)
    .slice(0, 4)
    .map(([key, val]) => `${labelizeKey(key)}: ${String(val)}`);
  return lines.length > 0 ? lines.join(" · ") : null;
}

function buildNotificationDescription(
  job: DashboardNotificationJobLite,
  fallback: string,
): string {
  const messageText = normalizeMessage(job.message);
  const metadataText = explainMetadata(job.metadata);
  if (messageText && metadataText) return `${messageText} · ${metadataText}`;
  if (messageText) return messageText;
  if (metadataText) return metadataText;
  return fallback;
}

/* ─────────────────────────────────────────────────────────────
   DATA TRANSFORMERS
───────────────────────────────────────────────────────────── */

function toNotificationRows(
  items: DashboardNotificationJobLite[],
): NotificationRow[] {
  if (items.length === 0) return FALLBACK_NOTIFS;

  return items.map((job) => {
    const tag =
      job.tab === "invoices"
        ? "invoices"
        : job.tab === "messages"
          ? "messages"
          : job.tab === "settings"
            ? "documents"
            : job.tab === "operations"
              ? "operations"
              : "projects";

    const icon =
      tag === "invoices"
        ? "🧾"
        : tag === "messages"
          ? "💬"
          : tag === "documents"
            ? "📄"
            : tag === "operations"
              ? "⚙"
              : "✓";

    const iconBg =
      tag === "invoices"
        ? "var(--red-dim)"
        : tag === "messages"
          ? "var(--purple-dim)"
          : tag === "documents"
            ? "var(--purple-dim)"
            : tag === "operations"
              ? "var(--amber-dim)"
              : "var(--accent-dim)";

    const iconColor =
      tag === "invoices"
        ? "var(--red)"
        : tag === "messages"
          ? "var(--purple)"
          : tag === "documents"
            ? "var(--purple)"
            : tag === "operations"
              ? "var(--amber)"
              : "var(--accent)";

    const tagStyle: NotificationRow["tagStyle"] =
      tag === "invoices"
        ? "tag-red"
        : tag === "messages"
          ? "tag-purple"
          : tag === "operations"
            ? "tag-amber"
            : tag === "documents"
              ? "tag-muted"
              : "tag-green";

    const defaultActions: NotificationAction[] =
      tag === "invoices"
        ? [{ label: "Pay now", accent: true }]
        : tag === "messages"
          ? [{ label: "Reply", accent: true }]
          : tag === "projects"
            ? [{ label: "Review", accent: true }]
            : tag === "documents"
              ? [{ label: "Open file" }]
              : [{ label: "View timeline" }];

    return {
      id: job.id,
      group: groupFromDate(job.createdAt),
      unread: !job.readAt,
      icon,
      iconBg,
      iconColor,
      dot: iconColor,
      tag,
      tagStyle,
      title: job.subject ?? "Notification update",
      desc: buildNotificationDescription(
        job,
        "A new update is available in your dashboard.",
      ),
      time: formatRelative(job.createdAt ?? null),
      actions: defaultActions,
    };
  });
}

function toEventRows(items: TimelineEvent[]): ActivityRow[] {
  if (items.length === 0) {
    const now = Date.now();
    return FALLBACK_EVENTS.map((event, index) => ({
      ...event,
      timestamp: now - index * 60_000,
    }));
  }

  return items
    .map((event) => {
      const created = new Date(event.createdAt);
      const timestamp = Number.isNaN(created.getTime()) ? 0 : created.getTime();
      const day = groupFromDate(event.createdAt);
      const time = Number.isNaN(created.getTime())
        ? "--:--"
        : new Intl.DateTimeFormat("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }).format(created);

      if (event.category === "BLOCKER") {
        return {
          id: event.id,
          day,
          time,
          icon: "⚠",
          iconBg: "var(--amber-dim)",
          iconColor: "var(--amber)",
          dot: "var(--amber)",
          category: "operations" as const,
          tag: "ev-amber" as const,
          tagLabel: "Risk",
          project: event.projectId
            ? `Project ${event.projectId.slice(0, 8)}`
            : "All Projects",
          title: event.title,
          desc: event.detail ?? "Timeline risk update",
          highlighted: true,
          action: { label: "Act", accent: true },
          timestamp,
        };
      }

      if (event.category === "LEAD") {
        return {
          id: event.id,
          day,
          time,
          icon: "💬",
          iconBg: "var(--purple-dim)",
          iconColor: "var(--purple)",
          dot: "var(--purple)",
          category: "messages" as const,
          tag: "ev-purple" as const,
          tagLabel: "Message",
          project: event.projectId
            ? `Project ${event.projectId.slice(0, 8)}`
            : "All Projects",
          title: event.title,
          desc: event.detail ?? "Timeline lead update",
          highlighted: false,
          action: { label: "Open", accent: false },
          timestamp,
        };
      }

      return {
        id: event.id,
        day,
        time,
        icon: "✓",
        iconBg: "var(--accent-dim)",
        iconColor: "var(--accent)",
        dot: "var(--accent)",
        category: "projects" as const,
        tag: "ev-green" as const,
        tagLabel: "Milestone",
        project: event.projectId
          ? `Project ${event.projectId.slice(0, 8)}`
          : "All Projects",
        title: event.title,
        desc: event.detail ?? "Timeline project update",
        highlighted: false,
        action: { label: "Open", accent: false },
        timestamp,
      };
    })
    .sort((a, b) => b.timestamp - a.timestamp);
}

/* ─────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────── */

export function ClientNotificationsPage({
  active,
  notifications,
  selectedNotificationId,
  timelineEvents,
  onClose,
  onSelectNotification,
  onToggleRead,
  onMarkAllRead,
}: NotificationsPageProps) {
  /* view state */
  const [view, setView] = useState<"notif" | "activity">("notif");

  /* notification panel state */
  const [activeNotifTab, setActiveNotifTab] = useState<NotifTab>("All");
  const [panelRows, setPanelRows] = useState<NotificationRow[]>(() =>
    toNotificationRows(notifications),
  );

  /* bulk selection state */
  const [selectedNotifs, setSelectedNotifs] = useState<Set<string>>(new Set());
  const toggleNotifSelect = (id: string) => {
    setSelectedNotifs(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleNotifSelectAll = () => {
    if (selectedNotifs.size === filteredNotifications.length) {
      setSelectedNotifs(new Set());
    } else {
      setSelectedNotifs(new Set(filteredNotifications.map(n => n.id)));
    }
  };
  const bulkMarkRead = () => {
    const ids = [...selectedNotifs];
    setPanelRows(prev => prev.map(item => ids.includes(item.id) ? { ...item, unread: false } : item));
    ids.forEach(id => { if (realIds.has(id)) onToggleRead(id, true); });
    setSelectedNotifs(new Set());
  };
  const bulkArchive = () => {
    const ids = [...selectedNotifs];
    setPanelRows(prev => prev.filter(item => !ids.includes(item.id)));
    setSelectedNotifs(new Set());
  };

  /* activity screen state */
  const [sideFilter, setSideFilter] = useState<SideFilterId>("all");
  const [activeActivityTab, setActiveActivityTab] =
    useState<ActivityTab>("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(1);

  const realIds = useMemo(
    () => new Set(notifications.map((item) => item.id)),
    [notifications],
  );
  const events = useMemo(() => toEventRows(timelineEvents), [timelineEvents]);

  /* sync panel rows when notifications prop changes */
  useEffect(() => {
    setPanelRows(toNotificationRows(notifications));
  }, [notifications]);

  /* reset to panel view when page becomes inactive */
  useEffect(() => {
    if (!active) setView("notif");
  }, [active]);

  /* reset pagination when filters change */
  useEffect(() => {
    setPage(1);
  }, [activeActivityTab, search, sideFilter, sort]);

  /* ── notification panel derived data ── */

  const unreadCount = useMemo(
    () => panelRows.filter((item) => item.unread).length,
    [panelRows],
  );

  const filteredNotifications = useMemo(() => {
    return panelRows.filter((item) => {
      if (activeNotifTab === "All") return true;
      if (activeNotifTab === "Unread") return item.unread;
      if (activeNotifTab === "Projects") return item.tag === "projects";
      if (activeNotifTab === "Invoices") return item.tag === "invoices";
      if (activeNotifTab === "Messages") return item.tag === "messages";
      return true;
    });
  }, [activeNotifTab, panelRows]);

  const notifGroups = useMemo(
    () => [...new Set(filteredNotifications.map((item) => item.group))],
    [filteredNotifications],
  );

  /* ── activity screen derived data ── */

  const sideFilters = useMemo(
    () => [
      {
        label: "All Activity",
        id: "all" as const,
        dot: "var(--accent)",
        count: events.length,
        countClass: "",
      },
      {
        label: "Projects",
        id: "projects" as const,
        dot: "var(--accent)",
        count: events.filter((item) => item.category === "projects").length,
        countClass: "",
      },
      {
        label: "Invoices",
        id: "invoices" as const,
        dot: "var(--red)",
        count: events.filter((item) => item.category === "invoices").length,
        countClass: "red",
      },
      {
        label: "Messages",
        id: "messages" as const,
        dot: "var(--purple)",
        count: events.filter((item) => item.category === "messages").length,
        countClass: "purple",
      },
      {
        label: "Documents",
        id: "documents" as const,
        dot: "var(--muted2)",
        count: events.filter((item) => item.category === "documents").length,
        countClass: "",
      },
      {
        label: "Operations",
        id: "operations" as const,
        dot: "var(--amber)",
        count: events.filter((item) => item.category === "operations").length,
        countClass: "amber",
      },
      {
        label: "Approvals",
        id: "approvals" as const,
        dot: "var(--amber)",
        count: events.filter((item) => item.tagLabel === "Approval").length,
        countClass: "amber",
      },
    ],
    [events],
  );

  const filteredEvents = useMemo(() => {
    const sideFiltered = events.filter((item) => {
      if (sideFilter === "all") return true;
      if (sideFilter === "approvals") return item.tagLabel === "Approval";
      return item.category === sideFilter;
    });

    const tabFiltered = sideFiltered.filter((item) => {
      if (activeActivityTab === "Today") return item.day === "Today";
      if (activeActivityTab === "This Week")
        return ["Today", "Yesterday", "Feb 18", "Feb 17"].includes(item.day);
      if (activeActivityTab === "Older")
        return ["Feb 15", "Feb 12"].includes(item.day);
      return true;
    });

    const query = search.trim().toLowerCase();
    const searchFiltered =
      query.length === 0
        ? tabFiltered
        : tabFiltered.filter(
            (item) =>
              item.title.toLowerCase().includes(query) ||
              item.desc.toLowerCase().includes(query) ||
              item.project.toLowerCase().includes(query),
          );

    return [...searchFiltered].sort((a, b) =>
      sort === "newest" ? b.timestamp - a.timestamp : a.timestamp - b.timestamp,
    );
  }, [activeActivityTab, events, search, sideFilter, sort]);

  const stats = useMemo(
    () => ({
      total: events.length,
      invoices: events.filter((item) => item.category === "invoices").length,
      projects: events.filter((item) => item.category === "projects").length,
      messages: events.filter((item) => item.category === "messages").length,
    }),
    [events],
  );

  const PER_PAGE = 8;
  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PER_PAGE));
  const pagedEvents = filteredEvents.slice(
    (page - 1) * PER_PAGE,
    page * PER_PAGE,
  );
  const days = [...new Set(pagedEvents.map((item) => item.day))];

  /* ── handlers ── */

  const markRead = (id: string): void => {
    setPanelRows((prev) =>
      prev.map((item) => (item.id === id ? { ...item, unread: false } : item)),
    );
    if (realIds.has(id)) onToggleRead(id, true);
  };

  const markAllRead = (): void => {
    setPanelRows((prev) => prev.map((item) => ({ ...item, unread: false })));
    if (notifications.some((item) => !item.readAt)) onMarkAllRead();
  };

  /* ─────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────── */

  return (
    <section
      className={cx("page", active && "pageActive")}
      id="page-notifications"
    >
      {/* ══════════════════════════════════
          NOTIFICATION PANEL
      ══════════════════════════════════ */}
      {view === "notif" ? (
        <div className={styles["notif-popup-backdrop"]}>
          <div className={cx("notif-shell", "grain", "notif-shell-popup")}>
            <div className={styles["glow-orb"]} />

            <div className={styles.panel}>
              {/* header */}
              <div className={styles["p-header"]}>
                <div className={styles["p-header-left"]}>
                  <div className={styles["p-hicon"]}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 3a6 6 0 0 0-6 6v2.6l-1.4 2.8A1 1 0 0 0 5.5 16h13a1 1 0 0 0 .9-1.6L18 11.6V9a6 6 0 0 0-6-6Zm0 18a3 3 0 0 0 2.8-2H9.2A3 3 0 0 0 12 21Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                  <span className={styles["p-title"]}>Notifications</span>
                  {unreadCount > 0 ? (
                    <span className={styles["p-count"]}>{unreadCount}</span>
                  ) : null}
                </div>

                <div className={styles["p-actions"]}>
                  <input
                    type="checkbox"
                    title="Select all notifications"
                    className={styles.selectCheckbox}
                    checked={filteredNotifications.length > 0 && selectedNotifs.size === filteredNotifications.length}
                    onChange={toggleNotifSelectAll}
                  />
                  {selectedNotifs.size > 0 ? (
                    <>
                      <button
                        className={styles["mark-all"]}
                        type="button"
                        onClick={bulkMarkRead}
                      >
                        Mark Read
                      </button>
                      <button
                        className={styles["mark-all"]}
                        type="button"
                        onClick={bulkArchive}
                      >
                        Archive
                      </button>
                    </>
                  ) : unreadCount > 0 ? (
                    <button
                      className={styles["mark-all"]}
                      type="button"
                      onClick={markAllRead}
                    >
                      Mark all read
                    </button>
                  ) : null}
                  <button
                    className={styles["close-btn"]}
                    type="button"
                    aria-label="Close"
                    onClick={onClose}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path
                        d="M1 1l8 8M9 1L1 9"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* tabs */}
              <div className={styles["p-tabs"]}>
                {NOTIF_TABS.map((tab) => (
                  <button
                    key={tab}
                    className={cx("p-tab", activeNotifTab === tab && "active")}
                    type="button"
                    onClick={() => setActiveNotifTab(tab)}
                  >
                    {tab}
                    {tab === "Unread" && unreadCount > 0
                      ? ` (${unreadCount})`
                      : ""}
                  </button>
                ))}
              </div>

              {/* body */}
              <div className={styles["p-body"]}>
                {filteredNotifications.length === 0 ? (
                  <div className={styles["p-empty"]}>
                    <div className={styles["p-empty-icon"]}>✓</div>
                    <div>All clear — nothing here</div>
                  </div>
                ) : (
                  notifGroups.map((group) => (
                    <div key={group}>
                      <div className={styles.noteDateGroup}>{group}</div>
                      {filteredNotifications
                        .filter((item) => item.group === group)
                        .map((item) => (
                          <button
                            key={item.id}
                            className={cx("ni", item.unread && "unread")}
                            type="button"
                            onClick={() => {
                              markRead(item.id);
                              onSelectNotification(item.id);
                            }}
                          >
                            <input
                              type="checkbox"
                              title={`Select notification: ${item.title}`}
                              className={styles.selectCheckbox}
                              checked={selectedNotifs.has(item.id)}
                              onClick={(e) => e.stopPropagation()}
                              onChange={() => toggleNotifSelect(item.id)}
                              style={{ flexShrink: 0 }}
                            />
                            <div
                              className={styles["ni-icon"]}
                              style={{
                                backgroundColor: item.iconBg,
                                color: item.iconColor,
                              } as React.CSSProperties}
                            >
                              {item.icon}
                            </div>

                            <div className={styles["ni-body"]}>
                              <div className={styles["ni-row"]}>
                                <span className={styles["ni-ttl"]}>
                                  {item.title}
                                </span>
                                <span className={styles["ni-time"]}>
                                  {item.time}
                                </span>
                              </div>
                              <div className={styles["ni-desc"]}>
                                {item.desc}
                              </div>
                              <div className={styles["ni-tag-row"]}>
                                <span className={cx("ni-tag", item.tagStyle)}>
                                  {item.tag}
                                </span>
                                {item.actions.map((action) => (
                                  <span
                                    key={`${item.id}-${action.label}`}
                                    className={cx(
                                      "ni-action",
                                      action.accent && "accent",
                                    )}
                                    role="button"
                                    tabIndex={0}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      markRead(item.id);
                                    }}
                                    onKeyDown={(event) => {
                                      if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        markRead(item.id);
                                      }
                                    }}
                                  >
                                    {action.label}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {item.unread ? (
                              <div className={styles["ni-pulse"]} />
                            ) : null}
                          </button>
                        ))}
                    </div>
                  ))
                )}
              </div>

              {/* footer */}
              <div className={styles["p-footer"]}>
                <span className={styles["p-footer-meta"]}>
                  {unreadCount > 0
                    ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                    : "All notifications read"}
                </span>
                <button
                  className={styles["view-all-btn"]}
                  type="button"
                  onClick={() => setView("activity")}
                >
                  View all activity →
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ══════════════════════════════════
           ACTIVITY SCREEN
        ══════════════════════════════════ */
        <div className={cx("act-shell", "grain", "act-fullscreen")}>
          {/* top bar */}
          <div className={styles["act-topbar"]}>
            <button
              className={styles["act-topbar-back"]}
              type="button"
              onClick={() => setView("notif")}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M9 2L4 7l5 5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Notifications
            </button>
            <span className={styles["act-topbar-sep"]}>/</span>
            <span className={styles["act-topbar-crumb"]}>
              All Activity <span>/ log</span>
            </span>
            <div className={styles["act-topbar-spacer"]} />
            <div className={styles["act-topbar-search"]}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <circle
                  cx="7"
                  cy="7"
                  r="5"
                  stroke="var(--muted)"
                  strokeWidth="1.5"
                />
                <path
                  d="M11 11l3 3"
                  stroke="var(--muted)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <input
                placeholder="Search activity…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          <div className={styles["act-main"]}>
            {/* sidebar */}
            <aside className={styles["act-side"]}>
              <div className={styles["act-side-sec"]}>Streams</div>
              {sideFilters.map((item) => (
                <button
                  key={item.id}
                  className={cx(
                    "act-side-btn",
                    sideFilter === item.id && "act",
                  )}
                  type="button"
                  onClick={() => setSideFilter(item.id)}
                >
                  <span
                    className={styles["act-side-dot"]}
                    style={{ backgroundColor: item.dot } as React.CSSProperties}
                  />
                  {item.label}
                  {item.count > 0 ? (
                    <span className={cx("act-side-count", item.countClass)}>
                      {item.count}
                    </span>
                  ) : null}
                </button>
              ))}

              <div className={styles["act-divider"]} />

              <div className={styles["act-side-sec"]}>Quick Filters</div>
              {[
                { label: "Unread only", id: "unread" },
                { label: "Highlighted", id: "highlight" },
                { label: "Needs action", id: "action" },
              ].map((item) => (
                <button
                  key={item.id}
                  className={cx("act-side-btn", "act-side-btn-sm")}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </aside>

            {/* main content */}
            <div className={styles["act-content"]}>
              {/* page header */}
              <div className={styles["act-page-hd"]}>
                <div>
                  <div className={styles["act-eyebrow"]}>
                    Account
                  </div>
                  <div className={styles.pageTitle}>All Activity</div>
                  <div className={styles.pageSub}>
                    Complete chronological record across projects, invoices,
                    messages, and automations.
                  </div>
                </div>
                <div className={styles["act-hd-actions"]}>
                  <button className={cx("btn", "btn-ghost")} type="button">
                    📥 Export CSV
                  </button>
                  <button className={cx("btn", "btn-accent")} type="button">
                    + New Thread
                  </button>
                </div>
              </div>

              {/* stat strip */}
              <div className={styles["act-stats"]}>
                {[
                  {
                    lbl: "Total Events",
                    val: stats.total,
                    sub: "All streams",
                    bar: "var(--accent)",
                  },
                  {
                    lbl: "Project Updates",
                    val: stats.projects,
                    sub: "Milestones + tasks",
                    bar: "var(--accent)",
                  },
                  {
                    lbl: "Invoice Events",
                    val: stats.invoices,
                    sub: "Payments + dues",
                    bar: "var(--red)",
                  },
                  {
                    lbl: "Messages",
                    val: stats.messages,
                    sub: "Threads + replies",
                    bar: "var(--purple)",
                  },
                ].map((item, i) => (
                  <div key={item.lbl} className={styles["act-stat"]} style={{ "--i": i } as React.CSSProperties}>
                    <div
                      className={styles["act-stat-bar"]}
                      style={{ backgroundColor: item.bar } as React.CSSProperties}
                    />
                    <div className={styles["act-stat-lbl"]}>{item.lbl}</div>
                    <div className={styles["act-stat-val"]}>{item.val}</div>
                    <div className={styles["act-stat-sub"]}>{item.sub}</div>
                  </div>
                ))}
              </div>

              {/* filter bar */}
              <div className={styles["act-filter-bar"]}>
                {ACT_TABS.map((tab) => (
                  <button
                    key={tab}
                    className={cx(
                      "act-filter-tab",
                      activeActivityTab === tab && "act",
                    )}
                    type="button"
                    onClick={() => setActiveActivityTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
                <div className={styles["act-filter-right"]}>
                  <select
                    name="filter"
                    title="filtering-notifications"
                    className={styles["act-sort-select"]}
                    value={sort}
                    onChange={(event) =>
                      setSort(event.target.value as "newest" | "oldest")
                    }
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                  </select>
                </div>
              </div>

              {/* event feed */}
              <div className={styles["act-feed"]}>
                {pagedEvents.length === 0 ? (
                  <div className={styles["act-empty"]}>
                    <div className={styles["act-empty-icon"]}>◎</div>
                    <div>No activity matches your filter</div>
                  </div>
                ) : (
                  days.map((day) => (
                    <div key={day}>
                      {/* day divider */}
                      <div className={styles["act-day"]}>
                        <div className={styles["act-day-line"]} />
                        <div className={styles["act-day-lbl"]}>{day}</div>
                        <div className={styles["act-day-line"]} />
                      </div>

                      {pagedEvents
                        .filter((item) => item.day === day)
                        .map((item, index, sameDayList) => (
                          <button
                            key={item.id}
                            className={cx(
                              "act-event",
                              item.highlighted && "highlighted",
                            )}
                            type="button"
                          >
                            {/* timeline stem */}
                            <div className={styles["act-stem-col"]}>
                              <div
                                className={styles["act-stem-dot"]}
                                style={{ backgroundColor: item.dot } as React.CSSProperties}
                              />
                              {index < sameDayList.length - 1 ? (
                                <div className={styles["act-stem-line"]} />
                              ) : null}
                            </div>

                            {/* icon */}
                            <div
                              className={styles["act-ev-icon"]}
                              style={{
                                backgroundColor: item.iconBg,
                                color: item.iconColor,
                              } as React.CSSProperties}
                            >
                              {item.icon}
                            </div>

                            {/* body */}
                            <div className={styles["act-ev-body"]}>
                              <div className={styles["act-ev-row"]}>
                                <span className={styles["act-ev-title"]}>
                                  {item.title}
                                </span>
                                <span className={styles["act-ev-time"]}>
                                  {item.day} · {item.time}
                                </span>
                              </div>
                              <div className={styles["act-ev-desc"]}>
                                {item.desc}
                              </div>
                              <div className={styles["act-ev-meta"]}>
                                <span className={cx("ev-tag", item.tag)}>
                                  {item.tagLabel}
                                </span>
                                <span className={styles["ev-project"]}>
                                  {item.project}
                                </span>
                                {item.action ? (
                                  <span
                                    className={cx(
                                      "ev-action",
                                      item.action.accent && "accent",
                                    )}
                                    role="button"
                                    tabIndex={0}
                                    onClick={(event) => event.stopPropagation()}
                                    onKeyDown={(event) => {
                                      if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        event.stopPropagation();
                                      }
                                    }}
                                  >
                                    {item.action.label}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </button>
                        ))}
                    </div>
                  ))
                )}

                {/* pagination */}
                {totalPages > 1 ? (
                  <div className={styles["act-pagination"]}>
                    <button
                      className={styles["pg-btn"]}
                      type="button"
                      onClick={() => setPage((value) => Math.max(1, value - 1))}
                      disabled={page === 1}
                    >
                      ‹
                    </button>
                    {Array.from({ length: totalPages }, (_, index) => (
                      <button
                        key={index}
                        className={cx("pg-btn", page === index + 1 && "act")}
                        type="button"
                        onClick={() => setPage(index + 1)}
                      >
                        {index + 1}
                      </button>
                    ))}
                    <button
                      className={styles["pg-btn"]}
                      type="button"
                      onClick={() =>
                        setPage((value) => Math.min(totalPages, value + 1))
                      }
                      disabled={page === totalPages}
                    >
                      ›
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedNotificationId ? (
        <span className={styles["sr-only"]}>
          Selected notification {selectedNotificationId}
        </span>
      ) : null}
    </section>
  );
}

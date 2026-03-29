"use client";

import { useEffect, useState } from "react";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { loadAllCommLogsWithRefresh, type AdminCommunicationLog } from "../../../../lib/api/admin/client-ops";
import { loadAdminSnapshotWithRefresh } from "../../../../lib/api/admin/clients";

type CommType  = "email" | "call" | "meeting" | "slack";
type Direction = "inbound" | "outbound";
type Sentiment = "positive" | "neutral" | "negative";
type Tab       = "all comms" | "flagged" | "by client" | "analytics";

type CommItem = {
  id: string;
  client: string;
  clientColor: string;
  type: CommType;
  direction: Direction;
  from: string;
  to: string;
  subject: string;
  date: string;
  time: string;
  snippet: string;
  read: boolean;
  flagged: boolean;
  sentiment: Sentiment;
  duration?: string;
};

const typeConfig: Record<CommType, { icon: string; color: string; label: string }> = {
  email:   { icon: "✉",  color: "var(--blue)",   label: "Email"   },
  call:    { icon: "📞", color: "var(--accent)", label: "Call"    },
  meeting: { icon: "🤝", color: "var(--accent)", label: "Meeting" },
  slack:   { icon: "💬", color: "var(--amber)",  label: "Slack"   },
};

const sentimentConfig: Record<Sentiment, { color: string; icon: string }> = {
  positive: { color: "var(--accent)", icon: "▲" },
  neutral:  { color: "var(--muted)",  icon: "→" },
  negative: { color: "var(--red)",    icon: "▼" },
};

const tabs: Tab[] = ["all comms", "flagged", "by client", "analytics"];

const CLIENT_COLORS = ["var(--accent)", "var(--blue)", "var(--amber)", "var(--purple)", "var(--red)", "var(--green)"];

function normaliseType(t: string): CommType {
  const l = t.toLowerCase();
  if (l.includes("email")) return "email";
  if (l.includes("call"))  return "call";
  if (l.includes("meet"))  return "meeting";
  if (l.includes("slack")) return "slack";
  return "email";
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}
function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
}

function mapLog(log: AdminCommunicationLog, clientName: string, clientColor: string): CommItem {
  return {
    id:          log.id,
    client:      clientName,
    clientColor,
    type:        normaliseType(log.type),
    direction:   (log.direction.toLowerCase() as Direction) === "inbound" ? "inbound" : "outbound",
    from:        log.fromName ?? "Maphari",
    to:          clientName,
    subject:     log.subject,
    date:        fmtDate(log.occurredAt),
    time:        fmtTime(log.occurredAt),
    snippet:     log.actionLabel ?? "",
    read:        true,
    flagged:     false,
    sentiment:   "neutral",
  };
}

export function CommunicationAuditPage({ session }: { session: AuthSession | null }) {
  const [commsLog, setCommsLog]     = useState<CommItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [activeTab, setActiveTab]   = useState<Tab>("all comms");
  const [filterClient, setFilterClient] = useState("All");
  const [filterType, setFilterType]     = useState<"All" | CommType>("All");
  const [selectedComm, setSelectedComm] = useState<CommItem | null>(null);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setError(null);
      try {
        const [logRes, snapRes] = await Promise.all([
          loadAllCommLogsWithRefresh(session),
          loadAdminSnapshotWithRefresh(session),
        ]);
        if (cancelled) return;
        if (logRes.nextSession)        saveSession(logRes.nextSession);
        else if (snapRes.nextSession)  saveSession(snapRes.nextSession);

        if (logRes.error || snapRes.error) {
          const msg = logRes.error?.message ?? snapRes.error?.message ?? "Failed to load communication data";
          setError(msg);
          return;
        }

        // Build client color map (by index for consistency)
        const clients     = snapRes.data?.clients ?? [];
        const clientColorMap = new Map<string, { name: string; color: string }>(
          clients.map((c, i) => [c.id, { name: c.name, color: CLIENT_COLORS[i % CLIENT_COLORS.length] }])
        );
        setCommsLog(
          (logRes.data ?? []).map(l => {
            const info = clientColorMap.get(l.clientId);
            return mapLog(l, info?.name ?? "Client", info?.color ?? "var(--accent)");
          })
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [session]);

  const clientNames = ["All", ...new Set(commsLog.map(c => c.client))];
  const types: Array<"All" | CommType> = ["All", "email", "call", "meeting"];

  const filtered = commsLog
    .filter(c => filterClient === "All" || c.client === filterClient)
    .filter(c => filterType === "All" || c.type === filterType);

  const flagged     = commsLog.filter(c => c.flagged);
  const negSentiment = commsLog.filter(c => c.sentiment === "negative");
  const todayStr    = new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
  const totalToday  = commsLog.filter(c => c.date === todayStr).length;

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
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateTitle")}>Something went wrong</div>
          <div className={cx("emptyStateSub")}>{error}</div>
        </div>
      </div>
    );
  }

  const channelData = [
    { label: "Email", count: commsLog.filter(c => c.type === "email").length },
    { label: "Call", count: commsLog.filter(c => c.type === "call").length },
    { label: "Meeting", count: commsLog.filter(c => c.type === "meeting").length },
    { label: "Slack", count: commsLog.filter(c => c.type === "slack").length },
  ];

  const uniqueClients = [...new Set(commsLog.map(c => c.client))].length;

  const tableRows = filtered.slice(0, 50).map(c => ({
    client: c.client,
    channel: typeConfig[c.type].label,
    subject: c.subject,
    responseTime: c.duration ?? "—",
    status: c.flagged ? "flagged" : c.read ? "read" : "unread",
  }));

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>EXPERIENCE / COMMS AUDIT</div>
          <h1 className={styles.pageTitle}>Communication Audit</h1>
          <div className={styles.pageSub}>Message volume · Response times · Channel health</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnAccent")}>+ Log Communication</button>
        </div>
      </div>

      {/* Row 1 — Stats */}
      <WidgetGrid>
        <StatWidget label="Total Messages" value={commsLog.length} sub={`${totalToday} today`} tone="accent" />
        <StatWidget label="Avg Response Time" value="—" sub="Not tracked" tone="default" />
        <StatWidget label="Overdue Replies" value={flagged.length} sub="Flagged items" tone={flagged.length > 0 ? "red" : "default"} />
        <StatWidget label="Client Coverage" value={uniqueClients} sub="Clients with comms" tone="default" />
      </WidgetGrid>

      {/* Row 2 — Chart + Pipeline */}
      <WidgetGrid>
        <ChartWidget
          label="Messages by Channel"
          data={channelData}
          dataKey="count"
          type="bar"
          xKey="label"
          color="#8b6fff"
        />
        <PipelineWidget
          label="Channel Breakdown"
          stages={[
            { label: "Email", count: commsLog.filter(c => c.type === "email").length, total: Math.max(commsLog.length, 1), color: "#8b6fff" },
            { label: "Slack", count: commsLog.filter(c => c.type === "slack").length, total: Math.max(commsLog.length, 1), color: "#34d98b" },
            { label: "Portal", count: commsLog.filter(c => c.type === "meeting").length, total: Math.max(commsLog.length, 1), color: "#f5a623" },
          ]}
        />
      </WidgetGrid>

      {/* Row 3 — Table */}
      <WidgetGrid>
        <TableWidget
          label="Communication Threads"
          rows={tableRows as Record<string, unknown>[]}
          columns={[
            { key: "client", header: "Client" },
            { key: "channel", header: "Channel" },
            { key: "subject", header: "Last Message" },
            { key: "responseTime", header: "Response Time", align: "right" },
            { key: "status", header: "Status", align: "right", render: (v) => {
              const val = v as string;
              const cls = val === "flagged" ? cx("badge", "badgeRed") : val === "read" ? cx("badge", "badgeGreen") : cx("badge", "badgeMuted");
              return <span className={cls}>{val}</span>;
            }},
          ]}
          emptyMessage="No communication logs"
        />
      </WidgetGrid>
    </div>
  );
}

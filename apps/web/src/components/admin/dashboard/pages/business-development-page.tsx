// ════════════════════════════════════════════════════════════════════════════
// business-development-page.tsx — Admin Business Development page
// Data sources: loadAdminSnapshotWithRefresh (leads + client names)
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useCallback, useEffect, useState } from "react";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { loadAdminSnapshotWithRefresh } from "../../../../lib/api/admin";
import type { AdminLead, AdminClient, LeadPipelineStatus } from "../../../../lib/api/admin";
import { cx, styles } from "../style";
import { colorClass } from "./admin-page-utils";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "pipeline" | "analytics";
const tabs: Tab[] = ["pipeline", "analytics"];
type ViewMode = "list" | "kanban";

// ── Constants ─────────────────────────────────────────────────────────────────

const stageOrder: LeadPipelineStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"];

const stageColors: Record<LeadPipelineStatus, string> = {
  NEW: "var(--muted)",
  CONTACTED: "var(--blue)",
  QUALIFIED: "var(--purple)",
  PROPOSAL: "var(--amber)",
  WON: "var(--accent)",
  LOST: "var(--red)",
};

const stageLabel: Record<LeadPipelineStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  PROPOSAL: "Proposal",
  WON: "Won",
  LOST: "Lost",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-ZA", { day: "2-digit", month: "short" });
}

function fillClass(color: string): string {
  if (color === "var(--accent)") return styles.bdevFillAccent;
  if (color === "var(--red)") return styles.bdevFillRed;
  if (color === "var(--amber)") return styles.bdevFillAmber;
  if (color === "var(--blue)") return styles.bdevFillBlue;
  if (color === "var(--purple)") return styles.bdevFillPurple;
  return styles.bdevFillMuted;
}

function tagClass(color: string): string {
  if (color === "var(--accent)") return styles.bdevTagAccent;
  if (color === "var(--red)") return styles.bdevTagRed;
  if (color === "var(--amber)") return styles.bdevTagAmber;
  if (color === "var(--blue)") return styles.bdevTagBlue;
  if (color === "var(--purple)") return styles.bdevTagPurple;
  return styles.bdevTagMuted;
}

// Estimate win probability by stage
function stageProbability(status: LeadPipelineStatus): number {
  switch (status) {
    case "NEW": return 10;
    case "CONTACTED": return 25;
    case "QUALIFIED": return 45;
    case "PROPOSAL": return 65;
    case "WON": return 100;
    case "LOST": return 0;
  }
}

// ── Main component ────────────────────────────────────────────────────────────

export function BusinessDevelopmentPage({
  session,
  onNotify,
}: {
  session: AuthSession | null;
  onNotify: (tone: "success" | "error" | "info" | "warning", message: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("pipeline");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const r = await loadAdminSnapshotWithRefresh(session);
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) {
        const msg = r.error.message;
        setError(msg);
        onNotify("error", msg);
      } else if (r.data) {
        setLeads(r.data.leads);
        setClients(r.data.clients);
      }
    } finally {
      setLoading(false);
    }
  }, [session, onNotify]);

  useEffect(() => { void load(); }, [load]);

  const clientName = (clientId: string): string =>
    clients.find((c) => c.id === clientId)?.name ?? "";

  const activeLeads = leads.filter((l) => l.status !== "WON" && l.status !== "LOST");
  const won = leads.filter((l) => l.status === "WON");
  const lost = leads.filter((l) => l.status === "LOST");
  const conversionRate = leads.length > 0 ? Math.round((won.length / leads.length) * 100) : 0;

  const sourceBreakdown = leads.reduce<Record<string, number>>((acc, l) => {
    const src = l.source ?? "Unknown";
    acc[src] = (acc[src] ?? 0) + 1;
    return acc;
  }, {});

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

  // ── Widget chart data ──────────────────────────────────────────────────────
  const leadsByMonthData = stageOrder
    .filter((s) => s !== "WON" && s !== "LOST")
    .map((stage) => ({
      label: stageLabel[stage],
      count: leads.filter((l) => l.status === stage).length,
    }));

  const tableRows = leads.map((lead) => ({
    name: lead.company ?? lead.title,
    contact: lead.contactName ?? "—",
    source: lead.source ?? "—",
    value: lead.title,
    status: stageLabel[lead.status],
    _statusRaw: lead.status,
  }));

  return (
    <div className={cx(styles.pageBody, styles.bdevRoot)}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>OPERATIONS / BUSINESS DEVELOPMENT</div>
          <h1 className={styles.pageTitle}>Business Development</h1>
          <div className={styles.pageSub}>Pipeline health · Lead velocity · Revenue opportunity</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnGhost")}>Export Pipeline</button>
        </div>
      </div>

      {/* Row 1 — 4 stat widgets */}
      <WidgetGrid>
        <StatWidget
          label="Active Leads"
          value={activeLeads.length}
          sub={`${leads.length} total`}
          tone="accent"
        />
        <StatWidget
          label="Won (this month)"
          value={won.length}
          sub="Converted to clients"
          tone={won.length > 0 ? "green" : "default"}
        />
        <StatWidget
          label="Lost (this month)"
          value={lost.length}
          sub="Not converted"
          tone={lost.length > 0 ? "red" : "default"}
        />
        <StatWidget
          label="Conversion Rate"
          value={`${conversionRate}%`}
          sub="Win rate"
          tone={conversionRate >= 40 ? "accent" : "amber"}
          progressValue={conversionRate}
        />
      </WidgetGrid>

      {/* Row 2 — bar chart + pipeline */}
      <WidgetGrid>
        <ChartWidget
          label="Leads by Stage"
          data={leadsByMonthData}
          dataKey="count"
          type="bar"
          color="#8b6fff"
          xKey="label"
        />
        <PipelineWidget
          label="Pipeline Stages"
          stages={[
            { label: "Prospect", count: leads.filter((l) => l.status === "NEW").length || 0, total: leads.length || 1, color: "#8b6fff" },
            { label: "Contacted", count: leads.filter((l) => l.status === "CONTACTED").length || 0, total: leads.length || 1, color: "#60a5fa" },
            { label: "Qualified", count: leads.filter((l) => l.status === "QUALIFIED").length || 0, total: leads.length || 1, color: "#f5a623" },
            { label: "Proposal", count: leads.filter((l) => l.status === "PROPOSAL").length || 0, total: leads.length || 1, color: "#34d98b" },
            { label: "Negotiation", count: won.length || 0, total: leads.length || 1, color: "#c8f135" },
          ]}
        />
      </WidgetGrid>

      {/* Row 3 — leads table */}
      <WidgetGrid>
        <TableWidget
          label="Leads"
          rows={tableRows as Record<string, unknown>[]}
          rowKey="name"
          emptyMessage="No leads found."
          columns={[
            { key: "name", header: "Name / Company", align: "left" },
            { key: "contact", header: "Contact", align: "left" },
            { key: "source", header: "Source", align: "left" },
            { key: "value", header: "Title / Value", align: "left" },
            {
              key: "status",
              header: "Status",
              align: "right",
              render: (_v, row) => {
                const raw = (row as { _statusRaw: string })._statusRaw;
                const badgeCls =
                  raw === "WON" ? cx("badgeGreen")
                  : raw === "LOST" ? cx("badgeRed")
                  : raw === "PROPOSAL" ? cx("badgeAmber")
                  : cx("badgeMuted");
                return <span className={badgeCls}>{String(_v)}</span>;
              },
            },
          ]}
        />
      </WidgetGrid>
    </div>
  );
}

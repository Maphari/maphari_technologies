"use client";

import { useEffect, useState } from "react";
import { AdminTabs } from "./shared";
import { cx, styles } from "../style";
import { colorClass, toneClass } from "./admin-page-utils";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { loadAllInterventionsWithRefresh, type AdminIntervention } from "../../../../lib/api/admin/client-ops";
import { loadAdminSnapshotWithRefresh } from "../../../../lib/api/admin/clients";

type TriggerType = "health-drop" | "invoice-overdue" | "nps-drop" | "quality-complaint" | "silent-client";
type InterventionStatus = "open" | "resolved" | "churned";
type Tab = "all interventions" | "open" | "resolved" | "patterns";

type InterventionAction = {
  date: string;
  action: string;
  outcome: string;
  by: string;
};

type Intervention = {
  id: string;
  client: string;
  clientColor: string;
  trigger: string;
  triggerType: TriggerType;
  adminWhoActed: string;
  date: string;
  status: InterventionStatus;
  healthBefore: number;
  healthAfter: number | null;
  churnRiskBefore: number;
  churnRiskAfter: number | null;
  actions: InterventionAction[];
  nextStep: string | null;
  mrrAtRisk: number;
  notes: string;
};

const CLIENT_COLORS = ["var(--accent)", "var(--blue)", "var(--amber)", "var(--purple)", "var(--red)", "var(--green)"];

const triggerTypeConfig: Record<TriggerType, { color: string; label: string; icon: string }> = {
  "health-drop":      { color: "var(--red)",    label: "Health Drop",       icon: "\uD83D\uDCC9" },
  "invoice-overdue":  { color: "var(--amber)",  label: "Invoice Overdue",   icon: "\uD83D\uDCB8" },
  "nps-drop":         { color: "var(--orange)", label: "NPS Drop",          icon: "\uD83D\uDCCA" },
  "quality-complaint":{ color: "var(--purple)", label: "Quality Complaint", icon: "\u26A0" },
  "silent-client":    { color: "var(--red)",    label: "Silent Client",     icon: "\uD83D\uDD07" },
};

const statusConfig: Record<InterventionStatus, { color: string; label: string }> = {
  open:     { color: "var(--red)",    label: "Open" },
  resolved: { color: "var(--accent)", label: "Resolved" },
  churned:  { color: "var(--muted)",  label: "Churned" },
};

const tabs: Tab[] = ["all interventions", "open", "resolved", "patterns"];

function mapTriggerType(type: string): TriggerType {
  const l = type.toLowerCase();
  if (l.includes("invoice") || l.includes("payment") || l.includes("billing")) return "invoice-overdue";
  if (l.includes("nps") || l.includes("satisfaction") || l.includes("survey"))  return "nps-drop";
  if (l.includes("quality") || l.includes("complaint"))                          return "quality-complaint";
  if (l.includes("silent") || l.includes("churn") || l.includes("inactive"))    return "silent-client";
  return "health-drop";
}

function mapInterventionStatus(status: string): InterventionStatus {
  const s = status.toUpperCase();
  if (s === "RESOLVED") return "resolved";
  if (s === "CHURNED")  return "churned";
  return "open";
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function mapIntervention(a: AdminIntervention, clientName: string, color: string): Intervention {
  return {
    id:              a.id,
    client:          clientName,
    clientColor:     color,
    trigger:         a.description ?? a.type,
    triggerType:     mapTriggerType(a.type),
    adminWhoActed:   a.assignedTo ?? "Admin",
    date:            fmtDate(a.createdAt),
    status:          mapInterventionStatus(a.status),
    healthBefore:    0,
    healthAfter:     a.resolvedAt !== null ? 0 : null,
    churnRiskBefore: 0,
    churnRiskAfter:  null,
    actions:         [],
    nextStep:        null,
    mrrAtRisk:       0,
    notes:           a.description ?? "",
  };
}

export function HealthInterventionsPage({ session }: { session: AuthSession | null }) {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading]             = useState(true);
  const [activeTab, setActiveTab]         = useState<Tab>("all interventions");
  const [expanded, setExpanded]           = useState<string | null>(null);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const [intRes, snapRes] = await Promise.all([
          loadAllInterventionsWithRefresh(session),
          loadAdminSnapshotWithRefresh(session),
        ]);
        if (cancelled) return;
        if (intRes.nextSession)       saveSession(intRes.nextSession);
        else if (snapRes.nextSession) saveSession(snapRes.nextSession);
        const clients = snapRes.data?.clients ?? [];
        const colorMap = new Map<string, { name: string; color: string }>(
          clients.map((c, i) => [c.id, { name: c.name, color: CLIENT_COLORS[i % CLIENT_COLORS.length] }])
        );
        setInterventions(
          (intRes.data ?? []).map(a => {
            const info = colorMap.get(a.clientId);
            return mapIntervention(a, info?.name ?? "Client", info?.color ?? CLIENT_COLORS[0]);
          })
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [session]);

  const open     = interventions.filter((i) => i.status === "open");
  const resolved = interventions.filter((i) => i.status === "resolved");
  const churned  = interventions.filter((i) => i.status === "churned");
  const mrrAtRisk = open.reduce((s, i) => s + i.mrrAtRisk, 0);

  const displayList =
    activeTab === "open"     ? open
    : activeTab === "resolved" ? resolved
    : interventions;

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

  const recoveryRate = interventions.length > 0 ? Math.round((resolved.length / interventions.length) * 100) : 0;
  const avgRecoveryDays = 14; // derived placeholder

  const successRateTrend = [
    { label: "Jan", rate: 0 }, { label: "Feb", rate: 0 }, { label: "Mar", rate: recoveryRate },
  ];

  const tableRows = interventions.map(intv => ({
    client: intv.client,
    riskLevel: triggerTypeConfig[intv.triggerType]?.label ?? intv.triggerType,
    stage: statusConfig[intv.status].label,
    started: intv.date,
    outcome: intv.status,
  }));

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>EXPERIENCE / INTERVENTIONS</div>
          <h1 className={styles.pageTitle}>Health Interventions</h1>
          <div className={styles.pageSub}>At-risk clients · Intervention pipeline · Recovery rate</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", styles.healthIntvDangerBtn)}>+ Log Intervention</button>
        </div>
      </div>

      {/* Row 1 — Stats */}
      <WidgetGrid>
        <StatWidget label="Active Interventions" value={open.length} sub="Open cases" tone={open.length > 0 ? "red" : "default"} />
        <StatWidget label="Recovered" value={resolved.length} sub="Health restored" subTone="up" tone="green" />
        <StatWidget label="Failed / Churned" value={churned.length} sub="Despite intervention" tone={churned.length > 0 ? "red" : "default"} />
        <StatWidget label="Avg Recovery Time" value={`${avgRecoveryDays}d`} sub="From open to resolved" tone="default" />
      </WidgetGrid>

      {/* Row 2 — Chart + Pipeline */}
      <WidgetGrid>
        <ChartWidget
          label="Intervention Success Rate"
          data={successRateTrend}
          dataKey="rate"
          type="line"
          xKey="label"
          color="#34d98b"
        />
        <PipelineWidget
          label="Intervention Pipeline"
          stages={[
            { label: "Identified", count: interventions.length, total: Math.max(interventions.length, 1), color: "#ff5f5f" },
            { label: "Contacted", count: open.length, total: Math.max(interventions.length, 1), color: "#f5a623" },
            { label: "In Progress", count: open.length, total: Math.max(interventions.length, 1), color: "#8b6fff" },
            { label: "Resolved", count: resolved.length, total: Math.max(interventions.length, 1), color: "#34d98b" },
          ]}
        />
      </WidgetGrid>

      {/* Row 3 — Table */}
      <WidgetGrid>
        <TableWidget
          label="Interventions"
          rows={tableRows as Record<string, unknown>[]}
          columns={[
            { key: "client", header: "Client" },
            { key: "riskLevel", header: "Risk Level" },
            { key: "stage", header: "Stage" },
            { key: "started", header: "Started", align: "right" },
            { key: "outcome", header: "Outcome", align: "right", render: (v) => {
              const val = v as InterventionStatus;
              const sc = statusConfig[val];
              const cls = val === "resolved" ? cx("badge", "badgeGreen") : val === "open" ? cx("badge", "badgeRed") : cx("badge", "badgeMuted");
              return <span className={cls}>{sc.label}</span>;
            }},
          ]}
          emptyMessage="No interventions logged"
        />
      </WidgetGrid>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { loadAllSlaRecordsWithRefresh, type AdminSlaRecord } from "../../../../lib/api/admin/client-ops";
import { loadAdminSnapshotWithRefresh } from "../../../../lib/api/admin/clients";
import type { AdminClient } from "../../../../lib/api/admin/types";

type Trend = "stable" | "improving" | "declining";
type Tab = "client sla scores" | "sla matrix" | "breach log" | "sla definitions";
type SlaDataKey = "firstResponse" | "substantive" | "milestoneUpdate" | "deliverableReview" | "invoiceAck" | "escalation";

const slaDefinitions = [
  { id: "SLA-01", name: "First Response Time",         tier: "All",                  target: "4 hours",    targetHrs: 4,   description: "Time from client message to first acknowledgement" },
  { id: "SLA-02", name: "Substantive Response Time",   tier: "All",                  target: "24 hours",   targetHrs: 24,  description: "Time to meaningful reply or resolution" },
  { id: "SLA-03", name: "Milestone Update Frequency",  tier: "Core",                 target: "Weekly",     targetHrs: 168, description: "Minimum project status updates to client" },
  { id: "SLA-04", name: "Milestone Update Frequency",  tier: "Growth / Enterprise",  target: "Bi-weekly",  targetHrs: 84,  description: "Minimum project status updates to client" },
  { id: "SLA-05", name: "Deliverable Review Turnaround", tier: "All",                target: "48 hours",   targetHrs: 48,  description: "Time from client feedback to revised deliverable" },
  { id: "SLA-06", name: "Invoice Acknowledgement",     tier: "All",                  target: "Same day",   targetHrs: 8,   description: "Invoice confirmed received and correct" },
  { id: "SLA-07", name: "Emergency Escalation Response", tier: "Growth / Enterprise", target: "2 hours",   targetHrs: 2,   description: "Critical issues or client escalations" },
] as const;

type SlaPoint = { avg: number; breaches30d: number; lastBreached: string | null; unit?: "days" };
type SlaDataMap = {
  firstResponse:     SlaPoint;
  substantive:       SlaPoint;
  milestoneUpdate:   SlaPoint;
  deliverableReview: SlaPoint;
  invoiceAck:        SlaPoint;
  escalation:        SlaPoint | null;
};

type ClientSlaRow = {
  name:         string;
  color:        string;
  tier:         string;
  am:           string;
  slaData:      SlaDataMap;
  overallScore: number;
  trend:        Trend;
};

const slaMetrics: Array<{ key: Exclude<SlaDataKey, "escalation">; name: string; targetHrs: number; unit: string; divisor?: number }> = [
  { key: "firstResponse",     name: "First Response",     targetHrs: 4,   unit: "h"              },
  { key: "substantive",       name: "Substantive Reply",  targetHrs: 24,  unit: "h"              },
  { key: "milestoneUpdate",   name: "Milestone Update",   targetHrs: 168, unit: "d", divisor: 24 },
  { key: "deliverableReview", name: "Deliverable Review", targetHrs: 48,  unit: "h"              },
  { key: "invoiceAck",        name: "Invoice Ack.",        targetHrs: 8,   unit: "h"             },
];

const tabs: Tab[] = ["client sla scores", "sla matrix", "breach log", "sla definitions"];

const CLIENT_COLORS = ["var(--accent)", "var(--blue)", "var(--amber)", "var(--purple)", "var(--red)", "var(--green)"];

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function getMetricKey(metric: string): SlaDataKey | null {
  const m = metric.toLowerCase();
  if (m.includes("first response"))  return "firstResponse";
  if (m.includes("substantive"))     return "substantive";
  if (m.includes("milestone"))       return "milestoneUpdate";
  if (m.includes("deliverable") || m.includes("review")) return "deliverableReview";
  if (m.includes("invoice"))         return "invoiceAck";
  if (m.includes("escalat") || m.includes("emergency")) return "escalation";
  return null;
}

function emptyPoint(): SlaPoint {
  return { avg: 0, breaches30d: 0, lastBreached: null };
}

function buildSlaData(records: AdminSlaRecord[]): SlaDataMap {
  const now      = Date.now();
  const data: SlaDataMap = {
    firstResponse:     emptyPoint(),
    substantive:       emptyPoint(),
    milestoneUpdate:   emptyPoint(),
    deliverableReview: emptyPoint(),
    invoiceAck:        emptyPoint(),
    escalation:        null,
  };
  const buckets: Record<SlaDataKey, AdminSlaRecord[]> = {
    firstResponse: [], substantive: [], milestoneUpdate: [],
    deliverableReview: [], invoiceAck: [], escalation: [],
  };
  records.forEach(r => {
    const key = getMetricKey(r.metric);
    if (key) buckets[key].push(r);
  });
  (Object.keys(buckets) as SlaDataKey[]).forEach(key => {
    const recs = buckets[key];
    if (recs.length === 0) return;
    const avg         = recs.reduce((s, r) => s + (r.actualHrs ?? 0), 0) / recs.length;
    const breaches30d = recs.filter(r =>
      r.status === "MISSED" && (now - new Date(r.periodStart).getTime()) <= THIRTY_DAYS_MS
    ).length;
    const lastMissed  = recs
      .filter(r => r.status === "MISSED")
      .sort((a, b) => new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime())[0];
    const point: SlaPoint = {
      avg,
      breaches30d,
      lastBreached: lastMissed
        ? new Date(lastMissed.periodStart).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })
        : null,
    };
    if (key === "escalation") {
      data.escalation = point;
    } else {
      (data as Record<string, SlaPoint>)[key] = point;
    }
  });
  return data;
}

function calcOverallScore(slaData: SlaDataMap): number {
  const points: Array<{ avg: number; targetHrs: number }> = [
    { avg: slaData.firstResponse.avg,     targetHrs: 4   },
    { avg: slaData.substantive.avg,       targetHrs: 24  },
    { avg: slaData.milestoneUpdate.avg,   targetHrs: 168 },
    { avg: slaData.deliverableReview.avg, targetHrs: 48  },
    { avg: slaData.invoiceAck.avg,        targetHrs: 8   },
  ].filter(p => p.avg > 0);
  if (points.length === 0) return 100;
  const met = points.filter(p => p.avg <= p.targetHrs).length;
  return Math.round((met / points.length) * 100);
}

function buildClientRows(records: AdminSlaRecord[], clients: AdminClient[]): ClientSlaRow[] {
  const clientMap = new Map<string, AdminClient>(clients.map(c => [c.id, c]));
  const byClient  = new Map<string, AdminSlaRecord[]>();
  records.forEach(r => {
    if (!byClient.has(r.clientId)) byClient.set(r.clientId, []);
    byClient.get(r.clientId)!.push(r);
  });
  let colorIdx = 0;
  return [...byClient.entries()].map(([clientId, recs]) => {
    const client   = clientMap.get(clientId);
    const slaData  = buildSlaData(recs);
    const score    = calcOverallScore(slaData);
    return {
      name:         client?.name ?? clientId,
      color:        CLIENT_COLORS[colorIdx++ % CLIENT_COLORS.length],
      tier:         client?.tier ?? "STARTER",
      am:           client?.ownerName ?? "—",
      slaData,
      overallScore: score,
      trend:        "stable" as Trend,
    };
  });
}

export function SlaTrackerPage({ session }: { session: AuthSession | null }) {
  const [clients, setClients]     = useState<ClientSlaRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("client sla scores");

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    setError(null);
    void (async () => {
      try {
        const [slaRes, snapRes] = await Promise.all([
          loadAllSlaRecordsWithRefresh(session),
          loadAdminSnapshotWithRefresh(session),
        ]);
        if (cancelled) return;
        if (slaRes.nextSession)        saveSession(slaRes.nextSession);
        else if (snapRes.nextSession)  saveSession(snapRes.nextSession);
        if (slaRes.error) { setError(slaRes.error.message ?? "Failed to load."); return; }
        setClients(buildClientRows(slaRes.data ?? [], snapRes.data?.clients ?? []));
      } catch (err: unknown) {
        if (!cancelled) setError((err as Error)?.message ?? "Failed to load.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [session]);

  const totalBreaches = clients.reduce(
    (s, c) =>
      s + Object.values(c.slaData)
        .filter((m): m is SlaPoint => Boolean(m))
        .reduce((s2, m) => s2 + m.breaches30d, 0),
    0
  );
  const atRisk = clients.filter(c => c.overallScore < 70).length;

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

  // ── Widget data ────────────────────────────────────────────────────────────
  const avgSlaScore = clients.length > 0
    ? Math.round(clients.reduce((s, c) => s + c.overallScore, 0) / clients.length)
    : 0;
  const slaCompliance = Math.max(0, Math.round((1 - totalBreaches / Math.max(clients.length * 5, 1)) * 100));

  // Avg response time from first response metric
  const avgResponseTime = clients.length > 0
    ? (clients.reduce((s, c) => s + c.slaData.firstResponse.avg, 0) / clients.length).toFixed(1)
    : "—";

  // Bar chart: SLA performance per client
  const slaChartData = clients.map((c) => ({
    label: c.name.split(" ")[0],
    score: c.overallScore,
  }));

  // Table rows: one row per client SLA summary
  const tableRows = clients.map((c) => ({
    name: c.name,
    tier: c.tier,
    target: "100%",
    actual: `${c.overallScore}%`,
    _score: c.overallScore,
    breaches: c.slaData.firstResponse.breaches30d + c.slaData.substantive.breaches30d,
  }));

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>OPERATIONS / SLA</div>
          <h1 className={styles.pageTitle}>SLA Tracker</h1>
          <div className={styles.pageSub}>SLA compliance · Breach tracking · Response time analysis</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnAccent")}>Export SLA Report</button>
        </div>
      </div>

      {/* Row 1 — 4 stat widgets */}
      <WidgetGrid>
        <StatWidget
          label="SLA Compliance"
          value={`${slaCompliance}%`}
          sub="~5 SLA events per client"
          tone={slaCompliance >= 80 ? "accent" : slaCompliance >= 60 ? "amber" : "red"}
          progressValue={slaCompliance}
        />
        <StatWidget
          label="Breached"
          value={totalBreaches}
          sub="Across all SLAs (30d)"
          tone={totalBreaches > 5 ? "red" : totalBreaches > 0 ? "amber" : "default"}
        />
        <StatWidget
          label="At Risk"
          value={atRisk}
          sub="Score < 70%"
          tone={atRisk > 0 ? "amber" : "default"}
        />
        <StatWidget
          label="Avg Response Time"
          value={typeof avgResponseTime === "string" && avgResponseTime !== "—" ? `${avgResponseTime}h` : avgResponseTime}
          sub="First response metric"
          tone={parseFloat(String(avgResponseTime)) <= 4 ? "green" : "amber"}
        />
      </WidgetGrid>

      {/* Row 2 — bar chart + pipeline compliance tiers */}
      <WidgetGrid>
        <ChartWidget
          label="SLA Performance by Client"
          data={slaChartData.length > 0 ? slaChartData : [{ label: "—", score: 0 }]}
          dataKey="score"
          type="bar"
          color="#8b6fff"
          xKey="label"
        />
        <PipelineWidget
          label="Compliance Tiers"
          stages={[
            { label: "Excellent (≥85%)", count: clients.filter((c) => c.overallScore >= 85).length || 0, total: clients.length || 1, color: "#34d98b" },
            { label: "Good (70–84%)", count: clients.filter((c) => c.overallScore >= 70 && c.overallScore < 85).length || 0, total: clients.length || 1, color: "#f5a623" },
            { label: "At Risk (<70%)", count: atRisk || 0, total: clients.length || 1, color: "#ff5f5f" },
          ]}
        />
      </WidgetGrid>

      {/* Row 3 — SLA table */}
      <WidgetGrid>
        <TableWidget
          label="Client SLA Scores"
          rows={tableRows as Record<string, unknown>[]}
          rowKey="name"
          emptyMessage="No SLA records found."
          columns={[
            { key: "name", header: "Client", align: "left" },
            { key: "tier", header: "Tier", align: "left" },
            { key: "target", header: "Target", align: "right" },
            { key: "actual", header: "Actual", align: "right" },
            {
              key: "_score",
              header: "Status",
              align: "right",
              render: (val) => {
                const score = Number(val);
                const badgeCls =
                  score >= 85 ? cx("badgeGreen")
                  : score >= 70 ? cx("badgeAmber")
                  : cx("badgeRed");
                const label = score >= 85 ? "On Track" : score >= 70 ? "Monitor" : "At Risk";
                return <span className={badgeCls}>{label}</span>;
              },
            },
            { key: "breaches", header: "Breaches", align: "right" },
          ]}
        />
      </WidgetGrid>
    </div>
  );
}

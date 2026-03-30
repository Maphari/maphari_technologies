// ════════════════════════════════════════════════════════════════════════════
// lifecycle-dashboard-page.tsx — Admin Lifecycle Dashboard
// Data : loadClientDirectoryWithRefresh → GET /clients/directory
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { cx, styles } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { loadClientDirectoryWithRefresh } from "../../../../lib/api/admin/clients";
import type { AdminClient } from "../../../../lib/api/admin/types";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";

// ── Helpers ───────────────────────────────────────────────────────────────────

function inferStage(status: string): string {
  switch (status) {
    case "ONBOARDING": return "Onboarding";
    case "ACTIVE":     return "Active";
    case "PAUSED":     return "At Risk";
    case "CHURNED":    return "Offboarding";
    default:           return status;
  }
}

function stageBadge(stage: string): string {
  if (stage === "Active")      return "badgeGreen";
  if (stage === "At Risk")     return "badgeRed";
  if (stage === "Offboarding") return "badgeAmber";
  return "badgeMuted"; // Onboarding
}

function inferHealth(status: string, priority: string): number {
  if (status === "CHURNED") return 15;
  if (status === "PAUSED")  return 35;
  const base = status === "ACTIVE" ? 70 : 65;
  if (priority === "HIGH")   return Math.min(base + 20, 100);
  if (priority === "MEDIUM") return base;
  return Math.max(base - 15, 0);
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "2-digit" });
  } catch { return "—"; }
}

function computeTenure(contractStartAt: string | null): string {
  if (!contractStartAt) return "—";
  const start = new Date(contractStartAt);
  const now = new Date();
  const months =
    (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth();
  if (months <= 0) return "< 1 mo";
  const yrs = Math.floor(months / 12);
  const mo  = months % 12;
  if (yrs === 0) return `${months} mo`;
  return mo === 0 ? `${yrs} yr` : `${yrs} yr, ${mo} mo`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function LifecycleDashboardPage({ session }: { session: AuthSession | null }) {
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    setError(null);
    void loadClientDirectoryWithRefresh(session, { pageSize: 100 }).then((r) => {
      if (cancelled) return;
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) { setError(r.error.message ?? "Failed to load."); }
      else if (r.data?.items) setClients(r.data.items);
    }).catch((err: unknown) => {
      if (!cancelled) setError((err as Error)?.message ?? "Failed to load.");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [session]);

  const onboarding  = clients.filter((c) => c.status === "ONBOARDING").length;
  const active      = clients.filter((c) => c.status === "ACTIVE").length;
  const atRisk      = clients.filter((c) => c.status === "PAUSED").length;
  const offboarding = clients.filter((c) => c.status === "CHURNED").length;

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

  const stageChartData = [
    { name: "Onboarding", value: onboarding },
    { name: "Active", value: active },
    { name: "At Risk", value: atRisk },
    { name: "Offboarding", value: offboarding },
  ].filter((d) => d.value > 0);

  const tableRows = clients.map((c) => {
    const stage  = inferStage(c.status);
    const health = inferHealth(c.status, c.priority);
    return {
      id: c.id,
      name: c.name,
      stage,
      health,
      contractStartAt: c.contractStartAt,
      contractRenewalAt: c.contractRenewalAt,
    };
  }) as unknown as Record<string, unknown>[];

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>LIFECYCLE / DASHBOARD</div>
          <h1 className={styles.pageTitle}>Lifecycle Dashboard</h1>
          <div className={styles.pageSub}>Client lifecycle overview · Stage distribution · Health</div>
        </div>
      </div>

      {/* ── Row 1: Stats ── */}
      <WidgetGrid>
        <StatWidget label="Total Clients" value={clients.length} tone="accent" sparkData={[10, 12, 14, 15, 16, 17, 18, clients.length]} />
        <StatWidget label="Onboarding" value={onboarding} tone="default" progressValue={clients.length > 0 ? Math.round((onboarding / clients.length) * 100) : 0} />
        <StatWidget label="Active / Engaged" value={active} tone="green" progressValue={clients.length > 0 ? Math.round((active / clients.length) * 100) : 0} />
        <StatWidget label="At Risk" value={atRisk} tone="red" progressValue={clients.length > 0 ? Math.round((atRisk / clients.length) * 100) : 0} />
      </WidgetGrid>

      {/* ── Row 2: Chart + Pipeline ── */}
      <WidgetGrid>
        <ChartWidget
          label="Lifecycle Stage Distribution"
          type="bar"
          data={stageChartData.length > 0 ? stageChartData : [{ name: "No data", value: 0 }]}
          dataKey="value"
          xKey="name"
          color="#8b6fff"
        />
        <PipelineWidget
          label="Lifecycle Stages"
          stages={[
            { label: "Onboarding", count: onboarding, total: clients.length, color: "#60a5fa" },
            { label: "Active", count: active, total: clients.length, color: "#34d98b" },
            { label: "At Risk", count: atRisk, total: clients.length, color: "#ff5f5f" },
            { label: "Offboarding", count: offboarding, total: clients.length, color: "#f5a623" },
          ]}
        />
      </WidgetGrid>

      {/* ── Row 3: Table ── */}
      <WidgetGrid>
        <TableWidget
          label="All Clients"
          rows={tableRows}
          rowKey="id"
          emptyMessage="No clients found."
          columns={[
            { key: "name", header: "Client", render: (_v, row) => <span style={{ fontWeight: 600 }}>{String(row.name ?? "")}</span> },
            { key: "stage", header: "Stage", render: (_v, row) => <span className={cx("badge", stageBadge(String(row.stage ?? "")))}>{String(row.stage ?? "")}</span> },
            { key: "health", header: "Health", align: "right", render: (_v, row) => {
              const h = Number(row.health ?? 0);
              return <span className={cx("fontMono", "fw600", h >= 70 ? "colorGreen" : h >= 50 ? "colorAmber" : "colorRed")}>{h}%</span>;
            }},
            { key: "contractStartAt", header: "Start", align: "right", render: (_v, row) => <span className={cx("text12", "colorMuted")}>{formatDate(row.contractStartAt as string | null)}</span> },
            { key: "contractStartAt", header: "Tenure", align: "right", render: (_v, row) => <span className={cx("text12", "colorMuted")}>{computeTenure(row.contractStartAt as string | null)}</span> },
            { key: "contractRenewalAt", header: "Renewal", align: "right", render: (_v, row) => <span className={cx("text12", "colorMuted")}>{formatDate(row.contractRenewalAt as string | null)}</span> },
          ]}
        />
      </WidgetGrid>
    </div>
  );
}

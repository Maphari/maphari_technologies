"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchAiRecommendations, type AiRecommendation } from "../../../../lib/api/admin/ai";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import { cx, styles } from "../style";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";

/** Derive operational signal recommendations from the admin snapshot. */
function deriveSignalRecommendations(snapshot: {
  clients: { id: string; name: string; priority: string }[];
  invoices: { id: string; status: string; daysOverdue?: number }[];
  projects: { id: string; name: string; status: string; riskLevel: string }[];
}): AiRecommendation[] {
  const recs: AiRecommendation[] = [];

  const overdueInvoices = snapshot.invoices.filter((i) => i.status === "OVERDUE");
  if (overdueInvoices.length > 0) {
    recs.push({
      id: "signal-overdue-invoices",
      type: "Risk",
      title: `${overdueInvoices.length} overdue invoice${overdueInvoices.length > 1 ? "s" : ""} require attention`,
      confidence: 95,
      estimatedValue: "—",
      reasoning: "Overdue invoices directly impact cash flow. Chase and escalate each outstanding invoice to avoid further delay.",
      action: "View Invoices",
    });
  }

  const highPriorityClients = snapshot.clients.filter((c) => c.priority === "HIGH");
  if (highPriorityClients.length > 0) {
    recs.push({
      id: "signal-high-priority-clients",
      type: "Risk",
      title: `${highPriorityClients.length} high-priority client${highPriorityClients.length > 1 ? "s" : ""} flagged`,
      confidence: 88,
      estimatedValue: "—",
      reasoning: `Clients marked HIGH priority: ${highPriorityClients.slice(0, 3).map((c) => c.name).join(", ")}${highPriorityClients.length > 3 ? " and others" : ""}. Review their account health and ensure adequate support.`,
      action: "Review Clients",
    });
  }

  const blockedProjects = snapshot.projects.filter(
    (p) => ["BLOCKED", "DELAYED", "ON_HOLD"].includes(p.status.toUpperCase())
  );
  if (blockedProjects.length > 0) {
    recs.push({
      id: "signal-blocked-projects",
      type: "Efficiency",
      title: `${blockedProjects.length} project${blockedProjects.length > 1 ? "s" : ""} blocked or stalled`,
      confidence: 90,
      estimatedValue: "—",
      reasoning: `Projects currently blocked/stalled: ${blockedProjects.slice(0, 3).map((p) => p.name).join(", ")}${blockedProjects.length > 3 ? " and others" : ""}. Unblock these to restore delivery momentum.`,
      action: "View Projects",
    });
  }

  const highRiskProjects = snapshot.projects.filter((p) => p.riskLevel === "HIGH");
  if (highRiskProjects.length > 0) {
    recs.push({
      id: "signal-high-risk-projects",
      type: "Risk",
      title: `${highRiskProjects.length} project${highRiskProjects.length > 1 ? "s" : ""} at high delivery risk`,
      confidence: 85,
      estimatedValue: "—",
      reasoning: `High-risk projects: ${highRiskProjects.slice(0, 3).map((p) => p.name).join(", ")}${highRiskProjects.length > 3 ? " and others" : ""}. Consider resource reallocation or scope adjustment.`,
      action: "View Projects",
    });
  }

  return recs;
}

export function AIActionRecommendationsPage() {
  const { session, snapshot } = useAdminWorkspaceContext();

  const [apiRecommendations, setApiRecommendations] = useState<AiRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const signalRecommendations = useMemo(
    () => deriveSignalRecommendations(snapshot),
    [snapshot]
  );

  const recommendations = useMemo<AiRecommendation[]>(() => {
    const merged = [...apiRecommendations];
    for (const sig of signalRecommendations) {
      if (!merged.some((r) => r.id === sig.id)) merged.push(sig);
    }
    return merged;
  }, [apiRecommendations, signalRecommendations]);

  const load = useCallback(
    async (isRefresh = false) => {
      if (!session) { setLoading(false); setRefreshing(false); return; }
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const result = await fetchAiRecommendations(session);
        if (result.error) {
          setError(result.error.message);
        } else {
          setApiRecommendations(result.data ?? []);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [session]
  );

  useEffect(() => {
    void load();
  }, [load]);

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

  // ── Derived stats ──────────────────────────────────────────────────────────
  const pending     = recommendations.filter((r) => !r.id.startsWith("signal-")).length;
  const implemented = 0; // no implemented state in current model
  const avgImpact   = recommendations.length > 0
    ? Math.round(recommendations.reduce((s, r) => s + r.confidence, 0) / recommendations.length)
    : 0;

  const typeCounts = recommendations.reduce<Record<string, number>>((acc, r) => {
    acc[r.type] = (acc[r.type] ?? 0) + 1;
    return acc;
  }, {});
  const chartData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));

  const tableRows = recommendations.map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type,
    confidence: r.confidence,
    action: r.action,
  })) as unknown as Record<string, unknown>[];

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>LIFECYCLE / AI ACTIONS</div>
          <h1 className={styles.pageTitle}>AI Action Recommendations</h1>
          <div className={styles.pageSub}>AI-generated insights · Pending actions · Impact score</div>
        </div>
        <div className={styles.pageActions}>
          <button
            type="button"
            className={cx("btnSm", "btnGhost")}
            onClick={() => void load(true)}
            disabled={refreshing || loading}
          >
            {refreshing ? "Refreshing…" : "↻ Refresh"}
          </button>
        </div>
      </div>

      {/* ── Row 1: Stats ── */}
      <WidgetGrid>
        <StatWidget label="Total Recommendations" value={recommendations.length} tone="accent" sparkData={[1, 2, 3, 3, 4, 5, 5, recommendations.length]} />
        <StatWidget label="Pending Review" value={pending} tone="amber" progressValue={recommendations.length > 0 ? Math.round((pending / recommendations.length) * 100) : 0} />
        <StatWidget label="Implemented" value={implemented} tone="green" progressValue={0} />
        <StatWidget label="Avg Impact Score" value={`${avgImpact}%`} sub="confidence avg" />
      </WidgetGrid>

      {/* ── Row 2: Chart + Pipeline ── */}
      <WidgetGrid>
        <ChartWidget
          label="Recommendations by Category"
          type="bar"
          data={chartData.length > 0 ? chartData : [{ name: "No data", value: 0 }]}
          dataKey="value"
          xKey="name"
          color="#8b6fff"
        />
        <PipelineWidget
          label="Action Status"
          stages={[
            { label: "Pending", count: recommendations.length, total: recommendations.length, color: "#f5a623" },
            { label: "Approved", count: 0, total: recommendations.length, color: "#8b6fff" },
            { label: "Implemented", count: implemented, total: recommendations.length, color: "#34d98b" },
            { label: "Rejected", count: 0, total: recommendations.length, color: "#ff5f5f" },
          ]}
        />
      </WidgetGrid>

      {/* ── Row 3: Table ── */}
      <WidgetGrid>
        <TableWidget
          label="All Recommendations"
          rows={tableRows}
          rowKey="id"
          emptyMessage="No recommendations at this time."
          columns={[
            { key: "title", header: "Title", render: (_v, row) => <span style={{ fontWeight: 600 }}>{String(row.title ?? "")}</span> },
            { key: "type", header: "Category", render: (_v, row) => {
              const t = String(row.type ?? "");
              return <span className={cx("badge", t === "Risk" ? "badgeRed" : t === "Revenue" ? "badgeGreen" : "badgeAmber")}>{t}</span>;
            }},
            { key: "confidence", header: "Impact Score", align: "right", render: (_v, row) => {
              const c = Number(row.confidence ?? 0);
              return <span className={cx("fontMono", "fw600", c >= 80 ? "colorGreen" : "colorAmber")}>{c}%</span>;
            }},
            { key: "action", header: "Status", align: "right", render: () => <span className={cx("badge", "badgeAmber")}>Pending</span> },
            { key: "action", header: "Action", align: "right", render: (_v, row) => <button type="button" className={cx("btnSm", "btnAccent")}>{String(row.action ?? "Review")}</button> },
          ]}
        />
      </WidgetGrid>

      {/* ── Error state ── */}
      {!loading && error && (
        <div className={cx(styles.card, styles.cardInner)}>
          <div className={cx("text13", "colorRed", "mb8")}>Failed to load recommendations</div>
          <div className={cx("text12", "colorMuted", "mb16")}>{error}</div>
          <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => void load()}>Retry</button>
        </div>
      )}
    </div>
  );
}

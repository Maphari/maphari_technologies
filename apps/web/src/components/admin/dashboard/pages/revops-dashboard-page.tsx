"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cx, styles } from "../style";
import { colorClass } from "./admin-page-utils";
import { fetchRevenueSeries, type RevenueSeries } from "../../../../lib/api/admin/billing";
import { loadAdminSnapshotWithRefresh } from "../../../../lib/api/admin/clients";
import type { AdminSnapshot, LeadPipelineStatus } from "../../../../lib/api/admin";
import { saveSession } from "../../../../lib/auth/session";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";

const tabs = ["mrr tracking", "pipeline", "concentration risk", "forecast", "sales velocity"] as const;
type Tab = (typeof tabs)[number];

const CLIENT_COLORS = [
  "var(--accent)",
  "var(--purple)",
  "var(--blue)",
  "var(--amber)",
  "var(--red)",
] as const;

// Pipeline stage definitions — maps lead statuses to display labels
const PIPELINE_STAGES: Array<{ statuses: LeadPipelineStatus[]; label: string }> = [
  { statuses: ["NEW", "CONTACTED"], label: "Discovery" },
  { statuses: ["QUALIFIED"],        label: "Qualified" },
  { statuses: ["PROPOSAL"],         label: "Proposal Sent" },
];

function progressToneClass(color: string): string {
  switch (color) {
    case "var(--accent)":  return styles.revopsProgressAccent;
    case "var(--red)":     return styles.revopsProgressRed;
    case "var(--amber)":   return styles.revopsProgressAmber;
    case "var(--blue)":    return styles.revopsProgressBlue;
    case "var(--purple)":  return styles.revopsProgressPurple;
    default:               return styles.revopsProgressAccent;
  }
}

type MrrHistoryEntry = { month: string; mrr: number; churn: number; expansion: number; new: number };

export function RevOpsPage() {
  const { session } = useAdminWorkspaceContext();
  const [activeTab, setActiveTab] = useState<Tab>("mrr tracking");
  const [mrrHistory, setMrrHistory] = useState<MrrHistoryEntry[]>([]);
  const [loadingMrr, setLoadingMrr] = useState(true);
  const [snapshot, setSnapshot] = useState<AdminSnapshot | null>(null);

  // ── Load MRR series ───────────────────────────────────────────────────────
  const loadRevenueSeries = useCallback(async () => {
    if (!session) { setLoadingMrr(false); return; }
    setLoadingMrr(true);
    try {
      const result = await fetchRevenueSeries(session, 7);
      if (result.data) {
        setMrrHistory(
          result.data.map((s: RevenueSeries) => ({
            month: s.month,
            mrr: s.paidCents / 100,
            churn: 0,
            expansion: 0,
            new: s.issuedCents / 100,
          }))
        );
      }
    } finally {
      setLoadingMrr(false);
    }
  }, [session]);

  // ── Load snapshot (pipeline / concentration / velocity) ───────────────────
  const loadSnapshot = useCallback(async () => {
    if (!session) return;
    const result = await loadAdminSnapshotWithRefresh(session);
    if (result.nextSession) saveSession(result.nextSession);
    setSnapshot(result.data ?? null);
  }, [session]);

  useEffect(() => { void loadRevenueSeries(); }, [loadRevenueSeries]);
  useEffect(() => { void loadSnapshot(); }, [loadSnapshot]);

  // ── MRR KPIs ──────────────────────────────────────────────────────────────
  const currentMRR = mrrHistory[mrrHistory.length - 1]?.mrr ?? 0;
  const prevMRR    = mrrHistory[mrrHistory.length - 2]?.mrr ?? 0;
  const mrrGrowth  = prevMRR > 0 ? (((currentMRR - prevMRR) / prevMRR) * 100).toFixed(1) : "0.0";
  const arr        = currentMRR * 12;
  const mrrLabel   = mrrHistory[mrrHistory.length - 1]?.month ?? "Latest";

  // ── Avg deal value — proxy via project budgets ────────────────────────────
  const avgDealValueCents = useMemo(() => {
    const projects = snapshot?.projects ?? [];
    if (projects.length === 0) return 0;
    return projects.reduce((s, p) => s + p.budgetCents, 0) / projects.length;
  }, [snapshot]);

  // ── Pipeline derived from real leads ──────────────────────────────────────
  const pipeline = useMemo(() => {
    const now = Date.now();
    const leads = snapshot?.leads ?? [];
    const activeLeads = leads.filter((l) => l.status !== "WON" && l.status !== "LOST");

    return PIPELINE_STAGES.map(({ statuses, label }) => {
      const stageLeads = activeLeads.filter((l) =>
        (statuses as string[]).includes(l.status)
      );
      const avgDays =
        stageLeads.length > 0
          ? Math.round(
              stageLeads.reduce(
                (s, l) =>
                  s + (now - new Date(l.createdAt).getTime()) / 86400000,
                0
              ) / stageLeads.length
            )
          : 0;
      return {
        stage: label,
        leads: stageLeads.length,
        value: Math.round((stageLeads.length * avgDealValueCents) / 100),
        avgDays,
      };
    });
  }, [snapshot, avgDealValueCents]);

  const pipelineValue = useMemo(
    () => pipeline.reduce((s, p) => s + p.value, 0),
    [pipeline]
  );

  // ── Revenue concentration from invoices ───────────────────────────────────
  const revenueConcentration = useMemo(() => {
    const invoices = snapshot?.invoices ?? [];
    const clients  = snapshot?.clients  ?? [];

    const perClient = new Map<string, number>();
    for (const inv of invoices) {
      if (inv.status === "PAID" || inv.status === "ISSUED") {
        perClient.set(inv.clientId, (perClient.get(inv.clientId) ?? 0) + inv.amountCents);
      }
    }
    const total = [...perClient.values()].reduce((s, v) => s + v, 0);
    if (total === 0) return [];

    return [...perClient.entries()]
      .map(([clientId, amountCents], i) => {
        const client = clients.find((c) => c.id === clientId);
        return {
          client: client?.name ?? "Unknown",
          mrr:    Math.round(amountCents / 100),
          pct:    Math.round((amountCents / total) * 1000) / 10,
          color:  CLIENT_COLORS[i % CLIENT_COLORS.length] ?? "var(--accent)",
        };
      })
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 6);
  }, [snapshot]);

  // Risk level derived from top client concentration
  const concentrationRisk = useMemo(() => {
    const topPct = revenueConcentration[0]?.pct ?? 0;
    if (topPct > 40) return { label: "High",   color: "var(--red)" };
    if (topPct > 20) return { label: "Medium",  color: "var(--amber)" };
    return               { label: "Low",    color: "var(--accent)" };
  }, [revenueConcentration]);

  // ── 3-month forecast from MRR trend ───────────────────────────────────────
  const forecastData = useMemo(() => {
    if (mrrHistory.length < 2) return [];
    const last = mrrHistory[mrrHistory.length - 1]?.mrr ?? 0;
    const prev = mrrHistory[mrrHistory.length - 2]?.mrr ?? 0;
    const growthRate = prev > 0 ? (last - prev) / prev : 0.05;
    // Cap growth rate: max ±15% per month
    const capped = Math.min(Math.max(growthRate, -0.1), 0.15);
    const now = new Date();
    return [1, 2, 3].map((offset) => {
      const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      const label = d.toLocaleDateString("en-ZA", { month: "short", year: "numeric" });
      const forecast = Math.round(last * Math.pow(1 + capped, offset));
      return {
        month:    label,
        forecast,
        low:  Math.round(forecast * 0.92),
        high: Math.round(forecast * 1.08),
      };
    });
  }, [mrrHistory]);

  // ── Sales velocity metrics ─────────────────────────────────────────────────
  const salesVelocityMetrics = useMemo(() => {
    const leads = snapshot?.leads ?? [];
    const won    = leads.filter((l) => l.status === "WON");
    const lost   = leads.filter((l) => l.status === "LOST");
    const active = leads.filter((l) => l.status !== "WON" && l.status !== "LOST");

    const totalDecided = won.length + lost.length;
    const winRate = totalDecided > 0 ? won.length / totalDecided : 0;

    // Approximate cycle from lead creation → last update for WON leads
    const avgCycleDays =
      won.length > 0
        ? Math.round(
            won.reduce(
              (s, l) =>
                s +
                (new Date(l.updatedAt).getTime() -
                  new Date(l.createdAt).getTime()) /
                  86400000,
              0
            ) / won.length
          )
        : 30;

    const avgDealValue = avgDealValueCents / 100;
    const velocity =
      avgCycleDays > 0
        ? Math.round(
            (active.length * avgDealValue * winRate) / Math.max(avgCycleDays, 1)
          )
        : 0;

    return {
      opportunities: active.length,
      winRate,
      avgCycleDays,
      velocity,
      wonCount:  won.length,
      lostCount: lost.length,
    };
  }, [snapshot, avgDealValueCents]);

  // Velocity trend — use last 4 MRR months (MRR÷30 as daily proxy)
  const velocityTrend = useMemo(() => {
    const slice = mrrHistory.slice(-4);
    return slice.map((m, i) => {
      const prev  = slice[i - 1]?.mrr ?? m.mrr;
      const vel   = Math.round(m.mrr / 30);
      const change = prev > 0 && i > 0 ? Math.round(((m.mrr - prev) / prev) * 1000) / 10 : 0;
      return { period: m.month, velocity: vel, change };
    });
  }, [mrrHistory]);

  // ── Chart data ─────────────────────────────────────────────────────────────
  const mrrChartData = mrrHistory.map((m) => ({ label: m.month, mrr: Math.round(m.mrr) }));

  // ── Revenue by source pipeline ─────────────────────────────────────────────
  const totalPipelineLeads = pipeline.reduce((s, p) => s + p.leads, 0) || 1;
  const pipelineStages = pipeline.map((p) => ({
    label: p.stage,
    count: p.leads,
    total: totalPipelineLeads,
    color: p.stage === "Discovery" ? "#8b6fff" : p.stage === "Qualified" ? "#34d98b" : "#f5a623",
  }));

  // ── Accounts table rows (from concentration data) ──────────────────────────
  const accountRows = revenueConcentration.map((c) => ({
    client: c.client,
    mrr:    `R${(c.mrr / 1000).toFixed(1)}k`,
    arr:    `R${(c.mrr * 12 / 1000).toFixed(0)}k`,
    pct:    `${c.pct}%`,
    status: concentrationRisk.label,
    statusRaw: concentrationRisk.label,
  })) as Record<string, unknown>[];

  // ── JSX ───────────────────────────────────────────────────────────────────
  if (loadingMrr) {
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

  return (
    <div className={cx(styles.pageBody)}>
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>FINANCE / REVOPS</div>
          <h1 className={styles.pageTitle}>Revenue Operations</h1>
          <div className={styles.pageSub}>Revenue health · Pipeline value · Forecast accuracy</div>
        </div>
        <div className={styles.pageActions}>
          <select
            title="View"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as Tab)}
            className={styles.filterSelect}
          >
            {tabs.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button type="button" className={cx("btnSm", "btnAccent")}>Export RevOps Report</button>
        </div>
      </div>

      {/* ── Row 1: KPI stats ── */}
      <WidgetGrid>
        <StatWidget
          label={`MRR (${mrrLabel})`}
          value={`R${(currentMRR / 1000).toFixed(1)}k`}
          sub={`${Number(mrrGrowth) > 0 ? "▲" : "▼"} ${Math.abs(Number(mrrGrowth))}% MoM`}
          subTone={Number(mrrGrowth) > 0 ? "up" : "down"}
          tone="accent"
          sparkData={mrrHistory.slice(-8).map((m) => Math.round(m.mrr))}
        />
        <StatWidget
          label="ARR (Annualised)"
          value={`R${(arr / 1_000_000).toFixed(2)}m`}
          sub={`Based on ${mrrLabel} MRR`}
        />
        <StatWidget
          label="Pipeline Value"
          value={`R${(pipelineValue / 1000).toFixed(0)}k`}
          sub={`${pipeline.reduce((s, p) => s + p.leads, 0)} active leads`}
          tone="accent"
        />
        <StatWidget
          label="Churn Rate"
          value={`${concentrationRisk.label} risk`}
          sub={`Top client: ${revenueConcentration[0]?.pct ?? 0}%`}
          tone={concentrationRisk.label === "High" ? "red" : concentrationRisk.label === "Medium" ? "amber" : "green"}
        />
      </WidgetGrid>

      {/* ── Row 2: Chart + Pipeline ── */}
      <WidgetGrid>
        <ChartWidget
          label="MRR Trend"
          currentValue={`R${(currentMRR / 1000).toFixed(1)}k`}
          data={mrrChartData.length > 0 ? mrrChartData : [{ label: "No data", mrr: 0 }]}
          dataKey="mrr"
          type="area"
          color="#8b6fff"
          xKey="label"
        />
        <PipelineWidget
          label="Revenue by Pipeline Stage"
          stages={pipelineStages.length > 0 ? pipelineStages : [
            { label: "No leads", count: 0, total: 1, color: "#8b6fff" },
          ]}
        />
      </WidgetGrid>

      {/* ── Row 3: Accounts table ── */}
      <WidgetGrid>
        <TableWidget
          label="Revenue by Account"
          rows={accountRows}
          rowKey="client"
          emptyMessage="No revenue concentration data available."
          columns={[
            { key: "client", header: "Client", align: "left" },
            { key: "mrr", header: "MRR", align: "right" },
            { key: "arr", header: "ARR", align: "right" },
            { key: "pct", header: "Revenue %", align: "right" },
            {
              key: "status",
              header: "Risk",
              align: "left",
              render: (val) => {
                const v = String(val);
                const badgeClass = v === "High" ? cx("badgeRed") : v === "Medium" ? cx("badgeAmber") : cx("badgeGreen");
                return <span className={badgeClass}>{v}</span>;
              },
            },
          ]}
        />
      </WidgetGrid>

      {/* ── Detail tabs ── */}
      {activeTab === "forecast" && forecastData.length > 0 ? (
        <div className={cx("card", "p24", "mt16")}>
          <div className={cx(styles.revopsSecTitle)}>3-Month MRR Forecast</div>
          <div className={cx("flexCol", "gap20")}>
            {forecastData.map((f) => (
              <div key={f.month}>
                <div className={cx("flexBetween", "mb8")}>
                  <span className={cx("text14", "fw700")}>{f.month}</span>
                  <span className={styles.revopsForecastVal}>R{(f.forecast / 1000).toFixed(0)}k</span>
                </div>
                <div className={styles.revopsForecastMeta}>
                  <span>Low: R{(f.low / 1000).toFixed(0)}k</span>
                  <span>High: R{(f.high / 1000).toFixed(0)}k</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === "sales velocity" ? (
        <div className={cx("card", "p24", "mt16")}>
          <div className={cx(styles.revopsSecTitle)}>Sales Velocity</div>
          <div className={cx("grid2", "gap16")}>
            {[
              { label: "# Opportunities", value: salesVelocityMetrics.opportunities.toString(), color: "var(--blue)" },
              { label: "Avg Deal Value", value: avgDealValueCents > 0 ? `R${Math.round(avgDealValueCents / 100 / 1000)}k` : "—", color: "var(--purple)" },
              { label: "Win Rate", value: salesVelocityMetrics.wonCount + salesVelocityMetrics.lostCount > 0 ? `${Math.round(salesVelocityMetrics.winRate * 100)}%` : "—", color: "var(--accent)" },
              { label: "Sales Cycle", value: `${salesVelocityMetrics.avgCycleDays}d`, color: "var(--amber)" },
            ].map((s) => (
              <div key={s.label} className={styles.revopsMetricTile}>
                <div className={cx("text11", "colorMuted", "mb4")}>{s.label}</div>
                <div className={cx(styles.revopsMetricTileVal, colorClass(s.color))}>{s.value}</div>
              </div>
            ))}
          </div>
          {velocityTrend.length > 0 ? (
            <div className={cx("mt16")}>
              <div className={cx(styles.revopsSecTitle, "mb12")}>Velocity Trend</div>
              {velocityTrend.map((v) => (
                <div key={v.period} className={styles.revopsVelRow}>
                  <span className={styles.revopsVelPeriod}>{v.period}</span>
                  <span className={cx("fontMono", "text12")}>R{v.velocity.toLocaleString()}/day</span>
                  {v.change !== 0 ? (
                    <span className={cx("text11", v.change > 0 ? "colorAccent" : "colorRed")}>
                      {v.change > 0 ? "▲" : "▼"} {Math.abs(v.change)}%
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

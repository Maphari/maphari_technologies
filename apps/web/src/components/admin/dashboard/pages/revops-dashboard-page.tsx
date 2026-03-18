"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cx, styles } from "../style";
import { colorClass } from "./admin-page-utils";
import { fetchRevenueSeries, type RevenueSeries } from "../../../../lib/api/admin/billing";
import { loadAdminSnapshotWithRefresh } from "../../../../lib/api/admin/clients";
import type { AdminSnapshot, LeadPipelineStatus } from "../../../../lib/api/admin";
import { saveSession } from "../../../../lib/auth/session";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";

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
    if (!session) return;
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
  const maxMRR     = mrrHistory.length > 0 ? Math.max(...mrrHistory.map((m) => m.mrr)) : 1;
  const lastEntry  = mrrHistory[mrrHistory.length - 1];
  const mrrLabel   = lastEntry?.month ?? "Latest";

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

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / REVENUE OPERATIONS</div>
          <h1 className={styles.pageTitle}>RevOps Dashboard</h1>
          <div className={styles.pageSub}>MRR · ARR · Pipeline velocity · Revenue concentration · Forecasting</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnAccent")}>Export RevOps Report</button>
        </div>
      </div>

      {/* KPI row */}
      <div className={cx("topCardsStack", "gap16", "mb28")}>
        {[
          {
            label: `MRR (${mrrLabel})`,
            value: `R${(currentMRR / 1000).toFixed(1)}k`,
            color: "var(--accent)",
            sub: `${Number(mrrGrowth) > 0 ? "▲" : "▼"} ${Math.abs(Number(mrrGrowth))}% MoM`,
            subColor: Number(mrrGrowth) > 0 ? "var(--accent)" : "var(--red)",
          },
          {
            label: "ARR (Annualised)",
            value: `R${(arr / 1000000).toFixed(2)}M`,
            color: "var(--blue)",
            sub: `Based on ${mrrLabel} MRR`,
            subColor: "var(--muted)",
          },
          {
            label: "Pipeline Value",
            value: `R${(pipelineValue / 1000).toFixed(0)}k`,
            color: "var(--purple)",
            sub: `${pipeline.reduce((s, p) => s + p.leads, 0)} active leads`,
            subColor: "var(--muted)",
          },
          {
            label: "Net MRR Growth",
            value: `+R${((currentMRR - prevMRR) / 1000).toFixed(1)}k`,
            color: "var(--accent)",
            sub: "Expansion + New − Churn",
            subColor: "var(--muted)",
          },
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, colorClass(s.color))}>{s.value}</div>
            <div className={cx("text11", colorClass(s.subColor ?? "var(--muted)"))}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tab selector */}
      <div className={styles.filterRow}>
        <select
          title="View"
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value as Tab)}
          className={styles.filterSelect}
        >
          {tabs.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* ── MRR Tracking tab ──────────────────────────────────────────────── */}
      {activeTab === "mrr tracking" ? (
        <div className={styles.revopsSplit}>
          <div className={cx("card", "p24")}>
            <div className={styles.revopsSecTitle}>MRR Movement — 7 Months</div>
            {loadingMrr && <div className={cx("colorMuted", "text12")}>Loading revenue data…</div>}
            <div className={styles.revopsChartBars}>
              {mrrHistory.map((m, i) => {
                const h = (m.mrr / maxMRR) * 120;
                const isLast = i === mrrHistory.length - 1;
                return (
                  <div key={m.month} className={styles.revopsBarCol}>
                    <div className={cx("text10", "fontMono", isLast ? "colorAccent" : "colorMuted", "mb4")}>
                      R{(m.mrr / 1000).toFixed(0)}k
                    </div>
                    <svg className={styles.revopsBarFill} viewBox="0 0 10 120" preserveAspectRatio="none" aria-hidden="true">
                      <rect x="0" y={120 - h} width="10" height={h} fill={isLast ? "var(--accent)" : "var(--accent-g)"} />
                    </svg>
                    <div className={cx("text10", isLast ? "colorAccent" : "colorMuted", "mt4")}>{m.month}</div>
                  </div>
                );
              })}
            </div>
            <div className={styles.revopsTableWrap}>
              <div className={styles.revopsMrrHead}>
                {["Month", "MRR", "New", "Expansion", "Churn"].map((h) => <span key={h}>{h}</span>)}
              </div>
              {mrrHistory.map((m, i) => (
                <div key={m.month} className={cx(styles.revopsMrrRow, i < mrrHistory.length - 1 && "borderB")}>
                  <span className={cx("fontMono", "colorMuted")}>{m.month}</span>
                  <span className={cx("fontMono", "fw700", "colorAccent")}>R{(m.mrr / 1000).toFixed(0)}k</span>
                  <span className={cx("fontMono", m.new > 0 ? "colorBlue" : "colorMuted")}>{m.new > 0 ? `+R${(m.new / 1000).toFixed(0)}k` : "-"}</span>
                  <span className={cx("fontMono", m.expansion > 0 ? "colorPurple" : "colorMuted")}>{m.expansion > 0 ? `+R${(m.expansion / 1000).toFixed(0)}k` : "-"}</span>
                  <span className={cx("fontMono", m.churn > 0 ? "colorRed" : "colorMuted")}>{m.churn > 0 ? `-R${(m.churn / 1000).toFixed(0)}k` : "-"}</span>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.revopsSideCol}>
            {[
              { label: `New MRR (${mrrLabel})`,       value: `+R${((lastEntry?.new ?? 0) / 1000).toFixed(1)}k`,       color: "var(--blue)",   desc: "New client revenue" },
              { label: `Expansion MRR (${mrrLabel})`, value: `+R${((lastEntry?.expansion ?? 0) / 1000).toFixed(0)}k`, color: "var(--purple)", desc: "Upsell & tier upgrades" },
              { label: `Churned MRR (${mrrLabel})`,   value: `R${lastEntry?.churn ?? 0}`,                             color: "var(--accent)", desc: "No churn this month" },
            ].map((s) => (
              <div key={s.label} className={styles.statCard}>
                <div className={styles.statLabel}>{s.label}</div>
                <div className={cx(styles.statValue, colorClass(s.color))}>{s.value}</div>
                <div className={cx("text12", "colorMuted")}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* ── Pipeline tab ──────────────────────────────────────────────────── */}
      {activeTab === "pipeline" ? (
        <div className={styles.revopsSplit}>
          <div>
            <div className={cx("card", "p24", "mb16")}>
              <div className={styles.revopsSecTitle}>Sales Pipeline</div>
              {pipeline.every((s) => s.leads === 0) ? (
                <div className={cx("text12", "colorMuted")}>No active leads in pipeline.</div>
              ) : (
                <div className={cx("flexCol", "gap12")}>
                  {pipeline.map((stage, i) => {
                    const maxLeads = Math.max(...pipeline.map((p) => p.leads), 1);
                    const colors = ["var(--accent)", "var(--blue)", "var(--purple)", "var(--amber)"] as const;
                    return (
                      <div key={stage.stage}>
                        <div className={cx("flexBetween", "mb6")}>
                          <span className={cx("text13", "fw600")}>{stage.stage}</span>
                          <div className={styles.revopsMetaRow}>
                            <span className={cx("colorMuted")}>{stage.leads} leads</span>
                            {stage.value > 0 && <span className={colorClass(colors[i])}>R{(stage.value / 1000).toFixed(0)}k</span>}
                            {stage.avgDays > 0 && <span className={cx("colorMuted")}>{stage.avgDays}d avg</span>}
                          </div>
                        </div>
                        <div className={styles.revopsTrack28}>
                          <progress
                            className={cx(styles.revopsTrackFill, progressToneClass(colors[i]))}
                            max={maxLeads}
                            value={stage.leads}
                            aria-label={`${stage.stage} leads ${stage.leads}`}
                          />
                          <span className={styles.revopsLeadNum}>{stage.leads}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <div className={styles.revopsSideCol}>
            <div className={cx("card", "p24")}>
              <div className={styles.revopsSecTitle}>Pipeline Summary</div>
              <div className={cx("flexCol", "gap12")}>
                <div>
                  <div className={cx("text11", "colorMuted", "mb4")}>Total Pipeline Value</div>
                  <div className={styles.revopsValue32}>R{(pipelineValue / 1000).toFixed(0)}k</div>
                </div>
                <div className={styles.revopsHr} />
                <div className={cx("grid2", "gap12")}>
                  <div>
                    <div className={cx("text11", "colorMuted", "mb4")}>Total Leads</div>
                    <div className={styles.revopsValue22}>{pipeline.reduce((s, p) => s + p.leads, 0)}</div>
                  </div>
                  <div>
                    <div className={cx("text11", "colorMuted", "mb4")}>Win Rate</div>
                    <div className={cx(styles.revopsValue22, "colorAccent")}>
                      {salesVelocityMetrics.wonCount + salesVelocityMetrics.lostCount > 0
                        ? `${Math.round(salesVelocityMetrics.winRate * 100)}%`
                        : "—"}
                    </div>
                  </div>
                  <div>
                    <div className={cx("text11", "colorMuted", "mb4")}>Avg Deal Size</div>
                    <div className={styles.revopsValue22}>
                      {avgDealValueCents > 0 ? `R${Math.round(avgDealValueCents / 100 / 1000)}k` : "—"}
                    </div>
                  </div>
                  <div>
                    <div className={cx("text11", "colorMuted", "mb4")}>Avg Sales Cycle</div>
                    <div className={styles.revopsValue22}>{salesVelocityMetrics.avgCycleDays}d</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Concentration Risk tab ────────────────────────────────────────── */}
      {activeTab === "concentration risk" ? (
        <div className={cx("grid2", "gap20")}>
          <div className={cx("card", "p24")}>
            <div className={styles.revopsSecTitle}>Revenue Concentration</div>
            <div className={cx("text11", "colorMuted", "mb20")}>
              Top 2 clients = {revenueConcentration.slice(0, 2).reduce((s, c) => s + c.pct, 0).toFixed(1)}% of billed revenue
            </div>
            {revenueConcentration.length === 0 ? (
              <div className={cx("text12", "colorMuted")}>No invoice data available yet.</div>
            ) : (
              <div className={cx("flexCol", "gap14")}>
                {revenueConcentration.map((c) => (
                  <div key={c.client}>
                    <div className={cx("flexBetween", "mb6")}>
                      <span className={cx("text13", "fw600")}>{c.client}</span>
                      <div className={styles.revopsMetaRow}>
                        <span className={colorClass(c.color)}>R{(c.mrr / 1000).toFixed(0)}k</span>
                        <span className={cx("colorMuted")}>{c.pct}%</span>
                      </div>
                    </div>
                    <div className={styles.revopsTrack8}>
                      <progress
                        className={cx(styles.revopsTrackBar, progressToneClass(c.color))}
                        max={100}
                        value={c.pct}
                        aria-label={`${c.client} concentration ${c.pct}%`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className={styles.revopsSideCol}>
            <div className={cx("card", "p24")}>
              <div className={styles.revopsSecTitle}>Concentration Risk Score</div>
              <div className={cx(styles.revopsRiskWord, colorClass(concentrationRisk.color))}>{concentrationRisk.label}</div>
              <div className={cx(styles.revopsTrack8, "mb12")}>
                <div className={styles.revopsRiskFill} />
              </div>
              <div className={styles.revopsBodyText}>
                {revenueConcentration.length > 0
                  ? `Current highest: ${revenueConcentration[0]?.client ?? "—"} at ${revenueConcentration[0]?.pct ?? 0}%. Target: no single client above 20% of revenue.`
                  : "No concentration data available. Add clients to see revenue distribution."}
              </div>
            </div>
            <div className={styles.revopsWarnCard}>
              <div className={styles.revopsWarnTitle}>Concentration Guidance</div>
              <div className={styles.revopsBodyText}>
                To reduce risk, target 3–4 new clients at R10k–R20k MRR each. This would dilute top client concentration below 5%.
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Forecast tab ──────────────────────────────────────────────────── */}
      {activeTab === "forecast" ? (
        <div className={cx("grid2", "gap20")}>
          <div className={cx("card", "p24")}>
            <div className={styles.revopsSecTitle}>3-Month MRR Forecast</div>
            {forecastData.length === 0 ? (
              <div className={cx("text12", "colorMuted")}>Insufficient MRR history to generate forecast.</div>
            ) : (
              <div className={cx("flexCol", "gap20")}>
                {forecastData.map((f) => (
                  <div key={f.month}>
                    <div className={cx("flexBetween", "mb8")}>
                      <span className={cx("text14", "fw700")}>{f.month}</span>
                      <span className={styles.revopsForecastVal}>R{(f.forecast / 1000).toFixed(0)}k</span>
                    </div>
                    <div className={styles.revopsForecastTrack}>
                      <svg className={styles.revopsForecastSvg} viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true">
                        <rect
                          className={styles.revopsForecastRangeRect}
                          x={(f.low / f.high) * 100}
                          y="0"
                          width={100 - (f.low / f.high) * 100}
                          height="12"
                        />
                        <rect
                          className={styles.revopsForecastMarkerRect}
                          x={(f.forecast / f.high) * 100 - 2}
                          y="0"
                          width="4"
                          height="12"
                        />
                      </svg>
                    </div>
                    <div className={styles.revopsForecastMeta}>
                      <span>Low: R{(f.low / 1000).toFixed(0)}k</span>
                      <span>High: R{(f.high / 1000).toFixed(0)}k</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className={styles.revopsSideCol}>
            <div className={cx("card", "p24")}>
              <div className={styles.revopsSecTitle}>Forecast Assumptions</div>
              {[
                { assumption: "Zero churn over 3 months",    confidence: "High",   color: "var(--accent)" },
                { assumption: "2 upsells planned",            confidence: "Medium", color: "var(--amber)" },
                { assumption: "1 new client at R12k MRR",    confidence: "Medium", color: "var(--amber)" },
                { assumption: "No rate changes",              confidence: "High",   color: "var(--accent)" },
              ].map((a, i) => (
                <div key={a.assumption} className={cx("flexBetween", "py10", i < 3 && "borderB")}>
                  <span className={cx("text12")}>{a.assumption}</span>
                  <span className={cx("text10", "fontMono", colorClass(a.color))}>{a.confidence}</span>
                </div>
              ))}
            </div>
            <div className={cx("card", "p24")}>
              <div className={styles.revopsSecTitle}>Growth Rate Used</div>
              <div className={styles.revopsValue36}>
                {mrrHistory.length >= 2
                  ? `${prevMRR > 0 ? (((currentMRR - prevMRR) / prevMRR) * 100).toFixed(1) : "0.0"}%`
                  : "—"}
              </div>
              <div className={styles.revopsBodyText}>MoM growth rate applied to 3-month projection.</div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Sales Velocity tab ────────────────────────────────────────────── */}
      {activeTab === "sales velocity" ? (
        <div className={cx("grid2", "gap20")}>
          <div className={cx("card", "p24")}>
            <div className={styles.revopsSecTitle}>Sales Velocity Formula</div>
            <div className={cx("text11", "colorMuted", "mb24")}>Revenue generated per day from the pipeline</div>
            <div className={cx("grid2", "gap16", "mb24")}>
              {[
                {
                  label: "# Opportunities",
                  value: salesVelocityMetrics.opportunities.toString(),
                  color: "var(--blue)",
                },
                {
                  label: "Avg Deal Value",
                  value: avgDealValueCents > 0 ? `R${Math.round(avgDealValueCents / 100 / 1000)}k` : "—",
                  color: "var(--purple)",
                },
                {
                  label: "Win Rate",
                  value: salesVelocityMetrics.wonCount + salesVelocityMetrics.lostCount > 0
                    ? `${Math.round(salesVelocityMetrics.winRate * 100)}%`
                    : "—",
                  color: "var(--accent)",
                },
                {
                  label: "Sales Cycle (days)",
                  value: salesVelocityMetrics.avgCycleDays.toString(),
                  color: "var(--amber)",
                },
              ].map((s) => (
                <div key={s.label} className={styles.revopsMetricTile}>
                  <div className={cx("text11", "colorMuted", "mb4")}>{s.label}</div>
                  <div className={cx(styles.revopsMetricTileVal, colorClass(s.color))}>{s.value}</div>
                </div>
              ))}
            </div>
            <div className={styles.revopsVelocityCard}>
              <div className={cx("text12", "colorMuted", "mb8")}>Sales Velocity</div>
              <div className={styles.revopsVelocityVal}>
                {salesVelocityMetrics.velocity > 0
                  ? `R${salesVelocityMetrics.velocity.toLocaleString()}`
                  : "—"}
              </div>
              <div className={cx("text12", "colorMuted")}>per day</div>
            </div>
          </div>
          <div className={styles.revopsSideCol}>
            <div className={cx("card", "p24")}>
              <div className={styles.revopsSecTitle}>Velocity Trend (MRR÷30)</div>
              {velocityTrend.length === 0 ? (
                <div className={cx("text12", "colorMuted")}>Insufficient data.</div>
              ) : (
                <div className={cx("flexCol", "gap12")}>
                  {velocityTrend.map((v) => {
                    const maxVelocity = Math.max(...velocityTrend.map((x) => x.velocity), 1);
                    return (
                      <div key={v.period} className={styles.revopsVelRow}>
                        <span className={styles.revopsVelPeriod}>{v.period}</span>
                        <div className={styles.revopsTrack8Flex}>
                          <progress
                            className={cx(styles.revopsTrackBar, styles.revopsProgressAccent)}
                            max={maxVelocity}
                            value={v.velocity}
                            aria-label={`${v.period} velocity ${v.velocity}`}
                          />
                        </div>
                        <div className={styles.revopsVelMeta}>
                          <span className={cx("fontMono", "text12")}>R{v.velocity.toLocaleString()}</span>
                          {v.change !== 0 ? (
                            <span className={cx("text11", v.change > 0 ? "colorAccent" : "colorRed")}>
                              {v.change > 0 ? "▲" : "▼"} {Math.abs(v.change)}%
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className={cx("card", "p24")}>
              <div className={styles.revopsSecTitle}>How to Improve</div>
              {[
                { action: "Reduce sales cycle by 5 days", impact: "+velocity" },
                { action: "Increase win rate by 10%",     impact: "+pipeline" },
                { action: "Add 2 more opportunities",     impact: "+revenue" },
              ].map((item, i) => (
                <div key={item.action} className={cx("flexBetween", "py10", i < 2 && "borderB")}>
                  <span className={cx("text12")}>{item.action}</span>
                  <span className={styles.revopsImpact}>{item.impact}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

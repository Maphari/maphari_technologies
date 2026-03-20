// ════════════════════════════════════════════════════════════════════════════
// profitability-per-project-page.tsx — Admin P&L per project (real API)
// Data   : loadAdminSnapshotWithRefresh  → projects (budgetCents) + invoices
//          loadTimeEntriesWithRefresh    → time entries (actual cost at R850/h)
// Planned Revenue : project.budgetCents
// Actual Revenue  : sum of PAID invoices for that client (revenue collected)
// Planned Cost    : project.budgetCents × 0.65 (65% cost ratio estimate)
// Actual Cost     : time-entry hours × HOURLY_RATE_CENTS + tools/overhead
// Gross Margin    : actual revenue - actual cost
// Margin %        : gross margin / planned revenue × 100
// Budget Variance : actual cost vs planned cost
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useMemo, useState } from "react";
import { cx, styles } from "../style";
import { AdminFilterBar } from "./shared";
import { colorClass } from "./admin-page-utils";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import type { AdminProject, AdminInvoice, ProjectTimeEntry } from "../../../../lib/api/admin/types";
import { loadAdminSnapshotWithRefresh } from "../../../../lib/api/admin/clients";
import { loadTimeEntriesWithRefresh } from "../../../../lib/api/admin/tasks";

// ── Constants ─────────────────────────────────────────────────────────────────
const HOURLY_RATE_CENTS = 85000; // R850 per hour in cents (aligns with per-client page)

// ── Types ─────────────────────────────────────────────────────────────────────
const tabs = ["project margins", "hours analysis", "collected vs invoiced", "cost breakdown"] as const;
type Tab = (typeof tabs)[number];
type SortBy = "margin" | "profit" | "budget";

// ── Helpers ───────────────────────────────────────────────────────────────────
function centsToK(cents: number): string {
  return `R${(cents / 100_000).toFixed(1)}k`;
}

function projectColor(index: number): string {
  const colors = ["var(--accent)", "var(--blue)", "var(--amber)", "var(--purple)", "var(--muted)"];
  return colors[index % colors.length];
}

function toneBorderClass(isRisk: boolean): string {
  return isRisk ? styles.pppToneRed : styles.pppToneBorder;
}

function toneFillClass(value: string): string {
  if (value === "var(--red)") return styles.pppFillRed;
  if (value === "var(--blue)") return styles.pppFillBlue;
  if (value === "var(--amber)") return styles.pppFillAmber;
  if (value === "var(--purple)") return styles.pppFillPurple;
  if (value === "var(--muted)") return styles.pppFillMuted;
  return styles.pppFillAccent;
}

function marginClass(value: string): string {
  if (value === "var(--red)") return styles.pppMarginRed;
  if (value === "var(--amber)") return styles.pppMarginAmber;
  return styles.pppMarginAccent;
}

function dotClass(value: string): string {
  if (value === "var(--red)") return styles.pppDotRed;
  if (value === "var(--blue)") return styles.pppDotBlue;
  if (value === "var(--amber)") return styles.pppDotAmber;
  if (value === "var(--purple)") return styles.pppDotPurple;
  if (value === "var(--muted)") return styles.pppDotMuted;
  return styles.pppDotAccent;
}

/** RAG fill class for P&L margin dot */
function ragFillClass(margin: number): string {
  if (margin >= 30) return styles.plGreen;
  if (margin >= 10) return styles.plAmber;
  return styles.plRed;
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  session: AuthSession | null;
  onNotify: (tone: "success" | "error" | "warning" | "info", msg: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function ProfitabilityPerProjectPage({ session, onNotify }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("project margins");
  const [sortBy, setSortBy] = useState<SortBy>("margin");
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
  const [timeEntries, setTimeEntries] = useState<ProjectTimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    setError(null);
    void (async () => {
      try {
        const [snapshotResult, timeResult] = await Promise.all([
          loadAdminSnapshotWithRefresh(session),
          loadTimeEntriesWithRefresh(session)
        ]);
        if (cancelled) return;
        if (snapshotResult.nextSession) saveSession(snapshotResult.nextSession);
        if (timeResult.nextSession) saveSession(timeResult.nextSession);
        if (snapshotResult.error) { setError(snapshotResult.error.message ?? "Failed to load."); return; }
        if (timeResult.error) onNotify("error", timeResult.error.message);
        setProjects(snapshotResult.data?.projects ?? []);
        setInvoices(snapshotResult.data?.invoices ?? []);
        setTimeEntries(timeResult.data ?? []);
      } catch (err: unknown) {
        if (!cancelled) setError((err as Error)?.message ?? "Failed to load.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [session, onNotify]);

  // ── Compute per-project profitability ─────────────────────────────────────
  const withCalc = useMemo(() => {
    return projects.map((p, idx) => {
      const color = projectColor(idx);

      // Planned revenue: project's own budgetCents field (contract value)
      const plannedRevenue = p.budgetCents ?? 0;

      // Actual revenue = paid invoices for this client (collected cash)
      const collected = invoices
        .filter((i) => i.clientId === p.clientId && i.status === "PAID")
        .reduce((s, i) => s + i.amountCents, 0);

      // Invoiced (all non-VOID invoices for client)
      const projectInvoices = invoices.filter((i) => i.clientId === p.clientId && i.status !== "VOID");
      const invoiced = projectInvoices.reduce((s, i) => s + i.amountCents, 0);

      // Planned cost: 65% of planned revenue (estimated cost ratio)
      const plannedCost = Math.round(plannedRevenue * 0.65);

      // Actual cost from time entries (minutes → hours × rate)
      const projectEntries = timeEntries.filter((te) => te.projectId === p.id);
      const hoursSpent = projectEntries.reduce((s, te) => s + te.minutes, 0) / 60;
      const hoursEstimated = plannedRevenue > 0 ? plannedRevenue / HOURLY_RATE_CENTS : 0;
      const staffTimeCost = Math.round(hoursSpent * HOURLY_RATE_CENTS);
      const toolsCost = Math.round(plannedRevenue * 0.03);    // 3% tools estimate
      const overheadCost = Math.round(plannedRevenue * 0.05); // 5% overhead estimate
      const totalCost = staffTimeCost + toolsCost + overheadCost; // actual cost

      // Budget variance: actual cost vs planned cost (positive = over budget)
      const budgetVarianceCents = totalCost - plannedCost;
      const isOverBudget = budgetVarianceCents > 0;

      // P&L columns
      const grossProfit = collected - totalCost; // actual revenue - actual cost
      const margin = plannedRevenue > 0 ? Math.round((grossProfit / plannedRevenue) * 100) : 0;
      const collectionRate = invoiced > 0 ? Math.round((collected / invoiced) * 100) : 0;
      const realizedProfit = collected - totalCost;
      const hoursVariance = Math.round(hoursSpent - hoursEstimated);
      const effectiveRate = hoursEstimated > 0 ? Math.round(plannedRevenue / hoursEstimated) : 0;
      const actualRate = hoursSpent > 0 ? Math.round(collected / hoursSpent) : 0;

      // Staff cost breakdown for drill-down
      const staffBreakdown = Object.entries(
        projectEntries.reduce<Record<string, { name: string; minutes: number }>>((acc, te) => {
          const key = te.staffName ?? te.staffUserId ?? "Unknown";
          if (!acc[key]) acc[key] = { name: key, minutes: 0 };
          acc[key].minutes += te.minutes;
          return acc;
        }, {})
      )
        .map(([, v]) => ({
          name: v.name,
          hours: Math.round((v.minutes / 60) * 10) / 10,
          costCents: Math.round((v.minutes / 60) * HOURLY_RATE_CENTS)
        }))
        .sort((a, b) => b.costCents - a.costCents);

      // Legacy alias (budget = planned revenue for backward compat with existing tabs)
      const budget = plannedRevenue;

      return {
        id: p.id,
        name: p.name,
        client: p.clientId,
        clientColor: color,
        type: "Project" as const,
        status: (p.riskLevel === "HIGH" ? "at-risk" : "active") as "active" | "at-risk",
        phase: p.status,
        budget,
        plannedRevenue,
        actualRevenue: collected,
        plannedCost,
        invoiced,
        collected,
        costs: { staffTime: staffTimeCost, freelancers: 0, tools: toolsCost, overhead: overheadCost },
        hoursSpent: Math.round(hoursSpent * 10) / 10,
        hoursEstimated: Math.round(hoursEstimated * 10) / 10,
        totalCost,
        budgetVarianceCents,
        isOverBudget,
        grossProfit,
        margin,
        collectionRate,
        realizedProfit,
        hoursVariance,
        effectiveRate,
        actualRate,
        staffBreakdown
      };
    });
  }, [projects, invoices, timeEntries]);

  const sorted = useMemo(() => {
    return [...withCalc].sort((a, b) =>
      sortBy === "margin" ? b.margin - a.margin
        : sortBy === "profit" ? b.grossProfit - a.grossProfit
        : b.budget - a.budget
    );
  }, [withCalc, sortBy]);

  const totalBudget = withCalc.reduce((s, p) => s + p.budget, 0);
  const totalCost = withCalc.reduce((s, p) => s + p.totalCost, 0);
  const totalProfit = totalBudget - totalCost;
  const totalCollected = withCalc.reduce((s, p) => s + p.collected, 0);
  const avgMargin = totalBudget > 0 ? Math.round((totalProfit / totalBudget) * 100) : 0;

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
    <div className={cx(styles.pageBody, styles.pppRoot)}>
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / FINANCIAL</div>
          <h1 className={styles.pageTitle}>Profitability per Project</h1>
          <div className={styles.pageSub}>Budget vs cost, hours variance, collection rate, and true margin</div>
        </div>
        <div className={styles.pageActions}>
          <button
            type="button"
            className={cx("btnSm", "btnAccent")}
            onClick={() => {
              const header = "Project,Client,Phase,Planned Revenue (R),Actual Revenue (R),Planned Cost (R),Actual Cost (R),Gross Margin (R),Margin %,Budget Variance (R),Hours Spent";
              const rows = sorted.map((p) =>
                [
                  `"${p.name}"`,
                  `"${p.client}"`,
                  p.phase,
                  (p.plannedRevenue / 100).toFixed(2),
                  (p.actualRevenue / 100).toFixed(2),
                  (p.plannedCost / 100).toFixed(2),
                  (p.totalCost / 100).toFixed(2),
                  (p.grossProfit / 100).toFixed(2),
                  p.margin,
                  (p.budgetVarianceCents / 100).toFixed(2),
                  p.hoursSpent.toFixed(1)
                ].join(",")
              );
              const csv = [header, ...rows].join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `profitability-per-project-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className={cx("topCardsStack", "gap16", "mb16")}>
        {[
          { label: "Total Project Revenue", value: centsToK(totalBudget), color: "var(--accent)", sub: "All active projects" },
          { label: "Total Project Cost", value: centsToK(totalCost), color: "var(--red)", sub: "Staff + tools + overhead" },
          { label: "Avg Project Margin", value: `${avgMargin}%`, color: avgMargin >= 50 ? "var(--accent)" : "var(--amber)", sub: "Gross profit margin" },
          { label: "Cash Collected", value: centsToK(totalCollected), color: "var(--blue)", sub: `of ${centsToK(totalBudget)} invoiced` }
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, colorClass(s.color))}>{s.value}</div>
            <div className={cx("text11", "colorMuted")}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className={cx("overflowAuto", "minH0")}>
          <AdminFilterBar panelColor={"var(--surface)"} borderColor={"var(--border)"}>
            <select title="Select tab" value={activeTab} onChange={(e) => setActiveTab(e.target.value as Tab)} className={styles.formInput}>
              {tabs.map((tab) => <option key={tab} value={tab}>{tab}</option>)}
            </select>
            {activeTab === "project margins" ? (
              <select title="Sort projects" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)} className={styles.formInput}>
                <option value="margin">Margin</option>
                <option value="profit">Profit</option>
                <option value="budget">Budget</option>
              </select>
            ) : null}
          </AdminFilterBar>

          {activeTab === "project margins" ? (
            <div className={styles.pppList14}>
              {sorted.length === 0 && (
                <div className={cx("p24", "colorMuted", "text12", "textCenter")}>No project data available.</div>
              )}
              {sorted.map((p) => {
                const marginColor = p.margin >= 55 ? "var(--accent)" : p.margin >= 35 ? "var(--amber)" : "var(--red)";
                const isExpanded = expandedProjectId === p.id;
                return (
                  <div key={p.id} className={cx(styles.pppCard, toneBorderClass(p.margin < 30), "tableRow", "tableRowClickable")}>
                    {/* ── Clickable header row ── */}
                    <button
                      type="button"
                      className={styles.pppCardToggle}
                      aria-expanded={isExpanded}
                      onClick={() => setExpandedProjectId(isExpanded ? null : p.id)}
                    >
                      <div className={styles.pppMainGrid}>
                        <div className={styles.pppNameCell}>
                          <span className={cx("expandChevron", isExpanded ? "expandChevronOpen" : "")}>
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" aria-hidden="true">
                              <path d="M2 1l4 3-4 3V1z"/>
                            </svg>
                          </span>
                          <span className={cx(styles.plRag, ragFillClass(p.margin))} title={p.margin >= 30 ? "Healthy" : p.margin >= 10 ? "Watch" : "At risk"} />
                          <div>
                            <div className={styles.pppProjName}>{p.name}</div>
                            <div className={cx(styles.pppClientMeta, colorClass(p.clientColor))}>{p.client} · {p.type}</div>
                          </div>
                        </div>
                        {/* P&L Margin bar */}
                        <div>
                          <div className={styles.pppTopRow}>
                            <span className={styles.pppMiniLabel}>Actual vs Planned Revenue</span>
                            <span className={cx(styles.pppMiniMono, colorClass(marginColor))}>{p.margin}% margin</span>
                          </div>
                          <div className={styles.pppStackBar}>
                            <svg className={styles.pppStackSvg} viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true">
                              <rect className={styles.pppCostBar} x="0" y="0" width={p.plannedRevenue > 0 ? Math.min((p.totalCost / p.plannedRevenue) * 100, 100) : 0} height="8" />
                              <rect className={cx(styles.pppMarginBar, marginClass(marginColor))} x={p.plannedRevenue > 0 ? Math.min((p.totalCost / p.plannedRevenue) * 100, 100) : 0} y="0" width={p.plannedRevenue > 0 ? 100 - Math.min((p.totalCost / p.plannedRevenue) * 100, 100) : 0} height="8" />
                            </svg>
                          </div>
                        </div>
                        {/* P&L columns */}
                        <div className={styles.pppCenterCol}><div className={styles.pppMiniLabel}>Planned Rev</div><div className={styles.pppValueAccent}>{centsToK(p.plannedRevenue)}</div></div>
                        <div className={styles.pppCenterCol}><div className={styles.pppMiniLabel}>Actual Rev</div><div className={cx(styles.pppValueStrong, p.actualRevenue >= p.plannedRevenue ? "colorAccent" : "colorAmber")}>{centsToK(p.actualRevenue)}</div></div>
                        <div className={styles.pppCenterCol}><div className={styles.pppMiniLabel}>Planned Cost</div><div className={styles.pppValueMono}>{centsToK(p.plannedCost)}</div></div>
                        <div className={styles.pppCenterCol}>
                          <div className={styles.pppMiniLabel}>Actual Cost</div>
                          <div className={styles.pppValueRed}>{centsToK(p.totalCost)}</div>
                          {p.isOverBudget && (
                            <div className={styles.plOverBudget}>Over by {centsToK(p.budgetVarianceCents)}</div>
                          )}
                        </div>
                        <div className={styles.pppCenterCol}><div className={styles.pppMiniLabel}>Gross Margin</div><div className={cx(styles.pppValueStrong, p.grossProfit >= 0 ? "colorAccent" : "colorRed")}>{centsToK(p.grossProfit)}</div></div>
                        <div className={styles.pppCenterCol}>
                          <div className={styles.pppMiniLabel}>Margin %</div>
                          <div className={cx(styles.pppMarginBig, colorClass(marginColor))}>{p.margin}%</div>
                          <div className={cx(styles.plMarginBar, styles.ppcMarginBarWrap)}>
                            <div
                              className={cx(styles.plMarginFill, ragFillClass(p.margin), styles.ppcBarFill)}
                              style={{ "--bar-w": `${Math.min(Math.max(p.margin, 0), 100)}%` } as React.CSSProperties}
                            />
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* ── Drill-down: cost breakdown by staff member ── */}
                    {isExpanded && (
                      <div className={cx(styles.plDrillRow, styles.ppcDrillRow)}>
                        <div className={styles.pppDrillHeader}>
                          <span className={cx(styles.pppMiniLabel, "fw700")}>Cost Breakdown by Staff Member</span>
                          <span className={cx("text11", "colorMuted")}>{p.hoursSpent}h total · R{Math.round(HOURLY_RATE_CENTS / 100)}/h rate</span>
                        </div>
                        {p.staffBreakdown.length === 0 ? (
                          <div className={cx("text11", "colorMuted", "p12")}>No time entries recorded for this project.</div>
                        ) : (
                          p.staffBreakdown.map((s) => (
                            <div key={s.name} className={styles.pppDrillRow}>
                              <span className={styles.pppDrillName}>{s.name}</span>
                              <span className={cx("text11", "colorMuted")}>{s.hours}h</span>
                              <progress
                                className={cx(styles.pppLineTrack, styles.pppFillAccent)}
                                max={100}
                                value={p.costs.staffTime > 0 ? Math.round((s.costCents / p.costs.staffTime) * 100) : 0}
                                aria-label={`${s.name} cost share`}
                              />
                              <span className={cx(styles.pppLineValue, "colorAccent")}>{centsToK(s.costCents)}</span>
                            </div>
                          ))
                        )}
                        {/* Summary tiles */}
                        <div className={styles.pppCostGrid}>
                          {[
                            { label: "Staff Time", value: p.costs.staffTime, color: "var(--accent)" },
                            { label: "Freelancers", value: p.costs.freelancers, color: "var(--amber)" },
                            { label: "Tools", value: p.costs.tools, color: "var(--blue)" },
                            { label: "Overhead", value: p.costs.overhead, color: "var(--muted)" }
                          ].map((c) => (
                            <div key={c.label} className={styles.pppCostBox}>
                              <div className={cx(styles.pppCostValue, colorClass(c.color))}>{centsToK(c.value)}</div>
                              <div className={styles.pppCostLabel}>{c.label}</div>
                            </div>
                          ))}
                        </div>
                        {p.collected === 0 ? (
                          <div className={styles.pppWarnRow}>
                            {centsToK(p.invoiced)} invoiced — R0 collected. Realized margin is negative until paid.
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : null}

          {activeTab === "hours analysis" ? (
            <div className={styles.pppList14}>
              {withCalc.length === 0 && (
                <div className={cx("p24", "colorMuted", "text12", "textCenter")}>No data available.</div>
              )}
              {withCalc.map((p) => {
                const pct = p.hoursEstimated > 0 ? Math.round((p.hoursSpent / p.hoursEstimated) * 100) : 0;
                const color = pct <= 100 ? "var(--accent)" : pct <= 115 ? "var(--amber)" : "var(--red)";
                return (
                  <div key={p.id} className={cx(styles.pppHoursCard, toneBorderClass(pct > 115))}>
                    <div className={styles.pppHoursGrid}>
                      <div>
                        <div className={styles.pppProjName}>{p.name}</div>
                        <div className={cx(styles.pppClientMeta, colorClass(p.clientColor))}>{p.client}</div>
                      </div>
                      <div>
                        <div className={styles.pppTopRow}>
                          <span className={styles.pppMiniLabel}>{p.hoursSpent.toFixed(1)}h spent of {p.hoursEstimated.toFixed(1)}h estimated</span>
                          <span className={cx(styles.pppMiniMono, colorClass(color))}>{pct}%</span>
                        </div>
                        <progress className={cx(styles.pppTrack8, toneFillClass(color))} max={100} value={Math.min(pct, 100)} aria-label={`${p.name} hours usage ${pct}%`} />
                      </div>
                      <div className={styles.pppCenterCol}><div className={styles.pppMiniLabel}>Variance</div><div className={cx(styles.pppValueStrong, p.hoursVariance <= 0 ? "colorAccent" : "colorRed")}>{p.hoursVariance > 0 ? "+" : ""}{p.hoursVariance}h</div></div>
                      <div className={styles.pppCenterCol}><div className={styles.pppMiniLabel}>Effective Rate</div><div className={styles.pppValueMonoBlue}>{p.effectiveRate > 0 ? `R${Math.round(p.effectiveRate / 100)}/h` : "—"}</div></div>
                      <div className={styles.pppCenterCol}><div className={styles.pppMiniLabel}>Actual Rate</div><div className={cx(styles.pppValueMono, p.actualRate >= p.effectiveRate ? "colorAccent" : "colorRed")}>{p.actualRate > 0 ? `R${Math.round(p.actualRate / 100)}/h` : "—"}</div></div>
                      {pct > 115 ? <span className={styles.pppOverHours}>Over-hours</span> : <span />}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {activeTab === "collected vs invoiced" ? (
            <div className={styles.pppList12}>
              {withCalc.length === 0 && (
                <div className={cx("p24", "colorMuted", "text12", "textCenter")}>No data available.</div>
              )}
              {withCalc.map((p) => (
                <div key={p.id} className={styles.pppCollectCard}>
                  <div className={styles.pppCollectGrid}>
                    <div>
                      <div className={styles.pppProjName}>{p.name}</div>
                      <div className={cx(styles.pppClientMeta, colorClass(p.clientColor))}>{p.client}</div>
                    </div>
                    <div>
                      <div className={styles.pppTopRow}>
                        <span className={styles.pppMiniLabel}>{centsToK(p.collected)} collected of {centsToK(p.invoiced)} invoiced</span>
                        <span className={cx(styles.pppMiniMono, p.collectionRate === 100 ? "colorAccent" : "colorRed")}>{p.collectionRate}%</span>
                      </div>
                      <progress className={cx(styles.pppTrack8, p.collectionRate === 100 ? styles.pppFillAccent : styles.pppFillAmber)} max={100} value={p.collectionRate} aria-label={`${p.name} collection rate ${p.collectionRate}%`} />
                    </div>
                    <div className={styles.pppCenterCol}><div className={styles.pppMiniLabel}>Outstanding</div><div className={cx(styles.pppValueStrong, p.invoiced - p.collected > 0 ? "colorRed" : "colorAccent")}>{centsToK(p.invoiced - p.collected)}</div></div>
                    <div className={styles.pppCenterCol}><div className={styles.pppMiniLabel}>Realized Profit</div><div className={cx(styles.pppValueStrong, p.realizedProfit >= 0 ? "colorAccent" : "colorRed")}>{centsToK(p.realizedProfit)}</div></div>
                    {p.collectionRate < 100 ? <button type="button" className={styles.pppChaseBtn}>Chase</button> : <span />}
                  </div>
                </div>
              ))}
              <div className={styles.pppPortfolioCard}>
                <div className={styles.pppPortfolioRow}>
                  <span className={cx("fw700")}>Portfolio Total</span>
                  <div className={styles.pppPortfolioStats}>
                    <div className={styles.pppPortfolioItem}><div className={styles.pppMiniLabel}>Invoiced</div><div className={styles.pppValueStrongAccent}>{centsToK(totalBudget)}</div></div>
                    <div className={styles.pppPortfolioItem}><div className={styles.pppMiniLabel}>Collected</div><div className={styles.pppValueStrongBlue}>{centsToK(totalCollected)}</div></div>
                    <div className={styles.pppPortfolioItem}><div className={styles.pppMiniLabel}>Outstanding</div><div className={styles.pppValueStrongRed}>{centsToK(totalBudget - totalCollected)}</div></div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === "cost breakdown" ? (
            <div className={cx("grid2", "gap20")}>
              <div className={cx("card", "p24")}>
                <div className={styles.sciSecTitle}>Cost Type vs Total</div>
                {(["staffTime", "freelancers", "tools", "overhead"] as const).map((key, i) => {
                  const total = withCalc.reduce((s, p) => s + p.costs[key], 0);
                  const labels = { staffTime: "Staff Time", freelancers: "Freelancers", tools: "Tools", overhead: "Overhead" } as const;
                  const colors = ["var(--accent)", "var(--amber)", "var(--blue)", "var(--muted)"] as const;
                  return (
                    <div key={key} className={styles.pppCostLine}>
                      <div className={cx(styles.pppDot, dotClass(colors[i]))} />
                      <span className={styles.pppLineLabel}>{labels[key]}</span>
                      <progress className={cx(styles.pppLineTrack, toneFillClass(colors[i]))} max={100} value={totalCost > 0 ? (total / totalCost) * 100 : 0} aria-label={`${labels[key]} share`} />
                      <span className={cx(styles.pppLineValue, colorClass(colors[i]))}>{centsToK(total)}</span>
                    </div>
                  );
                })}
              </div>
              <div className={cx("card", "p24")}>
                <div className={styles.sciSecTitle}>Most Costly Projects</div>
                {[...withCalc].sort((a, b) => b.totalCost - a.totalCost).map((p) => {
                  const maxCost = Math.max(...withCalc.map((r) => r.totalCost), 1);
                  return (
                    <div key={p.id} className={styles.pppCostLine}>
                      <div className={cx(styles.pppDot, dotClass(p.clientColor))} />
                      <span className={cx(styles.pppLineLabel, colorClass(p.clientColor))}>{p.name.length > 22 ? `${p.name.slice(0, 22)}...` : p.name}</span>
                      <progress className={cx(styles.pppLineTrack, toneFillClass(p.clientColor))} max={100} value={(p.totalCost / maxCost) * 100} aria-label={`${p.name} cost relative ${Math.round((p.totalCost / maxCost) * 100)}%`} />
                      <span className={cx(styles.pppLineValue, colorClass(p.clientColor))}>{centsToK(p.totalCost)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
    </div>
  );
}

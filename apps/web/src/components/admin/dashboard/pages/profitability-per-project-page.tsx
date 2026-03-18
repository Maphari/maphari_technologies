// ════════════════════════════════════════════════════════════════════════════
// profitability-per-project-page.tsx — Admin profitability per project (real API)
// Data   : loadAdminSnapshotWithRefresh  → projects + invoices
//          loadTimeEntriesWithRefresh    → time entries (cost proxy at R875/h)
// Revenue: sum of invoices (any status except VOID) per projectId via clientId match
// Cost   : sum of time-entry minutes → hours × R875 per project
// Margin : (revenue - cost) / revenue × 100
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
const HOURLY_RATE_CENTS = 87500; // R875 per hour in cents

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

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  session: AuthSession | null;
  onNotify: (tone: "success" | "error" | "warning" | "info", msg: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function ProfitabilityPerProjectPage({ session, onNotify }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("project margins");
  const [sortBy, setSortBy] = useState<SortBy>("margin");
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
  const [timeEntries, setTimeEntries] = useState<ProjectTimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    void (async () => {
      const [snapshotResult, timeResult] = await Promise.all([
        loadAdminSnapshotWithRefresh(session),
        loadTimeEntriesWithRefresh(session)
      ]);
      if (cancelled) return;
      if (snapshotResult.nextSession) saveSession(snapshotResult.nextSession);
      if (timeResult.nextSession) saveSession(timeResult.nextSession);
      if (snapshotResult.error) onNotify("error", snapshotResult.error.message);
      if (timeResult.error) onNotify("error", timeResult.error.message);
      setProjects(snapshotResult.data?.projects ?? []);
      setInvoices(snapshotResult.data?.invoices ?? []);
      setTimeEntries(timeResult.data ?? []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [session, onNotify]);

  // ── Compute per-project profitability ─────────────────────────────────────
  const withCalc = useMemo(() => {
    return projects.map((p, idx) => {
      const color = projectColor(idx);

      // Revenue = all non-VOID invoices for this client (budget proxy)
      const projectInvoices = invoices.filter((i) => i.clientId === p.clientId && i.status !== "VOID");
      const budget = projectInvoices.reduce((s, i) => s + i.amountCents, 0);
      const collected = invoices
        .filter((i) => i.clientId === p.clientId && i.status === "PAID")
        .reduce((s, i) => s + i.amountCents, 0);
      const invoiced = projectInvoices.reduce((s, i) => s + i.amountCents, 0);

      // Cost from time entries (minutes → hours × rate)
      const projectEntries = timeEntries.filter((te) => te.projectId === p.id);
      const hoursSpent = projectEntries.reduce((s, te) => s + te.minutes, 0) / 60;
      // Estimated hours from budget ÷ hourly rate (cents)
      const hoursEstimated = budget > 0 ? budget / HOURLY_RATE_CENTS : 0;
      const staffTimeCost = Math.round(hoursSpent * HOURLY_RATE_CENTS);
      const toolsCost = Math.round(budget * 0.03);      // 3% tools estimate
      const overheadCost = Math.round(budget * 0.05);   // 5% overhead estimate
      const totalCost = staffTimeCost + toolsCost + overheadCost;

      const grossProfit = budget - totalCost;
      const margin = budget > 0 ? Math.round((grossProfit / budget) * 100) : 0;
      const collectionRate = invoiced > 0 ? Math.round((collected / invoiced) * 100) : 0;
      const realizedProfit = collected - totalCost;
      const hoursVariance = Math.round(hoursSpent - hoursEstimated);
      const effectiveRate = hoursEstimated > 0 ? Math.round(budget / hoursEstimated) : 0;
      const actualRate = hoursSpent > 0 ? Math.round(collected / hoursSpent) : 0;

      return {
        id: p.id,
        name: p.name,
        client: p.clientId,
        clientColor: color,
        type: "Project" as const,
        status: (p.riskLevel === "HIGH" ? "at-risk" : "active") as "active" | "at-risk",
        phase: p.status,
        budget,
        invoiced,
        collected,
        costs: { staffTime: staffTimeCost, freelancers: 0, tools: toolsCost, overhead: overheadCost },
        hoursSpent: Math.round(hoursSpent * 10) / 10,
        hoursEstimated: Math.round(hoursEstimated * 10) / 10,
        totalCost,
        grossProfit,
        margin,
        collectionRate,
        realizedProfit,
        hoursVariance,
        effectiveRate,
        actualRate
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
          <button type="button" className={cx("btnSm", "btnAccent")}>Export Report</button>
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

      {loading && (
        <div className={cx("p24", "colorMuted", "text12", "textCenter")}>Loading data…</div>
      )}

      {!loading && (
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
                return (
                  <div key={p.id} className={cx(styles.pppCard, toneBorderClass(p.margin < 30))}>
                    <div className={styles.pppMainGrid}>
                      <div>
                        <div className={styles.pppProjName}>{p.name}</div>
                        <div className={cx(styles.pppClientMeta, colorClass(p.clientColor))}>{p.client} · {p.type}</div>
                      </div>
                      <div>
                        <div className={styles.pppTopRow}>
                          <span className={styles.pppMiniLabel}>Cost vs Budget</span>
                          <span className={cx(styles.pppMiniMono, colorClass(marginColor))}>{p.margin}% margin</span>
                        </div>
                        <div className={styles.pppStackBar}>
                          <svg className={styles.pppStackSvg} viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true">
                            <rect className={styles.pppCostBar} x="0" y="0" width={p.budget > 0 ? Math.min((p.totalCost / p.budget) * 100, 100) : 0} height="8" />
                            <rect className={cx(styles.pppMarginBar, marginClass(marginColor))} x={p.budget > 0 ? Math.min((p.totalCost / p.budget) * 100, 100) : 0} y="0" width={p.budget > 0 ? 100 - Math.min((p.totalCost / p.budget) * 100, 100) : 0} height="8" />
                          </svg>
                        </div>
                      </div>
                      <div className={styles.pppCenterCol}><div className={styles.pppMiniLabel}>Budget</div><div className={styles.pppValueAccent}>{centsToK(p.budget)}</div></div>
                      <div className={styles.pppCenterCol}><div className={styles.pppMiniLabel}>Cost</div><div className={styles.pppValueRed}>{centsToK(p.totalCost)}</div></div>
                      <div className={styles.pppCenterCol}><div className={styles.pppMiniLabel}>Profit</div><div className={cx(styles.pppValueStrong, p.grossProfit >= 0 ? "colorAccent" : "colorRed")}>{centsToK(p.grossProfit)}</div></div>
                      <div className={styles.pppCenterCol}><div className={styles.pppMiniLabel}>Collected</div><div className={cx(styles.pppValueMono, p.collectionRate === 100 ? "colorAccent" : "colorAmber")}>{p.collectionRate}%</div></div>
                      <div className={styles.pppCenterCol}><div className={styles.pppMiniLabel}>Margin</div><div className={cx(styles.pppMarginBig, colorClass(marginColor))}>{p.margin}%</div></div>
                    </div>
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
      )}
    </div>
  );
}

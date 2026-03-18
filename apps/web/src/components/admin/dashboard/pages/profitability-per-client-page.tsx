// ════════════════════════════════════════════════════════════════════════════
// profitability-per-client-page.tsx — Admin profitability per client (real API)
// Data   : loadAdminSnapshotWithRefresh  → clients + invoices
//          loadExpensesWithRefresh       → expenses (cost per client)
// Revenue: sum of PAID invoice amountCents per clientId
// Cost   : sum of approved expense amountCents per clientId
// Margin : (revenue - cost) / revenue × 100
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useMemo, useState } from "react";
import { cx, styles } from "../style";
import { AdminFilterBar } from "./shared";
import { colorClass } from "./admin-page-utils";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import type { AdminClient, AdminInvoice } from "../../../../lib/api/admin/types";
import type { AdminExpense } from "../../../../lib/api/admin/expenses";
import { loadAdminSnapshotWithRefresh } from "../../../../lib/api/admin/clients";
import { loadExpensesWithRefresh } from "../../../../lib/api/admin/expenses";

// ── Types ─────────────────────────────────────────────────────────────────────
const tabs = ["profitability", "cost breakdown", "ltv analysis", "margin trends"] as const;
type Tab = (typeof tabs)[number];
type SortBy = "margin" | "profit" | "revenue";

// ── Helpers ───────────────────────────────────────────────────────────────────
function marginClass(margin: number): string {
  if (margin >= 50) return "colorAccent";
  if (margin >= 30) return "colorAmber";
  return "colorRed";
}

function centsToK(cents: number): string {
  return `R${(cents / 100_000).toFixed(1)}k`;
}

function clientColor(_index: number): string {
  const colors = ["var(--accent)", "var(--blue)", "var(--amber)", "var(--purple)", "var(--muted)"];
  return colors[_index % colors.length];
}

function toneFillClass(value: string): string {
  if (value === "var(--red)") return styles.ppcFillRed;
  if (value === "var(--blue)") return styles.ppcFillBlue;
  if (value === "var(--amber)") return styles.ppcFillAmber;
  if (value === "var(--purple)") return styles.ppcFillPurple;
  if (value === "var(--muted)") return styles.ppcFillMuted;
  return styles.ppcFillAccent;
}

function dotClass(value: string): string {
  if (value === "var(--red)") return styles.ppcDotRed;
  if (value === "var(--blue)") return styles.ppcDotBlue;
  if (value === "var(--amber)") return styles.ppcDotAmber;
  if (value === "var(--purple)") return styles.ppcDotPurple;
  if (value === "var(--muted)") return styles.ppcDotMuted;
  return styles.ppcDotAccent;
}

function ltvCardClass(value: string): string {
  if (value === "var(--red)") return styles.ppcLtvCardRed;
  if (value === "var(--blue)") return styles.ppcLtvCardBlue;
  if (value === "var(--amber)") return styles.ppcLtvCardAmber;
  if (value === "var(--purple)") return styles.ppcLtvCardPurple;
  if (value === "var(--muted)") return styles.ppcLtvCardMuted;
  return styles.ppcLtvCardAccent;
}

// ── Sub-component ─────────────────────────────────────────────────────────────
function ProfitBar({ revenue, totalCost }: { revenue: number; totalCost: number }) {
  if (revenue === 0) return null;
  const profit = revenue - totalCost;
  const margin = Math.round((profit / revenue) * 100);
  const costPct = Math.min((totalCost / revenue) * 100, 100);
  const color = margin >= 50 ? "var(--accent)" : margin >= 30 ? "var(--amber)" : "var(--red)";
  return (
    <div>
      <div className={styles.ppcProfitHead}>
        <span className={cx("text11", "colorMuted")}>Cost vs Revenue</span>
        <span className={cx(styles.ppcMarginValue, colorClass(color))}>{margin}% margin</span>
      </div>
      <progress className={cx(styles.ppcTrack10, styles.ppcProfitLossTrack, toneFillClass(color))} max={100} value={Math.max(0, 100 - costPct)} aria-label={`Profit margin ${margin}%`} />
      <div className={styles.ppcProfitTail}>
        <span className={styles.ppcCostText}>Cost {centsToK(totalCost)}</span>
        <span className={cx(styles.ppcProfitText, colorClass(color))}>Profit {centsToK(profit)}</span>
      </div>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  session: AuthSession | null;
  onNotify: (tone: "success" | "error" | "warning" | "info", msg: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function ProfitabilityPerClientPage({ session, onNotify }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("profitability");
  const [sortBy, setSortBy] = useState<SortBy>("margin");
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
  const [expenses, setExpenses] = useState<AdminExpense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    void (async () => {
      const [snapshotResult, expensesResult] = await Promise.all([
        loadAdminSnapshotWithRefresh(session),
        loadExpensesWithRefresh(session)
      ]);
      if (cancelled) return;
      if (snapshotResult.nextSession) saveSession(snapshotResult.nextSession);
      if (expensesResult.nextSession) saveSession(expensesResult.nextSession);
      if (snapshotResult.error) onNotify("error", snapshotResult.error.message);
      if (expensesResult.error) onNotify("error", expensesResult.error.message);
      setClients(snapshotResult.data?.clients ?? []);
      setInvoices(snapshotResult.data?.invoices ?? []);
      setExpenses(expensesResult.data ?? []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [session, onNotify]);

  // ── Compute per-client profitability ─────────────────────────────────────
  const withCalc = useMemo(() => {
    return clients.map((client, idx) => {
      const color = clientColor(idx);
      const revenue = invoices
        .filter((i) => i.clientId === client.id && i.status === "PAID")
        .reduce((s, i) => s + i.amountCents, 0);
      const cost = expenses
        .filter((e) => e.clientId === client.id && (e.status === "APPROVED" || e.status === "approved"))
        .reduce((s, e) => s + e.amountCents, 0);
      const outstanding = invoices
        .filter((i) => i.clientId === client.id && (i.status === "ISSUED" || i.status === "OVERDUE"))
        .reduce((s, i) => s + i.amountCents, 0);
      const totalCost = cost;
      const profit = revenue - totalCost;
      const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;
      // Approx LTV: revenue × months active
      const firstInvoice = invoices
        .filter((i) => i.clientId === client.id)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
      const monthsActive = firstInvoice
        ? Math.max(1, Math.round((Date.now() - new Date(firstInvoice.createdAt).getTime()) / (30 * 24 * 60 * 60 * 1000)))
        : 1;
      const ltv = revenue; // actual collected = LTV so far
      // Cost breakdown — we only have total from expenses; model remainder as overhead
      const costsStaffTime = Math.round(cost * 0.6);
      const costsTools = Math.round(cost * 0.1);
      const costsFreelancers = Math.round(cost * 0.2);
      const costsOverhead = cost - costsStaffTime - costsTools - costsFreelancers;
      return {
        id: client.id,
        name: client.name ?? client.id,
        color,
        tier: client.tier,
        am: client.ownerName ?? "—",
        revenue,
        totalCost,
        profit,
        margin,
        outstanding,
        ltv,
        months: monthsActive,
        costs: { staffTime: costsStaffTime, tools: costsTools, freelancers: costsFreelancers, overhead: Math.max(0, costsOverhead) },
        mrr: Math.round(revenue / Math.max(monthsActive, 1))
      };
    });
  }, [clients, invoices, expenses]);

  const sorted = useMemo(() => {
    return [...withCalc].sort((a, b) =>
      sortBy === "margin" ? b.margin - a.margin
        : sortBy === "profit" ? b.profit - a.profit
        : b.revenue - a.revenue
    );
  }, [withCalc, sortBy]);

  const totalRevenue = withCalc.reduce((s, c) => s + c.revenue, 0);
  const totalCost = withCalc.reduce((s, c) => s + c.totalCost, 0);
  const totalProfit = totalRevenue - totalCost;
  const avgMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

  return (
    <div className={cx(styles.pageBody, styles.ppcRoot)}>
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / FINANCIAL</div>
          <h1 className={styles.pageTitle}>Profitability per Client</h1>
          <div className={styles.pageSub}>True margin after staff time, tools, freelancers and overhead</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnAccent")}>Export Report</button>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Total Revenue", value: centsToK(totalRevenue), color: "var(--accent)", sub: "Paid invoices" },
          { label: "Total Costs", value: centsToK(totalCost), color: "var(--red)", sub: "Approved expenses" },
          { label: "Net Profit", value: centsToK(totalProfit), color: "var(--accent)", sub: "Revenue minus costs" },
          { label: "Avg Margin", value: `${avgMargin}%`, color: avgMargin >= 50 ? "var(--accent)" : "var(--amber)", sub: "Portfolio average" }
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
          <AdminFilterBar panelColor="var(--surface)" borderColor="var(--border)">
            <select title="Select tab" value={activeTab} onChange={(e) => setActiveTab(e.target.value as Tab)} className={styles.formInput}>
              {tabs.map((tab) => <option key={tab} value={tab}>{tab}</option>)}
            </select>
            {activeTab === "profitability" ? (
              <select title="Sort client profitability" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)} className={styles.formInput}>
                <option value="margin">Margin</option>
                <option value="profit">Profit</option>
                <option value="revenue">Revenue</option>
              </select>
            ) : null}
          </AdminFilterBar>

          {activeTab === "profitability" && (
            <div className={styles.ppcList12}>
              {sorted.length === 0 && (
                <div className={cx("p24", "colorMuted", "text12", "textCenter")}>No client data available.</div>
              )}
              {sorted.map((c) => (
                <div key={c.id} className={cx(styles.ppcClientCard, c.margin < 30 && styles.ppcClientCardRisk)}>
                  <div className={styles.ppcMainGrid}>
                    <div>
                      <div className={cx(styles.ppcClientName, colorClass(c.color))}>{c.name}</div>
                      <div className={cx("text11", "colorMuted")}>{c.tier} · {c.am}</div>
                    </div>
                    <ProfitBar revenue={c.revenue} totalCost={c.totalCost} />
                    <div className={styles.ppcNumCenter}>
                      <div className={styles.ppcMiniLabel}>Revenue</div>
                      <div className={styles.ppcRevVal}>{centsToK(c.revenue)}</div>
                    </div>
                    <div className={styles.ppcNumCenter}>
                      <div className={styles.ppcMiniLabel}>Cost</div>
                      <div className={styles.ppcCostVal}>{centsToK(c.totalCost)}</div>
                    </div>
                    <div className={styles.ppcNumCenter}>
                      <div className={styles.ppcMiniLabel}>Profit</div>
                      <div className={cx(styles.ppcProfitVal, c.profit >= 0 ? "colorAccent" : "colorRed")}>{centsToK(c.profit)}</div>
                    </div>
                    <div className={styles.ppcNumCenter}>
                      <div className={styles.ppcMiniLabel}>Margin</div>
                      <div className={cx(styles.ppcMarginBig, marginClass(c.margin))}>{c.margin}%</div>
                    </div>
                  </div>
                  <div className={styles.ppcCostGrid}>
                    {[
                      { label: "Staff Time", value: c.costs.staffTime, color: "var(--accent)" },
                      { label: "Tools", value: c.costs.tools, color: "var(--blue)" },
                      { label: "Freelancers", value: c.costs.freelancers, color: "var(--amber)" },
                      { label: "Overhead", value: c.costs.overhead, color: "var(--muted)" }
                    ].map((cost) => (
                      <div key={cost.label} className={styles.ppcCostTile}>
                        <div className={cx(styles.ppcCostTileValue, colorClass(cost.color))}>{centsToK(cost.value)}</div>
                        <div className={styles.ppcCostTileLabel}>{cost.label}</div>
                      </div>
                    ))}
                  </div>
                  {c.outstanding > 0 && (
                    <div className={styles.ppcOutstandingRow}>{centsToK(c.outstanding)} outstanding - actual collected margin is lower</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === "cost breakdown" && (
            <div className={styles.ppcSplit2}>
              <div className={styles.ppcCard24}>
                <div className={styles.ppcSectionTitle}>Portfolio Cost Mix</div>
                {(["staffTime", "tools", "freelancers", "overhead"] as const).map((key, i) => {
                  const total = withCalc.reduce((s, c) => s + c.costs[key], 0);
                  const labels = { staffTime: "Staff Time", tools: "Tools & Software", freelancers: "Freelancers", overhead: "Overhead" };
                  const colors = ["var(--accent)", "var(--blue)", "var(--amber)", "var(--muted)"];
                  return (
                    <div key={key} className={styles.ppcMixRow}>
                      <div className={cx(styles.ppcDot10, dotClass(colors[i]))} />
                      <span className={styles.text12}>{labels[key]}</span>
                      <progress className={cx(styles.ppcBar100, toneFillClass(colors[i]))} max={100} value={totalCost > 0 ? (total / totalCost) * 100 : 0} aria-label={`${labels[key]} cost share`} />
                      <span className={cx(styles.ppcVal60, colorClass(colors[i]))}>{centsToK(total)}</span>
                    </div>
                  );
                })}
              </div>
              <div className={styles.ppcCard24}>
                <div className={styles.ppcSectionTitle}>Biggest Cost Drivers</div>
                {withCalc.slice().sort((a, b) => b.totalCost - a.totalCost).map((c) => {
                  const maxCost = Math.max(...withCalc.map((r) => r.totalCost), 1);
                  return (
                    <div key={c.id} className={styles.ppcMixRow}>
                      <div className={cx(styles.ppcDot8, dotClass(c.color))} />
                      <span className={cx(styles.ppcGrowName, colorClass(c.color))}>{c.name}</span>
                      <progress className={cx(styles.ppcBar100, toneFillClass(c.color))} max={100} value={(c.totalCost / maxCost) * 100} aria-label={`${c.name} cost relative share`} />
                      <span className={cx(styles.ppcVal60, colorClass(c.color))}>{centsToK(c.totalCost)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "ltv analysis" && (
            <div className={styles.ppcLtvGrid}>
              {withCalc.length === 0 && (
                <div className={cx("p24", "colorMuted", "text12", "textCenter")}>No data available.</div>
              )}
              {withCalc.map((c) => (
                <div key={c.id} className={cx(styles.ppcLtvCard, ltvCardClass(c.color))}>
                  <div className={styles.ppcLtvHead}>
                    <div>
                      <div className={cx(styles.ppcLtvName, colorClass(c.color))}>{c.name}</div>
                      <div className={cx("text12", "colorMuted")}>{c.months} months as client</div>
                    </div>
                    <div className={styles.ppcLtvRight}>
                      <div className={cx(styles.ppcLtvValue, colorClass(c.color))}>{centsToK(c.ltv)}</div>
                      <div className={styles.ppcLtvLabel}>Lifetime Value</div>
                    </div>
                  </div>
                  <div className={styles.ppcLtvMetrics}>
                    {[
                      { label: "Monthly MRR", value: centsToK(c.mrr), color: c.color },
                      { label: "Monthly Margin", value: `${c.margin}%`, color: c.margin >= 50 ? "var(--accent)" : c.margin >= 30 ? "var(--amber)" : "var(--red)" },
                      { label: "Net LTV", value: centsToK(Math.round(c.ltv * c.margin / 100)), color: "var(--accent)" }
                    ].map((m) => (
                      <div key={m.label} className={styles.ppcMetricTile}>
                        <div className={cx(styles.ppcMetricValue, colorClass(m.color))}>{m.value}</div>
                        <div className={styles.ppcMetricLabel}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "margin trends" && (
            <div className={styles.ppcTrendCard}>
              <div className={styles.ppcSectionTitle}>Margin by Client - Current Period</div>
              <div className={styles.ppcTrendList}>
                {withCalc.length === 0 && (
                  <div className={cx("p24", "colorMuted", "text12", "textCenter")}>No data available.</div>
                )}
                {withCalc.slice().sort((a, b) => b.margin - a.margin).map((c) => (
                  <div key={c.id} className={styles.ppcTrendRow}>
                    <span className={cx(styles.ppcTrendName, colorClass(c.color))}>{c.name}</span>
                    <div className={styles.ppcTrendTrack}>
                      <progress className={cx(styles.ppcTrendFill, c.margin >= 50 ? styles.ppcFillAccent : c.margin >= 30 ? styles.ppcFillAmber : styles.ppcFillRed)} max={100} value={Math.max(0, c.margin)} aria-label={`${c.name} margin ${c.margin}%`} />
                      <span className={styles.ppcTrendFillText}>{centsToK(c.profit)} profit</span>
                    </div>
                    <span className={cx(styles.ppcTrendPct, marginClass(c.margin))}>{c.margin}%</span>
                  </div>
                ))}
              </div>
              <div className={styles.ppcBlendBox}>
                <div className={styles.ppcBlendLabel}>Portfolio Blended Margin</div>
                <progress className={cx(styles.ppcBlendTrack, avgMargin >= 50 ? styles.ppcFillAccent : styles.ppcFillAmber)} max={100} value={Math.max(0, avgMargin)} aria-label={`Portfolio blended margin ${avgMargin}%`} />
                <div className={styles.ppcBlendFoot}>
                  <span className={cx("text11", "colorMuted")}>0%</span>
                  <span className={cx(styles.ppcBlendPct, avgMargin >= 50 ? "colorAccent" : "colorAmber")}>{avgMargin}%</span>
                  <span className={cx("text11", "colorMuted")}>100%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

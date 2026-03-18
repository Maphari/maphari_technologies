// ════════════════════════════════════════════════════════════════════════════
// profitability-per-client-page.tsx — Admin profitability per client (real API)
// Data   : loadAdminSnapshotWithRefresh  → clients + invoices
//          loadExpensesWithRefresh       → expenses (cost per client)
//          loadTimeEntriesWithRefresh    → time entries (hours × staff rate)
// Revenue: sum of PAID invoice amountCents per clientId
// Cost   : time-entry hours × STAFF_HOURLY_COST_ZAR (default R850/h) + approved expenses
// Margin : (revenue - cost) / revenue × 100
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useMemo, useState } from "react";
import { cx, styles } from "../style";
import { AdminFilterBar } from "./shared";
import { colorClass } from "./admin-page-utils";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import type { AdminClient, AdminInvoice, ProjectTimeEntry } from "../../../../lib/api/admin/types";
import type { AdminExpense } from "../../../../lib/api/admin/expenses";
import { loadAdminSnapshotWithRefresh } from "../../../../lib/api/admin/clients";
import { loadExpensesWithRefresh } from "../../../../lib/api/admin/expenses";
import { loadTimeEntriesWithRefresh } from "../../../../lib/api/admin/tasks";
import { Alert } from "@/components/shared/ui/alert";

// Staff hourly cost in ZAR (cents). Override via NEXT_PUBLIC_STAFF_HOURLY_COST_ZAR.
const STAFF_HOURLY_COST_CENTS = (() => {
  const env = process.env.NEXT_PUBLIC_STAFF_HOURLY_COST_ZAR;
  const parsed = env ? parseInt(env, 10) : NaN;
  return isNaN(parsed) ? 85000 : parsed * 100; // default R850 → 85000 cents
})();

// ── Types ─────────────────────────────────────────────────────────────────────
const tabs = ["profitability", "cost breakdown", "ltv analysis", "margin trends"] as const;
type Tab = (typeof tabs)[number];
type SortBy = "margin" | "margin-asc" | "profit" | "revenue";

// ── Helpers ───────────────────────────────────────────────────────────────────
function marginClass(margin: number): string {
  if (margin >= 50) return "colorAccent";
  if (margin >= 30) return "colorAmber";
  return "colorRed";
}

/** Returns the CSS fill class for the P&L margin bar */
function plFillClass(margin: number): string {
  if (margin >= 30) return styles.plGreen;
  if (margin >= 10) return styles.plAmber;
  return styles.plRed;
}

/** Returns RAG CSS class for inline dot */
function plRagClass(margin: number): string {
  if (margin >= 30) return styles.plGreen;
  if (margin >= 10) return styles.plAmber;
  return styles.plRed;
}

function centsToK(cents: number): string {
  return `R${(cents / 100_000).toFixed(1)}k`;
}

function fmtZAR(value: number): string {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", notation: "compact", maximumFractionDigits: 1 }).format(value);
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
  // Default: worst margin first (ascending) so unprofitable clients surface immediately
  const [sortBy, setSortBy] = useState<SortBy>("margin-asc");
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
  const [expenses, setExpenses] = useState<AdminExpense[]>([]);
  const [timeEntries, setTimeEntries] = useState<ProjectTimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  function loadData() {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    setLoadError(null);
    void (async () => {
      try {
        const [snapshotResult, expensesResult, timeResult] = await Promise.all([
          loadAdminSnapshotWithRefresh(session),
          loadExpensesWithRefresh(session),
          loadTimeEntriesWithRefresh(session)
        ]);
        if (snapshotResult.nextSession) saveSession(snapshotResult.nextSession);
        if (expensesResult.nextSession) saveSession(expensesResult.nextSession);
        if (timeResult.nextSession) saveSession(timeResult.nextSession);
        if (snapshotResult.error) { setLoadError("Failed to load profitability data. Please try again."); onNotify("error", snapshotResult.error.message); }
        if (expensesResult.error) onNotify("error", expensesResult.error.message);
        if (timeResult.error) onNotify("error", timeResult.error.message);
        setClients(snapshotResult.data?.clients ?? []);
        setInvoices(snapshotResult.data?.invoices ?? []);
        setExpenses(expensesResult.data ?? []);
        setTimeEntries(timeResult.data ?? []);
      } catch {
        setLoadError("Failed to load profitability data. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, onNotify]);

  // ── Compute per-client profitability ─────────────────────────────────────
  const withCalc = useMemo(() => {
    return clients.map((client, idx) => {
      const color = clientColor(idx);
      const revenue = invoices
        .filter((i) => i.clientId === client.id && i.status === "PAID")
        .reduce((s, i) => s + i.amountCents, 0);

      // Time-entry-based staff cost: sum minutes for this client → hours × hourly rate
      const clientEntries = timeEntries.filter((te) => te.clientId === client.id);
      const hoursSpent = clientEntries.reduce((s, te) => s + te.minutes, 0) / 60;
      const costsStaffTime = Math.round(hoursSpent * STAFF_HOURLY_COST_CENTS);

      // Approved expenses (non-staff line items: tools, freelancers, overhead)
      const approvedExpenses = expenses
        .filter((e) => e.clientId === client.id && (e.status === "APPROVED" || e.status === "approved"))
        .reduce((s, e) => s + e.amountCents, 0);

      const costsTools = Math.round(approvedExpenses * 0.1);
      const costsFreelancers = Math.round(approvedExpenses * 0.2);
      const costsOverhead = approvedExpenses - costsTools - costsFreelancers;

      const totalCost = costsStaffTime + approvedExpenses;
      const outstanding = invoices
        .filter((i) => i.clientId === client.id && (i.status === "ISSUED" || i.status === "OVERDUE"))
        .reduce((s, i) => s + i.amountCents, 0);
      const profit = revenue - totalCost;
      const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;
      // Approx LTV: actual collected revenue so far
      const firstInvoice = invoices
        .filter((i) => i.clientId === client.id)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
      const monthsActive = firstInvoice
        ? Math.max(1, Math.round((Date.now() - new Date(firstInvoice.createdAt).getTime()) / (30 * 24 * 60 * 60 * 1000)))
        : 1;
      const ltv = revenue;
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
        hoursSpent: Math.round(hoursSpent * 10) / 10,
        costs: { staffTime: costsStaffTime, tools: costsTools, freelancers: costsFreelancers, overhead: Math.max(0, costsOverhead) },
        mrr: Math.round(revenue / Math.max(monthsActive, 1))
      };
    });
  }, [clients, invoices, expenses, timeEntries]);

  const sorted = useMemo(() => {
    return [...withCalc].sort((a, b) =>
      sortBy === "margin-asc" ? a.margin - b.margin  // worst first
        : sortBy === "margin" ? b.margin - a.margin  // best first
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
          <button
            type="button"
            className={cx("btnSm", "btnAccent")}
            onClick={() => {
              const header = "Client,Tier,AM,Revenue (R),Total Cost (R),Hours Spent,Staff Cost (R),Profit (R),Margin %,Outstanding (R)";
              const rows = sorted.map((c) =>
                [
                  `"${c.name}"`,
                  c.tier,
                  `"${c.am}"`,
                  (c.revenue / 100).toFixed(2),
                  (c.totalCost / 100).toFixed(2),
                  c.hoursSpent.toFixed(1),
                  (c.costs.staffTime / 100).toFixed(2),
                  (c.profit / 100).toFixed(2),
                  c.margin,
                  (c.outstanding / 100).toFixed(2)
                ].join(",")
              );
              const csv = [header, ...rows].join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `profitability-per-client-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Total Revenue", value: fmtZAR(totalRevenue / 100), color: "var(--accent)", sub: "Paid invoices" },
          { label: "Total Costs", value: fmtZAR(totalCost / 100), color: "var(--red)", sub: "Approved expenses" },
          { label: "Net Profit", value: fmtZAR(totalProfit / 100), color: "var(--accent)", sub: "Revenue minus costs" },
          { label: "Avg Margin", value: `${avgMargin}%`, color: avgMargin >= 50 ? "var(--accent)" : "var(--amber)", sub: "Portfolio average" }
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, colorClass(s.color))}>{s.value}</div>
            <div className={cx("text11", "colorMuted")}>{s.sub}</div>
          </div>
        ))}
      </div>

      {loadError && (
        <Alert variant="error" message={loadError} onRetry={() => { setLoadError(null); void loadData(); }} />
      )}

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
                <option value="margin-asc">Margin (worst first)</option>
                <option value="margin">Margin (best first)</option>
                <option value="profit">Profit</option>
                <option value="revenue">Revenue</option>
              </select>
            ) : null}
          </AdminFilterBar>

          {activeTab === "profitability" && (
            <div className={cx(styles.ppcList12, "tabPane")}>
              {sorted.length === 0 && (
                <div className={cx("p24", "colorMuted", "text12", "textCenter")}>No client data available.</div>
              )}
              {sorted.map((c) => (
                <div key={c.id} className={cx(styles.ppcClientCard, c.margin < 30 && styles.ppcClientCardRisk, "tableRow", "tableRowClickable")}>
                  <div className={styles.ppcMainGrid}>
                    <div>
                      <div className={styles.ppcClientNameRow}>
                        <span className={cx(styles.plRag, plRagClass(c.margin))} title={c.margin >= 30 ? "Healthy" : c.margin >= 10 ? "Watch" : "At risk"} />
                        <div className={cx(styles.ppcClientName, colorClass(c.color))}>{c.name}</div>
                      </div>
                      <div className={cx("text11", "colorMuted")}>{c.tier} · {c.am}</div>
                    </div>
                    <ProfitBar revenue={c.revenue} totalCost={c.totalCost} />
                    <div className={styles.ppcNumCenter}>
                      <div className={styles.ppcMiniLabel}>Revenue</div>
                      <div className={styles.ppcRevVal}>{centsToK(c.revenue)}</div>
                    </div>
                    <div className={styles.ppcNumCenter}>
                      <div className={styles.ppcMiniLabel}>Cost (hrs×rate)</div>
                      <div className={styles.ppcCostVal}>{centsToK(c.totalCost)}</div>
                      <div className={cx("text11", "colorMuted")}>{c.hoursSpent}h @ R{Math.round(STAFF_HOURLY_COST_CENTS / 100)}/h</div>
                    </div>
                    <div className={styles.ppcNumCenter}>
                      <div className={styles.ppcMiniLabel}>Profit</div>
                      <div className={cx(styles.ppcProfitVal, c.profit >= 0 ? "colorAccent" : "colorRed")}>{centsToK(c.profit)}</div>
                    </div>
                    <div className={styles.ppcNumCenter}>
                      <div className={styles.ppcMiniLabel}>Margin</div>
                      <div className={cx(styles.ppcMarginBig, marginClass(c.margin))}>{c.margin}%</div>
                      <div className={cx(styles.plMarginBar, styles.ppcMarginBarWrap)}>
                        <div
                          className={cx(styles.plMarginFill, plFillClass(c.margin), styles.ppcBarFill)}
                          style={{ "--bar-w": `${Math.min(Math.max(c.margin, 0), 100)}%` } as React.CSSProperties}
                        />
                      </div>
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
            <div className={cx(styles.ppcSplit2, "tabPane")}>
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
            <div className={cx(styles.ppcLtvGrid, "tabPane")}>
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
            <div className={cx(styles.ppcTrendCard, "tabPane")}>
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

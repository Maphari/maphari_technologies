"use client";

import { useMemo, useState } from "react";
import { cx, styles } from "../style";
import { AdminFilterBar } from "./shared";
import { colorClass } from "./admin-page-utils";

const clients = [
  {
    name: "Volta Studios", color: "var(--accent)", avatar: "VS", tier: "Growth", am: "Nomsa Dlamini",
    mrr: 28000, hoursAllocated: 48, hourlyRate: 875,
    costs: { staffTime: 12600, tools: 1800, freelancers: 0, overhead: 2800 },
    revenue: 28000, invoicesPaid: 28000, invoicesOutstanding: 0,
    months: 14, ltv: 392000
  },
  {
    name: "Kestrel Capital", color: "var(--accent)", avatar: "KC", tier: "Core", am: "Nomsa Dlamini",
    mrr: 21000, hoursAllocated: 36, hourlyRate: 875,
    costs: { staffTime: 9450, tools: 1200, freelancers: 0, overhead: 2100 },
    revenue: 21000, invoicesPaid: 0, invoicesOutstanding: 21000,
    months: 5, ltv: 105000
  },
  {
    name: "Mira Health", color: "var(--blue)", avatar: "MH", tier: "Core", am: "Nomsa Dlamini",
    mrr: 21600, hoursAllocated: 40, hourlyRate: 875,
    costs: { staffTime: 10500, tools: 1200, freelancers: 4800, overhead: 2160 },
    revenue: 21600, invoicesPaid: 21600, invoicesOutstanding: 0,
    months: 4, ltv: 86400
  },
  {
    name: "Dune Collective", color: "var(--amber)", avatar: "DC", tier: "Core", am: "Renzo Fabbri",
    mrr: 16000, hoursAllocated: 44, hourlyRate: 875,
    costs: { staffTime: 11550, tools: 1200, freelancers: 18000, overhead: 1600 },
    revenue: 16000, invoicesPaid: 0, invoicesOutstanding: 16000,
    months: 4, ltv: 64000
  },
  {
    name: "Okafor & Sons", color: "var(--amber)", avatar: "OS", tier: "Core", am: "Tapiwa Moyo",
    mrr: 12000, hoursAllocated: 24, hourlyRate: 875,
    costs: { staffTime: 6300, tools: 800, freelancers: 0, overhead: 1200 },
    revenue: 12000, invoicesPaid: 12000, invoicesOutstanding: 0,
    months: 18, ltv: 216000
  }
] as const;

const tabs = ["profitability", "cost breakdown", "ltv analysis", "margin trends"] as const;
type Tab = (typeof tabs)[number];
type SortBy = "margin" | "profit" | "revenue";

function marginClass(margin: number): string {
  if (margin >= 50) return "colorAccent";
  if (margin >= 30) return "colorAmber";
  return "colorRed";
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

function ProfitBar({ revenue, totalCost }: { revenue: number; totalCost: number }) {
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
        <span className={styles.ppcCostText}>Cost R{(totalCost / 1000).toFixed(1)}k</span>
        <span className={cx(styles.ppcProfitText, colorClass(color))}>Profit R{(profit / 1000).toFixed(1)}k</span>
      </div>
    </div>
  );
}

export function ProfitabilityPerClientPage() {
  const [activeTab, setActiveTab] = useState<Tab>("profitability");
  const [sortBy, setSortBy] = useState<SortBy>("margin");

  const withCalc = useMemo(
    () =>
      clients.map((c) => {
        const totalCost = Object.values(c.costs).reduce<number>((s, v) => s + Number(v), 0);
        const profit = c.revenue - totalCost;
        const margin = Math.round((profit / c.revenue) * 100);
        return { ...c, totalCost, profit, margin };
      }),
    []
  );

  const sorted = useMemo(
    () =>
      [...withCalc].sort((a, b) =>
        sortBy === "margin" ? b.margin - a.margin : sortBy === "profit" ? b.profit - a.profit : b.revenue - a.revenue
      ),
    [sortBy, withCalc]
  );

  const totalRevenue = withCalc.reduce((s, c) => s + c.revenue, 0);
  const totalCost = withCalc.reduce((s, c) => s + c.totalCost, 0);
  const totalProfit = totalRevenue - totalCost;
  const avgMargin = Math.round((totalProfit / totalRevenue) * 100);

  return (
    <div className={cx(styles.pageBody, styles.ppcRoot)}>
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

      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Total MRR", value: `R${(totalRevenue / 1000).toFixed(0)}k`, color: "var(--accent)", sub: "Across all clients" },
          { label: "Total Costs", value: `R${(totalCost / 1000).toFixed(0)}k`, color: "var(--red)", sub: "Staff + tools + freelancers" },
          { label: "Net Profit", value: `R${(totalProfit / 1000).toFixed(0)}k`, color: "var(--accent)", sub: "Current month" },
          { label: "Avg Margin", value: `${avgMargin}%`, color: avgMargin >= 50 ? "var(--accent)" : "var(--amber)", sub: "Portfolio average" }
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, colorClass(s.color))}>{s.value}</div>
            <div className={cx("text11", "colorMuted")}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className={cx("overflowAuto", "minH0")}>
        <AdminFilterBar panelColor="var(--surface)" borderColor="var(--border)">
          <select title="Select tab" value={activeTab} onChange={(e) => setActiveTab(e.target.value as Tab)} className={styles.formInput}>
            {tabs.map((tab) => (
              <option key={tab} value={tab}>{tab}</option>
            ))}
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
            {sorted.map((c) => (
              <div key={c.name} className={cx(styles.ppcClientCard, c.margin < 30 && styles.ppcClientCardRisk)}>
                <div className={styles.ppcMainGrid}>
                  <div>
                    <div className={cx(styles.ppcClientName, colorClass(c.color))}>{c.name}</div>
                    <div className={cx("text11", "colorMuted")}>{c.tier} · {c.am}</div>
                  </div>
                  <ProfitBar revenue={c.revenue} totalCost={c.totalCost} />
                  <div className={styles.ppcNumCenter}>
                    <div className={styles.ppcMiniLabel}>Revenue</div>
                    <div className={styles.ppcRevVal}>R{(c.revenue / 1000).toFixed(0)}k</div>
                  </div>
                  <div className={styles.ppcNumCenter}>
                    <div className={styles.ppcMiniLabel}>Cost</div>
                    <div className={styles.ppcCostVal}>R{(c.totalCost / 1000).toFixed(1)}k</div>
                  </div>
                  <div className={styles.ppcNumCenter}>
                    <div className={styles.ppcMiniLabel}>Profit</div>
                    <div className={cx(styles.ppcProfitVal, c.profit >= 0 ? "colorAccent" : "colorRed")}>R{(c.profit / 1000).toFixed(1)}k</div>
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
                      <div className={cx(styles.ppcCostTileValue, colorClass(cost.color))}>R{(cost.value / 1000).toFixed(1)}k</div>
                      <div className={styles.ppcCostTileLabel}>{cost.label}</div>
                    </div>
                  ))}
                </div>

                {c.invoicesOutstanding > 0 && (
                  <div className={styles.ppcOutstandingRow}>R{(c.invoicesOutstanding / 1000).toFixed(0)}k outstanding - actual collected margin is lower</div>
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
                    <progress className={cx(styles.ppcBar100, toneFillClass(colors[i]))} max={100} value={(total / totalCost) * 100} aria-label={`${labels[key]} cost share`} />
                    <span className={cx(styles.ppcVal60, colorClass(colors[i]))}>R{(total / 1000).toFixed(1)}k</span>
                  </div>
                );
              })}
            </div>

            <div className={styles.ppcCard24}>
              <div className={styles.ppcSectionTitle}>Biggest Cost Drivers</div>
              {withCalc
                .slice()
                .sort((a, b) => b.totalCost - a.totalCost)
                .map((c) => (
                  <div key={c.name} className={styles.ppcMixRow}>
                    <div className={cx(styles.ppcDot8, dotClass(c.color))} />
                    <span className={cx(styles.ppcGrowName, colorClass(c.color))}>{c.name}</span>
                    <progress className={cx(styles.ppcBar100, toneFillClass(c.color))} max={100} value={(c.totalCost / (withCalc[0]?.totalCost || 1)) * 100} aria-label={`${c.name} cost relative share`} />
                    <span className={cx(styles.ppcVal60, colorClass(c.color))}>R{(c.totalCost / 1000).toFixed(1)}k</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {activeTab === "ltv analysis" && (
          <div className={styles.ppcLtvGrid}>
            {withCalc.map((c) => (
              <div key={c.name} className={cx(styles.ppcLtvCard, ltvCardClass(c.color))}>
                <div className={styles.ppcLtvHead}>
                  <div>
                    <div className={cx(styles.ppcLtvName, colorClass(c.color))}>{c.name}</div>
                    <div className={cx("text12", "colorMuted")}>{c.months} months as client</div>
                  </div>
                  <div className={styles.ppcLtvRight}>
                    <div className={cx(styles.ppcLtvValue, colorClass(c.color))}>R{(c.ltv / 1000).toFixed(0)}k</div>
                    <div className={styles.ppcLtvLabel}>Lifetime Value</div>
                  </div>
                </div>
                <div className={styles.ppcLtvMetrics}>
                  {[
                    { label: "Monthly MRR", value: `R${(c.mrr / 1000).toFixed(0)}k`, color: c.color },
                    { label: "Monthly Margin", value: `${c.margin}%`, color: c.margin >= 50 ? "var(--accent)" : c.margin >= 30 ? "var(--amber)" : "var(--red)" },
                    { label: "Net LTV", value: `R${((c.ltv * c.margin / 100) / 1000).toFixed(0)}k`, color: "var(--accent)" }
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
            <div className={styles.ppcSectionTitle}>Margin by Client - Current Month</div>
            <div className={styles.ppcTrendList}>
              {withCalc
                .slice()
                .sort((a, b) => b.margin - a.margin)
                .map((c) => (
                  <div key={c.name} className={styles.ppcTrendRow}>
                    <span className={cx(styles.ppcTrendName, colorClass(c.color))}>{c.name}</span>
                    <div className={styles.ppcTrendTrack}>
                      <progress className={cx(styles.ppcTrendFill, c.margin >= 50 ? styles.ppcFillAccent : c.margin >= 30 ? styles.ppcFillAmber : styles.ppcFillRed)} max={100} value={c.margin} aria-label={`${c.name} margin ${c.margin}%`} />
                      <span className={styles.ppcTrendFillText}>R{(c.profit / 1000).toFixed(1)}k profit</span>
                    </div>
                    <span className={cx(styles.ppcTrendPct, marginClass(c.margin))}>{c.margin}%</span>
                  </div>
                ))}
            </div>
            <div className={styles.ppcBlendBox}>
              <div className={styles.ppcBlendLabel}>Portfolio Blended Margin</div>
              <progress className={cx(styles.ppcBlendTrack, avgMargin >= 50 ? styles.ppcFillAccent : styles.ppcFillAmber)} max={100} value={avgMargin} aria-label={`Portfolio blended margin ${avgMargin}%`} />
              <div className={styles.ppcBlendFoot}>
                <span className={cx("text11", "colorMuted")}>0%</span>
                <span className={cx(styles.ppcBlendPct, avgMargin >= 50 ? "colorAccent" : "colorAmber")}>{avgMargin}%</span>
                <span className={cx("text11", "colorMuted")}>100%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

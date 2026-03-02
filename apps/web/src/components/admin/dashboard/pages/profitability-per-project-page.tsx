"use client";

import { useMemo, useState } from "react";
import { cx, styles } from "../style";
import { AdminFilterBar } from "./shared";
import { colorClass } from "./admin-page-utils";

type Project = {
  id: string;
  name: string;
  client: string;
  clientColor: string;
  type: "Retainer" | "Project";
  status: "active" | "at-risk";
  phase: string;
  budget: number;
  invoiced: number;
  collected: number;
  costs: {
    staffTime: number;
    freelancers: number;
    tools: number;
    overhead: number;
  };
  hoursSpent: number;
  hoursEstimated: number;
};

const projects: Project[] = [
  {
    id: "PRJ-001", name: "Brand Identity System", client: "Volta Studios", clientColor: "var(--accent)",
    type: "Retainer", status: "active", phase: "Execution",
    budget: 22000, invoiced: 22000, collected: 22000,
    costs: { staffTime: 8400, freelancers: 0, tools: 600, overhead: 2200 },
    hoursSpent: 96, hoursEstimated: 110
  },
  {
    id: "PRJ-002", name: "Q1 Campaign Strategy", client: "Kestrel Capital", clientColor: "var(--accent)",
    type: "Project", status: "active", phase: "Review",
    budget: 42000, invoiced: 42000, collected: 0,
    costs: { staffTime: 14700, freelancers: 0, tools: 800, overhead: 4200 },
    hoursSpent: 168, hoursEstimated: 150
  },
  {
    id: "PRJ-003", name: "Website Redesign", client: "Mira Health", clientColor: "var(--blue)",
    type: "Project", status: "active", phase: "Design",
    budget: 42000, invoiced: 21000, collected: 21000,
    costs: { staffTime: 10500, freelancers: 4800, tools: 1200, overhead: 4200 },
    hoursSpent: 120, hoursEstimated: 280
  },
  {
    id: "PRJ-004", name: "Editorial Design System", client: "Dune Collective", clientColor: "var(--amber)",
    type: "Retainer", status: "at-risk", phase: "Execution",
    budget: 48000, invoiced: 48000, collected: 0,
    costs: { staffTime: 15400, freelancers: 18000, tools: 900, overhead: 4800 },
    hoursSpent: 176, hoursEstimated: 160
  },
  {
    id: "PRJ-005", name: "Annual Report 2025", client: "Okafor & Sons", clientColor: "var(--amber)",
    type: "Project", status: "active", phase: "Final Review",
    budget: 12000, invoiced: 12000, collected: 12000,
    costs: { staffTime: 5040, freelancers: 0, tools: 300, overhead: 1200 },
    hoursSpent: 56, hoursEstimated: 60
  }
];

const tabs = ["project margins", "hours analysis", "collected vs invoiced", "cost breakdown"] as const;
type Tab = (typeof tabs)[number];
type SortBy = "margin" | "profit" | "budget";

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

export function ProfitabilityPerProjectPage() {
  const [activeTab, setActiveTab] = useState<Tab>("project margins");
  const [sortBy, setSortBy] = useState<SortBy>("margin");

  const withCalc = useMemo(
    () =>
      projects.map((p) => {
        const totalCost = Object.values(p.costs).reduce((s, v) => s + v, 0);
        const grossProfit = p.budget - totalCost;
        const margin = Math.round((grossProfit / p.budget) * 100);
        const collectionRate = Math.round((p.collected / Math.max(p.invoiced, 1)) * 100);
        const realizedProfit = p.collected - totalCost;
        const hoursVariance = p.hoursSpent - p.hoursEstimated;
        const effectiveRate = Math.round(p.budget / Math.max(p.hoursEstimated, 1));
        const actualRate = Math.round(p.collected / Math.max(p.hoursSpent, 1));
        return {
          ...p,
          totalCost,
          grossProfit,
          margin,
          collectionRate,
          realizedProfit,
          hoursVariance,
          effectiveRate,
          actualRate
        };
      }),
    []
  );

  const sorted = useMemo(
    () =>
      [...withCalc].sort((a, b) =>
        sortBy === "margin" ? b.margin - a.margin : sortBy === "profit" ? b.grossProfit - a.grossProfit : b.budget - a.budget
      ),
    [sortBy, withCalc]
  );

  const totalBudget = withCalc.reduce((s, p) => s + p.budget, 0);
  const totalCost = withCalc.reduce((s, p) => s + p.totalCost, 0);
  const totalProfit = totalBudget - totalCost;
  const totalCollected = withCalc.reduce((s, p) => s + p.collected, 0);
  const avgMargin = Math.round((totalProfit / Math.max(totalBudget, 1)) * 100);

  return (
    <div className={cx(styles.pageBody, styles.pppRoot)}>
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

      <div className={cx("topCardsStack", "gap16", "mb16")}>
        {[
          { label: "Total Project Revenue", value: `R${(totalBudget / 1000).toFixed(0)}k`, color: "var(--accent)", sub: "All active projects" },
          { label: "Total Project Cost", value: `R${(totalCost / 1000).toFixed(0)}k`, color: "var(--red)", sub: "Staff + freelancers + tools" },
          { label: "Avg Project Margin", value: `${avgMargin}%`, color: avgMargin >= 50 ? "var(--accent)" : "var(--amber)", sub: "Gross profit margin" },
          { label: "Cash Collected", value: `R${(totalCollected / 1000).toFixed(0)}k`, color: "var(--blue)", sub: `of R${(totalBudget / 1000).toFixed(0)}k invoiced` }
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
            {tabs.map((tab) => (
              <option key={tab} value={tab}>{tab}</option>
            ))}
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
                          <rect className={styles.pppCostBar} x="0" y="0" width={Math.min((p.totalCost / p.budget) * 100, 100)} height="8" />
                          <rect className={cx(styles.pppMarginBar, marginClass(marginColor))} x={Math.min((p.totalCost / p.budget) * 100, 100)} y="0" width={100 - Math.min((p.totalCost / p.budget) * 100, 100)} height="8" />
                        </svg>
                      </div>
                    </div>
                    <div className={styles.pppCenterCol}><div className={styles.pppMiniLabel}>Budget</div><div className={styles.pppValueAccent}>R{(p.budget / 1000).toFixed(0)}k</div></div>
                    <div className={styles.pppCenterCol}><div className={styles.pppMiniLabel}>Cost</div><div className={styles.pppValueRed}>R{(p.totalCost / 1000).toFixed(1)}k</div></div>
                    <div className={styles.pppCenterCol}><div className={styles.pppMiniLabel}>Profit</div><div className={cx(styles.pppValueStrong, p.grossProfit >= 0 ? "colorAccent" : "colorRed")}>R{(p.grossProfit / 1000).toFixed(1)}k</div></div>
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
                        <div className={cx(styles.pppCostValue, colorClass(c.color))}>R{(c.value / 1000).toFixed(1)}k</div>
                        <div className={styles.pppCostLabel}>{c.label}</div>
                      </div>
                    ))}
                  </div>

                  {p.collected === 0 ? (
                    <div className={styles.pppWarnRow}>
                      R{(p.invoiced / 1000).toFixed(0)}k invoiced - R0 collected. Realized margin is negative until paid.
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}

        {activeTab === "hours analysis" ? (
          <div className={styles.pppList14}>
            {withCalc.map((p) => {
              const variance = p.hoursVariance;
              const pct = Math.round((p.hoursSpent / Math.max(p.hoursEstimated, 1)) * 100);
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
                        <span className={styles.pppMiniLabel}>{p.hoursSpent}h spent of {p.hoursEstimated}h estimated</span>
                        <span className={cx(styles.pppMiniMono, colorClass(color))}>{pct}%</span>
                      </div>
                      <progress className={cx(styles.pppTrack8, toneFillClass(color))} max={100} value={Math.min(pct, 100)} aria-label={`${p.name} hours usage ${pct}%`} />
                    </div>
                    <div className={styles.pppCenterCol}><div className={styles.pppMiniLabel}>Variance</div><div className={cx(styles.pppValueStrong, variance <= 0 ? "colorAccent" : "colorRed")}>{variance > 0 ? "+" : ""}{variance}h</div></div>
                    <div className={styles.pppCenterCol}><div className={styles.pppMiniLabel}>Effective Rate</div><div className={styles.pppValueMonoBlue}>R{p.effectiveRate}/h</div></div>
                    <div className={styles.pppCenterCol}><div className={styles.pppMiniLabel}>Actual Rate</div><div className={cx(styles.pppValueMono, p.actualRate >= p.effectiveRate ? "colorAccent" : "colorRed")}>R{p.actualRate}/h</div></div>
                    {pct > 115 ? <span className={styles.pppOverHours}>Over-hours</span> : <span />}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {activeTab === "collected vs invoiced" ? (
          <div className={styles.pppList12}>
            {withCalc.map((p) => (
              <div key={p.id} className={styles.pppCollectCard}>
                <div className={styles.pppCollectGrid}>
                  <div>
                    <div className={styles.pppProjName}>{p.name}</div>
                    <div className={cx(styles.pppClientMeta, colorClass(p.clientColor))}>{p.client}</div>
                  </div>
                  <div>
                    <div className={styles.pppTopRow}>
                      <span className={styles.pppMiniLabel}>R{(p.collected / 1000).toFixed(0)}k collected of R{(p.invoiced / 1000).toFixed(0)}k invoiced</span>
                      <span className={cx(styles.pppMiniMono, p.collectionRate === 100 ? "colorAccent" : "colorRed")}>{p.collectionRate}%</span>
                    </div>
                    <progress className={cx(styles.pppTrack8, p.collectionRate === 100 ? styles.pppFillAccent : styles.pppFillAmber)} max={100} value={p.collectionRate} aria-label={`${p.name} collection rate ${p.collectionRate}%`} />
                  </div>
                  <div className={styles.pppCenterCol}><div className={styles.pppMiniLabel}>Outstanding</div><div className={cx(styles.pppValueStrong, p.invoiced - p.collected > 0 ? "colorRed" : "colorAccent")}>R{((p.invoiced - p.collected) / 1000).toFixed(0)}k</div></div>
                  <div className={styles.pppCenterCol}><div className={styles.pppMiniLabel}>Realized Profit</div><div className={cx(styles.pppValueStrong, p.realizedProfit >= 0 ? "colorAccent" : "colorRed")}>R{(p.realizedProfit / 1000).toFixed(1)}k</div></div>
                  {p.collectionRate < 100 ? <button type="button" className={styles.pppChaseBtn}>Chase</button> : <span />}
                </div>
              </div>
            ))}
            <div className={styles.pppPortfolioCard}>
              <div className={styles.pppPortfolioRow}>
                <span className={cx("fw700")}>Portfolio Total</span>
                <div className={styles.pppPortfolioStats}>
                  <div className={styles.pppPortfolioItem}><div className={styles.pppMiniLabel}>Invoiced</div><div className={styles.pppValueStrongAccent}>R{(totalBudget / 1000).toFixed(0)}k</div></div>
                  <div className={styles.pppPortfolioItem}><div className={styles.pppMiniLabel}>Collected</div><div className={styles.pppValueStrongBlue}>R{(totalCollected / 1000).toFixed(0)}k</div></div>
                  <div className={styles.pppPortfolioItem}><div className={styles.pppMiniLabel}>Outstanding</div><div className={styles.pppValueStrongRed}>R{((totalBudget - totalCollected) / 1000).toFixed(0)}k</div></div>
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
                    <progress className={cx(styles.pppLineTrack, toneFillClass(colors[i]))} max={100} value={(total / Math.max(totalCost, 1)) * 100} aria-label={`${labels[key]} share`} />
                    <span className={cx(styles.pppLineValue, colorClass(colors[i]))}>R{(total / 1000).toFixed(1)}k</span>
                  </div>
                );
              })}
            </div>
            <div className={cx("card", "p24")}>
              <div className={styles.sciSecTitle}>Most Costly Projects</div>
              {[...withCalc].sort((a, b) => b.totalCost - a.totalCost).map((p) => {
                const maxCost = Math.max(...withCalc.map((row) => row.totalCost), 1);
                return (
                  <div key={p.id} className={styles.pppCostLine}>
                    <div className={cx(styles.pppDot, dotClass(p.clientColor))} />
                    <span className={cx(styles.pppLineLabel, colorClass(p.clientColor))}>{p.name.length > 22 ? `${p.name.slice(0, 22)}...` : p.name}</span>
                    <progress className={cx(styles.pppLineTrack, toneFillClass(p.clientColor))} max={100} value={(p.totalCost / maxCost) * 100} aria-label={`${p.name} cost relative ${Math.round((p.totalCost / maxCost) * 100)}%`} />
                    <span className={cx(styles.pppLineValue, colorClass(p.clientColor))}>R{(p.totalCost / 1000).toFixed(1)}k</span>
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

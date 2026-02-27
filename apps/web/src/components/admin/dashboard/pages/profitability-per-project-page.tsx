"use client";

import { useMemo, useState } from "react";
import { AdminFilterBar, AdminTabs } from "./shared";

const C = {
  bg: "#050508",
  surface: "#0d0d14",
  border: "#1a1a2e",
  primary: "#a78bfa",
  blue: "#60a5fa",
  amber: "#f5c518",
  red: "#ff4444",
  orange: "#ff8c00",
  muted: "#a0a0b0",
  text: "#e8e8f0"
} as const;

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
    id: "PRJ-001", name: "Brand Identity System", client: "Volta Studios", clientColor: C.primary,
    type: "Retainer", status: "active", phase: "Execution",
    budget: 22000, invoiced: 22000, collected: 22000,
    costs: { staffTime: 8400, freelancers: 0, tools: 600, overhead: 2200 },
    hoursSpent: 96, hoursEstimated: 110
  },
  {
    id: "PRJ-002", name: "Q1 Campaign Strategy", client: "Kestrel Capital", clientColor: C.primary,
    type: "Project", status: "active", phase: "Review",
    budget: 42000, invoiced: 42000, collected: 0,
    costs: { staffTime: 14700, freelancers: 0, tools: 800, overhead: 4200 },
    hoursSpent: 168, hoursEstimated: 150
  },
  {
    id: "PRJ-003", name: "Website Redesign", client: "Mira Health", clientColor: C.blue,
    type: "Project", status: "active", phase: "Design",
    budget: 42000, invoiced: 21000, collected: 21000,
    costs: { staffTime: 10500, freelancers: 4800, tools: 1200, overhead: 4200 },
    hoursSpent: 120, hoursEstimated: 280
  },
  {
    id: "PRJ-004", name: "Editorial Design System", client: "Dune Collective", clientColor: C.amber,
    type: "Retainer", status: "at-risk", phase: "Execution",
    budget: 48000, invoiced: 48000, collected: 0,
    costs: { staffTime: 15400, freelancers: 18000, tools: 900, overhead: 4800 },
    hoursSpent: 176, hoursEstimated: 160
  },
  {
    id: "PRJ-005", name: "Annual Report 2025", client: "Okafor & Sons", clientColor: C.orange,
    type: "Project", status: "active", phase: "Final Review",
    budget: 12000, invoiced: 12000, collected: 12000,
    costs: { staffTime: 5040, freelancers: 0, tools: 300, overhead: 1200 },
    hoursSpent: 56, hoursEstimated: 60
  }
];

const tabs = ["project margins", "hours analysis", "collected vs invoiced", "cost breakdown"] as const;
type Tab = (typeof tabs)[number];
type SortBy = "margin" | "profit" | "budget";

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
    <div
      style={{
        background: C.bg,
        height: "100%",
        fontFamily: "Syne, sans-serif",
        color: C.text,
        padding: 0,
        overflow: "hidden",
        display: "grid",
        gridTemplateRows: "auto auto auto 1fr",
        minHeight: 0
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 11, color: C.primary, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>ADMIN / FINANCIAL</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Profitability per Project</h1>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Budget vs cost, hours variance, collection rate, and true margin</div>
        </div>
        <button style={{ background: C.primary, color: C.bg, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Mono, monospace", border: "none" }}>
          Export Report
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
        {[
          { label: "Total Project Revenue", value: `R${(totalBudget / 1000).toFixed(0)}k`, color: C.primary, sub: "All active projects" },
          { label: "Total Project Cost", value: `R${(totalCost / 1000).toFixed(0)}k`, color: C.red, sub: "Staff + freelancers + tools" },
          { label: "Avg Project Margin", value: `${avgMargin}%`, color: avgMargin >= 50 ? C.primary : C.amber, sub: "Gross profit margin" },
          { label: "Cash Collected", value: `R${(totalCollected / 1000).toFixed(0)}k`, color: C.blue, sub: `of R${(totalBudget / 1000).toFixed(0)}k invoiced` }
        ].map((s) => (
          <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: "DM Mono, monospace", marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <AdminTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        primaryColor={C.primary}
        mutedColor={C.muted}
        panelColor={C.surface}
        borderColor={C.border}
      />

      <div style={{ overflow: "auto", minHeight: 0 }}>
        {activeTab === "project margins" ? (
          <AdminFilterBar panelColor={C.surface} borderColor={C.border}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "DM Mono, monospace" }}>Sort</div>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12 }}>
              <option value="margin">Margin</option>
              <option value="profit">Profit</option>
              <option value="budget">Budget</option>
            </select>
          </AdminFilterBar>
        ) : null}

        {activeTab === "project margins" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {sorted.map((p) => {
              const marginColor = p.margin >= 55 ? C.primary : p.margin >= 35 ? C.amber : C.red;
              return (
                <div key={p.id} style={{ background: C.surface, border: `1px solid ${p.margin < 30 ? C.red + "44" : C.border}`, padding: 24 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 90px 90px 90px 90px 80px", alignItems: "center", gap: 16, marginBottom: 16 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: p.clientColor }}>{p.client} · {p.type}</div>
                    </div>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 10, color: C.muted }}>Cost vs Budget</span>
                        <span style={{ fontSize: 10, fontFamily: "DM Mono, monospace", color: marginColor }}>{p.margin}% margin</span>
                      </div>
                      <div style={{ height: 8, background: C.border, overflow: "hidden", display: "flex" }}>
                        <div style={{ width: `${Math.min((p.totalCost / p.budget) * 100, 100)}%`, background: C.red, opacity: 0.7 }} />
                        <div style={{ flex: 1, background: marginColor }} />
                      </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: C.muted, marginBottom: 3 }}>Budget</div>
                      <div style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: C.primary }}>R{(p.budget / 1000).toFixed(0)}k</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: C.muted, marginBottom: 3 }}>Cost</div>
                      <div style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: C.red }}>R{(p.totalCost / 1000).toFixed(1)}k</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: C.muted, marginBottom: 3 }}>Profit</div>
                      <div style={{ fontFamily: "DM Mono, monospace", fontSize: 12, fontWeight: 700, color: p.grossProfit >= 0 ? C.primary : C.red }}>R{(p.grossProfit / 1000).toFixed(1)}k</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: C.muted, marginBottom: 3 }}>Collected</div>
                      <div style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: p.collectionRate === 100 ? C.primary : C.amber }}>{p.collectionRate}%</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: C.muted, marginBottom: 3 }}>Margin</div>
                      <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, fontSize: 20, color: marginColor }}>{p.margin}%</div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                    {[
                      { label: "Staff Time", value: p.costs.staffTime, color: C.primary },
                      { label: "Freelancers", value: p.costs.freelancers, color: C.amber },
                      { label: "Tools", value: p.costs.tools, color: C.blue },
                      { label: "Overhead", value: p.costs.overhead, color: C.muted }
                    ].map((c) => (
                      <div key={c.label} style={{ padding: 8, background: C.bg, textAlign: "center" }}>
                        <div style={{ fontFamily: "DM Mono, monospace", color: c.color, fontWeight: 700, fontSize: 13 }}>R{(c.value / 1000).toFixed(1)}k</div>
                        <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{c.label}</div>
                      </div>
                    ))}
                  </div>

                  {p.collected === 0 ? (
                    <div style={{ marginTop: 10, padding: 8, background: "#1a0a0a", borderLeft: `3px solid ${C.red}`, fontSize: 11, color: C.red }}>
                      R{(p.invoiced / 1000).toFixed(0)}k invoiced - R0 collected. Realized margin is negative until paid.
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}

        {activeTab === "hours analysis" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {withCalc.map((p) => {
              const variance = p.hoursVariance;
              const pct = Math.round((p.hoursSpent / Math.max(p.hoursEstimated, 1)) * 100);
              const color = pct <= 100 ? C.primary : pct <= 115 ? C.amber : C.red;
              return (
                <div key={p.id} style={{ background: C.surface, border: `1px solid ${pct > 115 ? C.red + "44" : C.border}`, padding: 20 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 120px 120px 100px 80px", alignItems: "center", gap: 16 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: p.clientColor }}>{p.client}</div>
                    </div>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 10, color: C.muted }}>{p.hoursSpent}h spent of {p.hoursEstimated}h estimated</span>
                        <span style={{ fontSize: 10, fontFamily: "DM Mono, monospace", color }}>{pct}%</span>
                      </div>
                      <div style={{ height: 8, background: C.border, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: color }} />
                      </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: C.muted, marginBottom: 3 }}>Variance</div>
                      <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: variance <= 0 ? C.primary : C.red }}>{variance > 0 ? "+" : ""}{variance}h</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: C.muted, marginBottom: 3 }}>Effective Rate</div>
                      <div style={{ fontFamily: "DM Mono, monospace", color: C.blue }}>R{p.effectiveRate}/h</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: C.muted, marginBottom: 3 }}>Actual Rate</div>
                      <div style={{ fontFamily: "DM Mono, monospace", color: p.actualRate >= p.effectiveRate ? C.primary : C.red }}>R{p.actualRate}/h</div>
                    </div>
                    {pct > 115 ? <span style={{ fontSize: 9, color: C.red, background: `${C.red}15`, padding: "3px 8px" }}>Over-hours</span> : <span />}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {activeTab === "collected vs invoiced" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {withCalc.map((p) => (
              <div key={p.id} style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 120px 120px 80px", alignItems: "center", gap: 16 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: p.clientColor }}>{p.client}</div>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 10, color: C.muted }}>R{(p.collected / 1000).toFixed(0)}k collected of R{(p.invoiced / 1000).toFixed(0)}k invoiced</span>
                      <span style={{ fontSize: 10, fontFamily: "DM Mono, monospace", color: p.collectionRate === 100 ? C.primary : C.red }}>{p.collectionRate}%</span>
                    </div>
                    <div style={{ height: 8, background: C.border, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${p.collectionRate}%`, background: p.collectionRate === 100 ? C.primary : C.amber }} />
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: C.muted, marginBottom: 3 }}>Outstanding</div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: p.invoiced - p.collected > 0 ? C.red : C.primary }}>
                      R{((p.invoiced - p.collected) / 1000).toFixed(0)}k
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: C.muted, marginBottom: 3 }}>Realized Profit</div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: p.realizedProfit >= 0 ? C.primary : C.red }}>
                      R{(p.realizedProfit / 1000).toFixed(1)}k
                    </div>
                  </div>
                  {p.collectionRate < 100 ? <button style={{ background: C.amber, color: C.bg, border: "none", padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Chase</button> : <span />}
                </div>
              </div>
            ))}
            <div style={{ padding: 20, background: C.surface, border: `1px solid ${C.primary}22` }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 700 }}>Portfolio Total</span>
                <div style={{ display: "flex", gap: 40 }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, color: C.muted }}>Invoiced</div>
                    <div style={{ fontFamily: "DM Mono, monospace", color: C.primary, fontWeight: 700 }}>R{(totalBudget / 1000).toFixed(0)}k</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, color: C.muted }}>Collected</div>
                    <div style={{ fontFamily: "DM Mono, monospace", color: C.blue, fontWeight: 700 }}>R{(totalCollected / 1000).toFixed(0)}k</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, color: C.muted }}>Outstanding</div>
                    <div style={{ fontFamily: "DM Mono, monospace", color: C.red, fontWeight: 700 }}>R{((totalBudget - totalCollected) / 1000).toFixed(0)}k</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "cost breakdown" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Cost Type vs Total</div>
              {(["staffTime", "freelancers", "tools", "overhead"] as const).map((key, i) => {
                const total = withCalc.reduce((s, p) => s + p.costs[key], 0);
                const labels = { staffTime: "Staff Time", freelancers: "Freelancers", tools: "Tools", overhead: "Overhead" } as const;
                const colors = [C.primary, C.amber, C.blue, C.muted] as const;
                return (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 10, height: 10, background: colors[i], flexShrink: 0 }} />
                    <span style={{ fontSize: 12, flex: 1 }}>{labels[key]}</span>
                    <div style={{ width: 100, height: 8, background: C.border }}>
                      <div style={{ height: "100%", width: `${(total / Math.max(totalCost, 1)) * 100}%`, background: colors[i] }} />
                    </div>
                    <span style={{ fontFamily: "DM Mono, monospace", color: colors[i], fontWeight: 700, width: 60, textAlign: "right" }}>R{(total / 1000).toFixed(1)}k</span>
                  </div>
                );
              })}
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Most Costly Projects</div>
              {[...withCalc].sort((a, b) => b.totalCost - a.totalCost).map((p) => {
                const maxCost = Math.max(...withCalc.map((row) => row.totalCost), 1);
                return (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 8, height: 8, background: p.clientColor, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, flex: 1, color: p.clientColor }}>{p.name.length > 22 ? `${p.name.slice(0, 22)}...` : p.name}</span>
                    <div style={{ width: 100, height: 8, background: C.border }}>
                      <div style={{ height: "100%", width: `${(p.totalCost / maxCost) * 100}%`, background: p.clientColor }} />
                    </div>
                    <span style={{ fontFamily: "DM Mono, monospace", color: p.clientColor, fontWeight: 700, width: 60, textAlign: "right" }}>R{(p.totalCost / 1000).toFixed(1)}k</span>
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

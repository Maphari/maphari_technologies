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

const clients = [
  {
    name: "Volta Studios", color: C.primary, avatar: "VS", tier: "Growth", am: "Nomsa Dlamini",
    mrr: 28000, hoursAllocated: 48, hourlyRate: 875,
    costs: { staffTime: 12600, tools: 1800, freelancers: 0, overhead: 2800 },
    revenue: 28000, invoicesPaid: 28000, invoicesOutstanding: 0,
    months: 14, ltv: 392000
  },
  {
    name: "Kestrel Capital", color: C.primary, avatar: "KC", tier: "Core", am: "Nomsa Dlamini",
    mrr: 21000, hoursAllocated: 36, hourlyRate: 875,
    costs: { staffTime: 9450, tools: 1200, freelancers: 0, overhead: 2100 },
    revenue: 21000, invoicesPaid: 0, invoicesOutstanding: 21000,
    months: 5, ltv: 105000
  },
  {
    name: "Mira Health", color: C.blue, avatar: "MH", tier: "Core", am: "Nomsa Dlamini",
    mrr: 21600, hoursAllocated: 40, hourlyRate: 875,
    costs: { staffTime: 10500, tools: 1200, freelancers: 4800, overhead: 2160 },
    revenue: 21600, invoicesPaid: 21600, invoicesOutstanding: 0,
    months: 4, ltv: 86400
  },
  {
    name: "Dune Collective", color: C.amber, avatar: "DC", tier: "Core", am: "Renzo Fabbri",
    mrr: 16000, hoursAllocated: 44, hourlyRate: 875,
    costs: { staffTime: 11550, tools: 1200, freelancers: 18000, overhead: 1600 },
    revenue: 16000, invoicesPaid: 0, invoicesOutstanding: 16000,
    months: 4, ltv: 64000
  },
  {
    name: "Okafor & Sons", color: C.orange, avatar: "OS", tier: "Core", am: "Tapiwa Moyo",
    mrr: 12000, hoursAllocated: 24, hourlyRate: 875,
    costs: { staffTime: 6300, tools: 800, freelancers: 0, overhead: 1200 },
    revenue: 12000, invoicesPaid: 12000, invoicesOutstanding: 0,
    months: 18, ltv: 216000
  }
] as const;

const tabs = ["profitability", "cost breakdown", "ltv analysis", "margin trends"] as const;
type Tab = (typeof tabs)[number];
type SortBy = "margin" | "profit" | "revenue";

function ProfitBar({ revenue, totalCost }: { revenue: number; totalCost: number }) {
  const profit = revenue - totalCost;
  const margin = Math.round((profit / revenue) * 100);
  const costPct = Math.min((totalCost / revenue) * 100, 100);
  const color = margin >= 50 ? C.primary : margin >= 30 ? C.amber : C.red;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: C.muted }}>Cost vs Revenue</span>
        <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color, fontSize: 13 }}>{margin}% margin</span>
      </div>
      <div style={{ height: 10, background: C.border, overflow: "hidden", display: "flex" }}>
        <div style={{ width: `${costPct}%`, background: C.red, opacity: 0.7 }} />
        <div style={{ flex: 1, background: color }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontSize: 10, color: C.red }}>Cost R{(totalCost / 1000).toFixed(1)}k</span>
        <span style={{ fontSize: 10, color }}>Profit R{(profit / 1000).toFixed(1)}k</span>
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
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Profitability per Client</h1>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>True margin after staff time, tools, freelancers and overhead</div>
        </div>
        <button style={{ background: C.primary, color: C.bg, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Mono, monospace", border: "none" }}>Export Report</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
        {[
          { label: "Total MRR", value: `R${(totalRevenue / 1000).toFixed(0)}k`, color: C.primary, sub: "Across all clients" },
          { label: "Total Costs", value: `R${(totalCost / 1000).toFixed(0)}k`, color: C.red, sub: "Staff + tools + freelancers" },
          { label: "Net Profit", value: `R${(totalProfit / 1000).toFixed(0)}k`, color: C.primary, sub: "Current month" },
          { label: "Avg Margin", value: `${avgMargin}%`, color: avgMargin >= 50 ? C.primary : C.amber, sub: "Portfolio average" }
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
        {activeTab === "profitability" ? (
          <AdminFilterBar panelColor={C.surface} borderColor={C.border}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "DM Mono, monospace" }}>Sort</div>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12 }}>
              <option value="margin">Margin</option>
              <option value="profit">Profit</option>
              <option value="revenue">Revenue</option>
            </select>
          </AdminFilterBar>
        ) : null}

        {activeTab === "profitability" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {sorted.map((c) => (
              <div key={c.name} style={{ background: C.surface, border: `1px solid ${c.margin < 30 ? C.red + "44" : C.border}`, padding: 24 }}>
                <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 100px 100px 100px 100px", alignItems: "center", gap: 20, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: c.color }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{c.tier} · {c.am}</div>
                  </div>
                  <ProfitBar revenue={c.revenue} totalCost={c.totalCost} />
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Revenue</div>
                    <div style={{ fontFamily: "DM Mono, monospace", color: C.primary, fontWeight: 700 }}>R{(c.revenue / 1000).toFixed(0)}k</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Cost</div>
                    <div style={{ fontFamily: "DM Mono, monospace", color: C.red }}>R{(c.totalCost / 1000).toFixed(1)}k</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Profit</div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: c.profit >= 0 ? C.primary : C.red }}>R{(c.profit / 1000).toFixed(1)}k</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Margin</div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, fontSize: 20, color: c.margin >= 50 ? C.primary : c.margin >= 30 ? C.amber : C.red }}>{c.margin}%</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                  {[
                    { label: "Staff Time", value: c.costs.staffTime, color: C.primary },
                    { label: "Tools", value: c.costs.tools, color: C.blue },
                    { label: "Freelancers", value: c.costs.freelancers, color: C.amber },
                    { label: "Overhead", value: c.costs.overhead, color: C.muted }
                  ].map((cost) => (
                    <div key={cost.label} style={{ padding: 10, background: C.bg, textAlign: "center" }}>
                      <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: cost.color }}>R{(cost.value / 1000).toFixed(1)}k</div>
                      <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{cost.label}</div>
                    </div>
                  ))}
                </div>
                {c.invoicesOutstanding > 0 && (
                  <div style={{ marginTop: 12, padding: 10, background: "#1a0a0a", borderLeft: `3px solid ${C.red}`, fontSize: 11, color: C.red }}>
                    R{(c.invoicesOutstanding / 1000).toFixed(0)}k outstanding - actual collected margin is lower
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === "cost breakdown" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Portfolio Cost Mix</div>
              {(["staffTime", "tools", "freelancers", "overhead"] as const).map((key, i) => {
                const total = withCalc.reduce((s, c) => s + c.costs[key], 0);
                const labels = { staffTime: "Staff Time", tools: "Tools & Software", freelancers: "Freelancers", overhead: "Overhead" };
                const colors = [C.primary, C.blue, C.amber, C.muted];
                return (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 10, height: 10, background: colors[i], flexShrink: 0 }} />
                    <span style={{ fontSize: 12, flex: 1 }}>{labels[key]}</span>
                    <div style={{ width: 100, height: 8, background: C.border }}>
                      <div style={{ height: "100%", width: `${(total / totalCost) * 100}%`, background: colors[i] }} />
                    </div>
                    <span style={{ fontFamily: "DM Mono, monospace", color: colors[i], fontWeight: 700, width: 60, textAlign: "right" }}>R{(total / 1000).toFixed(1)}k</span>
                  </div>
                );
              })}
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Biggest Cost Drivers</div>
              {withCalc
                .slice()
                .sort((a, b) => b.totalCost - a.totalCost)
                .map((c) => (
                  <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 8, height: 8, background: c.color }} />
                    <span style={{ fontSize: 12, flex: 1, color: c.color }}>{c.name}</span>
                    <div style={{ width: 100, height: 8, background: C.border }}>
                      <div style={{ height: "100%", width: `${(c.totalCost / (withCalc[0]?.totalCost || 1)) * 100}%`, background: c.color }} />
                    </div>
                    <span style={{ fontFamily: "DM Mono, monospace", color: c.color, fontWeight: 700, width: 60, textAlign: "right" }}>R{(c.totalCost / 1000).toFixed(1)}k</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {activeTab === "ltv analysis" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {withCalc.map((c) => (
              <div key={c.name} style={{ background: C.surface, border: `1px solid ${c.color}33`, padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: c.color }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>{c.months} months as client</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, fontSize: 26, color: c.color }}>R{(c.ltv / 1000).toFixed(0)}k</div>
                    <div style={{ fontSize: 10, color: C.muted }}>Lifetime Value</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {[
                    { label: "Monthly MRR", value: `R${(c.mrr / 1000).toFixed(0)}k`, color: c.color },
                    { label: "Monthly Margin", value: `${c.margin}%`, color: c.margin >= 50 ? C.primary : c.margin >= 30 ? C.amber : C.red },
                    { label: "Net LTV", value: `R${((c.ltv * c.margin / 100) / 1000).toFixed(0)}k`, color: C.primary }
                  ].map((m) => (
                    <div key={m.label} style={{ padding: 10, background: C.bg, textAlign: "center" }}>
                      <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: m.color, fontSize: 16 }}>{m.value}</div>
                      <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "margin trends" && (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Margin by Client - Current Month</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {withCalc
                .slice()
                .sort((a, b) => b.margin - a.margin)
                .map((c) => (
                  <div key={c.name} style={{ display: "grid", gridTemplateColumns: "180px 1fr 60px", alignItems: "center", gap: 16 }}>
                    <span style={{ fontWeight: 600, color: c.color }}>{c.name}</span>
                    <div style={{ height: 20, background: C.border, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${c.margin}%`, background: c.margin >= 50 ? C.primary : c.margin >= 30 ? C.amber : C.red, display: "flex", alignItems: "center", paddingLeft: 8 }}>
                        <span style={{ fontSize: 10, color: C.bg, fontWeight: 700 }}>R{(c.profit / 1000).toFixed(1)}k profit</span>
                      </div>
                    </div>
                    <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, color: c.margin >= 50 ? C.primary : c.margin >= 30 ? C.amber : C.red, textAlign: "right" }}>{c.margin}%</span>
                  </div>
                ))}
            </div>
            <div style={{ marginTop: 24, padding: 16, background: C.bg }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>Portfolio Blended Margin</div>
              <div style={{ height: 16, background: C.border, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${avgMargin}%`, background: avgMargin >= 50 ? C.primary : C.amber }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ fontSize: 11, color: C.muted }}>0%</span>
                <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, color: avgMargin >= 50 ? C.primary : C.amber }}>{avgMargin}%</span>
                <span style={{ fontSize: 11, color: C.muted }}>100%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

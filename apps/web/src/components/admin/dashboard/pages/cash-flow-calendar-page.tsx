"use client";

import { useMemo, useState } from "react";
import { AdminTabs } from "./shared";

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

const cashEvents = [
  { id: "CF-001", type: "inflow", category: "Retainer", client: "Volta Studios", clientColor: C.primary, amount: 28000, date: "2026-02-28", status: "expected", description: "Feb retainer - Volta Studios" },
  { id: "CF-002", type: "inflow", category: "Retainer", client: "Mira Health", clientColor: C.blue, amount: 21600, date: "2026-02-28", status: "expected", description: "Feb retainer - Mira Health" },
  { id: "CF-003", type: "inflow", category: "Retainer", client: "Okafor & Sons", clientColor: C.orange, amount: 12000, date: "2026-02-25", status: "received", description: "Feb retainer - Okafor" },
  { id: "CF-004", type: "inflow", category: "Invoice", client: "Kestrel Capital", clientColor: C.primary, amount: 21000, date: "2026-02-28", status: "overdue", description: "INV-0039 - overdue", overdueDays: 12 },
  { id: "CF-005", type: "inflow", category: "Invoice", client: "Dune Collective", clientColor: C.amber, amount: 16000, date: "2026-03-01", status: "expected", description: "INV-0040 - project milestone" },
  { id: "CF-006", type: "inflow", category: "Retainer", client: "Volta Studios", clientColor: C.primary, amount: 28000, date: "2026-03-31", status: "forecast", description: "Mar retainer - Volta Studios" },
  { id: "CF-007", type: "inflow", category: "Retainer", client: "Mira Health", clientColor: C.blue, amount: 21600, date: "2026-03-31", status: "forecast", description: "Mar retainer - Mira Health" },
  { id: "CF-008", type: "inflow", category: "Retainer", client: "Okafor & Sons", clientColor: C.orange, amount: 12000, date: "2026-03-25", status: "forecast", description: "Mar retainer - Okafor" },
  { id: "CF-009", type: "inflow", category: "Retainer", client: "Kestrel Capital", clientColor: C.primary, amount: 21000, date: "2026-03-31", status: "forecast", description: "Mar retainer - Kestrel" },
  { id: "CF-010", type: "inflow", category: "Retainer", client: "Dune Collective", clientColor: C.amber, amount: 16000, date: "2026-03-31", status: "forecast", description: "Mar retainer - Dune" },
  { id: "CF-011", type: "outflow", category: "Payroll", client: null, clientColor: C.muted, amount: -142000, date: "2026-02-25", status: "scheduled", description: "Feb payroll - all staff" },
  { id: "CF-012", type: "outflow", category: "Tools", client: null, clientColor: C.muted, amount: -5500, date: "2026-02-28", status: "scheduled", description: "Monthly SaaS subscriptions" },
  { id: "CF-013", type: "outflow", category: "Freelancer", client: null, clientColor: C.muted, amount: -18000, date: "2026-03-01", status: "scheduled", description: "Studio Outpost - Dune scope" },
  { id: "CF-014", type: "outflow", category: "Payroll", client: null, clientColor: C.muted, amount: -142000, date: "2026-03-25", status: "forecast", description: "Mar payroll - all staff" },
  { id: "CF-015", type: "outflow", category: "Tools", client: null, clientColor: C.muted, amount: -5500, date: "2026-03-31", status: "forecast", description: "Mar SaaS subscriptions" },
  { id: "CF-016", type: "outflow", category: "Rent", client: null, clientColor: C.muted, amount: -22000, date: "2026-03-01", status: "scheduled", description: "Studio rent - Q1 quarter" }
] as const;

const statusConfig = {
  received: { color: C.primary, label: "Received" },
  expected: { color: C.blue, label: "Expected" },
  overdue: { color: C.red, label: "Overdue" },
  forecast: { color: C.muted, label: "Forecast" },
  scheduled: { color: C.amber, label: "Scheduled" }
} as const;

const tabs = ["90-day view", "calendar", "scenario planner"] as const;
type Tab = (typeof tabs)[number];

export function CashFlowCalendarPage() {
  const [activeTab, setActiveTab] = useState<Tab>("90-day view");

  const inflows = cashEvents.filter((e) => e.type === "inflow");
  const outflows = cashEvents.filter((e) => e.type === "outflow");
  const totalExpected = inflows.reduce((s, e) => s + e.amount, 0);
  const totalOut = Math.abs(outflows.reduce((s, e) => s + e.amount, 0));
  const overdue = cashEvents.filter((e) => e.status === "overdue").reduce((s, e) => s + e.amount, 0);

  const months = ["Feb 2026", "Mar 2026", "Apr 2026"] as const;
  const monthData = useMemo(
    () =>
      months.map((m) => {
        const [mon, yr] = m.split(" ");
        const monNum = ({ Feb: "02", Mar: "03", Apr: "04" } as const)[mon as "Feb" | "Mar" | "Apr"];
        const prefix = `${yr}-${monNum}`;
        const monInflows = cashEvents.filter((e) => e.date.startsWith(prefix) && e.type === "inflow");
        const monOutflows = cashEvents.filter((e) => e.date.startsWith(prefix) && e.type === "outflow");
        const totalIn = monInflows.reduce((s, e) => s + e.amount, 0);
        const monthOut = Math.abs(monOutflows.reduce((s, e) => s + e.amount, 0));
        return { month: m, totalIn, totalOut: monthOut, net: totalIn - monthOut };
      }),
    []
  );

  const openingBalance = 285000;

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
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Cash Flow Calendar</h1>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Expected inflows, outflows, and 90-day projection</div>
        </div>
        <button style={{ background: C.primary, color: C.bg, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Mono, monospace", border: "none" }}>Export Forecast</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
        {[
          { label: "Opening Balance", value: `R${(openingBalance / 1000).toFixed(0)}k`, color: C.blue, sub: "As at Feb 23" },
          { label: "Expected Inflows (90d)", value: `R${(totalExpected / 1000).toFixed(0)}k`, color: C.primary, sub: "Retainers and invoices" },
          { label: "Planned Outflows (90d)", value: `R${(totalOut / 1000).toFixed(0)}k`, color: C.red, sub: "Payroll, tools, rent" },
          { label: "Overdue Receivables", value: `R${(overdue / 1000).toFixed(0)}k`, color: C.red, sub: "Needs immediate chase" }
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
        {activeTab === "90-day view" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
              {monthData.map((m, i) => {
                const runningBal = openingBalance + monthData.slice(0, i + 1).reduce((s, md) => s + md.net, 0);
                return (
                  <div key={m.month} style={{ background: C.surface, border: `1px solid ${m.net >= 0 ? C.primary + "33" : C.red + "44"}`, padding: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: C.primary }}>{m.month}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Inflows</div>
                        <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: C.primary, fontSize: 18 }}>+R{(m.totalIn / 1000).toFixed(0)}k</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Outflows</div>
                        <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: C.red, fontSize: 18 }}>-R{(m.totalOut / 1000).toFixed(0)}k</div>
                      </div>
                      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
                        <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Net Cash</div>
                        <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, color: m.net >= 0 ? C.primary : C.red, fontSize: 20 }}>{m.net >= 0 ? "+" : ""}R{(m.net / 1000).toFixed(0)}k</div>
                      </div>
                      <div style={{ padding: 10, background: C.bg }}>
                        <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Closing Balance</div>
                        <div style={{ fontFamily: "DM Mono, monospace", color: C.blue, fontWeight: 700 }}>R{(runningBal / 1000).toFixed(0)}k</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em", color: C.primary }}>Expected Inflows</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {inflows.map((e) => (
                    <div key={e.id} style={{ background: C.surface, border: `1px solid ${e.status === "overdue" ? C.red + "55" : C.primary + "22"}`, padding: 14, display: "grid", gridTemplateColumns: "80px 1fr 90px 80px", alignItems: "center", gap: 12 }}>
                      <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: C.muted }}>{e.date.slice(5)}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{e.description}</div>
                        {"overdueDays" in e && e.overdueDays ? <div style={{ fontSize: 10, color: C.red }}>{e.overdueDays}d overdue</div> : null}
                      </div>
                      <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: C.primary }}>+R{(e.amount / 1000).toFixed(0)}k</span>
                      <span style={{ fontSize: 9, color: statusConfig[e.status].color, background: `${statusConfig[e.status].color}15`, padding: "2px 6px", textAlign: "center" }}>{statusConfig[e.status].label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em", color: C.red }}>Planned Outflows</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {outflows.map((e) => (
                    <div key={e.id} style={{ background: C.surface, border: `1px solid ${C.red}22`, padding: 14, display: "grid", gridTemplateColumns: "80px 1fr 90px 80px", alignItems: "center", gap: 12 }}>
                      <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: C.muted }}>{e.date.slice(5)}</span>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{e.description}</div>
                      <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: C.red }}>-R{(Math.abs(e.amount) / 1000).toFixed(0)}k</span>
                      <span style={{ fontSize: 9, color: statusConfig[e.status].color, background: `${statusConfig[e.status].color}15`, padding: "2px 6px", textAlign: "center" }}>{statusConfig[e.status].label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "calendar" && (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>February 2026 - Daily View</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} style={{ padding: "6px 0", textAlign: "center", fontSize: 10, color: C.muted, fontWeight: 700 }}>{d}</div>
              ))}
              {Array(6).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: 28 }, (_, i) => {
                const day = i + 1;
                const dateStr = `2026-02-${String(day).padStart(2, "0")}`;
                const dayEvents = cashEvents.filter((e) => e.date === dateStr);
                const hasInflow = dayEvents.some((e) => e.type === "inflow");
                const hasOutflow = dayEvents.some((e) => e.type === "outflow");
                const hasOverdue = dayEvents.some((e) => e.status === "overdue");
                const isToday = day === 23;
                return (
                  <div key={day} style={{ minHeight: 64, padding: 6, background: isToday ? `${C.primary}15` : C.bg, border: `1px solid ${isToday ? C.primary + "44" : C.border}` }}>
                    <div style={{ fontSize: 11, fontFamily: "DM Mono, monospace", color: isToday ? C.primary : C.muted, marginBottom: 4 }}>{day}</div>
                    {hasOverdue ? <div style={{ fontSize: 8, color: C.red, background: `${C.red}20`, padding: "1px 4px", marginBottom: 2 }}>OVERDUE</div> : null}
                    {hasInflow && !hasOverdue ? <div style={{ fontSize: 8, color: C.primary, background: `${C.primary}15`, padding: "1px 4px", marginBottom: 2 }}>IN</div> : null}
                    {hasOutflow ? <div style={{ fontSize: 8, color: C.red, background: `${C.red}10`, padding: "1px 4px" }}>OUT</div> : null}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "scenario planner" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {[
              { label: "Best Case", desc: "All invoices paid on time plus one new client", inflow: totalExpected + 28000, color: C.primary },
              { label: "Base Case", desc: "Invoices paid, overdue resolved by Mar", inflow: totalExpected, color: C.blue },
              { label: "Worst Case", desc: "Kestrel and Dune don't pay this month", inflow: totalExpected - 37000, color: C.amber },
              { label: "Crisis Case", desc: "Both clients churn and no new revenue", inflow: totalExpected - 72000, color: C.red }
            ].map((scenario) => {
              const net = scenario.inflow - totalOut;
              const closing = openingBalance + net;
              return (
                <div key={scenario.label} style={{ background: C.surface, border: `1px solid ${scenario.color}33`, padding: 24 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: scenario.color, marginBottom: 4 }}>{scenario.label}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>{scenario.desc}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      { label: "Inflows", value: `R${(scenario.inflow / 1000).toFixed(0)}k`, color: C.primary },
                      { label: "Outflows", value: `-R${(totalOut / 1000).toFixed(0)}k`, color: C.red },
                      { label: "Net", value: `${net >= 0 ? "+" : ""}R${(net / 1000).toFixed(0)}k`, color: net >= 0 ? C.primary : C.red },
                      { label: "Closing Balance", value: `R${(closing / 1000).toFixed(0)}k`, color: scenario.color }
                    ].map((r) => (
                      <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                        <span style={{ color: C.muted }}>{r.label}</span>
                        <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: r.color }}>{r.value}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 12, padding: 10, background: C.bg }}>
                    <div style={{ fontSize: 10, color: C.muted }}>Months of runway at closing balance</div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, color: scenario.color, fontSize: 22, marginTop: 2 }}>{Math.max(0, (closing / (totalOut / 3))).toFixed(1)}mo</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

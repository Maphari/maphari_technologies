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

const expenses = [
  { id: "EXP-094", date: "Feb 22", category: "Client Entertainment", subcategory: "Meals", description: "Client lunch - Volta Studios brand review", amount: 1240, submittedBy: "Nomsa Dlamini", status: "approved", receipt: true, billable: true, client: "Volta Studios", clientColor: C.primary },
  { id: "EXP-093", date: "Feb 21", category: "Travel", subcategory: "Uber", description: "Client site visit - Mira Health offices", amount: 340, submittedBy: "Kira Bosman", status: "pending", receipt: true, billable: true, client: "Mira Health", clientColor: C.blue },
  { id: "EXP-092", date: "Feb 20", category: "Software", subcategory: "Plugin", description: "Motion Bro plugin - annual licence", amount: 890, submittedBy: "Renzo Fabbri", status: "approved", receipt: true, billable: false, client: null, clientColor: C.muted },
  { id: "EXP-091", date: "Feb 18", category: "Office Supplies", subcategory: "Stationery", description: "Pantone colour guides - Q1 refresh", amount: 2100, submittedBy: "Renzo Fabbri", status: "approved", receipt: true, billable: false, client: null, clientColor: C.muted },
  { id: "EXP-090", date: "Feb 17", category: "Travel", subcategory: "Flights", description: "Cape Town trip - Dune Collective in-person", amount: 5800, submittedBy: "Renzo Fabbri", status: "approved", receipt: false, billable: true, client: "Dune Collective", clientColor: C.amber },
  { id: "EXP-089", date: "Feb 15", category: "Training", subcategory: "Course", description: "Figma Advanced course - Kira Bosman", amount: 1800, submittedBy: "Kira Bosman", status: "approved", receipt: true, billable: false, client: null, clientColor: C.muted },
  { id: "EXP-088", date: "Feb 14", category: "Client Entertainment", subcategory: "Gifts", description: "Valentine's gift basket - top 3 clients", amount: 3600, submittedBy: "Nomsa Dlamini", status: "approved", receipt: true, billable: false, client: null, clientColor: C.muted },
  { id: "EXP-087", date: "Feb 10", category: "Software", subcategory: "Subscription", description: "Miro Teams - monthly (flagged for review)", amount: 200, submittedBy: "Leilani Fotu", status: "flagged", receipt: true, billable: false, client: null, clientColor: C.muted },
  { id: "EXP-086", date: "Feb 8", category: "Marketing", subcategory: "Print", description: "Maphari brand brochures - 200 copies", amount: 4200, submittedBy: "Sipho Nkosi", status: "approved", receipt: true, billable: false, client: null, clientColor: C.muted }
] as const;

const budgets = [
  { category: "Client Entertainment", budget: 8000, spent: 4840, color: C.primary },
  { category: "Travel", budget: 12000, spent: 6140, color: C.blue },
  { category: "Software", budget: 6000, spent: 1090, color: C.primary },
  { category: "Office Supplies", budget: 3000, spent: 2100, color: C.amber },
  { category: "Training", budget: 5000, spent: 1800, color: C.orange },
  { category: "Marketing", budget: 10000, spent: 4200, color: C.red }
] as const;

const statusConfig = {
  approved: { color: C.primary, label: "Approved" },
  pending: { color: C.amber, label: "Pending" },
  flagged: { color: C.red, label: "Flagged" },
  rejected: { color: C.red, label: "Rejected" }
} as const;

const tabs = ["expense log", "budgets", "by category", "tax summary"] as const;
type Tab = (typeof tabs)[number];

export function ExpenseTrackerPage() {
  const [activeTab, setActiveTab] = useState<Tab>("expense log");
  const [filterStatus, setFilterStatus] = useState<"All" | "approved" | "pending" | "flagged">("All");

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const pending = expenses.filter((e) => e.status === "pending" || e.status === "flagged");
  const billable = expenses.filter((e) => e.billable).reduce((s, e) => s + e.amount, 0);
  const missingReceipts = expenses.filter((e) => !e.receipt).length;

  const filtered = useMemo(
    () => (filterStatus === "All" ? expenses : expenses.filter((e) => e.status === filterStatus)),
    [filterStatus]
  );

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
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Expense Tracker</h1>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Ad hoc expenses, receipts, budget tracking, and SARS categorisation</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, padding: "8px 16px", fontSize: 12, cursor: "pointer", fontFamily: "DM Mono, monospace" }}>Export CSV</button>
          <button style={{ background: C.primary, color: C.bg, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Mono, monospace", border: "none" }}>+ Log Expense</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
        {[
          { label: "Total Expenses (Feb)", value: `R${(totalSpent / 1000).toFixed(1)}k`, color: C.amber, sub: `${expenses.length} items` },
          { label: "Pending Approval", value: pending.length.toString(), color: pending.length > 0 ? C.red : C.primary, sub: "Require review" },
          { label: "Billable to Clients", value: `R${(billable / 1000).toFixed(1)}k`, color: C.blue, sub: "To be recovered" },
          { label: "Missing Receipts", value: missingReceipts.toString(), color: missingReceipts > 0 ? C.red : C.primary, sub: "SARS non-compliant" }
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
        {activeTab === "expense log" ? (
          <AdminFilterBar panelColor={C.surface} borderColor={C.border}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "DM Mono, monospace" }}>Filters</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12 }}>
                <option value="All">Status: All</option>
                <option value="approved">Status: Approved</option>
                <option value="pending">Status: Pending</option>
                <option value="flagged">Status: Flagged</option>
              </select>
              {filterStatus !== "All" ? (
                <button onClick={() => setFilterStatus("All")} style={{ background: C.border, border: "none", color: C.text, padding: "8px 10px", fontSize: 11, cursor: "pointer", fontFamily: "DM Mono, monospace" }}>Clear</button>
              ) : null}
            </div>
          </AdminFilterBar>
        ) : null}

        {activeTab === "expense log" && (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "70px 80px 1fr 140px 100px 90px 70px 70px 80px auto", padding: "10px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", gap: 12 }}>
              {["ID", "Date", "Description", "Submitted By", "Category", "Amount", "Receipt", "Billable", "Status", ""].map((h) => <span key={h}>{h}</span>)}
            </div>
            {filtered.map((e, i) => {
              const sc = statusConfig[e.status];
              return (
                <div key={e.id} style={{ display: "grid", gridTemplateColumns: "70px 80px 1fr 140px 100px 90px 70px 70px 80px auto", padding: "13px 20px", borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center", gap: 12, background: e.status === "flagged" ? "#1a0a0a" : "transparent" }}>
                  <span style={{ fontFamily: "DM Mono, monospace", fontSize: 10, color: C.muted }}>{e.id}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: C.muted }}>{e.date}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{e.description}</div>
                    {e.billable && e.client ? <div style={{ fontSize: 10, color: e.clientColor }}>Billable: {e.client}</div> : null}
                  </div>
                  <span style={{ fontSize: 12 }}>{e.submittedBy.split(" ")[0]}</span>
                  <div>
                    <div style={{ fontSize: 11, color: C.text }}>{e.category}</div>
                    <div style={{ fontSize: 9, color: C.muted }}>{e.subcategory}</div>
                  </div>
                  <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: C.amber }}>R{e.amount.toLocaleString()}</span>
                  <span style={{ textAlign: "center", fontSize: 14, color: e.receipt ? C.primary : C.red }}>{e.receipt ? "✓" : "✗"}</span>
                  <span style={{ textAlign: "center", fontSize: 14, color: e.billable ? C.blue : C.muted }}>{e.billable ? "✓" : "-"}</span>
                  <span style={{ fontSize: 9, color: sc.color, background: `${sc.color}15`, padding: "2px 6px" }}>{sc.label}</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    {e.status === "pending" ? <button style={{ background: C.primary, color: C.bg, border: "none", padding: "4px 8px", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Approve</button> : null}
                    <button style={{ background: C.border, border: "none", color: C.text, padding: "4px 8px", fontSize: 10, cursor: "pointer" }}>Edit</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "budgets" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {budgets.map((b) => {
              const pct = Math.round((b.spent / b.budget) * 100);
              const remaining = b.budget - b.spent;
              const color = pct >= 90 ? C.red : pct >= 70 ? C.amber : b.color;
              return (
                <div key={b.category} style={{ background: C.surface, border: `1px solid ${pct >= 90 ? C.red + "44" : C.border}`, padding: 20 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 110px 110px 90px", alignItems: "center", gap: 20 }}>
                    <div style={{ fontWeight: 600 }}>{b.category}</div>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: C.muted }}>R{(b.spent / 1000).toFixed(1)}k of R{(b.budget / 1000).toFixed(0)}k</span>
                        <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color }}>{pct}%</span>
                      </div>
                      <div style={{ height: 8, background: C.border }}>
                        <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: color }} />
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 10, color: C.muted }}>Spent</div>
                      <div style={{ fontFamily: "DM Mono, monospace", color: C.amber, fontWeight: 700 }}>R{(b.spent / 1000).toFixed(1)}k</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 10, color: C.muted }}>Remaining</div>
                      <div style={{ fontFamily: "DM Mono, monospace", color: remaining >= 0 ? C.primary : C.red, fontWeight: 700 }}>R{(remaining / 1000).toFixed(1)}k</div>
                    </div>
                    {pct >= 90 ? <span style={{ fontSize: 10, color: C.red, background: `${C.red}15`, padding: "4px 8px" }}>Near limit</span> : <span />}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "by category" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Spend by Category</div>
              {budgets.map((b) => (
                <div key={b.category} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 10, height: 10, background: b.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, flex: 1 }}>{b.category}</span>
                  <div style={{ width: 100, height: 8, background: C.border }}>
                    <div style={{ height: "100%", width: `${(b.spent / totalSpent) * 100}%`, background: b.color }} />
                  </div>
                  <span style={{ fontFamily: "DM Mono, monospace", color: b.color, fontWeight: 700, width: 60, textAlign: "right" }}>R{(b.spent / 1000).toFixed(1)}k</span>
                </div>
              ))}
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>By Submitter</div>
              {["Sipho Nkosi", "Nomsa Dlamini", "Renzo Fabbri", "Kira Bosman", "Leilani Fotu"].map((name) => {
                const spent = expenses.filter((e) => e.submittedBy === name).reduce((s, e) => s + e.amount, 0);
                if (!spent) return null;
                return (
                  <div key={name} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                    <span style={{ fontSize: 12, flex: 1 }}>{name.split(" ")[0]}</span>
                    <div style={{ width: 100, height: 8, background: C.border }}>
                      <div style={{ height: "100%", width: `${(spent / totalSpent) * 100}%`, background: C.primary }} />
                    </div>
                    <span style={{ fontFamily: "DM Mono, monospace", color: C.primary, fontWeight: 700, width: 60, textAlign: "right" }}>R{(spent / 1000).toFixed(1)}k</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "tax summary" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>SARS-Ready Summary (FY2026)</div>
              {[
                { label: "Total deductible expenses", value: `R${(totalSpent / 1000).toFixed(1)}k`, color: C.primary },
                { label: "VAT on expenses (15%)", value: `R${((totalSpent * 0.15) / 1000).toFixed(1)}k`, color: C.blue },
                { label: "Input VAT claimable", value: `R${((totalSpent * 0.15 * (expenses.filter((e) => e.receipt).length / expenses.length)) / 1000).toFixed(1)}k`, color: C.primary },
                { label: "Missing receipts (at risk)", value: `${missingReceipts} items`, color: C.red }
              ].map((r) => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                  <span style={{ color: C.muted }}>{r.label}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: r.color }}>{r.value}</span>
                </div>
              ))}
              <button style={{ marginTop: 20, background: C.primary, color: C.bg, border: "none", padding: "10px 20px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Export for Accountant</button>
            </div>
            <div style={{ background: "#1a0a0a", border: `1px solid ${C.red}33`, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: C.red, textTransform: "uppercase" }}>Missing Receipts</div>
              {expenses.filter((e) => !e.receipt).map((e) => (
                <div key={e.id} style={{ padding: 12, background: C.bg, marginBottom: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{e.description}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{e.submittedBy} · {e.date} · <span style={{ color: C.amber }}>R{e.amount.toLocaleString()}</span></div>
                  <button style={{ marginTop: 8, background: C.amber, color: C.bg, border: "none", padding: "4px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Upload Receipt</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

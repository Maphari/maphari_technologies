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

type CloseoutTask = {
  task: string;
  done: boolean;
  doneDate?: string | null;
  note?: string | null;
};

type CloseoutSection = {
  category: string;
  color: string;
  tasks: CloseoutTask[];
};

const fyChecklist: CloseoutSection[] = [
  {
    category: "Revenue & Invoicing",
    color: C.primary,
    tasks: [
      { task: "All invoices issued for FY2025", done: true, doneDate: "Jan 15", note: null },
      { task: "Outstanding invoices chased and resolved", done: false, note: "INV-0039 (Kestrel) still outstanding" },
      { task: "Final retainer invoices reconciled", done: true, doneDate: "Jan 20", note: null },
      { task: "Credit notes issued where applicable", done: true, doneDate: "Jan 15", note: null },
      { task: "Revenue recognised correctly (accrual basis)", done: false, note: "Awaiting accountant sign-off" }
    ]
  },
  {
    category: "Expenses & Payroll",
    color: C.amber,
    tasks: [
      { task: "All staff payroll processed for Feb", done: false, note: "Scheduled Feb 25", doneDate: null },
      { task: "All supplier invoices captured", done: true, doneDate: "Feb 10", note: null },
      { task: "All expense claims approved and captured", done: false, note: "2 pending claims", doneDate: null },
      { task: "Freelancer payments settled", done: true, doneDate: "Feb 18", note: null },
      { task: "Annual bonus payments captured", done: true, doneDate: "Jan 31", note: null }
    ]
  },
  {
    category: "Tax & SARS",
    color: C.red,
    tasks: [
      { task: "PAYE submissions up to date (EMP201)", done: true, doneDate: "Feb 7", note: null },
      { task: "UIF contributions up to date", done: true, doneDate: "Feb 7", note: null },
      { task: "VAT returns submitted (VAT201)", done: true, doneDate: "Jan 25", note: null },
      { task: "Provisional tax (IRP6) submitted", done: false, note: "Due Aug 2026 - not yet", doneDate: null },
      { task: "PAYE reconciliation (EMP501) ready", done: false, note: "Due May 2026", doneDate: null }
    ]
  },
  {
    category: "Financial Statements",
    color: C.blue,
    tasks: [
      { task: "Trial balance reviewed", done: false, note: "Scheduled with accountant Mar 10", doneDate: null },
      { task: "P&L statement prepared", done: false, note: null, doneDate: null },
      { task: "Balance sheet prepared", done: false, note: null, doneDate: null },
      { task: "Cash flow statement prepared", done: false, note: null, doneDate: null },
      { task: "Management accounts signed off", done: false, note: null, doneDate: null }
    ]
  },
  {
    category: "Year-End Admin",
    color: C.primary,
    tasks: [
      { task: "All contracts filed and archived", done: true, doneDate: "Feb 1", note: null },
      { task: "Staff IRP5 certificates issued", done: false, note: "Due May 2026", doneDate: null },
      { task: "Asset register updated", done: true, doneDate: "Jan 28", note: null },
      { task: "Bank reconciliation completed", done: false, note: "In progress", doneDate: null },
      { task: "Accountant briefed for annual audit", done: false, note: null, doneDate: null }
    ]
  }
];

const fy2025Summary = {
  totalRevenue: 4260000,
  totalCosts: 2380000,
  grossProfit: 1880000,
  grossMargin: 44,
  staffCosts: 1540000,
  overheadCosts: 420000,
  freelancerCosts: 218000,
  toolsCosts: 202000,
  netProfit: 1340000,
  netMargin: 31,
  totalInvoiced: 4260000,
  totalCollected: 4187000,
  outstandingAtYearEnd: 73000,
  newClientsWon: 4,
  clientsLost: 1,
  mrrAtYearEnd: 380600,
  mrrAtYearStart: 244000,
  mrrGrowth: 56
} as const;

const tabs = ["fy checklist", "fy2025 summary", "p&l snapshot", "key learnings"] as const;
type Tab = (typeof tabs)[number];

export function FinancialYearCloseoutPage() {
  const [activeTab, setActiveTab] = useState<Tab>("fy checklist");

  const { doneTasks, totalTasks, pct, blocking } = useMemo(() => {
    const allTasks = fyChecklist.flatMap((c) => c.tasks);
    const done = allTasks.filter((t) => t.done).length;
    return {
      doneTasks: done,
      totalTasks: allTasks.length,
      pct: Math.round((done / allTasks.length) * 100),
      blocking: allTasks.filter((t) => !t.done && t.note).length
    };
  }, []);

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
        gridTemplateRows: "auto auto auto auto 1fr",
        minHeight: 0
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 11, color: C.primary, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>ADMIN / FINANCIAL</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Financial Year Closeout</h1>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>FY2025 closeout checklist, year-end summary, and SARS compliance</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, padding: "8px 16px", fontSize: 12, cursor: "pointer", fontFamily: "DM Mono, monospace" }}>Share with Accountant</button>
          <button style={{ background: C.primary, color: C.bg, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Mono, monospace", border: "none" }}>Export FY Pack</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
        {[
          { label: "Closeout Progress", value: `${pct}%`, color: pct >= 80 ? C.primary : C.amber, sub: `${doneTasks}/${totalTasks} tasks done` },
          { label: "Blocking Items", value: blocking.toString(), color: blocking > 0 ? C.red : C.primary, sub: "Notes or issues flagged" },
          { label: "FY End Date", value: "28 Feb 2026", color: C.blue, sub: "South African FY" },
          { label: "Accountant Review", value: "10 Mar 2026", color: C.primary, sub: "Scheduled" }
        ].map((s) => (
          <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: "DM Mono, monospace", marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontWeight: 700 }}>FY2025 Closeout - Overall Progress</span>
          <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, color: pct >= 80 ? C.primary : C.amber }}>{pct}%</span>
        </div>
        <div style={{ height: 16, background: C.border, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: pct >= 80 ? C.primary : C.amber, transition: "width 0.8s" }} />
        </div>
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
        {activeTab === "fy checklist" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {fyChecklist.map((section) => {
              const done = section.tasks.filter((t) => t.done).length;
              const total = section.tasks.length;
              const sectionPct = Math.round((done / total) * 100);
              return (
                <div key={section.category} style={{ background: C.surface, border: `1px solid ${section.color}33`, padding: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, color: section.color, textTransform: "uppercase", fontSize: 12, letterSpacing: "0.06em" }}>{section.category}</div>
                    <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: sectionPct === 100 ? C.primary : C.amber }}>{done}/{total}</span>
                  </div>
                  <div style={{ height: 4, background: C.border, marginBottom: 16 }}>
                    <div style={{ height: "100%", width: `${sectionPct}%`, background: sectionPct === 100 ? C.primary : section.color }} />
                  </div>
                  {section.tasks.map((task, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                      <div style={{ width: 16, height: 16, border: `2px solid ${task.done ? C.primary : C.border}`, background: task.done ? C.primary : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                        {task.done ? <span style={{ fontSize: 9, color: C.bg, fontWeight: 800 }}>✓</span> : null}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: task.done ? C.muted : C.text, textDecoration: task.done ? "line-through" : "none" }}>{task.task}</div>
                        {task.doneDate ? <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>Done {task.doneDate}</div> : null}
                        {task.note ? <div style={{ fontSize: 10, color: task.done ? C.muted : C.amber, marginTop: 2 }}>{task.note}</div> : null}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ) : null}

        {activeTab === "fy2025 summary" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>FY2025 Key Financials</div>
              {[
                { label: "Total Revenue", value: `R${(fy2025Summary.totalRevenue / 1000000).toFixed(2)}m`, color: C.primary, big: true },
                { label: "Total Costs", value: `R${(fy2025Summary.totalCosts / 1000000).toFixed(2)}m`, color: C.red, big: false },
                { label: "Gross Profit", value: `R${(fy2025Summary.grossProfit / 1000000).toFixed(2)}m`, color: C.primary, big: false },
                { label: "Gross Margin", value: `${fy2025Summary.grossMargin}%`, color: C.primary, big: false },
                { label: "Net Profit", value: `R${(fy2025Summary.netProfit / 1000000).toFixed(2)}m`, color: C.primary, big: true },
                { label: "Net Margin", value: `${fy2025Summary.netMargin}%`, color: C.primary, big: false }
              ].map((r) => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: C.muted }}>{r.label}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", fontWeight: r.big ? 800 : 600, color: r.color, fontSize: r.big ? 18 : 14 }}>{r.value}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Business Growth</div>
                {[
                  { label: "MRR at year-start", value: `R${(fy2025Summary.mrrAtYearStart / 1000).toFixed(0)}k`, color: C.muted },
                  { label: "MRR at year-end", value: `R${(fy2025Summary.mrrAtYearEnd / 1000).toFixed(0)}k`, color: C.primary },
                  { label: "MRR growth", value: `+${fy2025Summary.mrrGrowth}%`, color: C.primary },
                  { label: "New clients won", value: fy2025Summary.newClientsWon.toString(), color: C.blue },
                  { label: "Clients lost (churn)", value: fy2025Summary.clientsLost.toString(), color: C.red }
                ].map((r) => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
                    <span style={{ color: C.muted }}>{r.label}</span>
                    <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: r.color }}>{r.value}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: "#0a101d", border: `1px solid ${C.primary}22`, padding: 24 }}>
                <div style={{ fontFamily: "DM Mono, monospace", fontSize: 36, fontWeight: 800, color: C.primary }}>R{(fy2025Summary.netProfit / 1000000).toFixed(2)}m</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Net profit · FY2025 · {fy2025Summary.netMargin}% margin</div>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "p&l snapshot" ? (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 32, maxWidth: 680 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: C.primary }}>MAPHARI CREATIVE STUDIO</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 24 }}>Profit & Loss - Financial Year March 2025 to February 2026</div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Revenue</div>
              {[
                { label: "Retainer revenue", value: 3142000 },
                { label: "Project revenue", value: 1118000 }
              ].map((r) => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}22`, fontSize: 13 }}>
                  <span style={{ color: C.muted, paddingLeft: 16 }}>{r.label}</span>
                  <span style={{ fontFamily: "DM Mono, monospace" }}>R{r.value.toLocaleString()}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: 14, fontWeight: 700 }}>
                <span>Total Revenue</span>
                <span style={{ fontFamily: "DM Mono, monospace", color: C.primary }}>R{fy2025Summary.totalRevenue.toLocaleString()}</span>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Cost of Sales</div>
              {[
                { label: "Staff salaries & PAYE", value: fy2025Summary.staffCosts },
                { label: "Freelancer costs", value: fy2025Summary.freelancerCosts },
                { label: "Tools & software", value: fy2025Summary.toolsCosts }
              ].map((r) => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}22`, fontSize: 13 }}>
                  <span style={{ color: C.muted, paddingLeft: 16 }}>{r.label}</span>
                  <span style={{ fontFamily: "DM Mono, monospace" }}>({r.value.toLocaleString()})</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: `2px solid ${C.border}`, borderBottom: `2px solid ${C.border}`, fontSize: 14, fontWeight: 700, marginBottom: 20 }}>
              <span>Gross Profit</span>
              <span style={{ fontFamily: "DM Mono, monospace", color: C.primary }}>
                R{fy2025Summary.grossProfit.toLocaleString()} ({fy2025Summary.grossMargin}%)
              </span>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Operating Expenses</div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}22`, fontSize: 13 }}>
                <span style={{ color: C.muted, paddingLeft: 16 }}>Rent & facilities</span>
                <span style={{ fontFamily: "DM Mono, monospace" }}>(264000)</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}22`, fontSize: 13 }}>
                <span style={{ color: C.muted, paddingLeft: 16 }}>Marketing & BD</span>
                <span style={{ fontFamily: "DM Mono, monospace" }}>(156000)</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 0", borderTop: `3px solid ${C.primary}`, fontSize: 16, fontWeight: 800 }}>
              <span>Net Profit Before Tax</span>
              <span style={{ fontFamily: "DM Mono, monospace", color: C.primary }}>
                R{fy2025Summary.netProfit.toLocaleString()} ({fy2025Summary.netMargin}%)
              </span>
            </div>
          </div>
        ) : null}

        {activeTab === "key learnings" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { title: "Freelancer costs need tighter controls", detail: "Dune Collective ran 25% over budget due to uncontrolled freelancer scope. Add approval gates for any spend over R5k.", type: "cost", color: C.red },
              { title: "Invoice payment terms need enforcement", detail: "Three clients exceeded 30-day terms. Auto-escalate at 14 days. Late payments left R73k outstanding at year-end.", type: "cashflow", color: C.amber },
              { title: "MRR growth is healthy", detail: "MRR grew 56% from R244k to R381k. Retainer model drove predictability. Prioritise retainer conversion in BD.", type: "growth", color: C.primary },
              { title: "Staff cost ratio is trending up", detail: "Staff costs as % of revenue rose from 31% to 36%. Tie hiring to new client MRR instead of workload only.", type: "cost", color: C.amber },
              { title: "Tool sprawl increased spend", detail: "Eight tools were added in FY2025. Run a consolidation review before locking FY2026 budgets.", type: "efficiency", color: C.blue }
            ].map((l, i) => (
              <div key={i} style={{ background: C.surface, border: `1px solid ${l.color}33`, padding: 24, display: "grid", gridTemplateColumns: "4px 1fr", gap: 20 }}>
                <div style={{ background: l.color, width: 4, alignSelf: "stretch" }} />
                <div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 10, color: l.color, background: `${l.color}15`, padding: "2px 8px", fontFamily: "DM Mono, monospace", textTransform: "uppercase" }}>{l.type}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{l.title}</div>
                  <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}>{l.detail}</div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

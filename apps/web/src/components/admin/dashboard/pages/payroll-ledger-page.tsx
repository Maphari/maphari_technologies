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

type StaffMember = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  grossSalary: number;
  taxRate: number;
  uifRate: number;
  startDate: string;
  contractType: string;
  bankLast4: string;
};

const staff: StaffMember[] = [
  { id: "EMP-001", name: "Sipho Nkosi", role: "Founder & CEO", avatar: "SN", color: C.primary, grossSalary: 60000, taxRate: 0.36, uifRate: 0.01, startDate: "Jan 2020", contractType: "Permanent", bankLast4: "7823" },
  { id: "EMP-002", name: "Leilani Fotu", role: "Head of Operations", avatar: "LF", color: C.blue, grossSalary: 44000, taxRate: 0.3, uifRate: 0.01, startDate: "Mar 2022", contractType: "Permanent", bankLast4: "4412" },
  { id: "EMP-003", name: "Renzo Fabbri", role: "Creative Director", avatar: "RF", color: C.orange, grossSalary: 52000, taxRate: 0.33, uifRate: 0.01, startDate: "Jun 2021", contractType: "Permanent", bankLast4: "9934" },
  { id: "EMP-004", name: "Nomsa Dlamini", role: "Account Manager", avatar: "ND", color: C.primary, grossSalary: 38000, taxRate: 0.27, uifRate: 0.01, startDate: "Feb 2023", contractType: "Permanent", bankLast4: "2281" },
  { id: "EMP-005", name: "Kira Bosman", role: "UX Designer", avatar: "KB", color: C.amber, grossSalary: 33500, taxRate: 0.25, uifRate: 0.01, startDate: "Aug 2023", contractType: "Permanent", bankLast4: "6670" },
  { id: "EMP-006", name: "Tapiwa Moyo", role: "Copywriter", avatar: "TM", color: C.blue, grossSalary: 28000, taxRate: 0.22, uifRate: 0.01, startDate: "Jan 2024", contractType: "Permanent", bankLast4: "3345" }
];

const tabs = ["feb payroll", "payroll history", "payslips", "compliance"] as const;
type Tab = (typeof tabs)[number];

function calcPayslip(member: StaffMember) {
  const paye = Math.round(member.grossSalary * member.taxRate);
  const uif = Math.round(member.grossSalary * member.uifRate);
  const totalDeductions = paye + uif;
  const netPay = member.grossSalary - totalDeductions;
  return { paye, uif, totalDeductions, netPay };
}

function Avatar({ initials, color, size = 36 }: { initials: string; color: string; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `${color}22`,
        border: `2px solid ${color}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.32,
        fontWeight: 700,
        color,
        fontFamily: "DM Mono, monospace",
        flexShrink: 0
      }}
    >
      {initials}
    </div>
  );
}

export function PayrollLedgerPage() {
  const [activeTab, setActiveTab] = useState<Tab>("feb payroll");
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  const totals = useMemo(() => {
    const totalGross = staff.reduce((s, m) => s + m.grossSalary, 0);
    const totalNet = staff.reduce((s, m) => s + calcPayslip(m).netPay, 0);
    const totalPAYE = staff.reduce((s, m) => s + calcPayslip(m).paye, 0);
    const totalUIF = staff.reduce((s, m) => s + calcPayslip(m).uif, 0);
    return { totalGross, totalNet, totalPAYE, totalUIF };
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
        gridTemplateRows: "auto auto auto 1fr",
        minHeight: 0
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 11, color: C.primary, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>ADMIN / FINANCIAL</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Payroll Ledger</h1>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Monthly payroll, payslips, PAYE, UIF, and SARS compliance</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, padding: "8px 16px", fontSize: 12, cursor: "pointer", fontFamily: "DM Mono, monospace" }}>Export EMP201</button>
          <button style={{ background: C.primary, color: C.bg, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Mono, monospace", border: "none" }}>Run Payroll</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
        {[
          { label: "Total Gross Payroll", value: `R${(totals.totalGross / 1000).toFixed(0)}k`, color: C.amber, sub: "Feb 2026" },
          { label: "Total Net Pay", value: `R${(totals.totalNet / 1000).toFixed(0)}k`, color: C.primary, sub: "After deductions" },
          { label: "PAYE to SARS", value: `R${(totals.totalPAYE / 1000).toFixed(1)}k`, color: C.red, sub: "Due 7 Mar" },
          { label: "UIF Contributions", value: `R${(totals.totalUIF / 1000).toFixed(1)}k`, color: C.blue, sub: "Employee + employer" }
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
        {activeTab === "feb payroll" ? (
          <div style={{ display: "grid", gridTemplateColumns: selectedStaff ? "1fr 320px" : "1fr", gap: 20 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 100px 80px 80px 100px 80px", padding: "12px 24px", borderBottom: `1px solid ${C.border}`, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", gap: 16 }}>
                {["Employee", "Role", "Gross", "PAYE", "UIF", "Net Pay", ""].map((h) => <span key={h}>{h}</span>)}
              </div>
              {staff.map((member, i) => {
                const { paye, uif, netPay } = calcPayslip(member);
                const isSel = selectedStaff?.id === member.id;
                return (
                  <div key={member.id} onClick={() => setSelectedStaff(isSel ? null : member)} style={{ display: "grid", gridTemplateColumns: "200px 1fr 100px 80px 80px 100px 80px", padding: "16px 24px", borderBottom: i < staff.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center", gap: 16, cursor: "pointer", background: isSel ? `${C.primary}08` : "transparent" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <Avatar initials={member.avatar} color={member.color} size={28} />
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{member.name}</span>
                    </div>
                    <span style={{ fontSize: 12, color: C.muted }}>{member.role}</span>
                    <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: C.amber }}>R{member.grossSalary.toLocaleString()}</span>
                    <span style={{ fontFamily: "DM Mono, monospace", color: C.red }}>R{paye.toLocaleString()}</span>
                    <span style={{ fontFamily: "DM Mono, monospace", color: C.blue }}>R{uif.toLocaleString()}</span>
                    <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: C.primary }}>R{netPay.toLocaleString()}</span>
                    <button style={{ background: C.border, border: "none", color: C.text, padding: "4px 10px", fontSize: 10, cursor: "pointer" }}>Payslip</button>
                  </div>
                );
              })}
              <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 100px 80px 80px 100px 80px", padding: "14px 24px", borderTop: `2px solid ${C.border}`, alignItems: "center", gap: 16, background: C.surface }}>
                <span style={{ fontWeight: 700, color: C.primary }}>TOTAL</span>
                <span />
                <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, color: C.amber }}>R{totals.totalGross.toLocaleString()}</span>
                <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: C.red }}>R{totals.totalPAYE.toLocaleString()}</span>
                <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: C.blue }}>R{totals.totalUIF.toLocaleString()}</span>
                <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, color: C.primary }}>R{totals.totalNet.toLocaleString()}</span>
                <span />
              </div>
            </div>

            {selectedStaff ? (() => {
              const { paye, uif, totalDeductions, netPay } = calcPayslip(selectedStaff);
              return (
                <div style={{ background: C.surface, border: `1px solid ${selectedStaff.color}44`, padding: 24 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24 }}>
                    <Avatar initials={selectedStaff.avatar} color={selectedStaff.color} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{selectedStaff.name}</div>
                      <div style={{ fontSize: 12, color: C.muted }}>{selectedStaff.role}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>February 2026 Payslip</div>
                  {[
                    { label: "Gross Salary", value: `R${selectedStaff.grossSalary.toLocaleString()}`, color: C.text, bold: false, large: false },
                    { label: `PAYE (${Math.round(selectedStaff.taxRate * 100)}%)`, value: `-R${paye.toLocaleString()}`, color: C.red, bold: false, large: false },
                    { label: "UIF (1%)", value: `-R${uif.toLocaleString()}`, color: C.red, bold: false, large: false },
                    { label: "Total Deductions", value: `-R${totalDeductions.toLocaleString()}`, color: C.red, bold: true, large: false },
                    { label: "NET PAY", value: `R${netPay.toLocaleString()}`, color: C.primary, bold: true, large: true }
                  ].map((r) => (
                    <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: r.bold ? 13 : 12, color: C.muted, fontWeight: r.bold ? 700 : 400 }}>{r.label}</span>
                      <span style={{ fontFamily: "DM Mono, monospace", fontWeight: r.bold ? 800 : 600, color: r.color, fontSize: r.large ? 18 : 13 }}>{r.value}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 16, padding: 12, background: C.bg }}>
                    {[
                      { label: "Bank Account", value: `****${selectedStaff.bankLast4}` },
                      { label: "Contract", value: selectedStaff.contractType },
                      { label: "Start Date", value: selectedStaff.startDate }
                    ].map((r) => (
                      <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "4px 0" }}>
                        <span style={{ color: C.muted }}>{r.label}</span>
                        <span style={{ fontFamily: "DM Mono, monospace" }}>{r.value}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                    <button style={{ flex: 1, background: C.primary, color: C.bg, border: "none", padding: "10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Download PDF</button>
                    <button style={{ flex: 1, background: C.border, border: "none", color: C.text, padding: "10px", fontSize: 12, cursor: "pointer" }}>Email to Staff</button>
                  </div>
                </div>
              );
            })() : null}
          </div>
        ) : null}

        {activeTab === "payroll history" ? (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "120px 120px 120px 120px 120px 100px 80px", padding: "12px 24px", borderBottom: `1px solid ${C.border}`, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", gap: 16 }}>
              {["Month", "Gross", "PAYE", "UIF", "Net", "Status", ""].map((h) => <span key={h}>{h}</span>)}
            </div>
            {["Feb 2026", "Jan 2026", "Dec 2025", "Nov 2025"].map((month, i) => {
              const variation = [1, 0, 0, -0.02][i] as number;
              const gross = Math.round(totals.totalGross * (1 + variation));
              const paye = Math.round(totals.totalPAYE * (1 + variation));
              const uif = Math.round(totals.totalUIF * (1 + variation));
              const net = gross - paye - uif;
              return (
                <div key={month} style={{ display: "grid", gridTemplateColumns: "120px 120px 120px 120px 120px 100px 80px", padding: "14px 24px", borderBottom: i < 3 ? `1px solid ${C.border}` : "none", alignItems: "center", gap: 16 }}>
                  <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 600 }}>{month}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: C.amber }}>R{gross.toLocaleString()}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: C.red }}>R{paye.toLocaleString()}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: C.blue }}>R{uif.toLocaleString()}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: C.primary }}>R{net.toLocaleString()}</span>
                  <span style={{ fontSize: 10, color: i === 0 ? C.amber : C.primary, background: `${i === 0 ? C.amber : C.primary}15`, padding: "3px 8px" }}>{i === 0 ? "Pending" : "Processed"}</span>
                  <button style={{ background: C.border, border: "none", color: C.text, padding: "4px 10px", fontSize: 10, cursor: "pointer" }}>View</button>
                </div>
              );
            })}
          </div>
        ) : null}

        {activeTab === "payslips" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {staff.map((member) => {
              const { netPay } = calcPayslip(member);
              return (
                <div key={member.id} style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <Avatar initials={member.avatar} color={member.color} size={36} />
                    <div>
                      <div style={{ fontWeight: 600 }}>{member.name}</div>
                      <div style={{ fontSize: 12, color: C.muted }}>{member.role}</div>
                      <div style={{ fontFamily: "DM Mono, monospace", color: C.primary, fontWeight: 700, marginTop: 4 }}>R{netPay.toLocaleString()} net</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={{ background: C.primary, color: C.bg, border: "none", padding: "6px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>PDF</button>
                    <button style={{ background: C.border, border: "none", color: C.text, padding: "6px 10px", fontSize: 11, cursor: "pointer" }}>Email</button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {activeTab === "compliance" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>SARS Submission Deadlines</div>
              {[
                { task: "EMP201 - PAYE monthly return", due: "7 Mar 2026", status: "upcoming", amount: `R${totals.totalPAYE.toLocaleString()}` },
                { task: "UIF monthly contribution", due: "7 Mar 2026", status: "upcoming", amount: `R${(totals.totalUIF * 2).toLocaleString()}` },
                { task: "IRP5 certificates (EMP501)", due: "31 May 2026", status: "future", amount: "Annual" },
                { task: "EMP501 half-year reconciliation", due: "31 Oct 2026", status: "future", amount: "Annual" }
              ].map((d) => (
                <div key={d.task} style={{ padding: "12px 0", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{d.task}</div>
                    <div style={{ fontSize: 11, color: d.status === "upcoming" ? C.amber : C.muted }}>{d.due}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "DM Mono, monospace", color: C.red, fontWeight: 700 }}>{d.amount}</div>
                    <span style={{ fontSize: 10, color: d.status === "upcoming" ? C.amber : C.muted }}>{d.status}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Payroll Cost Summary</div>
              {[
                { label: "Gross payroll", value: totals.totalGross, color: C.amber },
                { label: "PAYE (employee)", value: totals.totalPAYE, color: C.red },
                { label: "UIF (employee 1%)", value: totals.totalUIF, color: C.blue },
                { label: "UIF (employer 1%)", value: totals.totalUIF, color: C.blue },
                { label: "SDL (1% of payroll)", value: Math.round(totals.totalGross * 0.01), color: C.primary }
              ].map((r) => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                  <span style={{ color: C.muted }}>{r.label}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: r.color, fontWeight: 700 }}>R{r.value.toLocaleString()}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", fontSize: 14 }}>
                <span style={{ fontWeight: 700 }}>Total Employment Cost</span>
                <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, color: C.primary }}>
                  R{(totals.totalGross + totals.totalUIF + Math.round(totals.totalGross * 0.01)).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

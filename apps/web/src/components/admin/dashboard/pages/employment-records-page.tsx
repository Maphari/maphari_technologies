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

type Employee = {
  id: string;
  name: string;
  role: string;
  department: string;
  avatar: string;
  color: string;
  contractType: string;
  startDate: string;
  salary: number;
  lastReview: string | null;
  nextReview: string | null;
  bankAccount: string;
  taxNumber: string;
  address: string;
  idNumber: string;
  emergencyContact: string;
  documents: string[];
  probation: string | null;
  leaveBalance: number;
  performanceScore: number | null;
  notes: string | null;
};

const employees: Employee[] = [
  {
    id: "EMP-001", name: "Sipho Nkosi", role: "Founder & CEO", department: "Leadership",
    avatar: "SN", color: C.primary, contractType: "Director", startDate: "Jan 2020",
    salary: 60000, lastReview: "Aug 2025", nextReview: "Aug 2026",
    bankAccount: "FNB ****7823", taxNumber: "TRF-****-8821",
    address: "14 Jacaranda Ave, Pretoria, 0001", idNumber: "82****4083",
    emergencyContact: "Thandi Nkosi - +27 83 400 1122",
    documents: ["Contract", "ID Copy", "Tax Certificate", "Equity Certificate"],
    probation: null, leaveBalance: 13, performanceScore: null,
    notes: "Founding member. CCMA representative. Company shareholder."
  },
  {
    id: "EMP-002", name: "Leilani Fotu", role: "Head of Operations", department: "Operations",
    avatar: "LF", color: C.blue, contractType: "Permanent", startDate: "Mar 2022",
    salary: 44000, lastReview: "Sep 2025", nextReview: "Sep 2026",
    bankAccount: "Standard Bank ****4412", taxNumber: "TRF-****-3314",
    address: "8 Baobab St, Centurion, 0157", idNumber: "91****7021",
    emergencyContact: "Pita Fotu - +27 72 908 3301",
    documents: ["Contract", "ID Copy", "Tax Certificate", "Qualifications"],
    probation: null, leaveBalance: 2, performanceScore: 4.2,
    notes: null
  },
  {
    id: "EMP-003", name: "Renzo Fabbri", role: "Creative Director", department: "Creative",
    avatar: "RF", color: C.orange, contractType: "Permanent", startDate: "Jun 2021",
    salary: 52000, lastReview: "Oct 2025", nextReview: "Oct 2026",
    bankAccount: "Nedbank ****9934", taxNumber: "TRF-****-7741",
    address: "22 Via Roma, Hatfield, 0083", idNumber: "88****5519",
    emergencyContact: "Sofia Fabbri - +27 74 217 8890",
    documents: ["Contract", "ID Copy", "Work Permit", "Tax Certificate"],
    probation: null, leaveBalance: 3, performanceScore: 4.6,
    notes: "Italian passport. Work permit valid until Dec 2027."
  },
  {
    id: "EMP-004", name: "Nomsa Dlamini", role: "Account Manager", department: "Client Services",
    avatar: "ND", color: C.primary, contractType: "Permanent", startDate: "Feb 2023",
    salary: 38000, lastReview: "Feb 2026", nextReview: "Feb 2027",
    bankAccount: "Capitec ****2281", taxNumber: "TRF-****-9912",
    address: "5 Msasa Rd, Sunnyside, 0132", idNumber: "94****0887",
    emergencyContact: "Bongi Dlamini - +27 81 553 4421",
    documents: ["Contract", "ID Copy", "Tax Certificate"],
    probation: null, leaveBalance: 12, performanceScore: 3.9,
    notes: "Last review Jan 2026 - flagged communication improvement areas."
  },
  {
    id: "EMP-005", name: "Kira Bosman", role: "UX Designer", department: "Creative",
    avatar: "KB", color: C.amber, contractType: "Permanent", startDate: "Aug 2023",
    salary: 33500, lastReview: "Aug 2025", nextReview: "Aug 2026",
    bankAccount: "FNB ****6670", taxNumber: "TRF-****-4423",
    address: "31 Korhaan St, Brooklyn, 0181", idNumber: "97****2214",
    emergencyContact: "Johan Bosman - +27 83 112 3344",
    documents: ["Contract", "ID Copy", "Tax Certificate", "Qualifications"],
    probation: null, leaveBalance: 11, performanceScore: 4.4,
    notes: null
  },
  {
    id: "EMP-006", name: "Tapiwa Moyo", role: "Copywriter", department: "Creative",
    avatar: "TM", color: C.blue, contractType: "Permanent", startDate: "Jan 2024",
    salary: 28000, lastReview: null, nextReview: "Jan 2026",
    bankAccount: "Absa ****3345", taxNumber: "TRF-****-8812",
    address: "12 Flame Lily Close, Lynnwood, 0081", idNumber: "99****1132",
    emergencyContact: "Grace Moyo - +27 72 881 4409",
    documents: ["Contract", "ID Copy"],
    probation: "Completed Jan 2025", leaveBalance: 14, performanceScore: 3.7,
    notes: "First review overdue - schedule ASAP."
  }
];

const reqDocs = ["Contract", "ID Copy", "Tax Certificate"] as const;
const tabs = ["all records", "record detail", "compliance", "org chart"] as const;
type Tab = (typeof tabs)[number];

function parseMonthYear(value: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(`${value} 1`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function Avatar({ initials, color, size = 40 }: { initials: string; color: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `${color}22`, border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.32, fontWeight: 700, color, fontFamily: "DM Mono, monospace", flexShrink: 0 }}>
      {initials}
    </div>
  );
}

export function EmploymentRecordsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("all records");
  const [selected, setSelected] = useState<Employee>(employees[0]);

  const overdueReviews = useMemo(() => {
    const cutoff = new Date("2026-03-01");
    return employees.filter((e) => {
      const next = parseMonthYear(e.nextReview);
      const last = parseMonthYear(e.lastReview);
      if (!next || next >= cutoff) return false;
      if (!last) return true;
      return last < new Date("2026-01-01");
    });
  }, []);

  const missingDocs = useMemo(
    () => employees.filter((e) => !reqDocs.every((d) => e.documents.includes(d))),
    []
  );
  const workPermits = useMemo(
    () => employees.filter((e) => e.documents.includes("Work Permit")),
    []
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
          <div style={{ fontSize: 11, color: C.primary, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>ADMIN / STAFF</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Employment Records</h1>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Contracts, personal details, performance, and documents</div>
        </div>
        <button style={{ background: C.primary, color: C.bg, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Mono, monospace", border: "none" }}>+ Add Employee</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
        {[
          { label: "Total Employees", value: employees.length.toString(), color: C.primary, sub: "All permanent staff" },
          { label: "Reviews Overdue", value: overdueReviews.length.toString(), color: overdueReviews.length > 0 ? C.red : C.primary, sub: "Annual reviews past due" },
          { label: "Missing Documents", value: missingDocs.length.toString(), color: missingDocs.length > 0 ? C.amber : C.primary, sub: "Incomplete compliance files" },
          { label: "Work Permits", value: workPermits.length.toString(), color: C.blue, sub: "Foreign nationals on staff" }
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
        {activeTab === "all records" ? (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "220px 140px 110px 100px 100px 120px 80px auto", padding: "12px 24px", borderBottom: `1px solid ${C.border}`, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", gap: 16 }}>
              {["Employee", "Role", "Contract", "Start Date", "Salary", "Next Review", "Docs", ""].map((h) => <span key={h}>{h}</span>)}
            </div>
            {employees.map((emp, i) => {
              const missingAny = !reqDocs.every((d) => emp.documents.includes(d));
              const reviewAlert = !emp.lastReview;
              return (
                <div key={emp.id} style={{ display: "grid", gridTemplateColumns: "220px 140px 110px 100px 100px 120px 80px auto", padding: "14px 24px", borderBottom: i < employees.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center", gap: 16, background: reviewAlert ? "#1a0a0a" : "transparent" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <Avatar initials={emp.avatar} color={emp.color} size={30} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{emp.name}</div>
                      <div style={{ fontSize: 10, color: C.muted }}>{emp.id}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: C.muted }}>{emp.role}</span>
                  <span style={{ fontSize: 11, color: C.blue }}>{emp.contractType}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: C.muted }}>{emp.startDate}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: C.primary, fontWeight: 700 }}>R{(emp.salary / 1000).toFixed(0)}k</span>
                  <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: reviewAlert ? C.red : C.muted }}>{emp.nextReview || "Overdue"}</span>
                  <span style={{ fontSize: 12, color: missingAny ? C.red : C.primary, textAlign: "center" }}>{missingAny ? "!" : "OK"}</span>
                  <button onClick={() => { setSelected(emp); setActiveTab("record detail"); }} style={{ background: C.primary, color: C.bg, border: "none", padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>View</button>
                </div>
              );
            })}
          </div>
        ) : null}

        {activeTab === "record detail" ? (
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {employees.map((emp) => (
                <div key={emp.id} onClick={() => setSelected(emp)} style={{ padding: "12px 16px", background: selected.id === emp.id ? `${emp.color}15` : C.surface, border: `1px solid ${selected.id === emp.id ? emp.color + "55" : C.border}`, cursor: "pointer", display: "flex", gap: 10, alignItems: "center" }}>
                  <Avatar initials={emp.avatar} color={emp.color} size={28} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 12, color: selected.id === emp.id ? emp.color : C.text }}>{emp.name.split(" ")[0]}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>{emp.role.split(" ").slice(0, 2).join(" ")}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: C.surface, border: `1px solid ${selected.color}33`, padding: 28 }}>
              <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 28 }}>
                <Avatar initials={selected.avatar} color={selected.color} size={56} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 22 }}>{selected.name}</div>
                  <div style={{ color: selected.color, fontSize: 14 }}>{selected.role} - {selected.department}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{selected.id} - {selected.contractType} - Since {selected.startDate}</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Employment Details</div>
                  {[
                    { label: "Salary", value: `R${selected.salary.toLocaleString()}/month`, color: C.primary },
                    { label: "Bank Account", value: selected.bankAccount },
                    { label: "Tax Number", value: selected.taxNumber },
                    { label: "Last Review", value: selected.lastReview || "Never", color: !selected.lastReview ? C.red : C.text },
                    { label: "Next Review", value: selected.nextReview || "Overdue", color: !selected.lastReview ? C.red : C.text },
                    { label: "Performance Score", value: selected.performanceScore ? `${selected.performanceScore}/5` : "Not yet rated", color: selected.performanceScore ? (selected.performanceScore >= 4 ? C.primary : selected.performanceScore >= 3 ? C.amber : C.red) : C.muted }
                  ].map((f) => (
                    <div key={f.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
                      <span style={{ color: C.muted }}>{f.label}</span>
                      <span style={{ fontWeight: 600, color: f.color || C.text }}>{f.value}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Personal Details</div>
                  {[
                    { label: "ID Number", value: selected.idNumber },
                    { label: "Address", value: selected.address },
                    { label: "Emergency Contact", value: selected.emergencyContact },
                    { label: "Leave Balance", value: `${selected.leaveBalance} days AL remaining`, color: selected.leaveBalance <= 3 ? C.red : C.text }
                  ].map((f) => (
                    <div key={f.label} style={{ padding: "8px 0", borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
                      <div style={{ color: C.muted, marginBottom: 2 }}>{f.label}</div>
                      <div style={{ fontWeight: 600, color: f.color || C.text, wordBreak: "break-word" }}>{f.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Documents on File</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {selected.documents.map((doc) => (
                    <span key={doc} style={{ fontSize: 11, color: C.primary, background: `${C.primary}15`, border: `1px solid ${C.primary}33`, padding: "4px 12px" }}>OK {doc}</span>
                  ))}
                  {reqDocs.filter((d) => !selected.documents.includes(d)).map((doc) => (
                    <span key={doc} style={{ fontSize: 11, color: C.red, background: `${C.red}15`, border: `1px solid ${C.red}33`, padding: "4px 12px" }}>Missing {doc}</span>
                  ))}
                </div>
              </div>

              {selected.notes ? (
                <div style={{ padding: 14, background: "#0a0f1a", border: `1px solid ${C.blue}22`, marginBottom: 20 }}>
                  <div style={{ fontSize: 10, color: C.blue, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Admin Notes</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{selected.notes}</div>
                </div>
              ) : null}

              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ background: C.primary, color: C.bg, border: "none", padding: "10px 20px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Edit Record</button>
                <button style={{ background: C.border, border: "none", color: C.text, padding: "10px 16px", fontSize: 12, cursor: "pointer" }}>Upload Document</button>
                <button style={{ background: C.border, border: "none", color: C.text, padding: "10px 16px", fontSize: 12, cursor: "pointer" }}>Schedule Review</button>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "compliance" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Document Compliance</div>
              {employees.map((emp) => {
                const hasAll = reqDocs.every((d) => emp.documents.includes(d));
                const missing = reqDocs.filter((d) => !emp.documents.includes(d));
                return (
                  <div key={emp.id} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <Avatar initials={emp.avatar} color={emp.color} size={24} />
                      <span style={{ fontSize: 13 }}>{emp.name.split(" ")[0]}</span>
                    </div>
                    {hasAll ? <span style={{ fontSize: 11, color: C.primary }}>Complete</span> : <span style={{ fontSize: 11, color: C.red }}>Missing: {missing.join(", ")}</span>}
                  </div>
                );
              })}
            </div>

            <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Review Schedule</div>
              {employees.map((emp) => (
                <div key={emp.id} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <Avatar initials={emp.avatar} color={emp.color} size={24} />
                    <span style={{ fontSize: 13 }}>{emp.name.split(" ")[0]}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: !emp.lastReview ? C.red : C.muted }}>Next: {emp.nextReview || "OVERDUE"}</div>
                    {!emp.lastReview ? <div style={{ fontSize: 10, color: C.red }}>Never reviewed</div> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {activeTab === "org chart" ? (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 32 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
              <div style={{ padding: "16px 24px", background: `${C.primary}15`, border: `2px solid ${C.primary}`, textAlign: "center", minWidth: 180 }}>
                <div style={{ fontFamily: "DM Mono, monospace", fontSize: 10, color: C.primary, marginBottom: 6 }}>EMP-001</div>
                <div style={{ fontWeight: 800, fontSize: 15 }}>Sipho Nkosi</div>
                <div style={{ fontSize: 12, color: C.primary }}>Founder & CEO</div>
              </div>
              <div style={{ width: 2, height: 32, background: C.border }} />

              <div style={{ display: "flex", gap: 24 }}>
                {[employees[1], employees[2]].map((emp) => (
                  <div key={emp.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 2, height: 24, background: C.border }} />
                    <div style={{ padding: "12px 20px", background: `${emp.color}15`, border: `2px solid ${emp.color}`, textAlign: "center", minWidth: 160 }}>
                      <div style={{ fontFamily: "DM Mono, monospace", fontSize: 10, color: emp.color, marginBottom: 4 }}>{emp.id}</div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{emp.name.split(" ")[0]}</div>
                      <div style={{ fontSize: 11, color: emp.color }}>{emp.role}</div>
                    </div>
                    <div style={{ width: 2, height: 24, background: C.border }} />
                    <div style={{ display: "flex", gap: 12 }}>
                      {employees
                        .filter((e) => {
                          if (emp.name === "Leilani Fotu") return e.id === "EMP-006";
                          if (emp.name === "Renzo Fabbri") return ["EMP-004", "EMP-005"].includes(e.id);
                          return false;
                        })
                        .map((report) => (
                          <div key={report.id} style={{ padding: "10px 14px", background: `${report.color}10`, border: `1px solid ${report.color}44`, textAlign: "center", minWidth: 130 }}>
                            <div style={{ fontWeight: 600, fontSize: 12 }}>{report.name.split(" ")[0]}</div>
                            <div style={{ fontSize: 10, color: report.color }}>{report.role.split(" ").slice(0, 2).join(" ")}</div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

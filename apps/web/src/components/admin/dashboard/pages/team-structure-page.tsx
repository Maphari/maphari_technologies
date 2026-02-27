"use client";

import { useState } from "react";

const C = {
  bg: "#050508",
  surface: "#0d0d14",
  border: "#1a1a2e",
  lime: "#a78bfa",
  purple: "#a78bfa",
  blue: "#60a5fa",
  amber: "#f5c518",
  red: "#ff4444",
  orange: "#ff8c00",
  muted: "#a0a0b0",
  text: "#e8e8f0"
} as const;

type OrgPerson = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  department: string;
  reports: OrgPerson[];
};

const org: OrgPerson = {
  id: "sipho",
  name: "Sipho Nkosi",
  role: "Founder & CEO",
  avatar: "SN",
  color: C.lime,
  department: "Leadership",
  reports: [
    {
      id: "leilani",
      name: "Leilani Fotu",
      role: "Head of Operations",
      avatar: "LF",
      color: C.blue,
      department: "Operations",
      reports: [
        { id: "nomsa", name: "Nomsa Dlamini", role: "Account Manager", avatar: "ND", color: C.purple, department: "Client Success", reports: [] },
        { id: "tapiwa", name: "Tapiwa Moyo", role: "Copywriter", avatar: "TM", color: C.amber, department: "Content", reports: [] }
      ]
    },
    {
      id: "renzo",
      name: "Renzo Fabbri",
      role: "Creative Director",
      avatar: "RF",
      color: C.orange,
      department: "Design",
      reports: [{ id: "kira", name: "Kira Bosman", role: "UX Designer", avatar: "KB", color: C.red, department: "Design", reports: [] }]
    }
  ]
};

const departments = [
  { name: "Leadership", headcount: 1, color: C.lime, budget: 60000 },
  { name: "Operations", headcount: 1, color: C.blue, budget: 44000 },
  { name: "Design", headcount: 2, color: C.orange, budget: 73500 },
  { name: "Client Success", headcount: 1, color: C.purple, budget: 42000 },
  { name: "Content", headcount: 1, color: C.amber, budget: 31000 }
] as const;

const roles = [
  { title: "Founder & CEO", department: "Leadership", level: "C-Suite", permissions: ["all"], reportCount: 2 },
  { title: "Head of Operations", department: "Operations", level: "Head", permissions: ["staff", "clients", "reports", "scheduling"], reportCount: 2 },
  { title: "Creative Director", department: "Design", level: "Head", permissions: ["clients", "reports"], reportCount: 1 },
  { title: "Account Manager", department: "Client Success", level: "Senior", permissions: ["clients", "invoices"], reportCount: 0 },
  { title: "UX Designer", department: "Design", level: "Mid", permissions: ["clients"], reportCount: 0 },
  { title: "Copywriter", department: "Content", level: "Mid", permissions: ["clients"], reportCount: 0 }
] as const;

const headcountPlan = [
  { role: "Senior Designer", department: "Design", priority: "critical", targetDate: "Apr 2026", status: "interviewing", budget: 45000 },
  { role: "Marketing Manager", department: "Marketing", priority: "high", targetDate: "Jun 2026", status: "approved", budget: 38000 },
  { role: "Junior Copywriter", department: "Content", priority: "medium", targetDate: "Jul 2026", status: "planned", budget: 22000 }
] as const;

const tabs = ["org chart", "departments", "roles & permissions", "headcount plan"] as const;
type Tab = (typeof tabs)[number];

function Avatar({ initials, color, size = 40 }: { initials: string; color: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `${color}22`, border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.3, fontWeight: 700, color, fontFamily: "DM Mono, monospace", flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function OrgNode({ person, depth = 0 }: { person: OrgPerson; depth?: number }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div
        style={{ background: C.surface, border: `1px solid ${person.color}55`, borderRadius: 10, padding: "14px 20px", minWidth: 160, textAlign: "center", position: "relative", cursor: person.reports.length > 0 ? "pointer" : "default" }}
        onClick={() => person.reports.length > 0 && setCollapsed(!collapsed)}
      >
        <Avatar initials={person.avatar} color={person.color} size={36} />
        <div style={{ fontWeight: 700, fontSize: 13, marginTop: 8 }}>{person.name}</div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{person.role}</div>
        <div style={{ fontSize: 10, color: person.color, marginTop: 4, fontFamily: "DM Mono, monospace" }}>{person.department}</div>
        {person.reports.length > 0 ? (
          <div style={{ position: "absolute", bottom: -10, left: "50%", transform: "translateX(-50%)", fontSize: 12, color: C.muted }}>{collapsed ? "+" : "−"}</div>
        ) : null}
      </div>

      {!collapsed && person.reports.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 0 }}>
          <div style={{ width: 1, height: 24, background: C.border }} />
          {person.reports.length > 1 ? (
            <div style={{ position: "relative", display: "flex", alignItems: "flex-start" }}>
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  right: "calc(50% - 100px)",
                  height: 1,
                  background: C.border,
                  minWidth: `${(person.reports.length - 1) * 220}px`,
                  transform: "translateX(-50%)",
                  left: "50%"
                }}
              />
            </div>
          ) : null}
          <div style={{ display: "flex", gap: 40, alignItems: "flex-start", marginTop: 0 }}>
            {person.reports.map((report) => (
              <div key={report.id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 1, height: 24, background: C.border }} />
                <OrgNode person={report} depth={depth + 1} />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function TeamStructurePage() {
  const [activeTab, setActiveTab] = useState<Tab>("org chart");

  const totalHeadcount = departments.reduce((s, d) => s + d.headcount, 0);
  const totalPayroll = departments.reduce((s, d) => s + d.budget, 0);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "Syne, sans-serif", color: C.text, padding: 0 }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 11, color: C.lime, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>ADMIN / ORGANIZATIONAL STRUCTURE</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Team Structure</h1>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Org chart · Departments · Roles · Headcount planning</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, padding: "8px 16px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: "DM Mono, monospace" }}>Export Org Chart</button>
          <button style={{ background: C.lime, color: C.bg, padding: "8px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Mono, monospace", border: "none" }}>+ Add Staff</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Total Headcount", value: totalHeadcount.toString(), color: C.lime, sub: "Full-time staff" },
          { label: "Departments", value: departments.length.toString(), color: C.blue, sub: "Active teams" },
          { label: "Monthly Payroll", value: `R${(totalPayroll / 1000).toFixed(0)}k`, color: C.red, sub: "Salaries only" },
          { label: "Open Positions", value: headcountPlan.length.toString(), color: C.amber, sub: "Planned hires" }
        ].map((s) => (
          <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: "DM Mono, monospace", marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: `1px solid ${C.border}` }}>
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            style={{
              background: "none",
              border: "none",
              color: activeTab === t ? C.lime : C.muted,
              padding: "8px 16px",
              cursor: "pointer",
              fontFamily: "Syne, sans-serif",
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              borderBottom: `2px solid ${activeTab === t ? C.lime : "transparent"}`,
              marginBottom: -1,
              transition: "all 0.2s"
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === "org chart" ? (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 48, overflowX: "auto" }}>
          <div style={{ display: "flex", justifyContent: "center", minWidth: 700 }}>
            <OrgNode person={org} />
          </div>
          <div style={{ marginTop: 32, paddingTop: 20, borderTop: `1px solid ${C.border}`, display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
            {departments.map((d) => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: d.color }} />
                <span style={{ color: C.muted }}>{d.name}</span>
                <span style={{ color: d.color, fontFamily: "DM Mono, monospace" }}>({d.headcount})</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === "departments" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {departments.map((d) => (
            <div key={d.name} style={{ background: C.surface, border: `1px solid ${d.color}44`, borderRadius: 10, padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{d.name}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>
                    {d.headcount} staff member{d.headcount !== 1 ? "s" : ""}
                  </div>
                </div>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: d.color, marginTop: 4 }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ padding: 12, background: C.bg, borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Monthly Budget</div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: C.red }}>R{d.budget.toLocaleString()}</div>
                </div>
                <div style={{ padding: 12, background: C.bg, borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Cost per Head</div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700 }}>R{Math.round(d.budget / d.headcount).toLocaleString()}</div>
                </div>
              </div>
              <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                <button style={{ flex: 1, background: C.border, border: "none", color: C.text, padding: "8px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>View Team</button>
                <button style={{ flex: 1, background: `${d.color}15`, border: `1px solid ${d.color}44`, color: d.color, padding: "8px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Edit</button>
              </div>
            </div>
          ))}
          <div style={{ border: `1px dashed ${C.border}`, borderRadius: 10, padding: 24, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.muted, fontSize: 13 }}>
            + Add Department
          </div>
        </div>
      ) : null}

      {activeTab === "roles & permissions" ? (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 100px 80px 1fr", padding: "12px 24px", borderBottom: `1px solid ${C.border}`, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {["Role Title", "Department", "Level", "Reports", "Dashboard Permissions"].map((h) => <span key={h}>{h}</span>)}
          </div>
          {roles.map((r, i) => (
            <div key={r.title} style={{ display: "grid", gridTemplateColumns: "1fr 140px 100px 80px 1fr", padding: "16px 24px", borderBottom: i < roles.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center" }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{r.title}</span>
              <span style={{ fontSize: 12, color: C.muted }}>{r.department}</span>
              <span style={{ fontSize: 10, color: r.level === "C-Suite" ? C.lime : r.level === "Head" ? C.blue : C.muted, background: `${r.level === "C-Suite" ? C.lime : r.level === "Head" ? C.blue : C.muted}15`, padding: "3px 8px", borderRadius: 4, fontFamily: "DM Mono, monospace" }}>{r.level}</span>
              <span style={{ fontFamily: "DM Mono, monospace", color: C.muted }}>{r.reportCount}</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {r.permissions.some((p) => p === "all") ? (
                  <span style={{ fontSize: 10, color: C.lime, background: `${C.lime}15`, padding: "2px 8px", borderRadius: 4 }}>★ Full Access</span>
                ) : (
                  r.permissions.map((p) => (
                    <span key={p} style={{ fontSize: 10, color: C.blue, background: `${C.blue}15`, padding: "2px 8px", borderRadius: 4, fontFamily: "DM Mono, monospace" }}>
                      {p}
                    </span>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {activeTab === "headcount plan" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.lime}22`, borderRadius: 10, padding: 16, fontSize: 12, color: C.muted }}>
            Planned hires for 2026. Approved positions have budget allocated. Planned positions require finance sign-off before posting.
          </div>
          {headcountPlan.map((h) => (
            <div key={h.role} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24, display: "grid", gridTemplateColumns: "1fr 120px 100px 120px 100px auto", alignItems: "center", gap: 20 }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{h.role}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{h.department}</div>
              </div>
              <span style={{ fontSize: 10, color: { critical: C.red, high: C.orange, medium: C.amber }[h.priority], background: `${{ critical: C.red, high: C.orange, medium: C.amber }[h.priority]}18`, padding: "3px 8px", borderRadius: 4, fontFamily: "DM Mono, monospace", textTransform: "uppercase" }}>{h.priority}</span>
              <div>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Target</div>
                <div style={{ fontSize: 12, fontFamily: "DM Mono, monospace" }}>{h.targetDate}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Monthly Budget</div>
                <div style={{ fontFamily: "DM Mono, monospace", color: C.lime, fontWeight: 700 }}>R{h.budget.toLocaleString()}</div>
              </div>
              <span style={{ fontSize: 10, color: h.status === "interviewing" ? C.blue : h.status === "approved" ? C.lime : C.muted, background: `${h.status === "interviewing" ? C.blue : h.status === "approved" ? C.lime : C.muted}15`, padding: "3px 8px", borderRadius: 4, fontFamily: "DM Mono, monospace" }}>{h.status}</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ background: C.border, border: "none", color: C.text, padding: "6px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>Edit</button>
                {h.status === "planned" ? <button style={{ background: `${C.lime}15`, border: `1px solid ${C.lime}44`, color: C.lime, padding: "6px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>Approve</button> : null}
              </div>
            </div>
          ))}
          <button style={{ background: C.surface, border: `1px dashed ${C.border}`, borderRadius: 10, padding: 20, color: C.muted, fontSize: 13, cursor: "pointer", textAlign: "center" }}>+ Add Planned Hire</button>
        </div>
      ) : null}
    </div>
  );
}

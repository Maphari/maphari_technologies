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
  muted: "#a0a0b0",
  text: "#e8e8f0"
} as const;

type StaffMember = {
  id: number;
  name: string;
  role: string;
  avatar: string;
  color: string;
  deliveryScore: number;
  onTimeRate: number;
  clientSat: number;
  billableHours: number;
  totalHours: number;
  billablePct: number;
  retainersManaged: number;
  tasksCompleted: number;
  tasksMissed: number;
  bonusEligible: boolean;
  bonusAmount: number;
  salary: number;
  notes: string;
};

const staff: StaffMember[] = [
  { id: 1, name: "Nomsa Dlamini", role: "Account Manager", avatar: "ND", color: C.primary, deliveryScore: 91, onTimeRate: 88, clientSat: 9.1, billableHours: 142, totalHours: 168, billablePct: 84.5, retainersManaged: 8, tasksCompleted: 47, tasksMissed: 2, bonusEligible: true, bonusAmount: 8500, salary: 42000, notes: "Exceptional retainer health. Minor delay on Kestrel campaign." },
  { id: 2, name: "Renzo Fabbri", role: "Senior Designer", avatar: "RF", color: C.blue, deliveryScore: 86, onTimeRate: 94, clientSat: 8.7, billableHours: 158, totalHours: 168, billablePct: 94.0, retainersManaged: 5, tasksCompleted: 63, tasksMissed: 1, bonusEligible: true, bonusAmount: 6200, salary: 38500, notes: "High output. Slightly below CSAT target due to Dune revisions." },
  { id: 3, name: "Kira Bosman", role: "UX Designer", avatar: "KB", color: C.amber, deliveryScore: 74, onTimeRate: 71, clientSat: 7.8, billableHours: 110, totalHours: 168, billablePct: 65.5, retainersManaged: 3, tasksCompleted: 38, tasksMissed: 7, bonusEligible: false, bonusAmount: 0, salary: 35000, notes: "Missed milestones on Mira Health. Needs performance check-in." },
  { id: 4, name: "Tapiwa Moyo", role: "Copywriter", avatar: "TM", color: C.blue, deliveryScore: 89, onTimeRate: 91, clientSat: 8.9, billableHours: 136, totalHours: 160, billablePct: 85.0, retainersManaged: 4, tasksCompleted: 52, tasksMissed: 3, bonusEligible: true, bonusAmount: 5000, salary: 31000, notes: "Consistent output across all clients. Strong CSAT score." },
  { id: 5, name: "Leilani Fotu", role: "Project Manager", avatar: "LF", color: C.primary, deliveryScore: 95, onTimeRate: 96, clientSat: 9.4, billableHours: 148, totalHours: 168, billablePct: 88.1, retainersManaged: 9, tasksCompleted: 71, tasksMissed: 0, bonusEligible: true, bonusAmount: 10000, salary: 44000, notes: "Top performer. Zero missed tasks. Leads cross-team coordination." }
];

const tabs = ["scoreboard", "delivery & quality", "utilization", "incentive planner"] as const;
type Tab = (typeof tabs)[number];
type RoleFilter = "all" | "account" | "creative" | "ops";
type BandFilter = "all" | "top" | "watch";

function Avatar({ initials, color, size = 32 }: { initials: string; color: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `${color}22`, border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.32, fontWeight: 700, color, fontFamily: "DM Mono, monospace", flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function barColor(value: number, good = 85, warn = 70): string {
  if (value >= good) return C.primary;
  if (value >= warn) return C.amber;
  return C.red;
}

export function PerformancePage() {
  const [activeTab, setActiveTab] = useState<Tab>("scoreboard");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [bandFilter, setBandFilter] = useState<BandFilter>("all");
  const [query, setQuery] = useState("");

  const totalBillable = staff.reduce((s, m) => s + m.billableHours, 0);
  const avgDelivery = Math.round(staff.reduce((s, m) => s + m.deliveryScore, 0) / staff.length);
  const avgOnTime = Math.round(staff.reduce((s, m) => s + m.onTimeRate, 0) / staff.length);
  const totalBonus = staff.reduce((s, m) => s + m.bonusAmount, 0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return staff
      .filter((m) => {
        if (roleFilter === "all") return true;
        if (roleFilter === "account") return m.role.includes("Account");
        if (roleFilter === "creative") return m.role.includes("Designer") || m.role.includes("Copywriter");
        if (roleFilter === "ops") return m.role.includes("Manager");
        return true;
      })
      .filter((m) => {
        if (bandFilter === "all") return true;
        const isTop = m.deliveryScore >= 90 && m.onTimeRate >= 90 && m.clientSat >= 8.5;
        return bandFilter === "top" ? isTop : !isTop;
      })
      .filter((m) => (q ? m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q) : true));
  }, [bandFilter, query, roleFilter]);

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
          <div style={{ fontSize: 11, color: C.primary, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "DM Mono, monospace" }}>GOVERNANCE / STAFF PERFORMANCE</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Performance Overview</h1>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Delivery, quality, utilization, and incentive readiness across the team.</div>
        </div>
        <button style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, padding: "8px 16px", fontSize: 12, cursor: "pointer", fontFamily: "DM Mono, monospace" }}>Export Report</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
        {[
          { label: "Avg Delivery Score", value: `${avgDelivery}/100`, color: barColor(avgDelivery), sub: "Current month" },
          { label: "Avg On-Time Rate", value: `${avgOnTime}%`, color: barColor(avgOnTime, 90, 75), sub: "Across active staff" },
          { label: "Team Billable Hours", value: `${totalBillable}h`, color: C.blue, sub: "Target: 800h" },
          { label: "Bonus Pool", value: `R${(totalBonus / 1000).toFixed(1)}k`, color: C.primary, sub: `${staff.filter((s) => s.bonusEligible).length} eligible staff` }
        ].map((kpi) => (
          <div key={kpi.label} style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{kpi.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: kpi.color, fontFamily: "DM Mono, monospace", marginBottom: 4 }}>{kpi.value}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      <AdminTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} primaryColor={C.primary} mutedColor={C.muted} panelColor={C.surface} borderColor={C.border} />

      <div style={{ overflow: "auto", minHeight: 0 }}>
        <AdminFilterBar panelColor={C.surface} borderColor={C.border}>
          <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "DM Mono, monospace" }}>Filters</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as RoleFilter)} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12 }}>
              <option value="all">Role: All</option>
              <option value="account">Role: Account</option>
              <option value="creative">Role: Creative</option>
              <option value="ops">Role: Ops</option>
            </select>
            <select value={bandFilter} onChange={(e) => setBandFilter(e.target.value as BandFilter)} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12 }}>
              <option value="all">Band: All</option>
              <option value="top">Band: Top performers</option>
              <option value="watch">Band: Watchlist</option>
            </select>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search staff" style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12, minWidth: 200 }} />
            {(roleFilter !== "all" || bandFilter !== "all" || query.trim()) ? (
              <button onClick={() => { setRoleFilter("all"); setBandFilter("all"); setQuery(""); }} style={{ background: C.border, border: "none", color: C.text, padding: "8px 10px", fontSize: 11, cursor: "pointer", fontFamily: "DM Mono, monospace" }}>Clear</button>
            ) : null}
          </div>
        </AdminFilterBar>

        {activeTab === "scoreboard" ? (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "220px 110px 110px 100px 110px 130px 120px", padding: "12px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "DM Mono, monospace", gap: 12 }}>
              {[
                "Staff",
                "Delivery",
                "On-time",
                "CSAT",
                "Utilization",
                "Tasks (done/missed)",
                "Bonus"
              ].map((h) => <span key={h}>{h}</span>)}
            </div>
            {filtered.map((m, idx) => (
              <div key={m.id} style={{ display: "grid", gridTemplateColumns: "220px 110px 110px 100px 110px 130px 120px", padding: "13px 20px", borderBottom: idx < filtered.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center", gap: 12, background: m.deliveryScore < 80 || m.onTimeRate < 75 ? "#1a0a0a" : "transparent" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar initials={m.avatar} color={m.color} size={28} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>{m.role}</div>
                  </div>
                </div>
                <span style={{ fontFamily: "DM Mono, monospace", color: barColor(m.deliveryScore), fontWeight: 700 }}>{m.deliveryScore}</span>
                <span style={{ fontFamily: "DM Mono, monospace", color: barColor(m.onTimeRate, 90, 75), fontWeight: 700 }}>{m.onTimeRate}%</span>
                <span style={{ fontFamily: "DM Mono, monospace", color: m.clientSat >= 8.5 ? C.primary : m.clientSat >= 7.5 ? C.amber : C.red, fontWeight: 700 }}>{m.clientSat}/10</span>
                <span style={{ fontFamily: "DM Mono, monospace", color: m.billablePct >= 80 ? C.primary : m.billablePct >= 70 ? C.amber : C.red, fontWeight: 700 }}>{m.billablePct}%</span>
                <span style={{ fontFamily: "DM Mono, monospace", color: C.muted }}>{m.tasksCompleted}/{m.tasksMissed}</span>
                <span style={{ fontFamily: "DM Mono, monospace", color: m.bonusEligible ? C.primary : C.red, fontWeight: 700 }}>{m.bonusEligible ? `R${m.bonusAmount.toLocaleString()}` : "Not eligible"}</span>
              </div>
            ))}
          </div>
        ) : null}

        {activeTab === "delivery & quality" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Delivery Ranking</div>
              {filtered.slice().sort((a, b) => b.deliveryScore - a.deliveryScore).map((m) => (
                <div key={m.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12 }}>{m.name}</span>
                    <span style={{ fontFamily: "DM Mono, monospace", color: barColor(m.deliveryScore), fontWeight: 700 }}>{m.deliveryScore}</span>
                  </div>
                  <div style={{ height: 6, background: C.border }}>
                    <div style={{ height: "100%", width: `${m.deliveryScore}%`, background: barColor(m.deliveryScore) }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Quality Notes</div>
              {filtered.map((m) => (
                <div key={m.id} style={{ padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{m.name}</span>
                    <span style={{ fontSize: 10, color: m.tasksMissed > 3 ? C.red : C.primary, background: `${m.tasksMissed > 3 ? C.red : C.primary}15`, padding: "2px 8px", fontFamily: "DM Mono, monospace" }}>{m.tasksMissed > 3 ? "watch" : "stable"}</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.6 }}>{m.notes}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {activeTab === "utilization" ? (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "220px 100px 100px 100px 100px 120px", padding: "12px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "DM Mono, monospace", gap: 12 }}>
              {["Staff", "Billable", "Non-bill", "Total", "Util %", "Revenue gen"].map((h) => <span key={h}>{h}</span>)}
            </div>
            {filtered.map((m, idx) => {
              const nonBill = m.totalHours - m.billableHours;
              const revenue = Math.round(m.billableHours * (m.salary / 168) * 2.8);
              return (
                <div key={m.id} style={{ display: "grid", gridTemplateColumns: "220px 100px 100px 100px 100px 120px", padding: "13px 20px", borderBottom: idx < filtered.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar initials={m.avatar} color={m.color} size={28} />
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</span>
                  </div>
                  <span style={{ fontFamily: "DM Mono, monospace", color: C.primary, fontWeight: 700 }}>{m.billableHours}h</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: C.muted }}>{nonBill}h</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: C.muted }}>{m.totalHours}h</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: m.billablePct >= 80 ? C.primary : m.billablePct >= 70 ? C.amber : C.red, fontWeight: 700 }}>{m.billablePct}%</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: C.blue, fontWeight: 700 }}>R{(revenue / 1000).toFixed(0)}k</span>
                </div>
              );
            })}
          </div>
        ) : null}

        {activeTab === "incentive planner" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "220px 100px 100px 100px 140px", padding: "12px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "DM Mono, monospace", gap: 12 }}>
                {["Staff", "Delivery", "Util %", "CSAT", "Current bonus"].map((h) => <span key={h}>{h}</span>)}
              </div>
              {filtered.map((m, idx) => (
                <div key={m.id} style={{ display: "grid", gridTemplateColumns: "220px 100px 100px 100px 140px", padding: "13px 20px", borderBottom: idx < filtered.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar initials={m.avatar} color={m.color} size={28} />
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</span>
                  </div>
                  <span style={{ fontFamily: "DM Mono, monospace", color: barColor(m.deliveryScore), fontWeight: 700 }}>{m.deliveryScore}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: m.billablePct >= 80 ? C.primary : m.billablePct >= 70 ? C.amber : C.red, fontWeight: 700 }}>{m.billablePct}%</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: m.clientSat >= 8.5 ? C.primary : C.amber, fontWeight: 700 }}>{m.clientSat}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", color: m.bonusEligible ? C.primary : C.red, fontWeight: 700 }}>{m.bonusEligible ? `R${m.bonusAmount.toLocaleString()}` : "Not eligible"}</span>
                </div>
              ))}
            </div>

            <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Incentive Policy</div>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.7, marginBottom: 12 }}>
                Bonus eligibility should combine output and behavior signals. Do not tie payout to a single metric.
              </div>
              {[
                "Delivery score >= 80",
                "On-time rate >= 75%",
                "Billable utilization >= 70%",
                "Client satisfaction >= 8.0"
              ].map((rule) => (
                <div key={rule} style={{ fontSize: 12, color: C.text, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                  {rule}
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
                <span style={{ fontWeight: 700 }}>Total bonus pool</span>
                <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, color: C.primary }}>R{totalBonus.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

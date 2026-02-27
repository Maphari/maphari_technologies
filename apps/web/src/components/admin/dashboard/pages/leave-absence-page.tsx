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

type StaffMember = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  annualLeave: { total: number; used: number; pending: number };
  sickLeave: { total: number; used: number };
  familyLeave: { total: number; used: number };
};

type LeaveRequest = {
  id: string;
  employee: string;
  avatar: string;
  color: string;
  type: "Annual Leave" | "Sick Leave" | "Family Leave" | "Unpaid Leave";
  from: string;
  to: string;
  days: number;
  status: "pending" | "approved" | "declined";
  submittedDate: string;
  reason: string;
  cover: string | null;
};

const staff: StaffMember[] = [
  { id: "EMP-001", name: "Sipho Nkosi", role: "Founder & CEO", avatar: "SN", color: C.primary, annualLeave: { total: 21, used: 8, pending: 0 }, sickLeave: { total: 30, used: 2 }, familyLeave: { total: 3, used: 0 } },
  { id: "EMP-002", name: "Leilani Fotu", role: "Head of Operations", avatar: "LF", color: C.blue, annualLeave: { total: 21, used: 14, pending: 5 }, sickLeave: { total: 30, used: 6 }, familyLeave: { total: 3, used: 0 } },
  { id: "EMP-003", name: "Renzo Fabbri", role: "Creative Director", avatar: "RF", color: C.orange, annualLeave: { total: 21, used: 18, pending: 0 }, sickLeave: { total: 30, used: 12 }, familyLeave: { total: 3, used: 1 } },
  { id: "EMP-004", name: "Nomsa Dlamini", role: "Account Manager", avatar: "ND", color: C.primary, annualLeave: { total: 21, used: 6, pending: 3 }, sickLeave: { total: 30, used: 0 }, familyLeave: { total: 3, used: 0 } },
  { id: "EMP-005", name: "Kira Bosman", role: "UX Designer", avatar: "KB", color: C.amber, annualLeave: { total: 21, used: 10, pending: 0 }, sickLeave: { total: 30, used: 4 }, familyLeave: { total: 3, used: 0 } },
  { id: "EMP-006", name: "Tapiwa Moyo", role: "Copywriter", avatar: "TM", color: C.blue, annualLeave: { total: 21, used: 5, pending: 2 }, sickLeave: { total: 30, used: 1 }, familyLeave: { total: 3, used: 0 } }
];

const leaveRequests: LeaveRequest[] = [
  { id: "LEA-022", employee: "Leilani Fotu", avatar: "LF", color: C.blue, type: "Annual Leave", from: "Mar 10", to: "Mar 14", days: 5, status: "pending", submittedDate: "Feb 20", reason: "Family holiday", cover: "Sipho Nkosi" },
  { id: "LEA-021", employee: "Nomsa Dlamini", avatar: "ND", color: C.primary, type: "Annual Leave", from: "Mar 3", to: "Mar 5", days: 3, status: "pending", submittedDate: "Feb 18", reason: "Personal", cover: "Leilani Fotu" },
  { id: "LEA-020", employee: "Tapiwa Moyo", avatar: "TM", color: C.blue, type: "Annual Leave", from: "Feb 26", to: "Feb 27", days: 2, status: "approved", submittedDate: "Feb 14", reason: "Rest days", cover: null },
  { id: "LEA-019", employee: "Renzo Fabbri", avatar: "RF", color: C.orange, type: "Sick Leave", from: "Feb 10", to: "Feb 12", days: 3, status: "approved", submittedDate: "Feb 10", reason: "Flu - medical note attached", cover: "Sipho Nkosi" },
  { id: "LEA-018", employee: "Kira Bosman", avatar: "KB", color: C.amber, type: "Annual Leave", from: "Jan 26", to: "Feb 4", days: 8, status: "approved", submittedDate: "Jan 8", reason: "Summer leave", cover: "Renzo Fabbri" }
];

const statusConfig: Record<LeaveRequest["status"], { color: string; label: string }> = {
  pending: { color: C.amber, label: "Pending" },
  approved: { color: C.primary, label: "Approved" },
  declined: { color: C.red, label: "Declined" }
};

const typeColors: Record<LeaveRequest["type"], string> = {
  "Annual Leave": C.primary,
  "Sick Leave": C.red,
  "Family Leave": C.blue,
  "Unpaid Leave": C.muted
};

const tabs = ["leave requests", "leave balances", "calendar", "leave analytics"] as const;
type Tab = (typeof tabs)[number];
type FilterStatus = "All" | LeaveRequest["status"];

function Avatar({ initials, color, size = 32 }: { initials: string; color: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `${color}22`, border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.32, fontWeight: 700, color, fontFamily: "DM Mono, monospace", flexShrink: 0 }}>
      {initials}
    </div>
  );
}

export function LeaveAbsencePage() {
  const [activeTab, setActiveTab] = useState<Tab>("leave requests");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("All");

  const pending = leaveRequests.filter((r) => r.status === "pending");
  const totalDaysOut = leaveRequests.filter((r) => r.status === "approved").reduce((s, r) => s + r.days, 0);
  const lowBalance = staff.filter((m) => m.annualLeave.total - m.annualLeave.used - m.annualLeave.pending <= 3);
  const filtered = useMemo(() => (filterStatus === "All" ? leaveRequests : leaveRequests.filter((r) => r.status === filterStatus)), [filterStatus]);

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
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Leave & Absence</h1>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Leave requests, balances, calendar, and BCEA compliance</div>
        </div>
        <button style={{ background: C.primary, color: C.bg, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "DM Mono, monospace", border: "none" }}>+ Log Leave</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
        {[
          { label: "Pending Requests", value: pending.length.toString(), color: pending.length > 0 ? C.amber : C.primary, sub: "Awaiting approval" },
          { label: "Staff on Leave (Feb)", value: "1", color: C.blue, sub: "Tapiwa - Feb 26-27" },
          { label: "Low Leave Balances", value: lowBalance.length.toString(), color: lowBalance.length > 0 ? C.red : C.primary, sub: "≤ 3 days remaining" },
          { label: "Leave Days Used (YTD)", value: totalDaysOut.toString(), color: C.muted, sub: "Approved this FY" }
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
        {activeTab === "leave requests" ? (
          <AdminFilterBar panelColor={C.surface} borderColor={C.border}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "DM Mono, monospace" }}>Filters</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as FilterStatus)} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontFamily: "DM Mono, monospace", fontSize: 12 }}>
                <option value="All">Status: All</option>
                <option value="pending">Status: Pending</option>
                <option value="approved">Status: Approved</option>
                <option value="declined">Status: Declined</option>
              </select>
              {filterStatus !== "All" ? (
                <button onClick={() => setFilterStatus("All")} style={{ background: C.border, border: "none", color: C.text, padding: "8px 10px", fontSize: 11, cursor: "pointer", fontFamily: "DM Mono, monospace" }}>Clear</button>
              ) : null}
            </div>
          </AdminFilterBar>
        ) : null}

        {activeTab === "leave requests" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((req) => {
              const sc = statusConfig[req.status];
              const tc = typeColors[req.type] || C.muted;
              return (
                <div key={req.id} style={{ background: C.surface, border: `1px solid ${req.status === "pending" ? C.amber + "44" : C.border}`, padding: 20, display: "grid", gridTemplateColumns: "60px 160px 180px 130px 70px 130px 90px auto", alignItems: "center", gap: 12 }}>
                  <span style={{ fontFamily: "DM Mono, monospace", fontSize: 10, color: C.muted }}>{req.id}</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Avatar initials={req.avatar} color={req.color} size={28} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 12 }}>{req.employee.split(" ")[0]}</div>
                      <div style={{ fontSize: 9, color: C.muted }}>Submitted {req.submittedDate}</div>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: tc, fontWeight: 600 }}>{req.type}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>{req.reason}</div>
                  </div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11 }}>{req.from} → {req.to}</div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: C.blue, textAlign: "center" }}>{req.days}d</div>
                  <div>{req.cover ? <div style={{ fontSize: 11 }}>Cover: {req.cover.split(" ")[0]}</div> : <div style={{ fontSize: 11, color: C.muted }}>No cover set</div>}</div>
                  <span style={{ fontSize: 10, color: sc.color, background: `${sc.color}15`, padding: "4px 8px", fontFamily: "DM Mono, monospace", textAlign: "center" }}>{sc.label}</span>
                  {req.status === "pending" ? (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={{ background: C.primary, color: C.bg, border: "none", padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>✓</button>
                      <button style={{ background: C.red, color: "#fff", border: "none", padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>✗</button>
                    </div>
                  ) : <span />}
                </div>
              );
            })}
          </div>
        ) : null}

        {activeTab === "leave balances" ? (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 1fr 1fr 80px", padding: "12px 24px", borderBottom: `1px solid ${C.border}`, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", gap: 16 }}>
              {["Employee", "Annual Leave", "Sick Leave", "Family Leave", ""].map((h) => <span key={h}>{h}</span>)}
            </div>
            {staff.map((member, i) => {
              const alRemaining = member.annualLeave.total - member.annualLeave.used - member.annualLeave.pending;
              const slRemaining = member.sickLeave.total - member.sickLeave.used;
              const isLow = alRemaining <= 3;
              return (
                <div key={member.id} style={{ display: "grid", gridTemplateColumns: "220px 1fr 1fr 1fr 80px", padding: "16px 24px", borderBottom: i < staff.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center", gap: 16, background: isLow ? "#1a0a0a" : "transparent" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Avatar initials={member.avatar} color={member.color} size={28} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{member.name.split(" ")[0]}</div>
                      <div style={{ fontSize: 10, color: C.muted }}>{member.role}</div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: C.muted }}>{member.annualLeave.used}u {member.annualLeave.pending > 0 ? `+ ${member.annualLeave.pending}p` : ""}</span>
                      <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: isLow ? C.red : C.primary, fontWeight: 700 }}>{alRemaining}d left</span>
                    </div>
                    <div style={{ height: 6, background: C.border, overflow: "hidden", display: "flex" }}>
                      <div style={{ width: `${(member.annualLeave.used / member.annualLeave.total) * 100}%`, background: C.primary, opacity: 0.6 }} />
                      <div style={{ width: `${(member.annualLeave.pending / member.annualLeave.total) * 100}%`, background: C.amber }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: C.muted }}>{member.sickLeave.used} used</span>
                      <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: C.muted }}>{slRemaining}d left</span>
                    </div>
                    <div style={{ height: 6, background: C.border }}>
                      <div style={{ height: "100%", width: `${(member.sickLeave.used / member.sickLeave.total) * 100}%`, background: C.red, opacity: 0.7 }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: C.blue }}>{member.familyLeave.total - member.familyLeave.used}d / {member.familyLeave.total}d</div>
                  </div>
                  {isLow ? <span style={{ fontSize: 9, color: C.red, background: `${C.red}15`, padding: "2px 6px" }}>Low</span> : <span />}
                </div>
              );
            })}
          </div>
        ) : null}

        {activeTab === "calendar" ? (
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>March 2026 - Leave Overview</div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "140px repeat(23, 1fr)", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ padding: "10px 16px", fontSize: 10, color: C.muted }}>Staff</div>
                {Array.from({ length: 23 }, (_, i) => i + 3).map((d) => (
                  <div key={d} style={{ padding: "10px 4px", textAlign: "center", fontSize: 9, color: C.muted, borderLeft: `1px solid ${C.border}` }}>{d}</div>
                ))}
              </div>
              {staff.map((member, mi) => (
                <div key={member.id} style={{ display: "grid", gridTemplateColumns: "140px repeat(23, 1fr)", borderBottom: mi < staff.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <div style={{ padding: "10px 16px", display: "flex", gap: 8, alignItems: "center" }}>
                    <Avatar initials={member.avatar} color={member.color} size={20} />
                    <span style={{ fontSize: 11, color: member.color, fontWeight: 600 }}>{member.name.split(" ")[0]}</span>
                  </div>
                  {Array.from({ length: 23 }, (_, i) => {
                    const day = i + 3;
                    const isLeave =
                      (member.name === "Leilani Fotu" && day >= 10 && day <= 14) ||
                      (member.name === "Nomsa Dlamini" && day >= 3 && day <= 5);
                    const isPending = isLeave && leaveRequests.some((r) => r.employee === member.name && r.status === "pending");
                    return (
                      <div key={day} style={{ height: 36, borderLeft: `1px solid ${C.border}`, background: isLeave ? (isPending ? `${C.amber}33` : `${member.color}33`) : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {isLeave ? <div style={{ width: 6, height: 6, borderRadius: "50%", background: isPending ? C.amber : member.color }} /> : null}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <div style={{ width: 12, height: 12, background: `${C.primary}33` }} />
                <span style={{ fontSize: 11, color: C.muted }}>Approved leave</span>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <div style={{ width: 12, height: 12, background: `${C.amber}33` }} />
                <span style={{ fontSize: 11, color: C.muted }}>Pending leave</span>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "leave analytics" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>Annual Leave Utilisation</div>
              {staff.map((m) => {
                const used = m.annualLeave.used;
                const total = m.annualLeave.total;
                const pct = Math.round((used / total) * 100);
                return (
                  <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                    <Avatar initials={m.avatar} color={m.color} size={24} />
                    <span style={{ fontSize: 12, width: 80 }}>{m.name.split(" ")[0]}</span>
                    <div style={{ flex: 1, height: 8, background: C.border, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: pct >= 80 ? C.red : pct >= 60 ? C.amber : m.color }} />
                    </div>
                    <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: pct >= 80 ? C.red : C.muted, width: 32, textAlign: "right" }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Leave by Type (FY2026)</div>
                {[
                  { type: "Annual Leave", days: leaveRequests.filter((r) => r.type === "Annual Leave" && r.status === "approved").reduce((s, r) => s + r.days, 0), color: C.primary },
                  { type: "Sick Leave", days: leaveRequests.filter((r) => r.type === "Sick Leave" && r.status === "approved").reduce((s, r) => s + r.days, 0), color: C.red },
                  { type: "Family Leave", days: 0, color: C.blue }
                ].map((t) => (
                  <div key={t.type} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <span style={{ fontSize: 12, flex: 1, color: t.color }}>{t.type}</span>
                    <div style={{ width: 80, height: 8, background: C.border }}>
                      <div style={{ height: "100%", width: `${Math.min((t.days / 20) * 100, 100)}%`, background: t.color }} />
                    </div>
                    <span style={{ fontFamily: "DM Mono, monospace", color: t.color, fontWeight: 700, width: 24 }}>{t.days}d</span>
                  </div>
                ))}
              </div>
              <div style={{ background: "#0a0f1a", border: `1px solid ${C.blue}22`, padding: 20 }}>
                <div style={{ fontSize: 11, color: C.blue, fontWeight: 700, marginBottom: 8 }}>BCEA Compliance Note</div>
                <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.7 }}>
                  Staff are entitled to 21 consecutive days annual leave, 30 days sick leave per 3-year cycle, and 3 days family responsibility leave per year under BCEA guidelines.
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

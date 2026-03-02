"use client";

import { useMemo, useState } from "react";
import { cx, styles } from "../style";
import { colorClass } from "./admin-page-utils";
import { AdminFilterBar } from "./shared";

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
  { id: "EMP-001", name: "Sipho Nkosi", role: "Founder & CEO", avatar: "SN", color: "var(--accent)", annualLeave: { total: 21, used: 8, pending: 0 }, sickLeave: { total: 30, used: 2 }, familyLeave: { total: 3, used: 0 } },
  { id: "EMP-002", name: "Leilani Fotu", role: "Head of Operations", avatar: "LF", color: "var(--blue)", annualLeave: { total: 21, used: 14, pending: 5 }, sickLeave: { total: 30, used: 6 }, familyLeave: { total: 3, used: 0 } },
  { id: "EMP-003", name: "Renzo Fabbri", role: "Creative Director", avatar: "RF", color: "var(--amber)", annualLeave: { total: 21, used: 18, pending: 0 }, sickLeave: { total: 30, used: 12 }, familyLeave: { total: 3, used: 1 } },
  { id: "EMP-004", name: "Nomsa Dlamini", role: "Account Manager", avatar: "ND", color: "var(--accent)", annualLeave: { total: 21, used: 6, pending: 3 }, sickLeave: { total: 30, used: 0 }, familyLeave: { total: 3, used: 0 } },
  { id: "EMP-005", name: "Kira Bosman", role: "UX Designer", avatar: "KB", color: "var(--amber)", annualLeave: { total: 21, used: 10, pending: 0 }, sickLeave: { total: 30, used: 4 }, familyLeave: { total: 3, used: 0 } },
  { id: "EMP-006", name: "Tapiwa Moyo", role: "Copywriter", avatar: "TM", color: "var(--blue)", annualLeave: { total: 21, used: 5, pending: 2 }, sickLeave: { total: 30, used: 1 }, familyLeave: { total: 3, used: 0 } }
];

const leaveRequests: LeaveRequest[] = [
  { id: "LEA-022", employee: "Leilani Fotu", avatar: "LF", color: "var(--blue)", type: "Annual Leave", from: "Mar 10", to: "Mar 14", days: 5, status: "pending", submittedDate: "Feb 20", reason: "Family holiday", cover: "Sipho Nkosi" },
  { id: "LEA-021", employee: "Nomsa Dlamini", avatar: "ND", color: "var(--accent)", type: "Annual Leave", from: "Mar 3", to: "Mar 5", days: 3, status: "pending", submittedDate: "Feb 18", reason: "Personal", cover: "Leilani Fotu" },
  { id: "LEA-020", employee: "Tapiwa Moyo", avatar: "TM", color: "var(--blue)", type: "Annual Leave", from: "Feb 26", to: "Feb 27", days: 2, status: "approved", submittedDate: "Feb 14", reason: "Rest days", cover: null },
  { id: "LEA-019", employee: "Renzo Fabbri", avatar: "RF", color: "var(--amber)", type: "Sick Leave", from: "Feb 10", to: "Feb 12", days: 3, status: "approved", submittedDate: "Feb 10", reason: "Flu - medical note attached", cover: "Sipho Nkosi" },
  { id: "LEA-018", employee: "Kira Bosman", avatar: "KB", color: "var(--amber)", type: "Annual Leave", from: "Jan 26", to: "Feb 4", days: 8, status: "approved", submittedDate: "Jan 8", reason: "Summer leave", cover: "Renzo Fabbri" }
];

const statusConfig: Record<LeaveRequest["status"], { color: string; label: string }> = {
  pending: { color: "var(--amber)", label: "Pending" },
  approved: { color: "var(--accent)", label: "Approved" },
  declined: { color: "var(--red)", label: "Declined" }
};

const typeColors: Record<LeaveRequest["type"], string> = {
  "Annual Leave": "var(--accent)",
  "Sick Leave": "var(--red)",
  "Family Leave": "var(--blue)",
  "Unpaid Leave": "var(--muted)"
};

const tabs = ["leave requests", "leave balances", "calendar", "leave analytics"] as const;
type Tab = (typeof tabs)[number];
type FilterStatus = "All" | LeaveRequest["status"];

function Avatar({ initials, color, size = 32 }: { initials: string; color: string; size?: number }) {
  const sizeClass = size === 20 ? "lvaAvatar20" : size === 24 ? "lvaAvatar24" : size === 28 ? "lvaAvatar28" : "lvaAvatar32";
  return (
    <div className={cx(styles.lvaAvatar, toneVarClass(color), sizeClass)}>
      {initials}
    </div>
  );
}

function toneVarClass(color: string): string {
  switch (color) {
    case "var(--accent)":
      return styles.lvaToneAccent;
    case "var(--red)":
      return styles.lvaToneRed;
    case "var(--amber)":
      return styles.lvaToneAmber;
    case "var(--blue)":
      return styles.lvaToneBlue;
    case "var(--purple)":
      return styles.lvaTonePurple;
    default:
      return styles.lvaToneMuted;
  }
}

function statusPillClass(color: string): string {
  switch (color) {
    case "var(--accent)":
      return styles.lvaStatusAccent;
    case "var(--red)":
      return styles.lvaStatusRed;
    case "var(--amber)":
      return styles.lvaStatusAmber;
    case "var(--blue)":
      return styles.lvaStatusBlue;
    default:
      return styles.lvaStatusMuted;
  }
}

function fillClass(color: string): string {
  switch (color) {
    case "var(--accent)":
      return styles.lvaFillAccent;
    case "var(--red)":
      return styles.lvaFillRed;
    case "var(--amber)":
      return styles.lvaFillAmber;
    case "var(--blue)":
      return styles.lvaFillBlue;
    default:
      return styles.lvaFillMuted;
  }
}

export function LeaveAbsencePage() {
  const [activeTab, setActiveTab] = useState<Tab>("leave requests");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("All");

  const pending = leaveRequests.filter((r) => r.status === "pending");
  const totalDaysOut = leaveRequests.filter((r) => r.status === "approved").reduce((s, r) => s + r.days, 0);
  const lowBalance = staff.filter((m) => m.annualLeave.total - m.annualLeave.used - m.annualLeave.pending <= 3);
  const filtered = useMemo(() => (filterStatus === "All" ? leaveRequests : leaveRequests.filter((r) => r.status === filterStatus)), [filterStatus]);

  return (
    <div className={cx(styles.pageBody, styles.lvaRoot)}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / STAFF</div>
          <h1 className={styles.pageTitle}>Leave &amp; Absence</h1>
          <div className={styles.pageSub}>Leave requests, balances, calendar, and BCEA compliance</div>
        </div>
        <button type="button" className={cx("btnSm", "btnAccent")}>+ Log Leave</button>
      </div>

      <div className={cx("topCardsStack", "mb16") }>
        {[
          { label: "Pending Requests", value: pending.length.toString(), color: pending.length > 0 ? "var(--amber)" : "var(--accent)", sub: "Awaiting approval" },
          { label: "Staff on Leave (Feb)", value: "1", color: "var(--blue)", sub: "Tapiwa - Feb 26-27" },
          { label: "Low Leave Balances", value: lowBalance.length.toString(), color: lowBalance.length > 0 ? "var(--red)" : "var(--accent)", sub: "≤ 3 days remaining" },
          { label: "Leave Days Used (YTD)", value: totalDaysOut.toString(), color: "var(--muted)", sub: "Approved this FY" }
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, colorClass(s.color))}>{s.value}</div>
            <div className={cx("text11", "colorMuted")}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className={cx("overflowAuto", "minH0") }>
        <AdminFilterBar panelColor={"var(--surface)"} borderColor={"var(--border)"}>
          <select title="Select tab" value={activeTab} onChange={(e) => setActiveTab(e.target.value as Tab)} className={styles.formInput}>
            {tabs.map((tab) => (
              <option key={tab} value={tab}>{tab}</option>
            ))}
          </select>
          {activeTab === "leave requests" ? (
            <select
              title="Filter by request status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className={styles.formInput}
            >
              <option value="All">Status: All</option>
              <option value="pending">Status: Pending</option>
              <option value="approved">Status: Approved</option>
              <option value="declined">Status: Declined</option>
            </select>
          ) : null}
        </AdminFilterBar>

        {activeTab === "leave requests" ? (
          <div className={styles.lvaReqList}>
            {filtered.map((req) => {
              const sc = statusConfig[req.status];
              const tc = typeColors[req.type] || "var(--muted)";
              return (
                <div
                  key={req.id}
                  className={cx(styles.lvaReqRow, req.status === "pending" && styles.lvaReqRowPending)}
                >
                  <span className={styles.lvaReqId}>{req.id}</span>
                  <div className={styles.lvaEmpCell}>
                    <Avatar initials={req.avatar} color={req.color} size={28} />
                    <div>
                      <div className={styles.lvaEmpName}>{req.employee.split(" ")[0]}</div>
                      <div className={styles.lvaReqDate}>Submitted {req.submittedDate}</div>
                    </div>
                  </div>
                  <div>
                    <div className={cx(styles.lvaReqType, colorClass(tc))}>{req.type}</div>
                    <div className={styles.lvaReqReason}>{req.reason}</div>
                  </div>
                  <div className={styles.lvaReqPeriod}>{req.from} - {req.to}</div>
                  <div className={styles.lvaReqDays}>{req.days}d</div>
                  <div>
                    {req.cover ? <div className={styles.lvaReqCover}>Cover: {req.cover.split(" ")[0]}</div> : <div className={styles.lvaReqNoCover}>No cover set</div>}
                  </div>
                  <span className={cx(styles.lvaStatusPill, statusPillClass(sc.color))}>{sc.label}</span>
                  {req.status === "pending" ? (
                    <div className={styles.lvaReqActions}>
                      <button type="button" className={styles.lvaApproveBtn}>✓</button>
                      <button type="button" className={styles.lvaDeclineBtn}>✗</button>
                    </div>
                  ) : <span />}
                </div>
              );
            })}
          </div>
        ) : null}

        {activeTab === "leave balances" ? (
          <div className={styles.lvaTableCard}>
            <div className={cx(styles.lvaBalHead, "fontMono", "text10", "colorMuted", "uppercase")}>
              {["Employee", "Annual Leave", "Sick Leave", "Family Leave", ""].map((h) => <span key={h}>{h}</span>)}
            </div>
            {staff.map((member, i) => {
              const alRemaining = member.annualLeave.total - member.annualLeave.used - member.annualLeave.pending;
              const slRemaining = member.sickLeave.total - member.sickLeave.used;
              const isLow = alRemaining <= 3;
              return (
                <div key={member.id} className={cx(styles.lvaBalRow, i < staff.length - 1 && "borderB", isLow && styles.lvaBalLow)}>
                  <div className={styles.lvaEmpCell}>
                    <Avatar initials={member.avatar} color={member.color} size={28} />
                    <div>
                      <div className={styles.lvaEmpName}>{member.name.split(" ")[0]}</div>
                      <div className={styles.lvaRole}>{member.role}</div>
                    </div>
                  </div>
                  <div>
                    <div className={styles.lvaRowHead}>
                      <span className={styles.lvaLabel}>{member.annualLeave.used}u {member.annualLeave.pending > 0 ? `+ ${member.annualLeave.pending}p` : ""}</span>
                      <span className={cx(styles.lvaRemain, isLow ? "colorRed" : "colorAccent")}>{alRemaining}d left</span>
                    </div>
                    <progress
                      className={cx(styles.lvaMiniBar, member.annualLeave.pending > 0 ? styles.lvaAnnualPendingFill : styles.lvaAnnualUsedFill)}
                      max={member.annualLeave.total}
                      value={member.annualLeave.used + member.annualLeave.pending}
                      aria-label={`${member.name} annual leave usage`}
                    />
                  </div>
                  <div>
                    <div className={styles.lvaRowHead}>
                      <span className={styles.lvaLabel}>{member.sickLeave.used} used</span>
                      <span className={styles.lvaSickRemain}>{slRemaining}d left</span>
                    </div>
                    <progress className={cx(styles.lvaMiniBar, styles.lvaSickFill)} max={member.sickLeave.total} value={member.sickLeave.used} aria-label={`${member.name} sick leave usage`} />
                  </div>
                  <div>
                    <div className={styles.lvaFamilyRemain}>{member.familyLeave.total - member.familyLeave.used}d / {member.familyLeave.total}d</div>
                  </div>
                  {isLow ? <span className={styles.lvaLowPill}>Low</span> : <span />}
                </div>
              );
            })}
          </div>
        ) : null}

        {activeTab === "calendar" ? (
          <div>
            <div className={styles.lvaSectionTitle}>March 2026 - Leave Overview</div>
            <div className={styles.lvaTableCard}>
              <div className={styles.lvaCalHead}>
                <div className={styles.lvaCalStaff}>Staff</div>
                {Array.from({ length: 23 }, (_, i) => i + 3).map((d) => (
                  <div key={d} className={styles.lvaCalDayHead}>{d}</div>
                ))}
              </div>
              {staff.map((member, mi) => (
                <div key={member.id} className={cx(styles.lvaCalRow, mi < staff.length - 1 && "borderB")}>
                  <div className={styles.lvaCalStaffCell}>
                    <Avatar initials={member.avatar} color={member.color} size={20} />
                    <span className={cx(styles.lvaCalName, colorClass(member.color))}>{member.name.split(" ")[0]}</span>
                  </div>
                  {Array.from({ length: 23 }, (_, i) => {
                    const day = i + 3;
                    const isLeave =
                      (member.name === "Leilani Fotu" && day >= 10 && day <= 14) ||
                      (member.name === "Nomsa Dlamini" && day >= 3 && day <= 5);
                    const isPending = isLeave && leaveRequests.some((r) => r.employee === member.name && r.status === "pending");
                    return (
                      <div
                        key={day}
                        className={cx(
                          styles.lvaCalDayCell,
                          isLeave && (isPending ? styles.lvaCalDayPending : styles.lvaCalDayLeave),
                          isLeave && !isPending && toneVarClass(member.color)
                        )}
                      >
                        {isLeave ? <div className={cx(styles.lvaCalDot, isPending ? styles.lvaFillAmber : fillClass(member.color))} /> : null}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className={styles.lvaLegendRow}>
              <div className={styles.lvaLegendItem}>
                <div className={styles.lvaLegendApproved} />
                <span className={cx("text11", "colorMuted")}>Approved leave</span>
              </div>
              <div className={styles.lvaLegendItem}>
                <div className={styles.lvaLegendPending} />
                <span className={cx("text11", "colorMuted")}>Pending leave</span>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "leave analytics" ? (
          <div className={styles.lvaAnalyticsSplit}>
            <div className={cx("card", "p24") }>
              <div className={styles.lvaSectionTitle}>Annual Leave Utilisation</div>
              {staff.map((m) => {
                const used = m.annualLeave.used;
                const total = m.annualLeave.total;
                const pct = Math.round((used / total) * 100);
                return (
                  <div key={m.name} className={styles.lvaUtilRow}>
                    <Avatar initials={m.avatar} color={m.color} size={24} />
                    <span className={styles.lvaUtilName}>{m.name.split(" ")[0]}</span>
                    <progress className={cx(styles.lvaUtilTrack, pct >= 80 ? styles.lvaFillRed : pct >= 60 ? styles.lvaFillAmber : fillClass(m.color))} max={100} value={pct} aria-label={`${m.name} annual leave utilisation ${pct}%`} />
                    <span className={cx(styles.lvaUtilPct, pct >= 80 ? "colorRed" : "colorMuted")}>{pct}%</span>
                  </div>
                );
              })}
            </div>
            <div className={cx("flexCol", "gap16") }>
              <div className={cx("card", "p24") }>
                <div className={styles.lvaSectionTitle}>Leave by Type (FY2026)</div>
                {[
                  { type: "Annual Leave", days: leaveRequests.filter((r) => r.type === "Annual Leave" && r.status === "approved").reduce((s, r) => s + r.days, 0), color: "var(--accent)" },
                  { type: "Sick Leave", days: leaveRequests.filter((r) => r.type === "Sick Leave" && r.status === "approved").reduce((s, r) => s + r.days, 0), color: "var(--red)" },
                  { type: "Family Leave", days: 0, color: "var(--blue)" }
                ].map((t) => (
                  <div key={t.type} className={styles.lvaTypeRow}>
                    <span className={cx(styles.lvaTypeName, colorClass(t.color))}>{t.type}</span>
                    <progress className={cx(styles.lvaTypeTrack, fillClass(t.color))} max={20} value={Math.min(t.days, 20)} aria-label={`${t.type} days ${t.days}`} />
                    <span className={cx(styles.lvaTypeDays, colorClass(t.color))}>{t.days}d</span>
                  </div>
                ))}
              </div>
              <div className={styles.lvaComplianceCard}>
                <div className={styles.lvaComplianceTitle}>BCEA Compliance Note</div>
                <div className={styles.lvaComplianceText}>
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

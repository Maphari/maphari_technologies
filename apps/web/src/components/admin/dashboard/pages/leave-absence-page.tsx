// ════════════════════════════════════════════════════════════════════════════
// leave-absence-page.tsx — Admin Leave & Absence
// Data     : loadLeaveRequestsWithRefresh → GET /leave-requests
//            loadAllStaffWithRefresh      → GET /staff
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useMemo, useState } from "react";
import { cx, styles } from "../style";
import { colorClass } from "./admin-page-utils";
import { AdminFilterBar } from "./shared";
import type { AuthSession } from "../../../../lib/auth/session";
import {
  loadLeaveRequestsWithRefresh,
  loadAllStaffWithRefresh,
  approveLeaveRequestWithRefresh,
  declineLeaveRequestWithRefresh,
  type AdminLeaveRequest,
} from "../../../../lib/api/admin";
import { saveSession } from "../../../../lib/auth/session";

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

export function LeaveAbsencePage({ session }: { session: AuthSession | null }) {
  const [activeTab, setActiveTab] = useState<Tab>("leave requests");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("All");
  const [apiRequests, setApiRequests] = useState<AdminLeaveRequest[]>([]);
  const [staffLookup, setStaffLookup] = useState<Record<string, { name: string; initials: string; color: string }>>({});

  useEffect(() => {
    if (!session) return;
    Promise.all([loadLeaveRequestsWithRefresh(session), loadAllStaffWithRefresh(session)]).then(([lr, sr]) => {
      if (lr.nextSession) saveSession(lr.nextSession);
      else if (sr.nextSession) saveSession(sr.nextSession);
      if (!lr.error && lr.data) setApiRequests(lr.data);
      if (!sr.error && sr.data) {
        const map: Record<string, { name: string; initials: string; color: string }> = {};
        for (const s of sr.data) {
          map[s.id] = { name: s.name, initials: s.avatarInitials ?? s.name.slice(0, 2).toUpperCase(), color: s.avatarColor ?? "var(--accent)" };
        }
        setStaffLookup(map);
      }
    });
  }, [session]);

  const leaveRequests = useMemo<LeaveRequest[]>(() => apiRequests.map((r) => {
    const sm = staffLookup[r.staffId];
    const validTypes = ["Annual Leave", "Sick Leave", "Family Leave", "Unpaid Leave"];
    const st = r.status.toLowerCase();
    return {
      id: `LEA-${r.id.slice(0, 3).toUpperCase()}`,
      employee: sm?.name ?? r.staffId.slice(0, 8),
      avatar: sm?.initials ?? "??",
      color: sm?.color ?? "var(--accent)",
      type: (validTypes.includes(r.type) ? r.type : "Annual Leave") as LeaveRequest["type"],
      from: new Date(r.startDate).toLocaleDateString("en-ZA", { day: "numeric", month: "short" }),
      to: new Date(r.endDate).toLocaleDateString("en-ZA", { day: "numeric", month: "short" }),
      days: r.days,
      status: (st === "pending" || st === "approved" || st === "declined" ? st : "pending") as LeaveRequest["status"],
      submittedDate: new Date(r.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short" }),
      reason: r.notes ?? "—",
      cover: null,
    };
  }), [apiRequests, staffLookup]);

  const handleApprove = async (id: string) => {
    if (!session) return;
    const result = await approveLeaveRequestWithRefresh(session, id);
    if (result.nextSession) saveSession(result.nextSession);
    if (!result.error && result.data) setApiRequests((prev) => prev.map((r) => r.id === id ? result.data! : r));
  };

  const handleDecline = async (id: string) => {
    if (!session) return;
    const result = await declineLeaveRequestWithRefresh(session, id);
    if (result.nextSession) saveSession(result.nextSession);
    if (!result.error && result.data) setApiRequests((prev) => prev.map((r) => r.id === id ? result.data! : r));
  };

  const pending = leaveRequests.filter((r) => r.status === "pending");
  const totalDaysOut = leaveRequests.filter((r) => r.status === "approved").reduce((s, r) => s + r.days, 0);
  const lowBalance = 0; // leave balance data not available from API
  const filtered = useMemo(() => (filterStatus === "All" ? leaveRequests : leaveRequests.filter((r) => r.status === filterStatus)), [filterStatus, leaveRequests]);

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
          { label: "Staff on Leave", value: leaveRequests.filter((r) => r.status === "approved").length.toString(), color: "var(--blue)", sub: "Currently approved leave" },
          { label: "Low Leave Balances", value: lowBalance.toString(), color: lowBalance > 0 ? "var(--red)" : "var(--accent)", sub: "≤ 3 days remaining" },
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
                      <button type="button" className={styles.lvaApproveBtn} onClick={() => void handleApprove(req.id)}>✓</button>
                      <button type="button" className={styles.lvaDeclineBtn} onClick={() => void handleDecline(req.id)}>✗</button>
                    </div>
                  ) : <span />}
                </div>
              );
            })}
          </div>
        ) : null}

        {activeTab === "leave balances" ? (
          <div className={cx("emptyState")}>
            <div className={cx("emptyStateTitle")}>Leave balance tracking not available</div>
            <p className={cx("emptyStateSub")}>
              Per-employee leave balances (annual, sick, and family leave quotas) are managed in the HR
              system and are not yet surfaced via the dashboard API. Contact Maphari HR to review
              individual leave entitlements.
            </p>
          </div>
        ) : null}

        {activeTab === "calendar" ? (() => {
          const calStaff = Object.entries(staffLookup);
          return (
            <div>
              <div className={styles.lvaSectionTitle}>March 2026 — Leave Overview</div>
              {calStaff.length === 0 ? (
                <div className={cx("colorMuted2", "text12", "mt16")}>No staff data available.</div>
              ) : (
                <div className={styles.lvaTableCard}>
                  <div className={styles.lvaCalHead}>
                    <div className={styles.lvaCalStaff}>Staff</div>
                    {Array.from({ length: 23 }, (_, i) => i + 3).map((d) => (
                      <div key={d} className={styles.lvaCalDayHead}>{d}</div>
                    ))}
                  </div>
                  {calStaff.map(([sid, m], mi) => {
                    const hasApproved = leaveRequests.some((r) => r.employee === m.name && r.status === "approved");
                    const hasPending  = leaveRequests.some((r) => r.employee === m.name && r.status === "pending");
                    return (
                      <div key={sid} className={cx(styles.lvaCalRow, mi < calStaff.length - 1 && "borderB")}>
                        <div className={styles.lvaCalStaffCell}>
                          <Avatar initials={m.initials} color={m.color} size={20} />
                          <span className={cx(styles.lvaCalName, colorClass(m.color))}>{m.name.split(" ")[0]}</span>
                        </div>
                        {Array.from({ length: 23 }, (_, i) => {
                          const isLeave   = hasApproved;
                          const isPending = hasPending;
                          return (
                            <div
                              key={i}
                              className={cx(
                                styles.lvaCalDayCell,
                                isLeave && (isPending ? styles.lvaCalDayPending : styles.lvaCalDayLeave),
                                isLeave && !isPending && toneVarClass(m.color)
                              )}
                            >
                              {isLeave ? <div className={cx(styles.lvaCalDot, isPending ? styles.lvaFillAmber : fillClass(m.color))} /> : null}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
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
          );
        })() : null}

        {activeTab === "leave analytics" ? (
          <div className={styles.lvaAnalyticsSplit}>
            <div className={cx("card", "p24")}>
              <div className={styles.lvaSectionTitle}>Leave by Type (FY2026)</div>
              {[
                { type: "Annual Leave", days: leaveRequests.filter((r) => r.type === "Annual Leave" && r.status === "approved").reduce((s, r) => s + r.days, 0), color: "var(--accent)" },
                { type: "Sick Leave",   days: leaveRequests.filter((r) => r.type === "Sick Leave"   && r.status === "approved").reduce((s, r) => s + r.days, 0), color: "var(--red)"    },
                { type: "Family Leave", days: leaveRequests.filter((r) => r.type === "Family Leave" && r.status === "approved").reduce((s, r) => s + r.days, 0), color: "var(--blue)"   },
                { type: "Unpaid Leave", days: leaveRequests.filter((r) => r.type === "Unpaid Leave" && r.status === "approved").reduce((s, r) => s + r.days, 0), color: "var(--muted)"  },
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
                Staff are entitled to 21 consecutive days annual leave, 30 days sick leave per 3-year cycle,
                and 3 days family responsibility leave per year under BCEA guidelines.
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

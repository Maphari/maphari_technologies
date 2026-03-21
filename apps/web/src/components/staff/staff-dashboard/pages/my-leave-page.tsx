// ════════════════════════════════════════════════════════════════════════════
// my-leave-page.tsx — Staff My Leave
// Data     : loadMyLeaveRequestsWithRefresh → GET /leave-requests
//            submitLeaveRequestWithRefresh  → POST /leave-requests
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useMemo, useState } from "react";
import { cx } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import {
  loadMyLeaveRequestsWithRefresh,
  submitLeaveRequestWithRefresh,
  type StaffLeaveRecord,
} from "../../../../lib/api/staff";
import { saveSession } from "../../../../lib/auth/session";

// Keep static balances — API doesn't yet return per-type leave balance breakdown
const leaveBalances = [
  { type: "Annual Leave",          total: 21, used: 0, pending: 0 },
  { type: "Sick Leave",            total: 10, used: 0, pending: 0 },
  { type: "Family Responsibility", total: 3,  used: 0, pending: 0 },
  { type: "Study Leave",           total: 5,  used: 0, pending: 0 },
];

const LEAVE_TYPES = [
  { value: "Annual Leave",           label: "Annual Leave" },
  { value: "Sick Leave",             label: "Sick Leave" },
  { value: "Personal Leave",         label: "Personal Leave" },
  { value: "Family Responsibility",  label: "Family Responsibility" },
] as const;

function statusCls(s: string) {
  if (s === "Approved") return "mlvStatusApproved";
  if (s === "Pending")  return "mlvStatusPending";
  return "mlvStatusRejected";
}

function usedFillCls(used: number, total: number) {
  const pct = (used / total) * 100;
  if (pct >= 90) return "mlvBarFillRed";
  if (pct >= 75) return "mlvBarFillAmber";
  return "mlvBarFillAccent";
}

/** Count calendar days (inclusive) between two ISO date strings. Returns 0 on invalid input. */
function daysBetween(start: string, end: string): number {
  if (!start || !end) return 0;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (isNaN(s) || isNaN(e) || e < s) return 0;
  return Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
}

interface PageProps {
  isActive: boolean;
  session: AuthSession | null;
  onNotify?: (tone: "success" | "error" | "info" | "warning", msg: string) => void;
}

export function MyLeavePage({ isActive, session, onNotify }: PageProps) {
  const [apiLeave, setApiLeave] = useState<StaffLeaveRecord[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  // ── Apply for Leave modal state ────────────────────────────────────────────
  const [applyModalOpen,  setApplyModalOpen]  = useState(false);
  const [leaveType,       setLeaveType]       = useState("Annual Leave");
  const [startDate,       setStartDate]       = useState("");
  const [endDate,         setEndDate]         = useState("");
  const [leaveReason,     setLeaveReason]     = useState("");
  const [submittingLeave, setSubmittingLeave] = useState(false);

  useEffect(() => {
    if (!session || !isActive) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    void loadMyLeaveRequestsWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error || !r.data) {
        setError(r.error?.message ?? "Failed to load data. Please try again.");
        return;
      }
      setApiLeave(r.data);
    }).catch((err: unknown) => {
      setError((err as Error)?.message ?? "Failed to load data.");
    }).finally(() => setLoading(false));
  }, [session?.accessToken, isActive]);

  const leaveHistory = useMemo(() =>
    apiLeave.map((l) => {
      const st = l.status.charAt(0).toUpperCase() + l.status.slice(1).toLowerCase();
      return {
        id:         `LV-${l.id.slice(0, 3).toUpperCase()}`,
        type:       l.type,
        startDate:  new Date(l.startDate).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }),
        endDate:    new Date(l.endDate).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }),
        days:       l.days,
        status:     st === "Approved" ? "Approved" : st === "Declined" ? "Declined" : "Pending",
        approvedBy: l.approverId ? l.approverId.slice(0, 6) + "…" : "—",
      };
    }),
  [apiLeave]);

  const totalDays  = leaveBalances.reduce((s, lb) => s + lb.total,                          0);
  const totalUsed  = leaveBalances.reduce((s, lb) => s + lb.used,                           0);
  const totalPend  = leaveBalances.reduce((s, lb) => s + lb.pending,                        0);
  const totalAvail = leaveBalances.reduce((s, lb) => s + lb.total - lb.used - lb.pending,   0);

  // ── Submit handler ─────────────────────────────────────────────────────────
  async function handleSubmitLeave() {
    if (!startDate || !endDate) {
      onNotify?.("error", "Please select start and end dates.");
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      onNotify?.("error", "End date cannot be before start date.");
      return;
    }
    if (!session) {
      onNotify?.("error", "Session expired. Please log in again.");
      return;
    }
    setSubmittingLeave(true);
    const days = daysBetween(startDate, endDate);
    const r = await submitLeaveRequestWithRefresh(session, {
      type:      leaveType,
      startDate,
      endDate,
      days,
      notes:     leaveReason || undefined,
    });
    if (r.nextSession) saveSession(r.nextSession);
    setSubmittingLeave(false);
    if (r.error || !r.data) {
      onNotify?.("error", r.error?.message ?? "Failed to submit leave request. Please try again.");
      return;
    }
    // Optimistically append the new record to the history list
    setApiLeave((prev) => [...prev, r.data!]);
    onNotify?.("success", "Leave application submitted. Your manager will review it.");
    setApplyModalOpen(false);
    setStartDate("");
    setEndDate("");
    setLeaveReason("");
    setLeaveType("Annual Leave");
  }

  function handleCloseModal() {
    if (submittingLeave) return;
    setApplyModalOpen(false);
    setStartDate("");
    setEndDate("");
    setLeaveReason("");
    setLeaveType("Annual Leave");
  }

  if (loading) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-my-leave">
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-my-leave">
        <div className={cx("errorState")}>
          <div className={cx("errorStateIcon")}>✕</div>
          <div className={cx("errorStateTitle")}>Failed to load</div>
          <div className={cx("errorStateSub")}>{error}</div>
        </div>
      </section>
    );
  }

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-my-leave">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / HR</div>
        <div className={cx("flexRow")} style={{ alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h1 className={cx("pageTitleText")}>My Leave</h1>
            <p className={cx("pageSubtitleText", "mb20")}>Leave balances, applications, and history</p>
          </div>
          <button
            type="button"
            className={cx("btnAccent")}
            onClick={() => setApplyModalOpen(true)}
            style={{ flexShrink: 0, marginTop: 4 }}
          >
            + Apply for Leave
          </button>
        </div>
      </div>

      {/* ── Summary strip ────────────────────────────────────────────────── */}
      <div className={cx("staffKpiStrip")}>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>Total Entitlement</div>
          <div className={cx("staffKpiValue")}>{totalDays}</div>
          <div className={cx("staffKpiSub")}>days across all types</div>
        </div>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>Days Used</div>
          <div className={cx("staffKpiValue", "colorAmber")}>{totalUsed}</div>
          <div className={cx("staffKpiSub")}>taken this cycle</div>
        </div>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>Available</div>
          <div className={cx("staffKpiValue", "colorGreen")}>{totalAvail}</div>
          <div className={cx("staffKpiSub")}>days remaining</div>
        </div>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>Pending</div>
          <div className={cx("staffKpiValue", totalPend > 0 ? "colorAccent" : "colorGreen")}>{totalPend}</div>
          <div className={cx("staffKpiSub")}>{totalPend > 0 ? "awaiting approval" : "none pending"}</div>
        </div>
      </div>

      {/* ── Leave balances ────────────────────────────────────────────────── */}
      <div className={cx("mlvSection")}>

        <div className={cx("mlvSectionHeader")}>
          <div className={cx("mlvSectionTitle")}>Leave Balances</div>
          <span className={cx("mlvSectionMeta")}>{leaveBalances.length} TYPES</span>
        </div>

        <div className={cx("mlvBalGrid")}>
          {leaveBalances.map((lb) => {
            const available = lb.total - lb.used - lb.pending;
            const usedPct   = Math.round((lb.used    / lb.total) * 100);
            const pendPct   = Math.round((lb.pending / lb.total) * 100);

            return (
              <div key={lb.type} className={cx("mlvBalCard")}>

                {/* Type label + available */}
                <div className={cx("mlvBalTop")}>
                  <div className={cx("mlvBalType")}>{lb.type}</div>
                  <div className={cx("mlvBalAvailable", available === 0 ? "colorRed" : "colorAccent")}>
                    {available}<span className={cx("mlvBalSuffix")}>/{lb.total}</span>
                  </div>
                </div>

                {/* Used + pending bar */}
                <div className={cx("mlvBalBarWrap")}>
                  <div className={cx("mlvBalBarMeta")}>
                    <span className={cx("mlvBalBarLabel")}>Used{lb.pending > 0 ? " + Pending" : ""}</span>
                    <span className={cx("mlvBalBarPct")}>{usedPct + pendPct}%</span>
                  </div>
                  <div className={cx("mlvBalTrack")}>
                    <div className={cx("mlvBalFill", usedFillCls(lb.used, lb.total))} style={{ '--pct': `${usedPct}%` } as React.CSSProperties} />
                    {lb.pending > 0 && (
                      <div className={cx("mlvBalFillPending")} style={{ '--pct': `${pendPct}%` } as React.CSSProperties} />
                    )}
                  </div>
                </div>

                {/* Used / Pending / Remaining breakdown */}
                <div className={cx("mlvBalMetrics")}>
                  <div className={cx("mlvBalMetricCell")}>
                    <div className={cx("mlvBalMetricLabel")}>Used</div>
                    <div className={cx("mlvBalMetricValue", "colorAmber")}>{lb.used}d</div>
                  </div>
                  <div className={cx("mlvBalMetricCell")}>
                    <div className={cx("mlvBalMetricLabel")}>Pending</div>
                    <div className={cx("mlvBalMetricValue", lb.pending > 0 ? "colorAccent" : "colorMuted2")}>{lb.pending}d</div>
                  </div>
                  <div className={cx("mlvBalMetricCell")}>
                    <div className={cx("mlvBalMetricLabel")}>Remaining</div>
                    <div className={cx("mlvBalMetricValue", available > 0 ? "colorGreen" : "colorRed")}>{available}d</div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>

      {/* ── Leave history ────────────────────────────────────────────────── */}
      <div className={cx("mlvSection")}>

        <div className={cx("mlvSectionHeader")}>
          <div className={cx("mlvSectionTitle")}>Leave History</div>
          <span className={cx("mlvSectionMeta")}>{apiLeave.length} RECORDS</span>
        </div>

        <div className={cx("mlvHistoryList")}>
          {leaveHistory.map((lv, idx) => (
            <div key={lv.id} className={cx("mlvHistoryCard", idx === leaveHistory.length - 1 && "mlvHistoryCardLast")}>

              {/* Head: type | status */}
              <div className={cx("mlvHistHead")}>
                <div className={cx("mlvHistType")}>{lv.type}</div>
                <span className={cx("mlvHistStatus", statusCls(lv.status))}>{lv.status}</span>
              </div>

              {/* Date range + day count */}
              <div className={cx("mlvHistDates")}>
                <span className={cx("mlvHistDateRange")}>{lv.startDate} → {lv.endDate}</span>
                <span className={cx("mlvHistDayCount")}>{lv.days} day{lv.days !== 1 ? "s" : ""}</span>
              </div>

              {/* Footer: ID + approver */}
              <div className={cx("mlvHistFooter")}>
                <span className={cx("mlvHistId")}>{lv.id}</span>
                <span className={cx("mlvHistFooterSep")} />
                <span className={cx("mlvHistApprover")}>
                  {lv.status === "Pending" ? "Awaiting approval" : `Approved by ${lv.approvedBy}`}
                </span>
              </div>

            </div>
          ))}
        </div>

      </div>

      {/* ── Apply for Leave Modal ─────────────────────────────────────────── */}
      {applyModalOpen && (
        <div
          className={cx("cmdOverlay")}
          style={{ paddingTop: "12vh" }}
          onClick={(e) => { if (e.target === e.currentTarget) handleCloseModal(); }}
        >
          <div
            className={cx("cmdPanel")}
            style={{ width: 480, maxHeight: "80vh", overflowY: "auto", padding: "24px" }}
            role="dialog"
            aria-modal="true"
            aria-label="Apply for Leave"
          >

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div className={cx("mlvSectionTitle")}>Apply for Leave</div>
                <div className={cx("mlvStatMeta")} style={{ marginTop: 4 }}>Submit a new leave request for manager approval</div>
              </div>
              <button
                type="button"
                className={cx("btnGhost")}
                onClick={handleCloseModal}
                disabled={submittingLeave}
                aria-label="Close"
                style={{ padding: "4px 8px", fontSize: "1rem" }}
              >
                ✕
              </button>
            </div>

            {/* Leave Type */}
            <div className={cx("formGroup")} style={{ marginBottom: 16 }}>
              <label htmlFor="mlv-leave-type" className={cx("mlvStatLabel")} style={{ display: "block", marginBottom: 6 }}>
                Leave Type
              </label>
              <select
                id="mlv-leave-type"
                className={cx("selectInput")}
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                disabled={submittingLeave}
                style={{ width: "100%" }}
              >
                {LEAVE_TYPES.map((lt) => (
                  <option key={lt.value} value={lt.value}>{lt.label}</option>
                ))}
              </select>
            </div>

            {/* Date row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div className={cx("formGroup")}>
                <label htmlFor="mlv-start-date" className={cx("mlvStatLabel")} style={{ display: "block", marginBottom: 6 }}>
                  Start Date
                </label>
                <input
                  id="mlv-start-date"
                  type="date"
                  className={cx("formInput")}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={submittingLeave}
                  style={{ width: "100%" }}
                />
              </div>
              <div className={cx("formGroup")}>
                <label htmlFor="mlv-end-date" className={cx("mlvStatLabel")} style={{ display: "block", marginBottom: 6 }}>
                  End Date
                </label>
                <input
                  id="mlv-end-date"
                  type="date"
                  className={cx("formInput")}
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={submittingLeave}
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            {/* Day count preview */}
            {startDate && endDate && daysBetween(startDate, endDate) > 0 && (
              <div className={cx("mlvStatMeta")} style={{ marginBottom: 16 }}>
                Duration: <strong>{daysBetween(startDate, endDate)} day{daysBetween(startDate, endDate) !== 1 ? "s" : ""}</strong> (inclusive)
              </div>
            )}

            {/* Reason */}
            <div className={cx("formGroup")} style={{ marginBottom: 24 }}>
              <label htmlFor="mlv-reason" className={cx("mlvStatLabel")} style={{ display: "block", marginBottom: 6 }}>
                Reason <span className={cx("mlvStatMeta")}>(optional)</span>
              </label>
              <textarea
                id="mlv-reason"
                className={cx("formTextarea")}
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                placeholder="Briefly describe the reason for your leave request…"
                rows={3}
                disabled={submittingLeave}
                style={{ width: "100%", resize: "vertical" }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                className={cx("btnGhost")}
                onClick={handleCloseModal}
                disabled={submittingLeave}
              >
                Cancel
              </button>
              <button
                type="button"
                className={cx("btnAccent")}
                onClick={() => { void handleSubmitLeave(); }}
                disabled={submittingLeave || !startDate || !endDate}
              >
                {submittingLeave ? "Submitting…" : "Submit Request"}
              </button>
            </div>

          </div>
        </div>
      )}

    </section>
  );
}

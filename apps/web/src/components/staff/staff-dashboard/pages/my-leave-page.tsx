// ════════════════════════════════════════════════════════════════════════════
// my-leave-page.tsx — Staff My Leave
// Data     : loadMyLeaveRequestsWithRefresh → GET /leave-requests
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useMemo, useState } from "react";
import { cx } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { loadMyLeaveRequestsWithRefresh, type StaffLeaveRecord } from "../../../../lib/api/staff";
import { saveSession } from "../../../../lib/auth/session";

// Keep static balances — API doesn't yet return per-type leave balance breakdown
const leaveBalances = [
  { type: "Annual Leave",          total: 21, used: 0, pending: 0 },
  { type: "Sick Leave",            total: 10, used: 0, pending: 0 },
  { type: "Family Responsibility", total: 3,  used: 0, pending: 0 },
  { type: "Study Leave",           total: 5,  used: 0, pending: 0 },
];

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

export function MyLeavePage({ isActive, session }: { isActive: boolean; session: AuthSession | null }) {
  const [apiLeave, setApiLeave] = useState<StaffLeaveRecord[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    void loadMyLeaveRequestsWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error || !r.data) {
        setError(r.error?.message ?? "Failed to load data. Please try again.");
        setLoading(false);
        return;
      }
      setApiLeave(r.data);
      setError(null);
      setLoading(false);
    });
  }, [session?.accessToken]);

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

  if (loading) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("errorState")}>
          <div className={cx("errorStateIcon")}>✕</div>
          <div className={cx("errorStateTitle")}>Failed to load</div>
          <div className={cx("errorStateSub")}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-my-leave">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / HR</div>
        <h1 className={cx("pageTitleText")}>My Leave</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Leave balances, applications, and history</p>
      </div>

      {/* ── Summary stats ────────────────────────────────────────────────── */}
      <div className={cx("mlvStatGrid")}>

        <div className={cx("mlvStatCard")}>
          <div className={cx("mlvStatCardTop")}>
            <div className={cx("mlvStatLabel")}>Total Entitlement</div>
            <div className={cx("mlvStatValue")}>{totalDays}</div>
          </div>
          <div className={cx("mlvStatCardDivider")} />
          <div className={cx("mlvStatCardBottom")}>
            <span className={cx("mlvStatDot", "dotBgMuted2")} />
            <span className={cx("mlvStatMeta")}>days across all types</span>
          </div>
        </div>

        <div className={cx("mlvStatCard")}>
          <div className={cx("mlvStatCardTop")}>
            <div className={cx("mlvStatLabel")}>Days Used</div>
            <div className={cx("mlvStatValue", "colorAmber")}>{totalUsed}</div>
          </div>
          <div className={cx("mlvStatCardDivider")} />
          <div className={cx("mlvStatCardBottom")}>
            <span className={cx("mlvStatDot", "dotBgAmber")} />
            <span className={cx("mlvStatMeta")}>taken this cycle</span>
          </div>
        </div>

        <div className={cx("mlvStatCard")}>
          <div className={cx("mlvStatCardTop")}>
            <div className={cx("mlvStatLabel")}>Available</div>
            <div className={cx("mlvStatValue", "colorGreen")}>{totalAvail}</div>
          </div>
          <div className={cx("mlvStatCardDivider")} />
          <div className={cx("mlvStatCardBottom")}>
            <span className={cx("mlvStatDot", "dotBgGreen")} />
            <span className={cx("mlvStatMeta")}>days remaining</span>
          </div>
        </div>

        <div className={cx("mlvStatCard")}>
          <div className={cx("mlvStatCardTop")}>
            <div className={cx("mlvStatLabel")}>Pending</div>
            <div className={cx("mlvStatValue", totalPend > 0 ? "colorAccent" : "colorGreen")}>{totalPend}</div>
          </div>
          <div className={cx("mlvStatCardDivider")} />
          <div className={cx("mlvStatCardBottom")}>
            <span className={cx("mlvStatDot", "dynBgColor")} style={{ "--bg-color": totalPend > 0 ? "var(--accent)" : "var(--muted2)" } as React.CSSProperties} />
            <span className={cx("mlvStatMeta")}>{totalPend > 0 ? "awaiting approval" : "none pending"}</span>
          </div>
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

    </section>
  );
}

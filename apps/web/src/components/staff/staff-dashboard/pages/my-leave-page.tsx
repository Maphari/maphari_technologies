"use client";

import { cx } from "../style";

const leaveBalances = [
  { type: "Annual Leave", total: 21, used: 8, pending: 3 },
  { type: "Sick Leave", total: 10, used: 2, pending: 0 },
  { type: "Family Responsibility", total: 3, used: 0, pending: 0 },
  { type: "Study Leave", total: 5, used: 2, pending: 0 },
];

const leaveHistory = [
  { id: "LV-001", type: "Annual Leave", startDate: "Mar 10, 2026", endDate: "Mar 14, 2026", days: 5, status: "Approved", approvedBy: "Team Lead" },
  { id: "LV-002", type: "Sick Leave", startDate: "Feb 12, 2026", endDate: "Feb 13, 2026", days: 2, status: "Approved", approvedBy: "Auto" },
  { id: "LV-003", type: "Annual Leave", startDate: "Jan 20, 2026", endDate: "Jan 22, 2026", days: 3, status: "Approved", approvedBy: "Team Lead" },
  { id: "LV-004", type: "Annual Leave", startDate: "Apr 1, 2026", endDate: "Apr 3, 2026", days: 3, status: "Pending", approvedBy: "—" },
  { id: "LV-005", type: "Study Leave", startDate: "Dec 8, 2025", endDate: "Dec 9, 2025", days: 2, status: "Approved", approvedBy: "Manager" },
];

function statusTone(s: string) {
  if (s === "Approved") return "badgeGreen";
  if (s === "Pending") return "badgeAmber";
  return "badgeRed";
}

export function MyLeavePage({ isActive }: { isActive: boolean }) {
  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-my-leave">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / HR</div>
        <h1 className={cx("pageTitleText")}>My Leave</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Leave balances, applications, and history</p>
      </div>

      <div className={cx("stats", "stats4", "mb28")}>
        {leaveBalances.map((lb) => (
          <div key={lb.type} className={cx("card")}>
            <div className={cx("text10", "colorMuted2", "uppercase", "tracking", "mb6")}>{lb.type}</div>
            <div className={cx("fontDisplay", "fw800", "text20", "colorAccent")}>{lb.total - lb.used - lb.pending}<span className={cx("text12", "colorMuted2", "fw400")}>/{lb.total}</span></div>
            {lb.pending > 0 && <div className={cx("text10", "colorAmber")}>{lb.pending} pending</div>}
          </div>
        ))}
      </div>

      <div className={cx("card")}>
        <div className={cx("sectionLabel", "mb8")} style={{ padding: "16px 20px 0" }}>Leave History</div>
        <div className={cx("tableWrap")}>
          <table className={cx("table")}>
            <thead>
              <tr><th>ID</th><th>Type</th><th>Start</th><th>End</th><th>Days</th><th>Status</th><th>Approved By</th></tr>
            </thead>
            <tbody>
              {leaveHistory.map((lv) => (
                <tr key={lv.id}>
                  <td className={cx("fontMono", "text12")}>{lv.id}</td>
                  <td className={cx("fw600")}>{lv.type}</td>
                  <td className={cx("text12")}>{lv.startDate}</td>
                  <td className={cx("text12")}>{lv.endDate}</td>
                  <td className={cx("fontMono", "fw600")}>{lv.days}</td>
                  <td><span className={cx("badge", statusTone(lv.status))}>{lv.status}</span></td>
                  <td className={cx("colorMuted", "text12")}>{lv.approvedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

"use client";

import { cx } from "../style";

const metrics = [
  { label: "Tasks Completed (Feb)", value: "47", change: "+12%", changeDir: "up" as const },
  { label: "Avg Task Duration", value: "3.2h", change: "-8%", changeDir: "up" as const },
  { label: "On-Time Delivery Rate", value: "91%", change: "+3%", changeDir: "up" as const },
  { label: "Client Satisfaction Avg", value: "4.2/5", change: "+0.3", changeDir: "up" as const },
  { label: "Hours Logged (Feb)", value: "142h", change: "-5%", changeDir: "down" as const },
  { label: "Utilization Rate", value: "85%", change: "+2%", changeDir: "up" as const },
];

const weeklyBreakdown = [
  { week: "W5", tasksCompleted: 10, hoursLogged: 36, utilization: 90 },
  { week: "W6", tasksCompleted: 14, hoursLogged: 38, utilization: 95 },
  { week: "W7", tasksCompleted: 11, hoursLogged: 34, utilization: 85 },
  { week: "W8", tasksCompleted: 12, hoursLogged: 34, utilization: 85 },
];

export function MyAnalyticsPage({ isActive }: { isActive: boolean }) {
  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-my-analytics">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Analytics</div>
        <h1 className={cx("pageTitleText")}>My Analytics</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Personal performance analytics dashboard</p>
      </div>

      <div className={cx("stats", "stats3", "mb28")}>
        {metrics.slice(0, 3).map((m) => (
          <div key={m.label} className={cx("card")}>
            <div className={cx("text10", "colorMuted2", "uppercase", "tracking", "mb6")}>{m.label}</div>
            <div className={cx("fontDisplay", "fw800", "text20", "colorAccent")}>{m.value}</div>
            <div className={cx("text10", m.changeDir === "up" ? "colorGreen" : "colorRed")}>{m.change} vs last month</div>
          </div>
        ))}
      </div>

      <div className={cx("stats", "stats3", "mb28")}>
        {metrics.slice(3).map((m) => (
          <div key={m.label} className={cx("card")}>
            <div className={cx("text10", "colorMuted2", "uppercase", "tracking", "mb6")}>{m.label}</div>
            <div className={cx("fontDisplay", "fw800", "text20", "colorAccent")}>{m.value}</div>
            <div className={cx("text10", m.changeDir === "up" ? "colorGreen" : "colorRed")}>{m.change} vs last month</div>
          </div>
        ))}
      </div>

      <div className={cx("card")}>
        <div className={cx("sectionLabel", "mb8")} style={{ padding: "16px 20px 0" }}>Weekly Breakdown</div>
        <div className={cx("tableWrap")}>
          <table className={cx("table")}>
            <thead><tr><th>Week</th><th>Tasks Done</th><th>Hours</th><th>Utilization</th></tr></thead>
            <tbody>
              {weeklyBreakdown.map((w) => (
                <tr key={w.week}>
                  <td className={cx("fw600")}>{w.week}</td>
                  <td className={cx("fontMono")}>{w.tasksCompleted}</td>
                  <td className={cx("fontMono")}>{w.hoursLogged}h</td>
                  <td className={cx("fontMono", "fw600", w.utilization >= 90 ? "colorGreen" : "colorAmber")}>{w.utilization}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

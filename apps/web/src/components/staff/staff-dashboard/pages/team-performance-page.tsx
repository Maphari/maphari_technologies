"use client";

import { cx } from "../style";

const teamMembers = [
  { name: "Thabo Mokoena", role: "Senior Designer", tasksCompleted: 47, avgTaskTime: "3.2h", utilization: 85, onTimeRate: 91, satisfaction: 4.2 },
  { name: "Lerato Dlamini", role: "UX Designer", tasksCompleted: 38, avgTaskTime: "4.1h", utilization: 78, onTimeRate: 87, satisfaction: 4.0 },
  { name: "James Okonkwo", role: "Frontend Developer", tasksCompleted: 52, avgTaskTime: "2.8h", utilization: 92, onTimeRate: 94, satisfaction: 4.5 },
];

const teamAvg = {
  tasksCompleted: Math.round(teamMembers.reduce((s, m) => s + m.tasksCompleted, 0) / teamMembers.length),
  utilization: Math.round(teamMembers.reduce((s, m) => s + m.utilization, 0) / teamMembers.length),
  onTimeRate: Math.round(teamMembers.reduce((s, m) => s + m.onTimeRate, 0) / teamMembers.length),
};

export function TeamPerformancePage({ isActive }: { isActive: boolean }) {
  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-team-performance">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Analytics</div>
        <h1 className={cx("pageTitleText")}>Team Performance</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Team benchmarks for comparison</p>
      </div>

      <div className={cx("stats", "stats3", "mb28")}>
        {[
          { label: "Team Avg Tasks", value: String(teamAvg.tasksCompleted), tone: "colorAccent" },
          { label: "Team Utilization", value: `${teamAvg.utilization}%`, tone: "colorGreen" },
          { label: "On-Time Rate", value: `${teamAvg.onTimeRate}%`, tone: "colorGreen" },
        ].map((s) => (
          <div key={s.label} className={cx("card")}>
            <div className={cx("text10", "colorMuted2", "uppercase", "tracking", "mb6")}>{s.label}</div>
            <div className={cx("fontDisplay", "fw800", "text20", s.tone)}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className={cx("card")}>
        <div className={cx("tableWrap")}>
          <table className={cx("table")}>
            <thead><tr><th>Team Member</th><th>Role</th><th>Tasks Done</th><th>Avg Time</th><th>Utilization</th><th>On-Time</th><th>CSAT</th></tr></thead>
            <tbody>
              {teamMembers.map((m) => (
                <tr key={m.name} style={m.name === "Thabo Mokoena" ? { background: "var(--bg-surface)" } : {}}>
                  <td className={cx("fw600")}>{m.name} {m.name === "Thabo Mokoena" ? "(You)" : ""}</td>
                  <td className={cx("colorMuted")}>{m.role}</td>
                  <td className={cx("fontMono")}>{m.tasksCompleted}</td>
                  <td className={cx("fontMono")}>{m.avgTaskTime}</td>
                  <td className={cx("fontMono", "fw600", m.utilization >= 85 ? "colorGreen" : "colorAmber")}>{m.utilization}%</td>
                  <td className={cx("fontMono", "fw600", m.onTimeRate >= 90 ? "colorGreen" : "colorAmber")}>{m.onTimeRate}%</td>
                  <td className={cx("fontMono", "fw600")}>{m.satisfaction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

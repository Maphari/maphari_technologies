"use client";

import { cx } from "../style";

const capacityData = {
  weeklyHours: 40,
  allocatedHours: 34,
  loggedThisWeek: 28,
  projects: [
    { name: "Brand Identity System", allocated: 12, logged: 10, client: "Volta Studios" },
    { name: "Q1 Campaign Strategy", allocated: 8, logged: 7.5, client: "Kestrel Capital" },
    { name: "Website Redesign", allocated: 10, logged: 8, client: "Mira Health" },
    { name: "Annual Report 2025", allocated: 4, logged: 2.5, client: "Okafor & Sons" },
  ],
  weekHistory: [
    { week: "W5", allocated: 36, logged: 34 },
    { week: "W6", allocated: 38, logged: 37 },
    { week: "W7", allocated: 34, logged: 32 },
    { week: "W8", allocated: 34, logged: 28 },
  ],
};

function utilizationColor(pct: number) {
  if (pct >= 100) return "colorRed";
  if (pct >= 85) return "colorAmber";
  return "colorGreen";
}

export function MyCapacityPage({ isActive }: { isActive: boolean }) {
  const utilizationPct = Math.round((capacityData.allocatedHours / capacityData.weeklyHours) * 100);
  const availableHours = capacityData.weeklyHours - capacityData.allocatedHours;

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-my-capacity">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Project Management</div>
        <h1 className={cx("pageTitleText")}>My Capacity</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Personal workload vs. capacity this week</p>
      </div>

      <div className={cx("stats", "stats4", "mb28")}>
        {[
          { label: "Weekly Capacity", value: `${capacityData.weeklyHours}h`, tone: "colorMuted" },
          { label: "Allocated", value: `${capacityData.allocatedHours}h`, tone: utilizationColor(utilizationPct) },
          { label: "Logged", value: `${capacityData.loggedThisWeek}h`, tone: "colorAccent" },
          { label: "Available", value: `${availableHours}h`, tone: availableHours > 0 ? "colorGreen" : "colorRed" },
        ].map((stat) => (
          <div key={stat.label} className={cx("card")}>
            <div className={cx("text10", "colorMuted2", "uppercase", "tracking", "mb6")}>{stat.label}</div>
            <div className={cx("fontDisplay", "fw800", "text20", stat.tone)}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className={cx("card", "cardBody", "mb24")}>
        <div className={cx("sectionLabel", "mb16")}>Allocation by Project</div>
        <div className={cx("flexCol", "gap12")}>
          {capacityData.projects.map((project) => {
            const pct = Math.round((project.allocated / capacityData.weeklyHours) * 100);
            const loggedPct = Math.round((project.logged / project.allocated) * 100);
            return (
              <div key={project.name}>
                <div className={cx("flexBetween", "mb4")}>
                  <div>
                    <span className={cx("fw600", "text12")}>{project.name}</span>
                    <span className={cx("text11", "colorMuted", "ml8")}>· {project.client}</span>
                  </div>
                  <span className={cx("fontMono", "text11", "colorAccent")}>{project.allocated}h ({pct}%)</span>
                </div>
                <div className={cx("progressTrack")}>
                  <div className={cx("progressFill", loggedPct >= 100 ? "progressFillAmber" : "progressFillGreen")} style={{ width: `${Math.min(loggedPct, 100)}%` }} />
                </div>
                <div className={cx("text10", "colorMuted2", "mt4")}>{project.logged}h logged / {project.allocated}h allocated</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={cx("card", "cardBody")}>
        <div className={cx("sectionLabel", "mb16")}>Weekly Trend</div>
        <div className={cx("tableWrap")}>
          <table className={cx("table")}>
            <thead>
              <tr>
                <th>Week</th>
                <th>Allocated</th>
                <th>Logged</th>
                <th>Utilization</th>
              </tr>
            </thead>
            <tbody>
              {capacityData.weekHistory.map((w) => {
                const util = Math.round((w.logged / w.allocated) * 100);
                return (
                  <tr key={w.week}>
                    <td className={cx("fw600")}>{w.week}</td>
                    <td className={cx("fontMono")}>{w.allocated}h</td>
                    <td className={cx("fontMono")}>{w.logged}h</td>
                    <td className={cx("fontMono", "fw600", utilizationColor(util))}>{util}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

"use client";

import { cx } from "../style";

const sprint = {
  name: "Sprint 4 — Dashboard Build",
  goal: "Complete dashboard analytics widgets and responsive sidebar",
  startDate: "Feb 17, 2026",
  endDate: "Feb 28, 2026",
  tasks: [
    { name: "Analytics widget — charts", assignee: "Sipho Ndlovu", status: "Done" as const, points: 5 },
    { name: "Sidebar responsive layout", assignee: "James Okonkwo", status: "Done" as const, points: 3 },
    { name: "Dashboard micro-animations", assignee: "Sipho Ndlovu", status: "In Progress" as const, points: 3 },
    { name: "Performance optimisation", assignee: "James Okonkwo", status: "To Do" as const, points: 5 },
    { name: "Cross-browser testing", assignee: "Thabo Khumalo", status: "To Do" as const, points: 2 },
  ],
};

export function SprintVisibilityPage() {
  const done = sprint.tasks.filter((t) => t.status === "Done").length;
  const totalPoints = sprint.tasks.reduce((s, t) => s + t.points, 0);
  const donePoints = sprint.tasks.filter((t) => t.status === "Done").reduce((s, t) => s + t.points, 0);

  return (
    <div className={cx("pageBody")}>
      <div className={cx("pageHeader")}>
        <div>
          <div className={cx("pageEyebrow")}>Veldt Finance · Sprint</div>
          <h1 className={cx("pageTitle")}>Sprint Progress</h1>
          <p className={cx("pageSub")}>Read-only view of the active sprint — see what's being worked on right now.</p>
        </div>
      </div>
      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Sprint", value: sprint.name.split("—")[0].trim(), color: "var(--accent)" },
          { label: "Progress", value: `${done}/${sprint.tasks.length} tasks`, color: "var(--accent)" },
          { label: "Story Points", value: `${donePoints}/${totalPoints}`, color: "var(--accent)" },
          { label: "Ends", value: sprint.endDate, color: "var(--muted)" },
        ].map((s) => (
          <div key={s.label} className={cx("card", "p16")}>
            <div className={cx("text10", "uppercase", "tracking", "colorMuted", "fw700", "mb4")}>{s.label}</div>
            <div className={cx("fontDisplay", "fw800")} style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div className={cx("card", "p16", "mb16")}>
        <div className={cx("fw700", "mb4")}>Sprint Goal</div>
        <div className={cx("text12", "colorMuted")}>{sprint.goal}</div>
      </div>
      <div className={cx("card")}>
        <div className={cx("cardHd")} style={{ padding: "12px 16px" }}><span className={cx("cardHdTitle")}>Tasks</span></div>
        <table className={cx("table")}>
          <thead><tr><th>Task</th><th>Assignee</th><th>Points</th><th>Status</th></tr></thead>
          <tbody>
            {sprint.tasks.map((t) => (
              <tr key={t.name}>
                <td className={cx("fw600")}>{t.name}</td>
                <td className={cx("colorMuted")}>{t.assignee}</td>
                <td className={cx("fontMono")}>{t.points}</td>
                <td><span className={cx("badge", t.status === "Done" ? "badgeGreen" : t.status === "In Progress" ? "badgeAmber" : "badge")}>{t.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

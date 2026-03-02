"use client";

import { cx } from "../style";

const projects = [
  { id: 1, name: "Brand Identity System", client: "Volta Studios", progress: 62, health: "healthy" as const, tasks: { total: 12, done: 8, inProgress: 3 }, budget: { total: 28000, spent: 17325 }, dueAt: "Mar 15, 2026", priority: "HIGH" as const },
  { id: 2, name: "Q1 Campaign Strategy", client: "Kestrel Capital", progress: 89, health: "critical" as const, tasks: { total: 9, done: 8, inProgress: 1 }, budget: { total: 21000, spent: 20475 }, dueAt: "Feb 28, 2026", priority: "HIGH" as const },
  { id: 3, name: "Website Redesign", client: "Mira Health", progress: 50, health: "moderate" as const, tasks: { total: 14, done: 7, inProgress: 4 }, budget: { total: 35000, spent: 21350 }, dueAt: "Apr 30, 2026", priority: "MEDIUM" as const },
  { id: 4, name: "Editorial Design System", client: "Dune Collective", progress: 100, health: "exceeded" as const, tasks: { total: 8, done: 8, inProgress: 0 }, budget: { total: 17500, spent: 19600 }, dueAt: "Feb 10, 2026", priority: "LOW" as const },
  { id: 5, name: "Annual Report 2025", client: "Okafor & Sons", progress: 34, health: "healthy" as const, tasks: { total: 6, done: 2, inProgress: 2 }, budget: { total: 14000, spent: 4725 }, dueAt: "May 20, 2026", priority: "MEDIUM" as const },
];

function healthBadge(h: string) {
  if (h === "healthy") return { label: "Healthy", tone: "badgeGreen" as const };
  if (h === "moderate") return { label: "Moderate", tone: "badgeAmber" as const };
  if (h === "critical") return { label: "Critical", tone: "badgeAmber" as const };
  return { label: "Over Budget", tone: "badgeRed" as const };
}

function priorityBadge(p: string) {
  if (p === "HIGH") return "badgeRed";
  if (p === "MEDIUM") return "badgeAmber";
  return "badge";
}

export function MyPortfolioPage({ isActive }: { isActive: boolean }) {
  const totalTasks = projects.reduce((s, p) => s + p.tasks.total, 0);
  const doneTasks = projects.reduce((s, p) => s + p.tasks.done, 0);
  const avgProgress = Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length);

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-my-portfolio">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Project Management</div>
        <h1 className={cx("pageTitleText")}>My Portfolio</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Aggregated view of all your assigned projects</p>
      </div>

      <div className={cx("stats", "stats4", "mb28")}>
        {[
          { label: "Projects", value: String(projects.length), tone: "colorAccent" },
          { label: "Avg Progress", value: `${avgProgress}%`, tone: "colorGreen" },
          { label: "Tasks Done", value: `${doneTasks}/${totalTasks}`, tone: "colorAccent" },
          { label: "At Risk", value: String(projects.filter((p) => p.health === "critical" || p.health === "exceeded").length), tone: "colorRed" },
        ].map((stat) => (
          <div key={stat.label} className={cx("card")}>
            <div className={cx("text10", "colorMuted2", "uppercase", "tracking", "mb6")}>{stat.label}</div>
            <div className={cx("fontDisplay", "fw800", "text20", stat.tone)}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className={cx("flexCol", "gap16")}>
        {projects.map((project) => {
          const badge = healthBadge(project.health);
          const budgetPct = Math.round((project.budget.spent / project.budget.total) * 100);
          return (
            <div key={project.id} className={cx("card", "cardBody")}>
              <div className={cx("flexBetween", "mb12")}>
                <div>
                  <div className={cx("fw700", "text14")}>{project.name}</div>
                  <div className={cx("text11", "colorMuted")}>{project.client} · Due {project.dueAt}</div>
                </div>
                <div className={cx("flex", "gap8", "alignCenter")}>
                  <span className={cx("badge", priorityBadge(project.priority))}>{project.priority}</span>
                  <span className={cx("badge", badge.tone)}>{badge.label}</span>
                </div>
              </div>

              <div className={cx("mb8")}>
                <div className={cx("flexBetween", "mb4")}>
                  <span className={cx("text10", "colorMuted2", "uppercase", "tracking")}>Progress</span>
                  <span className={cx("text10", "fontMono", "colorAccent")}>{project.progress}%</span>
                </div>
                <div className={cx("progressTrack")}>
                  <div className={cx("progressFill", "progressFillGreen")} style={{ width: `${project.progress}%` }} />
                </div>
              </div>

              <div className={cx("flexBetween", "text11")}>
                <span className={cx("colorMuted")}>Tasks: {project.tasks.done}/{project.tasks.total} done · {project.tasks.inProgress} in progress</span>
                <span className={cx("fontMono", budgetPct >= 100 ? "colorRed" : "colorMuted")}>Budget: {budgetPct}% burned</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

"use client";

import { cx } from "../style";

const timelineItems = [
  { id: 1, project: "Brand Identity System", task: "Logo & Visual Direction", startWeek: 1, durationWeeks: 3, status: "done" as const, client: "Volta Studios" },
  { id: 2, project: "Brand Identity System", task: "Brand Guidelines Doc", startWeek: 3, durationWeeks: 2, status: "in-progress" as const, client: "Volta Studios" },
  { id: 3, project: "Brand Identity System", task: "Asset Exports", startWeek: 5, durationWeeks: 1, status: "upcoming" as const, client: "Volta Studios" },
  { id: 4, project: "Q1 Campaign Strategy", task: "Strategy Deck", startWeek: 1, durationWeeks: 2, status: "done" as const, client: "Kestrel Capital" },
  { id: 5, project: "Q1 Campaign Strategy", task: "Audience Research", startWeek: 2, durationWeeks: 2, status: "done" as const, client: "Kestrel Capital" },
  { id: 6, project: "Q1 Campaign Strategy", task: "Content Calendar", startWeek: 3, durationWeeks: 2, status: "in-progress" as const, client: "Kestrel Capital" },
  { id: 7, project: "Website Redesign", task: "UX Wireframes", startWeek: 1, durationWeeks: 4, status: "in-progress" as const, client: "Mira Health" },
  { id: 8, project: "Website Redesign", task: "Component Library", startWeek: 4, durationWeeks: 3, status: "upcoming" as const, client: "Mira Health" },
  { id: 9, project: "Annual Report 2025", task: "Data Visualisation", startWeek: 2, durationWeeks: 3, status: "in-progress" as const, client: "Okafor & Sons" },
  { id: 10, project: "Annual Report 2025", task: "Layout & Typesetting", startWeek: 5, durationWeeks: 3, status: "upcoming" as const, client: "Okafor & Sons" },
];

const weeks = ["W5", "W6", "W7", "W8", "W9", "W10", "W11", "W12"];

function statusColor(s: string) {
  if (s === "done") return "progressFillGreen";
  if (s === "in-progress") return "progressFillAmber";
  return "progressFillPurple";
}

function statusBadge(s: string) {
  if (s === "done") return { label: "Done", tone: "badgeGreen" as const };
  if (s === "in-progress") return { label: "In Progress", tone: "badgeAmber" as const };
  return { label: "Upcoming", tone: "badge" as const };
}

export function MyTimelinePage({ isActive }: { isActive: boolean }) {
  const grouped = timelineItems.reduce<Record<string, typeof timelineItems>>((acc, item) => {
    if (!acc[item.project]) acc[item.project] = [];
    acc[item.project].push(item);
    return acc;
  }, {});

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-my-timeline">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Project Management</div>
        <h1 className={cx("pageTitleText")}>My Timeline</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Personal task timeline across all assigned projects</p>
      </div>

      <div className={cx("stats", "stats3", "mb28")}>
        {[
          { label: "Active Tasks", value: String(timelineItems.filter((i) => i.status === "in-progress").length), tone: "colorAmber" },
          { label: "Completed", value: String(timelineItems.filter((i) => i.status === "done").length), tone: "colorGreen" },
          { label: "Upcoming", value: String(timelineItems.filter((i) => i.status === "upcoming").length), tone: "colorAccent" },
        ].map((stat) => (
          <div key={stat.label} className={cx("card")}>
            <div className={cx("text10", "colorMuted2", "uppercase", "tracking", "mb6")}>{stat.label}</div>
            <div className={cx("fontDisplay", "fw800", "text20", stat.tone)}>{stat.value}</div>
          </div>
        ))}
      </div>

      {Object.entries(grouped).map(([project, tasks]) => (
        <div key={project} className={cx("card", "cardBody", "mb16")}>
          <div className={cx("sectionLabel", "mb4")}>{project}</div>
          <div className={cx("text11", "colorMuted", "mb16")}>{tasks[0].client}</div>

          {/* Week header */}
          <div style={{ display: "grid", gridTemplateColumns: `180px repeat(${weeks.length}, 1fr)`, gap: "0", marginBottom: "4px" }}>
            <div />
            {weeks.map((w) => (
              <div key={w} className={cx("text10", "colorMuted2", "fontMono")} style={{ textAlign: "center" }}>{w}</div>
            ))}
          </div>

          {/* Task rows */}
          {tasks.map((task) => {
            const badge = statusBadge(task.status);
            return (
              <div key={task.id} style={{ display: "grid", gridTemplateColumns: `180px repeat(${weeks.length}, 1fr)`, gap: "0", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                <div className={cx("text12", "truncate")} title={task.task}>{task.task}</div>
                {weeks.map((_, i) => {
                  const weekIndex = i + 1;
                  const isActive = weekIndex >= task.startWeek && weekIndex < task.startWeek + task.durationWeeks;
                  return (
                    <div key={i} style={{ padding: "2px 1px" }}>
                      {isActive && (
                        <div className={cx(statusColor(task.status))} style={{ height: "16px", borderRadius: "4px", opacity: 0.7 }} />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          <div className={cx("flex", "gap12", "mt12")}>
            {tasks.map((task) => {
              const badge = statusBadge(task.status);
              return <span key={task.id} className={cx("badge", badge.tone, "text10")}>{task.task}: {badge.label}</span>;
            })}
          </div>
        </div>
      ))}
    </section>
  );
}

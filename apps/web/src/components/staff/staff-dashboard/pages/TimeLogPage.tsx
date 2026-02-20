"use client";

import { useMemo, useState } from "react";
import { TimeEntry } from "../ui";
import { cx, styles } from "../style";
import type { TimeEntrySummary } from "../types";
import { formatDateShort, formatDuration } from "../utils";

type ProjectOption = {
  id: string;
  name: string;
};

type WeekData = {
  days: Array<{ date: Date; label: string }>;
  dailyMinutes: number[];
};

type TimeLogPageProps = {
  isActive: boolean;
  timerDisplay: string;
  timerRunning: boolean;
  timerProjectName: string;
  timerTaskName: string;
  onTimerToggle: () => void;
  onTimerStop: () => void;
  selectedTimerProjectId: string;
  onTimerProjectChange: (value: string) => void;
  timerTaskLabel: string;
  onTimerTaskLabelChange: (value: string) => void;
  projects: ProjectOption[];
  weekMinutes: number;
  weekData: WeekData;
  weekMax: number;
  projectTimeBreakdown: Array<[string, number]>;
  recentTimeEntries: TimeEntrySummary[];
  todayMinutes: number;
  weeklyTargetHours: number;
  onExportCsv: () => void;
  onExportJson: () => void;
};

export function TimeLogPage({
  isActive,
  timerDisplay,
  timerRunning,
  timerProjectName,
  timerTaskName,
  onTimerToggle,
  onTimerStop,
  selectedTimerProjectId,
  onTimerProjectChange,
  timerTaskLabel,
  onTimerTaskLabelChange,
  projects,
  weekMinutes,
  weekData,
  weekMax,
  projectTimeBreakdown,
  recentTimeEntries,
  todayMinutes,
  weeklyTargetHours,
  onExportCsv,
  onExportJson
}: TimeLogPageProps) {
  const [entryFilter, setEntryFilter] = useState<"all" | "today" | "week">("all");
  const [entrySearch, setEntrySearch] = useState("");
  const dailyTargetMinutes = Math.max(1, Math.round((weeklyTargetHours * 60) / 5));
  const todayProgressPercent = Math.min(100, Math.round((todayMinutes / dailyTargetMinutes) * 100));
  const weeklyTargetMinutes = weeklyTargetHours * 60;
  const weekProgressPercent = weeklyTargetMinutes > 0 ? Math.min(100, Math.round((weekMinutes / weeklyTargetMinutes) * 100)) : 0;

  const filteredEntries = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    const query = entrySearch.trim().toLowerCase();
    return recentTimeEntries.filter((entry) => {
      const ts = new Date(entry.loggedAt);
      const inScope =
        entryFilter === "today"
          ? ts.getFullYear() === now.getFullYear() && ts.getMonth() === now.getMonth() && ts.getDate() === now.getDate()
          : entryFilter === "week"
            ? ts.getTime() >= weekAgo.getTime()
            : true;
      if (!inScope) return false;
      if (!query) return true;
      return `${entry.project} ${entry.task}`.toLowerCase().includes(query);
    });
  }, [entryFilter, entrySearch, recentTimeEntries]);

  return (
    <section className={cx("page", isActive && "pageActive")} id="page-timelog">
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>Time Tracking</div>
          <div className={styles.pageTitle}>Time Log</div>
          <div className={styles.pageSub}>This week: {formatDuration(weekMinutes)} logged · {projects.length} active projects</div>
        </div>
        <div className={styles.pageActions}>
          <button className={cx("button", "buttonGhost")} type="button" onClick={onExportCsv}>
            Export CSV
          </button>
          <button className={cx("button", "buttonGhost")} type="button" onClick={onExportJson}>
            Export JSON
          </button>
          <button className={cx("button", "buttonGreen")} type="button" onClick={onTimerToggle}>
            {timerRunning ? "⏸ Pause Timer" : "▶ Start Timer"}
          </button>
        </div>
      </div>

      <div className={styles.timerWidget}>
        <div className={styles.timerDisplay} id="timerDisplay2">{timerDisplay}</div>
        <div className={styles.timerInfo}>
          <div className={styles.timerProject}>{timerProjectName}</div>
          <div className={styles.timerTask}>{timerTaskName}</div>
          <div className={styles.timerActions}>
            <button
              className={cx("timerButton", "timerPlay")}
              type="button"
              onClick={onTimerToggle}
              style={timerRunning ? { background: "var(--amber)", color: "#07090f" } : undefined}
            >
              {timerRunning ? "⏸" : "▶"}
            </button>
            <button className={cx("timerButton", "timerStop")} type="button" onClick={onTimerStop}>■</button>
          </div>
        </div>
        <div className={styles.timerInputsGrid}>
          <div className={styles.field} style={{ marginBottom: 0 }}>
            <label className={styles.fieldLabel} htmlFor="timelog-project">Project</label>
            <select
              id="timelog-project"
              className={cx("fieldInput", "fieldSelect")}
              style={{ paddingTop: 7, paddingBottom: 7 }}
              value={selectedTimerProjectId}
              onChange={(event) => onTimerProjectChange(event.target.value)}
            >
              <option value="">Select project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>
          <div className={styles.field} style={{ marginBottom: 0 }}>
            <label className={styles.fieldLabel} htmlFor="timelog-workstream">Workstream</label>
            <input
              id="timelog-workstream"
              className={styles.fieldInput}
              placeholder="What are you working on?"
              style={{ paddingTop: 7, paddingBottom: 7 }}
              value={timerTaskLabel}
              onChange={(event) => onTimerTaskLabelChange(event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className={styles.grid2} style={{ marginBottom: 14 }}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>Goal Progress</span>
            <span className={styles.weekSummary}>{todayProgressPercent}% today</span>
          </div>
          <div className={styles.cardBody}>
            {recentTimeEntries.length === 0 ? (
              <div className={styles.emptyState}>No time tracked yet. Start the timer to build your progress.</div>
            ) : (
              <>
                <div className={styles.timeRow}>
                  <span>Today</span>
                  <span className={styles.timeRowValue}>{formatDuration(todayMinutes)} / {formatDuration(dailyTargetMinutes)}</span>
                </div>
                <div className={styles.timeBar}>
                  <div style={{ width: `${todayProgressPercent}%`, height: "100%", background: "var(--accent)", borderRadius: 2 }} />
                </div>
                <div className={styles.timeRow} style={{ marginTop: 8 }}>
                  <span>This week</span>
                  <span className={styles.timeRowValue}>{formatDuration(weekMinutes)} / {formatDuration(weeklyTargetMinutes)}</span>
                </div>
                <div className={styles.timeBar}>
                  <div style={{ width: `${weekProgressPercent}%`, height: "100%", background: "var(--green)", borderRadius: 2 }} />
                </div>
              </>
            )}
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>Entry Filters</span>
          </div>
          <div className={styles.cardBody}>
            {recentTimeEntries.length === 0 ? (
              <div className={styles.emptyState}>No entries available to filter yet.</div>
            ) : (
              <>
                <div className={styles.filterTabs} style={{ marginBottom: 8 }}>
                  {[
                    { id: "all", label: "All" },
                    { id: "today", label: "Today" },
                    { id: "week", label: "Last 7 Days" }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      className={cx("filterTab", tab.id === entryFilter && "filterTabActive")}
                      type="button"
                      onClick={() => setEntryFilter(tab.id as "all" | "today" | "week")}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <input
                  className={styles.fieldInput}
                  placeholder="Search project or task"
                  value={entrySearch}
                  onChange={(event) => setEntrySearch(event.target.value)}
                />
              </>
            )}
          </div>
        </div>
      </div>

      <div className={styles.grid2}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>This Week</span>
            <span className={styles.weekSummary}>{formatDuration(weekMinutes)}</span>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.weekChart}>
              {weekData.days.map((day, index) => {
                const pct = weekMax > 0 ? (weekData.dailyMinutes[index] / weekMax) * 100 : 0;
                const isToday = day.date.toDateString() === new Date().toDateString();
                return (
                  <div key={day.label} className={styles.weekColumn}>
                    <div
                      className={styles.weekBar}
                      style={{ height: `${pct}%`, background: isToday ? "var(--accent)" : "rgba(79,158,255,0.22)" }}
                    />
                    <div className={styles.weekLabel} style={{ color: isToday ? "var(--accent)" : "var(--muted2)" }}>{day.label}</div>
                  </div>
                );
              })}
            </div>
            <div className={styles.divider} />
            <div className={styles.weekBreakdown}>
              {projectTimeBreakdown.length === 0 ? (
                <div className={styles.emptyState}>No time logged yet.</div>
              ) : (
                projectTimeBreakdown.map(([project, minutes]) => (
                  <div key={project} className={styles.weekRow}>
                    <span>{project}</span>
                    <span style={{ color: "var(--accent)" }}>{formatDuration(minutes)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}><span className={styles.cardHeaderTitle}>Recent Entries</span></div>
          <div className={styles.cardBody} style={{ paddingTop: 8, paddingBottom: 8 }}>
            <div className={styles.timeEntries}>
              {filteredEntries.length === 0 ? (
                <div className={styles.emptyState}>No time entries yet.</div>
              ) : (
                filteredEntries.map((entry) => (
                  <TimeEntry
                    key={entry.id}
                    dot={entry.color}
                    project={entry.project}
                    task={entry.task}
                    duration={formatDuration(entry.minutes)}
                    date={formatDateShort(entry.loggedAt)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

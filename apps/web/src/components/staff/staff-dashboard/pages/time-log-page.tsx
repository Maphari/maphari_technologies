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
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-timelog">
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
              className={cx("timerButton", "timerPlay", timerRunning && "timerPlayActive")}
              type="button"
              onClick={onTimerToggle}
            >
              {timerRunning ? "⏸" : "▶"}
            </button>
            <button className={cx("timerButton", "timerStop")} type="button" onClick={onTimerStop}>■</button>
          </div>
        </div>
        <div className={styles.timerInputsGrid}>
          <div className={cx("field", "mb0")}>
            <label className={styles.fieldLabel} htmlFor="timelog-project">Project</label>
            <select
              id="timelog-project"
              className={cx("fieldInput", "fieldSelect", "timerInputCompact")}
              value={selectedTimerProjectId}
              onChange={(event) => onTimerProjectChange(event.target.value)}
            >
              <option value="">Select project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>
          <div className={cx("field", "mb0")}>
            <label className={styles.fieldLabel} htmlFor="timelog-workstream">Workstream</label>
            <input
              id="timelog-workstream"
              className={cx("fieldInput", "timerInputCompact")}
              placeholder="What are you working on?"
              value={timerTaskLabel}
              onChange={(event) => onTimerTaskLabelChange(event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className={cx("grid2", "mb14")}>
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
                  <progress className={cx("progressMeter", "progressMeterAccent")} max={100} value={todayProgressPercent} />
                </div>
                <div className={cx("timeRow", "mt8")}>
                  <span>This week</span>
                  <span className={styles.timeRowValue}>{formatDuration(weekMinutes)} / {formatDuration(weeklyTargetMinutes)}</span>
                </div>
                <div className={styles.timeBar}>
                  <progress className={cx("progressMeter", "progressMeterAccent")} max={100} value={weekProgressPercent} />
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
                <div className={cx("filterRow", "mb8")}>
                  <select
                    className={cx("filterSelect")}
                    aria-label="Filter time entries"
                    value={entryFilter}
                    onChange={(event) => setEntryFilter(event.target.value as "all" | "today" | "week")}
                  >
                    <option value="all">All</option>
                    <option value="today">Today</option>
                    <option value="week">Last 7 days</option>
                  </select>
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
                const isToday = day.date.toDateString() === new Date().toDateString();
                return (
                  <div key={day.label} className={styles.weekColumn}>
                    <progress
                      className={cx("tlWeekProgress", isToday ? "tlWeekProgressToday" : "tlWeekProgressBase")}
                      max={Math.max(1, weekMax)}
                      value={weekData.dailyMinutes[index]}
                    />
                    <div className={cx("weekLabel", isToday ? "colorAccent" : "colorMuted2")}>{day.label}</div>
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
                    <span className={styles.colorAccent}>{formatDuration(minutes)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}><span className={styles.cardHeaderTitle}>Recent Entries</span></div>
          <div className={cx("cardBody", "pt8", "pb8")}>
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

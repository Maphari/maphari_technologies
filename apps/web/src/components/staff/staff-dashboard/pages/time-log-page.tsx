"use client";

import { useMemo, useState } from "react";
import { TimeEntry } from "../ui";
import { cx } from "../style";
import { AutomationBanner } from "../../../shared/automation-banner";
import type { TimeEntrySummary } from "../types";
import { formatDateShort, formatDuration } from "../utils";
import { StaffEmptyState, EmptyIcons } from "../empty-state";

type ProjectOption = { id: string; name: string };
type WeekData = { days: Array<{ date: Date; label: string }>; dailyMinutes: number[] };

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
  /** Optional automation: quick-log 8h to the primary project */
  onQuickLog8h?: () => Promise<void>;
  /** Timesheet approval: current ISO week string e.g. "2026-W12" */
  currentWeek?: string;
  /** True when all entries for this week are already SUBMITTED/APPROVED */
  weekAlreadySubmitted?: boolean;
  /** Submitting state for loading indication */
  submittingWeek?: boolean;
  /** Submit the current week's DRAFT entries for approval */
  onSubmitWeek?: () => Promise<void>;
};

const FILTER_OPTS = [
  { value: "all",   label: "All"         },
  { value: "today", label: "Today"       },
  { value: "week",  label: "Last 7 Days" },
] as const;

const BREAKDOWN_TONES = ["tlv2ToneAccent", "tlv2ToneBlue", "tlv2ToneAmber", "tlv2TonePurple", "tlv2ToneGreen"];

/* ── Icons ── */
function IcoPlay() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M4 3l7 4-7 4V3z" fill="currentColor" />
    </svg>
  );
}
function IcoPause() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="3.5" y="2.5" width="2.5" height="9" rx="1" fill="currentColor" />
      <rect x="8" y="2.5" width="2.5" height="9" rx="1" fill="currentColor" />
    </svg>
  );
}
function IcoStop() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="8" height="8" rx="1.5" fill="currentColor" />
    </svg>
  );
}
function IcoCsv() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="2" y="1.5" width="10" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5 5h4M5 7h4M5 9h2.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}
function IcoJson() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M5 2.5C4 2.5 3.5 3 3.5 3.5v7c0 .5.5 1 1.5 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M9 2.5c1 0 1.5.5 1.5 1v7c0 .5-.5 1-1.5 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M5.5 7h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
function IcoSearch() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.3" />
      <path d="M9.5 9.5l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function IcoTarget() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="7" cy="7" r="0.8" fill="currentColor" />
    </svg>
  );
}

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
  onExportJson,
  onQuickLog8h,
  currentWeek,
  weekAlreadySubmitted,
  submittingWeek,
  onSubmitWeek,
}: TimeLogPageProps) {
  const [entryFilter, setEntryFilter] = useState<"all" | "today" | "week">("all");
  const [entrySearch, setEntrySearch] = useState("");

  const dailyTargetMinutes  = Math.max(1, Math.round((weeklyTargetHours * 60) / 5));
  const weeklyTargetMinutes = weeklyTargetHours * 60;
  const todayPct  = Math.min(100, Math.round((todayMinutes / dailyTargetMinutes) * 100));
  const weekPct   = weeklyTargetMinutes > 0 ? Math.min(100, Math.round((weekMinutes / weeklyTargetMinutes) * 100)) : 0;
  const chartMax  = Math.max(1, weekMax);

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

      {/* ── Page header ── */}
      <div className={cx("pageHeaderBar")}>
        <div className={cx("flexBetween", "gap24", "mb20")}>
          <div>
            <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Tracking</div>
            <h1 className={cx("pageTitleText")}>Time Log</h1>
            <p className={cx("pageSubtitleText")}>
              {formatDuration(weekMinutes)} logged this week · {projects.length} active project{projects.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className={cx("pageActions")}>
            <button className={cx("tlv2ExportBtn")} type="button" onClick={onExportCsv}>
              <span className={cx("tlv2BtnIco")}><IcoCsv /></span>Export CSV
            </button>
            <button className={cx("tlv2ExportBtn")} type="button" onClick={onExportJson}>
              <span className={cx("tlv2BtnIco")}><IcoJson /></span>Export JSON
            </button>
            {onSubmitWeek && (
              <button
                type="button"
                className={cx("tlv2SubmitWeekBtn", weekAlreadySubmitted ? "tlv2SubmitWeekBtnDone" : "tlv2SubmitWeekBtnIdle")}
                onClick={() => void onSubmitWeek()}
                disabled={weekAlreadySubmitted || submittingWeek}
                title={weekAlreadySubmitted ? "All entries for this week have been submitted" : `Submit ${currentWeek ?? "this week"} for approval`}
              >
                {submittingWeek ? "Submitting…" : weekAlreadySubmitted ? "Submitted" : `Submit ${currentWeek ? `Week ${currentWeek.split("-W")[1]}` : "Week"}`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Automation: quick-log 8h if no time logged today ─────────── */}
      <AutomationBanner
        show={todayMinutes === 0 && !timerRunning && !!onQuickLog8h}
        variant="info"
        icon={
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M8 5v3.5l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        }
        title="No time logged today"
        description="Quick-log will record 8h to your primary project. You can adjust the entry after."
        actionLabel="Quick-log 8h"
        onAction={onQuickLog8h ?? (async () => {})}
        dismissKey={`staff:tl-quicklog:${new Date().toDateString()}`}
        secondaryLabel="Start timer instead"
        onSecondary={onTimerToggle}
      />

      {/* ── Timer command strip ── */}
      <div className={cx("tlv2Strip", timerRunning ? "tlv2StripActive" : "tlv2StripIdle")}>
        {/* Left: pulse + time + badge */}
        <div className={cx("tlv2StripLeft")}>
          <span className={cx("tlv2Pulse", timerRunning ? "tlv2PulseOn" : "tlv2PulseOff")} />
          <div className={cx("tlv2TimeDisplay")}>{timerDisplay}</div>
          <span className={cx("tlv2RunBadge", timerRunning ? "tlv2RunBadgeOn" : "tlv2RunBadgeOff")}>
            {timerRunning ? "RUNNING" : "IDLE"}
          </span>
          {timerRunning && timerProjectName && (
            <span className={cx("tlv2ActiveProject")}>{timerProjectName}{timerTaskName ? ` · ${timerTaskName}` : ""}</span>
          )}
        </div>

        {/* Center: project + workstream inputs */}
        <div className={cx("tlv2StripCenter")}>
          <select
            className={cx("tlv2Select")}
            value={selectedTimerProjectId}
            onChange={(e) => onTimerProjectChange(e.target.value)}
            aria-label="Project"
          >
            <option value="">Select project…</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <input
            className={cx("tlv2Input")}
            placeholder="What are you working on?"
            value={timerTaskLabel}
            onChange={(e) => onTimerTaskLabelChange(e.target.value)}
            aria-label="Workstream"
          />
        </div>

        {/* Right: play/pause + stop */}
        <div className={cx("tlv2StripRight")}>
          <button
            type="button"
            className={cx("tlv2PlayBtn", timerRunning ? "tlv2PlayBtnRunning" : "tlv2PlayBtnIdle")}
            onClick={onTimerToggle}
          >
            <span className={cx("tlv2BtnIco")}>{timerRunning ? <IcoPause /> : <IcoPlay />}</span>
            {timerRunning ? "Pause" : "Start"}
          </button>
          <button type="button" className={cx("tlv2StopBtn")} onClick={onTimerStop}>
            <IcoStop />
          </button>
        </div>
      </div>

      {/* ── 4-stat grid ── */}
      <div className={cx("tlv2StatGrid")}>
        <div className={cx("stat")}>
          <div className={cx("statAccent", "statAccentAccent")} />
          <div className={cx("statLabel")}>Today</div>
          <div className={cx("statValue")}>{formatDuration(todayMinutes)}</div>
          <div className={cx("statSub")}>
            <span className={cx("tlv2StatBar")}>
              <span className={cx("tlv2StatFill", "tlv2StatFillAccent")} style={{ '--pct': `${todayPct}%` } as React.CSSProperties} />
            </span>
          </div>
        </div>
        <div className={cx("stat")}>
          <div className={cx("statAccent", "statAccentBlue")} />
          <div className={cx("statLabel")}>This Week</div>
          <div className={cx("statValue")}>{formatDuration(weekMinutes)}</div>
          <div className={cx("statSub")}>
            <span className={cx("tlv2StatBar")}>
              <span className={cx("tlv2StatFill", "tlv2StatFillBlue")} style={{ '--pct': `${weekPct}%` } as React.CSSProperties} />
            </span>
          </div>
        </div>
        <div className={cx("stat")}>
          <div className={cx("statAccent", "statAccentGreen")} />
          <div className={cx("statLabel")}>Daily Goal</div>
          <div className={cx("statValue")}>{todayPct}<span className={cx("tlv2StatSuffix")}>%</span></div>
          <div className={cx("statSub")}>
            <span className={todayPct >= 100 ? cx("up") : cx("dn")}>
              {todayPct >= 100 ? "Target hit" : `${formatDuration(dailyTargetMinutes)} target`}
            </span>
          </div>
        </div>
        <div className={cx("stat")}>
          <div className={cx("statAccent", "statAccentAmber")} />
          <div className={cx("statLabel")}>
            <span className={cx("inlineFlex", "gap5")}>
              <IcoTarget /> Weekly Goal
            </span>
          </div>
          <div className={cx("statValue")}>{weekPct}<span className={cx("tlv2StatSuffix")}>%</span></div>
          <div className={cx("statSub")}>
            <span className={weekPct >= 100 ? cx("up") : cx("dn")}>
              {weekPct >= 100 ? "Target hit" : `${formatDuration(weeklyTargetMinutes)} target`}
            </span>
          </div>
        </div>
      </div>

      {/* ── Main content: 2-col ── */}
      <div className={cx("tlv2ContentGrid")}>

        {/* LEFT — This Week chart + breakdown */}
        <div className={cx("card")}>
          <div className={cx("cardHeader")}>
            <span className={cx("cardHeaderTitle")}>This Week</span>
            <span className={cx("tlv2WeekTotal")}>{formatDuration(weekMinutes)}</span>
          </div>
          <div className={cx("cardBody")}>

            {/* Bar chart */}
            <div className={cx("tlv2ChartArea")}>
              {weekData.days.map((day, i) => {
                const mins    = weekData.dailyMinutes[i] ?? 0;
                const pct     = Math.round((mins / chartMax) * 100);
                const isToday = day.date.toDateString() === new Date().toDateString();
                return (
                  <div key={day.label} className={cx("tlv2BarCol")}>
                    <div className={cx("tlv2BarValue", isToday ? "tlv2BarValToday" : "tlv2BarValBase")}>
                      {mins > 0 ? formatDuration(mins) : "—"}
                    </div>
                    <div className={cx("tlv2BarTrack")}>
                      <div
                        className={cx("tlv2Bar", isToday ? "tlv2BarToday" : "tlv2BarBase")} style={{ '--pct': `${Math.max(2, pct)}%` } as React.CSSProperties}
                      />
                    </div>
                    <div className={cx("tlv2BarLabel", isToday ? "tlv2BarLabelToday" : "tlv2BarLabelBase")}>
                      {day.label}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={cx("divider")} />

            {/* Project breakdown */}
            <div className={cx("tlv2Breakdown")}>
              <div className={cx("tlv2BrkHeading")}>By Project</div>
              {projectTimeBreakdown.length === 0 ? (
                <StaffEmptyState icon={EmptyIcons.clock} title="No time logged" sub="Start the timer or log an entry manually." />
              ) : (
                projectTimeBreakdown.map(([project, minutes], i) => {
                  const pct  = Math.round((minutes / Math.max(1, weekMinutes)) * 100);
                  const tone = BREAKDOWN_TONES[i % BREAKDOWN_TONES.length];
                  return (
                    <div key={project} className={cx("tlv2BrkRow")}>
                      <div className={cx("tlv2BrkTop")}>
                        <div className={cx("tlv2BrkDot", tone)} />
                        <span className={cx("tlv2BrkName")}>{project}</span>
                        <span className={cx("tlv2BrkTime", tone)}>{formatDuration(minutes)}</span>
                        <span className={cx("tlv2BrkPct")}>{pct}%</span>
                      </div>
                      <div className={cx("tlv2BrkTrack")}>
                        <div className={cx("tlv2BrkFill", tone)} style={{ '--pct': `${pct}%` } as React.CSSProperties} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT — Recent entries with filter + search */}
        <div className={cx("card")}>
          <div className={cx("cardHeader")}>
            <span className={cx("cardHeaderTitle")}>Recent Entries</span>
            <span className={cx("tlv2EntryCount")}>
              {filteredEntries.length} entr{filteredEntries.length !== 1 ? "ies" : "y"}
            </span>
          </div>

          {/* Filter + search bar */}
          <div className={cx("tlv2EntriesBar")}>
            <div className={cx("tlv2FilterPills")}>
              {FILTER_OPTS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={cx("tlv2FilterPill", entryFilter === opt.value ? "tlv2FilterPillActive" : "tlv2FilterPillIdle")}
                  onClick={() => setEntryFilter(opt.value as "all" | "today" | "week")}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className={cx("tlv2SearchWrap")}>
              <span className={cx("tlv2SearchIco")}><IcoSearch /></span>
              <input
                className={cx("tlv2SearchInput")}
                placeholder="Search…"
                value={entrySearch}
                onChange={(e) => setEntrySearch(e.target.value)}
              />
            </div>
          </div>

          <div className={cx("cardBody", "pt0", "pb8")}>
            <div className={cx("timeEntries")}>
              {filteredEntries.length === 0 ? (
                <StaffEmptyState icon={EmptyIcons.clock} title="No entries" sub="No time entries match the current filter." />
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

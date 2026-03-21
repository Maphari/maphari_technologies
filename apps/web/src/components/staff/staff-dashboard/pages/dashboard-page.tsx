"use client";

import { cx } from "../style";
import type { ActivityItem, ClientThread, DashboardDigestItem, DashboardFocusItem, DashboardInboxItem, SlaWatchItem, TaskContext } from "../types";
import { formatDuration } from "../utils";

type DashboardPageProps = {
  isActive: boolean;
  todayLabel: string;
  weekNumber: number;
  staffName: string;
  openTasksCount: number;
  openConversationsCount: number;
  overdueCount: number;
  onGoTimeLog: () => void;
  onGoKanban: () => void;
  onGoTasks: () => void;
  onGoClients: () => void;
  onGoDeliverables: () => void;
  onRunDashboardAction: (action: "tasks" | "clients" | "deliverables" | "timelog", threadId?: string) => void;
  timerDisplay: string;
  timerRunning: boolean;
  timerProjectName: string;
  timerTaskName: string;
  selectedTimerProjectId: string;
  onTimerProjectChange: (value: string) => void;
  timerTaskLabel: string;
  onTimerTaskLabelChange: (value: string) => void;
  projects: Array<{ id: string; name: string }>;
  onTimerToggle: () => void;
  onTimerStop: () => void;
  todayMinutes: number;
  weekMinutes: number;
  averageProgress: number;
  daysLeft: number | null;
  nextDueLabel: string;
  projectsCount: number;
  highPriorityTasksCount: number;
  priorityTasks: TaskContext[];
  threadItems: ClientThread[];
  onOpenThread: (threadId: string) => void;
  collaborationRows: Array<{
    projectName: string;
    name: string;
    role: string;
    activeSessions: number;
    taskCount: number;
  }>;
  projectTimeBreakdown: Array<[string, number]>;
  maxProjectMinutes: number;
  slaWatchlist: SlaWatchItem[];
  activityFeed: ActivityItem[];
  focusQueue: DashboardFocusItem[];
  actionInbox: DashboardInboxItem[];
  digestItems: DashboardDigestItem[];
  dashboardLastSeenAt: string | null;
  slaBurn: {
    tone: "red" | "amber" | "green";
    statusLabel: string;
    detail: string;
    riskCount: number;
    watchCount: number;
  };
  flowHealth: {
    wipCount: number;
    blockedPercent: number;
    throughput7d: number;
    avgCycleDays: number;
  };
};

function healthDotClass(thread: ClientThread): string {
  if (thread.unread) return "homeHealthWarn";
  return "homeHealthGood";
}

function healthLabel(thread: ClientThread): string {
  if (thread.unread) return "Needs reply";
  return "On track";
}

export function DashboardPage({
  isActive,
  todayLabel,
  weekNumber,
  staffName,
  openTasksCount,
  openConversationsCount,
  overdueCount,
  onGoTimeLog,
  onGoKanban,
  onGoTasks,
  onGoClients,
  onGoDeliverables,
  onRunDashboardAction,
  timerDisplay,
  timerRunning,
  timerProjectName,
  timerTaskName,
  selectedTimerProjectId,
  onTimerProjectChange,
  timerTaskLabel,
  onTimerTaskLabelChange,
  projects,
  onTimerToggle,
  onTimerStop,
  todayMinutes,
  weekMinutes,
  averageProgress,
  daysLeft,
  nextDueLabel,
  projectsCount,
  highPriorityTasksCount,
  priorityTasks,
  threadItems,
  onOpenThread,
  collaborationRows,
  projectTimeBreakdown,
  maxProjectMinutes,
  slaWatchlist,
  activityFeed,
  focusQueue,
  actionInbox,
  digestItems,
  dashboardLastSeenAt,
  slaBurn,
  flowHealth,
}: DashboardPageProps) {
  // Derived values
  const urgentCount = overdueCount + highPriorityTasksCount;
  const hasUrgentItems = urgentCount > 0;

  // Focus hero: first high-priority task, or first task, or null
  const focusTask =
    priorityTasks.find((t) => t.priority === "high") ??
    priorityTasks[0] ??
    null;

  const progress = focusTask?.progress ?? 0;

  // Today's task list (up to 6)
  const todayTasks = priorityTasks.slice(0, 6);

  // Hours logged today
  const hoursToday = todayMinutes > 0 ? formatDuration(todayMinutes) : "—";

  // Client count from thread items (unique client names as proxy)
  const clientCount = threadItems.length > 0 ? threadItems.length : projectsCount;

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-dashboard">
      <div className={cx("homePage")}>
        {/* Header */}
        <p className={cx("pageEyebrow")}>{todayLabel} · Week {weekNumber}</p>
        <h1 className={cx("pageTitle")}>Good morning, {staffName}</h1>

        {/* 1. Alert strip */}
        {hasUrgentItems && (
          <div className={cx("homeAlertStrip")}>
            <div>
              <div className={cx("homeAlertText")}>{urgentCount} task{urgentCount === 1 ? "" : "s"} need attention</div>
              <div className={cx("homeAlertMeta")}>Due today or overdue · {overdueCount} overdue, {highPriorityTasksCount} high priority</div>
            </div>
            <div className={cx("homeAlertJoin")}>
              <button className={cx("homeFocusOpenBtn")} type="button" onClick={onGoTasks}>Review</button>
            </div>
          </div>
        )}

        {/* 2. Focus Hero card */}
        <div className={cx("homeFocusCard")}>
          <div className={cx("homeFocusLabel")}>⚡ FOCUS NOW</div>
          <div className={cx("homeFocusClient")}>{focusTask?.clientName ?? "—"}</div>
          <div className={cx("homeFocusTitle")}>{focusTask?.title ?? "No tasks today"}</div>
          <div className={cx("homeFocusProgress")}>
            <div className={cx("homeFocusProgressBar")}>
              <div className={cx("homeFocusProgressFill")} style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
            </div>
            <div className={cx("homeFocusProgressMeta")}>
              <span>{progress}% complete</span>
              <span>{focusTask?.dueLabel ? focusTask.dueLabel : ""}</span>
            </div>
          </div>
          <div className={cx("homeFocusActions")}>
            <button className={cx("homeFocusTimerBtn")} type="button" onClick={onTimerToggle}>
              {timerRunning ? "⏸ Pause Timer" : "▶ Start Timer"}
            </button>
            <button className={cx("homeFocusOpenBtn")} type="button" onClick={onGoTasks}>Open Task</button>
          </div>
        </div>

        {/* 3. Three-stat row */}
        <div className={cx("homeStats")}>
          <div className={cx("homeStatCard")}>
            <div className={cx("homeStatNum")}>{openTasksCount}</div>
            <div className={cx("homeStatLabel")}>Open Tasks</div>
          </div>
          <div className={cx("homeStatCard")}>
            <div className={cx("homeStatNum")}>{hoursToday}</div>
            <div className={cx("homeStatLabel")}>Logged Today</div>
          </div>
          <div className={cx("homeStatCard")}>
            <div className={cx("homeStatNum")}>{clientCount > 0 ? clientCount : "—"}</div>
            <div className={cx("homeStatLabel")}>Clients</div>
          </div>
        </div>

        {/* 4. Two-column body: today tasks + client pulse */}
        <div className={cx("homeBody")}>
          {/* Left: today's task list */}
          <div className={cx("homeTodayTasks")}>
            {todayTasks.length === 0 ? (
              <div className={cx("homeTodayTask")}>
                <div className={cx("homeTodayTaskText")}>All tasks on track</div>
              </div>
            ) : (
              todayTasks.map((task) => (
                <div
                  key={`${task.id}-${task.title}`}
                  className={cx("homeTodayTask", task.status === "DONE" && "homeTodayTaskDone")}
                >
                  <div className={cx("homeTodayTaskCheck")} />
                  <div className={cx("homeTodayTaskText")}>{task.title}</div>
                  <div className={cx("homeTodayTaskDue")}>{task.dueLabel}</div>
                </div>
              ))
            )}
          </div>

          {/* Right: client pulse */}
          <div className={cx("homeClientPulse")}>
            {threadItems.length === 0 ? (
              <div className={cx("homeClientRow")}>
                <div className={cx("homeClientName")}>No client activity</div>
              </div>
            ) : (
              threadItems.slice(0, 6).map((thread) => (
                <div
                  key={thread.id}
                  className={cx("homeClientRow")}
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpenThread(thread.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onOpenThread(thread.id);
                    }
                  }}
                >
                  <div className={cx("homeHealthDot", healthDotClass(thread))} />
                  <div className={cx("homeClientName")}>{thread.name}</div>
                  <div className={cx("homeClientScore")}>{healthLabel(thread)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { ActivityRow } from "../ui";
import { cx, styles } from "../style";
import type { ActivityItem, ClientThread, DashboardDigestItem, DashboardFocusItem, DashboardInboxItem, SlaWatchItem, TaskContext } from "../types";
import { capitalize, formatDateShort, formatDuration } from "../utils";

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
  flowHealth
}: DashboardPageProps) {
  return (
    <section className={cx("page", isActive && "pageActive")} id="page-dashboard">
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>{todayLabel} · Week {weekNumber}</div>
          <div className={styles.pageTitle}>Good morning, {staffName}</div>
          <div className={styles.pageSub}>
            You have {openTasksCount} open tasks · {openConversationsCount} client messages · {overdueCount} deliverables overdue.
          </div>
        </div>
        <div className={styles.pageActions}>
          <button className={cx("button", "buttonGhost")} type="button" onClick={onGoTimeLog}>Log Time</button>
          <button className={cx("button", "buttonGreen")} type="button" onClick={onGoKanban}>Open Board</button>
        </div>
      </div>

      <div className={styles.grid2}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>Today Focus Queue</span>
            <button className={styles.cardLinkButton} type="button" onClick={onGoTasks}>All tasks →</button>
          </div>
          <div className={styles.cardBody} style={{ paddingTop: 10, paddingBottom: 10 }}>
            {focusQueue.length === 0 ? (
              <div className={styles.emptyState}>No urgent actions right now.</div>
            ) : (
              <div className={styles.dashboardList}>
                {focusQueue.map((item) => (
                  <div key={item.id} className={styles.dashboardListItem}>
                    <div>
                      <div className={styles.dashboardListTitle}>{item.title}</div>
                      <div className={styles.dashboardListDetail}>{item.detail}</div>
                    </div>
                    <div className={styles.dashboardListActions}>
                      <span className={cx("badge", `badge${capitalize(item.urgency === "high" ? "red" : item.urgency === "med" ? "amber" : "green")}`)}>
                        {item.urgency.toUpperCase()}
                      </span>
                      <button
                        className={cx("button", "buttonGhost")}
                        type="button"
                        onClick={() => onRunDashboardAction(item.action, item.threadId)}
                        aria-label={`${item.actionLabel}: ${item.title}`}
                      >
                        {item.actionLabel}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>Cross-Portal Action Inbox</span>
            <button className={styles.cardLinkButton} type="button" onClick={onGoDeliverables}>Open workstream →</button>
          </div>
          <div className={styles.cardBody} style={{ paddingTop: 10, paddingBottom: 10 }}>
            {actionInbox.length === 0 ? (
              <div className={styles.emptyState}>All clear. No pending cross-portal actions.</div>
            ) : (
              <div className={styles.dashboardList}>
                {actionInbox.map((item) => (
                  <div key={item.id} className={styles.dashboardListItem}>
                    <div>
                      <div className={styles.dashboardListTitle}>{item.label}</div>
                      <div className={styles.dashboardListDetail}>{item.detail}</div>
                    </div>
                    <div className={styles.dashboardListActions}>
                      <span className={cx("badge", `badge${capitalize(item.tone)}`)}>{item.count}</span>
                      <button
                        className={cx("button", item.tone === "red" ? "buttonBlue" : "buttonGhost")}
                        type="button"
                        onClick={() => onRunDashboardAction(item.action)}
                        aria-label={`${item.actionLabel}: ${item.label}`}
                      >
                        {item.actionLabel}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.timerWidget}>
        <div className={styles.timerClockBlock}>
          <div className={styles.timerDisplay} id="timerDisplay">{timerDisplay}</div>
          <span className={cx("badge", timerRunning ? "badgeAmber" : "badgeBlue")}>
            {timerRunning ? "Tracking" : "Idle"}
          </span>
        </div>

        <div className={styles.timerInfo}>
          <div className={styles.timerProject}>{timerProjectName}</div>
          <div className={styles.timerTask}>{timerTaskName}</div>
          <div className={styles.timerActions}>
            <button
              className={cx("timerButton", "timerPlay")}
              type="button"
              onClick={onTimerToggle}
              style={timerRunning ? { background: "var(--amber)", color: "#07090f" } : undefined}
              aria-label={timerRunning ? "Pause timer" : "Start timer"}
            >
              {timerRunning ? "⏸" : "▶"}
            </button>
            <button className={cx("timerButton", "timerStop")} type="button" onClick={onTimerStop} aria-label="Stop timer">■</button>
            <span className={styles.timerHint}>{timerRunning ? "Timer is running" : "Start tracking to capture time"}</span>
          </div>
        </div>

        <div className={styles.timerInputsGrid}>
          <div className={styles.field} style={{ marginBottom: 0 }}>
            <label className={styles.fieldLabel} htmlFor="dashboard-timer-project">Project</label>
            <select
              id="dashboard-timer-project"
              className={cx("fieldInput", "fieldSelect")}
              value={selectedTimerProjectId}
              onChange={(event) => onTimerProjectChange(event.target.value)}
              aria-describedby="dashboard-timer-project-hint"
            >
              <option value="">Select project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
            <span id="dashboard-timer-project-hint" className={styles.fieldHint}>Pick the project for this work session.</span>
          </div>
          <div className={styles.field} style={{ marginBottom: 0 }}>
            <label className={styles.fieldLabel} htmlFor="dashboard-timer-task">Workstream</label>
            <input
              id="dashboard-timer-task"
              className={styles.fieldInput}
              placeholder="Example: API integration"
              value={timerTaskLabel}
              onChange={(event) => onTimerTaskLabelChange(event.target.value)}
              aria-describedby="dashboard-timer-task-hint"
            />
            <span id="dashboard-timer-task-hint" className={styles.fieldHint}>Short description of what you are working on.</span>
          </div>
        </div>

        <div className={styles.timerSummary}>
          <div className={styles.timerLog}>
            <div className={styles.timerTask}>Today logged</div>
            <span>{formatDuration(todayMinutes)}</span>
          </div>
          <div className={styles.timerLog}>
            <div className={styles.timerTask}>This week</div>
            <span>{formatDuration(weekMinutes)}</span>
          </div>
        </div>
      </div>

      <div className={styles.sprintBar}>
        <div className={styles.sprintLabel}>Delivery</div>
        <div className={styles.sprintName}>Active project focus</div>
        <div className={styles.sprintProgress}>
          <div className={styles.sprintProgressHeader}>
            <span>Average progress</span>
            <span className={styles.sprintProgressValue}>{averageProgress}%</span>
          </div>
          <div className={styles.sprintProgressBar}>
            <div className={styles.sprintProgressFill} style={{ width: `${averageProgress}%` }} />
          </div>
        </div>
        <div className={styles.sprintDays}>{daysLeft !== null ? `${daysLeft} days to next due date` : nextDueLabel}</div>
        <span className={cx("badge", "badgeBlue")}>{projectsCount > 0 ? "Active" : "Idle"}</span>
      </div>

      <div className={cx("stats", "stats4")}>
        <div className={styles.stat}>
          <div className={styles.statAccent} style={{ background: "var(--accent)" }} />
          <div className={styles.statLabel}>Open Tasks</div>
          <div className={styles.statValue}>{openTasksCount}</div>
          <div className={styles.statSub}><span className={styles.warn}>▲ {highPriorityTasksCount} high priority</span></div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statAccent} style={{ background: "var(--red)" }} />
          <div className={styles.statLabel}>Overdue Deliverables</div>
          <div className={styles.statValue}>{overdueCount}</div>
          <div className={styles.statSub}><span className={styles.dn}>{overdueCount ? "Needs attention" : "No overdue items"}</span></div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statAccent} style={{ background: "var(--amber)" }} />
          <div className={styles.statLabel}>Client Messages</div>
          <div className={styles.statValue}>{openConversationsCount}</div>
          <div className={styles.statSub}><span className={styles.warn}>Awaiting reply</span></div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statAccent} style={{ background: "var(--green)" }} />
          <div className={styles.statLabel}>Hours This Week</div>
          <div className={styles.statValue}>{(weekMinutes / 60).toFixed(1)}</div>
          <div className={styles.statSub}><span className={styles.up}>↑ on pace</span></div>
        </div>
      </div>

      <div className={styles.grid2}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>SLA Burn Alerts</span>
            <button className={styles.cardLinkButton} type="button" onClick={onGoDeliverables}>Open deliverables →</button>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.timeSummary}>
              <span>{slaBurn.statusLabel}</span>
              <span className={cx("badge", `badge${capitalize(slaBurn.tone)}`)}>{slaBurn.riskCount + slaBurn.watchCount}</span>
            </div>
            <div className={styles.pageSub} style={{ marginTop: 8 }}>{slaBurn.detail}</div>
            <div className={styles.timeBars} style={{ marginTop: 12 }}>
              <div className={styles.timeRow}>
                <span>Immediate risk</span>
                <span className={styles.timeRowValue}>{slaBurn.riskCount}</span>
              </div>
              <div className={styles.timeBar}>
                <div
                  style={{
                    height: "100%",
                    width: `${Math.min(100, slaBurn.riskCount * 20)}%`,
                    background: "var(--red)",
                    borderRadius: 2
                  }}
                />
              </div>
              <div className={styles.timeRow}>
                <span>Watch next 7 days</span>
                <span className={styles.timeRowValue}>{slaBurn.watchCount}</span>
              </div>
              <div className={styles.timeBar}>
                <div
                  style={{
                    height: "100%",
                    width: `${Math.min(100, slaBurn.watchCount * 20)}%`,
                    background: "var(--amber)",
                    borderRadius: 2
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>Flow Health</span>
            <button className={styles.cardLinkButton} type="button" onClick={onGoTasks}>Open tasks →</button>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.grid2} style={{ gap: 10, marginBottom: 0 }}>
              <div className={styles.stat} style={{ marginBottom: 0 }}>
                <div className={styles.statLabel}>WIP</div>
                <div className={styles.statValue}>{flowHealth.wipCount}</div>
                <div className={styles.statSub}>Open tasks</div>
              </div>
              <div className={styles.stat} style={{ marginBottom: 0 }}>
                <div className={styles.statLabel}>Blocked</div>
                <div className={styles.statValue}>{flowHealth.blockedPercent}%</div>
                <div className={styles.statSub}>Of WIP</div>
              </div>
              <div className={styles.stat} style={{ marginBottom: 0 }}>
                <div className={styles.statLabel}>Throughput</div>
                <div className={styles.statValue}>{flowHealth.throughput7d}</div>
                <div className={styles.statSub}>Done in 7 days</div>
              </div>
              <div className={styles.stat} style={{ marginBottom: 0 }}>
                <div className={styles.statLabel}>Cycle Time</div>
                <div className={styles.statValue}>{flowHealth.avgCycleDays.toFixed(1)}d</div>
                <div className={styles.statSub}>Avg completed</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.grid32}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>Priority Tasks Today</span>
            <button className={styles.cardLinkButton} type="button" onClick={onGoTasks}>All tasks →</button>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th></th>
                <th>Task</th>
                <th>Project</th>
                <th>Status</th>
                <th>Due</th>
              </tr>
            </thead>
            <tbody>
              {priorityTasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.emptyState}>No priority tasks yet.</td>
                </tr>
              ) : (
                priorityTasks.map((task) => (
                  <tr key={`${task.id}-${task.title}`}>
                    <td><div className={cx("priority", `priority${capitalize(task.priority)}`)} /></td>
                    <td>
                      <div className={styles.tableName}>{task.title}</div>
                      <div className={styles.tableSub}>{task.subtitle}</div>
                    </td>
                    <td><span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>{task.projectName}</span></td>
                    <td><span className={cx("badge", `badge${capitalize(task.badgeTone)}`)}>{task.statusLabel}</span></td>
                    <td><span className={styles.mono} style={{ fontSize: "0.68rem", color: task.dueTone }}>{task.dueLabel}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.rightColumn}>
          <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>Client Messages</span>
            <button className={styles.cardLinkButton} type="button" onClick={onGoClients}>Open →</button>
          </div>
            <div>
              {threadItems.length === 0 ? (
                <div className={styles.emptyState}>No client messages yet.</div>
              ) : (
                threadItems.slice(0, 3).map((thread, index) => (
                  <div
                    key={thread.id}
                    className={cx("clientItem", index === 0 && "clientItemActive")}
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpenThread(thread.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onOpenThread(thread.id);
                      }
                    }}
                  >
                    <div className={styles.clientAvatar} style={{ background: thread.avatar.bg, color: thread.avatar.color }}>{thread.avatar.label}</div>
                    <div className={styles.clientBody}>
                      <div className={styles.clientMeta}>
                        <span className={styles.clientName}>{thread.name}</span>
                        <span className={styles.clientTime}>{thread.time}</span>
                      </div>
                      <div className={styles.clientProject}>{thread.project}</div>
                      <div className={styles.clientPreview}>{thread.preview}</div>
                    </div>
                    {thread.unread ? <div className={styles.clientUnread} /> : null}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}><span className={styles.cardHeaderTitle}>Today&apos;s Time</span></div>
            <div className={styles.cardBody}>
              <div className={styles.timeSummary}>
                <span>Total logged</span>
                <span className={styles.timeSummaryValue}>{formatDuration(todayMinutes)}</span>
              </div>
              <div className={styles.timeBars}>
                {projectTimeBreakdown.length === 0 ? (
                  <div className={styles.emptyState}>No time logged yet.</div>
                ) : (
                  projectTimeBreakdown.slice(0, 2).map(([project, minutes]) => (
                    <div key={project}>
                      <div className={styles.timeRow}>
                        <span>{project}</span>
                        <span className={styles.timeRowValue}>{formatDuration(minutes)}</span>
                      </div>
                      <div className={styles.timeBar}>
                        <div
                          style={{
                            height: "100%",
                            width: `${maxProjectMinutes ? Math.round((minutes / maxProjectMinutes) * 100) : 0}%`,
                            background: "var(--accent)",
                            borderRadius: 2
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}><span className={styles.cardHeaderTitle}>SLA Watchlist</span></div>
            <div className={styles.cardBody}>
              {slaWatchlist.length === 0 ? (
                <div className={styles.emptyState}>No SLA deadlines in the next 7 days.</div>
              ) : (
                <div className={styles.timeBars}>
                  {slaWatchlist.map((project) => (
                    <div key={project.id}>
                      <div className={styles.timeRow}>
                        <span>{project.name}</span>
                        <span className={styles.timeRowValue}>{formatDateShort(project.slaDueAt)}</span>
                      </div>
                      <div className={styles.timeRow} style={{ fontSize: "0.68rem", color: "var(--muted)" }}>
                        <span>{project.clientName}</span>
                        <span>{project.statusLabel}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}><span className={styles.cardHeaderTitle}>Team Collaboration</span></div>
            <div className={styles.cardBody}>
              {collaborationRows.length === 0 ? (
                <div className={styles.emptyState}>No collaboration assignments yet.</div>
              ) : (
                <div className={styles.timeBars}>
                  {collaborationRows.slice(0, 4).map((entry) => (
                    <div key={`${entry.projectName}-${entry.name}`}>
                      <div className={styles.timeRow}>
                        <span>{entry.name}</span>
                        <span className={styles.timeRowValue}>{entry.activeSessions > 0 ? "Active" : entry.role}</span>
                      </div>
                      <div className={styles.timeRow} style={{ fontSize: "0.68rem", color: "var(--muted)" }}>
                        <span>{entry.projectName}</span>
                        <span>{entry.taskCount} task{entry.taskCount === 1 ? "" : "s"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={cx("card", "fullWidth")}>
        <div className={styles.cardHeader}>
          <span className={styles.cardHeaderTitle}>Since Last Login</span>
          <span className={styles.mono} style={{ fontSize: "0.6rem", color: "var(--muted2)" }}>
            {dashboardLastSeenAt ? `Since ${formatDateShort(dashboardLastSeenAt)}` : "First session"}
          </span>
        </div>
        <div className={styles.cardBody} style={{ paddingTop: 8, paddingBottom: 8 }}>
          {digestItems.length === 0 ? (
            <div className={styles.emptyState}>No updates since your last login.</div>
          ) : (
            <div className={styles.activityList} aria-live="polite">
              {digestItems.map((digest) => (
                <ActivityRow
                  key={digest.id}
                  icon="•"
                  tone="var(--accent-d)"
                  color="var(--accent)"
                  text={digest.title}
                  detail={digest.detail}
                  time={formatDateShort(digest.occurredAt)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={cx("card", "fullWidth")}>
        <div className={styles.cardHeader}><span className={styles.cardHeaderTitle}>Recent Activity</span></div>
        <div className={styles.cardBody} style={{ paddingTop: 8, paddingBottom: 8 }}>
          <div className={styles.activityList}>
            {activityFeed.length === 0 ? (
              <div className={styles.emptyState}>No activity logged yet.</div>
            ) : (
              activityFeed.map((activity) => (
                <ActivityRow
                  key={activity.id}
                  icon={activity.icon}
                  tone={activity.tone}
                  color={activity.color}
                  text={activity.text}
                  detail={activity.detail}
                  time={activity.time}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

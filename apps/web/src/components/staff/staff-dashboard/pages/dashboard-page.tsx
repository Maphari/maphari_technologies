"use client";

import { ActivityRow } from "../ui";
import { cx, styles } from "../style";
import type { ActivityItem, ClientThread, DashboardDigestItem, DashboardFocusItem, DashboardInboxItem, SlaWatchItem, TaskContext } from "../types";
import { capitalize, formatDateShort, formatDuration } from "../utils";

function dueToneClass(tone: string) {
  if (tone === "var(--red)") return "colorRed";
  if (tone === "var(--amber)") return "colorAmber";
  return "colorMuted";
}

function avatarToneClass(color: string) {
  if (color === "var(--amber)") return "clientAvatarToneAmber";
  if (color === "var(--purple)") return "clientAvatarTonePurple";
  if (color === "var(--green)") return "clientAvatarToneGreen";
  return "clientAvatarToneAccent";
}

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
  const urgentFocusCount = focusQueue.filter((item) => item.urgency === "high").length;
  const actionInboxCount = actionInbox.reduce((sum, item) => sum + item.count, 0);
  const nextDueText = daysLeft !== null ? `${daysLeft} days` : nextDueLabel;

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-dashboard">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("flexBetween", "gap24", "mb20")}>
          <div>
            <div className={cx("pageEyebrowText", "mb8")}>{todayLabel} · Week {weekNumber}</div>
            <h1 className={cx("pageTitleText")}>Good morning, {staffName}</h1>
            <p className={cx("pageSubtitleText")}>
              You have {openTasksCount} open tasks · {openConversationsCount} client messages · {overdueCount} deliverables overdue.
            </p>
          </div>
          <div className={cx("pageActions")}>
            <button className={cx("btnSm", "btnGhost")} type="button" onClick={onGoTimeLog}>Log Time</button>
            <button className={cx("btnSm", "btnAccent")} type="button" onClick={onGoKanban}>Open Board</button>
          </div>
        </div>
      </div>

      <div className={styles.staffDashSummaryGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Open Tasks</div>
          <div className={cx(styles.statValue, "colorAccent")}>{openTasksCount}</div>
          <div className={cx("text11", highPriorityTasksCount > 0 ? "colorAmber" : "colorMuted")}>
            {highPriorityTasksCount} high priority
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Client Messages</div>
          <div className={cx(styles.statValue, "colorBlue")}>{openConversationsCount}</div>
          <div className={cx("text11", "colorMuted")}>Awaiting response</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Delivery Risk</div>
          <div className={cx(styles.statValue, overdueCount > 0 ? "colorRed" : "colorAccent")}>{overdueCount}</div>
          <div className={cx("text11", overdueCount > 0 ? "colorRed" : "colorMuted")}>
            {overdueCount > 0 ? "Needs attention" : "No overdue items"}
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Hours This Week</div>
          <div className={cx(styles.statValue, "colorAmber")}>{(weekMinutes / 60).toFixed(1)}</div>
          <div className={cx("text11", "colorMuted")}>Today: {formatDuration(todayMinutes)}</div>
        </div>
      </div>

      <div className={styles.staffDashMainGrid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>Priority Tasks Today</span>
            <button className={cx(styles.cardLinkButton, styles.staffDashLinkButton)} type="button" onClick={onGoTasks}>All tasks →</button>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={cx("textCenter")} scope="col">Priority</th>
                  <th scope="col">Task</th>
                  <th scope="col">Project</th>
                  <th className={cx("textCenter")} scope="col">Status</th>
                  <th className={cx("textRight")} scope="col">Due</th>
                </tr>
              </thead>
              <tbody>
                {priorityTasks.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 0 }}>
                      <div style={{ padding: "36px 20px", textAlign: "center", position: "relative", overflow: "hidden" }}>
                        {/* Gradient blob */}
                        <div style={{
                          position: "absolute", width: 240, height: 240, borderRadius: "50%",
                          background: "radial-gradient(circle, rgba(200, 241, 53, 0.05) 0%, transparent 70%)",
                          top: "50%", left: "50%", transform: "translate(-50%, -50%)", pointerEvents: "none",
                        }} />
                        <div style={{ position: "relative", zIndex: 1 }}>
                          <div style={{
                            width: 44, height: 44, borderRadius: 11, border: "1px solid rgba(200, 241, 53, 0.18)",
                            background: "rgba(200, 241, 53, 0.03)", display: "grid", placeItems: "center",
                            margin: "0 auto 14px",
                          }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--lime)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M9 11l3 3L22 4"/>
                              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                            </svg>
                          </div>
                          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
                            No priority tasks yet
                          </div>
                          <div style={{ fontSize: "0.7rem", color: "var(--muted)", maxWidth: 260, margin: "0 auto 16px", lineHeight: 1.5 }}>
                            High-priority tasks assigned to you will appear here. Head to the board to pick up work.
                          </div>
                          <button
                            type="button"
                            onClick={onGoKanban}
                            style={{
                              padding: "7px 16px",
                              background: "var(--accent)",
                              color: "var(--bg)",
                              border: "none",
                              borderRadius: 8,
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              letterSpacing: "0.06em",
                              textTransform: "uppercase",
                              cursor: "pointer",
                              transition: "opacity 0.2s",
                            }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                          >
                            Open Board
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  priorityTasks.map((task) => (
                    <tr key={`${task.id}-${task.title}`}>
                      <td className={cx("textCenter")}><div className={cx("priority", `priority${capitalize(task.priority)}`)} /></td>
                      <td>
                        <div className={styles.tableName}>{task.title}</div>
                        <div className={styles.tableSub}>{task.subtitle}</div>
                      </td>
                      <td><span className={cx("textSm", "colorMuted")}>{task.projectName}</span></td>
                      <td className={cx("textCenter")}><span className={cx("badge", `badge${capitalize(task.badgeTone)}`)}>{task.statusLabel}</span></td>
                      <td className={cx("textRight")}><span className={cx("mono", "text11", dueToneClass(task.dueTone))}>{task.dueLabel}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.staffDashRail}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardHeaderTitle}>Operations Snapshot</span>
              <button className={cx(styles.cardLinkButton, styles.staffDashLinkButton)} type="button" onClick={onGoKanban}>Open board →</button>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.timeSummary}>
                <span>Live timer</span>
                <span className={cx(styles.timeSummaryValue, "colorAccent")}>{timerDisplay}</span>
              </div>
              <div className={styles.timeBars}>
                <div className={styles.timeRow}>
                  <span>Current project</span>
                  <span className={styles.timeRowValue}>{timerRunning ? timerProjectName : "No active session"}</span>
                </div>
                <div className={styles.timeRow}>
                  <span>Next due milestone</span>
                  <span className={styles.timeRowValue}>{nextDueText}</span>
                </div>
                <div className={styles.timeRow}>
                  <span>Action inbox</span>
                  <span className={styles.timeRowValue}>{actionInboxCount} pending</span>
                </div>
                <div className={styles.timeRow}>
                  <span>Avg project progress</span>
                  <span className={styles.timeRowValue}>{averageProgress}%</span>
                </div>
                <div className={styles.timeBar}>
                  <progress className={cx("progressMeter", "progressMeterAccent")} max={100} value={Math.max(0, Math.min(100, averageProgress))} />
                </div>
              </div>
              <div className={styles.staffDashOpsGrid}>
                <button className={cx("button", "buttonGhost", styles.staffDashButtonGhost)} type="button" onClick={() => onRunDashboardAction("tasks")}>Tasks</button>
                <button className={cx("button", "buttonGhost", styles.staffDashButtonGhost)} type="button" onClick={() => onRunDashboardAction("clients")}>Clients</button>
                <button className={cx("button", "buttonGhost", styles.staffDashButtonGhost)} type="button" onClick={() => onRunDashboardAction("deliverables")}>Deliverables</button>
                <button className={cx("button", "buttonGhost", styles.staffDashButtonGhost)} type="button" onClick={() => onRunDashboardAction("timelog")}>Time Log</button>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardHeaderTitle}>Today Focus</span>
              <button className={cx(styles.cardLinkButton, styles.staffDashLinkButton)} type="button" onClick={onGoTasks}>Open queue →</button>
            </div>
            <div className={styles.cardBody}>
              {focusQueue.length === 0 ? (
                <div className={styles.emptyState}>No urgent focus items right now.</div>
              ) : (
                <div className={styles.staffDashFocusList}>
                  {focusQueue.slice(0, 4).map((item) => (
                    <div key={item.id} className={styles.staffDashFocusRow}>
                      <div className={styles.staffDashFocusMeta}>
                        <div className={styles.tableName}>{item.title}</div>
                        <div className={styles.tableSub}>{item.detail}</div>
                      </div>
                      <div className={styles.staffDashFocusActions}>
                        <span className={cx("badge", `badge${capitalize(item.urgency === "high" ? "red" : item.urgency === "med" ? "amber" : "green")}`)}>
                          {item.urgency}
                        </span>
                        <button
                          className={cx("button", "buttonGhost", styles.staffDashButtonGhost)}
                          type="button"
                          onClick={() => onRunDashboardAction(item.action, item.threadId)}
                        >
                          {item.actionLabel}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className={cx("text11", "colorMuted", "mt10")}>{urgentFocusCount} urgent items flagged</div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.dashboardInsightsGrid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>SLA Burn Alerts</span>
            <button className={cx(styles.cardLinkButton, styles.staffDashLinkButton)} type="button" onClick={onGoDeliverables}>Open deliverables →</button>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.timeSummary}>
              <span>{slaBurn.statusLabel}</span>
              <span className={cx("badge", `badge${capitalize(slaBurn.tone)}`)}>{slaBurn.riskCount + slaBurn.watchCount}</span>
            </div>
            <div className={cx("pageSub", "mt8")}>{slaBurn.detail}</div>
            <div className={cx("timeBars", "mt12")}>
              <div className={styles.timeRow}>
                <span>Immediate risk</span>
                <span className={styles.timeRowValue}>{slaBurn.riskCount}</span>
              </div>
              <div className={styles.timeBar}>
                <progress
                  className={cx("progressMeter", "progressMeterRed")}
                  max={100}
                  value={Math.min(100, slaBurn.riskCount * 20)}
                />
              </div>
              <div className={styles.timeRow}>
                <span>Watch next 7 days</span>
                <span className={styles.timeRowValue}>{slaBurn.watchCount}</span>
              </div>
              <div className={styles.timeBar}>
                <progress
                  className={cx("progressMeter", "progressMeterAmber")}
                  max={100}
                  value={Math.min(100, slaBurn.watchCount * 20)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>Flow Health</span>
            <button className={cx(styles.cardLinkButton, styles.staffDashLinkButton)} type="button" onClick={onGoTasks}>Open tasks →</button>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.staffDashFlowGrid}>
              <div className={cx("stat", "mb0")}>
                <div className={styles.statLabel}>WIP</div>
                <div className={styles.statValue}>{flowHealth.wipCount}</div>
                <div className={styles.statSub}>Open tasks</div>
              </div>
              <div className={cx("stat", "mb0")}>
                <div className={styles.statLabel}>Blocked</div>
                <div className={styles.statValue}>{flowHealth.blockedPercent}%</div>
                <div className={styles.statSub}>Of WIP</div>
              </div>
              <div className={cx("stat", "mb0")}>
                <div className={styles.statLabel}>Throughput</div>
                <div className={styles.statValue}>{flowHealth.throughput7d}</div>
                <div className={styles.statSub}>Done in 7 days</div>
              </div>
              <div className={cx("stat", "mb0")}>
                <div className={styles.statLabel}>Cycle Time</div>
                <div className={styles.statValue}>{flowHealth.avgCycleDays.toFixed(1)}d</div>
                <div className={styles.statSub}>Avg completed</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.staffDashSupportGrid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>Client Messages</span>
            <button className={cx(styles.cardLinkButton, styles.staffDashLinkButton)} type="button" onClick={onGoClients}>Open →</button>
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
                  <div className={cx("clientAvatar", avatarToneClass(thread.avatar.color))}>{thread.avatar.label}</div>
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
                projectTimeBreakdown.slice(0, 3).map(([project, minutes]) => (
                  <div key={project}>
                    <div className={styles.timeRow}>
                      <span>{project}</span>
                      <span className={styles.timeRowValue}>{formatDuration(minutes)}</span>
                    </div>
                    <div className={styles.timeBar}>
                      <progress
                        className={cx("progressMeter", "progressMeterAccent")}
                        max={100}
                        value={maxProjectMinutes ? Math.round((minutes / maxProjectMinutes) * 100) : 0}
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
                    <div className={cx("timeRow", "text11", "colorMuted")}>
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
                    <div className={cx("timeRow", "text11", "colorMuted")}>
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

      <div className={styles.staffDashActivityGrid}>
        <div className={cx("card", "fullWidth")}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>Since Last Login</span>
            <span className={cx("mono", "textXs", "colorMuted2")}>
              {dashboardLastSeenAt ? `Since ${formatDateShort(dashboardLastSeenAt)}` : "First session"}
            </span>
          </div>
          <div className={cx("cardBody", "pt8", "pb8")}>
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
          <div className={cx("cardBody", "pt8", "pb8")}>
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
      </div>
    </section>
  );
}

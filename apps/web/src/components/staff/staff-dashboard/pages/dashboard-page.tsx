"use client";

import { cx } from "../style";
import { Ic } from "../ui";
import type {
  ActivityItem,
  ClientThread,
  DashboardDigestItem,
  DashboardFocusItem,
  DashboardInboxItem,
  SlaWatchItem,
  TaskContext
} from "../types";
import { formatDuration, formatRelative } from "../utils";

type IntegrationQueueItem = {
  id: string;
  clientName: string;
  providerLabel: string;
  status: "REQUESTED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED" | "CANCELLED";
  assignedToName: string | null;
  priority: string | null;
  requestedAt: string;
};

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
  integrationQueue: IntegrationQueueItem[];
  integrationQueueBusyId: string | null;
  onIntegrationQueueAction: (requestId: string, action: "claim" | "start" | "complete") => void;
};

function toneBadge(tone: "blue" | "amber" | "red" | "green"): string {
  if (tone === "red") return "badgeRed";
  if (tone === "amber") return "badgeAmber";
  if (tone === "green") return "badgeGreen";
  return "badgeMuted";
}

function burnBadge(tone: "red" | "amber" | "green"): string {
  if (tone === "red") return "badgeRed";
  if (tone === "amber") return "badgeAmber";
  return "badgeGreen";
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
  integrationQueue,
  integrationQueueBusyId,
  onIntegrationQueueAction
}: DashboardPageProps) {
  const focusTask = priorityTasks.find((task) => task.priority === "high") ?? priorityTasks[0] ?? null;
  const progress = Math.max(0, Math.min(100, focusTask?.progress ?? 0));
  const urgentCount = overdueCount + highPriorityTasksCount;
  const activeIntegrationsQueue = integrationQueue.filter((item) => item.status === "REQUESTED" || item.status === "IN_PROGRESS");

  return (
    <section className={cx("page", "pageBody", "staffWorkspaceDash", isActive && "pageActive")} id="page-dashboard">
      <div className={cx("pageHeaderBar", "mb16", "sdHeader")}>
        <div className={cx("flexBetween", "gap24", "mb20", "flexWrap")}>
          <div>
            <div className={cx("pageEyebrowText", "mb8")}>{todayLabel} · Week {weekNumber}</div>
            <h1 className={cx("pageTitleText")}>Workspace Dashboard · {staffName}</h1>
            <p className={cx("pageSubtitleText")}>
              {openTasksCount} open tasks · {openConversationsCount} open client threads · {overdueCount} overdue deliverables.
            </p>
          </div>
          <div className={cx("pageActions", "gap8", "flexWrap")}>
            <button type="button" className={cx("button", "buttonGhost", "sdBtn")} onClick={onGoTasks}>Tasks</button>
            <button type="button" className={cx("button", "buttonGhost", "sdBtn")} onClick={onGoClients}>Clients</button>
            <button type="button" className={cx("button", "buttonGhost", "sdBtn")} onClick={onGoDeliverables}>Deliverables</button>
            <button type="button" className={cx("button", "buttonGhost", "sdBtn")} onClick={onGoKanban}>Kanban</button>
            <button type="button" className={cx("button", "buttonBlue", "sdBtn", "sdBtnPrimary")} onClick={onGoTimeLog}>Time Log</button>
          </div>
        </div>
      </div>

      <div className={cx("sdGrid4")}>
        <div className={cx("card", "sdCard", "sdTimeCard")}>
          <div className={cx("cardBody")}>
            <div className={cx("text11", "colorMuted")}>Urgent Work</div>
            <div className={cx("text20", "fw800")}>{urgentCount}</div>
            <div className={cx("text11", "colorMuted2")}>{highPriorityTasksCount} high priority · {overdueCount} overdue</div>
          </div>
        </div>
        <div className={cx("card", "sdCard", "sdPulseCard")}>
          <div className={cx("cardBody")}>
            <div className={cx("text11", "colorMuted")}>Time Logged</div>
            <div className={cx("text20", "fw800")}>{formatDuration(todayMinutes)}</div>
            <div className={cx("text11", "colorMuted2")}>Week total: {formatDuration(weekMinutes)}</div>
          </div>
        </div>
        <div className={cx("card", "sdCard")}>
          <div className={cx("cardBody")}>
            <div className={cx("text11", "colorMuted")}>Portfolio Progress</div>
            <div className={cx("text20", "fw800")}>{averageProgress}%</div>
            <div className={cx("text11", "colorMuted2")}>
              {daysLeft === null ? "No due date" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`} · {nextDueLabel}
            </div>
          </div>
        </div>
        <div className={cx("card", "sdCard")}>
          <div className={cx("cardBody")}>
            <div className={cx("text11", "colorMuted")}>Coverage</div>
            <div className={cx("text20", "fw800")}>{projectsCount}</div>
            <div className={cx("text11", "colorMuted2")}>projects · {threadItems.length} active threads</div>
          </div>
        </div>
      </div>

      <div className={cx("sdGridFocus")}>
        <div className={cx("card", "sdCard")}>
          <div className={cx("cardHeader")}>
            <span className={cx("cardHeaderTitle")}>Focus Block</span>
            {focusTask?.priority === "high" ? <span className={cx("badge", "badgeRed")}>High Priority</span> : null}
          </div>
          <div className={cx("cardBody")}>
            <div className={cx("text12", "fw700")}>{focusTask?.title ?? "No priority task selected"}</div>
            <div className={cx("text11", "colorMuted", "mb10")}>
              {focusTask ? `${focusTask.projectName} · ${focusTask.clientName} · ${focusTask.dueLabel}` : "Use Tasks to schedule your next execution block."}
            </div>
            <div className={cx("sdProgressTrack")}>
              <div className={cx("sdProgressFill")} style={{ width: `${progress}%` }} />
            </div>
            <div className={cx("text11", "colorMuted2", "mb10")}>{progress}% complete</div>

            <div className={cx("sdTimerFields")}>
              <select className={cx("fieldInput", "sdInput")} value={selectedTimerProjectId} onChange={(e) => onTimerProjectChange(e.target.value)}>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
              <input
                className={cx("fieldInput", "sdInput")}
                placeholder="Workstream / task label"
                value={timerTaskLabel}
                onChange={(e) => onTimerTaskLabelChange(e.target.value)}
              />
            </div>

            <div className={cx("text11", "colorMuted", "mb10")}>
              Active timer: <span className={cx("fw700")}>{timerDisplay}</span>
              {timerProjectName ? ` · ${timerProjectName}` : ""}
              {timerTaskName ? ` · ${timerTaskName}` : ""}
            </div>

            <div className={cx("flexRow", "gap8", "flexWrap")}>
              <button type="button" className={cx("button", "buttonBlue", "sdBtn", "sdBtnPrimary")} onClick={onTimerToggle}>
                <Ic n={timerRunning ? "clock" : "arrowRight"} sz={12} c="currentColor" /> {timerRunning ? "Pause Timer" : "Start Timer"}
              </button>
              <button type="button" className={cx("button", "buttonGhost", "sdBtn")} onClick={() => void onTimerStop()}>
                <Ic n="x" sz={12} c="currentColor" /> Stop & Log
              </button>
              <button type="button" className={cx("button", "buttonGhost", "sdBtn")} onClick={onGoTasks}>Open Task</button>
            </div>
          </div>
        </div>

        <div className={cx("card", "sdCard")}>
          <div className={cx("cardHeader")}>
            <span className={cx("cardHeaderTitle")}>Action Inbox</span>
          </div>
          <div className={cx("cardBody")}>
            {actionInbox.length === 0 ? (
              <div className={cx("text12", "colorMuted")}>No urgent inbox actions right now.</div>
            ) : actionInbox.map((item) => (
              <div key={item.id} className={cx("sdInboxRow")}>
                <div>
                  <div className={cx("text12", "fw700")}>{item.label}</div>
                  <div className={cx("text10", "colorMuted")}>{item.detail}</div>
                </div>
                <span className={cx("badge", toneBadge(item.tone))}>{item.count}</span>
                <button type="button" className={cx("button", "buttonGhost", "sdBtn")} onClick={() => onRunDashboardAction(item.action)}>{item.actionLabel}</button>
              </div>
            ))}

            <div className={cx("mt10", "pt10", "borderT")}>
              <div className={cx("text11", "fw700", "mb6")}>Focus Queue</div>
              {focusQueue.length === 0 ? (
                <div className={cx("text11", "colorMuted")}>No focus queue items.</div>
              ) : focusQueue.map((item) => (
                <div key={item.id} className={cx("sdFocusRow")}>
                  <div>
                    <div className={cx("text11", "fw700")}>{item.title}</div>
                    <div className={cx("text10", "colorMuted")}>{item.detail}</div>
                  </div>
                  <button type="button" className={cx("button", "buttonGhost", "sdBtn")} onClick={() => onRunDashboardAction(item.action, item.threadId)}>
                    {item.actionLabel}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={cx("sdGridTwin")}>
        <div className={cx("card", "sdCard")}>
          <div className={cx("cardHeader")}>
            <span className={cx("cardHeaderTitle")}>SLA & Flow Health</span>
            <span className={cx("badge", burnBadge(slaBurn.tone))}>{slaBurn.statusLabel}</span>
          </div>
          <div className={cx("cardBody")}>
            <div className={cx("text11", "colorMuted", "mb8")}>{slaBurn.detail}</div>
            <div className={cx("sdMetricGrid")}>
              <div className={cx("textCenter")}><div className={cx("text16", "fw800")}>{slaBurn.riskCount}</div><div className={cx("text10", "colorMuted")}>Risk</div></div>
              <div className={cx("textCenter")}><div className={cx("text16", "fw800")}>{slaBurn.watchCount}</div><div className={cx("text10", "colorMuted")}>Watch</div></div>
              <div className={cx("textCenter")}><div className={cx("text16", "fw800")}>{flowHealth.wipCount}</div><div className={cx("text10", "colorMuted")}>WIP</div></div>
              <div className={cx("textCenter")}><div className={cx("text16", "fw800")}>{flowHealth.blockedPercent}%</div><div className={cx("text10", "colorMuted")}>Blocked</div></div>
            </div>
            <div className={cx("text11", "colorMuted", "mb8")}>Throughput 7d: {flowHealth.throughput7d} · Avg cycle: {flowHealth.avgCycleDays} days</div>
            {slaWatchlist.map((row) => (
              <div key={row.id} className={cx("sdListRow")}>
                <div>
                  <div className={cx("text11", "fw700")}>{row.name}</div>
                  <div className={cx("text10", "colorMuted")}>{row.clientName} · {row.statusLabel}</div>
                </div>
                <div className={cx("text10", "colorMuted2")}>{row.slaDueAt ? formatRelative(row.slaDueAt) : "No due date"}</div>
              </div>
            ))}
            <div className={cx("mt10")}>
              <button type="button" className={cx("button", "buttonGhost", "sdBtn")} onClick={onGoDeliverables}>Open Deliverables</button>
            </div>
          </div>
        </div>

        <div className={cx("card", "sdCard")}>
          <div className={cx("cardHeader")}>
            <span className={cx("cardHeaderTitle")}>Integration Setup Queue</span>
            <span className={cx("badge", "badgeMuted")}>{activeIntegrationsQueue.length}</span>
          </div>
          <div className={cx("cardBody")}>
            {activeIntegrationsQueue.length === 0 ? (
              <div className={cx("text12", "colorMuted")}>No open integration requests.</div>
            ) : activeIntegrationsQueue.slice(0, 6).map((item) => {
              const busy = integrationQueueBusyId === item.id;
              return (
                <div key={item.id} className={cx("sdQueueRow")}>
                  <div className={cx("flexBetween", "gap8", "mb4")}>
                    <div className={cx("text11", "fw700")}>{item.clientName} · {item.providerLabel}</div>
                    <span className={cx("badge", item.status === "REQUESTED" ? "badgeAmber" : "badgeAccent")}>{item.status}</span>
                  </div>
                  <div className={cx("text10", "colorMuted", "mb8")}>
                    Requested {formatRelative(item.requestedAt)} · {item.assignedToName ? `Assigned to ${item.assignedToName}` : "Unassigned"}{item.priority ? ` · ${item.priority}` : ""}
                  </div>
                  <div className={cx("flexRow", "gap8", "flexWrap")}>
                    {!item.assignedToName && (
                      <button type="button" className={cx("button", "buttonGhost", "sdBtn")} disabled={busy} onClick={() => onIntegrationQueueAction(item.id, "claim")}>
                        {busy ? "Saving..." : "Claim"}
                      </button>
                    )}
                    {item.status === "REQUESTED" && (
                      <button type="button" className={cx("button", "buttonGhost", "sdBtn")} disabled={busy} onClick={() => onIntegrationQueueAction(item.id, "start")}>
                        {busy ? "Saving..." : "Start"}
                      </button>
                    )}
                    {item.status !== "COMPLETED" && (
                      <button type="button" className={cx("button", "buttonBlue", "sdBtn", "sdBtnPrimary")} disabled={busy} onClick={() => onIntegrationQueueAction(item.id, "complete")}>
                        {busy ? "Saving..." : "Complete"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className={cx("sdGridActivity")}>
        <div className={cx("card", "sdCard")}>
          <div className={cx("cardHeader")}>
            <span className={cx("cardHeaderTitle")}>Recent Activity</span>
          </div>
          <div className={cx("cardBody")}>
            {activityFeed.length === 0 ? (
              <div className={cx("text12", "colorMuted")}>No recent activity.</div>
            ) : activityFeed.map((item) => (
              <div key={item.id} className={cx("sdListRow")}>
                <div className={cx("text11", "fw700")}>{item.text}</div>
                <div className={cx("text10", "colorMuted")}>{item.detail}</div>
                <div className={cx("text10", "colorMuted2")}>{item.time}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={cx("card", "sdCard")}>
          <div className={cx("cardHeader")}>
            <span className={cx("cardHeaderTitle")}>Since Last Visit</span>
            <span className={cx("text10", "colorMuted2")}>{dashboardLastSeenAt ? formatRelative(dashboardLastSeenAt) : "First visit"}</span>
          </div>
          <div className={cx("cardBody")}>
            {digestItems.length === 0 ? (
              <div className={cx("text12", "colorMuted")}>No updates since your last dashboard visit.</div>
            ) : digestItems.map((item) => (
              <div key={item.id} className={cx("sdListRow")}>
                <div className={cx("text11", "fw700")}>{item.title}</div>
                <div className={cx("text10", "colorMuted")}>{item.detail}</div>
                <div className={cx("text10", "colorMuted2")}>{formatRelative(item.occurredAt)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={cx("sdGridBottom")}>
        <div className={cx("card", "sdCard")}>
          <div className={cx("cardHeader")}>
            <span className={cx("cardHeaderTitle")}>Time Distribution</span>
          </div>
          <div className={cx("cardBody")}>
            {projectTimeBreakdown.length === 0 ? (
              <div className={cx("text12", "colorMuted")}>No time entries this week.</div>
            ) : projectTimeBreakdown.map(([project, mins]) => (
              <div key={project} className={cx("sdTimeRow")}>
                <div className={cx("flexBetween", "mb4", "gap8")}>
                  <span className={cx("text11", "fw700")}>{project}</span>
                  <span className={cx("text10", "colorMuted2")}>{formatDuration(mins)}</span>
                </div>
                <div className={cx("sdBarTrack")}>
                  <div className={cx("sdBarFill")} style={{ width: `${maxProjectMinutes > 0 ? Math.round((mins / maxProjectMinutes) * 100) : 0}%` }} />
                </div>
              </div>
            ))}
            <button type="button" className={cx("button", "buttonGhost", "sdBtn")} onClick={onGoTimeLog}>Open Time Log</button>
          </div>
        </div>

        <div className={cx("card", "sdCard")}>
          <div className={cx("cardHeader")}>
            <span className={cx("cardHeaderTitle")}>Client Pulse</span>
          </div>
          <div className={cx("cardBody")}>
            {threadItems.length === 0 ? (
              <div className={cx("text12", "colorMuted")}>No active client threads.</div>
            ) : threadItems.slice(0, 6).map((thread) => (
              <button key={thread.id} type="button" className={cx("button", "buttonGhost", "sdBtn", "wFull", "textLeft", "mb6")} onClick={() => onOpenThread(thread.id)}>
                <div className={cx("text11", "fw700")}>{thread.name}</div>
                <div className={cx("text10", "colorMuted")}>{thread.project} · {thread.preview}</div>
              </button>
            ))}
            {collaborationRows.length > 0 && (
              <div className={cx("mt10", "pt10", "borderT")}>
                <div className={cx("text11", "fw700", "mb6")}>Collaboration Load</div>
                {collaborationRows.slice(0, 4).map((row) => (
                  <div key={`${row.projectName}-${row.name}`} className={cx("text10", "colorMuted", "mb4")}>
                    {row.name} · {row.projectName} · {row.activeSessions} active · {row.taskCount} tasks
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

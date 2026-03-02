"use client";

import { cx, styles } from "../style";
import type { KanbanColumn } from "../types";
import { capitalize } from "../utils";

function columnBorderClass(border?: string) {
  if (border === "var(--accent)") return "kbColBorderAccent";
  if (border === "var(--amber)") return "kbColBorderAmber";
  if (border === "var(--green)") return "kbColBorderGreen";
  return "";
}

function columnToneClass(tone?: string) {
  if (tone === "var(--accent)") return "colorAccent";
  if (tone === "var(--amber)") return "colorAmber";
  if (tone === "var(--green)") return "colorGreen";
  return "";
}

function countToneClass(tone?: string) {
  if (tone === "var(--accent)") return "kbCountAccent";
  if (tone === "var(--amber)") return "kbCountAmber";
  if (tone === "var(--green)") return "kbCountGreen";
  return "kbCountDefault";
}

type KanbanPageProps = {
  isActive: boolean;
  taskCount: number;
  openTasksCount: number;
  blockedTasksCount: number;
  overdueTasksCount: number;
  inProgressCount: number;
  inProgressLimit: number;
  kanbanColumns: KanbanColumn[];
  animateProgress: boolean;
  onOpenTaskFilters: () => void;
  onOpenTaskComposer: () => void;
  onOpenBlockedQueue: () => void;
  onOpenOverdueQueue: () => void;
  onTaskAction: (taskId: string, projectId: string, status: "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE") => void;
  onOpenTaskThread: (projectId: string) => void;
  hasProjectThread: (projectId: string) => boolean;
  kanbanViewMode: "all" | "my_work" | "urgent" | "client_waiting" | "blocked";
  onKanbanViewModeChange: (mode: "all" | "my_work" | "urgent" | "client_waiting" | "blocked") => void;
  kanbanSwimlane: "status" | "project" | "client";
  onKanbanSwimlaneChange: (mode: "status" | "project" | "client") => void;
  flowMetrics: {
    points: Array<{ label: string; created: number; completed: number; blocked: number }>;
    throughput7d: number;
    throughputPrev7d: number;
    cycleDays: number;
  };
  kanbanHealth: {
    wipBreach: boolean;
    agingTasks: number;
    blockedTasks: number;
    clientWaiting: number;
  };
  blockDraft: { taskId: string; projectId: string; title: string } | null;
  blockReason: string;
  blockSeverity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  blockEta: string;
  creatingBlocker: boolean;
  onOpenBlockDraft: (taskId: string, projectId: string, title: string) => void;
  onCancelBlockDraft: () => void;
  onBlockReasonChange: (value: string) => void;
  onBlockSeverityChange: (value: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") => void;
  onBlockEtaChange: (value: string) => void;
  onSubmitBlockDraft: () => void;
  onMoveTask: (
    taskId: string,
    projectId: string,
    currentStatus: "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE",
    nextStatus: "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE"
  ) => void;
  announcement: string;
};

export function KanbanPage({
  isActive,
  taskCount,
  openTasksCount,
  blockedTasksCount,
  overdueTasksCount,
  inProgressCount,
  inProgressLimit,
  kanbanColumns,
  animateProgress,
  onOpenTaskFilters,
  onOpenTaskComposer,
  onOpenBlockedQueue,
  onOpenOverdueQueue,
  onTaskAction,
  onOpenTaskThread,
  hasProjectThread,
  kanbanViewMode,
  onKanbanViewModeChange,
  kanbanSwimlane,
  onKanbanSwimlaneChange,
  flowMetrics,
  kanbanHealth,
  blockDraft,
  blockReason,
  blockSeverity,
  blockEta,
  creatingBlocker,
  onOpenBlockDraft,
  onCancelBlockDraft,
  onBlockReasonChange,
  onBlockSeverityChange,
  onBlockEtaChange,
  onSubmitBlockDraft,
  onMoveTask,
  announcement
}: KanbanPageProps) {
  const throughputDelta = flowMetrics.throughput7d - flowMetrics.throughputPrev7d;
  return (
    <section className={cx("page", "pageBody", "kanbanPage", isActive && "pageActive")} id="page-kanban">
      <div className={styles.srOnly} aria-live="polite">{announcement}</div>
      <div className={cx(styles.pageHeader, "kbHeader")}>
        <div>
          <div className={styles.pageEyebrow}>STAFF DASHBOARD / DELIVERY</div>
          <div className={styles.pageTitle}>Kanban Board</div>
          <div className={styles.pageSub}>
            Move tasks between statuses to keep delivery flow accurate. {taskCount} active tasks · {openTasksCount} assigned.
          </div>
        </div>
        <div className={cx(styles.pageActions, "kbHeaderActions")}>
          <span className={cx("badge", "badgeSm", "badgeBlue")}>{openTasksCount} tasks assigned</span>
          <span
            className={cx("badge", "badgeSm", inProgressCount >= inProgressLimit ? "badgeRed" : "badgeAmber")}
          >
            WIP {inProgressCount}/{inProgressLimit}
          </span>
          {blockedTasksCount > 0 ? (
            <button className={cx("btnSm", "btnGhost")} type="button" onClick={onOpenBlockedQueue}>
              {blockedTasksCount} Blocked
            </button>
          ) : null}
          {overdueTasksCount > 0 ? (
            <button className={cx("btnSm", "btnGhost")} type="button" onClick={onOpenOverdueQueue}>
              {overdueTasksCount} Overdue
            </button>
          ) : null}
          <button className={cx("btnSm", "btnGhost")} type="button" onClick={onOpenTaskFilters}>Task Filters</button>
          <button className={cx("btnSm", "btnAccent")} type="button" onClick={onOpenTaskComposer}>+ Task</button>
        </div>
      </div>

      <div className={styles.grid2}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>Flow Trend (7 days)</span>
            <span className={cx("badge", throughputDelta >= 0 ? "badgeGreen" : "badgeAmber")}>
              {throughputDelta >= 0 ? `+${throughputDelta}` : throughputDelta} throughput
            </span>
          </div>
          <div className={styles.cardBody}>
            {taskCount === 0 ? (
              <div className={styles.emptyState}>No task history yet. Create tasks to unlock flow trends.</div>
            ) : (
              <>
                <div className={styles.weekChart}>
                  {flowMetrics.points.map((point) => {
                    const max = Math.max(
                      1,
                      ...flowMetrics.points.map((entry) => Math.max(entry.created, entry.completed, entry.blocked))
                    );
                    return (
                      <div key={point.label} className={styles.weekColumn}>
                        <div className={styles.flowStack}>
                          <progress className={cx("kbFlowMeter", "kbFlowCreated")} max={max} value={point.created} />
                          <progress className={cx("kbFlowMeter", "kbFlowCompleted")} max={max} value={point.completed} />
                          <progress className={cx("kbFlowMeter", "kbFlowBlocked")} max={max} value={point.blocked} />
                        </div>
                        <div className={styles.weekLabel}>{point.label}</div>
                      </div>
                    );
                  })}
                </div>
                <div className={cx("timeRow", "mt10")}>
                  <span>Throughput 7d</span>
                  <span className={styles.timeRowValue}>{flowMetrics.throughput7d}</span>
                </div>
                <div className={styles.timeRow}>
                  <span>Average cycle time</span>
                  <span className={styles.timeRowValue}>{flowMetrics.cycleDays.toFixed(1)}d</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}><span className={styles.cardHeaderTitle}>Kanban Health</span></div>
          <div className={styles.cardBody}>
            {taskCount === 0 ? (
              <div className={styles.emptyState}>No active tasks yet. Health checks will appear when work starts.</div>
            ) : (
              <>
                <div className={styles.timeRow}>
                  <span>WIP limit</span>
                  <span className={cx("badge", kanbanHealth.wipBreach ? "badgeRed" : "badgeGreen")}>
                    {kanbanHealth.wipBreach ? "Exceeded" : "Healthy"}
                  </span>
                </div>
                <div className={styles.timeRow}>
                  <span>Aging tasks (&gt;=3d)</span>
                  <span className={styles.timeRowValue}>{kanbanHealth.agingTasks}</span>
                </div>
                <div className={styles.timeRow}>
                  <span>Blocked tasks</span>
                  <span className={styles.timeRowValue}>{kanbanHealth.blockedTasks}</span>
                </div>
                <div className={styles.timeRow}>
                  <span>Client waiting</span>
                  <span className={styles.timeRowValue}>{kanbanHealth.clientWaiting}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className={cx("filterRow", "kbControlsCard")}>
        <select
          title="Select Kanban filter"
          value={kanbanViewMode}
          onChange={(event) => onKanbanViewModeChange(event.target.value as "all" | "my_work" | "urgent" | "client_waiting" | "blocked")}
          className={cx("filterSelect")}
        >
          <option value="all">All</option>
          <option value="my_work">My Work</option>
          <option value="urgent">Urgent</option>
          <option value="client_waiting">Client Waiting</option>
          <option value="blocked">Blocked</option>
        </select>
        <select
          title="Select swimlane"
          className={cx("filterSelect", "kbSwimlaneSelect")}
          value={kanbanSwimlane}
          onChange={(event) => onKanbanSwimlaneChange(event.target.value as "status" | "project" | "client")}
        >
          <option value="status">Status</option>
          <option value="project">Project</option>
          <option value="client">Client</option>
        </select>
      </div>

      {blockDraft ? (
        <div className={styles.kanbanInlinePanel}>
          <div className={styles.kanbanInlinePanelRow}>
            <strong>Block task:</strong> <span>{blockDraft.title}</span>
          </div>
          <div className={styles.formGrid2x1}>
            <input
              className={styles.fieldInput}
              placeholder="Block reason"
              value={blockReason}
              onChange={(event) => onBlockReasonChange(event.target.value)}
            />
            <select
              className={cx("fieldInput", "fieldSelect")}
              aria-label="Blocker severity"
              value={blockSeverity}
              onChange={(event) => onBlockSeverityChange(event.target.value as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL")}
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
            <input
              className={styles.fieldInput}
              type="datetime-local"
              value={blockEta}
              onChange={(event) => onBlockEtaChange(event.target.value)}
            />
          </div>
          <div className={styles.kanbanInlinePanelActions}>
            <button className={cx("button", "buttonGhost")} type="button" onClick={onCancelBlockDraft}>Cancel</button>
            <button
              className={cx("button", "buttonBlue")}
              type="button"
              onClick={onSubmitBlockDraft}
              disabled={creatingBlocker || blockReason.trim().length < 4}
            >
              {creatingBlocker ? "Blocking..." : "Block + Escalate"}
            </button>
          </div>
        </div>
      ) : null}

      <div className={styles.kanban}>
        {kanbanColumns.map((column) => (
          <div key={column.title} className={cx("kanbanColumn", columnBorderClass(column.border))}>
            <div className={styles.kanbanHeader}>
              <div>
                <span className={cx("kanbanTitle", columnToneClass(column.tone))}>{column.title}</span>
                {column.title === "In Progress" ? (
                  <div className={cx("kanbanLimitText", inProgressCount >= inProgressLimit && "kanbanLimitOver")}>
                    Limit {inProgressCount}/{inProgressLimit}
                  </div>
                ) : null}
                {column.policyHint ? <div className={styles.kanbanPolicyHint}>{column.policyHint}</div> : null}
              </div>
              <span className={cx("kanbanCount", countToneClass(column.countTone))}>
                {column.count}
              </span>
            </div>
            {column.tasks.length === 0 ? (
              <div className={styles.emptyState}>No tasks in this column.</div>
            ) : (
              column.tasks.map((task) => (
                <div
                  key={task.id}
                  className={cx("taskCard", task.priority, task.faded && "taskCardFaded", task.blocked && "kbTaskBlockedTop")}
                >
                  <div className={cx("taskTag", task.blocked && "colorRed")}>{task.tag}</div>
                  <div className={cx("taskTitle", task.faded && "kbTaskTitleDone")}>{task.title}</div>
                  {task.progress ? (
                    <div className={styles.kbProgressWrap}>
                      <progress
                        className={cx("kbTaskProgress", `kbTaskProgress${capitalize(task.progress.tone)}`)}
                        max={100}
                        value={animateProgress ? task.progress.value : 0}
                      />
                    </div>
                  ) : null}
                  <div className={styles.taskMeta}>
                    <span className={cx("taskDue", task.dueTone === "today" && "taskDueToday")}>
                      {task.due}
                    </span>
                    {task.meta ? (
                      <div className={styles.taskMetaRight}>
                        {task.meta.comments ? <span className={styles.taskComments}>{task.meta.comments}</span> : null}
                        <div className={styles.taskAvatar}>{task.meta.avatar}</div>
                      </div>
                    ) : null}
                  </div>
                  {typeof task.ageDays === "number" ? (
                    <div className={cx("taskAge", task.ageTone === "red" ? "taskAgeRed" : task.ageTone === "amber" ? "taskAgeAmber" : "taskAgeMuted")}>
                      Age {task.ageDays}d
                    </div>
                  ) : null}
                  <div className={styles.taskActionRow}>
                    <button
                      className={cx("btnXs", hasProjectThread(task.projectId) ? "buttonGhost" : "buttonDisabled")}
                      type="button"
                      onClick={() => onOpenTaskThread(task.projectId)}
                      disabled={!hasProjectThread(task.projectId)}
                    >
                      {hasProjectThread(task.projectId) ? "Open Thread" : "No Thread"}
                    </button>
                    {task.status !== "DONE" && task.status !== "BLOCKED" ? (
                      <button
                        className={cx("btnXs", "buttonGhost")}
                        type="button"
                        onClick={() => onOpenBlockDraft(task.id, task.projectId, task.title)}
                      >
                        Block
                      </button>
                    ) : null}
                    <button
                      className={cx("btnXs", task.status === "DONE" ? "buttonGreen" : "buttonGhost")}
                      type="button"
                      onClick={() => onTaskAction(task.id, task.projectId, task.status)}
                    >
                      {task.status === "DONE" ? "Done" : task.status === "IN_PROGRESS" ? "Mark Done" : task.status === "BLOCKED" ? "Unblock" : "Start"}
                    </button>
                    <select
                      aria-label={`Move ${task.title} to status`}
                      className={cx("fieldInput", "fieldSelect", "kbMoveSelect")}
                      value=""
                      onChange={(event) => {
                        const target = event.target.value as "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE";
                        if (!target) return;
                        onMoveTask(task.id, task.projectId, task.status, target);
                        event.currentTarget.value = "";
                      }}
                    >
                      <option value="">Move to...</option>
                      {task.status !== "TODO" ? <option value="TODO">Backlog</option> : null}
                      {task.status !== "IN_PROGRESS" ? <option value="IN_PROGRESS">In Progress</option> : null}
                      {task.status !== "BLOCKED" ? <option value="BLOCKED">Blocked</option> : null}
                      {task.status !== "DONE" ? <option value="DONE">Done</option> : null}
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

"use client";

import { cx, styles } from "../style";
import type { KanbanColumn } from "../types";
import { capitalize } from "../utils";

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
    <section className={cx("page", isActive && "pageActive")} id="page-kanban">
      <div className={styles.srOnly} aria-live="polite">{announcement}</div>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>Active tasks · {taskCount}</div>
          <div className={styles.pageTitle}>Kanban Board</div>
          <div className={styles.pageSub}>Move tasks between statuses to keep delivery flow accurate.</div>
        </div>
        <div className={styles.pageActions}>
          <span className={cx("badge", "badgeBlue")} style={{ fontSize: "0.62rem", padding: "4px 10px" }}>{openTasksCount} tasks assigned</span>
          <span
            className={cx("badge", inProgressCount >= inProgressLimit ? "badgeRed" : "badgeAmber")}
            style={{ fontSize: "0.62rem", padding: "4px 10px" }}
          >
            WIP {inProgressCount}/{inProgressLimit}
          </span>
          {blockedTasksCount > 0 ? (
            <button className={cx("button", "buttonGhost")} type="button" onClick={onOpenBlockedQueue}>
              {blockedTasksCount} Blocked
            </button>
          ) : null}
          {overdueTasksCount > 0 ? (
            <button className={cx("button", "buttonGhost")} type="button" onClick={onOpenOverdueQueue}>
              {overdueTasksCount} Overdue
            </button>
          ) : null}
          <button className={cx("button", "buttonGhost")} type="button" onClick={onOpenTaskFilters}>Task Filters</button>
          <button className={cx("button", "buttonBlue")} type="button" onClick={onOpenTaskComposer}>+ Task</button>
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
                    const completedPct = (point.completed / max) * 100;
                    const blockedPct = (point.blocked / max) * 100;
                    const createdPct = (point.created / max) * 100;
                    return (
                      <div key={point.label} className={styles.weekColumn}>
                        <div className={styles.flowStack}>
                          <div className={styles.flowSegCreated} style={{ height: `${createdPct}%` }} />
                          <div className={styles.flowSegCompleted} style={{ height: `${completedPct}%` }} />
                          <div className={styles.flowSegBlocked} style={{ height: `${blockedPct}%` }} />
                        </div>
                        <div className={styles.weekLabel}>{point.label}</div>
                      </div>
                    );
                  })}
                </div>
                <div className={styles.timeRow} style={{ marginTop: 10 }}>
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

      <div className={styles.kanbanControls}>
        <div className={styles.filterTabs}>
          {[
            { id: "all", label: "All" },
            { id: "my_work", label: "My Work" },
            { id: "urgent", label: "Urgent" },
            { id: "client_waiting", label: "Client Waiting" },
            { id: "blocked", label: "Blocked" }
          ].map((option) => (
            <button
              key={option.id}
              className={cx("filterTab", option.id === kanbanViewMode && "filterTabActive")}
              type="button"
              onClick={() => onKanbanViewModeChange(option.id as "all" | "my_work" | "urgent" | "client_waiting" | "blocked")}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label className={styles.fieldLabel} htmlFor="kanban-swimlane" style={{ marginBottom: 0 }}>Swimlane</label>
          <select
            id="kanban-swimlane"
            className={cx("fieldInput", "fieldSelect")}
            style={{ width: 170, paddingTop: 7, paddingBottom: 7 }}
            value={kanbanSwimlane}
            onChange={(event) => onKanbanSwimlaneChange(event.target.value as "status" | "project" | "client")}
          >
            <option value="status">Status</option>
            <option value="project">Project</option>
            <option value="client">Client</option>
          </select>
        </div>
      </div>

      {blockDraft ? (
        <div className={styles.kanbanInlinePanel}>
          <div className={styles.kanbanInlinePanelRow}>
            <strong>Block task:</strong> <span>{blockDraft.title}</span>
          </div>
          <div className={styles.formGrid} style={{ gridTemplateColumns: "2fr 1fr 1fr", gap: 8 }}>
            <input
              className={styles.fieldInput}
              placeholder="Block reason"
              value={blockReason}
              onChange={(event) => onBlockReasonChange(event.target.value)}
            />
            <select
              className={cx("fieldInput", "fieldSelect")}
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
          <div key={column.title} className={styles.kanbanColumn} style={column.border ? { borderTop: `2px solid ${column.border}` } : undefined}>
            <div className={styles.kanbanHeader}>
              <div>
                <span className={styles.kanbanTitle} style={column.tone ? { color: column.tone } : undefined}>{column.title}</span>
                {column.title === "In Progress" ? (
                  <div className={cx("kanbanLimitText", inProgressCount >= inProgressLimit && "kanbanLimitOver")}>
                    Limit {inProgressCount}/{inProgressLimit}
                  </div>
                ) : null}
                {column.policyHint ? <div className={styles.kanbanPolicyHint}>{column.policyHint}</div> : null}
              </div>
              <span
                className={styles.kanbanCount}
                style={
                  column.countTone
                    ? { background: column.countBg ?? "rgba(255,255,255,0.06)", color: column.countTone }
                    : { background: "rgba(255,255,255,0.06)", color: "var(--muted)" }
                }
              >
                {column.count}
              </span>
            </div>
            {column.tasks.length === 0 ? (
              <div className={styles.emptyState}>No tasks in this column.</div>
            ) : (
              column.tasks.map((task) => (
                <div
                  key={task.id}
                  className={cx("taskCard", task.priority, task.faded && "taskCardFaded")}
                  style={task.faded ? { opacity: 0.6 } : task.blocked ? { borderTop: "1px solid var(--border)" } : undefined}
                >
                  <div className={styles.taskTag} style={task.blocked ? { color: "var(--red)" } : undefined}>{task.tag}</div>
                  <div className={styles.taskTitle} style={task.faded ? { textDecoration: "line-through", color: "var(--muted)" } : undefined}>{task.title}</div>
                  {task.progress ? (
                    <div style={{ margin: "6px 0" }}>
                      <div className={styles.progressBar} style={{ height: 3 }}>
                        <div
                          className={cx("progressFill", `pf${capitalize(task.progress.tone)}`)}
                          style={{ width: animateProgress ? `${task.progress.value}%` : "0%" }}
                        />
                      </div>
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
                      className={cx("button", hasProjectThread(task.projectId) ? "buttonGhost" : "buttonDisabled")}
                      type="button"
                      style={{ padding: "4px 10px", fontSize: "0.6rem" }}
                      onClick={() => onOpenTaskThread(task.projectId)}
                      disabled={!hasProjectThread(task.projectId)}
                    >
                      {hasProjectThread(task.projectId) ? "Open Thread" : "No Thread"}
                    </button>
                    {task.status !== "DONE" && task.status !== "BLOCKED" ? (
                      <button
                        className={cx("button", "buttonGhost")}
                        type="button"
                        style={{ padding: "4px 10px", fontSize: "0.6rem" }}
                        onClick={() => onOpenBlockDraft(task.id, task.projectId, task.title)}
                      >
                        Block
                      </button>
                    ) : null}
                    <button
                      className={cx("button", task.status === "DONE" ? "buttonGreen" : "buttonGhost")}
                      type="button"
                      style={{ padding: "4px 10px", fontSize: "0.6rem" }}
                      onClick={() => onTaskAction(task.id, task.projectId, task.status)}
                    >
                      {task.status === "DONE" ? "Done" : task.status === "IN_PROGRESS" ? "Mark Done" : task.status === "BLOCKED" ? "Unblock" : "Start"}
                    </button>
                    <select
                      aria-label={`Move ${task.title} to status`}
                      className={cx("fieldInput", "fieldSelect")}
                      style={{ width: 126, paddingTop: 5, paddingBottom: 5, fontSize: "0.6rem" }}
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

"use client";

import { cx, styles } from "../style";
import type { TaskContext } from "../types";
import { capitalize, formatDuration } from "../utils";

type TasksPageProps = {
  isActive: boolean;
  openTasksCount: number;
  projectsCount: number;
  projects: Array<{ id: string; name: string }>;
  taskTabs: Array<{ id: string; label: string }>;
  activeTaskTab: "all" | "in_progress" | "todo" | "blocked" | "done";
  onTaskTabChange: (tab: "all" | "in_progress" | "todo" | "blocked" | "done") => void;
  highPriorityOnly: boolean;
  onToggleHighPriority: () => void;
  showComposer: boolean;
  onToggleComposer: () => void;
  newTask: {
    projectId: string;
    title: string;
    assigneeName: string;
    dueAt: string;
  };
  onNewTaskChange: (patch: Partial<TasksPageProps["newTask"]>) => void;
  creatingTask: boolean;
  onCreateTask: () => void;
  filteredTasks: TaskContext[];
  onTaskAction: (taskId: string, projectId: string, status: TaskContext["status"]) => void;
  onOpenTaskThread: (projectId: string) => void;
  hasProjectThread: (projectId: string) => boolean;
};

export function TasksPage({
  isActive,
  openTasksCount,
  projectsCount,
  projects,
  taskTabs,
  activeTaskTab,
  onTaskTabChange,
  highPriorityOnly,
  onToggleHighPriority,
  showComposer,
  onToggleComposer,
  newTask,
  onNewTaskChange,
  creatingTask,
  onCreateTask,
  filteredTasks,
  onTaskAction,
  onOpenTaskThread,
  hasProjectThread
}: TasksPageProps) {
  return (
    <section className={cx("page", isActive && "pageActive")} id="page-tasks">
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>Your Assignments</div>
          <div className={styles.pageTitle}>My Tasks</div>
          <div className={styles.pageSub}>{openTasksCount} open tasks across {projectsCount} active projects.</div>
        </div>
        <div className={styles.pageActions}>
          <button className={cx("button", "buttonGhost")} type="button" onClick={onToggleHighPriority}>
            {highPriorityOnly ? "High Priority Only" : "All Priorities"}
          </button>
          <button className={cx("button", "buttonBlue")} type="button" onClick={onToggleComposer}>
            {showComposer ? "Close" : "+ Add Task"}
          </button>
        </div>
      </div>

      {showComposer ? (
        <div className={styles.card} style={{ marginBottom: 12 }}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>Create Task</span>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.formGrid} style={{ gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <select
                className={styles.fieldInput}
                value={newTask.projectId}
                onChange={(event) => onNewTaskChange({ projectId: event.target.value })}
              >
                <option value="">Select project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <input
                className={styles.fieldInput}
                placeholder="Assignee name"
                value={newTask.assigneeName}
                onChange={(event) => onNewTaskChange({ assigneeName: event.target.value })}
              />
              <input
                className={styles.fieldInput}
                placeholder="Task title"
                value={newTask.title}
                onChange={(event) => onNewTaskChange({ title: event.target.value })}
              />
              <input
                className={styles.fieldInput}
                type="datetime-local"
                value={newTask.dueAt}
                onChange={(event) => onNewTaskChange({ dueAt: event.target.value })}
              />
            </div>
            <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
              <button
                className={cx("button", "buttonBlue")}
                type="button"
                onClick={onCreateTask}
                disabled={creatingTask || !newTask.projectId || newTask.title.trim().length < 3}
              >
                {creatingTask ? "Creating..." : "Create Task"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className={styles.filterTabs}>
        {taskTabs.map((tab) => (
          <button
            key={tab.id}
            className={cx("filterTab", tab.id === activeTaskTab && "filterTabActive")}
            type="button"
            onClick={() => onTaskTabChange(tab.id as typeof activeTaskTab)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={cx("card", "fullWidth")}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Priority</th>
              <th>Task</th>
              <th>Project</th>
              <th>Client</th>
              <th>Status</th>
              <th>Est.</th>
              <th>Due</th>
              <th>Client Thread</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={9} className={styles.emptyState}>No tasks in this view yet.</td>
              </tr>
            ) : (
              filteredTasks.map((task) => (
                <tr key={task.id}>
                  <td><div className={cx("priority", `priority${capitalize(task.priority)}`)} title={capitalize(task.priority)} /></td>
                  <td>
                    <div className={styles.tableName}>{task.title}</div>
                    <div className={styles.tableSub}>{task.subtitle}</div>
                  </td>
                  <td><span className={cx("badge", `badge${capitalize(task.badgeTone)}`)}>{task.projectName}</span></td>
                  <td style={{ fontSize: "0.72rem", color: "var(--muted)" }}>{task.clientName}</td>
                  <td><span className={cx("badge", `badge${capitalize(task.badgeTone)}`)}>{task.statusLabel}</span></td>
                  <td><span className={styles.mono} style={{ fontSize: "0.68rem", color: "var(--muted)" }}>{formatDuration(task.estimateMinutes)}</span></td>
                  <td><span className={styles.mono} style={{ fontSize: "0.68rem", color: task.dueTone }}>{task.dueLabel}</span></td>
                  <td>
                    <button
                      className={cx("button", hasProjectThread(task.projectId) ? "buttonGhost" : "buttonDisabled")}
                      type="button"
                      style={{ padding: "4px 10px", fontSize: "0.6rem" }}
                      onClick={() => onOpenTaskThread(task.projectId)}
                      disabled={!hasProjectThread(task.projectId)}
                    >
                      {hasProjectThread(task.projectId) ? "Open Thread" : "No Thread"}
                    </button>
                  </td>
                  <td>
                    <button
                      className={cx("button", task.status === "DONE" ? "buttonGreen" : "buttonGhost")}
                      type="button"
                      style={{ padding: "4px 10px", fontSize: "0.6rem" }}
                      onClick={() => onTaskAction(task.id, task.projectId, task.status)}
                    >
                      {task.status === "DONE" ? "Done" : task.status === "IN_PROGRESS" ? "Mark Done" : task.status === "BLOCKED" ? "Unblock" : "Start"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

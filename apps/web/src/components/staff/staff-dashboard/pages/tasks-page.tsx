"use client";

import { useEffect, useState } from "react";
import { cx, styles } from "../style";
import type { TaskContext } from "../types";
import { capitalize, formatDuration } from "../utils";
import type { AuthSession } from "../../../../lib/auth/session";
import { CommentThread } from "../../../shared/ui/comment-thread";

function dueToneClass(tone: string) {
  if (tone === "var(--red)") return "colorRed";
  if (tone === "var(--amber)") return "colorAmber";
  if (tone === "var(--blue)" || tone === "var(--accent)" || tone === "var(--green)") return "colorAccent";
  if (tone === "var(--purple)") return "colorPurple";
  return "colorMuted";
}

function badgeToneClass(tone: TaskContext["statusTone"] | TaskContext["badgeTone"]): string {
  if (tone === "red") return "badgeRed";
  if (tone === "amber") return "badgeAmber";
  if (tone === "green") return "badgeGreen";
  if (tone === "blue") return "badgeMuted";
  if (tone === "purple") return "badgePurple";
  return "badgeMuted";
}

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
  initialProjectFilter?: string;
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
  hasProjectThread,
  initialProjectFilter
}: TasksPageProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  useEffect(() => {
    if (initialProjectFilter) {
      setSelectedProjectId(initialProjectFilter);
    }
  }, [initialProjectFilter]);

  const visibleTasks = selectedProjectId
    ? filteredTasks.filter((task) => task.projectId === selectedProjectId)
    : filteredTasks;

  return (
    <section className={cx("page", "pageBody", "tasksPage", isActive && "pageActive")} id="page-tasks">
      <div className={cx("pageHeaderBar", "tasksHeader")}>
        <div className={cx("flexBetween", "gap24", "mb20")}>
          <div>
            <div className={cx("pageEyebrowText", "mb8")}>Your Assignments</div>
            <h1 className={cx("pageTitleText")}>My Tasks</h1>
            <p className={cx("pageSubtitleText")}>{openTasksCount} open tasks across {projectsCount} active projects.</p>
          </div>
          <div className={cx("pageActions", "tasksHeaderActions")}>
            <button className={cx("button", "buttonGhost")} type="button" onClick={onToggleHighPriority}>
              {highPriorityOnly ? "High Priority Only" : "All Priorities"}
            </button>
            <button className={cx("button", "buttonBlue")} type="button" onClick={onToggleComposer}>
              {showComposer ? "Close" : "+ Add Task"}
            </button>
          </div>
        </div>
      </div>

      {showComposer ? (
        <div className={cx("card", "mb12", "tasksComposerCard")}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>Create Task</span>
          </div>
          <div className={styles.cardBody}>
            <div className={cx(styles.formGrid2, "tasksComposerGrid")}>
              <select
                className={cx(styles.fieldInput, "tasksComposerField")}
                aria-label="Project for new task"
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
                className={cx(styles.fieldInput, "tasksComposerField")}
                placeholder="Assignee name"
                value={newTask.assigneeName}
                onChange={(event) => onNewTaskChange({ assigneeName: event.target.value })}
              />
              <input
                className={cx(styles.fieldInput, "tasksComposerField")}
                placeholder="Task title"
                value={newTask.title}
                onChange={(event) => onNewTaskChange({ title: event.target.value })}
              />
              <input
                className={cx(styles.fieldInput, "tasksComposerField")}
                type="datetime-local"
                value={newTask.dueAt}
                onChange={(event) => onNewTaskChange({ dueAt: event.target.value })}
              />
            </div>
            <div className={cx("flexEnd", "mt10")}>
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

      <div className={cx("filterRow", "tasksFilterTabs")}>
        <select
          className={cx("filterSelect")}
          aria-label="Task view filter"
          value={activeTaskTab}
          onChange={(event) => onTaskTabChange(event.target.value as typeof activeTaskTab)}
        >
          {taskTabs.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.label}
            </option>
          ))}
        </select>
        <select
          className={cx("filterSelect")}
          aria-label="Project filter"
          value={selectedProjectId}
          onChange={(event) => setSelectedProjectId(event.target.value)}
        >
          <option value="">All Projects</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      <div className={cx("card", "fullWidth", "tasksTableCard")}>
        <div className={styles.tableWrap}>
          <table className={cx(styles.table, "tasksTable")}>
            <thead>
              <tr>
                <th className={cx("textCenter")} scope="col">Priority</th>
                <th scope="col">Task</th>
                <th scope="col">Project</th>
                <th scope="col">Client</th>
                <th scope="col">Status</th>
                <th className={cx("textRight")} scope="col">Est.</th>
                <th className={cx("textRight")} scope="col">Due</th>
                <th className={cx("textCenter")} scope="col">Client Thread</th>
                <th className={cx("textCenter")} scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleTasks.length === 0 ? (
                <tr>
                  <td colSpan={9} className={cx(styles.emptyState, "tasksEmptyState")}>No tasks in this view yet.</td>
                </tr>
              ) : (
                visibleTasks.map((task) => (
                  <tr key={task.id} className={cx("tasksTableRow")}>
                    <td className={cx("textCenter")}><div className={cx("priority", "tasksPriorityDot", `priority${capitalize(task.priority)}`)} title={capitalize(task.priority)} /></td>
                    <td>
                      <div className={styles.tableName}>{task.title}</div>
                      <div className={styles.tableSub}>{task.subtitle}</div>
                    </td>
                    <td><span className={cx("badge", "tasksProjectBadge", badgeToneClass(task.badgeTone))}>{task.projectName}</span></td>
                    <td><span className={cx("textSm", "colorMuted")}>{task.clientName}</span></td>
                    <td><span className={cx("badge", "tasksStatusBadge", badgeToneClass(task.statusTone))}>{task.statusLabel}</span></td>
                    <td className={cx("textRight")}><span className={cx("mono", "text11", "colorMuted")}>{formatDuration(task.estimateMinutes)}</span></td>
                    <td className={cx("textRight")}><span className={cx("mono", "text11", "tasksDueLabel", dueToneClass(task.dueTone))}>{task.dueLabel}</span></td>
                    <td className={cx("textCenter")}>
                      <button
                        className={cx("btnXs", "tasksActionBtn", hasProjectThread(task.projectId) ? "buttonGhost" : "buttonDisabled")}
                        type="button"
                        onClick={() => onOpenTaskThread(task.projectId)}
                        disabled={!hasProjectThread(task.projectId)}
                      >
                        {hasProjectThread(task.projectId) ? "Open Thread" : "No Thread"}
                      </button>
                    </td>
                    <td className={cx("textCenter")}>
                      <button
                        className={cx("btnXs", "tasksActionBtn", task.status === "DONE" ? "buttonGreen" : "buttonGhost")}
                        type="button"
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
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import { cx } from "../style";
import { StaffEmptyState, EmptyIcons } from "../empty-state";
import type { TaskContext } from "../types";
import { capitalize, formatDuration } from "../utils";
import type { PageId } from "../config";

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

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(parsed);
}

type TasksPageProps = {
  isActive: boolean;
  openTasksCount: number;
  projectsCount: number;
  taskCounts: { all: number; in_progress: number; todo: number; blocked: number; done: number };
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
  onAddTaskExternalLink: (
    taskId: string,
    projectId: string,
    input: { providerKey: string; externalId: string; externalUrl: string; title?: string }
  ) => void;
  onRemoveTaskExternalLink: (taskId: string, projectId: string, linkId: string) => void;
  onCreateExternalTask: (
    taskId: string,
    projectId: string,
    input: { providerKey: string; title?: string; description?: string }
  ) => void;
  onOpenTaskThread: (projectId: string) => void;
  hasProjectThread: (projectId: string) => boolean;
  initialProjectFilter?: string;
  integrationOpenRequestsCount: number;
  integrationProvidersByClientId: Record<string, string[]>;
  creatingExternalTaskId: string | null;
  taskSyncEventsByTaskId: Record<string, Array<{
    id: string;
    providerKey: string;
    status: string;
    summary: string | null;
    errorMessage: string | null;
    createdAt: string;
    durationMs: number | null;
  }>>;
  taskSyncEventsLoadingId: string | null;
  onLoadTaskIntegrationSyncEvents: (taskId: string) => void;
  onNavigate: (page: PageId) => void;
};

export function TasksPage({
  isActive,
  openTasksCount,
  projectsCount,
  taskCounts,
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
  onAddTaskExternalLink,
  onRemoveTaskExternalLink,
  onCreateExternalTask,
  onOpenTaskThread,
  hasProjectThread,
  initialProjectFilter,
  integrationOpenRequestsCount,
  integrationProvidersByClientId,
  creatingExternalTaskId,
  taskSyncEventsByTaskId,
  taskSyncEventsLoadingId,
  onLoadTaskIntegrationSyncEvents,
  onNavigate
}: TasksPageProps) {
  const [selectedProjectIdOverride, setSelectedProjectIdOverride] = useState<string | null>(null);
  const [linkEditor, setLinkEditor] = useState<{ taskId: string; projectId: string } | null>(null);
  const [linkProvider, setLinkProvider] = useState("jira");
  const [linkExternalId, setLinkExternalId] = useState("");
  const [linkExternalUrl, setLinkExternalUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const selectedProjectId = selectedProjectIdOverride ?? initialProjectFilter ?? "";

  const visibleTasks = selectedProjectId
    ? filteredTasks.filter((task) => task.projectId === selectedProjectId)
    : filteredTasks;

  const taskOrder: Record<TaskContext["priority"], number> = { high: 0, med: 1, low: 2 };
  const sortedTasks = [...visibleTasks].sort((a, b) => {
    if (a.status === "BLOCKED" && b.status !== "BLOCKED") return -1;
    if (b.status === "BLOCKED" && a.status !== "BLOCKED") return 1;
    const priorityDelta = taskOrder[a.priority] - taskOrder[b.priority];
    if (priorityDelta !== 0) return priorityDelta;
    if (a.dueAt && b.dueAt) return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    if (a.dueAt) return -1;
    if (b.dueAt) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const stats = [
    { label: "Open", value: taskCounts.all - taskCounts.done, tone: "colorAccent" },
    { label: "In Progress", value: taskCounts.in_progress, tone: "colorBlue" },
    { label: "Blocked", value: taskCounts.blocked, tone: taskCounts.blocked > 0 ? "colorRed" : "colorMuted2" },
    { label: "Done", value: taskCounts.done, tone: "colorGreen" }
  ];

  function providerLabel(providerKey: string): string {
    const normalized = providerKey.toLowerCase();
    if (normalized === "jira") return "Jira";
    if (normalized === "asana") return "Asana";
    if (normalized === "clickup") return "ClickUp";
    return normalized.toUpperCase();
  }

  const linkEditorTask = linkEditor
    ? filteredTasks.find((task) => task.id === linkEditor.taskId && task.projectId === linkEditor.projectId) ?? null
    : null;
  const availableProviders = linkEditorTask
    ? integrationProvidersByClientId[linkEditorTask.clientId] ?? []
    : [];
  const selectedTaskSyncEvents = linkEditor ? (taskSyncEventsByTaskId[linkEditor.taskId] ?? []) : [];
  const selectedTaskSyncLoading = linkEditor ? taskSyncEventsLoadingId === linkEditor.taskId : false;

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
              {highPriorityOnly ? "Show All Priorities" : "High Priority Only"}
            </button>
            <button className={cx("button", "buttonBlue")} type="button" onClick={onToggleComposer}>
              {showComposer ? "Close" : "+ Add Task"}
            </button>
          </div>
        </div>
      </div>

      <div className={cx("tasksStatsGrid")}>
        {stats.map((stat) => (
          <div key={stat.label} className={cx("tasksStatCard")}>
            <div className={cx("statLabelNew")}>{stat.label}</div>
            <div className={cx("statValueNew", stat.tone)}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className={cx("tasksQuickActions")}>
        <button className={cx("button", "buttonGhost", "tasksQuickBtn")} type="button" onClick={() => onNavigate("kanban")}>
          Open Kanban
        </button>
        <button className={cx("button", "buttonGhost", "tasksQuickBtn")} type="button" onClick={() => onNavigate("deliverables")}>
          Open Deliverables
        </button>
        <button className={cx("button", integrationOpenRequestsCount > 0 ? "buttonBlue" : "buttonGhost", "tasksQuickBtn")} type="button" onClick={() => onNavigate("myintegrations")}>
          {integrationOpenRequestsCount > 0 ? `Integration Requests (${integrationOpenRequestsCount})` : "My Integrations"}
        </button>
      </div>

      {showComposer ? (
        <div className={cx("card", "mb12", "tasksComposerCard")}>
          <div className={cx("cardHeader")}>
            <span className={cx("cardHeaderTitle")}>Create Task</span>
          </div>
          <div className={cx("cardBody")}>
            <div className={cx("formGrid2", "tasksComposerGrid")}>
              <select
                className={cx("fieldInput", "tasksComposerField")}
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
                className={cx("fieldInput", "tasksComposerField")}
                placeholder="Assignee name"
                value={newTask.assigneeName}
                onChange={(event) => onNewTaskChange({ assigneeName: event.target.value })}
              />
              <input
                className={cx("fieldInput", "tasksComposerField")}
                placeholder="Task title"
                value={newTask.title}
                onChange={(event) => onNewTaskChange({ title: event.target.value })}
              />
              <input
                className={cx("fieldInput", "tasksComposerField")}
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
          onChange={(event) => setSelectedProjectIdOverride(event.target.value)}
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
        {linkEditor ? (
          <div className={cx("tasksLinkEditor")}>
            <div className={cx("tasksLinkEditorHeader")}>
              <div className={cx("tasksLinkEditorTitle")}>Add External Link</div>
              <div className={cx("flexRow", "gap8")}>
                {linkEditor ? (
                  <button
                    type="button"
                    className={cx("btnXs", "buttonGhost")}
                    onClick={() => onLoadTaskIntegrationSyncEvents(linkEditor.taskId)}
                    disabled={selectedTaskSyncLoading}
                  >
                    {selectedTaskSyncLoading ? "Loading..." : "Refresh Logs"}
                  </button>
                ) : null}
                <button type="button" className={cx("btnXs", "buttonGhost")} onClick={() => setLinkEditor(null)}>
                  Close
                </button>
              </div>
            </div>
            <div className={cx("tasksLinkEditorGrid")}>
              <select className={cx("fieldInput")} value={linkProvider} onChange={(event) => setLinkProvider(event.target.value)}>
                {availableProviders.map((provider) => (
                  <option key={provider} value={provider}>{providerLabel(provider)}</option>
                ))}
              </select>
              <input
                className={cx("fieldInput")}
                value={linkExternalId}
                placeholder="External ID (e.g. PROJ-123)"
                onChange={(event) => setLinkExternalId(event.target.value)}
              />
              <input
                className={cx("fieldInput")}
                value={linkExternalUrl}
                placeholder="https://..."
                onChange={(event) => setLinkExternalUrl(event.target.value)}
              />
              <input
                className={cx("fieldInput")}
                value={linkTitle}
                placeholder="Optional title"
                onChange={(event) => setLinkTitle(event.target.value)}
              />
            </div>
            <div className={cx("tasksLinkEditorActions")}>
              <button
                type="button"
                className={cx("btnXs", "buttonBlue")}
                onClick={() => {
                  if (!linkEditor) return;
                  void onAddTaskExternalLink(linkEditor.taskId, linkEditor.projectId, {
                    providerKey: linkProvider,
                    externalId: linkExternalId,
                    externalUrl: linkExternalUrl,
                    title: linkTitle.trim() || undefined
                  });
                  setLinkExternalId("");
                  setLinkExternalUrl("");
                  setLinkTitle("");
                }}
                disabled={!linkExternalId.trim() || !linkExternalUrl.trim() || availableProviders.length === 0}
              >
                Save Link
              </button>
              {linkEditor ? (
                <button
                  type="button"
                  className={cx("btnXs", "buttonGhost")}
                  onClick={() => {
                    if (!linkEditor) return;
                    void onCreateExternalTask(linkEditor.taskId, linkEditor.projectId, {
                      providerKey: linkProvider,
                      title: linkTitle.trim() || linkEditorTask?.title
                    });
                  }}
                  disabled={availableProviders.length === 0 || creatingExternalTaskId === linkEditor.taskId}
                >
                  {creatingExternalTaskId === linkEditor.taskId ? "Creating..." : `Create in ${providerLabel(linkProvider)}`}
                </button>
              ) : null}
            </div>
            {availableProviders.length === 0 ? (
              <div className={cx("text11", "colorAmber", "mt8")}>
                No completed integrations are connected for this client yet.
              </div>
            ) : null}
            <div className={cx("tasksSyncLog")}>
              <div className={cx("tasksSyncLogTitle")}>Task Sync Log</div>
              {selectedTaskSyncEvents.length === 0 ? (
                <div className={cx("tasksSyncLogEmpty")}>No sync events recorded yet.</div>
              ) : (
                <div className={cx("tasksSyncLogList")}>
                  {selectedTaskSyncEvents.map((event) => (
                    <div key={event.id} className={cx("tasksSyncLogItem")}>
                      <div className={cx("tasksSyncLogItemTop")}>
                        <span className={cx("tasksSyncLogProvider")}>{providerLabel(event.providerKey)}</span>
                        <span className={cx("badge", event.status === "SUCCESS" ? "badgeGreen" : "badgeRed")}>
                          {event.status === "SUCCESS" ? "Success" : "Failed"}
                        </span>
                      </div>
                      <div className={cx("tasksSyncLogMeta")}>
                        <span>{formatDateTime(event.createdAt)}</span>
                        <span>{event.durationMs ? `${event.durationMs}ms` : "—"}</span>
                      </div>
                      <div className={cx("tasksSyncLogMessage")}>
                        {event.summary ?? event.errorMessage ?? "No details available."}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
        <div className={cx("tableWrap")}>
          <table className={cx("table", "tasksTable")}>
            <colgroup>
              <col className={cx("tasksColPriority")} />
              <col className={cx("tasksColTask")} />
              <col className={cx("tasksColProject")} />
              <col className={cx("tasksColClient")} />
              <col className={cx("tasksColStatus")} />
              <col className={cx("tasksColCycle")} />
              <col className={cx("tasksColDue")} />
              <col className={cx("tasksColIntegrations")} />
              <col className={cx("tasksColThread")} />
              <col className={cx("tasksColAction")} />
            </colgroup>
            <thead>
              <tr>
                <th className={cx("textCenter", "tasksThCenter")} scope="col">Priority</th>
                <th className={cx("tasksThLeft")} scope="col">Task</th>
                <th className={cx("tasksThLeft")} scope="col">Project</th>
                <th className={cx("tasksThLeft")} scope="col">Client</th>
                <th className={cx("tasksThLeft")} scope="col">Status</th>
                <th className={cx("textRight", "tasksThRight")} scope="col">Cycle</th>
                <th className={cx("textRight", "tasksThRight")} scope="col">Due</th>
                <th className={cx("tasksThLeft")} scope="col">Integrations</th>
                <th className={cx("textCenter", "tasksThCenter")} scope="col">Client Thread</th>
                <th className={cx("textCenter", "tasksThCenter")} scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleTasks.length === 0 ? (
                <tr>
                  <td colSpan={10} className={cx("tasksEmptyCell")}>
                    <StaffEmptyState
                      icon={EmptyIcons.tasks}
                      title="No tasks yet"
                      sub="No tasks match the current filter. Try switching the view or assigning tasks in the project."
                    />
                  </td>
                </tr>
              ) : (
                sortedTasks.map((task) => (
                  <tr key={task.id} className={cx("tasksTableRow")}>
                    <td className={cx("textCenter")}><div className={cx("priority", "tasksPriorityDot", `priority${capitalize(task.priority)}`)} title={capitalize(task.priority)} /></td>
                    <td>
                      <div className={cx("tableName")}>{task.title}</div>
                      <div className={cx("tableSub", "tasksAssigneeSub")}>{task.subtitle}</div>
                    </td>
                    <td><span className={cx("badge", "tasksProjectBadge", badgeToneClass(task.badgeTone))}>{task.projectName}</span></td>
                    <td><span className={cx("textSm", "colorMuted")}>{task.clientName}</span></td>
                    <td><span className={cx("badge", "tasksStatusBadge", badgeToneClass(task.statusTone))}>{task.statusLabel}</span></td>
                    <td className={cx("textRight")}><span className={cx("mono", "text11", "colorMuted")}>{formatDuration(task.estimateMinutes)}</span></td>
                    <td className={cx("textRight")}><span className={cx("mono", "text11", "tasksDueLabel", dueToneClass(task.dueTone))}>{task.dueLabel}</span></td>
                    <td>
                      <div className={cx("tasksLinksCell")}>
                        {task.externalLinks.length === 0 ? (
                          <span className={cx("text11", "colorMuted2")}>No links</span>
                        ) : (
                          task.externalLinks.slice(0, 2).map((link) => (
                            <div key={link.id} className={cx("tasksLinkRow")}>
                              <a className={cx("tasksLinkAnchor")} href={link.externalUrl} target="_blank" rel="noreferrer">
                                {`${providerLabel(link.providerKey)} · ${link.externalId}`}
                              </a>
                              <button
                                type="button"
                                className={cx("tasksLinkRemoveBtn")}
                                onClick={() => void onRemoveTaskExternalLink(task.id, task.projectId, link.id)}
                                aria-label={`Remove ${link.externalId}`}
                              >
                                ×
                              </button>
                            </div>
                          ))
                        )}
                        {task.externalLinks.length > 2 ? (
                          <span className={cx("text10", "colorMuted2")}>{`+${task.externalLinks.length - 2} more`}</span>
                        ) : null}
                        <button
                          type="button"
                          className={cx("btnXs", "buttonGhost", "tasksLinkManageBtn")}
                          onClick={() => {
                            setLinkEditor({ taskId: task.id, projectId: task.projectId });
                            const taskProviders = integrationProvidersByClientId[task.clientId] ?? [];
                            setLinkProvider(taskProviders[0] ?? "jira");
                            setLinkExternalId("");
                            setLinkExternalUrl("");
                            setLinkTitle(task.title);
                            onLoadTaskIntegrationSyncEvents(task.id);
                          }}
                        >
                          Manage
                        </button>
                      </div>
                    </td>
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
                      <div className={cx("tasksActionStack")}>
                        <button
                          className={cx("btnXs", "tasksActionBtn", task.status === "DONE" ? "buttonGreen" : "buttonGhost")}
                          type="button"
                          onClick={() => onTaskAction(task.id, task.projectId, task.status)}
                        >
                          {task.status === "DONE" ? "Done" : task.status === "IN_PROGRESS" ? "Mark Done" : task.status === "BLOCKED" ? "Unblock" : "Start"}
                        </button>
                      </div>
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

"use client";

import { useEffect, useMemo, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { getStaffClients } from "../../../../lib/api/staff/clients";
import {
  getMyTasks,
  updateTaskStatus,
  type StaffTask,
  type TaskStatus,
} from "../../../../lib/api/staff/tasks";
import {
  getStaffProjects,
  getStaffSprints,
  type StaffSprint,
} from "../../../../lib/api/staff/projects";

const sprintStart = new Date();
const sprintEnd = new Date(Date.now() + 13 * 24 * 60 * 60 * 1000);

type Client = {
  id: string;
  name: string;
  avatar: string;
};

type Priority = "urgent" | "high" | "medium" | "low";
type Status = "todo" | "in_progress" | "done";
type Category = "Design" | "Strategy" | "Admin" | "Comms";
type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";

type BacklogItem = {
  id: string;
  clientId: string;
  title: string;
  estimate: number;
  priority: Priority;
  category: Category;
};

type SprintTask = {
  id: string;
  clientId: string;
  title: string;
  estimate: number;
  priority: Priority;
  category: Category;
  status: Status;
  day: Day | null;
  /** original API task id — used for status updates */
  apiTaskId?: string;
};

const days: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const sprintCapacity = 40;
const priorityOrder: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

function buildInitials(name: string): string {
  return name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();
}

function formatDate(base: Date, offset: number) {
  const date = new Date(base);
  date.setDate(date.getDate() + offset);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function statusToneClass(status: Status) {
  if (status === "in_progress") return "spStatusInProgress";
  if (status === "done") return "spStatusDone";
  return "spStatusTodo";
}

function priorityToneClass(priority: Priority) {
  if (priority === "urgent") return "spPriorityUrgent";
  if (priority === "high") return "spPriorityHigh";
  if (priority === "medium") return "spPriorityMedium";
  return "spPriorityLow";
}

function categoryToneClass(category: Category) {
  if (category === "Design") return "spCategoryDesign";
  if (category === "Strategy") return "spCategoryStrategy";
  if (category === "Comms") return "spCategoryComms";
  return "spCategoryAdmin";
}

function clientToneClass(clients: Client[], clientId: string): string {
  const idx = clients.findIndex((c) => c.id === clientId);
  const classes = ["spClientOne", "spClientTwo", "spClientThree", "spClientFour", "spClientFive"];
  return classes[Math.max(idx, 0) % 5] ?? "colorMuted2";
}

export function SprintPlanningPage({
  isActive,
  session,
}: {
  isActive: boolean;
  session: AuthSession | null;
}) {
  const [clients, setClients] = useState<Client[]>([]);
  const [sprint, setSprint] = useState<SprintTask[]>([]);
  const [backlog, setBacklog] = useState<BacklogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"board" | "list" | "backlog">("board");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<Day | "unassigned" | null>(null);

  // ── Load clients ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    void getStaffClients(session).then((r) => {
      if (cancelled) return;
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) {
        setClients(r.data.map((c) => ({ id: c.id, name: c.name, avatar: buildInitials(c.name) })));
      }
    });
    return () => { cancelled = true; };
  }, [session?.accessToken]);

  // ── Load tasks + sprints from API ──────────────────────────────────────
  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);

    void (async () => {
      // Fetch tasks + projects in parallel
      const [tasksResult, projectsResult] = await Promise.all([
        getMyTasks(session),
        getStaffProjects(session),
      ]);
      if (cancelled) return;
      if (tasksResult.nextSession) saveSession(tasksResult.nextSession);
      if (projectsResult.nextSession) saveSession(projectsResult.nextSession);

      const allTasks: StaffTask[] = tasksResult.data ?? [];
      const projects = projectsResult.data ?? [];

      // Build a project → clientId map
      const projectClientMap = new Map<string, string>();
      projects.forEach((p) => projectClientMap.set(p.id, p.clientId));

      // Map API priority to local priority
      const mapPriority = (p: string): Priority => {
        if (p === "HIGH") return "high";
        if (p === "MEDIUM") return "medium";
        return "low";
      };

      // Map API status to local status
      const mapStatus = (s: TaskStatus): Status => {
        if (s === "IN_PROGRESS") return "in_progress";
        if (s === "DONE") return "done";
        return "todo"; // TODO and BLOCKED both map to todo for sprint board
      };

      // Tasks with status TODO/BLOCKED go to backlog; IN_PROGRESS/DONE go to sprint
      const sprintItems: SprintTask[] = [];
      const backlogItems: BacklogItem[] = [];

      for (const task of allTasks) {
        const clientId = projectClientMap.get(task.projectId) ?? "";
        const priority = mapPriority(task.priority);
        const estimate = task.estimateMinutes ? Math.round(task.estimateMinutes / 60 * 10) / 10 : 1;

        if (task.status === "IN_PROGRESS" || task.status === "DONE") {
          sprintItems.push({
            id: task.id,
            clientId,
            title: task.title,
            estimate,
            priority,
            category: "Admin" as Category,
            status: mapStatus(task.status),
            day: null,
            apiTaskId: task.id,
          });
        } else {
          backlogItems.push({
            id: task.id,
            clientId,
            title: task.title,
            estimate,
            priority,
            category: "Admin" as Category,
          });
        }
      }

      setSprint(sprintItems);
      setBacklog(backlogItems);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [session?.accessToken]);

  const totalEstimate = sprint.reduce((sum, task) => sum + task.estimate, 0);
  const burnPct = Math.round((totalEstimate / sprintCapacity) * 100);
  const doneCount = sprint.filter((task) => task.status === "done").length;

  const filtered = sprint.filter((task) => clientFilter === "all" || task.clientId === clientFilter);

  const addToSprint = (item: BacklogItem) => {
    setSprint((previous) => [...previous, { ...item, id: crypto.randomUUID(), status: "todo", day: null }]);
    setBacklog((previous) => previous.filter((candidate) => candidate.id !== item.id));
  };

  const removeFromSprint = (id: string) => {
    const task = sprint.find((candidate) => candidate.id === id);
    setSprint((previous) => previous.filter((candidate) => candidate.id !== id));
    if (task) {
      setBacklog((previous) => [
        {
          id: task.id,
          clientId: task.clientId,
          title: task.title,
          estimate: task.estimate,
          priority: task.priority,
          category: task.category
        },
        ...previous
      ]);
    }
  };

  const cycleStatus = (id: string) => {
    const task = sprint.find((t) => t.id === id);
    if (!task) return;
    const next: Record<Status, Status> = { todo: "in_progress", in_progress: "done", done: "todo" };
    const nextStatus = next[task.status];
    setSprint((previous) =>
      previous.map((t) => (t.id !== id ? t : { ...t, status: nextStatus }))
    );
    // Fire-and-forget API update
    if (session && task.apiTaskId) {
      const apiStatus: TaskStatus = nextStatus === "in_progress" ? "IN_PROGRESS" : nextStatus === "done" ? "DONE" : "TODO";
      void updateTaskStatus(session, task.apiTaskId, apiStatus).then((r) => {
        if (r.nextSession) saveSession(r.nextSession);
      });
    }
  };

  const assignDay = (id: string, day: Day | null) => {
    setSprint((previous) => previous.map((task) => (task.id === id ? { ...task, day } : task)));
  };

  const byDay = useMemo<Record<Day | "unassigned", SprintTask[]>>(() => {
    const grouped = {
      Mon: filtered.filter((task) => task.day === "Mon"),
      Tue: filtered.filter((task) => task.day === "Tue"),
      Wed: filtered.filter((task) => task.day === "Wed"),
      Thu: filtered.filter((task) => task.day === "Thu"),
      Fri: filtered.filter((task) => task.day === "Fri"),
      unassigned: filtered.filter((task) => !task.day)
    };
    return grouped;
  }, [filtered]);

  const burnToneClass = burnPct > 90 ? "colorRed" : burnPct > 70 ? "colorAmber" : "colorAccent";
  const burnMeterClass = burnPct > 90 ? "spCapRed" : burnPct > 70 ? "spCapAmber" : "spCapAccent";

  if (loading) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-sprint-planning">
        <div className={cx("pageHeaderBar")}>
          <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Planning</div>
          <h1 className={cx("pageTitleText")}>Sprint Planning</h1>
          <div className={cx("text12", "colorMuted2", "mt16")}>Loading sprint data...</div>
        </div>
      </section>
    );
  }

  return (
    <section className={cx("page", "pageBody", "rdStudioPage", isActive && "pageActive")} id="page-sprint-planning">
      <div className={cx("pageHeaderBar", "spHeaderBar")}>
        <div className={cx("flexBetween", "mb16")}>
          <div>
            <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Planning</div>
            <h1 className={cx("pageTitleText")}>Sprint Planning</h1>
            <div className={cx("text11", "colorMuted2", "mt6")}>
              {formatDate(sprintStart, 0)} - {formatDate(sprintEnd, 0)} · 2 weeks
            </div>
          </div>

          <div className={cx("spTopStats")}>
            <div className={cx("textRight")}>
              <div className={cx("statLabelNew", "rdStudioLabel")}>Capacity used</div>
              <div className={cx("statValueNew", burnToneClass, "rdStudioMetric", burnPct > 90 ? "rdStudioMetricNeg" : burnPct > 70 ? "rdStudioMetricWarn" : "rdStudioMetricPos")}>
                {totalEstimate}h <span className={cx("spCapacityBase")}>/ {sprintCapacity}h</span>
              </div>
              <progress className={cx("progressMeter", "spCapacityMeter", burnMeterClass)} max={100} value={Math.min(burnPct, 100)} />
            </div>
            <div className={cx("textRight")}>
              <div className={cx("statLabelNew", "rdStudioLabel")}>Done</div>
              <div className={cx("statValueNew", "spDoneValue", "rdStudioMetric", "rdStudioMetricPos")}>{doneCount}/{sprint.length}</div>
            </div>
          </div>
        </div>

        <div className={cx("flexBetween", "gap10")}>
          <div className={cx("flexRow")}>
            {[
              { key: "board" as const, label: "Day board" },
              { key: "list" as const, label: "Task list" },
              { key: "backlog" as const, label: `Backlog (${backlog.length})` }
            ].map((tabItem) => (
              <button type="button"
                key={tabItem.key}
                className={cx("spTabBtn", "spTabPill", tab === tabItem.key ? "spTabPillActive" : "spTabPillIdle")}
                onClick={() => setTab(tabItem.key)}
              >
                {tabItem.label}
              </button>
            ))}
          </div>
          <div className={cx("filterRow", "pb10")}>
            <select
              className={cx("filterSelect")}
              aria-label="Filter sprint by client"
              value={clientFilter}
              onChange={(event) => setClientFilter(event.target.value)}
            >
              <option value="all">All clients</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className={cx("spSectionPad")}>
        {tab === "board" ? (
          <div className={cx("spBoardGrid")}>
            {days.map((day, dayIndex) => {
              const dayTasks = byDay[day] ?? [];
              const dayHours = dayTasks.reduce((sum, task) => sum + task.estimate, 0);
              return (
                <div
                  key={day}
                  className={cx("spDropZone", "spDayColumn", dragOver === day && "spDayColumnOver")}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragOver(day);
                  }}
                  onDragLeave={() => setDragOver((previous) => (previous === day ? null : previous))}
                  onDrop={() => {
                    if (dragging) {
                      assignDay(dragging, day);
                      setDragging(null);
                      setDragOver(null);
                    }
                  }}
                >
                  <div className={cx("spDayHead", "rdStudioSection")}>
                    <div>
                      <div className={cx("spDayName", "rdStudioLabel")}>{day}</div>
                      <div className={cx("spDayDate")}>{formatDate(sprintStart, dayIndex)}</div>
                    </div>
                    <div className={cx("spDayHours", dayHours > 8 && "spDayHoursWarn")}>{dayHours}h</div>
                  </div>
                  <div className={cx("spDayTaskList")}>
                    {dayTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        clients={clients}
                        onStatus={() => cycleStatus(task.id)}
                        onRemove={() => removeFromSprint(task.id)}
                        draggable
                        onDragStart={() => setDragging(task.id)}
                      />
                    ))}
                    {dragOver === day && dragging ? <div className={cx("spDragPlaceholder")} /> : null}
                  </div>
                </div>
              );
            })}
            <div className={cx("spUnscheduledCol", dragOver === "unassigned" && "spUnscheduledOver")}>
              <div className={cx("spUnscheduledTitle")}>Unscheduled</div>
              <div
                className={cx("spDayTaskList")}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOver("unassigned");
                }}
                onDragLeave={() => setDragOver((previous) => (previous === "unassigned" ? null : previous))}
                onDrop={() => {
                  if (dragging) {
                    assignDay(dragging, null);
                    setDragging(null);
                    setDragOver(null);
                  }
                }}
              >
                {byDay.unassigned.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    clients={clients}
                    onStatus={() => cycleStatus(task.id)}
                    onRemove={() => removeFromSprint(task.id)}
                    draggable
                    onDragStart={() => setDragging(task.id)}
                    compact
                  />
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {tab === "list" ? (
          <div className={cx("spListWrap")}>
            {(["urgent", "high", "medium", "low"] as Priority[]).map((priority) => {
              const tasks = filtered
                .filter((task) => task.priority === priority)
                .sort((a, b) => (a.status === "done" ? 1 : 0) - (b.status === "done" ? 1 : 0));
              if (tasks.length === 0) return null;
              return (
                <div key={priority} className={cx("spPrioritySection")}>
                  <div className={cx("spPriorityHead")}>
                    <div className={cx("spPriorityDot", priorityToneClass(priority))} />
                    <span className={cx("spPriorityLabel", priorityToneClass(priority))}>{priority} priority</span>
                    <div className={cx("spDivider")} />
                  </div>
                  {tasks.map((task) => {
                    const client = clients.find((candidate) => candidate.id === task.clientId);
                    return (
                      <div key={task.id} className={cx("spListTaskRow", task.status === "done" && "spTaskDoneRow", "rdStudioRow")}>
                        <button type="button" className={cx("spStatusBtn", "spStatusBtnLg", statusToneClass(task.status), task.status === "done" && "spStatusDoneFill")} onClick={() => cycleStatus(task.id)}>
                          {task.status === "done" ? "✓" : task.status === "in_progress" ? "◉" : ""}
                        </button>
                        <div className={cx("flex1", "minW0")}>
                          <div className={cx("spTaskTitle", task.status === "done" && "spTaskTitleDone")}>{task.title}</div>
                          <div className={cx("spTaskMetaRow")}>
                            <span className={cx("text10", clientToneClass(clients, task.clientId))}>{client?.name}</span>
                            <span className={cx("text10", categoryToneClass(task.category))}>{task.category}</span>
                          </div>
                        </div>
                        <div className={cx("flexRow", "gap6")}>
                          {days.map((day) => (
                            <button type="button"
                              key={day}
                              className={cx("spDayPill", task.day === day ? "spDayPillActive" : "spDayPillIdle")}
                              onClick={() => assignDay(task.id, task.day === day ? null : day)}
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                        <span className={cx("text11", "colorMuted2", "noShrink")}>{task.estimate}h</span>
                        <button type="button" className={cx("spRemoveBtn", "spRemoveIcon")} onClick={() => removeFromSprint(task.id)}>
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className={cx("emptyState")}>
                <div className={cx("emptyStateIcon")}><Ic n="layers" sz={22} c="var(--muted2)" /></div>
                <div className={cx("emptyStateTitle")}>Sprint backlog is empty</div>
                <div className={cx("emptyStateSub")}>Add items from the Backlog tab to plan this sprint.</div>
              </div>
            )}
          </div>
        ) : null}

        {tab === "backlog" ? (
          <div className={cx("spBacklogGrid")}>
            {[...backlog]
              .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
              .map((item) => {
                const client = clients.find((candidate) => candidate.id === item.clientId);
                return (
                  <div key={item.id} className={cx("spBacklogCard")}>
                    <div className={cx("flex1", "minW0")}>
                      <div className={cx("spBacklogTitle")}>{item.title}</div>
                      <div className={cx("spBacklogMeta")}>
                        <span className={cx("text10", clientToneClass(clients, item.clientId))}>{client?.name}</span>
                        <span className={cx("text10", "uppercase", priorityToneClass(item.priority))}>{item.priority}</span>
                        <span className={cx("text10", "colorMuted2")}>{item.estimate}h</span>
                      </div>
                    </div>
                    <button type="button" className={cx("spAddBtn", "spBacklogAddBtn")} onClick={() => addToSprint(item)}>
                      + Add
                    </button>
                  </div>
                );
              })}
            {backlog.length === 0 ? (
              <div className={cx("emptyState")}>
                <div className={cx("emptyStateIcon")}><Ic n="inbox" sz={22} c="var(--muted2)" /></div>
                <div className={cx("emptyStateTitle")}>Backlog is empty</div>
                <div className={cx("emptyStateSub")}>Tasks moved out of the sprint will appear here.</div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function TaskCard({
  task,
  clients,
  onStatus,
  onRemove,
  draggable,
  onDragStart,
  compact
}: {
  task: SprintTask;
  clients: Client[];
  onStatus: () => void;
  onRemove: () => void;
  draggable?: boolean;
  onDragStart?: () => void;
  compact?: boolean;
}) {
  const client = clients.find((candidate) => candidate.id === task.clientId);

  return (
    <div
      className={cx(
        "spTaskCard",
        "spTaskCardBase",
        compact && "spTaskCardCompact",
        task.status === "in_progress" && "spTaskCardProgress",
        task.status === "done" && "spTaskCardDone",
        draggable && "spTaskCardDraggable"
      )}
      draggable={Boolean(draggable)}
      onDragStart={onDragStart}
    >
      <div className={cx("spTaskInner")}>
        <button type="button" className={cx("spStatusBtn", "spStatusBtnSm", task.status === "done" && "spStatusDoneFill")} onClick={onStatus}>
          {task.status === "done" ? "✓" : task.status === "in_progress" ? "●" : ""}
        </button>
        <div className={cx("flex1", "minW0")}>
          <div className={cx("spTaskTitleMini", task.status === "done" && "spTaskTitleMiniDone")}>{task.title}</div>
          <div className={cx("spTaskMetaMini")}>
            <span className={cx("text10", clientToneClass(clients, task.clientId))}>{client?.avatar}</span>
            <span className={cx("text10", "colorMuted2")}>{task.estimate}h</span>
          </div>
        </div>
        <button type="button" className={cx("spRemoveBtn", "spTaskRemoveMini")} onClick={onRemove}>
          ×
        </button>
      </div>
      <div className={cx("spTaskActions")}>
        <div className={cx("spPriorityDot", priorityToneClass(task.priority))} />
        <span className={cx("spPriorityText")}>{task.priority}</span>
      </div>
    </div>
  );
}

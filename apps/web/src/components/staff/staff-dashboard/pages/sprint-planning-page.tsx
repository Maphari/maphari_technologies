"use client";

import { useMemo, useState } from "react";
import { cx } from "../style";

const sprintStart = new Date("2026-02-23");
const sprintEnd = new Date("2026-03-06");

type Client = {
  id: number;
  name: string;
  avatar: string;
  color: string;
};

type Priority = "urgent" | "high" | "medium" | "low";
type Status = "todo" | "in_progress" | "done";
type Category = "Design" | "Strategy" | "Admin" | "Comms";
type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";

type BacklogItem = {
  id: number;
  clientId: number;
  title: string;
  estimate: number;
  priority: Priority;
  category: Category;
};

type SprintTask = {
  id: number;
  clientId: number;
  title: string;
  estimate: number;
  priority: Priority;
  category: Category;
  status: Status;
  day: Day | null;
};

const clients: Client[] = [
  { id: 1, name: "Volta Studios", avatar: "VS", color: "var(--accent)" },
  { id: 2, name: "Kestrel Capital", avatar: "KC", color: "var(--purple)" },
  { id: 3, name: "Mira Health", avatar: "MH", color: "var(--blue)" },
  { id: 4, name: "Dune Collective", avatar: "DC", color: "var(--amber)" },
  { id: 5, name: "Okafor & Sons", avatar: "OS", color: "var(--amber)" }
];

const initialBacklog: BacklogItem[] = [
  { id: 101, clientId: 1, title: "Brand guidelines document", estimate: 6, priority: "high", category: "Design" },
  { id: 102, clientId: 1, title: "Animation direction deck", estimate: 4, priority: "medium", category: "Design" },
  { id: 103, clientId: 2, title: "Channel brief - LinkedIn focus", estimate: 3, priority: "high", category: "Strategy" },
  { id: 104, clientId: 2, title: "Paid media plan outline", estimate: 4, priority: "medium", category: "Strategy" },
  { id: 105, clientId: 3, title: "Desktop wireframes - all screens", estimate: 8, priority: "high", category: "Design" },
  { id: 106, clientId: 3, title: "Component library setup", estimate: 5, priority: "medium", category: "Design" },
  { id: 107, clientId: 4, title: "Follow up with Kofi re: approval", estimate: 0.5, priority: "urgent", category: "Admin" },
  { id: 108, clientId: 5, title: "Layout & typesetting - report", estimate: 6, priority: "medium", category: "Design" },
  { id: 109, clientId: 5, title: "Cover design options (3)", estimate: 3, priority: "low", category: "Design" },
  { id: 110, clientId: 2, title: "Content calendar - Q1", estimate: 4, priority: "low", category: "Strategy" }
];

const initialSprint: SprintTask[] = [
  { id: 1, clientId: 1, title: "Chase logo sign-off from Lena", estimate: 0.5, priority: "urgent", category: "Admin", status: "todo", day: null },
  { id: 2, clientId: 2, title: "Prep for strategy approval call Thu", estimate: 1, priority: "high", category: "Admin", status: "todo", day: null },
  { id: 3, clientId: 3, title: "UX review call - revised wireframes", estimate: 1, priority: "high", category: "Comms", status: "todo", day: "Mon" },
  { id: 4, clientId: 1, title: "Begin brand guidelines doc", estimate: 4, priority: "high", category: "Design", status: "in_progress", day: "Mon" },
  { id: 5, clientId: 4, title: "Escalate Dune situation to admin", estimate: 0.5, priority: "urgent", category: "Admin", status: "todo", day: "Mon" },
  { id: 6, clientId: 3, title: "Desktop wireframes - phase 1", estimate: 6, priority: "high", category: "Design", status: "todo", day: "Tue" },
  { id: 7, clientId: 5, title: "Annual report layout - section 1", estimate: 4, priority: "medium", category: "Design", status: "todo", day: "Wed" },
  { id: 8, clientId: 2, title: "LinkedIn channel brief", estimate: 3, priority: "high", category: "Strategy", status: "todo", day: "Thu" }
];

const days: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const sprintCapacity = 40;
const priorityOrder: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

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

function clientToneClass(clientId?: number) {
  if (clientId === 1) return "spClientOne";
  if (clientId === 2) return "spClientTwo";
  if (clientId === 3) return "spClientThree";
  if (clientId === 4) return "spClientFour";
  if (clientId === 5) return "spClientFive";
  return "colorMuted2";
}

export function SprintPlanningPage({ isActive }: { isActive: boolean }) {
  const [sprint, setSprint] = useState<SprintTask[]>(initialSprint);
  const [backlog, setBacklog] = useState<BacklogItem[]>(initialBacklog);
  const [tab, setTab] = useState<"board" | "list" | "backlog">("board");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<Day | "unassigned" | null>(null);

  const totalEstimate = sprint.reduce((sum, task) => sum + task.estimate, 0);
  const burnPct = Math.round((totalEstimate / sprintCapacity) * 100);
  const doneCount = sprint.filter((task) => task.status === "done").length;

  const filtered = sprint.filter((task) => clientFilter === "all" || task.clientId === Number(clientFilter));

  const addToSprint = (item: BacklogItem) => {
    setSprint((previous) => [...previous, { ...item, id: Date.now(), status: "todo", day: null }]);
    setBacklog((previous) => previous.filter((candidate) => candidate.id !== item.id));
  };

  const removeFromSprint = (id: number) => {
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

  const cycleStatus = (id: number) => {
    setSprint((previous) =>
      previous.map((task) => {
        if (task.id !== id) return task;
        const next: Record<Status, Status> = { todo: "in_progress", in_progress: "done", done: "todo" };
        return { ...task, status: next[task.status] };
      })
    );
  };

  const assignDay = (id: number, day: Day | null) => {
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

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-sprint-planning">
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
              <div className={cx("statLabelNew")}>Capacity used</div>
              <div className={cx("statValueNew", burnToneClass)}>
                {totalEstimate}h <span className={cx("spCapacityBase")}>/ {sprintCapacity}h</span>
              </div>
              <progress className={cx("progressMeter", "spCapacityMeter", burnMeterClass)} max={100} value={Math.min(burnPct, 100)} />
            </div>
            <div className={cx("textRight")}>
              <div className={cx("statLabelNew")}>Done</div>
              <div className={cx("statValueNew", "spDoneValue")}>{doneCount}/{sprint.length}</div>
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
                <option key={client.id} value={String(client.id)}>
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
                  <div className={cx("spDayHead")}>
                    <div>
                      <div className={cx("spDayName")}>{day}</div>
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
                      <div key={task.id} className={cx("spListTaskRow", task.status === "done" && "spTaskDoneRow")}>
                        <button type="button" className={cx("spStatusBtn", "spStatusBtnLg", statusToneClass(task.status), task.status === "done" && "spStatusDoneFill")} onClick={() => cycleStatus(task.id)}>
                          {task.status === "done" ? "✓" : task.status === "in_progress" ? "◉" : ""}
                        </button>
                        <div className={cx("flex1", "minW0")}>
                          <div className={cx("spTaskTitle", task.status === "done" && "spTaskTitleDone")}>{task.title}</div>
                          <div className={cx("spTaskMetaRow")}>
                            <span className={cx("text10", clientToneClass(client?.id))}>{client?.name}</span>
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
                        <span className={cx("text10", clientToneClass(client?.id))}>{client?.name}</span>
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
            {backlog.length === 0 ? <div className={cx("spBacklogEmpty")}>All backlog items are in the sprint.</div> : null}
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
        <button type="button" className={cx("spStatusBtn", "spStatusBtnSm", statusToneClass(task.status), task.status === "done" && "spStatusDoneFill")} onClick={onStatus}>
          {task.status === "done" ? "✓" : task.status === "in_progress" ? "●" : ""}
        </button>
        <div className={cx("flex1", "minW0")}>
          <div className={cx("spTaskTitleMini", task.status === "done" && "spTaskTitleMiniDone")}>{task.title}</div>
          <div className={cx("spTaskMetaMini")}>
            <span className={cx("text10", clientToneClass(client?.id))}>{client?.avatar}</span>
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

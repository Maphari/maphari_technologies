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
  { id: 2, name: "Kestrel Capital", avatar: "KC", color: "#a78bfa" },
  { id: 3, name: "Mira Health", avatar: "MH", color: "#60a5fa" },
  { id: 4, name: "Dune Collective", avatar: "DC", color: "#f5c518" },
  { id: 5, name: "Okafor & Sons", avatar: "OS", color: "#ff8c00" }
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
const priorityColors: Record<Priority, string> = { urgent: "#ff4444", high: "#f5c518", medium: "#60a5fa", low: "var(--muted2)" };
const statusConfig: Record<Status, { label: string; color: string }> = {
  todo: { label: "To do", color: "var(--muted2)" },
  in_progress: { label: "In progress", color: "var(--accent)" },
  done: { label: "Done", color: "#a78bfa" }
};
const categoryColors: Record<Category, string> = {
  Design: "#a78bfa",
  Strategy: "#60a5fa",
  Admin: "#a0a0b0",
  Comms: "#f5c518"
};

function formatDate(base: Date, offset: number) {
  const date = new Date(base);
  date.setDate(date.getDate() + offset);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function SprintPlanningPage({ isActive }: { isActive: boolean }) {
  const [sprint, setSprint] = useState<SprintTask[]>(initialSprint);
  const [backlog, setBacklog] = useState<BacklogItem[]>(initialBacklog);
  const [tab, setTab] = useState<"board" | "list" | "backlog">("board");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

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

  return (
    <section className={cx("page", isActive && "pageActive")} id="page-sprint-planning">
      <style>{`
        .sp-tab-btn { transition: all 0.12s ease; cursor: pointer; border: none; font-family: 'DM Mono', monospace; }
        .sp-filter-btn { transition: all 0.12s ease; cursor: pointer; border: none; font-family: 'DM Mono', monospace; }
        .sp-filter-btn:hover { opacity: 0.8; }
        .sp-task-card { transition: border-color 0.12s ease; }
        .sp-task-card:hover .sp-task-actions { opacity: 1 !important; }
        .sp-status-btn { transition: all 0.12s ease; cursor: pointer; border: none; font-family: 'DM Mono', monospace; }
        .sp-status-btn:hover { opacity: 0.75; }
        .sp-day-pill { transition: all 0.12s ease; cursor: pointer; font-family: 'DM Mono', monospace; }
        .sp-day-pill:hover { background: rgba(255,255,255,0.08) !important; }
        .sp-add-btn { transition: all 0.12s ease; cursor: pointer; font-family: 'DM Mono', monospace; }
        .sp-add-btn:hover { background: color-mix(in srgb, var(--accent) 12%, transparent) !important; color: var(--accent) !important; }
        .sp-remove-btn { transition: all 0.12s ease; cursor: pointer; font-family: 'DM Mono', monospace; }
        .sp-remove-btn:hover { color: #ff4444 !important; }
      `}</style>

      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
              Staff Dashboard / Planning
            </div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              Sprint Planning
            </h1>
            <div style={{ fontSize: 11, color: "var(--muted2)", marginTop: 6 }}>
              {formatDate(sprintStart, 0)} - {formatDate(sprintEnd, 0)} · 2 weeks
            </div>
          </div>

          <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Capacity used</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: burnPct > 90 ? "#ff4444" : burnPct > 70 ? "#f5c518" : "var(--accent)" }}>
                {totalEstimate}h <span style={{ fontSize: 13, color: "var(--muted2)", fontWeight: 400 }}>/ {sprintCapacity}h</span>
              </div>
              <div style={{ width: 160, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, marginTop: 6, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(burnPct, 100)}%`, background: burnPct > 90 ? "#ff4444" : burnPct > 70 ? "#f5c518" : "var(--accent)", borderRadius: 2 }} />
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Done</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: "#a78bfa" }}>{doneCount}/{sprint.length}</div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 0 }}>
            {[
              { key: "board" as const, label: "Day board" },
              { key: "list" as const, label: "Task list" },
              { key: "backlog" as const, label: `Backlog (${backlog.length})` }
            ].map((tabItem) => (
              <button
                key={tabItem.key}
                className="sp-tab-btn"
                onClick={() => setTab(tabItem.key)}
                style={{ padding: "10px 20px", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", background: "transparent", color: tab === tabItem.key ? "var(--accent)" : "var(--muted2)", borderBottom: `2px solid ${tab === tabItem.key ? "var(--accent)" : "transparent"}`, marginBottom: -1 }}
              >
                {tabItem.label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, paddingBottom: 10 }}>
            <button
              className="sp-filter-btn"
              onClick={() => setClientFilter("all")}
              style={{ padding: "5px 10px", fontSize: 10, borderRadius: 2, background: clientFilter === "all" ? "rgba(255,255,255,0.08)" : "transparent", color: clientFilter === "all" ? "var(--text)" : "var(--muted2)" }}
            >
              All
            </button>
            {clients.map((client) => (
              <button
                key={client.id}
                className="sp-filter-btn"
                onClick={() => setClientFilter(clientFilter === String(client.id) ? "all" : String(client.id))}
                style={{ padding: "5px 10px", fontSize: 10, borderRadius: 2, background: clientFilter === String(client.id) ? `${client.color}18` : "transparent", color: clientFilter === String(client.id) ? client.color : "var(--muted2)" }}
              >
                {client.avatar}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 0" }}>
        {tab === "board" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr) 200px", gap: 14 }}>
            {days.map((day, dayIndex) => {
              const dayTasks = byDay[day] ?? [];
              const dayHours = dayTasks.reduce((sum, task) => sum + task.estimate, 0);
              return (
                <div
                  key={day}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragOver(day);
                  }}
                  onDrop={() => {
                    if (dragging) {
                      assignDay(dragging, day);
                      setDragging(null);
                      setDragOver(null);
                    }
                  }}
                  style={{ background: dragOver === day ? "color-mix(in srgb, var(--accent) 4%, transparent)" : "transparent", borderRadius: 4, transition: "background 0.12s ease" }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 12, color: "var(--text)", fontWeight: 500 }}>{day}</div>
                      <div style={{ fontSize: 10, color: "var(--muted2)" }}>{formatDate(sprintStart, dayIndex)}</div>
                    </div>
                    <div style={{ fontSize: 10, color: dayHours > 8 ? "#ff4444" : "var(--muted2)" }}>{dayHours}h</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, minHeight: 80 }}>
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
                    {dragOver === day && dragging ? <div style={{ height: 36, border: "1px dashed color-mix(in srgb, var(--accent) 30%, transparent)", borderRadius: 3 }} /> : null}
                  </div>
                </div>
              );
            })}
            <div>
              <div style={{ fontSize: 12, color: "var(--muted2)", marginBottom: 10, fontWeight: 500 }}>Unscheduled</div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 6 }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOver("unassigned");
                }}
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
          <div style={{ maxWidth: 720 }}>
            {(["urgent", "high", "medium", "low"] as Priority[]).map((priority) => {
              const tasks = filtered
                .filter((task) => task.priority === priority)
                .sort((a, b) => (a.status === "done" ? 1 : 0) - (b.status === "done" ? 1 : 0));
              if (tasks.length === 0) return null;
              return (
                <div key={priority} style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: priorityColors[priority] }} />
                    <span style={{ fontSize: 10, color: priorityColors[priority], letterSpacing: "0.12em", textTransform: "uppercase" }}>{priority} priority</span>
                    <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.04)" }} />
                  </div>
                  {tasks.map((task) => {
                    const client = clients.find((candidate) => candidate.id === task.clientId);
                    const status = statusConfig[task.status];
                    return (
                      <div key={task.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 3, marginBottom: 6, background: "rgba(255,255,255,0.01)", opacity: task.status === "done" ? 0.5 : 1 }}>
                        <button
                          className="sp-status-btn"
                          onClick={() => cycleStatus(task.id)}
                          style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${status.color}`, background: task.status === "done" ? `${status.color}20` : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: status.color, flexShrink: 0 }}
                        >
                          {task.status === "done" ? "✓" : task.status === "in_progress" ? "◉" : ""}
                        </button>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, color: task.status === "done" ? "var(--muted2)" : "var(--text)", textDecoration: task.status === "done" ? "line-through" : "none" }}>{task.title}</div>
                          <div style={{ display: "flex", gap: 8, marginTop: 3 }}>
                            <span style={{ fontSize: 10, color: client?.color }}>{client?.name}</span>
                            <span style={{ fontSize: 10, color: categoryColors[task.category] }}>{task.category}</span>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          {days.map((day) => (
                            <button
                              key={day}
                              className="sp-day-pill"
                              onClick={() => assignDay(task.id, task.day === day ? null : day)}
                              style={{ padding: "2px 7px", fontSize: 9, borderRadius: 2, background: task.day === day ? "color-mix(in srgb, var(--accent) 12%, transparent)" : "rgba(255,255,255,0.04)", color: task.day === day ? "var(--accent)" : "var(--muted2)", border: "none" }}
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                        <span style={{ fontSize: 11, color: "var(--muted2)", flexShrink: 0 }}>{task.estimate}h</span>
                        <button className="sp-remove-btn" onClick={() => removeFromSprint(task.id)} style={{ fontSize: 14, color: "#333344", background: "none", border: "none", padding: "0 4px", cursor: "pointer" }}>
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, maxWidth: 800 }}>
            {[...backlog]
              .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
              .map((item) => {
                const client = clients.find((candidate) => candidate.id === item.clientId);
                return (
                  <div key={item.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "13px 14px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 3, background: "rgba(255,255,255,0.01)" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: "var(--text)", marginBottom: 5 }}>{item.title}</div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: 10, color: client?.color }}>{client?.name}</span>
                        <span style={{ fontSize: 9, color: priorityColors[item.priority], letterSpacing: "0.06em", textTransform: "uppercase" }}>{item.priority}</span>
                        <span style={{ fontSize: 10, color: "var(--muted2)" }}>{item.estimate}h</span>
                      </div>
                    </div>
                    <button
                      className="sp-add-btn"
                      onClick={() => addToSprint(item)}
                      style={{ padding: "6px 12px", fontSize: 10, letterSpacing: "0.08em", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--muted2)", textTransform: "uppercase", cursor: "pointer" }}
                    >
                      + Add
                    </button>
                  </div>
                );
              })}
            {backlog.length === 0 ? <div style={{ color: "var(--muted2)", fontSize: 12, gridColumn: "span 2", padding: "40px 0", textAlign: "center" }}>All backlog items are in the sprint.</div> : null}
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
  const status = statusConfig[task.status];
  return (
    <div
      className="sp-task-card"
      draggable={draggable}
      onDragStart={onDragStart}
      style={{ padding: compact ? "8px 10px" : "10px 12px", border: `1px solid ${task.status === "in_progress" ? "color-mix(in srgb, var(--accent) 20%, transparent)" : "rgba(255,255,255,0.06)"}`, borderRadius: 3, background: task.status === "done" ? "rgba(255,255,255,0.005)" : "rgba(255,255,255,0.02)", cursor: draggable ? "grab" : "default", opacity: task.status === "done" ? 0.5 : 1 }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <button
          className="sp-status-btn"
          onClick={onStatus}
          style={{ width: 14, height: 14, borderRadius: "50%", border: `1.5px solid ${status.color}`, background: task.status === "done" ? `${status.color}20` : "transparent", flexShrink: 0, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: status.color }}
        >
          {task.status === "done" ? "✓" : task.status === "in_progress" ? "●" : ""}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: task.status === "done" ? "var(--muted2)" : "var(--text)", lineHeight: 1.3, textDecoration: task.status === "done" ? "line-through" : "none", marginBottom: 3 }}>{task.title}</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 9, color: client?.color }}>{client?.avatar}</span>
            <span style={{ fontSize: 9, color: "var(--muted2)" }}>{task.estimate}h</span>
          </div>
        </div>
        <button className="sp-remove-btn" onClick={onRemove} style={{ fontSize: 12, color: "#222230", background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1 }}>
          ×
        </button>
      </div>
      <div className="sp-task-actions" style={{ opacity: 0, transition: "opacity 0.12s", marginTop: 4, display: "flex", gap: 3 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: priorityColors[task.priority] }} />
        <span style={{ fontSize: 9, color: "var(--muted2)", letterSpacing: "0.06em" }}>{task.priority}</span>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { cx } from "../style";

type ClientRow = {
  id: number;
  name: string;
  avatar: string;
  color: string;
};

type Frequency = "Daily" | "Weekly" | "Bi-weekly" | "Monthly";
type Weekday = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";
type Category = "Admin" | "Comms" | "Design" | "Finance" | "Strategy" | "Reporting";

type RecurringTaskItem = {
  id: number;
  clientId: number;
  title: string;
  frequency: Frequency;
  dayOfWeek: Weekday | null;
  estimate: number;
  category: Category;
  active: boolean;
  lastDone: string;
  nextDue: string;
  streak: number;
  totalDone: number;
};

const clients: ClientRow[] = [
  { id: 1, name: "Volta Studios", avatar: "VS", color: "var(--accent)" },
  { id: 2, name: "Kestrel Capital", avatar: "KC", color: "#a78bfa" },
  { id: 3, name: "Mira Health", avatar: "MH", color: "#60a5fa" },
  { id: 4, name: "Dune Collective", avatar: "DC", color: "#f5c518" },
  { id: 5, name: "Okafor & Sons", avatar: "OS", color: "#ff8c00" },
  { id: 0, name: "Internal", avatar: "IN", color: "#a0a0b0" }
];

const frequencies: Frequency[] = ["Daily", "Weekly", "Bi-weekly", "Monthly"];
const days: Weekday[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const categories: Category[] = ["Admin", "Comms", "Design", "Finance", "Strategy", "Reporting"];

const initialTasks: RecurringTaskItem[] = [
  { id: 1, clientId: 2, title: "Send weekly retainer burn report", frequency: "Weekly", dayOfWeek: "Fri", estimate: 0.5, category: "Reporting", active: true, lastDone: "Feb 20", nextDue: "Feb 27", streak: 6, totalDone: 6 },
  { id: 2, clientId: 0, title: "Submit daily standup log", frequency: "Daily", dayOfWeek: null, estimate: 0.25, category: "Admin", active: true, lastDone: "Today", nextDue: "Tomorrow", streak: 12, totalDone: 18 },
  { id: 3, clientId: 1, title: "Check Volta portal for client activity", frequency: "Daily", dayOfWeek: null, estimate: 0.1, category: "Comms", active: true, lastDone: "Today", nextDue: "Tomorrow", streak: 5, totalDone: 9 },
  { id: 4, clientId: 0, title: "Log hours for all active projects", frequency: "Weekly", dayOfWeek: "Fri", estimate: 0.5, category: "Admin", active: true, lastDone: "Feb 20", nextDue: "Feb 27", streak: 8, totalDone: 8 },
  { id: 5, clientId: 3, title: "Send Mira Health progress update", frequency: "Weekly", dayOfWeek: "Wed", estimate: 0.5, category: "Comms", active: true, lastDone: "Feb 18", nextDue: "Feb 25", streak: 3, totalDone: 3 },
  { id: 6, clientId: 5, title: "Okafor relationship check-in message", frequency: "Bi-weekly", dayOfWeek: "Mon", estimate: 0.25, category: "Comms", active: true, lastDone: "Feb 16", nextDue: "Mar 2", streak: 2, totalDone: 4 },
  { id: 7, clientId: 0, title: "Review and clear notification backlog", frequency: "Daily", dayOfWeek: null, estimate: 0.25, category: "Admin", active: true, lastDone: "Yesterday", nextDue: "Today", streak: 0, totalDone: 14 },
  { id: 8, clientId: 0, title: "Monthly performance self-review", frequency: "Monthly", dayOfWeek: null, estimate: 1, category: "Admin", active: true, lastDone: "Feb 1", nextDue: "Mar 1", streak: 3, totalDone: 3 },
  { id: 9, clientId: 2, title: "Kestrel invoice chase (if overdue)", frequency: "Weekly", dayOfWeek: "Mon", estimate: 0.25, category: "Finance", active: false, lastDone: "Feb 16", nextDue: "Feb 23", streak: 0, totalDone: 2 },
  { id: 10, clientId: 4, title: "Dune Collective follow-up message", frequency: "Weekly", dayOfWeek: "Tue", estimate: 0.25, category: "Comms", active: true, lastDone: "Feb 17", nextDue: "Feb 24", streak: 0, totalDone: 3 }
];

const freqColors: Record<Frequency, string> = {
  Daily: "var(--accent)",
  Weekly: "#60a5fa",
  "Bi-weekly": "#a78bfa",
  Monthly: "#f5c518"
};

const catColors: Record<Category, string> = {
  Admin: "#a0a0b0",
  Comms: "#60a5fa",
  Design: "#a78bfa",
  Finance: "var(--accent)",
  Strategy: "#f5c518",
  Reporting: "#ff8c00"
};

function StreakBadge({ streak }: { streak: number }) {
  if (streak === 0) return <span style={{ fontSize: 10, color: "var(--muted2)" }}>No streak</span>;
  const color = streak >= 10 ? "var(--accent)" : streak >= 5 ? "#f5c518" : "#a0a0b0";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <span style={{ fontSize: 11, color }}>◆</span>
      <span style={{ fontSize: 11, color, fontWeight: 500 }}>{streak}</span>
      <span style={{ fontSize: 10, color: "var(--muted2)" }}>streak</span>
    </div>
  );
}

export function RecurringTasksPage({ isActive }: { isActive: boolean }) {
  const [tasks, setTasks] = useState<RecurringTaskItem[]>(initialTasks);
  const [filter, setFilter] = useState<"all" | "active" | "paused">("all");
  const [freqFilter, setFreqFilter] = useState<"all" | Frequency>("all");
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({
    clientId: "0",
    title: "",
    frequency: "Weekly" as Frequency,
    dayOfWeek: "Mon" as Weekday | null,
    estimate: "0.5",
    category: "Admin" as Category
  });
  const [markingDone, setMarkingDone] = useState<number | null>(null);

  const toggleActive = (id: number) =>
    setTasks((previous) => previous.map((task) => (task.id === id ? { ...task, active: !task.active } : task)));

  const markDone = (id: number) => {
    setTasks((previous) =>
      previous.map((task) => {
        if (task.id !== id) return task;
        return { ...task, lastDone: "Today", streak: task.streak + 1, totalDone: task.totalDone + 1 };
      })
    );
    setMarkingDone(id);
    window.setTimeout(() => setMarkingDone(null), 1000);
  };

  const addTask = () => {
    const newTask: RecurringTaskItem = {
      id: Date.now(),
      clientId: Number(draft.clientId),
      title: draft.title.trim(),
      frequency: draft.frequency,
      dayOfWeek: draft.dayOfWeek,
      estimate: Number.parseFloat(draft.estimate) || 0,
      category: draft.category,
      active: true,
      lastDone: "Never",
      nextDue: "Next occurrence",
      streak: 0,
      totalDone: 0
    };
    setTasks((previous) => [newTask, ...previous]);
    setAdding(false);
    setDraft({ clientId: "0", title: "", frequency: "Weekly", dayOfWeek: "Mon", estimate: "0.5", category: "Admin" });
  };

  const deleteTask = (id: number) => setTasks((previous) => previous.filter((task) => task.id !== id));

  const filtered = tasks
    .filter((task) => (filter === "all" ? true : filter === "active" ? task.active : !task.active))
    .filter((task) => freqFilter === "all" || task.frequency === freqFilter);

  const dueSoon = tasks.filter((task) => task.active && (task.nextDue === "Today" || task.nextDue === "Tomorrow")).length;
  const activeCount = tasks.filter((task) => task.active).length;
  const totalWeeklyHours = tasks.filter((task) => task.active).reduce((sum, task) => {
    const multiplier: Record<Frequency, number> = { Daily: 5, Weekly: 1, "Bi-weekly": 0.5, Monthly: 0.25 };
    return sum + task.estimate * multiplier[task.frequency];
  }, 0);

  const grouped = useMemo<Record<Frequency, RecurringTaskItem[]>>(
    () =>
      filtered.reduce<Record<Frequency, RecurringTaskItem[]>>(
        (accumulator, task) => {
          accumulator[task.frequency].push(task);
          return accumulator;
        },
        { Daily: [], Weekly: [], "Bi-weekly": [], Monthly: [] } as Record<Frequency, RecurringTaskItem[]>
      ),
    [filtered]
  );
  const freqOrder: Frequency[] = ["Daily", "Weekly", "Bi-weekly", "Monthly"];

  return (
    <section className={cx("page", isActive && "pageActive")} id="page-recurring-tasks">
      <style>{`
        input, select, textarea { outline: none; font-family: 'DM Mono', monospace; }
        input:focus, select:focus { border-color: color-mix(in srgb, var(--accent) 30%, transparent) !important; }
        .rt-filter-btn { transition: all 0.12s ease; cursor: pointer; border: none; font-family: 'DM Mono', monospace; }
        .rt-task-row { transition: all 0.12s ease; }
        .rt-task-row:hover .rt-task-hover-actions { opacity: 1 !important; }
        .rt-done-btn { transition: all 0.15s ease; cursor: pointer; font-family: 'DM Mono', monospace; }
        .rt-done-btn:hover { background: color-mix(in srgb, var(--accent) 15%, transparent) !important; border-color: color-mix(in srgb, var(--accent) 40%, transparent) !important; color: var(--accent) !important; }
        .rt-toggle-btn { transition: all 0.15s ease; cursor: pointer; }
        .rt-toggle-btn:hover { opacity: 0.75; }
        .rt-add-main-btn { transition: all 0.15s ease; cursor: pointer; font-family: 'DM Mono', monospace; }
        .rt-add-main-btn:hover { background: #a8d420 !important; }
        .rt-save-btn { transition: all 0.15s ease; cursor: pointer; font-family: 'DM Mono', monospace; }
        .rt-save-btn:hover:not(:disabled) { background: #a8d420 !important; }
        .rt-save-btn:disabled { opacity: 0.35; cursor: not-allowed; }
      `}</style>

      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
              Staff Dashboard / Planning
            </div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              Recurring Tasks
            </h1>
          </div>
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
            {[
              { label: "Active", value: activeCount, color: "#a0a0b0" },
              { label: "Due soon", value: dueSoon, color: dueSoon > 0 ? "#f5c518" : "var(--muted2)" },
              { label: "Weekly overhead", value: `${Math.round(totalWeeklyHours * 10) / 10}h`, color: "#a0a0b0" }
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>{stat.label}</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: stat.color }}>{stat.value}</div>
              </div>
            ))}
            <button
              className="rt-add-main-btn"
              onClick={() => setAdding((value) => !value)}
              style={{ padding: "10px 18px", background: "var(--accent)", color: "#050508", border: "none", borderRadius: 3, fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", marginLeft: 8 }}
            >
              + New task
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {[
            { key: "all" as const, label: "All" },
            { key: "active" as const, label: "Active" },
            { key: "paused" as const, label: "Paused" }
          ].map((item) => (
            <button
              key={item.key}
              className="rt-filter-btn"
              onClick={() => setFilter(item.key)}
              style={{ padding: "5px 12px", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", borderRadius: 2, background: filter === item.key ? "rgba(255,255,255,0.08)" : "transparent", color: filter === item.key ? "var(--text)" : "var(--muted2)" }}
            >
              {item.label}
            </button>
          ))}
          <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.08)" }} />
          {(["all", ...frequencies] as Array<"all" | Frequency>).map((frequency) => (
            <button
              key={frequency}
              className="rt-filter-btn"
              onClick={() => setFreqFilter(frequency)}
              style={{ padding: "5px 12px", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", borderRadius: 2, background: freqFilter === frequency ? frequency === "all" ? "rgba(255,255,255,0.08)" : `${freqColors[frequency]}15` : "transparent", color: freqFilter === frequency ? frequency === "all" ? "var(--text)" : freqColors[frequency] : "var(--muted2)", border: freqFilter === frequency && frequency !== "all" ? `1px solid ${freqColors[frequency]}30` : "1px solid transparent" }}
            >
              {frequency === "all" ? "All frequency" : frequency}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: adding ? "1fr 340px" : "1fr", minHeight: "calc(100vh - 165px)" }}>
        <div style={{ padding: "24px 32px", borderRight: adding ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
          {freqOrder.map((frequency) => {
            const items = [...grouped[frequency]].sort((a, b) => Number(b.active) - Number(a.active));
            if (items.length === 0) return null;
            const frequencyColor = freqColors[frequency];
            return (
              <div key={frequency} style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: frequencyColor }} />
                  <span style={{ fontSize: 10, color: frequencyColor, letterSpacing: "0.12em", textTransform: "uppercase" }}>{frequency}</span>
                  <div style={{ flex: 1, height: 1, background: `${frequencyColor}20` }} />
                  <span style={{ fontSize: 10, color: "var(--muted2)" }}>{items.length} task{items.length > 1 ? "s" : ""}</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {items.map((task) => {
                    const client = clients.find((candidate) => candidate.id === task.clientId);
                    const isDone = markingDone === task.id;
                    const isDueToday = task.nextDue === "Today";
                    return (
                      <div
                        key={task.id}
                        className="rt-task-row"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          padding: "13px 16px",
                          border: `1px solid ${isDueToday && task.active ? "rgba(245,197,24,0.2)" : "rgba(255,255,255,0.05)"}`,
                          borderLeft: `3px solid ${task.active ? frequencyColor : "rgba(255,255,255,0.1)"}`,
                          borderRadius: "0 4px 4px 0",
                          background: task.active ? "rgba(255,255,255,0.01)" : "rgba(255,255,255,0.005)",
                          opacity: task.active ? 1 : 0.45
                        }}
                      >
                        <button
                          className="rt-done-btn"
                          onClick={() => markDone(task.id)}
                          style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, border: `1.5px solid ${isDone ? "var(--accent)" : "rgba(255,255,255,0.15)"}`, background: isDone ? "color-mix(in srgb, var(--accent) 15%, transparent)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "var(--accent)" }}
                        >
                          {isDone ? "✓" : ""}
                        </button>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 13, color: "var(--text)" }}>{task.title}</span>
                            {isDueToday && task.active ? <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 2, background: "rgba(245,197,24,0.12)", color: "#f5c518", letterSpacing: "0.08em", textTransform: "uppercase" }}>Due today</span> : null}
                          </div>
                          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <span style={{ fontSize: 10, color: client?.color }}>{client?.name}</span>
                            <span style={{ fontSize: 10, color: catColors[task.category] }}>{task.category}</span>
                            {task.dayOfWeek ? <span style={{ fontSize: 10, color: "var(--muted2)" }}>{task.dayOfWeek}s</span> : null}
                            <span style={{ fontSize: 10, color: "var(--muted2)" }}>{task.estimate}h</span>
                          </div>
                        </div>

                        <StreakBadge streak={task.streak} />

                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 10, color: isDueToday ? "#f5c518" : "var(--muted2)" }}>Next: {task.nextDue}</div>
                          <div style={{ fontSize: 10, color: "#333344", marginTop: 2 }}>Done {task.totalDone}x</div>
                        </div>

                        <div className="rt-task-hover-actions" style={{ display: "flex", gap: 6, opacity: 0, transition: "opacity 0.12s", flexShrink: 0 }}>
                          <button
                            className="rt-toggle-btn"
                            onClick={() => toggleActive(task.id)}
                            style={{ fontSize: 10, padding: "4px 8px", borderRadius: 2, background: task.active ? "rgba(255,255,255,0.06)" : "color-mix(in srgb, var(--accent) 8%, transparent)", border: "none", color: task.active ? "var(--muted2)" : "var(--accent)", cursor: "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.06em" }}
                          >
                            {task.active ? "Pause" : "Resume"}
                          </button>
                          <button onClick={() => deleteTask(task.id)} style={{ fontSize: 13, background: "none", border: "none", color: "#333344", cursor: "pointer", padding: "0 4px" }}>
                            ×
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {adding ? (
          <div style={{ padding: "24px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: "#fff" }}>New Recurring Task</div>

            <div>
              <label style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Task title</label>
              <input
                value={draft.title}
                onChange={(event) => setDraft((previous) => ({ ...previous, title: event.target.value }))}
                placeholder="e.g. Send weekly retainer report"
                style={{ width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--text)", fontSize: 12 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Project / Client</label>
              <select
                value={draft.clientId}
                onChange={(event) => setDraft((previous) => ({ ...previous, clientId: event.target.value }))}
                style={{ width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--text)", fontSize: 12 }}
              >
                {clients.map((client) => (
                  <option key={client.id} value={String(client.id)}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Frequency</label>
                <select
                  value={draft.frequency}
                  onChange={(event) => setDraft((previous) => ({ ...previous, frequency: event.target.value as Frequency }))}
                  style={{ width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--text)", fontSize: 12 }}
                >
                  {frequencies.map((frequency) => (
                    <option key={frequency} value={frequency}>
                      {frequency}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Day</label>
                <select
                  value={draft.dayOfWeek ?? ""}
                  onChange={(event) => setDraft((previous) => ({ ...previous, dayOfWeek: (event.target.value || null) as Weekday | null }))}
                  style={{ width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--text)", fontSize: 12 }}
                >
                  <option value="">Any day</option>
                  {days.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Category</label>
                <select
                  value={draft.category}
                  onChange={(event) => setDraft((previous) => ({ ...previous, category: event.target.value as Category }))}
                  style={{ width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--text)", fontSize: 12 }}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Est. hours</label>
                <input
                  type="number"
                  min="0.1"
                  max="8"
                  step="0.25"
                  value={draft.estimate}
                  onChange={(event) => setDraft((previous) => ({ ...previous, estimate: event.target.value }))}
                  style={{ width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--text)", fontSize: 12 }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                className="rt-save-btn"
                disabled={!draft.title.trim()}
                onClick={addTask}
                style={{ padding: "11px 24px", background: "var(--accent)", color: "#050508", border: "none", borderRadius: 3, fontSize: 12, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}
              >
                Create task
              </button>
              <button
                onClick={() => setAdding(false)}
                style={{ padding: "11px 16px", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--muted2)", fontSize: 11, cursor: "pointer", fontFamily: "'DM Mono', monospace" }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

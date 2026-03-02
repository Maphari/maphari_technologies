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
  { id: 2, name: "Kestrel Capital", avatar: "KC", color: "var(--purple)" },
  { id: 3, name: "Mira Health", avatar: "MH", color: "var(--blue)" },
  { id: 4, name: "Dune Collective", avatar: "DC", color: "var(--amber)" },
  { id: 5, name: "Okafor & Sons", avatar: "OS", color: "var(--amber)" },
  { id: 0, name: "Internal", avatar: "IN", color: "var(--muted)" }
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

function frequencyToneClass(frequency: Frequency) {
  if (frequency === "Daily") return "rtFreqDaily";
  if (frequency === "Weekly") return "rtFreqWeekly";
  if (frequency === "Bi-weekly") return "rtFreqBiWeekly";
  return "rtFreqMonthly";
}

function categoryToneClass(category: Category) {
  if (category === "Admin") return "rtCatAdmin";
  if (category === "Comms") return "rtCatComms";
  if (category === "Design") return "rtCatDesign";
  if (category === "Finance") return "rtCatFinance";
  if (category === "Strategy") return "rtCatStrategy";
  return "rtCatReporting";
}

function clientToneClass(clientId?: number) {
  if (clientId === 1) return "rtClientOne";
  if (clientId === 2) return "rtClientTwo";
  if (clientId === 3) return "rtClientThree";
  if (clientId === 4) return "rtClientFour";
  if (clientId === 5) return "rtClientFive";
  return "rtClientInternal";
}

function StreakBadge({ streak }: { streak: number }) {
  if (streak === 0) return <span className={cx("text10", "colorMuted2")}>No streak</span>;
  const tone = streak >= 10 ? "rtStreakHot" : streak >= 5 ? "rtStreakWarm" : "rtStreakMild";
  return (
    <div className={cx("flexRow", "gap4")}>
      <span className={cx("rtStreakDot", tone)}>◆</span>
      <span className={cx("rtStreakValue", tone)}>{streak}</span>
      <span className={cx("text10", "colorMuted2")}>streak</span>
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
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-recurring-tasks">
      <div className={cx("pageHeaderBar", "rtHeaderBar")}>
        <div className={cx("flexBetween", "mb20", "rtHeaderTop")}>
          <div>
            <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Planning</div>
            <h1 className={cx("pageTitleText")}>Recurring Tasks</h1>
          </div>
          <div className={cx("flexRow", "gap20", "rtHeaderActions")}>
            {[
              { label: "Active", value: activeCount, valueClass: "colorMuted" },
              { label: "Due soon", value: dueSoon, valueClass: dueSoon > 0 ? "colorAmber" : "colorMuted2" },
              { label: "Weekly overhead", value: `${Math.round(totalWeeklyHours * 10) / 10}h`, valueClass: "colorMuted" }
            ].map((stat) => (
              <div key={stat.label} className={cx("textRight")}>
                <div className={cx("statLabelNew")}>{stat.label}</div>
                <div className={cx("statValueNew", stat.valueClass)}>{stat.value}</div>
              </div>
            ))}
            <button type="button" className={cx("rtAddMainBtn", "rtPrimaryBtn", "uppercase", "tracking")} onClick={() => setAdding((value) => !value)}>
              + New task
            </button>
          </div>
        </div>

        <div className={cx("filterRow")}>
          <select
            className={cx("filterSelect")}
            aria-label="Filter recurring tasks by status"
            value={filter}
            onChange={(event) => setFilter(event.target.value as "all" | "active" | "paused")}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>
          <select
            className={cx("filterSelect")}
            aria-label="Filter recurring tasks by frequency"
            value={freqFilter}
            onChange={(event) => setFreqFilter(event.target.value as "all" | Frequency)}
          >
            <option value="all">All frequency</option>
            {frequencies.map((frequency) => (
              <option key={frequency} value={frequency}>
                {frequency}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={cx("rtLayout", adding && "rtLayoutWithForm")}>
        <div className={cx("rtListPane", adding && "rtListPaneWithForm")}>
          {freqOrder.map((frequency) => {
            const items = [...grouped[frequency]].sort((a, b) => Number(b.active) - Number(a.active));
            if (items.length === 0) return null;
            const freqTone = frequencyToneClass(frequency);
            return (
              <div key={frequency} className={cx("rtFreqGroup")}>
                <div className={cx("rtFreqHeader")}>
                  <div className={cx("rtFreqDot", freqTone)} />
                  <span className={cx("text10", "uppercase", "rtFreqLabel", freqTone)}>{frequency}</span>
                  <div className={cx("rtFreqLine", freqTone)} />
                  <span className={cx("text10", "colorMuted2")}>
                    {items.length} task{items.length > 1 ? "s" : ""}
                  </span>
                </div>

                <div className={cx("flexCol", "gap6")}>
                  {items.map((task) => {
                    const client = clients.find((candidate) => candidate.id === task.clientId);
                    const isDone = markingDone === task.id;
                    const isDueToday = task.nextDue === "Today";
                    return (
                      <div
                        key={task.id}
                        className={cx(
                          "rtTaskRow",
                          "rtTaskCard",
                          frequencyToneClass(task.frequency),
                          !task.active && "rtTaskPaused",
                          isDueToday && task.active && "rtTaskDueSoon"
                        )}
                      >
                        <button type="button" className={cx("rtDoneBtn", "rtDoneCircle", isDone && "rtDoneCircleActive")} onClick={() => markDone(task.id)}>
                          {isDone ? "✓" : ""}
                        </button>

                        <div className={cx("flex1", "minW0")}>
                          <div className={cx("flexRow", "gap8", "mb4")}>
                            <span className={cx("text13", "colorText")}>{task.title}</span>
                            {isDueToday && task.active ? <span className={cx("rtDueBadge")}>Due today</span> : null}
                          </div>
                          <div className={cx("flexRow", "gap10")}>
                            <span className={cx("text10", clientToneClass(client?.id))}>{client?.name}</span>
                            <span className={cx("text10", categoryToneClass(task.category))}>{task.category}</span>
                            {task.dayOfWeek ? <span className={cx("text10", "colorMuted2")}>{task.dayOfWeek}s</span> : null}
                            <span className={cx("text10", "colorMuted2")}>{task.estimate}h</span>
                          </div>
                        </div>

                        <StreakBadge streak={task.streak} />

                        <div className={cx("textRight", "noShrink")}>
                          <div className={cx("text10", isDueToday ? "rtDueSoonText" : "colorMuted2")}>Next: {task.nextDue}</div>
                          <div className={cx("text10", "mt4", "colorMuted2")}>Done {task.totalDone}x</div>
                        </div>

                        <div className={cx("rtTaskHoverActions", "flexRow", "gap6", "noShrink")}>
                          <button
                            type="button"
                            className={cx("rtToggleBtn", "rtTogglePill", "text10", "tracking", task.active ? "rtTogglePause" : "rtToggleResume")}
                            onClick={() => toggleActive(task.id)}
                          >
                            {task.active ? "Pause" : "Resume"}
                          </button>
                          <button type="button" className={cx("rtDeleteBtn")} onClick={() => deleteTask(task.id)}>
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
          <div className={cx("rtFormPane", "flexCol", "gap16")}>
            <div className={cx("rtFormTitle")}>New Recurring Task</div>

            <div>
              <label className={cx("rtFormLabel")}>Task title</label>
              <input
                value={draft.title}
                onChange={(event) => setDraft((previous) => ({ ...previous, title: event.target.value }))}
                placeholder="e.g. Send weekly retainer report"
                className={cx("rtFormInput")}
              />
            </div>

            <div>
              <label className={cx("rtFormLabel")}>Project / Client</label>
              <select
                aria-label="Recurring task client"
                value={draft.clientId}
                onChange={(event) => setDraft((previous) => ({ ...previous, clientId: event.target.value }))}
                className={cx("rtFormSelect")}
              >
                {clients.map((client) => (
                  <option key={client.id} value={String(client.id)}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={cx("formGrid2", "gap12")}>
              <div>
                <label className={cx("rtFormLabel")}>Frequency</label>
                <select
                  aria-label="Recurring task frequency"
                  value={draft.frequency}
                  onChange={(event) => setDraft((previous) => ({ ...previous, frequency: event.target.value as Frequency }))}
                  className={cx("rtFormSelect")}
                >
                  {frequencies.map((frequency) => (
                    <option key={frequency} value={frequency}>
                      {frequency}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={cx("rtFormLabel")}>Day</label>
                <select
                  aria-label="Recurring task day"
                  value={draft.dayOfWeek ?? ""}
                  onChange={(event) => setDraft((previous) => ({ ...previous, dayOfWeek: (event.target.value || null) as Weekday | null }))}
                  className={cx("rtFormSelect")}
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

            <div className={cx("formGrid2", "gap12")}>
              <div>
                <label className={cx("rtFormLabel")}>Category</label>
                <select
                  aria-label="Recurring task category"
                  value={draft.category}
                  onChange={(event) => setDraft((previous) => ({ ...previous, category: event.target.value as Category }))}
                  className={cx("rtFormSelect")}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={cx("rtFormLabel")}>Est. hours</label>
                <input
                  type="number"
                  min="0.1"
                  max="8"
                  step="0.25"
                  value={draft.estimate}
                  onChange={(event) => setDraft((previous) => ({ ...previous, estimate: event.target.value }))}
                  className={cx("rtFormInput")}
                />
              </div>
            </div>

            <div className={cx("flexRow", "gap10", "mt4")}>
              <button type="button" className={cx("rtSaveBtn", "rtPrimaryBtnSm", "uppercase", "tracking")} disabled={!draft.title.trim()} onClick={addTask}>
                Create task
              </button>
              <button type="button" className={cx("rtFilterBtn", "rtCancelBtn")} onClick={() => setAdding(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

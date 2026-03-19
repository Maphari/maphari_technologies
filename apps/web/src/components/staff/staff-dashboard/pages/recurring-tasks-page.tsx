"use client";

// ════════════════════════════════════════════════════════════════════════════
// recurring-tasks-page.tsx — Staff recurring task manager (live API)
// Reads from GET /recurring-tasks, writes via POST/PATCH/DELETE.
// ════════════════════════════════════════════════════════════════════════════

import { useEffect, useMemo, useState } from "react";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { getStaffClients } from "../../../../lib/api/staff/clients";
import {
  getRecurringTasks,
  createRecurringTask,
  updateRecurringTask,
  deleteRecurringTask,
  type RecurringTask
} from "../../../../lib/api/staff";
import { cx } from "../style";

// ── Local UI types ─────────────────────────────────────────────────────────
type ClientRow = { id: string; name: string; avatar: string; color: string };
type Frequency = "Daily" | "Weekly" | "Bi-weekly" | "Monthly";
type Weekday = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";
type Category = "Admin" | "Comms" | "Design" | "Finance" | "Strategy" | "Reporting";

type RecurringTaskItem = {
  id: string;
  clientId: string | null;
  title: string;
  frequency: Frequency;
  dayOfWeek: string | null;
  estimate: number;
  category: Category;
  active: boolean;
  lastDone: string;
  nextDue: string;
  streak: number;
  totalDone: number;
};

// ── Constants ──────────────────────────────────────────────────────────────
const FALLBACK_CLIENTS: ClientRow[] = [
  { id: "internal", name: "Internal", avatar: "IN", color: "var(--muted)" }
];
const INTERNAL_CLIENT: ClientRow = { id: "internal", name: "Internal", avatar: "IN", color: "var(--muted)" };
const frequencies: Frequency[] = ["Daily", "Weekly", "Bi-weekly", "Monthly"];
const days: Weekday[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const categories: Category[] = ["Admin", "Comms", "Design", "Finance", "Strategy", "Reporting"];

// ── Helpers ────────────────────────────────────────────────────────────────
function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.round((d.getTime() - now.setHours(0, 0, 0, 0)) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function apiToUi(task: RecurringTask): RecurringTaskItem {
  return {
    id:         task.id,
    clientId:   task.clientId,
    title:      task.title,
    frequency:  task.frequency as Frequency,
    dayOfWeek:  task.dayOfWeek,
    estimate:   task.estimateHours,
    category:   task.category as Category,
    active:     task.isActive,
    lastDone:   formatDate(task.lastDoneAt),
    nextDue:    formatDate(task.nextDueAt),
    streak:     task.streak,
    totalDone:  task.totalDone
  };
}

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

function clientToneClass(index: number) {
  const tones = ["rtClientOne", "rtClientTwo", "rtClientThree", "rtClientFour", "rtClientFive", "rtClientInternal"];
  return tones[index] ?? "rtClientInternal";
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

// ── Component ──────────────────────────────────────────────────────────────
export function RecurringTasksPage({
  isActive,
  session,
  onNotify
}: {
  isActive: boolean;
  session: AuthSession | null;
  onNotify?: (tone: "success" | "error", message: string) => void;
}) {
  const [tasks, setTasks] = useState<RecurringTaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiClients, setApiClients] = useState<ClientRow[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "paused">("all");
  const [freqFilter, setFreqFilter] = useState<"all" | Frequency>("all");
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({
    clientId: "internal",
    title: "",
    frequency: "Weekly" as Frequency,
    dayOfWeek: "Mon" as Weekday | null,
    estimate: "0.5",
    category: "Admin" as Category
  });
  const [markingDone, setMarkingDone] = useState<string | null>(null);

  // ── Load tasks on mount ──────────────────────────────────────────────────
  useEffect(() => {
    if (!session) { setLoading(false); return; }
    void (async () => {
      const r = await getRecurringTasks(session);
      if (r.nextSession) saveSession(r.nextSession);
      setTasks((r.data ?? []).map(apiToUi));
      setLoading(false);
    })();
  }, [session]);

  // ── Load clients for the form ────────────────────────────────────────────
  useEffect(() => {
    if (!session) return;
    void getStaffClients(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.data && r.data.length > 0) {
        const colors = ["var(--accent)", "var(--purple)", "var(--blue)", "var(--amber)", "var(--amber)"];
        setApiClients(r.data.slice(0, 5).map((c, i) => ({
          id: c.id,
          name: c.name,
          avatar: c.name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase(),
          color: colors[i] ?? "var(--muted)"
        })));
      }
    });
  }, [session]);

  const clientsToUse: ClientRow[] = apiClients.length > 0
    ? [...apiClients, INTERNAL_CLIENT]
    : FALLBACK_CLIENTS;

  // ── Actions ───────────────────────────────────────────────────────────────
  const toggleActive = async (id: string) => {
    if (!session) return;
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const r = await updateRecurringTask(session, id, { isActive: !task.active });
    if (r.nextSession) saveSession(r.nextSession);
    if (r.data) {
      setTasks((prev) => prev.map((t) => t.id === id ? { ...t, active: !t.active } : t));
    } else if (r.error) {
      onNotify?.("error", r.error.message);
    }
  };

  const markDone = async (id: string) => {
    if (!session) return;
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const r = await updateRecurringTask(session, id, {
      lastDoneAt: new Date().toISOString(),
      totalDone: task.totalDone + 1,
      streak: task.streak + 1
    });
    if (r.nextSession) saveSession(r.nextSession);
    if (r.data) {
      setTasks((prev) => prev.map((t) =>
        t.id === id ? { ...t, lastDone: "Today", streak: t.streak + 1, totalDone: t.totalDone + 1 } : t
      ));
      setMarkingDone(id);
      window.setTimeout(() => setMarkingDone(null), 1000);
    } else if (r.error) {
      onNotify?.("error", r.error.message);
    }
  };

  const addTask = async () => {
    if (!session || !draft.title.trim()) return;
    const clientId = draft.clientId === "internal" ? null : draft.clientId;
    const r = await createRecurringTask(session, {
      title: draft.title.trim(),
      clientId,
      frequency: draft.frequency,
      dayOfWeek: draft.dayOfWeek,
      estimateHours: Number.parseFloat(draft.estimate) || 0.5,
      category: draft.category
    });
    if (r.nextSession) saveSession(r.nextSession);
    if (r.data) {
      setTasks((prev) => [apiToUi(r.data!), ...prev]);
      setAdding(false);
      setDraft({ clientId: "internal", title: "", frequency: "Weekly", dayOfWeek: "Mon", estimate: "0.5", category: "Admin" });
    } else if (r.error) {
      onNotify?.("error", r.error.message);
    }
  };

  const doDeleteTask = async (id: string) => {
    if (!session) return;
    const r = await deleteRecurringTask(session, id);
    if (r.nextSession) saveSession(r.nextSession);
    if (r.data) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } else if (r.error) {
      onNotify?.("error", r.error.message);
    }
  };

  // ── Derived values ────────────────────────────────────────────────────────
  const filtered = tasks
    .filter((t) => filter === "all" ? true : filter === "active" ? t.active : !t.active)
    .filter((t) => freqFilter === "all" || t.frequency === freqFilter);

  const dueSoon = tasks.filter((t) => t.active && (t.nextDue === "Today" || t.nextDue === "Tomorrow")).length;
  const activeCount = tasks.filter((t) => t.active).length;
  const totalWeeklyHours = tasks.filter((t) => t.active).reduce((sum, t) => {
    const m: Record<Frequency, number> = { Daily: 5, Weekly: 1, "Bi-weekly": 0.5, Monthly: 0.25 };
    return sum + t.estimate * m[t.frequency];
  }, 0);

  const freqOrder: Frequency[] = ["Daily", "Weekly", "Bi-weekly", "Monthly"];
  const grouped = useMemo<Record<Frequency, RecurringTaskItem[]>>(
    () => filtered.reduce<Record<Frequency, RecurringTaskItem[]>>(
      (acc, t) => { acc[t.frequency].push(t); return acc; },
      { Daily: [], Weekly: [], "Bi-weekly": [], Monthly: [] }
    ),
    [filtered]
  );

  if (loading) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </div>
    );
  }

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
            <button type="button" className={cx("rtAddMainBtn", "rtPrimaryBtn", "uppercase", "tracking")} onClick={() => setAdding((v) => !v)}>
              + New task
            </button>
          </div>
        </div>

        <div className={cx("filterRow")}>
          <select className={cx("filterSelect")} aria-label="Filter recurring tasks by status" value={filter} onChange={(e) => setFilter(e.target.value as "all" | "active" | "paused")}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>
          <select className={cx("filterSelect")} aria-label="Filter recurring tasks by frequency" value={freqFilter} onChange={(e) => setFreqFilter(e.target.value as "all" | Frequency)}>
            <option value="all">All frequency</option>
            {frequencies.map((f) => <option key={f} value={f}>{f}</option>)}
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
                  <span className={cx("text10", "colorMuted2")}>{items.length} task{items.length > 1 ? "s" : ""}</span>
                </div>
                <div className={cx("flexCol", "gap6")}>
                  {items.map((task) => {
                    const clientIndex = clientsToUse.findIndex((c) => c.id === task.clientId);
                    const client = clientsToUse[clientIndex] ?? INTERNAL_CLIENT;
                    const isDone = markingDone === task.id;
                    const isDueToday = task.nextDue === "Today";
                    return (
                      <div key={task.id} className={cx("rtTaskRow", "rtTaskCard", frequencyToneClass(task.frequency), !task.active && "rtTaskPaused", isDueToday && task.active && "rtTaskDueSoon")}>
                        <button type="button" className={cx("rtDoneBtn", "rtDoneCircle", isDone && "rtDoneCircleActive")} onClick={() => void markDone(task.id)}>
                          {isDone ? "✓" : ""}
                        </button>
                        <div className={cx("flex1", "minW0")}>
                          <div className={cx("flexRow", "gap8", "mb4")}>
                            <span className={cx("text13", "colorText")}>{task.title}</span>
                            {isDueToday && task.active ? <span className={cx("rtDueBadge")}>Due today</span> : null}
                          </div>
                          <div className={cx("flexRow", "gap10")}>
                            <span className={cx("text10", clientToneClass(clientIndex))}>{client.name}</span>
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
                          <button type="button" className={cx("rtToggleBtn", "rtTogglePill", "text10", "tracking", task.active ? "rtTogglePause" : "rtToggleResume")} onClick={() => void toggleActive(task.id)}>
                            {task.active ? "Pause" : "Resume"}
                          </button>
                          <button type="button" className={cx("rtDeleteBtn")} onClick={() => void doDeleteTask(task.id)}>×</button>
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
              <input value={draft.title} onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Send weekly retainer report" className={cx("rtFormInput")} />
            </div>
            <div>
              <label className={cx("rtFormLabel")}>Project / Client</label>
              <select aria-label="Recurring task client" value={draft.clientId} onChange={(e) => setDraft((p) => ({ ...p, clientId: e.target.value }))} className={cx("rtFormSelect")}>
                {clientsToUse.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className={cx("formGrid2", "gap12")}>
              <div>
                <label className={cx("rtFormLabel")}>Frequency</label>
                <select aria-label="Recurring task frequency" value={draft.frequency} onChange={(e) => setDraft((p) => ({ ...p, frequency: e.target.value as Frequency }))} className={cx("rtFormSelect")}>
                  {frequencies.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className={cx("rtFormLabel")}>Day</label>
                <select aria-label="Recurring task day" value={draft.dayOfWeek ?? ""} onChange={(e) => setDraft((p) => ({ ...p, dayOfWeek: (e.target.value || null) as Weekday | null }))} className={cx("rtFormSelect")}>
                  <option value="">Any day</option>
                  {days.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div className={cx("formGrid2", "gap12")}>
              <div>
                <label className={cx("rtFormLabel")}>Category</label>
                <select aria-label="Recurring task category" value={draft.category} onChange={(e) => setDraft((p) => ({ ...p, category: e.target.value as Category }))} className={cx("rtFormSelect")}>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={cx("rtFormLabel")}>Est. hours</label>
                <input type="number" min="0.1" max="8" step="0.25" value={draft.estimate} onChange={(e) => setDraft((p) => ({ ...p, estimate: e.target.value }))} className={cx("rtFormInput")} />
              </div>
            </div>
            <div className={cx("flexRow", "gap10", "mt4")}>
              <button type="button" className={cx("rtSaveBtn", "rtPrimaryBtnSm", "uppercase", "tracking")} disabled={!draft.title.trim()} onClick={() => void addTask()}>
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

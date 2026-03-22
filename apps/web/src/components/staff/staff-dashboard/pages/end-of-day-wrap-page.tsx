// ════════════════════════════════════════════════════════════════════════════
// end-of-day-wrap-page.tsx — Staff End-of-Day Wrap
// Data : getMyTasks → derives suggestedTasks, completedToday, urgentItems
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { cx } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { getMyTasks, type StaffTask } from "../../../../lib/api/staff/tasks";

// ── Derived types ─────────────────────────────────────────────────────────────

type SuggestedTask = { id: string; text: string; client: string; urgent: boolean; done: boolean };
type CompletedTask = { text: string; hours: number; client: string };
type UrgentItem    = { type: "approval" | "overdue" | "invoice"; text: string };

// ── Derivation helper ─────────────────────────────────────────────────────────

function deriveFromTasks(tasks: StaffTask[]): {
  suggested: SuggestedTask[];
  completed: CompletedTask[];
  urgent:    UrgentItem[];
} {
  const todayStr = new Date().toDateString();
  const now      = new Date();

  const suggested: SuggestedTask[] = tasks
    .filter((t) => t.status !== "DONE")
    .sort((a, b) => {
      const pri: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return (pri[a.priority] ?? 2) - (pri[b.priority] ?? 2);
    })
    .map((t) => ({
      id:     t.id,
      text:   t.title,
      client: "",
      urgent: t.priority === "HIGH",
      done:   false,
    }));

  const completed: CompletedTask[] = tasks
    .filter(
      (t) =>
        t.status === "DONE" &&
        t.completedAt !== null &&
        new Date(t.completedAt).toDateString() === todayStr
    )
    .map((t) => ({
      text:   t.title,
      hours:  t.estimateMinutes ? Math.round((t.estimateMinutes / 60) * 10) / 10 : 0,
      client: "",
    }));

  const urgent: UrgentItem[] = tasks
    .filter(
      (t) =>
        t.status === "BLOCKED" ||
        (t.status !== "DONE" && t.dueAt !== null && new Date(t.dueAt) < now)
    )
    .map((t) => ({ type: "overdue" as const, text: t.title }));

  return { suggested, completed, urgent };
}

// ── Constants ─────────────────────────────────────────────────────────────────

const _now        = new Date();
const todayLabel  = _now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
const currentTime = _now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

const steps      = ["wrap_up", "top_three", "flag", "done"];
const stepLabels = ["Log your day", "Set tomorrow's top 3", "Flag anything urgent", "Done"];

// ── Component ─────────────────────────────────────────────────────────────────

export function EndOfDayWrapPage({
  isActive,
  session,
  onNotify,
}: {
  isActive: boolean;
  session: AuthSession | null;
  onNotify?: (tone: "success" | "error" | "info" | "warning", msg: string) => void;
}) {
  const [step,          setStep]          = useState(0);
  const [hoursLogged,   setHoursLogged]   = useState("");
  const [wrapNote,      setWrapNote]      = useState("");
  const [mood,          setMood]          = useState(0);
  const [tomorrowTasks, setTomorrowTasks] = useState<SuggestedTask[]>([]);
  const [customTask,    setCustomTask]    = useState("");
  const [flaggedItems,  setFlaggedItems]  = useState<number[]>([]);
  const [additionalFlag,setAdditionalFlag]= useState("");
  const [submitted,     setSubmitted]     = useState(false);
  const [submitting,    setSubmitting]    = useState(false);
  const [completedToday,setCompletedToday]= useState<CompletedTask[]>([]);
  const [urgentItems,   setUrgentItems]   = useState<UrgentItem[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);

  useEffect(() => {
    if (!session || !isActive) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    void getMyTasks(session).then((r) => {
      if (cancelled) return;
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error || !r.data) {
        setError(r.error?.message ?? "Failed to load data. Please try again.");
        return;
      }
      const { suggested, completed, urgent } = deriveFromTasks(r.data);
      setTomorrowTasks(suggested.slice(0, 3));
      setCompletedToday(completed);
      setUrgentItems(urgent);
      setError(null);
    }).catch((err) => {
      if (!cancelled) setError(err?.message ?? "Failed to load");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [session?.accessToken, isActive]);

  const moodEmojis = ["", "😔", "😐", "🙂", "😄", "🔥"];
  const moodLabels = ["", "Rough", "Slow", "Okay", "Good", "Fired up"];

  const totalHoursToday = completedToday.reduce((sum, task) => sum + task.hours, 0);
  const canProceed      = step === 0 ? hoursLogged !== "" && mood > 0 : true;

  const toggleFlag = (index: number) =>
    setFlaggedItems((previous) =>
      previous.includes(index) ? previous.filter((item) => item !== index) : [...previous, index]
    );

  const addCustomTask = () => {
    if (!customTask.trim() || tomorrowTasks.length >= 5) return;
    setTomorrowTasks((previous) => [
      ...previous,
      { id: String(Date.now()), text: customTask.trim(), client: "", urgent: false, done: false },
    ]);
    setCustomTask("");
  };

  const removeTask = (id: string) =>
    setTomorrowTasks((previous) => previous.filter((task) => task.id !== id));

  async function handleWrapSubmit() {
    setSubmitting(true);
    const dateKey = new Date().toISOString().split("T")[0];
    const wrapData = {
      date:          dateKey,
      hoursLogged,
      wrapNote,
      mood,
      tomorrowTasks: tomorrowTasks.map((t) => ({ id: t.id, text: t.text, urgent: t.urgent })),
      flaggedItems:  flaggedItems.map((index) => urgentItems[index]?.text ?? String(index)),
      additionalFlag,
      submittedAt:   new Date().toISOString(),
    };
    // TODO: wire to /staff/eod-wrap API when endpoint is available
    try {
      localStorage.setItem(`eod:${dateKey}`, JSON.stringify(wrapData));
      setSubmitted(true);
      onNotify?.("success", "Day wrapped successfully!");
    } catch {
      onNotify?.("error", "Failed to save wrap data. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-eod-wrap">
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-eod-wrap">
        <div className={cx("errorState")}>
          <div className={cx("errorStateIcon")}>✕</div>
          <div className={cx("errorStateTitle")}>Failed to load</div>
          <div className={cx("errorStateSub")}>{error}</div>
        </div>
      </section>
    );
  }

  if (submitted) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-eod-wrap-complete">
        <div className={cx("flexCenter", "flexCol", "gap20", "edwDoneWrap")}>
          <div className={cx("edwDoneIcon")}>◎</div>
          <div className={cx("edwDoneTitle")}>Day wrapped.</div>
          <div className={cx("text13", "colorMuted2", "textCenter", "edwDoneMeta")}>
            {parseFloat(hoursLogged || String(totalHoursToday)).toFixed(1)}h logged · {tomorrowTasks.length} tasks queued for tomorrow ·{" "}
            {flaggedItems.length + (additionalFlag.trim() ? 1 : 0)} items flagged
          </div>
          <div className={cx("text12", "colorAccent", "mt8", "edwDoneChip")}>See you tomorrow.</div>
        </div>
      </section>
    );
  }

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-eod-wrap">
      <div className={cx("pageHeaderBar", "flexBetween", "borderB", "edwHeaderBar")}>
        <div>
          <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Daily Rhythm</div>
          <h1 className={cx("pageTitleText")}>End-of-day Wrap</h1>
          <div className={cx("text12", "colorMuted2", "mt6")}>{todayLabel} · {currentTime}</div>
        </div>

        <div className={cx("flexRow")}>
          {steps.map((item, index) => (
            <div key={item} className={cx("flexRow")}>
              <button
                type="button"
                className={cx(
                  "stepDot",
                  index < step ? "edwStepDotDone" : index === step ? "edwStepDotCurrent" : "edwStepDotIdle",
                  index < step && "edwStepDotClickable"
                )}
                onClick={() => { if (index < step) setStep(index); }}
                disabled={index >= step}
              >
                {index < step ? "✓" : index + 1}
              </button>
              {index < steps.length - 1 ? (
                <div className={cx("stepDotConnector", index < step ? "edwStepConnectorDone" : "edwStepConnectorIdle")} />
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className={cx("edwLayout")}>
        <div className={cx("edwMainPane")}>
          <div className={cx("sectionLabel", "mb6")}>Step {step + 1} of {steps.length}</div>
          <div className={cx("fontDisplay", "fw800", "colorText", "mb28", "edwStepTitle")}>{stepLabels[step]}</div>

          {/* ── Step 0: Log your day ── */}
          {step === 0 ? (
            <div className={cx("flexCol", "gap24", "edwBlockWidth")}>
              <div>
                <div className={cx("sectionLabel", "mb10")}>Hours logged today</div>
                <div className={cx("flexRow", "gap10", "flexWrap", "mb10")}>
                  {[6, 6.5, 7, 7.5, 8, 8.5, 9].map((hour) => (
                    <button
                      key={hour}
                      type="button"
                      onClick={() => setHoursLogged(String(hour))}
                      className={cx("fontMono", "text13", "edwHourBtn", hoursLogged === String(hour) && "edwHourBtnActive")}
                    >
                      {hour}h
                    </button>
                  ))}
                  <input
                    type="number"
                    min="0"
                    max="16"
                    step="0.5"
                    value={hoursLogged}
                    onChange={(event) => setHoursLogged(event.target.value)}
                    placeholder="Custom"
                    className={cx("inputBase", "text12", "edwHourInput")}
                  />
                </div>
                <div className={cx("text10", "colorMuted2")}>
                  Time-tracked today: {totalHoursToday}h across {completedToday.length} tasks
                </div>
              </div>

              <div className={cx("staffCard")}>
                <div className={cx("staffSectionHd")}>
                  <span className={cx("staffSectionTitle")}>Quick Reflection</span>
                  <span className={cx("edwOptionalText")}>Optional</span>
                </div>
                <textarea
                  value={wrapNote}
                  onChange={(event) => setWrapNote(event.target.value)}
                  placeholder="Anything worth noting about today? Wins, frustrations, things to remember..."
                  className={cx("staffInput", "wFull", "text12", "edwTextareaSm")}
                />
                <div className={cx("staffCharCount")}>{wrapNote.length} / 600</div>
              </div>

              <div>
                <div className={cx("sectionLabel", "mb14")}>How did today feel?</div>
                <div className={cx("flexRow", "gap12")}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={cx("edwMoodBtn", "edwMoodCard", mood === value && "edwMoodCardActive")}
                      data-mood={String(value)}
                      onClick={() => setMood(value)}
                    >
                      <span className={cx("edwMoodEmoji")}>{moodEmojis[value]}</span>
                      <span
                        className={cx("tracking", "edwMoodLabel", mood === value && "edwMoodLabelActive")}
                        data-mood={String(value)}
                      >
                        {moodLabels[value]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {/* ── Step 1: Set tomorrow's top 3 ── */}
          {step === 1 ? (
            <div className={cx("edwBlockWide")}>
              <div className={cx("text12", "colorMuted2", "mb20", "edwLeadText")}>
                These are pulled from your open tasks and overdue items. Edit, reorder, or add your own.
              </div>

              <div className={cx("flexCol", "gap8", "mb16")}>
                {tomorrowTasks.map((task, index) => (
                  <div key={task.id} className={cx("edwTaskItem", "edwTaskRow")}>
                    <div className={cx("flexCenter", "noShrink", "fontDisplay", "fw700", "text11", "colorMuted2", "edwTaskOrder")}>
                      {index + 1}
                    </div>
                    <div className={cx("flex1")}>
                      <div className={cx("text12", "colorText", "edwTaskText")}>{task.text}</div>
                      {task.client ? <div className={cx("text10", "colorMuted2", "mt4", "edwTaskClient")}>{task.client}</div> : null}
                      {task.urgent ? <div className={cx("colorAmber", "tracking", "mt4", "edwUrgentTag")}>URGENT</div> : null}
                    </div>
                    <button
                      type="button"
                      className={cx("edwRemoveBtn", "edwRemoveBtnVisible")}
                      onClick={() => removeTask(task.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {tomorrowTasks.length < 5 ? (
                <div className={cx("flexRow", "gap8")}>
                  <input
                    value={customTask}
                    onChange={(event) => setCustomTask(event.target.value)}
                    onKeyDown={(event) => { if (event.key === "Enter") addCustomTask(); }}
                    placeholder="Add another task..."
                    className={cx("inputBase", "flex1", "text12", "edwTaskInput")}
                  />
                  <button
                    type="button"
                    onClick={addCustomTask}
                    className={cx("fontMono", "text12", "colorAccent", "edwTaskAddBtn")}
                  >
                    + Add
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* ── Step 2: Flag urgent items ── */}
          {step === 2 ? (
            <div className={cx("edwBlockWidth")}>
              <div className={cx("text12", "colorMuted2", "mb20", "edwLeadText")}>
                These items surfaced from your clients today. Flag anything that needs admin attention.
              </div>

              <div className={cx("flexCol", "gap8", "mb20")}>
                {urgentItems.map((item, index) => {
                  const isFlagged = flaggedItems.includes(index);
                  return (
                    <button
                      key={index}
                      type="button"
                      className={cx("edwFlagItem", "edwFlagRow", isFlagged && "edwFlagRowActive")}
                      onClick={() => toggleFlag(index)}
                    >
                      <div className={cx("flexCenter", "noShrink", "edwFlagCheck", isFlagged && "edwFlagCheckActive")}>
                        {isFlagged ? "✓" : ""}
                      </div>
                      <div className={cx("flex1")}>
                        <div className={cx("text12", isFlagged ? "colorText" : "colorMuted")}>{item.text}</div>
                        <div className={cx("uppercase", "mt4", "edwFlagType")} data-type={item.type}>{item.type}</div>
                      </div>
                    </button>
                  );
                })}
                {urgentItems.length === 0 ? (
                  <div className={cx("text12", "colorMuted2")}>No blocked or overdue tasks — you're on track.</div>
                ) : null}
              </div>

              <div className={cx("staffCard")}>
                <div className={cx("staffSectionHd")}>
                  <span className={cx("staffSectionTitle")}>Additional Flags</span>
                  <span className={cx("edwOptionalText")}>Optional</span>
                </div>
                <textarea
                  value={additionalFlag}
                  onChange={(event) => setAdditionalFlag(event.target.value)}
                  placeholder="Escalations, concerns, things the account manager should know..."
                  className={cx("staffInput", "wFull", "text12", "edwTextareaFlag")}
                />
                <div className={cx("staffCharCount")}>{additionalFlag.length} / 400</div>
              </div>
            </div>
          ) : null}

          <div className={cx("flexRow", "gap12", "edwNavRow")}>
            {step > 0 ? (
              <button
                type="button"
                className={cx("edwBackBtn", "edwBackBtnShell")}
                onClick={() => setStep((previous) => previous - 1)}
              >
                ← Back
              </button>
            ) : null}

            <button
              type="button"
              className={cx("staffBtnPrimary")}
              disabled={!canProceed || submitting}
              onClick={() => {
                if (step < steps.length - 1) {
                  setStep((previous) => previous + 1);
                  return;
                }
                void handleWrapSubmit();
              }}
            >
              {step === steps.length - 1
                ? submitting ? "Saving…" : "Wrap up the day →"
                : "Continue →"}
            </button>
          </div>
        </div>

        {/* ── Side panel ── */}
        <div className={cx("flexCol", "gap20", "edwSidePane")}>
          <div>
            <div className={cx("sectionLabel", "mb12")}>Completed Today</div>
            <div className={cx("staffKpiStrip", "mb12")}>
              <div className={cx("staffKpiCell")}>
                <div className={cx("staffKpiValue")}>{completedToday.length}</div>
                <div className={cx("staffKpiLabel")}>Tasks done</div>
              </div>
              <div className={cx("staffKpiCell")}>
                <div className={cx("staffKpiValue")}>{totalHoursToday}h</div>
                <div className={cx("staffKpiLabel")}>Hours logged</div>
              </div>
            </div>
            <div className={cx("flexCol", "gap6")}>
              {completedToday.map((task, index) => (
                <div key={index} className={cx("staffListRow")}>
                  <div className={cx("flex1", "minW0")}>
                    <div className={cx("text11", "colorMuted", "mb4", "edwDoneTaskText")}>{task.text}</div>
                    <div className={cx("flexBetween")}>
                      <span className={cx("text10", "colorMuted2")}>{task.client}</span>
                      <span className={cx("text10", "colorAccent")}>{task.hours}h</span>
                    </div>
                  </div>
                </div>
              ))}
              {completedToday.length === 0 ? (
                <div className={cx("text11", "colorMuted2")}>No tasks completed today yet.</div>
              ) : null}
            </div>
          </div>

          {step > 0 ? (
            <div className={cx("edwSection")}>
              <div className={cx("sectionLabel", "colorAccent", "mb10")}>Wrap summary so far</div>
              {hoursLogged ? <div className={cx("text11", "colorMuted", "mb4")}>Hours: {hoursLogged}h</div> : null}
              {mood > 0 ? <div className={cx("text11", "colorMuted", "mb4")}>Mood: {moodLabels[mood]}</div> : null}
              {tomorrowTasks.length > 0 && step > 1 ? (
                <div className={cx("text11", "colorMuted", "mb4")}>Tomorrow: {tomorrowTasks.length} tasks queued</div>
              ) : null}
              {flaggedItems.length > 0 ? (
                <div className={cx("text11", "colorRed")}>
                  ⚑ {flaggedItems.length} item{flaggedItems.length > 1 ? "s" : ""} flagged for admin
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

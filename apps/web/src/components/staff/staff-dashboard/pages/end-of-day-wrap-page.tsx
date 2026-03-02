"use client";

import { useState } from "react";
import { cx } from "../style";

const today = "Monday, Feb 23";
const currentTime = "17:02";

const suggestedTasks = [
  { id: 1, text: "Chase Volta Studios approval on logo suite", client: "Volta Studios", urgent: true, done: false },
  { id: 2, text: "Complete Kestrel KPI framework doc", client: "Kestrel Capital", urgent: true, done: false },
  { id: 3, text: "Revise Mira Health booking flow wireframes", client: "Mira Health", urgent: false, done: false },
  { id: 4, text: "Send weekly update to Okafor & Sons", client: "Okafor & Sons", urgent: false, done: false },
  { id: 5, text: "Review Dune Collective type system docs", client: "Dune Collective", urgent: false, done: false }
];

const completedToday = [
  { text: "Updated Volta brand colour palette - warmer amber", hours: 2.5, client: "Volta Studios" },
  { text: "Drafted Kestrel audience segmentation analysis", hours: 3, client: "Kestrel Capital" },
  { text: "Internal review call with design team", hours: 1, client: "Internal" },
  { text: "Sent follow-up to Dune Collective (no response)", hours: 0.5, client: "Dune Collective" }
];

const urgentItems = [
  { type: "approval", text: "Volta Studios logo suite - awaiting sign-off 2 days" },
  { type: "overdue", text: "Dune Collective - 6 days without client contact" },
  { type: "invoice", text: "Kestrel Capital invoice overdue 7 days" }
] as const;

const steps = ["wrap_up", "top_three", "flag", "done"];
const stepLabels = ["Log your day", "Set tomorrow's top 3", "Flag anything urgent", "Done"];

export function EndOfDayWrapPage({ isActive }: { isActive: boolean }) {
  const [step, setStep] = useState(0);
  const [hoursLogged, setHoursLogged] = useState("");
  const [wrapNote, setWrapNote] = useState("");
  const [mood, setMood] = useState(0);
  const [tomorrowTasks, setTomorrowTasks] = useState(suggestedTasks.slice(0, 3).map((task) => ({ ...task })));
  const [customTask, setCustomTask] = useState("");
  const [flaggedItems, setFlaggedItems] = useState<number[]>([]);
  const [additionalFlag, setAdditionalFlag] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const moodEmojis = ["", "😔", "😐", "🙂", "😄", "🔥"];
  const moodLabels = ["", "Rough", "Slow", "Okay", "Good", "Fired up"];

  const totalHoursToday = completedToday.reduce((sum, task) => sum + task.hours, 0);
  const canProceed = step === 0 ? hoursLogged !== "" && mood > 0 : true;

  const toggleFlag = (index: number) =>
    setFlaggedItems((previous) => (previous.includes(index) ? previous.filter((item) => item !== index) : [...previous, index]));

  const addCustomTask = () => {
    if (!customTask.trim() || tomorrowTasks.length >= 5) return;
    setTomorrowTasks((previous) => [...previous, { id: Date.now(), text: customTask.trim(), client: "", urgent: false, done: false }]);
    setCustomTask("");
  };

  const removeTask = (id: number) => setTomorrowTasks((previous) => previous.filter((task) => task.id !== id));

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
          <div className={cx("text12", "colorMuted2", "mt6")}>{today} · {currentTime}</div>
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
                onClick={() => {
                  if (index < step) setStep(index);
                }}
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
                <div className={cx("text10", "colorMuted2")}>Time-tracked today: {totalHoursToday}h across {completedToday.length} tasks</div>
              </div>

              <div>
                <div className={cx("sectionLabel", "mb10")}>Quick reflection <span className={cx("edwOptionalText")}>Optional</span></div>
                <textarea
                  value={wrapNote}
                  onChange={(event) => setWrapNote(event.target.value)}
                  placeholder="Anything worth noting about today? Wins, frustrations, things to remember..."
                  className={cx("inputBase", "wFull", "text12", "edwTextareaSm")}
                />
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
                      <span className={cx("tracking", "edwMoodLabel", mood === value && "edwMoodLabelActive")} data-mood={String(value)}>{moodLabels[value]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className={cx("edwBlockWide")}> 
              <div className={cx("text12", "colorMuted2", "mb20", "edwLeadText")}>
                These are pulled from your open tasks and overdue items. Edit, reorder, or add your own.
              </div>

              <div className={cx("flexCol", "gap8", "mb16")}> 
                {tomorrowTasks.map((task, index) => (
                  <div key={task.id} className={cx("edwTaskItem", "edwTaskRow")}> 
                    <div className={cx("flexCenter", "noShrink", "fontDisplay", "fw700", "text11", "colorMuted2", "edwTaskOrder")}>{index + 1}</div>
                    <div className={cx("flex1")}> 
                      <div className={cx("text12", "colorText", "edwTaskText")}>{task.text}</div>
                      {task.client ? <div className={cx("text10", "colorMuted2", "mt4", "edwTaskClient")}>{task.client}</div> : null}
                      {task.urgent ? <div className={cx("colorAmber", "tracking", "mt4", "edwUrgentTag")}>URGENT</div> : null}
                    </div>
                    <button type="button" className={cx("edwRemoveBtn", "edwRemoveBtnVisible")} onClick={() => removeTask(task.id)}>
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
                    onKeyDown={(event) => {
                      if (event.key === "Enter") addCustomTask();
                    }}
                    placeholder="Add another task..."
                    className={cx("inputBase", "flex1", "text12", "edwTaskInput")}
                  />
                  <button type="button" onClick={addCustomTask} className={cx("fontMono", "text12", "colorAccent", "edwTaskAddBtn")}>
                    + Add
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

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
                      <div className={cx("flexCenter", "noShrink", "edwFlagCheck", isFlagged && "edwFlagCheckActive")}>{isFlagged ? "✓" : ""}</div>
                      <div className={cx("flex1")}> 
                        <div className={cx("text12", isFlagged ? "colorText" : "colorMuted")}>{item.text}</div>
                        <div className={cx("uppercase", "mt4", "edwFlagType")} data-type={item.type}>{item.type}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div>
                <div className={cx("sectionLabel", "mb10")}>Anything else to flag? <span className={cx("edwOptionalText")}>Optional</span></div>
                <textarea
                  value={additionalFlag}
                  onChange={(event) => setAdditionalFlag(event.target.value)}
                  placeholder="Escalations, concerns, things the account manager should know..."
                  className={cx("inputBase", "wFull", "text12", "edwTextareaFlag")}
                />
              </div>
            </div>
          ) : null}

          <div className={cx("flexRow", "gap12", "edwNavRow")}>
            {step > 0 ? (
              <button type="button" className={cx("edwBackBtn", "edwBackBtnShell")} onClick={() => setStep((previous) => previous - 1)}>
                ← Back
              </button>
            ) : null}

            <button
              type="button"
              className={cx("edwNextBtn", "edwNextBtnShell")}
              disabled={!canProceed}
              onClick={() => {
                if (step < steps.length - 1) {
                  setStep((previous) => previous + 1);
                  return;
                }
                setSubmitted(true);
              }}
            >
              {step === steps.length - 1 ? "Wrap up the day →" : "Continue →"}
            </button>
          </div>
        </div>

        <div className={cx("flexCol", "gap20", "edwSidePane")}> 
          <div>
            <div className={cx("sectionLabel", "mb12")}>Completed Today</div>
            <div className={cx("flexCol", "gap6")}> 
              {completedToday.map((task, index) => (
                <div key={index} className={cx("cardSurfaceSm")}>
                  <div className={cx("text11", "colorMuted", "mb4", "edwDoneTaskText")}>{task.text}</div>
                  <div className={cx("flexBetween")}>
                    <span className={cx("text10", "colorMuted2")}>{task.client}</span>
                    <span className={cx("text10", "colorAccent")}>{task.hours}h</span>
                  </div>
                </div>
              ))}
            </div>

            <div className={cx("flexBetween", "mt10", "edwTrackedRow")}>
              <span className={cx("text11", "colorMuted2")}>Total tracked</span>
              <span className={cx("text11", "colorAccent", "fw600")}>{totalHoursToday}h</span>
            </div>
          </div>

          {step > 0 ? (
            <div className={cx("edwSection")}>
              <div className={cx("sectionLabel", "colorAccent", "mb10")}>Wrap summary so far</div>
              {hoursLogged ? <div className={cx("text11", "colorMuted", "mb4")}>Hours: {hoursLogged}h</div> : null}
              {mood > 0 ? <div className={cx("text11", "colorMuted", "mb4")}>Mood: {moodLabels[mood]}</div> : null}
              {tomorrowTasks.length > 0 && step > 1 ? <div className={cx("text11", "colorMuted", "mb4")}>Tomorrow: {tomorrowTasks.length} tasks queued</div> : null}
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

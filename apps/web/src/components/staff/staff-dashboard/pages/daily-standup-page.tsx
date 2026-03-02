"use client";

import { useMemo, useState } from "react";
import { cx } from "../style";

const today = "Monday, Feb 23";

type PastStandup = {
  date: string;
  submitted: string;
  yesterday: string;
  today: string;
  blockers: string;
  mood: number;
  hoursLogged: number;
  flaggedForAdmin: boolean;
};

type TopTask = {
  id: number;
  text: string;
  client: string;
  done: boolean;
};

const pastStandups: PastStandup[] = [
  {
    date: "Fri, Feb 20",
    submitted: "9:02 AM",
    yesterday:
      "Completed the brand identity revision for Volta Studios and sent for client review. Drafted campaign strategy intro for Kestrel Capital.",
    today: "Finalize KPI framework doc for Kestrel. Start Mira Health mobile wireframe revisions.",
    blockers: "Waiting on Volta Studios client approval - chasing today.",
    mood: 4,
    hoursLogged: 7.5,
    flaggedForAdmin: false
  },
  {
    date: "Thu, Feb 19",
    submitted: "9:15 AM",
    yesterday:
      "Revised colour palette for Volta after feedback. Set up shared asset folder for Dune Collective. Internal sync with design team re: grid system.",
    today: "Brand identity revision + campaign strategy draft.",
    blockers: "None",
    mood: 3,
    hoursLogged: 8,
    flaggedForAdmin: false
  },
  {
    date: "Wed, Feb 18",
    submitted: "8:58 AM",
    yesterday:
      "Delivered type & grid system to Dune Collective. Reviewed Okafor data vis draft with team.",
    today: "Okafor revisions + Volta colour palette.",
    blockers: "Dune Collective not responding - may need admin loop-in.",
    mood: 2,
    hoursLogged: 6.5,
    flaggedForAdmin: true
  }
];

const topThree: TopTask[] = [
  { id: 1, text: "Finalize Kestrel Capital KPI framework", client: "Kestrel Capital", done: false },
  { id: 2, text: "Revise Mira Health booking flow wireframes", client: "Mira Health", done: false },
  { id: 3, text: "Chase Volta Studios approval on logo suite", client: "Volta Studios", done: false }
];

const moodLabels = ["", "Rough", "Slow", "Okay", "Good", "Firing"];
const moodToneClasses = ["dsToneMuted2", "dsMoodTone1", "dsMoodTone2", "dsMoodTone3", "dsMoodTone4", "dsMoodTone5"];
const moodDotClasses = ["dsMoodDot0", "dsMoodDot1", "dsMoodDot2", "dsMoodDot3", "dsMoodDot4", "dsMoodDot5"];
const moodBarClasses = ["dsMoodBar0", "dsMoodBar1", "dsMoodBar2", "dsMoodBar3", "dsMoodBar4", "dsMoodBar5"];
const moodActiveBtnClasses = ["", "dsMoodBtnActive1", "dsMoodBtnActive2", "dsMoodBtnActive3", "dsMoodBtnActive4", "dsMoodBtnActive5"];

function MoodDot({ value, size = 10 }: { value: number; size?: number }) {
  return (
    <div
      className={cx(
        "noShrink",
        "dsMoodDot",
        size === 8 ? "dsMoodDotSm" : "dsMoodDotMd",
        moodDotClasses[value] ?? "dsMoodDot0"
      )}
    />
  );
}

export function DailyStandupPage({ isActive }: { isActive: boolean }) {
  const [submitted, setSubmitted] = useState(false);
  const [selectedPast, setSelectedPast] = useState<number | null>(null);
  const [mood, setMood] = useState(0);
  const [hours, setHours] = useState("");
  const [fields, setFields] = useState({ yesterday: "", today_plan: "", blockers: "" });
  const [tasks, setTasks] = useState(topThree);
  const [flagAdmin, setFlagAdmin] = useState(false);
  const [view, setView] = useState<"log" | "history">("log");

  const canSubmit = mood > 0 && fields.yesterday.trim().length > 0 && fields.today_plan.trim().length > 0;
  const pastSelected = selectedPast !== null ? pastStandups[selectedPast] : null;

  const streakSummary = useMemo(
    () => ({
      days: 4,
      hours: 29.5
    }),
    []
  );

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-standup">
      <div className={cx("pageHeaderBar", "borderB", "pb0", "mb16")}>
        <div className={cx("flexBetween", "gap24", "mb24")}>
          <div>
            <div className={cx("pageEyebrow")}>Staff Dashboard / Daily Rhythm</div>
            <h1 className={cx("pageTitle")}>Daily Standup</h1>
            <div className={cx("text12", "colorMuted2", "mt6")}>{today}</div>
          </div>
          <div className={cx("flexRow", "gap16")}>
            {submitted ? (
              <div className={cx("dsSubmittedBadge")}>
                <span className={cx("colorAccent", "text12")}>
                  &#10003; Submitted {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        <div className={cx("flexRow")}>
          {[{ key: "log", label: "Today's Log" }, { key: "history", label: "Past Standups" }].map((tab) => (
            <button type="button"
              key={tab.key}
              className={cx("dsTabBtn", view === tab.key && "dsTabBtnActive")}
              onClick={() => setView(tab.key as "log" | "history")}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {view === "log" ? (
        <div className={cx("dsLogGrid")}>
          <div className={cx("dsLogLeft")}>
            {submitted ? (
              <div className={cx("dsSubmittedState")}>
                <div className={cx("dsSubmittedIcon")}>&#10003;</div>
                <div className={cx("fontDisplay", "fw800", "colorAccent", "dsSubmittedTitle")}>Standup submitted</div>
                <div className={cx("text12", "colorMuted2", "mb32")}>Your team can see today&apos;s update. Admin notified.</div>
                <button type="button" className={cx("dsEditBtn")} onClick={() => setSubmitted(false)}>
                  Edit submission
                </button>
              </div>
            ) : (
              <div className={cx("flexCol", "gap22", "dsFormWrap")}>
                <div>
                  <label className={cx("dsFormLabel")}>What did you complete yesterday?</label>
                  <textarea
                    value={fields.yesterday}
                    onChange={(event) => setFields((previous) => ({ ...previous, yesterday: event.target.value }))}
                    placeholder="e.g. Finished logo revisions for Volta Studios, drafted campaign intro for Kestrel..."
                    className={cx("dsTextarea")}
                  />
                </div>

                <div>
                  <label className={cx("dsFormLabel")}>What&apos;s your focus today?</label>
                  <textarea
                    value={fields.today_plan}
                    onChange={(event) => setFields((previous) => ({ ...previous, today_plan: event.target.value }))}
                    placeholder="e.g. Finalise KPI framework for Kestrel, begin Mira wireframe revisions..."
                    className={cx("dsTextarea")}
                  />
                </div>

                <div>
                  <label className={cx("dsFormLabel")}>
                    Any blockers?
                    <span className={cx("dsFormLabelOptional")}>Optional</span>
                  </label>
                  <textarea
                    value={fields.blockers}
                    onChange={(event) => setFields((previous) => ({ ...previous, blockers: event.target.value }))}
                    placeholder="Waiting on client feedback, need design resource, unclear brief..."
                    className={cx("dsTextareaBlockers", fields.blockers.trim().length > 0 && "dsTextareaWarn")}
                  />
                </div>

                <div>
                  <label className={cx("dsFormLabel")}>Hours logged yesterday</label>
                  <input
                    type="number"
                    min="0"
                    max="16"
                    step="0.5"
                    value={hours}
                    onChange={(event) => setHours(event.target.value)}
                    placeholder="7.5"
                    className={cx("dsHoursInput")}
                  />
                </div>

                <div>
                  <label className={cx("dsFormLabel", "mb12")}>How are you feeling?</label>
                  <div className={cx("flexRow", "gap10")}>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button type="button"
                        key={value}
                        className={cx("dsMoodBtn", mood === value && moodActiveBtnClasses[value])}
                        onClick={() => setMood(value)}
                      >
                        <MoodDot value={value} size={8} />
                        <span className={cx("dsMoodLabel", mood === value ? moodToneClasses[value] : "dsToneMuted2")}>{moodLabels[value]}</span>
                      </button>
                    ))}
                    {mood > 0 ? <span className={cx("text12", moodToneClasses[mood], "dsMoodCurrent")}>{moodLabels[mood]}</span> : null}
                  </div>
                </div>

                <div className={cx("flexRow", "gap12")}>
                  <div onClick={() => setFlagAdmin((previous) => !previous)} className={cx("dsFlagCheck", flagAdmin ? "dsFlagCheckActive" : "dsFlagCheckIdle")}>
                    {flagAdmin ? "\u2713" : ""}
                  </div>
                  <div>
                    <div className={cx("text12", flagAdmin ? "dsToneRed" : "colorMuted")}>Flag for admin attention</div>
                    <div className={cx("text10", "colorMuted2")}>Admin will see this standup highlighted</div>
                  </div>
                </div>

                <button type="button" className={cx("dsSubmitBtn")} disabled={!canSubmit} onClick={() => setSubmitted(true)}>
                  Submit Standup &rarr;
                </button>
              </div>
            )}
          </div>

          <div className={cx("dsLogRight")}>
            <div className={cx("dsSectionLabel", "mb16")}>Today&apos;s Top 3</div>
            <div className={cx("flexCol", "gap8", "mb24")}>
              {tasks.map((task, index) => (
                <div key={task.id} className={cx("dsTaskCard", task.done && "dsTaskCardDone")}>
                  <div
                    className={cx("dsTaskCheck", task.done ? "dsTaskCheckDone" : "dsTaskCheckIdle")}
                    onClick={() => setTasks((previous) => previous.map((item) => (item.id === task.id ? { ...item, done: !item.done } : item)))}
                  >
                    {task.done ? "\u2713" : ""}
                  </div>
                  <div className={cx("flex1", "minW0")}>
                    <div className={cx("text12", "dsTaskText", task.done && "dsTaskTextDone")}>{task.text}</div>
                    <div className={cx("text10", "colorMuted2", "mt4")}>{task.client}</div>
                  </div>
                  <span className={cx("text10", "colorMuted2", "noShrink")}>{index + 1}</span>
                </div>
              ))}
            </div>

            <div className={cx("mb24")}>
              <div className={cx("dsSectionLabel", "mb12")}>This Week</div>
              <div className={cx("flexRow", "gap6")}>
                {["M", "T", "W", "T", "F"].map((label, index) => {
                  const done = index < 4;
                  const isToday = index === 0;
                  return (
                    <div key={index} className={cx("dsWeekDay", isToday ? "dsWeekDayToday" : done ? "dsWeekDayDone" : "dsWeekDayIdle")}>
                      <span className={cx("dsWeekDayLabel", done ? "dsToneAccent" : "dsToneMuted2")}>{label}</span>
                      {done ? <div className={cx("dsWeekDayDot")} /> : null}
                    </div>
                  );
                })}
              </div>
              <div className={cx("text10", "colorMuted2", "mt8")}>
                {streakSummary.days} day streak - {streakSummary.hours} hrs this week
              </div>
            </div>

            <div>
              <div className={cx("dsSectionLabel", "mb12")}>Recent Mood</div>
              <div className={cx("dsMoodChart")}>
                {pastStandups.map((entry, index) => (
                  <div key={index} className={cx("dsMoodChartCol")}>
                    <div className={cx("dsMoodChartBar", moodBarClasses[entry.mood] ?? "dsMoodBar0")} />
                    <span className={cx("dsMoodChartLabel")}>{entry.date.split(",")[0]}</span>
                  </div>
                ))}
                <div className={cx("dsMoodChartCol")}>
                  <div className={cx("dsMoodChartBarToday", moodBarClasses[mood] ?? "dsMoodBar0")} />
                  <span className={cx("dsMoodChartLabelToday")}>Today</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={cx("dsHistoryGrid", pastSelected && "dsHistoryGridWithDetail")}>
          <div className={cx("dsHistoryLeft")}>
            <div className={cx("flexCol", "gap10")}>
              {pastStandups.map((entry, index) => (
                <div key={index} className={cx("dsHistoryCard", selectedPast === index && "dsHistoryCardActive")} onClick={() => setSelectedPast(selectedPast === index ? null : index)}>
                  <div className={cx("flexBetween", "mb8")}>
                    <div className={cx("flexRow", "gap12")}>
                      <span className={cx("fontDisplay", "fw700", "colorText", "text14")}>{entry.date}</span>
                      <span className={cx("text10", "colorMuted2")}>submitted {entry.submitted}</span>
                      {entry.flaggedForAdmin ? <span className={cx("dsHistoryFlagged")}>Flagged</span> : null}
                    </div>
                    <div className={cx("flexRow", "gap12")}>
                      <MoodDot value={entry.mood} size={8} />
                      <span className={cx("text11", moodToneClasses[entry.mood] ?? "dsToneMuted2")}>{moodLabels[entry.mood]}</span>
                      <span className={cx("text11", "colorMuted2")}>{entry.hoursLogged}h</span>
                    </div>
                  </div>
                  <div className={cx("text12", "colorMuted2", "truncate", "dsHistoryExcerpt")}>{entry.yesterday}</div>
                  {entry.blockers !== "None" ? <div className={cx("dsHistoryBlocker")}>&loz; {entry.blockers}</div> : null}
                </div>
              ))}
            </div>
          </div>

          {pastSelected ? (
            <div className={cx("dsHistoryDetail")}>
              <div>
                <div className={cx("fontDisplay", "fw800", "colorText", "dsHistoryDetailTitle")}>{pastSelected.date}</div>
                <div className={cx("text11", "colorMuted2", "mt4")}>Submitted at {pastSelected.submitted}</div>
              </div>

              <div className={cx("formGrid2")}>
                <div className={cx("dsHistoryMetaCard")}>
                  <div className={cx("dsHistoryMetaLabel")}>Mood</div>
                  <div className={cx("flexRow", "gap8")}>
                    <MoodDot value={pastSelected.mood} size={10} />
                    <span className={cx("text13", moodToneClasses[pastSelected.mood] ?? "dsToneMuted2")}>{moodLabels[pastSelected.mood]}</span>
                  </div>
                </div>
                <div className={cx("dsHistoryMetaCard")}>
                  <div className={cx("dsHistoryMetaLabel")}>Hours logged</div>
                  <div className={cx("text13", "colorAccent")}>{pastSelected.hoursLogged}h</div>
                </div>
              </div>

              {[
                { label: "Completed yesterday", value: pastSelected.yesterday },
                { label: "Today's plan", value: pastSelected.today },
                { label: "Blockers", value: pastSelected.blockers, warn: pastSelected.blockers !== "None" }
              ].map((entry) => (
                <div key={entry.label}>
                  <div className={cx("dsSectionLabel", "mb8")}>{entry.label}</div>
                  <div className={cx(entry.warn ? "dsHistoryBlockerCard" : "dsHistoryTextCard")}>{entry.value}</div>
                </div>
              ))}

              {pastSelected.flaggedForAdmin ? (
                <div className={cx("dsHistoryFlagCard")}>
                  <div className={cx("text11", "colorRed")}>&squf; Flagged for admin attention</div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

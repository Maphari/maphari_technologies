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
  { type: "approval", text: "Volta Studios logo suite - awaiting sign-off 2 days", color: "#f5c518" },
  { type: "overdue", text: "Dune Collective - 6 days without client contact", color: "#ff4444" },
  { type: "invoice", text: "Kestrel Capital invoice overdue 7 days", color: "#ff4444" }
];

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
  const moodColors = ["", "#ff4444", "#f5a623", "#f5c518", "#a0c840", "var(--accent)"];

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
      <section className={cx("page", isActive && "pageActive")} id="page-eod-wrap-complete">
        <div style={{ minHeight: "calc(100vh - 180px)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 48 }}>◎</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "var(--accent)" }}>Day wrapped.</div>
          <div style={{ fontSize: 13, color: "var(--muted2)", textAlign: "center", maxWidth: 340 }}>
            {parseFloat(hoursLogged || String(totalHoursToday)).toFixed(1)}h logged · {tomorrowTasks.length} tasks queued for tomorrow ·{" "}
            {flaggedItems.length + (additionalFlag.trim() ? 1 : 0)} items flagged
          </div>
          <div
            style={{
              marginTop: 8,
              padding: "10px 20px",
              background: "color-mix(in srgb, var(--accent) 6%, transparent)",
              border: "1px solid color-mix(in srgb, var(--accent) 15%, transparent)",
              borderRadius: 3,
              fontSize: 12,
              color: "var(--accent)"
            }}
          >
            See you tomorrow.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={cx("page", isActive && "pageActive")} id="page-eod-wrap">
      <style>{`
        .eod-mood-btn { transition: all 0.12s ease; cursor: pointer; border: none; }
        .eod-mood-btn:hover { transform: scale(1.12); }
        .eod-next-btn { transition: all 0.15s ease; cursor: pointer; font-family: 'DM Mono', monospace; }
        .eod-next-btn:hover:not(:disabled) { background: #a8d420 !important; }
        .eod-next-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .eod-back-btn { transition: all 0.12s ease; cursor: pointer; font-family: 'DM Mono', monospace; }
        .eod-back-btn:hover { color: #a0a0b0 !important; }
        .eod-flag-item { transition: all 0.12s ease; cursor: pointer; }
        .eod-flag-item:hover { border-color: rgba(255,68,68,0.3) !important; }
        .eod-task-item { transition: all 0.12s ease; }
        .eod-remove-btn { transition: all 0.12s ease; cursor: pointer; opacity: 0; }
        .eod-task-item:hover .eod-remove-btn { opacity: 1; }
      `}</style>

      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 18, marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
            Staff Dashboard / Daily Rhythm
          </div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
            End-of-day Wrap
          </h1>
          <div style={{ fontSize: 12, color: "var(--muted2)", marginTop: 6 }}>
            {today} · {currentTime}
          </div>
        </div>

        <div style={{ display: "flex", gap: 0, alignItems: "center" }}>
          {steps.map((item, index) => (
            <div key={item} style={{ display: "flex", alignItems: "center" }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: `2px solid ${index < step ? "var(--accent)" : index === step ? "var(--accent)" : "rgba(255,255,255,0.1)"}`,
                  background: index < step ? "var(--accent)" : index === step ? "color-mix(in srgb, var(--accent) 12%, transparent)" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: index < step ? 12 : 11,
                  color: index < step ? "#050508" : index === step ? "var(--accent)" : "#333344",
                  cursor: index < step ? "pointer" : "default"
                }}
                onClick={() => {
                  if (index < step) setStep(index);
                }}
              >
                {index < step ? "✓" : index + 1}
              </div>
              {index < steps.length - 1 ? (
                <div style={{ width: 24, height: 1, background: index < step ? "var(--accent)" : "rgba(255,255,255,0.08)", margin: "0 2px" }} />
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", minHeight: "calc(100vh - 300px)" }}>
        <div style={{ paddingRight: 30, borderRight: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
            Step {step + 1} of {steps.length}
          </div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 28 }}>{stepLabels[step]}</div>

          {step === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 520 }}>
              <div>
                <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
                  Hours logged today
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
                  {[6, 6.5, 7, 7.5, 8, 8.5, 9].map((hour) => (
                    <button
                      key={hour}
                      onClick={() => setHoursLogged(String(hour))}
                      type="button"
                      style={{
                        padding: "8px 16px",
                        borderRadius: 3,
                        border: `1px solid ${hoursLogged === String(hour) ? "color-mix(in srgb, var(--accent) 40%, transparent)" : "rgba(255,255,255,0.08)"}`,
                        background: hoursLogged === String(hour) ? "color-mix(in srgb, var(--accent) 10%, transparent)" : "transparent",
                        color: hoursLogged === String(hour) ? "var(--accent)" : "var(--muted2)",
                        fontSize: 13,
                        cursor: "pointer",
                        fontFamily: "'DM Mono', monospace"
                      }}
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
                    style={{
                      width: 80,
                      padding: "8px 12px",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 3,
                      color: "var(--text)",
                      fontSize: 12
                    }}
                  />
                </div>
                <div style={{ fontSize: 10, color: "var(--muted2)" }}>
                  Time-tracked today: {totalHoursToday}h across {completedToday.length} tasks
                </div>
              </div>

              <div>
                <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
                  Quick reflection <span style={{ color: "#333344", fontWeight: 400 }}>Optional</span>
                </div>
                <textarea
                  value={wrapNote}
                  onChange={(event) => setWrapNote(event.target.value)}
                  placeholder="Anything worth noting about today? Wins, frustrations, things to remember..."
                  style={{
                    width: "100%",
                    minHeight: 80,
                    padding: "12px 14px",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 3,
                    color: "var(--text)",
                    fontSize: 12,
                    lineHeight: 1.6,
                    resize: "none"
                  }}
                />
              </div>

              <div>
                <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>
                  How did today feel?
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      className="eod-mood-btn"
                      onClick={() => setMood(value)}
                      type="button"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 6,
                        padding: "12px 16px",
                        borderRadius: 3,
                        border: `1px solid ${mood === value ? moodColors[value] : "rgba(255,255,255,0.06)"}`,
                        background: mood === value ? `${moodColors[value]}12` : "transparent"
                      }}
                    >
                      <span style={{ fontSize: 22 }}>{moodEmojis[value]}</span>
                      <span style={{ fontSize: 9, color: mood === value ? moodColors[value] : "var(--muted2)", letterSpacing: "0.08em" }}>{moodLabels[value]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div style={{ maxWidth: 540 }}>
              <div style={{ fontSize: 12, color: "var(--muted2)", marginBottom: 20, lineHeight: 1.6 }}>
                These are pulled from your open tasks and overdue items. Edit, reorder, or add your own.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {tomorrowTasks.map((task, index) => (
                  <div key={task.id} className="eod-task-item" style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 3, background: "rgba(255,255,255,0.01)" }}>
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 2,
                        flexShrink: 0,
                        border: "1px solid rgba(255,255,255,0.12)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        color: "var(--muted2)",
                        fontFamily: "'Syne', sans-serif",
                        fontWeight: 700
                      }}
                    >
                      {index + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.4 }}>{task.text}</div>
                      {task.client ? <div style={{ fontSize: 10, color: "var(--muted2)", marginTop: 3 }}>{task.client}</div> : null}
                      {task.urgent ? <div style={{ fontSize: 9, color: "#f5c518", marginTop: 3, letterSpacing: "0.08em" }}>URGENT</div> : null}
                    </div>
                    <button className="eod-remove-btn" onClick={() => removeTask(task.id)} type="button" style={{ fontSize: 14, color: "#ff4444", background: "none", border: "none", padding: "0 4px", lineHeight: 1 }}>
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {tomorrowTasks.length < 5 ? (
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={customTask}
                    onChange={(event) => setCustomTask(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") addCustomTask();
                    }}
                    placeholder="Add another task..."
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 3,
                      color: "var(--text)",
                      fontSize: 12
                    }}
                  />
                  <button
                    onClick={addCustomTask}
                    type="button"
                    style={{
                      padding: "10px 16px",
                      background: "color-mix(in srgb, var(--accent) 8%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
                      borderRadius: 3,
                      color: "var(--accent)",
                      fontSize: 12,
                      cursor: "pointer",
                      fontFamily: "'DM Mono', monospace"
                    }}
                  >
                    + Add
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 2 ? (
            <div style={{ maxWidth: 520 }}>
              <div style={{ fontSize: 12, color: "var(--muted2)", marginBottom: 20, lineHeight: 1.6 }}>
                These items surfaced from your clients today. Flag anything that needs admin attention.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                {urgentItems.map((item, index) => {
                  const isFlagged = flaggedItems.includes(index);
                  return (
                    <div
                      key={index}
                      className="eod-flag-item"
                      onClick={() => toggleFlag(index)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        padding: "14px 16px",
                        border: `1px solid ${isFlagged ? "rgba(255,68,68,0.3)" : "rgba(255,255,255,0.06)"}`,
                        borderRadius: 3,
                        background: isFlagged ? "rgba(255,68,68,0.06)" : "rgba(255,255,255,0.01)"
                      }}
                    >
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 3,
                          flexShrink: 0,
                          border: `1px solid ${isFlagged ? "#ff4444" : "rgba(255,255,255,0.12)"}`,
                          background: isFlagged ? "rgba(255,68,68,0.2)" : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          color: "#ff4444"
                        }}
                      >
                        {isFlagged ? "✓" : ""}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: isFlagged ? "var(--text)" : "#a0a0b0" }}>{item.text}</div>
                        <div style={{ fontSize: 10, color: item.color, marginTop: 3, letterSpacing: "0.06em", textTransform: "uppercase" }}>{item.type}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div>
                <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
                  Anything else to flag? <span style={{ color: "#333344", fontWeight: 400 }}>Optional</span>
                </div>
                <textarea
                  value={additionalFlag}
                  onChange={(event) => setAdditionalFlag(event.target.value)}
                  placeholder="Escalations, concerns, things the account manager should know..."
                  style={{
                    width: "100%",
                    minHeight: 72,
                    padding: "12px 14px",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 3,
                    color: "var(--text)",
                    fontSize: 12,
                    lineHeight: 1.6,
                    resize: "none"
                  }}
                />
              </div>
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 12, marginTop: 36 }}>
            {step > 0 ? (
              <button
                className="eod-back-btn"
                onClick={() => setStep((previous) => previous - 1)}
                type="button"
                style={{ padding: "12px 20px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 3, color: "var(--muted2)", fontSize: 11, letterSpacing: "0.08em" }}
              >
                ← Back
              </button>
            ) : null}
            <button
              className="eod-next-btn"
              disabled={!canProceed}
              onClick={() => {
                if (step < steps.length - 1) {
                  setStep((previous) => previous + 1);
                  return;
                }
                setSubmitted(true);
              }}
              type="button"
              style={{
                padding: "12px 28px",
                background: "var(--accent)",
                color: "#050508",
                border: "none",
                borderRadius: 3,
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase"
              }}
            >
              {step === steps.length - 1 ? "Wrap up the day →" : "Continue →"}
            </button>
          </div>
        </div>

        <div style={{ paddingLeft: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Completed Today</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {completedToday.map((task, index) => (
                <div key={index} style={{ padding: "10px 12px", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 3, background: "rgba(255,255,255,0.01)" }}>
                  <div style={{ fontSize: 11, color: "#a0a0b0", lineHeight: 1.4, marginBottom: 4 }}>{task.text}</div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 10, color: "var(--muted2)" }}>{task.client}</span>
                    <span style={{ fontSize: 10, color: "var(--accent)" }}>{task.hours}h</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ fontSize: 11, color: "var(--muted2)" }}>Total tracked</span>
              <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 500 }}>{totalHoursToday}h</span>
            </div>
          </div>

          {step > 0 ? (
            <div style={{ padding: 14, border: "1px solid color-mix(in srgb, var(--accent) 15%, transparent)", borderRadius: 3, background: "color-mix(in srgb, var(--accent) 4%, transparent)" }}>
              <div style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Wrap summary so far</div>
              {hoursLogged ? <div style={{ fontSize: 11, color: "#a0a0b0", marginBottom: 4 }}>Hours: {hoursLogged}h</div> : null}
              {mood > 0 ? <div style={{ fontSize: 11, color: "#a0a0b0", marginBottom: 4 }}>Mood: {moodLabels[mood]}</div> : null}
              {tomorrowTasks.length > 0 && step > 1 ? (
                <div style={{ fontSize: 11, color: "#a0a0b0", marginBottom: 4 }}>Tomorrow: {tomorrowTasks.length} tasks queued</div>
              ) : null}
              {flaggedItems.length > 0 ? (
                <div style={{ fontSize: 11, color: "#ff4444" }}>
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

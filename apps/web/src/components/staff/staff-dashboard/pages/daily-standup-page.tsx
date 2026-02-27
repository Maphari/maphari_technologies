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
const moodColors = ["", "#ff4444", "#f5a623", "#f5c518", "#a0c840", "var(--accent)"];

function MoodDot({ value, size = 10 }: { value: number; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: moodColors[value] || "#333",
        flexShrink: 0
      }}
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
    <section className={cx("page", isActive && "pageActive")} id="page-standup">
      <style>{`
        .standup-mood-btn { transition: all 0.12s ease; cursor: pointer; border: none; }
        .standup-mood-btn:hover { transform: scale(1.1); }
        .standup-tab-btn { transition: all 0.15s ease; cursor: pointer; border: none; }
        .standup-submit-btn { transition: all 0.15s ease; cursor: pointer; }
        .standup-submit-btn:hover:not(:disabled) { background: #a8d420 !important; }
        .standup-submit-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .standup-past-row { transition: all 0.15s ease; cursor: pointer; }
        .standup-past-row:hover { background: color-mix(in srgb, var(--accent) 4%, transparent) !important; border-color: color-mix(in srgb, var(--accent) 20%, transparent) !important; }
        .standup-task-check { transition: all 0.12s ease; cursor: pointer; }
        .standup-task-check:hover { border-color: var(--accent) !important; }
      `}</style>

      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 0, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
              Staff Dashboard / Daily Rhythm
            </div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              Daily Standup
            </h1>
            <div style={{ fontSize: 12, color: "var(--muted2)", marginTop: 6 }}>{today}</div>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            {submitted ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 16px",
                  background: "color-mix(in srgb, var(--accent) 8%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
                  borderRadius: 3
                }}
              >
                <span style={{ color: "var(--accent)", fontSize: 12 }}>
                  ✓ Submitted {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        <div style={{ display: "flex", gap: 0 }}>
          {[{ key: "log", label: "Today's Log" }, { key: "history", label: "Past Standups" }].map((tab) => (
            <button
              key={tab.key}
              className="standup-tab-btn"
              onClick={() => setView(tab.key as "log" | "history")}
              type="button"
              style={{
                padding: "10px 20px",
                fontSize: 11,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                background: "transparent",
                color: view === tab.key ? "var(--accent)" : "var(--muted2)",
                borderBottom: `2px solid ${view === tab.key ? "var(--accent)" : "transparent"}`,
                marginBottom: -1
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {view === "log" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", minHeight: "calc(100vh - 260px)" }}>
          <div style={{ padding: "8px 0 0", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
            {submitted ? (
              <div style={{ textAlign: "center", paddingTop: 60 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: "var(--accent)", marginBottom: 8 }}>
                  Standup submitted
                </div>
                <div style={{ fontSize: 12, color: "var(--muted2)", marginBottom: 32 }}>
                  Your team can see today's update. Admin notified.
                </div>
                <button
                  className="standup-tab-btn"
                  onClick={() => setSubmitted(false)}
                  type="button"
                  style={{
                    padding: "10px 24px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 3,
                    background: "transparent",
                    color: "#a0a0b0",
                    fontSize: 11,
                    letterSpacing: "0.08em"
                  }}
                >
                  Edit submission
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 640 }}>
                <div>
                  <label style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                    What did you complete yesterday?
                  </label>
                  <textarea
                    value={fields.yesterday}
                    onChange={(event) => setFields((previous) => ({ ...previous, yesterday: event.target.value }))}
                    placeholder="e.g. Finished logo revisions for Volta Studios, drafted campaign intro for Kestrel..."
                    style={{
                      width: "100%",
                      minHeight: 88,
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
                  <label style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                    What's your focus today?
                  </label>
                  <textarea
                    value={fields.today_plan}
                    onChange={(event) => setFields((previous) => ({ ...previous, today_plan: event.target.value }))}
                    placeholder="e.g. Finalise KPI framework for Kestrel, begin Mira wireframe revisions..."
                    style={{
                      width: "100%",
                      minHeight: 88,
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
                  <label style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                    Any blockers?
                    <span style={{ color: "#333344", marginLeft: 8, fontWeight: 400 }}>Optional</span>
                  </label>
                  <textarea
                    value={fields.blockers}
                    onChange={(event) => setFields((previous) => ({ ...previous, blockers: event.target.value }))}
                    placeholder="Waiting on client feedback, need design resource, unclear brief..."
                    style={{
                      width: "100%",
                      minHeight: 60,
                      padding: "12px 14px",
                      background: "rgba(255,255,255,0.02)",
                      border: `1px solid ${fields.blockers.trim().length > 0 ? "rgba(245,197,24,0.2)" : "rgba(255,255,255,0.08)"}`,
                      borderRadius: 3,
                      color: "var(--text)",
                      fontSize: 12,
                      lineHeight: 1.6,
                      resize: "none"
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                    Hours logged yesterday
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="16"
                    step="0.5"
                    value={hours}
                    onChange={(event) => setHours(event.target.value)}
                    placeholder="7.5"
                    style={{
                      width: 120,
                      padding: "10px 14px",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 3,
                      color: "var(--text)",
                      fontSize: 14
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: 12 }}>
                    How are you feeling?
                  </label>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        className="standup-mood-btn"
                        onClick={() => setMood(value)}
                        type="button"
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: "50%",
                          border: `2px solid ${mood === value ? moodColors[value] : "rgba(255,255,255,0.08)"}`,
                          background: mood === value ? `${moodColors[value]}18` : "transparent",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 2
                        }}
                      >
                        <MoodDot value={value} size={8} />
                        <span style={{ fontSize: 8, color: mood === value ? moodColors[value] : "var(--muted2)", letterSpacing: "0.06em" }}>
                          {moodLabels[value]}
                        </span>
                      </button>
                    ))}
                    {mood > 0 ? <span style={{ fontSize: 12, color: moodColors[mood], marginLeft: 4 }}>{moodLabels[mood]}</span> : null}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    onClick={() => setFlagAdmin((previous) => !previous)}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 3,
                      border: `1px solid ${flagAdmin ? "#ff4444" : "rgba(255,255,255,0.12)"}`,
                      background: flagAdmin ? "rgba(255,68,68,0.12)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      fontSize: 12,
                      color: "#ff4444",
                      flexShrink: 0
                    }}
                  >
                    {flagAdmin ? "✓" : ""}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: flagAdmin ? "#ff4444" : "#a0a0b0" }}>Flag for admin attention</div>
                    <div style={{ fontSize: 10, color: "var(--muted2)" }}>Admin will see this standup highlighted</div>
                  </div>
                </div>

                <button
                  className="standup-submit-btn"
                  disabled={!canSubmit}
                  onClick={() => setSubmitted(true)}
                  type="button"
                  style={{
                    padding: "14px 24px",
                    background: "var(--accent)",
                    color: "#050508",
                    border: "none",
                    borderRadius: 3,
                    fontSize: 12,
                    fontFamily: "'DM Mono', monospace",
                    fontWeight: 500,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    textAlign: "center",
                    alignSelf: "flex-start"
                  }}
                >
                  Submit Standup →
                </button>
              </div>
            )}
          </div>

          <div style={{ padding: "8px 0 0 24px" }}>
            <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>
              Today's Top 3
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
              {tasks.map((task, index) => (
                <div
                  key={task.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "12px 14px",
                    border: `1px solid ${task.done ? "color-mix(in srgb, var(--accent) 15%, transparent)" : "rgba(255,255,255,0.06)"}`,
                    borderRadius: 3,
                    background: task.done ? "color-mix(in srgb, var(--accent) 3%, transparent)" : "rgba(255,255,255,0.01)",
                    opacity: task.done ? 0.6 : 1
                  }}
                >
                  <div
                    className="standup-task-check"
                    onClick={() => setTasks((previous) => previous.map((item) => (item.id === task.id ? { ...item, done: !item.done } : item)))}
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 2,
                      flexShrink: 0,
                      marginTop: 1,
                      border: `1px solid ${task.done ? "var(--accent)" : "rgba(255,255,255,0.2)"}`,
                      background: task.done ? "color-mix(in srgb, var(--accent) 15%, transparent)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      color: "var(--accent)"
                    }}
                  >
                    {task.done ? "✓" : ""}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        color: task.done ? "var(--muted2)" : "var(--text)",
                        textDecoration: task.done ? "line-through" : "none",
                        lineHeight: 1.4
                      }}
                    >
                      {task.text}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--muted2)", marginTop: 3 }}>{task.client}</div>
                  </div>
                  <span style={{ fontSize: 10, color: "#333344", flexShrink: 0 }}>{index + 1}</span>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>
                This Week
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {["M", "T", "W", "T", "F"].map((label, index) => {
                  const done = index < 4;
                  const isToday = index === 0;
                  return (
                    <div
                      key={index}
                      style={{
                        flex: 1,
                        height: 36,
                        borderRadius: 2,
                        border: `1px solid ${
                          isToday
                            ? "color-mix(in srgb, var(--accent) 30%, transparent)"
                            : done
                            ? "color-mix(in srgb, var(--accent) 15%, transparent)"
                            : "rgba(255,255,255,0.06)"
                        }`,
                        background: isToday ? "color-mix(in srgb, var(--accent) 8%, transparent)" : done ? "color-mix(in srgb, var(--accent) 4%, transparent)" : "transparent",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 3
                      }}
                    >
                      <span style={{ fontSize: 9, color: done ? "var(--accent)" : "#333344" }}>{label}</span>
                      {done ? <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--accent)" }} /> : null}
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: 10, color: "var(--muted2)", marginTop: 8 }}>
                {streakSummary.days} day streak - {streakSummary.hours} hrs this week
              </div>
            </div>

            <div>
              <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>
                Recent Mood
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                {pastStandups.map((entry, index) => (
                  <div key={index} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ width: "100%", height: `${entry.mood * 14}px`, background: moodColors[entry.mood], borderRadius: "2px 2px 0 0", opacity: 0.7 }} />
                    <span style={{ fontSize: 8, color: "#333344" }}>{entry.date.split(",")[0]}</span>
                  </div>
                ))}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div
                    style={{
                      width: "100%",
                      height: mood > 0 ? `${mood * 14}px` : "4px",
                      background: mood > 0 ? moodColors[mood] : "rgba(255,255,255,0.1)",
                      borderRadius: "2px 2px 0 0",
                      border: "1px dashed color-mix(in srgb, var(--accent) 30%, transparent)"
                    }}
                  />
                  <span style={{ fontSize: 8, color: "var(--accent)" }}>Today</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: pastSelected ? "1fr 400px" : "1fr", minHeight: "calc(100vh - 260px)" }}>
          <div style={{ padding: "8px 0 0", borderRight: pastSelected ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pastStandups.map((entry, index) => (
                <div
                  key={index}
                  className="standup-past-row"
                  onClick={() => setSelectedPast(selectedPast === index ? null : index)}
                  style={{
                    padding: "16px 20px",
                    border: `1px solid ${selectedPast === index ? "color-mix(in srgb, var(--accent) 25%, transparent)" : "rgba(255,255,255,0.06)"}`,
                    borderRadius: 3,
                    background: selectedPast === index ? "color-mix(in srgb, var(--accent) 2%, transparent)" : "rgba(255,255,255,0.01)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: "#fff" }}>{entry.date}</span>
                      <span style={{ fontSize: 10, color: "var(--muted2)" }}>submitted {entry.submitted}</span>
                      {entry.flaggedForAdmin ? (
                        <span style={{ fontSize: 10, color: "#ff4444", padding: "2px 6px", border: "1px solid rgba(255,68,68,0.3)", borderRadius: 2 }}>
                          Flagged
                        </span>
                      ) : null}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <MoodDot value={entry.mood} size={8} />
                      <span style={{ fontSize: 11, color: moodColors[entry.mood] }}>{moodLabels[entry.mood]}</span>
                      <span style={{ fontSize: 11, color: "var(--muted2)" }}>{entry.hoursLogged}h</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted2)", lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {entry.yesterday}
                  </div>
                  {entry.blockers !== "None" ? <div style={{ marginTop: 8, fontSize: 11, color: "#f5c518" }}>⚠ {entry.blockers}</div> : null}
                </div>
              ))}
            </div>
          </div>

          {pastSelected ? (
            <div style={{ padding: "8px 0 0 28px", display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: "#fff" }}>{pastSelected.date}</div>
                <div style={{ fontSize: 11, color: "var(--muted2)", marginTop: 4 }}>Submitted at {pastSelected.submitted}</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 3 }}>
                  <div style={{ fontSize: 9, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>Mood</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <MoodDot value={pastSelected.mood} size={10} />
                    <span style={{ fontSize: 13, color: moodColors[pastSelected.mood] }}>{moodLabels[pastSelected.mood]}</span>
                  </div>
                </div>
                <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 3 }}>
                  <div style={{ fontSize: 9, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>Hours logged</div>
                  <div style={{ fontSize: 13, color: "var(--accent)" }}>{pastSelected.hoursLogged}h</div>
                </div>
              </div>

              {[
                { label: "Completed yesterday", value: pastSelected.yesterday },
                { label: "Today's plan", value: pastSelected.today },
                { label: "Blockers", value: pastSelected.blockers, warn: pastSelected.blockers !== "None" }
              ].map((entry) => (
                <div key={entry.label}>
                  <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
                    {entry.label}
                  </div>
                  <div
                    style={{
                      padding: "12px 14px",
                      background: entry.warn ? "rgba(245,197,24,0.05)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${entry.warn ? "rgba(245,197,24,0.2)" : "rgba(255,255,255,0.06)"}`,
                      borderRadius: 3,
                      fontSize: 12,
                      color: entry.warn ? "#f5c518" : "#a0a0b0",
                      lineHeight: 1.6
                    }}
                  >
                    {entry.value}
                  </div>
                </div>
              ))}

              {pastSelected.flaggedForAdmin ? (
                <div style={{ padding: "12px 14px", border: "1px solid rgba(255,68,68,0.2)", borderRadius: 3, background: "rgba(255,68,68,0.05)" }}>
                  <div style={{ fontSize: 11, color: "#ff4444" }}>⚑ Flagged for admin attention</div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

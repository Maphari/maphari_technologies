"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cx } from "../style";

type ClientRow = { id: number; name: string; avatar: string; color: string };
type TaskItem = { id: number; clientId: number; title: string; estimate: number };
type Phase = "setup" | "active" | "break";

const clients: ClientRow[] = [
  { id: 1, name: "Volta Studios", avatar: "VS", color: "var(--accent)" },
  { id: 2, name: "Kestrel Capital", avatar: "KC", color: "#a78bfa" },
  { id: 3, name: "Mira Health", avatar: "MH", color: "#60a5fa" },
  { id: 4, name: "Dune Collective", avatar: "DC", color: "#f5c518" },
  { id: 5, name: "Okafor & Sons", avatar: "OS", color: "#ff8c00" }
];

const taskPool: TaskItem[] = [
  { id: 1, clientId: 1, title: "Brand guidelines document - section 1", estimate: 90 },
  { id: 2, clientId: 2, title: "Prepare for strategy approval call", estimate: 60 },
  { id: 3, clientId: 3, title: "UX review call - revised wireframes", estimate: 60 },
  { id: 4, clientId: 1, title: "Chase logo sign-off from Lena", estimate: 15 },
  { id: 5, clientId: 4, title: "Escalate Dune situation to admin", estimate: 15 },
  { id: 6, clientId: 3, title: "Desktop wireframes - booking flow", estimate: 120 },
  { id: 7, clientId: 5, title: "Annual report layout - section 1", estimate: 90 },
  { id: 8, clientId: 2, title: "LinkedIn channel brief", estimate: 60 }
];

const DURATIONS = [
  { label: "25 min", value: 25 * 60 },
  { label: "45 min", value: 45 * 60 },
  { label: "60 min", value: 60 * 60 },
  { label: "90 min", value: 90 * 60 }
];

const BREAK_DURATION = 5 * 60;

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function formatTime(seconds: number) {
  return `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;
}

export function FocusModePage({ isActive }: { isActive: boolean }) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(DURATIONS[0].value);
  const [timeLeft, setTimeLeft] = useState(DURATIONS[0].value);
  const [running, setRunning] = useState(false);
  const [note, setNote] = useState("");
  const [sessionsToday, setSessionsToday] = useState(2);
  const [totalFocusToday, setTotalFocusToday] = useState(55);
  const [completedSessions, setCompletedSessions] = useState<Array<{ task: string; duration: number; client: string }>>([
    { task: "Chase logo sign-off from Lena", duration: 25, client: "Volta Studios" },
    { task: "Kestrel invoice follow-up", duration: 30, client: "Kestrel Capital" }
  ]);
  const [breakLeft, setBreakLeft] = useState(BREAK_DURATION);
  const [markPulse, setMarkPulse] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const totalDuration = selectedDuration;

  useEffect(() => {
    if (!running) return;
    if (phase === "active") {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((previous) => {
          if (previous <= 1) {
            if (intervalRef.current) window.clearInterval(intervalRef.current);
            setRunning(false);
            setPhase("break");
            setBreakLeft(BREAK_DURATION);
            const minutes = Math.round(totalDuration / 60);
            setSessionsToday((value) => value + 1);
            setTotalFocusToday((value) => value + minutes);
            if (selectedTask) {
              const clientName = clients.find((client) => client.id === selectedTask.clientId)?.name ?? "Client";
              setCompletedSessions((previousSessions) => [{ task: selectedTask.title, duration: minutes, client: clientName }, ...previousSessions]);
            }
            setMarkPulse(true);
            window.setTimeout(() => setMarkPulse(false), 450);
            return 0;
          }
          return previous - 1;
        });
      }, 1000);
      return () => {
        if (intervalRef.current) window.clearInterval(intervalRef.current);
      };
    }
    if (phase === "break") {
      intervalRef.current = window.setInterval(() => {
        setBreakLeft((previous) => {
          if (previous <= 1) {
            if (intervalRef.current) window.clearInterval(intervalRef.current);
            setRunning(false);
            setPhase("setup");
            setSelectedTask(null);
            setNote("");
            setTimeLeft(selectedDuration);
            return 0;
          }
          return previous - 1;
        });
      }, 1000);
      return () => {
        if (intervalRef.current) window.clearInterval(intervalRef.current);
      };
    }
    return undefined;
  }, [phase, running, selectedDuration, selectedTask, totalDuration]);

  const start = () => {
    setTimeLeft(selectedDuration);
    setPhase("active");
    setRunning(true);
  };
  const pause = () => {
    setRunning(false);
    if (intervalRef.current) window.clearInterval(intervalRef.current);
  };
  const resume = () => setRunning(true);
  const abandon = () => {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    setRunning(false);
    setPhase("setup");
    setTimeLeft(selectedDuration);
    setSelectedTask(null);
    setNote("");
  };
  const skipBreak = () => {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    setRunning(false);
    setPhase("setup");
    setTimeLeft(selectedDuration);
    setSelectedTask(null);
    setNote("");
    setBreakLeft(BREAK_DURATION);
  };
  const startBreakTimer = () => {
    setBreakLeft(BREAK_DURATION);
    setRunning(true);
  };

  const client = selectedTask ? clients.find((entry) => entry.id === selectedTask.clientId) ?? null : null;
  const pct = phase === "break" ? Math.round(((BREAK_DURATION - breakLeft) / BREAK_DURATION) * 100) : Math.round(((totalDuration - timeLeft) / totalDuration) * 100);
  const ringR = 80;
  const ringCirc = 2 * Math.PI * ringR;
  const ringDash = (phase === "break" ? (BREAK_DURATION - breakLeft) / BREAK_DURATION : (totalDuration - timeLeft) / totalDuration) * ringCirc;
  const ringColor = phase === "break" ? "#60a5fa" : client?.color ?? "var(--accent)";
  const dailyGoalPct = Math.min((totalFocusToday / 240) * 100, 100);

  const recentSessions = useMemo(() => completedSessions.slice(0, 8), [completedSessions]);

  return (
    <section className={cx("page", isActive && "pageActive")} id="page-focus-mode">
      <style>{`
        textarea { outline: none; font-family: 'DM Mono', monospace; resize: none; }
        textarea:focus { border-color: color-mix(in srgb, var(--accent) 25%, transparent) !important; }
        .fm-task-option { transition: all 0.12s ease; cursor: pointer; }
        .fm-task-option:hover { border-color: color-mix(in srgb, var(--accent) 20%, transparent) !important; background: color-mix(in srgb, var(--accent) 2%, transparent) !important; }
        .fm-dur-btn { transition: all 0.12s ease; cursor: pointer; border: none; font-family: 'DM Mono', monospace; }
        .fm-dur-btn:hover { border-color: color-mix(in srgb, var(--accent) 30%, transparent) !important; }
        .fm-ctrl-btn { transition: all 0.15s ease; cursor: pointer; font-family: 'DM Mono', monospace; }
        .fm-ctrl-btn:hover { opacity: 0.8; transform: scale(1.02); }
        .fm-abandon-btn { transition: all 0.12s ease; cursor: pointer; font-family: 'DM Mono', monospace; }
        .fm-abandon-btn:hover { color: #ff4444 !important; border-color: rgba(255,68,68,0.3) !important; }
        @keyframes fmPulseRing { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        @keyframes fmCheckPop { 0% { transform: scale(1); } 50% { transform: scale(1.25); } 100% { transform: scale(1); } }
        .fm-check-pop { animation: fmCheckPop 0.4s ease; }
      `}</style>

      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 32px 20px" }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--muted2)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 }}>Staff Dashboard / Focus</div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>Focus Mode</h1>
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          {[
            { label: "Sessions today", value: sessionsToday, color: "#a0a0b0" },
            { label: "Focus time", value: `${totalFocusToday}m`, color: "var(--accent)" }
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 3 }}>{stat.label}</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", minHeight: "calc(100vh - 120px)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 32px", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
          {phase === "setup" ? (
            <div style={{ width: "100%", maxWidth: 500, display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 6 }}>What are you focusing on?</div>
                <div style={{ fontSize: 12, color: "var(--muted2)" }}>Pick a task and a duration to begin.</div>
              </div>

              <div>
                <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>Select task</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {taskPool.map((task) => {
                    const taskClient = clients.find((entry) => entry.id === task.clientId);
                    const isSelected = selectedTask?.id === task.id;
                    return (
                      <div
                        key={task.id}
                        className="fm-task-option"
                        onClick={() => setSelectedTask(isSelected ? null : task)}
                        style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", border: `1px solid ${isSelected ? `${taskClient?.color}40` : "rgba(255,255,255,0.06)"}`, borderRadius: 3, background: isSelected ? `${taskClient?.color}08` : "rgba(255,255,255,0.01)" }}
                      >
                        <div style={{ width: 20, height: 20, borderRadius: 2, background: isSelected ? `${taskClient?.color}20` : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: taskClient?.color ?? "#a0a0b0", flexShrink: 0 }}>{taskClient?.avatar}</div>
                        <span style={{ flex: 1, fontSize: 12, color: isSelected ? "#fff" : "#a0a0b0" }}>{task.title}</span>
                        <span style={{ fontSize: 10, color: "var(--muted2)" }}>{task.estimate}m</span>
                        {isSelected ? <span style={{ fontSize: 12, color: taskClient?.color }}>✓</span> : null}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>Duration</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {DURATIONS.map((duration) => (
                    <button
                      key={duration.value}
                      className="fm-dur-btn"
                      onClick={() => {
                        setSelectedDuration(duration.value);
                        setTimeLeft(duration.value);
                      }}
                      style={{ flex: 1, padding: "10px 0", borderRadius: 3, fontSize: 12, border: `1px solid ${selectedDuration === duration.value ? "color-mix(in srgb, var(--accent) 40%, transparent)" : "rgba(255,255,255,0.08)"}`, background: selectedDuration === duration.value ? "color-mix(in srgb, var(--accent) 8%, transparent)" : "transparent", color: selectedDuration === duration.value ? "var(--accent)" : "var(--muted2)" }}
                    >
                      {duration.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>Intention <span style={{ color: "#333344", fontWeight: 400 }}>Optional</span></div>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="What do you want to achieve in this session?"
                  style={{ width: "100%", minHeight: 56, padding: "10px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--text)", fontSize: 12, lineHeight: 1.6 }}
                />
              </div>

              <button
                className="fm-ctrl-btn"
                onClick={start}
                style={{ padding: "14px", background: "var(--accent)", color: "#050508", border: "none", borderRadius: 3, fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", width: "100%" }}
              >
                Start focus session →
              </button>
            </div>
          ) : null}

          {phase === "active" ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
              <div style={{ position: "relative", width: 220, height: 220 }}>
                <svg width={220} height={220} viewBox="0 0 220 220">
                  <circle cx={110} cy={110} r={ringR} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                  <circle cx={110} cy={110} r={ringR} fill="none" stroke={ringColor} strokeWidth="6" strokeDasharray={`${ringDash} ${ringCirc}`} strokeLinecap="round" transform="rotate(-90 110 110)" style={{ transition: "stroke-dasharray 1s linear", animation: running ? "fmPulseRing 3s ease infinite" : "none" }} />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 42, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1 }}>{formatTime(timeLeft)}</div>
                  <div style={{ fontSize: 11, color: "var(--muted2)", marginTop: 6 }}>{running ? "Focusing" : "Paused"}</div>
                </div>
              </div>

              {selectedTask ? (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: client?.color, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>{client?.name}</div>
                  <div style={{ fontSize: 15, color: "#fff", maxWidth: 360, textAlign: "center", lineHeight: 1.4 }}>{selectedTask.title}</div>
                  {note ? <div style={{ fontSize: 12, color: "var(--muted2)", marginTop: 8, fontStyle: "italic" }}>"{note}"</div> : null}
                </div>
              ) : null}

              <div style={{ width: 320, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                <div style={{ height: "100%", width: `${pct}%`, background: ringColor, borderRadius: 2, transition: "width 1s linear" }} />
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  className="fm-ctrl-btn"
                  onClick={running ? pause : resume}
                  style={{ padding: "12px 28px", background: "var(--accent)", color: "#050508", border: "none", borderRadius: 3, fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}
                >
                  {running ? "⏸ Pause" : "▶ Resume"}
                </button>
                <button
                  className="fm-abandon-btn"
                  onClick={abandon}
                  style={{ padding: "12px 18px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 3, color: "var(--muted2)", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}
                >
                  Abandon
                </button>
              </div>
            </div>
          ) : null}

          {phase === "break" ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
              <div style={{ textAlign: "center" }}>
                <div className={markPulse ? "fm-check-pop" : undefined} style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "#60a5fa", marginBottom: 8 }}>Session complete ✓</div>
                <div style={{ fontSize: 13, color: "var(--muted2)" }}>Take a 5-minute break. You've earned it.</div>
              </div>

              <div style={{ position: "relative", width: 180, height: 180 }}>
                <svg width={180} height={180} viewBox="0 0 180 180">
                  <circle cx={90} cy={90} r={70} fill="none" stroke="rgba(96,165,250,0.12)" strokeWidth="5" />
                  <circle
                    cx={90}
                    cy={90}
                    r={70}
                    fill="none"
                    stroke="#60a5fa"
                    strokeWidth="5"
                    strokeDasharray={`${((BREAK_DURATION - breakLeft) / BREAK_DURATION) * (2 * Math.PI * 70)} ${2 * Math.PI * 70}`}
                    strokeLinecap="round"
                    transform="rotate(-90 90 90)"
                    style={{ transition: "stroke-dasharray 1s linear" }}
                  />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, color: "#60a5fa" }}>{formatTime(breakLeft)}</div>
                  <div style={{ fontSize: 10, color: "var(--muted2)", marginTop: 4 }}>Break</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                {!running ? (
                  <button
                    className="fm-ctrl-btn"
                    onClick={startBreakTimer}
                    style={{ padding: "10px 20px", background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.25)", borderRadius: 3, color: "#60a5fa", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}
                  >
                    Start break timer
                  </button>
                ) : null}
                <button
                  className="fm-abandon-btn"
                  onClick={skipBreak}
                  style={{ padding: "10px 18px", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, color: "var(--muted2)", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}
                >
                  Skip break →
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Today's focus</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
              {[
                { label: "Sessions", value: sessionsToday, color: "#a78bfa" },
                { label: "Minutes", value: totalFocusToday, color: "var(--accent)" }
              ].map((stat) => (
                <div key={stat.label} style={{ padding: "12px 14px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 3, background: "rgba(255,255,255,0.01)" }}>
                  <div style={{ fontSize: 9, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>{stat.label}</div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                </div>
              ))}
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 10, color: "var(--muted2)" }}>Daily focus goal</span>
                <span style={{ fontSize: 10, color: totalFocusToday >= 240 ? "var(--accent)" : "var(--muted2)" }}>{Math.round((totalFocusToday / 60) * 10) / 10}h / 4h</span>
              </div>
              <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3 }}>
                <div style={{ height: "100%", width: `${dailyGoalPct}%`, background: "var(--accent)", borderRadius: 3, transition: "width 0.5s ease" }} />
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Completed sessions</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {recentSessions.map((session, index) => {
                const sessionClient = clients.find((entry) => entry.name === session.client);
                return (
                  <div key={`${session.task}-${String(index)}`} style={{ padding: "10px 12px", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 3, background: "rgba(255,255,255,0.01)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 10, color: sessionClient?.color ?? "#a0a0b0" }}>{session.client}</span>
                      <span style={{ fontSize: 10, color: "var(--accent)" }}>{session.duration}m ✓</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#a0a0b0", lineHeight: 1.3 }}>{session.task}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: "auto", padding: "14px", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 3, background: "rgba(255,255,255,0.01)" }}>
            <div style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Focus tips</div>
            {[
              "Close unneeded tabs before starting",
              "Put your phone face-down",
              "One task at a time - no switching",
              "Hydrate between sessions"
            ].map((tip) => (
              <div key={tip} style={{ display: "flex", gap: 6, alignItems: "flex-start", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                <span style={{ fontSize: 9, color: "var(--accent)", marginTop: 3 }}>◆</span>
                <span style={{ fontSize: 11, color: "var(--muted2)", lineHeight: 1.4 }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

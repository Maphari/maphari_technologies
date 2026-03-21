// ════════════════════════════════════════════════════════════════════════════
// focus-mode-page.tsx — Staff Focus Mode (Pomodoro timer)
// Data : GET /staff/clients → StaffClient[]
//        GET /staff/me/top-tasks → StaffTopTask[]
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cx } from "../style";
import { getStaffClients, type StaffClient } from "../../../../lib/api/staff/clients";
import { getStaffTopTasks, type StaffTopTask } from "../../../../lib/api/staff/performance";
import type { AuthSession } from "../../../../lib/auth/session";

// ── Props ─────────────────────────────────────────────────────────────────────

type FocusModePageProps = {
  isActive: boolean;
  session:  AuthSession | null;
};

type Phase = "setup" | "active" | "break";
type CompletedSession = { task: string; client: string; toneIdx: number; duration: number };

// ── Constants ─────────────────────────────────────────────────────────────────

const DURATIONS = [
  { label: "25 min", value: 25 * 60 },
  { label: "45 min", value: 45 * 60 },
  { label: "60 min", value: 60 * 60 },
  { label: "90 min", value: 90 * 60 },
];

const BREAK_DURATION = 5 * 60;
const DAILY_GOAL_MIN = 240; // 4 hours

const FOCUS_TIPS = [
  "Close unneeded tabs before starting",
  "Put your phone face-down",
  "One task at a time — no switching",
  "Hydrate between sessions",
];

const TONE_NAMES = ["Accent", "Purple", "Blue", "Amber", "Orange"] as const;
type ToneName = typeof TONE_NAMES[number];

// ── Helpers ───────────────────────────────────────────────────────────────────

function toneForIdx(idx: number): ToneName { return TONE_NAMES[idx % TONE_NAMES.length]; }
function clientToneClass(t: ToneName)      { return `fmTone${t}`; }
function taskSelToneClass(t: ToneName)     { return `fmTaskSel${t}`; }
function avatarSelToneClass(t: ToneName)   { return `fmAvatar${t}`; }
function progressToneClass(t: ToneName)    { return `fmProgress${t}`; }
function toneColor(t: ToneName)            {
  if (t === "Purple") return "var(--purple)";
  if (t === "Blue")   return "var(--blue)";
  if (t === "Amber")  return "var(--amber)";
  if (t === "Orange") return "var(--orange, var(--amber))";
  return "var(--accent)";
}

function initials(name: string): string {
  const p = name.trim().split(/\s+/);
  if (p.length >= 2) return (p[0][0] + p[p.length - 1][0]).toUpperCase();
  return p[0].slice(0, 2).toUpperCase();
}

function pad(n: number) { return String(n).padStart(2, "0"); }
function formatTime(s: number) { return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`; }

// ── Page component ────────────────────────────────────────────────────────────

export function FocusModePage({ isActive, session }: FocusModePageProps) {
  const [clients, setClients] = useState<StaffClient[]>([]);
  const [tasks, setTasks]     = useState<StaffTopTask[]>([]);

  const [phase, setPhase]               = useState<Phase>("setup");
  const [selectedTask, setSelectedTask] = useState<StaffTopTask | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(DURATIONS[0].value);
  const [timeLeft, setTimeLeft]         = useState(DURATIONS[0].value);
  const [running, setRunning]           = useState(false);
  const [note, setNote]                 = useState("");
  const [sessionsToday, setSessionsToday]     = useState(0);
  const [totalFocusToday, setTotalFocusToday] = useState(0);
  const [completedSessions, setCompletedSessions] = useState<CompletedSession[]>([]);
  const [breakLeft, setBreakLeft]       = useState(BREAK_DURATION);
  const [markPulse, setMarkPulse]       = useState(false);
  const intervalRef = useRef<number | null>(null);
  const mountedRef  = useRef(true);

  // ── Mounted guard — set false on unmount ──────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ── Data loading ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session || !isActive) return;
    let cancelled = false;
    void Promise.all([
      getStaffClients(session),
      getStaffTopTasks(session),
    ]).then(([clientsResult, tasksResult]) => {
      if (cancelled) return;
      if (clientsResult.data) setClients(clientsResult.data);
      if (tasksResult.data)   setTasks(tasksResult.data);
    });
    return () => { cancelled = true; };
  }, [session, isActive]);

  // ── Derived ──────────────────────────────────────────────────────────────
  const toneMap = useMemo(() => {
    const m = new Map<string, number>();
    clients.forEach((c, i) => m.set(c.name, i));
    return m;
  }, [clients]);

  const taskTone = (task: StaffTopTask | null): ToneName =>
    task ? toneForIdx(toneMap.get(task.client) ?? 0) : "Accent";

  // ── Timer logic ───────────────────────────────────────────────────────────
  const totalDuration = selectedDuration;

  useEffect(() => {
    if (!running) return;
    if (phase === "active") {
      intervalRef.current = window.setInterval(() => {
        if (!mountedRef.current) return;
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) window.clearInterval(intervalRef.current);
            if (!mountedRef.current) return 0;
            setRunning(false);
            setPhase("break");
            setBreakLeft(BREAK_DURATION);
            const minutes = Math.round(totalDuration / 60);
            setSessionsToday((v) => v + 1);
            setTotalFocusToday((v) => v + minutes);
            if (selectedTask) {
              const toneIdx = toneMap.get(selectedTask.client) ?? 0;
              setCompletedSessions((prev) => [{ task: selectedTask.title, client: selectedTask.client, toneIdx, duration: minutes }, ...prev]);
            }
            setMarkPulse(true);
            window.setTimeout(() => { if (mountedRef.current) setMarkPulse(false); }, 450);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => { if (intervalRef.current) window.clearInterval(intervalRef.current); };
    }
    if (phase === "break") {
      intervalRef.current = window.setInterval(() => {
        if (!mountedRef.current) return;
        setBreakLeft((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) window.clearInterval(intervalRef.current);
            if (!mountedRef.current) return 0;
            setRunning(false); setPhase("setup"); setSelectedTask(null); setNote(""); setTimeLeft(selectedDuration);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => { if (intervalRef.current) window.clearInterval(intervalRef.current); };
    }
    return undefined;
  }, [phase, running, selectedDuration, selectedTask, totalDuration, toneMap]);

  const start    = () => { setTimeLeft(selectedDuration); setPhase("active"); setRunning(true); };
  const pause    = () => { setRunning(false); if (intervalRef.current) window.clearInterval(intervalRef.current); };
  const resume   = () => setRunning(true);
  const abandon  = () => { if (intervalRef.current) window.clearInterval(intervalRef.current); setRunning(false); setPhase("setup"); setTimeLeft(selectedDuration); setSelectedTask(null); setNote(""); };
  const skipBreak = () => { if (intervalRef.current) window.clearInterval(intervalRef.current); setRunning(false); setPhase("setup"); setTimeLeft(selectedDuration); setSelectedTask(null); setNote(""); setBreakLeft(BREAK_DURATION); };

  const activeTone  = taskTone(selectedTask);
  const ringColor   = phase === "break" ? "var(--blue)" : toneColor(activeTone);
  const ringR       = 80;
  const ringCirc    = 2 * Math.PI * ringR;
  const ringFill    = (phase === "break" ? (BREAK_DURATION - breakLeft) / BREAK_DURATION : (totalDuration - timeLeft) / totalDuration) * ringCirc;
  const pct         = phase === "break" ? Math.round(((BREAK_DURATION - breakLeft) / BREAK_DURATION) * 100) : Math.round(((totalDuration - timeLeft) / totalDuration) * 100);
  const dailyGoalPct = Math.min((totalFocusToday / DAILY_GOAL_MIN) * 100, 100);
  const recentSessions = useMemo(() => completedSessions.slice(0, 8), [completedSessions]);

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-focus-mode">
      <div className={cx("pageHeaderBar", "fmHeaderBar")}>
        <div className={cx("flexBetween", "gap12")}>
          <div>
            <div className={cx("pageEyebrowText", "mb6")}>Staff Dashboard / Focus</div>
            <h1 className={cx("pageTitleText")}>Focus Mode</h1>
          </div>
          <div className={cx("flexRow", "gap20")}>
            {[
              { label: "Sessions today", value: sessionsToday, cls: "colorMuted" },
              { label: "Focus time", value: `${totalFocusToday}m`, cls: "colorAccent" }
            ].map((s) => (
              <div key={s.label} className={cx("textRight")}>
                <div className={cx("statLabelNew", "mb0")}>{s.label}</div>
                <div className={cx("statValueNew", s.cls)}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={cx("fmLayout")}>
        {/* ── Main pane ─────────────────────────────────────────────────── */}
        <div className={cx("fmMainPane")}>
          {phase === "setup" && (
            <div className={cx("fmSetupWrap")}>
              <div className={cx("textCenter")}>
                <div className={cx("fmSetupHeading")}>What are you focusing on?</div>
                <div className={cx("text12", "colorMuted2")}>Pick a task and a duration to begin.</div>
              </div>

              <div>
                <div className={cx("sectionLabel", "mb10")}>Select task</div>
                {tasks.length === 0 ? (
                  <div className={cx("text12", "colorMuted2")}>{session ? "No active tasks assigned." : "Sign in to see your tasks."}</div>
                ) : (
                  <div className={cx("flexCol", "gap6")}>
                    {tasks.map((task) => {
                      const tone = toneForIdx(toneMap.get(task.client) ?? 0);
                      const isSel = selectedTask?.id === task.id;
                      return (
                        <div
                          key={task.id}
                          className={cx("fmTaskOption", "fmTaskRow", isSel && "fmTaskOptionSelected", isSel && taskSelToneClass(tone))}
                          onClick={() => setSelectedTask(isSel ? null : task)}
                        >
                          <div className={cx("fmTaskAvatar", isSel ? avatarSelToneClass(tone) : "fmTaskAvatarIdle")}>{initials(task.client)}</div>
                          <span className={cx("fmTaskTitle", isSel ? "fmTaskTitleSelected" : "fmTaskTitleIdle")}>{task.title}</span>
                          <span className={cx("text10", "colorMuted2", "noShrink")}>{task.project}</span>
                          {isSel && <span className={cx("fmCheck", clientToneClass(tone))}>✓</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <div className={cx("sectionLabel", "mb10")}>Duration</div>
                <div className={cx("staffSegControl", "flexRow", "gap8")} role="group" aria-label="Focus duration">
                  {DURATIONS.map((d) => (
                    <button type="button" key={d.value}
                      className={cx(
                        "staffSegBtn",
                        selectedDuration === d.value ? "staffSegBtnActive" : "",
                        "fmDurBtn",
                        "fmDurPill",
                        selectedDuration === d.value ? "fmDurPillActive" : "fmDurPillIdle"
                      )}
                      onClick={() => { setSelectedDuration(d.value); setTimeLeft(d.value); }}
                      aria-pressed={selectedDuration === d.value}
                    >{d.label}</button>
                  ))}
                </div>
              </div>

              <div>
                <div className={cx("sectionLabel", "mb8")}>Intention <span className={cx("colorMuted2", "fw600")}>Optional</span></div>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What do you want to achieve?" className={cx("fmTextarea", "inputBase", "fmNoteBox", "text12", "wFull")} />
              </div>

              <button type="button" className={cx("fmCtrlBtn", "fmPrimaryBtn", "fmStartBtn")} onClick={start}>Start focus session →</button>
            </div>
          )}

          {phase === "active" && (
            <div className={cx("fmCenterStack")}>
              <div className={cx("fmRingWrap")}>
                <svg width={220} height={220} viewBox="0 0 220 220" className={cx("fmRingSvg")}>
                  <circle cx={110} cy={110} r={ringR} fill="none" className={cx("fmRingTrack")} strokeWidth="6" />
                  <circle cx={110} cy={110} r={ringR} fill="none" stroke={ringColor} className={cx("fmRingProgress", running && "fmRingProgressRunning")} strokeWidth="6" strokeDasharray={`${ringFill} ${ringCirc}`} strokeLinecap="round" transform="rotate(-90 110 110)" />
                </svg>
                <div className={cx("fmRingCenter")}>
                  <div className={cx("staffFocusTimerDisplay", "fmTimerValue")}>{formatTime(timeLeft)}</div>
                  <div className={cx("fmTimerLabel")}>{running ? "Focusing" : "Paused"}</div>
                </div>
              </div>
              {selectedTask && (
                <div className={cx("fmTaskFocusMeta")}>
                  <div className={cx("text10", "uppercase", "tracking", "mb6", clientToneClass(activeTone))}>{selectedTask.client}</div>
                  <div className={cx("fmTaskFocusTitle")}>{selectedTask.title}</div>
                  {note && <div className={cx("text12", "colorMuted2", "mt8")}>&quot;{note}&quot;</div>}
                </div>
              )}
              <progress className={cx("progressMeter", "fmLinearProgress", progressToneClass(activeTone))} max={100} value={pct} />
              <div className={cx("flexRow", "gap12")}>
                <button type="button" className={cx("fmCtrlBtn", "fmPrimaryBtn", "fmControlBtn")} onClick={running ? pause : resume}>{running ? "⏸ Pause" : "▶ Resume"}</button>
                <button type="button" className={cx("fmAbandonBtn", "fmGhostBtn", "fmControlBtn")} onClick={abandon}>Abandon</button>
              </div>
            </div>
          )}

          {phase === "break" && (
            <div className={cx("fmCenterStack", "gap24")}>
              <div className={cx("textCenter")}>
                <div className={cx("fmCompleteTitle", markPulse && "fmCheckPop")}>Session complete ✓</div>
                <div className={cx("text13", "colorMuted2")}>Take a 5-minute break. You&apos;ve earned it.</div>
              </div>
              <div className={cx("fmBreakWrap")}>
                <svg width={180} height={180} viewBox="0 0 180 180">
                  <circle cx={90} cy={90} r={70} fill="none" className={cx("fmBreakTrack")} strokeWidth="5" />
                  <circle cx={90} cy={90} r={70} fill="none" stroke="var(--blue)" className={cx("fmBreakRingProgress")} strokeWidth="5" strokeDasharray={`${((BREAK_DURATION - breakLeft) / BREAK_DURATION) * (2 * Math.PI * 70)} ${2 * Math.PI * 70}`} strokeLinecap="round" transform="rotate(-90 90 90)" />
                </svg>
                <div className={cx("fmBreakCenter")}>
                  <div className={cx("staffFocusTimerDisplay", "fmBreakValue")}>{formatTime(breakLeft)}</div>
                  <div className={cx("fmBreakLabel")}>Break</div>
                </div>
              </div>
              <div className={cx("flexRow", "gap10")}>
                {!running && <button type="button" className={cx("fmCtrlBtn", "fmBreakBtn")} onClick={() => { setBreakLeft(BREAK_DURATION); setRunning(true); }}>Start break timer</button>}
                <button type="button" className={cx("fmAbandonBtn", "fmGhostBtn", "fmControlBtn")} onClick={skipBreak}>Skip break →</button>
              </div>
            </div>
          )}
        </div>

        {/* ── Side pane ─────────────────────────────────────────────────── */}
        <div className={cx("fmSidePane")}>
          <div>
            <div className={cx("sectionLabel", "mb12")}>Today&apos;s focus</div>
            <div className={cx("fmSideGrid", "mb14")}>
              {[{ label: "Sessions", value: sessionsToday, cls: "colorPurple" }, { label: "Minutes", value: totalFocusToday, cls: "colorAccent" }].map((s) => (
                <div key={s.label} className={cx("fmSideStatCard")}>
                  <div className={cx("text10", "colorMuted2", "uppercase", "mb4")}>{s.label}</div>
                  <div className={cx("fontDisplay", "fw800", "text20", s.cls)}>{s.value}</div>
                </div>
              ))}
            </div>
            <div>
              <div className={cx("fmGoalRow")}>
                <span className={cx("text10", "colorMuted2")}>Daily focus goal</span>
                <span className={cx("text10", totalFocusToday >= DAILY_GOAL_MIN ? "colorAccent" : "colorMuted2")}>{Math.round((totalFocusToday / 60) * 10) / 10}h / 4h</span>
              </div>
              <progress className={cx("progressMeter", "progressMeterAccent", "fmGoalProgress")} max={100} value={dailyGoalPct} />
            </div>
          </div>

          <div>
            <div className={cx("sectionLabel", "mb12")}>Completed sessions</div>
            <div className={cx("fmSessionList")}>
              {recentSessions.length === 0 ? (
                <div className={cx("text11", "colorMuted2")}>No sessions completed yet.</div>
              ) : (
                recentSessions.map((s, i) => (
                  <div key={`${s.task}-${i}`} className={cx("fmSessionCard")}>
                    <div className={cx("fmSessionTop")}>
                      <span className={cx("text10", clientToneClass(toneForIdx(s.toneIdx)))}>{s.client}</span>
                      <span className={cx("text10", "colorAccent")}>{s.duration}m ✓</span>
                    </div>
                    <div className={cx("fmSessionTask")}>{s.task}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={cx("fmTipsCard")}>
            <div className={cx("sectionLabel", "mb8")}>Focus tips</div>
            {FOCUS_TIPS.map((tip, i) => (
              <div key={tip} className={cx("fmTipRow", i === FOCUS_TIPS.length - 1 && "fmTipRowLast")}>
                <span className={cx("fmTipBullet")}>◆</span>
                <span className={cx("fmTipText")}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

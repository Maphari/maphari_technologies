"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cx } from "../style";

type ClientRow = { id: number; name: string; avatar: string; color: string };
type TaskItem = { id: number; clientId: number; title: string; estimate: number };
type Phase = "setup" | "active" | "break";

const clients: ClientRow[] = [
  { id: 1, name: "Volta Studios", avatar: "VS", color: "var(--accent)" },
  { id: 2, name: "Kestrel Capital", avatar: "KC", color: "var(--purple)" },
  { id: 3, name: "Mira Health", avatar: "MH", color: "var(--blue)" },
  { id: 4, name: "Dune Collective", avatar: "DC", color: "var(--amber)" },
  { id: 5, name: "Okafor & Sons", avatar: "OS", color: "var(--amber)" }
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
const FOCUS_TIPS = ["Close unneeded tabs before starting", "Put your phone face-down", "One task at a time - no switching", "Hydrate between sessions"];

function clientToneClass(clientId?: number | null) {
  if (clientId === 1) return "fmToneAccent";
  if (clientId === 2) return "fmTonePurple";
  if (clientId === 3) return "fmToneBlue";
  if (clientId === 4) return "fmToneAmber";
  if (clientId === 5) return "fmToneOrange";
  return "colorMuted2";
}

function taskSelectedToneClass(clientId?: number | null) {
  if (clientId === 1) return "fmTaskSelAccent";
  if (clientId === 2) return "fmTaskSelPurple";
  if (clientId === 3) return "fmTaskSelBlue";
  if (clientId === 4) return "fmTaskSelAmber";
  if (clientId === 5) return "fmTaskSelOrange";
  return undefined;
}

function avatarSelectedToneClass(clientId?: number | null) {
  if (clientId === 1) return "fmAvatarAccent";
  if (clientId === 2) return "fmAvatarPurple";
  if (clientId === 3) return "fmAvatarBlue";
  if (clientId === 4) return "fmAvatarAmber";
  if (clientId === 5) return "fmAvatarOrange";
  return undefined;
}

function progressToneClass(clientId?: number | null) {
  if (clientId === 2) return "fmProgressPurple";
  if (clientId === 3) return "fmProgressBlue";
  if (clientId === 4) return "fmProgressAmber";
  if (clientId === 5) return "fmProgressOrange";
  return "fmProgressAccent";
}

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
  const ringColor = phase === "break" ? "var(--blue)" : client?.color ?? "var(--accent)";
  const dailyGoalPct = Math.min((totalFocusToday / 240) * 100, 100);

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
            { label: "Sessions today", value: sessionsToday, valueClass: "colorMuted" },
            { label: "Focus time", value: `${totalFocusToday}m`, valueClass: "colorAccent" }
          ].map((stat) => (
            <div key={stat.label} className={cx("textRight")}>
              <div className={cx("statLabelNew", "mb0")}>{stat.label}</div>
              <div className={cx("statValueNew", stat.valueClass)}>{stat.value}</div>
            </div>
          ))}
          </div>
        </div>
      </div>

      <div className={cx("fmLayout")}>
        <div className={cx("fmMainPane")}>
          {phase === "setup" ? (
            <div className={cx("fmSetupWrap")}>
              <div className={cx("textCenter")}>
                <div className={cx("fmSetupHeading")}>What are you focusing on?</div>
                <div className={cx("text12", "colorMuted2")}>Pick a task and a duration to begin.</div>
              </div>

              <div>
                <div className={cx("sectionLabel", "mb10")}>Select task</div>
                <div className={cx("flexCol", "gap6")}>
                  {taskPool.map((task) => {
                    const taskClient = clients.find((entry) => entry.id === task.clientId);
                    const isSelected = selectedTask?.id === task.id;
                    return (
                      <div
                        key={task.id}
                        className={cx("fmTaskOption", "fmTaskRow", isSelected && "fmTaskOptionSelected", isSelected && taskSelectedToneClass(task.clientId))}
                        onClick={() => setSelectedTask(isSelected ? null : task)}
                      >
                        <div className={cx("fmTaskAvatar", isSelected ? avatarSelectedToneClass(task.clientId) : "fmTaskAvatarIdle")}>{taskClient?.avatar}</div>
                        <span className={cx("fmTaskTitle", isSelected ? "fmTaskTitleSelected" : "fmTaskTitleIdle")}>{task.title}</span>
                        <span className={cx("text10", "colorMuted2", "noShrink")}>{task.estimate}m</span>
                        {isSelected ? <span className={cx("fmCheck", clientToneClass(taskClient?.id))}>✓</span> : null}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className={cx("sectionLabel", "mb10")}>Duration</div>
                <div className={cx("flexRow", "gap8")}>
                  {DURATIONS.map((duration) => (
                    <button type="button"
                      key={duration.value}
                      className={cx("fmDurBtn", "fmDurPill", selectedDuration === duration.value ? "fmDurPillActive" : "fmDurPillIdle")}
                      onClick={() => {
                        setSelectedDuration(duration.value);
                        setTimeLeft(duration.value);
                      }}
                    >
                      {duration.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className={cx("sectionLabel", "mb8")}>
                  Intention <span className={cx("colorMuted2", "fw600")}>Optional</span>
                </div>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="What do you want to achieve in this session?"
                  className={cx("fmTextarea", "inputBase", "fmNoteBox", "text12", "wFull")}
                />
              </div>

              <button type="button" className={cx("fmCtrlBtn", "fmPrimaryBtn", "fmStartBtn")} onClick={start}>
                Start focus session →
              </button>
            </div>
          ) : null}

          {phase === "active" ? (
            <div className={cx("fmCenterStack")}>
              <div className={cx("fmRingWrap")}>
                <svg width={220} height={220} viewBox="0 0 220 220" className={cx("fmRingSvg")}>
                  <circle cx={110} cy={110} r={ringR} fill="none" className={cx("fmRingTrack")} strokeWidth="6" />
                  <circle
                    cx={110}
                    cy={110}
                    r={ringR}
                    fill="none"
                    stroke={ringColor}
                    className={cx("fmRingProgress", running && "fmRingProgressRunning")}
                    strokeWidth="6"
                    strokeDasharray={`${ringDash} ${ringCirc}`}
                    strokeLinecap="round"
                    transform="rotate(-90 110 110)"
                  />
                </svg>
                <div className={cx("fmRingCenter")}>
                  <div className={cx("fmTimerValue")}>{formatTime(timeLeft)}</div>
                  <div className={cx("fmTimerLabel")}>{running ? "Focusing" : "Paused"}</div>
                </div>
              </div>

              {selectedTask ? (
                <div className={cx("fmTaskFocusMeta")}>
                  <div className={cx("text10", "uppercase", "tracking", "mb6", clientToneClass(client?.id))}>{client?.name}</div>
                  <div className={cx("fmTaskFocusTitle")}>{selectedTask.title}</div>
                  {note ? <div className={cx("text12", "colorMuted2", "mt8")}>&quot;{note}&quot;</div> : null}
                </div>
              ) : null}

              <progress className={cx("progressMeter", "fmLinearProgress", progressToneClass(client?.id))} max={100} value={pct} />

              <div className={cx("flexRow", "gap12")}>
                <button type="button" className={cx("fmCtrlBtn", "fmPrimaryBtn", "fmControlBtn")} onClick={running ? pause : resume}>
                  {running ? "⏸ Pause" : "▶ Resume"}
                </button>
                <button type="button" className={cx("fmAbandonBtn", "fmGhostBtn", "fmControlBtn")} onClick={abandon}>
                  Abandon
                </button>
              </div>
            </div>
          ) : null}

          {phase === "break" ? (
            <div className={cx("fmCenterStack", "gap24")}>
              <div className={cx("textCenter")}>
                <div className={cx("fmCompleteTitle", markPulse && "fmCheckPop")}>Session complete ✓</div>
                <div className={cx("text13", "colorMuted2")}>Take a 5-minute break. You&apos;ve earned it.</div>
              </div>

              <div className={cx("fmBreakWrap")}>
                <svg width={180} height={180} viewBox="0 0 180 180">
                  <circle cx={90} cy={90} r={70} fill="none" className={cx("fmBreakTrack")} strokeWidth="5" />
                  <circle
                    cx={90}
                    cy={90}
                    r={70}
                    fill="none"
                    stroke="var(--blue)"
                    className={cx("fmBreakRingProgress")}
                    strokeWidth="5"
                    strokeDasharray={`${((BREAK_DURATION - breakLeft) / BREAK_DURATION) * (2 * Math.PI * 70)} ${2 * Math.PI * 70}`}
                    strokeLinecap="round"
                    transform="rotate(-90 90 90)"
                  />
                </svg>
                <div className={cx("fmBreakCenter")}>
                  <div className={cx("fmBreakValue")}>{formatTime(breakLeft)}</div>
                  <div className={cx("fmBreakLabel")}>Break</div>
                </div>
              </div>

              <div className={cx("flexRow", "gap10")}>
                {!running ? (
                  <button type="button" className={cx("fmCtrlBtn", "fmBreakBtn")} onClick={startBreakTimer}>
                    Start break timer
                  </button>
                ) : null}
                <button type="button" className={cx("fmAbandonBtn", "fmGhostBtn", "fmControlBtn")} onClick={skipBreak}>
                  Skip break →
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className={cx("fmSidePane")}>
          <div>
            <div className={cx("sectionLabel", "mb12")}>Today&apos;s focus</div>
            <div className={cx("fmSideGrid", "mb14")}>
              {[
                { label: "Sessions", value: sessionsToday, color: "var(--purple)" },
                { label: "Minutes", value: totalFocusToday, color: "var(--accent)" }
              ].map((stat) => (
                <div key={stat.label} className={cx("fmSideStatCard")}>
                  <div className={cx("text10", "colorMuted2", "uppercase", "mb4")}>{stat.label}</div>
                  <div className={cx("fontDisplay", "fw800", "text20", stat.label === "Sessions" ? "colorPurple" : "colorAccent")}>{stat.value}</div>
                </div>
              ))}
            </div>

            <div>
              <div className={cx("fmGoalRow")}>
                <span className={cx("text10", "colorMuted2")}>Daily focus goal</span>
                <span className={cx("text10", totalFocusToday >= 240 ? "colorAccent" : "colorMuted2")}>{Math.round((totalFocusToday / 60) * 10) / 10}h / 4h</span>
              </div>
              <progress className={cx("progressMeter", "progressMeterAccent", "fmGoalProgress")} max={100} value={dailyGoalPct} />
            </div>
          </div>

          <div>
            <div className={cx("sectionLabel", "mb12")}>Completed sessions</div>
            <div className={cx("fmSessionList")}>
              {recentSessions.map((session, index) => {
                const sessionClient = clients.find((entry) => entry.name === session.client);
                return (
                  <div key={`${session.task}-${String(index)}`} className={cx("fmSessionCard")}>
                    <div className={cx("fmSessionTop")}>
                      <span className={cx("text10", clientToneClass(sessionClient?.id))}>{session.client}</span>
                      <span className={cx("text10", "colorAccent")}>{session.duration}m ✓</span>
                    </div>
                    <div className={cx("fmSessionTask")}>{session.task}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={cx("fmTipsCard")}>
            <div className={cx("sectionLabel", "mb8")}>Focus tips</div>
            {FOCUS_TIPS.map((tip, index) => (
              <div key={tip} className={cx("fmTipRow", index === FOCUS_TIPS.length - 1 && "fmTipRowLast")}>
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

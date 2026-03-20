// ════════════════════════════════════════════════════════════════════════════
// daily-standup-page.tsx — Staff Daily Standup
// Data     : loadMyStandupsWithRefresh → GET /standup
//            postStandupWithRefresh    → POST /standup
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useState, useEffect, useMemo } from "react";
import { cx } from "../style";
import { AutomationBanner } from "../../../shared/automation-banner";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadMyStandupsWithRefresh,
  postStandupWithRefresh,
  type StaffStandupEntry,
} from "../../../../lib/api/staff";
import { getStaffTopTasks } from "../../../../lib/api/staff/performance";

// ── Icons ─────────────────────────────────────────────────────────────────────
function IcoCheck() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IcoArrow() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2 7h9M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IcoDiamond() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M6 1L11 6L6 11L1 6Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const today = new Date().toLocaleDateString("en-ZA", { weekday: "long", month: "short", day: "numeric" });

function formatStandupDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" });
  } catch {
    return iso;
  }
}

function formatStandupTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

type TopTask = {
  id: string;
  text: string;
  client: string;
  done: boolean;
};

const moodLabels           = ["", "Rough", "Slow", "Okay", "Good", "Firing"];
const moodToneClasses      = ["dsToneMuted2", "dsMoodTone1", "dsMoodTone2", "dsMoodTone3", "dsMoodTone4", "dsMoodTone5"];
const moodDotClasses       = ["dsMoodDot0",   "dsMoodDot1",  "dsMoodDot2",  "dsMoodDot3",  "dsMoodDot4",  "dsMoodDot5"];
const moodBarClasses       = ["dsMoodBar0",   "dsMoodBar1",  "dsMoodBar2",  "dsMoodBar3",  "dsMoodBar4",  "dsMoodBar5"];
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

// ── Component ─────────────────────────────────────────────────────────────────
export function DailyStandupPage({ isActive, session }: { isActive: boolean; session: AuthSession | null }) {
  const [standups,   setStandups]   = useState<StaffStandupEntry[]>([]);
  const [submitted,  setSubmitted]  = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mood,       setMood]       = useState(0);
  const [hours,      setHours]      = useState("");
  const [fields,     setFields]     = useState({ yesterday: "", today_plan: "", blockers: "" });
  const [tasks,          setTasks]          = useState<TopTask[]>([]);
  const [topTaskLoading, setTopTaskLoading] = useState(true);
  const [flagAdmin,      setFlagAdmin]      = useState(false);
  const [view,       setView]       = useState<"log" | "history">("log");

  useEffect(() => {
    if (!session) return;
    void loadMyStandupsWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) setStandups(r.data);
    });
  }, [session]);

  // ── Load top-3 tasks ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!session) { setTopTaskLoading(false); return; }
    let cancelled = false;
    setTopTaskLoading(true);
    void getStaffTopTasks(session).then((r) => {
      if (cancelled) return;
      if (r.data) {
        setTasks(
          r.data.slice(0, 3).map((t) => ({
            id: t.id,
            text: t.title,
            client: t.client,
            done: false
          }))
        );
      }
    }).catch(() => {
      // keep previous tasks on error
    }).finally(() => {
      if (!cancelled) setTopTaskLoading(false);
    });
    return () => { cancelled = true; };
  }, [session]);

  const canSubmit    = mood > 0 && fields.yesterday.trim().length > 0 && fields.today_plan.trim().length > 0;
  const pastSelected = standups.find((s) => s.id === selectedId) ?? null;

  const todayIso = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const hasSubmittedToday = submitted || standups.some((s) => {
    // s.date may be a full ISO string like "2026-03-18T00:00:00.000Z" or just "2026-03-18"
    return s.date.slice(0, 10) === todayIso;
  });

  const streakSummary = useMemo(
    () => ({ days: standups.length, hours: 0 }),
    [standups.length]
  );

  async function handleSubmit() {
    if (session) {
      const r = await postStandupWithRefresh(session, {
        yesterday: fields.yesterday,
        today:     fields.today_plan,
        blockers:  fields.blockers || undefined,
      });
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) setStandups((prev) => [r.data!, ...prev]);
    }
    setSubmitted(true);
  }

  return (
    <section className={cx("page", "pageBody", "rdStudioPage", isActive && "pageActive")} id="page-standup">
      {/* ── Page header ── */}
      <div className={cx("pageHeaderBar", "borderB", "pb0", "mb16")}>
        <div className={cx("flexBetween", "gap24", "mb24")}>
          <div>
            <div className={cx("pageEyebrow")}>Staff Dashboard / Daily Rhythm</div>
            <h1 className={cx("pageTitle")}>Daily Standup</h1>
            <div className={cx("text12", "colorMuted2", "mt6")}>{today}</div>
          </div>
          <div className={cx("flexRow", "gap16")}>
            {hasSubmittedToday ? (
              <div className={cx("dsSubmittedBadge")}>
                <span className={cx("colorAccent", "text12")}>
                  <IcoCheck /> Submitted {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        <div className={cx("flexRow")}>
          {[{ key: "log", label: "Today's Log" }, { key: "history", label: "Past Standups" }].map((tab) => (
            <button
              type="button"
              key={tab.key}
              className={cx("dsTabBtn", view === tab.key && "dsTabBtnActive")}
              onClick={() => setView(tab.key as "log" | "history")}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Automation: auto-fill from top tasks ─────────────────────── */}
      {view === "log" && !hasSubmittedToday && tasks.length > 0 && !fields.today_plan && (
        <AutomationBanner
          show={true}
          variant="info"
          icon={
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M2 4h12M2 8h8M2 12h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          }
          title="Auto-fill today's plan from your top tasks"
          description={`${tasks.length} prioritised task${tasks.length > 1 ? "s" : ""} found — pre-fill the plan so you only need to add yesterday's progress.`}
          actionLabel="Auto-fill"
          onAction={async () => {
            const plan = tasks.map((t) => `• ${t.text}${t.client ? ` (${t.client})` : ""}`).join("\n");
            setFields((prev) => ({ ...prev, today_plan: prev.today_plan || plan }));
          }}
          dismissKey={`staff:standup-autofill:${new Date().toDateString()}`}
        />
      )}

      {/* ── Today's Log ── */}
      {view === "log" ? (
        <div className={cx("dsLogGrid")}>
          {/* Left: form */}
          <div className={cx("dsLogLeft")}>
            {hasSubmittedToday ? (
              <div className={cx("dsSubmittedState")}>
                <div className={cx("dsSubmittedIcon")}><IcoCheck /></div>
                <div className={cx("fontDisplay", "fw800", "colorAccent", "dsSubmittedTitle")}>Standup submitted</div>
                <div className={cx("text12", "colorMuted2", "mb32")}>Your team can see today&apos;s update. Admin notified.</div>
                <button type="button" className={cx("dsEditBtn")} onClick={() => setSubmitted(false)}>
                  Edit submission
                </button>
              </div>
            ) : (
              <div className={cx("flexCol", "gap22", "dsFormWrap")}>
                <div>
                  <label className={cx("dsFormLabel", "rdStudioLabel")}>What did you complete yesterday?</label>
                  <textarea
                    value={fields.yesterday}
                    onChange={(event) => setFields((prev) => ({ ...prev, yesterday: event.target.value }))}
                    placeholder="e.g. Finished logo revisions, drafted campaign intro for client review..."
                    className={cx("dsTextarea")}
                  />
                </div>

                <div>
                  <label className={cx("dsFormLabel", "rdStudioLabel")}>What&apos;s your focus today?</label>
                  <textarea
                    value={fields.today_plan}
                    onChange={(event) => setFields((prev) => ({ ...prev, today_plan: event.target.value }))}
                    placeholder="e.g. Finalise KPI framework, begin wireframe revisions for the team..."
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
                    onChange={(event) => setFields((prev) => ({ ...prev, blockers: event.target.value }))}
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
                      <button
                        type="button"
                        key={value}
                        className={cx("dsMoodBtn", mood === value && moodActiveBtnClasses[value])}
                        onClick={() => setMood(value)}
                      >
                        <MoodDot value={value} size={8} />
                        <span className={cx("dsMoodLabel", mood === value ? moodToneClasses[value] : "dsToneMuted2")}>
                          {moodLabels[value]}
                        </span>
                      </button>
                    ))}
                    {mood > 0 ? (
                      <span className={cx("text12", moodToneClasses[mood], "dsMoodCurrent")}>{moodLabels[mood]}</span>
                    ) : null}
                  </div>
                </div>

                <div className={cx("flexRow", "gap12")}>
                  <div
                    onClick={() => setFlagAdmin((prev) => !prev)}
                    className={cx("dsFlagCheck", flagAdmin ? "dsFlagCheckActive" : "dsFlagCheckIdle")}
                  >
                    {flagAdmin ? <IcoCheck /> : null}
                  </div>
                  <div>
                    <div className={cx("text12", flagAdmin ? "dsToneRed" : "colorMuted")}>Flag for admin attention</div>
                    <div className={cx("text10", "colorMuted2")}>Admin will see this standup highlighted</div>
                  </div>
                </div>

                <button
                  type="button"
                  className={cx("dsSubmitBtn")}
                  disabled={!canSubmit}
                  onClick={() => void handleSubmit()}
                >
                  Submit Standup{" "}
                  <span className={cx("inlineFlex", "ml4")}>
                    <IcoArrow />
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Right: tasks + week grid + mood chart */}
          <div className={cx("dsLogRight")}>
            <div className={cx("dsSectionLabel", "mb16", "rdStudioSection")}>Today&apos;s Top 3</div>
            <div className={cx("flexCol", "gap8", "mb24")}>
              {topTaskLoading ? (
                <div className={cx("text12", "colorMuted2")}>Loading tasks…</div>
              ) : tasks.length === 0 ? (
                <div className={cx("text12", "colorMuted2")}>No active tasks assigned.</div>
              ) : (
                tasks.map((task, index) => (
                  <div key={task.id} className={cx("dsTaskCard", task.done && "dsTaskCardDone")}>
                    <div
                      className={cx("dsTaskCheck", task.done ? "dsTaskCheckDone" : "dsTaskCheckIdle")}
                      onClick={() =>
                        setTasks((prev) =>
                          prev.map((item) => (item.id === task.id ? { ...item, done: !item.done } : item))
                        )
                      }
                    >
                      {task.done ? <IcoCheck /> : null}
                    </div>
                    <div className={cx("flex1", "minW0")}>
                      <div className={cx("text12", "dsTaskText", task.done && "dsTaskTextDone")}>{task.text}</div>
                      <div className={cx("text10", "colorMuted2", "mt4")}>{task.client}</div>
                    </div>
                    <span className={cx("text10", "colorMuted2", "noShrink")}>{index + 1}</span>
                  </div>
                ))
              )}
            </div>

            <div className={cx("mb24")}>
              <div className={cx("dsSectionLabel", "mb12", "rdStudioSection")}>This Week</div>
              <div className={cx("flexRow", "gap6")}>
                {["M", "T", "W", "T", "F"].map((label, index) => {
                  const done    = index < 4;
                  const isToday = index === 0;
                  return (
                    <div
                      key={index}
                      className={cx(
                        "dsWeekDay",
                        isToday ? "dsWeekDayToday" : done ? "dsWeekDayDone" : "dsWeekDayIdle"
                      )}
                    >
                      <span className={cx("dsWeekDayLabel", done ? "dsToneAccent" : "dsToneMuted2")}>{label}</span>
                      {done ? <div className={cx("dsWeekDayDot")} /> : null}
                    </div>
                  );
                })}
              </div>
              <div className={cx("text10", "colorMuted2", "mt8")}>
                {streakSummary.days} day streak — {streakSummary.hours} hrs this week
              </div>
            </div>

            <div>
              <div className={cx("dsSectionLabel", "mb12", "rdStudioSection")}>Recent Mood</div>
              <div className={cx("dsMoodChart")}>
                {standups.map((entry, index) => (
                  <div key={index} className={cx("dsMoodChartCol")}>
                    <div className={cx("dsMoodChartBar", "dsMoodBar0")} />
                    <span className={cx("dsMoodChartLabel")}>
                      {formatStandupDate(entry.date).split(",")[0]}
                    </span>
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
        /* ── Past Standups ── */
        <div className={cx("dsHistoryGrid", pastSelected && "dsHistoryGridWithDetail")}>
          <div className={cx("dsHistoryLeft")}>
            <div className={cx("flexCol", "gap10")}>
              {standups.length === 0 ? (
                <div className={cx("text12", "colorMuted2")}>No past standups found.</div>
              ) : null}
              {standups.map((entry) => (
                <div
                  key={entry.id}
                  className={cx("dsHistoryCard", selectedId === entry.id && "dsHistoryCardActive")}
                  onClick={() => setSelectedId(selectedId === entry.id ? null : entry.id)}
                >
                  <div className={cx("flexBetween", "mb8")}>
                    <div className={cx("flexRow", "gap12")}>
                      <span className={cx("fontDisplay", "fw700", "colorText", "text14")}>
                        {formatStandupDate(entry.date)}
                      </span>
                      <span className={cx("text10", "colorMuted2")}>
                        submitted {formatStandupTime(entry.createdAt)}
                      </span>
                    </div>
                    <div className={cx("flexRow", "gap12")}>
                      {entry.blockers ? (
                        <span className={cx("text10", "dsToneRed")}>Has blockers</span>
                      ) : (
                        <span className={cx("text10", "colorMuted2")}>No blockers</span>
                      )}
                    </div>
                  </div>
                  <div className={cx("text12", "colorMuted2", "truncate", "dsHistoryExcerpt")}>
                    {entry.yesterday}
                  </div>
                  {entry.blockers !== null && entry.blockers.trim() !== "" ? (
                    <div className={cx("dsHistoryBlocker")}>
                      <span className={cx("inlineFlex", "gap4")}>
                        <IcoDiamond /> {entry.blockers}
                      </span>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {/* ── Detail pane ── */}
          {pastSelected ? (
            <div className={cx("dsHistoryDetail")}>
              <div>
                <div className={cx("fontDisplay", "fw800", "colorText", "dsHistoryDetailTitle")}>
                  {formatStandupDate(pastSelected.date)}
                </div>
                <div className={cx("text11", "colorMuted2", "mt4")}>
                  Submitted at {formatStandupTime(pastSelected.createdAt)}
                </div>
              </div>

              {[
                { label: "Completed yesterday", value: pastSelected.yesterday,           warn: false },
                { label: "Today's plan",         value: pastSelected.today,               warn: false },
                {
                  label: "Blockers",
                  value: pastSelected.blockers ?? "None",
                  warn:  pastSelected.blockers !== null && pastSelected.blockers.trim() !== "",
                },
              ].map((item) => (
                <div key={item.label}>
                  <div className={cx("dsSectionLabel", "mb8", "rdStudioLabel")}>{item.label}</div>
                  <div className={cx(item.warn ? "dsHistoryBlockerCard" : "dsHistoryTextCard")}>{item.value}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

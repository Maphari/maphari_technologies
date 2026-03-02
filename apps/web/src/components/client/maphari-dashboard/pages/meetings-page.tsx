"use client";

import { useEffect, useMemo, useState } from "react";
import { cx, styles } from "../style";

type TimeTab = "Overview" | "Time Log" | "By Team Member" | "Weekly Summary";

type PhaseRow = {
  name: string;
  budgeted: number;
  logged: number;
  color: string;
};

type LogRow = {
  av: string;
  color: string;
  task: string;
  phase: string;
  hours: string;
  date: string;
};

type WeeklyRow = {
  week: string;
  hours: number;
};

type TeamHoursRow = {
  av: string;
  color: string;
  name: string;
  role: string;
  hours: number;
  percent: number;
};

const TABS: TimeTab[] = ["Overview", "Time Log", "By Team Member", "Weekly Summary"];

const PHASES: PhaseRow[] = [
  { name: "Discovery & Strategy", budgeted: 20, logged: 20, color: "var(--green)" },
  { name: "Brand Identity", budgeted: 40, logged: 38, color: "var(--accent)" },
  { name: "UI/UX Design", budgeted: 60, logged: 22, color: "var(--purple)" },
  { name: "Frontend Development", budgeted: 80, logged: 0, color: "var(--blue)" },
  { name: "QA & Testing", budgeted: 20, logged: 0, color: "var(--amber)" },
  { name: "Launch & Handover", budgeted: 10, logged: 0, color: "var(--muted2)" },
];

const LOGS: LogRow[] = [
  { av: "SN", color: "#c8f135", task: "Homepage design — hero section iterations", phase: "UI/UX Design", hours: "3.5h", date: "Today" },
  { av: "LM", color: "#8b6fff", task: "Brand guidelines document — final polish", phase: "Brand Identity", hours: "2.0h", date: "Today" },
  { av: "SN", color: "#c8f135", task: "Dashboard UI wireframes", phase: "UI/UX Design", hours: "4.0h", date: "Yesterday" },
  { av: "TK", color: "#3dd9d6", task: "QA environment setup", phase: "UI/UX Design", hours: "1.5h", date: "Yesterday" },
  { av: "SN", color: "#c8f135", task: "Client discovery workshop facilitation", phase: "Discovery & Strategy", hours: "3.0h", date: "Jan 14" },
  { av: "LM", color: "#8b6fff", task: "Logo concepts — 3 directions", phase: "Brand Identity", hours: "6.0h", date: "Jan 20" },
  { av: "JM", color: "#f5a623", task: "Hosting & domain configuration", phase: "Discovery & Strategy", hours: "2.0h", date: "Jan 12" },
];

const WEEKLY: WeeklyRow[] = [
  { week: "Feb 17–21", hours: 22.5 },
  { week: "Feb 10–14", hours: 31.0 },
  { week: "Feb 3–7", hours: 18.5 },
  { week: "Jan 27–31", hours: 24.0 },
  { week: "Jan 20–24", hours: 28.5 },
];

const TEAM_HOURS: TeamHoursRow[] = [
  { av: "SN", color: "#c8f135", name: "Sipho Ndlovu", role: "Project Lead / Design", hours: 38, percent: 72 },
  { av: "LM", color: "#8b6fff", name: "Lerato Mokoena", role: "Brand Designer", hours: 22, percent: 55 },
  { av: "TK", color: "#3dd9d6", name: "Thabo Khumalo", role: "QA Engineer", hours: 10, percent: 18 },
  { av: "JM", color: "#f5a623", name: "James Mahlangu", role: "Frontend Dev", hours: 10, percent: 10 },
];

function phaseStatus(logged: number, budgeted: number): { label: string; cls: string } {
  if (logged === 0) return { label: "Not started", cls: "badgeMuted" };
  if (logged >= budgeted) return { label: "Complete", cls: "badgeGreen" };
  return { label: "In progress", cls: "badgeAccent" };
}

export function MeetingsPage() {
  const [tab, setTab] = useState<TimeTab>("Overview");
  const [toast, setToast] = useState<{ title: string; subtitle: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const totalBudgeted = useMemo(() => PHASES.reduce((sum, phase) => sum + phase.budgeted, 0), []);
  const totalLogged = useMemo(() => PHASES.reduce((sum, phase) => sum + phase.logged, 0), []);
  const progressPct = Math.round((totalLogged / totalBudgeted) * 100);

  function notify(title: string, subtitle: string): void {
    setToast({ title, subtitle });
  }

  return (
    <div className={cx("pageBody", styles.timeTrackRoot)}>
      <div className={styles.timeTrackLayout}>
        <aside className={styles.timeTrackSidebar}>
          <div className={styles.timeTrackSection}>Time</div>
          {TABS.map((item, idx) => (
            <button
              key={item}
              type="button"
              className={cx(styles.timeTrackSideItem, tab === item && styles.timeTrackSideItemActive)}
              onClick={() => setTab(item)}
            >
              <span
                className={styles.timeTrackDot}
                style={{
                  background:
                    idx === 0
                      ? "var(--accent)"
                      : idx === 1
                        ? "var(--purple)"
                        : idx === 2
                          ? "var(--blue)"
                          : "var(--amber)",
                }}
              />
              <span>{item}</span>
            </button>
          ))}

          <div className={styles.timeTrackDivider} />
          <div className={styles.timeTrackProgressCard}>
            <div className={styles.timeTrackProgressTitle}>Total Progress</div>
            <div className={styles.timeTrackProgressTrack}>
              <div className={styles.timeTrackProgressFill} style={{ width: `${progressPct}%` }} />
            </div>
            <div className={styles.timeTrackProgressMeta}>
              <span>{totalLogged}h logged</span>
              <span>{progressPct}%</span>
            </div>
          </div>
        </aside>

        <section className={styles.timeTrackMain}>
          <div className={cx("pageHeader", "mb0")}>
            <div>
              <div className={cx("pageEyebrow")}>Veldt Finance · Time</div>
              <h1 className={cx("pageTitle")}>Time Tracking</h1>
              <p className={cx("pageSub")}>
                Full transparency on every hour worked — by phase, by person, and by task.
              </p>
            </div>
            <div className={cx("pageActions")}>
              <button
                type="button"
                className={cx("btnSm", "btnGhost")}
                onClick={() => notify("Report exported", "Time report downloaded as CSV")}
              >
                Export CSV
              </button>
            </div>
          </div>

          <div className={styles.timeTrackTabs}>
            {TABS.map((item) => (
              <button
                key={item}
                type="button"
                className={cx(styles.timeTrackTab, tab === item && styles.timeTrackTabActive)}
                onClick={() => setTab(item)}
              >
                {item}
              </button>
            ))}
          </div>

          {tab === "Overview" ? (
            <div className={styles.timeTrackContent}>
              <div className={styles.timeTrackStats}>
                {[
                  { value: `${totalLogged}h`, label: "Hours Logged", sub: `of ${totalBudgeted}h budgeted`, color: "var(--accent)" },
                  { value: `${totalBudgeted - totalLogged}h`, label: "Hours Remaining", sub: "across all phases", color: "var(--muted)" },
                  { value: "4", label: "Team Members", sub: "actively logging time", color: "var(--purple)" },
                  { value: "22.5h", label: "This Week", sub: "logged Feb 17–21", color: "var(--green)" },
                ].map((stat) => (
                  <div key={stat.label} className={styles.timeTrackStat}>
                    <div className={styles.timeTrackStatVal} style={{ color: stat.color }}>
                      {stat.value}
                    </div>
                    <div className={styles.timeTrackStatLabel}>{stat.label}</div>
                    <div className={styles.timeTrackStatSub}>{stat.sub}</div>
                  </div>
                ))}
              </div>

              <div className={styles.timeTrackSectionTitle}>Hours by Phase</div>
              <div className={cx("card", styles.timeTrackCardPadZero)}>
                {PHASES.map((phase) => {
                  const status = phaseStatus(phase.logged, phase.budgeted);
                  const fillPct = Math.min((phase.logged / phase.budgeted) * 100, 100);
                  return (
                    <div key={phase.name} className={styles.timeTrackPhaseRow}>
                      <div className={styles.timeTrackPhaseHead}>
                        <div>
                          <div className={styles.timeTrackPhaseName}>{phase.name}</div>
                          <div className={styles.timeTrackPhaseHours}>
                            {phase.logged}h logged / {phase.budgeted}h budgeted
                          </div>
                        </div>
                        <span className={cx("badge", status.cls)}>{status.label}</span>
                      </div>
                      <div className={styles.timeTrackBar}>
                        <div className={styles.timeTrackFill} style={{ width: `${fillPct}%`, background: phase.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {tab === "Time Log" ? (
            <div className={styles.timeTrackContent}>
              <div className={styles.timeTrackSectionTitle}>Detailed Time Log</div>
              <div className={styles.timeTrackInfoStrip}>
                Every task logged by the team, in real time. You see exactly what your budget is being spent on.
              </div>
              <div className={cx("card", styles.timeTrackCardPadZero)}>
                {LOGS.map((log) => (
                  <div key={`${log.task}-${log.date}`} className={styles.timeTrackLogRow}>
                    <div className={styles.timeTrackLogAvatar} style={{ background: log.color, color: "#050508" }}>
                      {log.av}
                    </div>
                    <div className={styles.timeTrackGrow}>
                      <div className={styles.timeTrackLogTask}>{log.task}</div>
                      <div className={styles.timeTrackLogPhase}>{log.phase}</div>
                    </div>
                    <div className={styles.timeTrackLogHours}>{log.hours}</div>
                    <div className={styles.timeTrackLogDate}>{log.date}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {tab === "By Team Member" ? (
            <div className={styles.timeTrackContent}>
              <div className={styles.timeTrackSectionTitle}>Hours by Team Member</div>
              <div className={styles.timeTrackTeamGrid}>
                {TEAM_HOURS.map((member) => (
                  <div key={member.name} className={cx("card", styles.timeTrackTeamCard)}>
                    <div className={styles.timeTrackTeamHead}>
                      <div className={styles.timeTrackTeamAvatar} style={{ background: member.color, color: "#050508" }}>
                        {member.av}
                      </div>
                      <div>
                        <div className={styles.timeTrackTeamName}>{member.name}</div>
                        <div className={styles.timeTrackTeamRole}>{member.role}</div>
                      </div>
                      <div className={styles.timeTrackTeamHours} style={{ color: member.color }}>
                        {member.hours}h
                      </div>
                    </div>
                    <div className={styles.timeTrackBar}>
                      <div className={styles.timeTrackFill} style={{ width: `${member.percent}%`, background: member.color }} />
                    </div>
                    <div className={styles.timeTrackTeamMeta}>
                      {member.percent}% of allocated hours used
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {tab === "Weekly Summary" ? (
            <div className={styles.timeTrackContent}>
              <div className={styles.timeTrackSectionTitle}>Weekly Hours Summary</div>
              <div className={cx("card", styles.timeTrackCardPadZero)}>
                {WEEKLY.map((row, idx) => (
                  <div key={row.week} className={styles.timeTrackPhaseRow}>
                    <div className={styles.timeTrackWeekHead}>
                      <div className={styles.timeTrackPhaseName}>{row.week}</div>
                      <div className={styles.timeTrackWeekHours}>{row.hours}h</div>
                    </div>
                    <div className={styles.timeTrackBar}>
                      <div
                        className={styles.timeTrackFill}
                        style={{ width: `${(row.hours / 40) * 100}%`, background: idx === 0 ? "var(--accent)" : "var(--purple)" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.timeTrackSummaryStrip}>
                Average: <strong>24.9h/week</strong> · Project pace is on track for the March 28, 2026 launch date.
              </div>
            </div>
          ) : null}
        </section>
      </div>

      {toast ? (
        <div className={cx("toastStack")}>
          <div className={cx("toast", "toastSuccess")}>
            <strong>{toast.title}</strong>
            <div>{toast.subtitle}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

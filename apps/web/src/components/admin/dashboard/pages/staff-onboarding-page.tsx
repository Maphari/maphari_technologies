"use client";

import { useMemo, useState } from "react";
import { AdminTabs } from "./shared";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";

type OnboardingTask = {
  category: string;
  task: string;
  done: boolean;
  doneDate?: string;
  owner: string;
};

type OnboardingStatus = "upcoming" | "active" | "complete";

type Onboarding = {
  id: string;
  name: string;
  role: string;
  department: string;
  avatar: string;
  color: string;
  startDate: string;
  manager: string;
  buddyAssigned: string;
  status: OnboardingStatus;
  daysUntilStart: number | null;
  checklist: OnboardingTask[];
};

const onboardings: Onboarding[] = [
  {
    id: "SOB-003",
    name: "Zoe Hendricks",
    role: "Junior Copywriter",
    department: "Creative",
    avatar: "ZH",
    color: "var(--accent)",
    startDate: "Mar 3 2026",
    manager: "Tapiwa Moyo",
    buddyAssigned: "Kira Bosman",
    status: "upcoming",
    daysUntilStart: 8,
    checklist: [
      { category: "Pre-Start Admin", task: "Offer letter signed and returned", done: true, doneDate: "Feb 18", owner: "Leilani" },
      { category: "Pre-Start Admin", task: "Employment contract sent", done: true, doneDate: "Feb 19", owner: "Leilani" },
      { category: "Pre-Start Admin", task: "Background check completed", done: false, owner: "Leilani" },
      { category: "Pre-Start Admin", task: "Bank details collected for payroll", done: true, doneDate: "Feb 20", owner: "Leilani" },
      { category: "Pre-Start Admin", task: "Tax number confirmed", done: false, owner: "Leilani" },
      { category: "Tech & Tools Setup", task: "Laptop ordered and configured", done: true, doneDate: "Feb 22", owner: "Sipho" },
      { category: "Tech & Tools Setup", task: "Email account created", done: false, owner: "Sipho" },
      { category: "Tech & Tools Setup", task: "Slack, Notion, Asana access granted", done: false, owner: "Sipho" },
      { category: "Tech & Tools Setup", task: "Adobe CC licence assigned", done: false, owner: "Sipho" },
      { category: "Day 1 Welcome", task: "Welcome email sent to new hire", done: false, owner: "Leilani" },
      { category: "Day 1 Welcome", task: "Desk and workspace ready", done: false, owner: "Leilani" },
      { category: "Day 1 Welcome", task: "Studio tour and team intro scheduled", done: false, owner: "Tapiwa" },
      { category: "Day 1 Welcome", task: "Welcome lunch booked", done: false, owner: "Nomsa" },
      { category: "Week 1 Training", task: "Maphari brand values walkthrough", done: false, owner: "Sipho" },
      { category: "Week 1 Training", task: "Client portfolio overview with manager", done: false, owner: "Tapiwa" },
      { category: "Week 1 Training", task: "Copy style guide review", done: false, owner: "Tapiwa" },
      { category: "Week 1 Training", task: "First project brief assigned", done: false, owner: "Tapiwa" },
      { category: "30-Day Check-In", task: "1:1 check-in with manager", done: false, owner: "Tapiwa" },
      { category: "30-Day Check-In", task: "Pulse survey sent to new hire", done: false, owner: "Leilani" },
      { category: "30-Day Check-In", task: "Initial performance notes documented", done: false, owner: "Tapiwa" }
    ]
  },
  {
    id: "SOB-002",
    name: "Tapiwa Moyo",
    role: "Copywriter",
    department: "Creative",
    avatar: "TM",
    color: "var(--blue)",
    startDate: "Jan 15 2024",
    manager: "Renzo Fabbri",
    buddyAssigned: "Kira Bosman",
    status: "complete",
    daysUntilStart: null,
    checklist: Array.from({ length: 20 }, (_, i) => ({ task: `Task ${i + 1}`, done: true, doneDate: "Jan 2024", owner: "Leilani", category: "Admin" }))
  }
];

const categories = ["Pre-Start Admin", "Tech & Tools Setup", "Day 1 Welcome", "Week 1 Training", "30-Day Check-In"] as const;

const categoryColors: Record<(typeof categories)[number], string> = {
  "Pre-Start Admin": "var(--accent)",
  "Tech & Tools Setup": "var(--blue)",
  "Day 1 Welcome": "var(--accent)",
  "Week 1 Training": "var(--amber)",
  "30-Day Check-In": "var(--amber)"
};

const statusBadge: Record<OnboardingStatus, { badge: string; label: string }> = {
  upcoming: { badge: "badgeAmber", label: "Upcoming" },
  active: { badge: "badgeBlue", label: "Active" },
  complete: { badge: "badgeGreen", label: "Complete" }
};

const templateChecklist: Record<(typeof categories)[number], string[]> = {
  "Pre-Start Admin": [
    "Offer letter signed and returned",
    "Employment contract sent",
    "Background check completed",
    "Bank details collected for payroll",
    "Tax number confirmed",
    "ID copy received"
  ],
  "Tech & Tools Setup": [
    "Laptop ordered and configured",
    "Email account created",
    "Slack, Notion, Asana access granted",
    "Adobe CC / Figma licence assigned",
    "VPN and security setup"
  ],
  "Day 1 Welcome": [
    "Welcome email sent to new hire",
    "Desk and workspace ready",
    "Studio tour and team intro scheduled",
    "Welcome lunch booked",
    "Buddy assigned and introduced"
  ],
  "Week 1 Training": [
    "Maphari brand values walkthrough",
    "Client portfolio overview with manager",
    "Department-specific tool training",
    "First project brief assigned",
    "Company processes & SOPs reviewed"
  ],
  "30-Day Check-In": [
    "1:1 check-in with manager",
    "Pulse survey sent to new hire",
    "Initial performance notes documented",
    "Probation goals set"
  ]
};

function Avatar({ initials, color, size = 36 }: { initials: string; color: string; size?: number }) {
  const sizeClass = size <= 28 ? styles.onboardAvatar28 : styles.onboardAvatar36;
  return (
    <div className={cx("fontMono", "flexCenter", "noShrink", "fw700", styles.onboardAvatar, sizeClass, toneClass(color))}>
      {initials}
    </div>
  );
}

const tabs = ["active onboardings", "template", "completed"] as const;
type Tab = (typeof tabs)[number];

export function StaffOnboardingPage() {
  const [activeTab, setActiveTab] = useState<Tab>("active onboardings");
  const [expanded, setExpanded] = useState<string>("SOB-003");

  const active = useMemo(() => onboardings.filter((o) => o.status !== "complete"), []);
  const complete = useMemo(() => onboardings.filter((o) => o.status === "complete"), []);
  const allTasks = active[0]?.checklist ?? [];
  const doneTasks = allTasks.filter((t) => t.done).length;
  const overallPct = allTasks.length > 0 ? Math.round((doneTasks / allTasks.length) * 100) : 0;

  return (
    <div className={cx(styles.pageBody, styles.onboardRoot)}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / STAFF</div>
          <h1 className={styles.pageTitle}>Staff Onboarding</h1>
          <div className={styles.pageSub}>New hire checklists, pre-start tasks, week 1 welcome, and 30-day check-ins</div>
        </div>
        <button type="button" className={cx("btnSm", "btnAccent")}>+ Start Onboarding</button>
      </div>

      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Upcoming Starts", value: active.length.toString(), color: "var(--amber)", sub: `${active[0]?.name ?? "-"} - ${active[0]?.startDate ?? "-"}` },
          { label: "SOB-003 Progress", value: `${overallPct}%`, color: overallPct >= 60 ? "var(--accent)" : "var(--amber)", sub: `${doneTasks}/${allTasks.length} tasks done` },
          { label: "Days Until Start", value: active[0]?.daysUntilStart?.toString() ?? "-", color: (active[0]?.daysUntilStart ?? 99) <= 7 ? "var(--red)" : "var(--blue)", sub: "Zoe Hendricks - Mar 3" },
          { label: "Completed Onboardings", value: complete.length.toString(), color: "var(--accent)", sub: "This FY" }
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, "mb4", styles.onboardToneText, toneClass(s.color))}>{s.value}</div>
            <div className={cx("text11", "colorMuted")}>{s.sub}</div>
          </div>
        ))}
      </div>

      <AdminTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        primaryColor="var(--accent)"
        mutedColor="var(--muted)"
        panelColor="var(--surface)"
        borderColor="var(--border)"
      />

      <div className={cx("overflowAuto", "minH0")}>
        {activeTab === "active onboardings" ? (
          <div className={cx("flexCol", "gap16")}>
            {(active[0]?.daysUntilStart ?? 999) <= 10 ? (
              <div className={cx("card", "flexRow", "gap16", "p16", styles.onboardAlert)}>
                <div>
                  <div className={cx("fw700", "colorAmber")}>Action Required - Zoe starts in {active[0]?.daysUntilStart} days</div>
                  <div className={cx("text12", "colorMuted", "mt4")}>
                    {allTasks.filter((t) => !t.done && t.category === "Pre-Start Admin").length} pre-start admin tasks still outstanding.
                  </div>
                </div>
              </div>
            ) : null}

            {active.map((onb) => {
              const done = onb.checklist.filter((t) => t.done).length;
              const total = onb.checklist.length;
              const pct = Math.round((done / total) * 100);
              const sc = statusBadge[onb.status];
              const isExp = expanded === onb.id;

              return (
                <div key={onb.id} className={styles.card}>
                  <div
                    role="button"
                    tabIndex={0}
                    className={cx("p24", "pointerCursor")}
                    onClick={() => setExpanded(isExp ? "" : onb.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setExpanded(isExp ? "" : onb.id);
                      }
                    }}
                  >
                    <div className={styles.onboardRow}>
                      <div className={cx("flexRow", "gap12")}>
                        <Avatar initials={onb.avatar} color={onb.color} />
                        <div>
                          <div className={cx("fw700")}>{onb.name}</div>
                          <div className={cx("text11", "colorMuted")}>{onb.role}</div>
                          <div className={cx("text10", "colorMuted")}>Starts {onb.startDate}</div>
                        </div>
                      </div>
                      <div>
                        <div className={cx("flexBetween", "mb4")}>
                          <span className={cx("text11", "colorMuted")}>{done}/{total} tasks</span>
                          <span className={cx("fontMono", "fw700", styles.onboardToneText, pct >= 70 ? styles.onboardToneAccent : styles.onboardToneAmber)}>{pct}%</span>
                        </div>
                        <progress className={cx(styles.onboardProgTrack, styles.onboardProgFill, pct >= 70 ? styles.onboardToneAccent : styles.onboardToneAmber)} max={100} value={pct} aria-label={`${onb.name} onboarding completion ${pct}%`} />
                      </div>
                      <div>
                        <div className={cx("text10", "colorMuted", "mb3")}>Manager</div>
                        <div className={cx("text12")}>{onb.manager.split(" ")[0]}</div>
                      </div>
                      <div>
                        <div className={cx("text10", "colorMuted", "mb3")}>Buddy</div>
                        <div className={cx("text12")}>{onb.buddyAssigned.split(" ")[0]}</div>
                      </div>
                      <span className={cx("badge", sc.badge)}>{sc.label}</span>
                      <span className={cx(styles.onboardToneText, isExp ? styles.onboardToneAccent : styles.onboardToneMuted)}>{isExp ? "\u25b2" : "\u25bc"}</span>
                    </div>
                  </div>

                  {isExp ? (
                    <div className={cx("borderB", styles.onboardExpanded)}>
                      <div className={cx("grid3", "gap14", styles.onboardExpandedTop)}>
                        {categories.slice(0, 3).map((cat) => {
                          const catTasks = onb.checklist.filter((t) => t.category === cat);
                          const catDone = catTasks.filter((t) => t.done).length;
                          const catColor = categoryColors[cat];
                          return (
                            <div key={cat} className={cx("bgBg", "p16", styles.onboardToneBorder, toneClass(catColor))}>
                              <div className={cx("flexBetween", "mb12")}>
                                <span className={cx("text11", "fw700", "uppercase", "tracking", styles.onboardToneText, toneClass(catColor))}>{cat}</span>
                                <span className={cx("text10", "fontMono", styles.onboardToneText, catDone === catTasks.length ? styles.onboardToneAccent : styles.onboardToneMuted)}>{catDone}/{catTasks.length}</span>
                              </div>
                              {catTasks.map((task, i) => (
                                <div key={i} className={cx("flexRow", "gap8", "mb8", styles.onboardAlignStart)}>
                                  <div className={cx("flexCenter", "noShrink", styles.onboardTaskCheck, toneClass(task.done ? "var(--accent)" : "var(--border)"), task.done && styles.onboardTaskCheckDone)}>
                                    {task.done ? <span className={cx("fw800", styles.onboardCheckMark)}>&#10003;</span> : null}
                                  </div>
                                  <div className={styles.onboardGrow}>
                                    <div className={cx("text11", styles.onboardTaskText, task.done && styles.onboardTaskDone)}>{task.task}</div>
                                    <div className={cx("textXs", "colorMuted")}>{task.owner}{task.doneDate ? ` - Done ${task.doneDate}` : ""}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>

                      <div className={cx("grid2", "gap14", "mt16")}>
                        {categories.slice(3).map((cat) => {
                          const catTasks = onb.checklist.filter((t) => t.category === cat);
                          const catDone = catTasks.filter((t) => t.done).length;
                          const catColor = categoryColors[cat];
                          return (
                            <div key={cat} className={cx("bgBg", "p16", styles.onboardToneBorder, toneClass(catColor))}>
                              <div className={cx("flexBetween", "mb12")}>
                                <span className={cx("text11", "fw700", "uppercase", "tracking", styles.onboardToneText, toneClass(catColor))}>{cat}</span>
                                <span className={cx("text10", "fontMono", styles.onboardToneText, catDone === catTasks.length ? styles.onboardToneAccent : styles.onboardToneMuted)}>{catDone}/{catTasks.length}</span>
                              </div>
                              {catTasks.map((task, i) => (
                                <div key={i} className={cx("flexRow", "gap8", "mb8", styles.onboardAlignStart)}>
                                  <div className={cx("flexCenter", "noShrink", styles.onboardTaskCheck, toneClass(task.done ? "var(--accent)" : "var(--border)"), task.done && styles.onboardTaskCheckDone)}>
                                    {task.done ? <span className={cx("fw800", styles.onboardCheckMark)}>&#10003;</span> : null}
                                  </div>
                                  <div className={styles.onboardGrow}>
                                    <div className={cx("text11", styles.onboardTaskText, task.done && styles.onboardTaskDone)}>{task.task}</div>
                                    <div className={cx("textXs", "colorMuted")}>{task.owner}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>

                      <div className={cx("flexRow", "gap8", "mt20")}>
                        <button type="button" className={cx("btnSm", "btnAccent")}>Update Tasks</button>
                        <button type="button" className={cx("btnSm", "btnGhost")}>View Timeline</button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}

        {activeTab === "template" ? (
          <div>
            <div className={cx("text13", "colorMuted", "mb20")}>Standard onboarding template applied to all new hires. Edit to customize per role or department.</div>
            <div className={cx("grid2", "gap14")}>
              {Object.entries(templateChecklist).map(([cat, tasks]) => {
                const color = categoryColors[cat as keyof typeof categoryColors];
                return (
                  <div key={cat} className={cx(styles.card, styles.onboardTemplateCard, toneClass(color))}>
                    <div className={cx("flexBetween", "mb16")}>
                      <div className={cx("text12", "fw700", "uppercase", "tracking", styles.onboardToneText, toneClass(color))}>{cat}</div>
                      <span className={cx("text10", "fontMono", "colorMuted")}>{tasks.length} tasks</span>
                    </div>
                    {tasks.map((task, i) => (
                      <div key={i} className={cx("flexRow", "gap10", "borderB", "py10")}>
                        <div className={cx("noShrink", styles.onboardTemplateChk)} />
                        <span className={cx("text12", styles.onboardGrow)}>{task}</span>
                      </div>
                    ))}
                    <button type="button" className={cx("btnSm", "btnGhost", "mt12")}>+ Add Task</button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {activeTab === "completed" ? (
          <div className={cx("flexCol", "gap10")}>
            {complete.map((onb) => (
              <div key={onb.id} className={cx(styles.card, styles.onboardCompleteCard)}>
                <div className={styles.onboardCompleteRow}>
                  <div className={cx("flexRow", "gap10")}>
                    <Avatar initials={onb.avatar} color={onb.color} size={28} />
                    <div>
                      <div className={cx("fw600")}>{onb.name}</div>
                      <div className={cx("text11", "colorMuted")}>{onb.role}</div>
                    </div>
                  </div>
                  <div className={cx("text11", "colorMuted")}>Started {onb.startDate}</div>
                  <div className={cx("text11", "colorMuted")}>Manager: {onb.manager.split(" ")[0]}</div>
                  <span className={cx("text10", "colorAccent")}>100% Complete</span>
                  <button type="button" className={cx("btnSm", "btnGhost")}>View Archive</button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

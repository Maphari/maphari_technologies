"use client";

import { useState } from "react";
import { cx, styles } from "../style";
import { colorClass } from "./admin-page-utils";

type OnboardingStatus = "in-progress" | "overdue" | "complete" | "not-started";
const categories = ["Admin", "Setup", "Discovery", "Kick-off"] as const;
type Category = (typeof categories)[number];
type Tab = "active onboardings" | "template" | "analytics";

type ChecklistTask = {
  category: Category;
  task: string;
  done: boolean;
  doneDate?: string;
  owner: string;
  blocker?: string;
};

type Onboarding = {
  id: string;
  client: string;
  clientColor: string;
  avatar: string;
  am: string;
  tier: string;
  startedDate: string;
  targetDate: string;
  daysElapsed: number;
  targetDays: number;
  status: OnboardingStatus;
  contactName: string;
  contactEmail: string;
  mrr: number;
  checklist: ChecklistTask[];
};

const onboardings: Onboarding[] = [
  {
    id: "ONB-005",
    client: "Bloom Wellness",
    clientColor: "var(--blue)",
    avatar: "BW",
    am: "Nomsa Dlamini",
    tier: "Core",
    startedDate: "Feb 18",
    targetDate: "Mar 4",
    daysElapsed: 5,
    targetDays: 14,
    status: "in-progress",
    contactName: "Priya Singh",
    contactEmail: "priya@bloomwellness.co.za",
    mrr: 28000,
    checklist: [
      { category: "Admin", task: "Contract signed", done: true, doneDate: "Feb 18", owner: "Nomsa" },
      { category: "Admin", task: "Invoice terms confirmed", done: true, doneDate: "Feb 18", owner: "Nomsa" },
      { category: "Admin", task: "NDA executed (if required)", done: false, owner: "Nomsa" },
      { category: "Setup", task: "Client portal account created", done: true, doneDate: "Feb 19", owner: "Leilani" },
      { category: "Setup", task: "Portal walkthrough call completed", done: false, owner: "Nomsa" },
      { category: "Setup", task: "Communication preferences set", done: true, doneDate: "Feb 19", owner: "Nomsa" },
      { category: "Discovery", task: "Brand brief completed", done: true, doneDate: "Feb 20", owner: "Renzo" },
      { category: "Discovery", task: "Stakeholder map completed", done: false, owner: "Nomsa" },
      { category: "Discovery", task: "Existing asset audit done", done: false, owner: "Renzo" },
      { category: "Kick-off", task: "Kick-off call scheduled", done: true, doneDate: "Feb 21", owner: "Leilani" },
      { category: "Kick-off", task: "Project timeline shared", done: false, owner: "Leilani" },
      { category: "Kick-off", task: "Key contacts introduced to team", done: false, owner: "Nomsa" }
    ]
  },
  {
    id: "ONB-004",
    client: "Craft & Co",
    clientColor: "var(--purple)",
    avatar: "CC",
    am: "Nomsa Dlamini",
    tier: "Core",
    startedDate: "Feb 10",
    targetDate: "Feb 24",
    daysElapsed: 13,
    targetDays: 14,
    status: "overdue",
    contactName: "Marco Russo",
    contactEmail: "marco@craftandco.co.za",
    mrr: 18000,
    checklist: [
      { category: "Admin", task: "Contract signed", done: true, doneDate: "Feb 10", owner: "Nomsa" },
      { category: "Admin", task: "Invoice terms confirmed", done: true, doneDate: "Feb 10", owner: "Nomsa" },
      { category: "Admin", task: "NDA executed", done: true, doneDate: "Feb 11", owner: "Nomsa" },
      { category: "Setup", task: "Client portal account created", done: true, doneDate: "Feb 11", owner: "Leilani" },
      { category: "Setup", task: "Portal walkthrough call completed", done: true, doneDate: "Feb 13", owner: "Nomsa" },
      { category: "Setup", task: "Communication preferences set", done: true, doneDate: "Feb 13", owner: "Nomsa" },
      { category: "Discovery", task: "Brand brief completed", done: false, owner: "Renzo", blocker: "Client hasn't submitted brand assets" },
      { category: "Discovery", task: "Stakeholder map completed", done: false, owner: "Nomsa" },
      { category: "Discovery", task: "Existing asset audit done", done: false, owner: "Renzo" },
      { category: "Kick-off", task: "Kick-off call scheduled", done: true, doneDate: "Feb 14", owner: "Leilani" },
      { category: "Kick-off", task: "Project timeline shared", done: false, owner: "Leilani" },
      { category: "Kick-off", task: "Key contacts introduced to team", done: true, doneDate: "Feb 14", owner: "Nomsa" }
    ]
  },
  {
    id: "ONB-003",
    client: "Mira Health",
    clientColor: "var(--accent)",
    avatar: "MH",
    am: "Nomsa Dlamini",
    tier: "Core",
    startedDate: "Jan 28",
    targetDate: "Feb 11",
    daysElapsed: 26,
    targetDays: 14,
    status: "complete",
    contactName: "Dr. Aisha Obi",
    contactEmail: "aisha@mirahealth.co.za",
    mrr: 21600,
    checklist: [
      { category: "Admin", task: "Contract signed", done: true, doneDate: "Jan 28", owner: "Nomsa" },
      { category: "Admin", task: "Invoice terms confirmed", done: true, doneDate: "Jan 28", owner: "Nomsa" },
      { category: "Admin", task: "NDA executed", done: true, doneDate: "Jan 29", owner: "Nomsa" },
      { category: "Setup", task: "Client portal account created", done: true, doneDate: "Jan 29", owner: "Leilani" },
      { category: "Setup", task: "Portal walkthrough call completed", done: true, doneDate: "Feb 1", owner: "Nomsa" },
      { category: "Setup", task: "Communication preferences set", done: true, doneDate: "Jan 30", owner: "Nomsa" },
      { category: "Discovery", task: "Brand brief completed", done: true, doneDate: "Feb 3", owner: "Renzo" },
      { category: "Discovery", task: "Stakeholder map completed", done: true, doneDate: "Feb 4", owner: "Nomsa" },
      { category: "Discovery", task: "Existing asset audit done", done: true, doneDate: "Feb 5", owner: "Renzo" },
      { category: "Kick-off", task: "Kick-off call scheduled", done: true, doneDate: "Feb 6", owner: "Leilani" },
      { category: "Kick-off", task: "Project timeline shared", done: true, doneDate: "Feb 7", owner: "Leilani" },
      { category: "Kick-off", task: "Key contacts introduced to team", done: true, doneDate: "Feb 6", owner: "Nomsa" }
    ]
  }
];

const categoryColors: Record<Category, string> = {
  Admin: "var(--accent)",
  Setup: "var(--blue)",
  Discovery: "var(--purple)",
  "Kick-off": "var(--amber)"
};

const statusConfig: Record<OnboardingStatus, { color: string; label: string }> = {
  "in-progress": { color: "var(--blue)", label: "In Progress" },
  overdue: { color: "var(--red)", label: "Overdue" },
  complete: { color: "var(--accent)", label: "Complete" },
  "not-started": { color: "var(--muted)", label: "Not Started" }
};

const tabs: Tab[] = ["active onboardings", "template", "analytics"];

function toneVarClass(value: string): string {
  if (value === "var(--red)") return styles.onboardToneRed;
  if (value === "var(--blue)") return styles.onboardToneBlue;
  if (value === "var(--amber)") return styles.onboardToneAmber;
  if (value === "var(--purple)") return styles.onboardTonePurple;
  if (value === "var(--muted)") return styles.onboardToneMuted;
  if (value === "var(--border)") return styles.onboardToneVarBorder;
  return styles.onboardToneAccent;
}

function fillClass(value: string): string {
  if (value === "var(--red)") return styles.conbFillRed;
  if (value === "var(--blue)") return styles.conbFillBlue;
  if (value === "var(--amber)") return styles.conbFillAmber;
  if (value === "var(--purple)") return styles.conbFillPurple;
  if (value === "var(--muted)") return styles.conbFillMuted;
  return styles.conbFillAccent;
}

function statusClass(value: string): string {
  if (value === "var(--red)") return styles.conbStatusRed;
  if (value === "var(--blue)") return styles.conbStatusBlue;
  if (value === "var(--amber)") return styles.conbStatusAmber;
  if (value === "var(--purple)") return styles.conbStatusPurple;
  if (value === "var(--muted)") return styles.conbStatusMuted;
  return styles.conbStatusAccent;
}

function categoryCardClass(value: string): string {
  if (value === "var(--red)") return styles.conbCategoryCardRed;
  if (value === "var(--blue)") return styles.conbCategoryCardBlue;
  if (value === "var(--amber)") return styles.conbCategoryCardAmber;
  if (value === "var(--purple)") return styles.conbCategoryCardPurple;
  if (value === "var(--muted)") return styles.conbCategoryCardMuted;
  return styles.conbCategoryCardAccent;
}

function Avatar({ initials, color, size = 36 }: { initials: string; color: string; size?: number }) {
  const sizeClass = size === 28 ? "onboardAvatar28" : "onboardAvatar36";
  return (
    <div className={cx(styles.onboardAvatar, toneVarClass(color), sizeClass, "flexCenter", "fontMono", "fw700", "noShrink")}>
      {initials}
    </div>
  );
}

export function ClientOnboardingPage() {
  const [activeTab, setActiveTab] = useState<Tab>("active onboardings");
  const [expanded, setExpanded] = useState<string | null>("ONB-005");

  const active = onboardings.filter((o) => o.status !== "complete");
  const complete = onboardings.filter((o) => o.status === "complete");
  const overdue = onboardings.filter((o) => o.status === "overdue");
  const avgDays = Math.round(complete.reduce((s, o) => s + o.daysElapsed, 0) / (complete.length || 1));

  return (
    <div className={cx(styles.pageBody, styles.onboardRoot)}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / CLIENT MANAGEMENT</div>
          <h1 className={styles.pageTitle}>Client Onboarding</h1>
          <div className={styles.pageSub}>New client setup - Steps - Blockers - Completion tracking</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnAccent")}>+ Start Onboarding</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb28")}>
        {[
          { label: "Active Onboardings", value: active.length.toString(), color: "var(--blue)", sub: `${overdue.length} overdue` },
          { label: "Completed (90d)", value: complete.length.toString(), color: "var(--accent)", sub: `Avg ${avgDays} days` },
          { label: "Overdue", value: overdue.length.toString(), color: overdue.length > 0 ? "var(--red)" : "var(--accent)", sub: "Past target date" },
          { label: "New MRR Onboarding", value: `R${(active.reduce((s, o) => s + o.mrr, 0) / 1000).toFixed(0)}k`, color: "var(--purple)", sub: "Monthly value in pipeline" }
        ].map((s) => (
          <div key={s.label} className={cx("statCard", s.label === "Overdue" && overdue.length > 0 && styles.conbOverdueStat)}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, colorClass(s.color))}>{s.value}</div>
            <div className={cx("text11", "colorMuted")}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.filterRow}>
        <select title="Select tab" value={activeTab} onChange={e => setActiveTab(e.target.value as Tab)} className={styles.filterSelect}>
          {tabs.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {activeTab === "active onboardings" && (
        <div className={styles.conbList}>
          {onboardings.map((onb) => {
            const done = onb.checklist.filter((t) => t.done).length;
            const total = onb.checklist.length;
            const pct = Math.round((done / total) * 100);
            const sc = statusConfig[onb.status];
            const isExp = expanded === onb.id;
            const blockers = onb.checklist.filter((t) => t.blocker);

            return (
              <div key={onb.id} className={cx(styles.conbCard, onb.status === "overdue" && styles.conbCardOverdue, onb.status === "complete" && styles.conbCardComplete)}>
                <div
                  role="button"
                  tabIndex={0}
                  className={styles.conbCardHead}
                  onClick={() => setExpanded(isExp ? null : onb.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setExpanded(isExp ? null : onb.id);
                    }
                  }}
                >
                  <div className={styles.onboardRow}>
                    <div className={cx("flexRow", "gap12", "flexCenter")}>
                      <Avatar initials={onb.avatar} color={onb.clientColor} />
                      <div>
                        <div className={cx("fw700", "text14")}>{onb.client}</div>
                        <div className={cx("text11", "colorMuted")}>{onb.tier} - {onb.am}</div>
                        <div className={cx("text10", "colorMuted")}>Started {onb.startedDate}</div>
                      </div>
                    </div>
                    <div>
                      <div className={cx("flexBetween", "mb4")}>
                        <span className={cx("text11", "colorMuted")}>{done}/{total} tasks</span>
                        <span className={cx("fontMono", "fw700", pct === 100 ? "colorAccent" : pct >= 60 ? "colorBlue" : "colorAmber")}>{pct}%</span>
                      </div>
                      <div className={cx(styles.onboardProgTrack, "progressBar")}>
                        <progress
                          className={cx(styles.onboardProgFill, pct === 100 ? styles.conbFillAccent : pct >= 60 ? styles.conbFillBlue : styles.conbFillAmber)}
                          max={100}
                          value={pct}
                        />
                      </div>
                    </div>
                    <div>
                      <div className={cx("text10", "colorMuted", "mb3")}>Target Date</div>
                      <div className={cx("fontMono", "text12", onb.status === "overdue" ? "colorRed" : "colorMuted")}>{onb.targetDate}</div>
                      <div className={cx("text10", onb.status === "overdue" ? "colorRed" : "colorMuted")}>{onb.daysElapsed}d elapsed</div>
                    </div>
                    <div>
                      <div className={cx("text10", "colorMuted", "mb3")}>MRR</div>
                      <div className={cx("fontMono", "fw700", "colorAccent")}>R{(onb.mrr / 1000).toFixed(0)}k</div>
                    </div>
                    {blockers.length > 0 ? <div className={styles.conbBlockerChip}>! {blockers.length}</div> : <div className={styles.conbClearChip}>Clear</div>}
                    <span className={cx(styles.conbStatusChip, statusClass(sc.color))}>{sc.label}</span>
                  </div>
                </div>

                {isExp ? (
                  <div className={styles.onboardExpanded}>
                    <div className={cx(styles.onboardExpandedTop, styles.conbCategoryGrid)}>
                      {categories.map((cat) => {
                        const catTasks = onb.checklist.filter((t) => t.category === cat);
                        const catDone = catTasks.filter((t) => t.done).length;
                        const catColor = categoryColors[cat];
                        return (
                          <div key={cat} className={cx(styles.conbCategoryCard, categoryCardClass(catColor))}>
                            <div className={cx("flexBetween", "mb12")}>
                              <span className={cx(styles.conbCategoryTitle, colorClass(catColor))}>{cat}</span>
                              <span className={cx("text10", "fontMono", catDone === catTasks.length ? "colorAccent" : "colorMuted")}>{catDone}/{catTasks.length}</span>
                            </div>
                            {catTasks.map((task, i) => (
                              <div key={i} className={styles.conbTaskRow}>
                                <div className={cx(styles.onboardTaskCheck, toneVarClass(task.done ? "var(--accent)" : task.blocker ? "var(--red)" : "var(--border)"), task.done && styles.onboardTaskCheckDone, "flexCenter")}>
                                  {task.done ? <span className={styles.onboardCheckMark}>v</span> : task.blocker ? <span className={styles.conbTaskWarn}>!</span> : null}
                                </div>
                                <div className={styles.onboardGrow}>
                                  <div className={cx("text11", task.done ? styles.onboardTaskDone : styles.onboardTaskText)}>{task.task}</div>
                                  {task.blocker ? <div className={styles.conbBlockerText}>{task.blocker}</div> : null}
                                  {task.doneDate ? <div className={styles.conbTaskMeta}>{task.doneDate} - {task.owner}</div> : <div className={styles.conbTaskMeta}>{task.owner}</div>}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                    <div className={styles.conbExpandedFoot}>
                      <div className={styles.conbContactCard}>
                        <div className={cx("text10", "colorMuted", "mb3")}>Contact</div>
                        <div className={cx("text13", "fw600")}>{onb.contactName}</div>
                        <div className={cx("text11", "colorBlue")}>{onb.contactEmail}</div>
                      </div>
                      <button type="button" className={cx("btnSm", "btnAccent")}>{onb.status === "complete" ? "View Summary" : "Update Progress"}</button>
                      {onb.status !== "complete" ? <button type="button" className={cx("btnSm", "btnGhost", styles.conbMarkBtn)}>Mark Complete</button> : null}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "template" && (
        <div className={cx("grid2", "gap16")}>
          {categories.map((cat) => (
            <div key={cat} className={cx(styles.onboardTemplateCard, styles.onboardToneBorder, toneVarClass(categoryColors[cat]))}>
              <div className={cx(styles.conbTemplateTitle, colorClass(categoryColors[cat]))}>{cat}</div>
              {onboardings[0].checklist
                .filter((t) => t.category === cat)
                .map((task, i) => (
                  <div key={i} className={styles.conbTemplateRow}>
                    <div className={styles.onboardTemplateChk} />
                    <span className={styles.conbTemplateTask}>{task.task}</span>
                    <span className={styles.conbTemplateOwner}>{task.owner}</span>
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}

      {activeTab === "analytics" && (
        <div className={cx("grid2", "gap20")}>
          <div className={styles.conbAnalyticsCard}>
            <div className={styles.conbSectionTitle}>Onboarding Speed</div>
            {onboardings
              .filter((o) => o.status === "complete")
              .map((o) => (
                <div key={o.client} className={styles.conbSpeedRow}>
                  <Avatar initials={o.avatar} color={o.clientColor} size={28} />
                  <div className={styles.onboardGrow}>
                    <div className={cx("flexBetween", "mb4")}>
                      <span className={styles.text12}>{o.client}</span>
                      <span className={cx("fontMono", o.daysElapsed <= o.targetDays ? "colorAccent" : "colorAmber")}>{o.daysElapsed}d</span>
                    </div>
                    <div className={cx("progressBar", "h6")}>
                      <progress
                        className={cx("barFill", "uiProgress", o.daysElapsed <= o.targetDays ? styles.conbFillAccent : styles.conbFillAmber)}
                        max={100}
                        value={Math.min((o.daysElapsed / 30) * 100, 100)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            <div className={styles.conbAvgBox}>
              <div className={cx("text11", "colorMuted", "mb4")}>Average Onboarding Time</div>
              <div className={styles.conbAvgValue}>{avgDays} days</div>
              <div className={cx("text11", "colorMuted")}>Target: 14 days</div>
            </div>
          </div>

          <div className={styles.conbSideStack}>
            <div className={styles.conbAnalyticsCard}>
              <div className={styles.conbSectionTitle}>Most Common Blockers</div>
              {["Client delays submitting brand assets", "Portal walkthrough not yet scheduled", "Stakeholder map incomplete"].map((b, i) => (
                <div key={i} className={styles.conbBlockerRow}><span className={styles.conbTaskWarn}>!</span> {b}</div>
              ))}
            </div>
            <div className={styles.conbAnalyticsCard}>
              <div className={styles.conbSectionTitle}>Category Completion Rates</div>
              {categories.map((cat) => {
                const allTasks = onboardings.flatMap((o) => o.checklist.filter((t) => t.category === cat));
                const doneTasks = allTasks.filter((t) => t.done);
                const rate = allTasks.length > 0 ? Math.round((doneTasks.length / allTasks.length) * 100) : 0;
                return (
                  <div key={cat} className={styles.conbRateRow}>
                    <span className={cx(styles.conbRateName, colorClass(categoryColors[cat]))}>{cat}</span>
                    <div className={styles.conbRateTrack}>
                      <progress className={cx("barFill", "uiProgress", fillClass(categoryColors[cat]))} max={100} value={rate} />
                    </div>
                    <span className={cx(styles.conbRateVal, colorClass(categoryColors[cat]))}>{rate}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

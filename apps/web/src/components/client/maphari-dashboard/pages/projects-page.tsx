"use client";

import { useEffect, useMemo, useState } from "react";
import { cx, styles } from "../style";

type OverviewTab =
  | "Project Pulse"
  | "Milestones"
  | "Deliverables"
  | "Timeline"
  | "Decisions"
  | "Scope Changes"
  | "Risks"
  | "Sign-off";

type ScopeStatus = "pending" | "approved" | "declined";
type DeliverableStatus = "delivered" | "approved" | "review" | "inprogress" | "notstarted";
type MilestoneStatus = "done" | "active" | "pending" | "blocked";
type RiskLevel = "High" | "Medium" | "Low";
type Mood = "😄" | "😊" | "😐" | "😟" | "😡";

type ScopeItem = {
  id: number;
  title: string;
  body: string;
  status: ScopeStatus;
};

type SignoffItem = {
  name: string;
  meta: string;
  status: "signed" | "pending" | "notready";
  icon: string;
};

const MILESTONES: Array<{ title: string; meta: string; pct: number; status: MilestoneStatus; tags: string[]; deliverables: number }> = [
  { title: "Discovery & Strategy", meta: "Completed Feb 3 · 100% done", pct: 100, status: "done", tags: ["strategy", "research"], deliverables: 3 },
  { title: "Brand Identity System", meta: "Completed Feb 12 · 100% done", pct: 100, status: "done", tags: ["branding", "design"], deliverables: 5 },
  { title: "UI/UX Design", meta: "In progress · Due Feb 28 · 72% done", pct: 72, status: "active", tags: ["design", "ux"], deliverables: 8 },
  { title: "Frontend Development", meta: "Not started · Due Mar 21", pct: 0, status: "pending", tags: ["dev", "react"], deliverables: 12 },
  { title: "QA & Testing", meta: "Not started · Due Apr 4", pct: 0, status: "pending", tags: ["qa"], deliverables: 6 },
  { title: "Launch & Handover", meta: "Blocked — awaiting design sign-off", pct: 0, status: "blocked", tags: ["launch"], deliverables: 4 },
];

const DELIVERABLES: Array<{ name: string; project: string; owner: string; date: string; status: DeliverableStatus }> = [
  { name: "Brand Guidelines Document", project: "Brand Identity", owner: "Lerato M.", date: "Feb 12", status: "delivered" },
  { name: "Logo Suite (All formats)", project: "Brand Identity", owner: "Lerato M.", date: "Feb 12", status: "delivered" },
  { name: "Homepage Design", project: "UI/UX Design", owner: "Sipho N.", date: "Feb 20", status: "approved" },
  { name: "Dashboard UI Design", project: "UI/UX Design", owner: "Sipho N.", date: "Feb 25", status: "review" },
  { name: "Mobile Responsive Screens", project: "UI/UX Design", owner: "Sipho N.", date: "Feb 28", status: "inprogress" },
  { name: "Component Library", project: "UI/UX Design", owner: "Thabo K.", date: "Mar 3", status: "inprogress" },
  { name: "Authentication Flows", project: "Frontend Dev", owner: "James M.", date: "Mar 14", status: "notstarted" },
  { name: "API Integration", project: "Frontend Dev", owner: "James M.", date: "Mar 21", status: "notstarted" },
];

const DECISIONS: Array<{ title: string; meta: string; by: string }> = [
  { title: "Switched from purple to lime accent colour", meta: "Approved by client · Feb 14 · Brand Identity", by: "Naledi D. + Lerato M." },
  { title: "Reduced homepage sections from 8 to 5 for clarity", meta: "Agreed in call · Feb 17 · UI/UX Design", by: "Sipho N. + Naledi D." },
  { title: "Added mobile-first approach to all screens", meta: "Client request · Feb 19 · UI/UX Design", by: "Naledi D." },
  { title: "Deferred dark mode to Phase 2", meta: "Scope decision · Feb 21 · Frontend Dev", by: "Thabo K. + Naledi D." },
];

const RISKS: Array<{ name: string; detail: string; likelihood: RiskLevel; impact: RiskLevel; mitigation: string }> = [
  { name: "Content not delivered on time", detail: "Client has not submitted copy for 3 pages", likelihood: "High", impact: "High", mitigation: "Chase weekly · Flag in digest" },
  { name: "Third-party API instability", detail: "Payment gateway had 2 outages this month", likelihood: "Medium", impact: "High", mitigation: "Build fallback flow" },
  { name: "Scope creep", detail: "2 scope changes pending approval", likelihood: "High", impact: "Medium", mitigation: "Formal approval required" },
  { name: "Design revision cycles", detail: "Client requested 2 rounds of revisions already", likelihood: "Medium", impact: "Low", mitigation: "Cap at 3 rounds per contract" },
];

const SIGNOFFS: SignoffItem[] = [
  { name: "Brand Guidelines v1.0", meta: "Signed off Feb 12 · Naledi Dlamini", status: "signed", icon: "📄" },
  { name: "Homepage Design", meta: "Signed off Feb 20 · Naledi Dlamini", status: "signed", icon: "🖥" },
  { name: "Dashboard UI Design", meta: "Awaiting your review and approval", status: "pending", icon: "📊" },
  { name: "Mobile Screens", meta: "Not yet ready for review", status: "notready", icon: "📱" },
];

const TABS: OverviewTab[] = [
  "Project Pulse",
  "Milestones",
  "Deliverables",
  "Timeline",
  "Decisions",
  "Scope Changes",
  "Risks",
  "Sign-off",
];

const STATUS_LABELS: Record<DeliverableStatus, string> = {
  delivered: "Delivered",
  approved: "Approved",
  review: "In Review",
  inprogress: "In Progress",
  notstarted: "Not Started",
};

const STATUS_BADGE: Record<DeliverableStatus, string> = {
  delivered: "badgeGreen",
  approved: "badgeAccent",
  review: "badgePurple",
  inprogress: "badgeAmber",
  notstarted: "badgeMuted",
};

export function ProjectsPage() {
  const [tab, setTab] = useState<OverviewTab>("Project Pulse");
  const [scopeModal, setScopeModal] = useState(false);
  const [signoffModal, setSignoffModal] = useState<SignoffItem | null>(null);
  const [toast, setToast] = useState<{ title: string; subtitle: string } | null>(null);
  const [moods, setMoods] = useState<Record<string, Mood>>({
    "This week": "😊",
    "Last week": "😐",
    "Week of Feb 7": "😊",
  });
  const [scopes, setScopes] = useState<ScopeItem[]>([
    {
      id: 1,
      title: "Add e-commerce checkout flow",
      body: "Client requesting a 3-step checkout with Stripe. Not in original brief. Est. cost: R 18,000. Timeline: +2 weeks.",
      status: "pending",
    },
    {
      id: 2,
      title: "Add Zulu language translation",
      body: "Full Zulu translation across all pages. Est. cost: R 5,500. No timeline impact if approved before Mar 1.",
      status: "pending",
    },
    {
      id: 3,
      title: "Replace static hero with video background",
      body: "Swap hero image for looping video. Client to supply assets. Dev cost: R 3,200. Already approved.",
      status: "approved",
    },
  ]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const pendingScopeCount = useMemo(() => scopes.filter((item) => item.status === "pending").length, [scopes]);

  function notify(title: string, subtitle: string): void {
    setToast({ title, subtitle });
  }

  function handleScope(id: number, next: ScopeStatus): void {
    setScopes((prev) => prev.map((item) => (item.id === id ? { ...item, status: next } : item)));
    notify(next === "approved" ? "Scope change approved" : "Scope change declined", "Team has been notified");
  }

  return (
    <div className={cx("pageBody", styles.projOverviewRoot)}>
      <div className={styles.projOverviewLayout}>
        <aside className={styles.projOverviewSidebar}>
          <div className={styles.projOverviewSideSection}>Project</div>
          {[
            { label: "Project Pulse", tone: styles.projOverviewToneAccent },
            { label: "Milestones", tone: styles.projOverviewToneGreen },
            { label: "Deliverables", tone: styles.projOverviewTonePurple },
            { label: "Timeline", tone: styles.projOverviewToneBlue },
            { label: "Decisions", tone: styles.projOverviewToneMuted },
            { label: "Scope Changes", tone: styles.projOverviewToneAmber, badge: pendingScopeCount },
            { label: "Risks", tone: styles.projOverviewToneRed },
            { label: "Sign-off", tone: styles.projOverviewToneMuted },
          ].map((item) => (
            <button key={item.label} type="button" className={cx(styles.projOverviewSideItem, tab === item.label && styles.projOverviewSideItemActive)} onClick={() => setTab(item.label as OverviewTab)}>
              <span className={cx(styles.projOverviewSideDot, item.tone)} />
              <span>{item.label}</span>
              {item.badge && item.badge > 0 ? <span className={styles.projOverviewSideBadge}>{item.badge}</span> : null}
            </button>
          ))}

          <div className={styles.projOverviewSideDivider} />
          <div className={styles.projOverviewProgressCard}>
            <div className={styles.projOverviewProgressTitle}>Progress</div>
            {[
              { label: "Overall", pct: 54, tone: "var(--accent)" },
              { label: "Budget", pct: 41, tone: "var(--green)" },
              { label: "Timeline", pct: 58, tone: "var(--amber)" },
            ].map((row) => (
              <div key={row.label} className={styles.projOverviewProgressRow}>
                <div className={styles.projOverviewProgressMeta}>
                  <span>{row.label}</span>
                  <span style={{ color: row.tone }}>{row.pct}%</span>
                </div>
                <div className={styles.projOverviewProgressTrack}>
                  <div className={styles.projOverviewProgressFill} style={{ width: `${row.pct}%`, background: row.tone }} />
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section className={styles.projOverviewMain}>
          <div className={cx("pageHeader", "mb0")}> 
            <div>
              <div className={cx("pageEyebrow")}>Veldt Finance · Dashboard Rebuild</div>
              <h1 className={cx("pageTitle")}>Project Overview</h1>
              <p className={cx("pageSub")}>Everything happening on your project, in one place.</p>
            </div>
            <div className={cx("pageActions")}>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => notify("Digest sent", "Summary emailed to naledi@veldt.co.za")}>Email Digest</button>
              <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => setScopeModal(true)}>Request Change</button>
            </div>
          </div>

          <div className={styles.projOverviewTabs}>
            {TABS.map((item) => (
              <button key={item} type="button" className={cx(styles.projOverviewTab, tab === item && styles.projOverviewTabActive)} onClick={() => setTab(item)}>
                {item}
              </button>
            ))}
          </div>

          {tab === "Project Pulse" ? (
            <>
              <div className={styles.projOverviewStats}>
                {[
                  { label: "Overall Progress", value: "54%", sub: "On track for Mar 28 launch", bar: "var(--accent)" },
                  { label: "Days Remaining", value: "35", sub: "Launch: Mar 28, 2026", bar: "var(--blue)" },
                  { label: "Milestones Done", value: "2/6", sub: "Next: UI/UX (72% done)", bar: "var(--green)" },
                  { label: "Pending Actions", value: "3", sub: "Need your response", bar: "var(--amber)" },
                  { label: "Budget Used", value: "41%", sub: "R 32,800 of R 80,000", bar: "var(--purple)" },
                ].map((item) => (
                  <div key={item.label} className={styles.projOverviewStat}>
                    <div className={styles.projOverviewStatBar} style={{ background: item.bar }} />
                    <div className={styles.projOverviewStatLabel}>{item.label}</div>
                    <div className={styles.projOverviewStatValue}>{item.value}</div>
                    <div className={styles.projOverviewStatSub}>{item.sub}</div>
                  </div>
                ))}
              </div>

              <div className={styles.projOverviewContent}>
                <div>
                  <div className={styles.projOverviewSectionTitle}>This Week&apos;s Project Pulse</div>
                  <div className={styles.projOverviewPulseCard}>
                    <div className={styles.projOverviewPulseEyebrow}><span className={styles.projOverviewPulseDot} /> AI-Generated Summary · Feb 21, 2026</div>
                    <div className={styles.projOverviewPulseText}>
                      <strong>Good progress this week.</strong> The UI/UX design phase is 72% complete — Sipho has finished the homepage and onboarding flows, ready for your review. <em>Dashboard designs are in progress, ready by Wednesday.</em>
                      <br /><br />
                      <strong>What&apos;s coming next week:</strong> Mobile responsive screens go into design. Once you approve the dashboard UI, frontend development kicks off.
                      <br /><br />
                      <strong>We need something from you:</strong> Dashboard design awaits your sign-off, and 2 scope change requests need a decision before we can proceed.
                    </div>
                    <div className={styles.projOverviewPulseMeta}>
                      <div className={styles.projOverviewPulseMetaItem}>Updated <strong>2 hours ago</strong></div>
                      <div className={styles.projOverviewPulseMetaItem}>Next digest <strong>Monday 07:00</strong></div>
                      <div className={styles.projOverviewPulseMetaItem}>Health <strong style={{ color: "var(--green)" }}>On Track</strong></div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className={styles.projOverviewSectionTitle}>What We Need From You</div>
                  <div className={cx("card", styles.projOverviewNeedsCard)}>
                    {[
                      {
                        icon: "✍️",
                        bg: "var(--accent-dim)",
                        title: "Sign off on Dashboard UI Design",
                        desc: "Ready for review since Feb 19 · Sipho Ndlovu",
                        due: "Overdue",
                        dueClass: styles.projOverviewDueOver,
                      },
                      {
                        icon: "📋",
                        bg: "var(--amber-dim)",
                        title: "Approve scope change: E-commerce checkout",
                        desc: "R 18,000 · +2 weeks impact · Decision needed before dev starts",
                        due: "Due today",
                        dueClass: styles.projOverviewDueToday,
                      },
                      {
                        icon: "📝",
                        bg: "var(--purple-dim)",
                        title: "Submit homepage copy",
                        desc: "3 pages still need content from your team",
                        due: "Due Mar 1",
                        dueClass: styles.projOverviewDueSoon,
                      },
                    ].map((item) => (
                      <div key={item.title} className={styles.projOverviewNeedRow}>
                        <div className={styles.projOverviewNeedIcon} style={{ background: item.bg }}>{item.icon}</div>
                        <div className={styles.projOverviewGrow}>
                          <div className={styles.projOverviewNeedTitle}>{item.title}</div>
                          <div className={styles.projOverviewNeedDesc}>{item.desc}</div>
                        </div>
                        <span className={cx(styles.projOverviewNeedDue, item.dueClass)}>{item.due}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.projOverviewGrid2}>
                  <div>
                    <div className={styles.projOverviewSectionTitle}>Project Mood</div>
                    <div className={cx("card")}>
                      <div className={cx("cardHeader")}>
                        <div>
                          <div className={cx("cardTitle")}>How are you feeling?</div>
                          <div className={cx("cardMeta")}>Weekly confidence check-in</div>
                        </div>
                      </div>
                      {(["This week", "Last week", "Week of Feb 7"] as const).map((week) => (
                        <div key={week} className={styles.projOverviewMoodRow}>
                          <span className={styles.projOverviewMoodWeek}>{week}</span>
                          <div className={styles.projOverviewMoodEmojiRow}>
                            {(["😄", "😊", "😐", "😟", "😡"] as Mood[]).map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                className={cx(styles.projOverviewMoodEmoji, moods[week] === emoji && styles.projOverviewMoodEmojiActive)}
                                onClick={() => {
                                  setMoods((prev) => ({ ...prev, [week]: emoji }));
                                  notify("Mood recorded", "Thanks for the check-in");
                                }}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                          <span className={styles.projOverviewMoodCopy}>
                            {moods[week] === "😄"
                              ? "Feeling great!"
                              : moods[week] === "😊"
                                ? "Going well"
                                : moods[week] === "😐"
                                  ? "It is okay"
                                  : moods[week] === "😟"
                                    ? "A bit concerned"
                                    : "Very concerned"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className={styles.projOverviewSectionTitle}>Celebration</div>
                    <div className={cx("card", styles.projOverviewCelebrateCard)}>
                      <div className={styles.projOverviewCelebrateIcon}>🎉</div>
                      <div className={styles.projOverviewCelebrateTitle}>Brand Identity Complete!</div>
                      <div className={styles.projOverviewCelebrateText}>
                        Your brand guidelines and logo suite were delivered and approved on Feb 12. That is 2 milestones down — the foundation is locked in.
                      </div>
                      <div className={styles.projOverviewCelebrateNext}>Next: UI/UX Design (72% done)</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}

          {tab === "Milestones" ? (
            <div className={styles.projOverviewContent}>
              <div>
                <div className={styles.projOverviewSectionTitle}>Project Milestones</div>
                <div className={cx("card")}> 
                  {MILESTONES.map((item, index) => (
                    <div key={item.title} className={styles.projOverviewMilestoneRow}>
                      <div className={styles.projOverviewMilestoneLine}>
                        <div className={cx(
                          styles.projOverviewMilestoneCircle,
                          item.status === "done"
                            ? styles.projOverviewMilestoneDone
                            : item.status === "active"
                              ? styles.projOverviewMilestoneActive
                              : item.status === "blocked"
                                ? styles.projOverviewMilestoneBlocked
                                : styles.projOverviewMilestonePending,
                        )}>
                          {item.status === "done" ? "✓" : item.status === "active" ? "●" : item.status === "blocked" ? "!" : String(index + 1)}
                        </div>
                        {index < MILESTONES.length - 1 ? <div className={styles.projOverviewMilestoneConnector} /> : null}
                      </div>

                      <div className={styles.projOverviewGrow}>
                        <div className={styles.projOverviewMilestoneTitle}>{item.title}</div>
                        <div className={styles.projOverviewMilestoneMeta}>{item.meta} · {item.deliverables} deliverables</div>
                        {item.pct > 0 ? (
                          <div className={styles.projOverviewMilestoneTrack}>
                            <div className={styles.projOverviewMilestoneFill} style={{ width: `${item.pct}%`, background: item.status === "done" ? "var(--green)" : "var(--accent)" }} />
                          </div>
                        ) : null}
                        <div className={styles.projOverviewTagRow}>
                          {item.tags.map((tag) => <span key={tag} className={cx("badge", "badgeMuted")}>{tag}</span>)}
                          <span className={cx("badge", item.status === "done" ? "badgeGreen" : item.status === "active" ? "badgeAccent" : item.status === "blocked" ? "badgeRed" : "badgeMuted")}>
                            {item.status === "done" ? "Complete" : item.status === "active" ? "In Progress" : item.status === "blocked" ? "Blocked" : "Upcoming"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {tab === "Deliverables" ? (
            <div className={styles.projOverviewContent}>
              <div>
                <div className={styles.projOverviewSectionTitle}>All Deliverables</div>
                <div className={cx("card", styles.projOverviewTableCard)}>
                  <div className={styles.projOverviewDeliverableHead}>
                    <span>Deliverable</span>
                    <span>Project</span>
                    <span>Owner</span>
                    <span>Status</span>
                  </div>
                  {DELIVERABLES.map((item) => (
                    <div key={`${item.name}-${item.date}`} className={styles.projOverviewDeliverableRow}>
                      <div>
                        <div className={styles.projOverviewDeliverableName}>{item.name}</div>
                        <div className={styles.projOverviewDeliverableProjectSub}>{item.project}</div>
                      </div>
                      <div className={styles.projOverviewDeliverableOwner}>{item.owner}</div>
                      <div className={styles.projOverviewDeliverableDate}>{item.date}</div>
                      <div className={styles.projOverviewDeliverableStatus}><span className={cx("badge", STATUS_BADGE[item.status])}>{STATUS_LABELS[item.status]}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {tab === "Timeline" ? (
            <div className={styles.projOverviewContent}>
              <div>
                <div className={styles.projOverviewSectionTitle}>Project Timeline</div>
                <div className={cx("card")}> 
                  <div className={styles.projOverviewTimelineLegend}>
                    <span><i className={styles.projOverviewLegendPlanned} />Planned</span>
                    <span><i className={styles.projOverviewLegendActual} />Actual</span>
                    <span><i className={styles.projOverviewLegendLate} />Running Late</span>
                  </div>

                  <div className={styles.projOverviewTimelineWrap}>
                    <div className={styles.projOverviewTimelineHead}>
                      <div className={styles.projOverviewTimelineLeft}>Phase</div>
                      {["Jan", "Feb", "Mar", "Apr"].map((month) => <div key={month} className={styles.projOverviewTimelineMonth}>{month}</div>)}
                    </div>

                    {[
                      { name: "Discovery", planned: [0, 25], actual: [0, 25], type: "actual" as const },
                      { name: "Brand Identity", planned: [20, 50], actual: [20, 55], type: "actual" as const },
                      { name: "UI/UX Design", planned: [45, 70], actual: [48, 78], type: "late" as const },
                      { name: "Frontend Dev", planned: [65, 85], actual: null, type: "planned" as const },
                      { name: "QA & Testing", planned: [80, 93], actual: null, type: "planned" as const },
                      { name: "Launch", planned: [90, 100], actual: null, type: "planned" as const },
                    ].map((row) => (
                      <div key={row.name} className={styles.projOverviewTimelineRow}>
                        <div className={styles.projOverviewTimelineName}>{row.name}</div>
                        <div className={styles.projOverviewTimelineTrack}>
                          <div className={cx(styles.projOverviewTimelineBar, styles.projOverviewTimelinePlanned)} style={{ left: `${row.planned[0]}%`, width: `${row.planned[1] - row.planned[0]}%` }}>Planned</div>
                          {row.actual ? (
                            <div className={cx(styles.projOverviewTimelineBar, row.type === "late" ? styles.projOverviewTimelineLate : styles.projOverviewTimelineActual)} style={{ left: `${row.actual[0]}%`, width: `${row.actual[1] - row.actual[0]}%` }}>
                              {row.type === "late" ? "Running late" : "Done"}
                            </div>
                          ) : null}
                          <div className={styles.projOverviewTimelineToday} style={{ left: "62%" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {tab === "Decisions" ? (
            <div className={styles.projOverviewContent}>
              <div>
                <div className={styles.projOverviewSectionTitle}>Decision Log</div>
                <div className={styles.projOverviewInfoStrip}>Every decision made on your project is logged here.</div>
                {DECISIONS.map((item) => (
                  <div key={item.title} className={styles.projOverviewDecisionRow}>
                    <div className={styles.projOverviewDecisionHead}>
                      <div className={styles.projOverviewDecisionTitle}>{item.title}</div>
                      <span className={cx("badge", "badgeAccent")}>Decision</span>
                    </div>
                    <div className={styles.projOverviewDecisionMeta}>{item.meta}</div>
                    <div className={styles.projOverviewDecisionBy}>By: {item.by}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {tab === "Scope Changes" ? (
            <div className={styles.projOverviewContent}>
              <div>
                <div className={styles.projOverviewHeadInline}>
                  <div className={styles.projOverviewHeadLineWrap}>
                    <span className={styles.projOverviewSectionTitlePlain}>Scope Change Requests</span>
                    <div className={styles.projOverviewHeadLine} />
                  </div>
                  <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => setScopeModal(true)}>Request Change</button>
                </div>

                {scopes.map((item) => (
                  <div key={item.id} className={cx(styles.projOverviewScopeRow, item.status === "pending" && styles.projOverviewScopePending)}>
                    <div className={styles.projOverviewScopeHead}>
                      <div className={styles.projOverviewScopeTitle}>{item.title}</div>
                      <span className={cx("badge", item.status === "pending" ? "badgeAmber" : item.status === "approved" ? "badgeGreen" : "badgeRed")}>
                        {item.status}
                      </span>
                    </div>
                    <div className={styles.projOverviewScopeBody}>{item.body}</div>
                    {item.status === "pending" ? (
                      <div className={styles.projOverviewScopeActions}>
                        <button type="button" className={styles.projOverviewApproveBtn} onClick={() => handleScope(item.id, "approved")}>Approve</button>
                        <button type="button" className={styles.projOverviewDeclineBtn} onClick={() => handleScope(item.id, "declined")}>Decline</button>
                        <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => notify("Query sent", "Team will respond within 24 hours")}>Ask Question</button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {tab === "Risks" ? (
            <div className={styles.projOverviewContent}>
              <div>
                <div className={styles.projOverviewSectionTitle}>Risk Register</div>
                <div className={styles.projOverviewInfoStrip}>Potential issues we are tracking and actively managing.</div>
                <div className={cx("card", styles.projOverviewTableCard)}>
                  <div className={styles.projOverviewRiskHead}>
                    <span>Risk</span>
                    <span>Likelihood</span>
                    <span>Impact</span>
                    <span>Mitigation</span>
                  </div>
                  {RISKS.map((item) => (
                    <div key={item.name} className={styles.projOverviewRiskRow}>
                      <div>
                        <div className={styles.projOverviewRiskName}>{item.name}</div>
                        <div className={styles.projOverviewRiskDetail}>{item.detail}</div>
                      </div>
                      <div>
                        <span className={cx(styles.projOverviewRiskPill, item.likelihood === "High" ? styles.projOverviewRiskHigh : item.likelihood === "Medium" ? styles.projOverviewRiskMedium : styles.projOverviewRiskLow)}>{item.likelihood}</span>
                      </div>
                      <div>
                        <span className={cx(styles.projOverviewRiskPill, item.impact === "High" ? styles.projOverviewRiskHigh : item.impact === "Medium" ? styles.projOverviewRiskMedium : styles.projOverviewRiskLow)}>{item.impact}</span>
                      </div>
                      <div className={styles.projOverviewRiskMitigation}>{item.mitigation}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {tab === "Sign-off" ? (
            <div className={styles.projOverviewContent}>
              <div>
                <div className={styles.projOverviewSectionTitle}>Client Sign-off Portal</div>
                <div className={cx("card")}> 
                  <div className={cx("cardHeader")}>
                    <div>
                      <div className={cx("cardTitle")}>Deliverable Approvals</div>
                      <div className={cx("cardMeta")}>Formal approvals are timestamped in the project log.</div>
                    </div>
                  </div>
                  {SIGNOFFS.map((item) => (
                    <div key={item.name} className={styles.projOverviewSignoffRow}>
                      <div className={styles.projOverviewSignoffIcon}>{item.icon}</div>
                      <div className={styles.projOverviewGrow}>
                        <div className={styles.projOverviewSignoffName}>{item.name}</div>
                        <div className={styles.projOverviewSignoffMeta}>{item.meta}</div>
                      </div>
                      <div className={styles.projOverviewSignoffActions}>
                        {item.status === "signed" ? <span className={cx("badge", "badgeGreen")}>Signed</span> : null}
                        {item.status === "notready" ? <span className={cx("badge", "badgeMuted")}>Not Ready</span> : null}
                        {item.status === "pending" ? (
                          <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => setSignoffModal(item)}>Review & Sign</button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      {scopeModal ? (
        <div className={styles.projOverviewModalBackdrop} onClick={() => setScopeModal(false)}>
          <div className={styles.projOverviewModal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.projOverviewModalHeader}>
              <span className={styles.projOverviewModalTitle}>Request Scope Change</span>
              <button type="button" className={styles.projOverviewModalClose} onClick={() => setScopeModal(false)}>✕</button>
            </div>
            <div className={styles.projOverviewModalBody}>
              <label className={styles.projOverviewFieldLabel}>What would you like to change?</label>
              <input className={styles.projOverviewFieldInput} placeholder="Brief title for the change" />
              <label className={styles.projOverviewFieldLabel}>Describe in detail</label>
              <textarea className={styles.projOverviewFieldArea} placeholder="The more detail, the faster we can assess it." />
              <label className={styles.projOverviewFieldLabel}>Priority</label>
              <div className={styles.projOverviewPriorityGrid}>
                {[
                  "Nice to Have",
                  "Important",
                  "Urgent",
                ].map((option) => <button key={option} type="button" className={styles.projOverviewPriorityButton}>{option}</button>)}
              </div>
            </div>
            <div className={styles.projOverviewModalFooter}>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setScopeModal(false)}>Cancel</button>
              <button
                type="button"
                className={cx("btnSm", "btnAccent")}
                onClick={() => {
                  setScopeModal(false);
                  notify("Request submitted", "Team will respond within 24 hours");
                }}
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {signoffModal ? (
        <div className={styles.projOverviewModalBackdrop} onClick={() => setSignoffModal(null)}>
          <div className={styles.projOverviewModal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.projOverviewModalHeader}>
              <span className={styles.projOverviewModalTitle}>Review & Sign Off</span>
              <button type="button" className={styles.projOverviewModalClose} onClick={() => setSignoffModal(null)}>✕</button>
            </div>
            <div className={styles.projOverviewModalBody}>
              <div className={styles.projOverviewSignoffCard}>
                <div className={styles.projOverviewSignoffCardLabel}>Deliverable</div>
                <div className={styles.projOverviewSignoffCardName}>{signoffModal.name}</div>
              </div>
              <p className={styles.projOverviewSignoffCopy}>
                By signing off, you confirm this deliverable meets the agreed requirements. This creates a timestamped record in the project log.
              </p>
              <label className={styles.projOverviewFieldLabel}>Comments or notes?</label>
              <textarea className={styles.projOverviewFieldArea} placeholder="Optional notes before signing off..." />
            </div>
            <div className={styles.projOverviewModalFooter}>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => setSignoffModal(null)}>Request Changes</button>
              <button
                type="button"
                className={cx("btnSm", "btnAccent")}
                onClick={() => {
                  const deliverableName = signoffModal.name;
                  setSignoffModal(null);
                  notify("Signed off", `${deliverableName} approved and recorded`);
                }}
              >
                Sign Off
              </button>
            </div>
          </div>
        </div>
      ) : null}

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

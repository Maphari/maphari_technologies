"use client";

import { useEffect, useMemo, useState } from "react";
import { cx, styles } from "../style";

type LaunchTab = "Status Page" | "Go-Live Checklist" | "Acceptance Criteria" | "Project Wrap Report";

type ChecklistItem = {
  name: string;
  owner: string;
  done: boolean;
};

type ChecklistSection = {
  title: string;
  items: ChecklistItem[];
};

type CriteriaItem = {
  text: string;
  met: boolean | null;
};

type CriteriaSection = {
  name: string;
  items: CriteriaItem[];
};

const CHECKLIST_SECTIONS: ChecklistSection[] = [
  {
    title: "Content & Copy",
    items: [
      { name: "All page copy finalised and approved", owner: "Client (Naledi D.)", done: true },
      { name: "Legal pages: Privacy Policy, T&Cs", owner: "Client (Naledi D.)", done: false },
      { name: "Images and media assets supplied", owner: "Client (Naledi D.)", done: false },
      { name: "Favicon and social share images", owner: "Lerato M.", done: true },
    ],
  },
  {
    title: "Technical",
    items: [
      { name: "Domain configured and pointing correctly", owner: "James M.", done: true },
      { name: "SSL certificate installed", owner: "James M.", done: true },
      { name: "All forms tested and sending", owner: "Thabo K.", done: false },
      { name: "Performance score > 90 on Lighthouse", owner: "James M.", done: false },
      { name: "Mobile responsiveness QA passed", owner: "Thabo K.", done: false },
      { name: "Cross-browser testing complete", owner: "Thabo K.", done: false },
    ],
  },
  {
    title: "Analytics & Tracking",
    items: [
      { name: "Google Analytics / GA4 installed", owner: "James M.", done: true },
      { name: "Conversion goals configured", owner: "James M.", done: false },
      { name: "Hotjar / session recording active", owner: "James M.", done: false },
    ],
  },
  {
    title: "Approvals",
    items: [
      { name: "Client final sign-off obtained", owner: "Client (Naledi D.)", done: false },
      { name: "Legal review of content complete", owner: "Client (Naledi D.)", done: false },
      { name: "Go-live date confirmed by both parties", owner: "Sipho N.", done: true },
    ],
  },
];

const CRITERIA: CriteriaSection[] = [
  {
    name: "Homepage Design",
    items: [
      { text: "Hero section communicates the core value proposition within 5 seconds", met: true },
      { text: "Navigation is visible and functional on both mobile and desktop", met: true },
      { text: "CTA button is above the fold on all screen sizes", met: null },
      { text: "Page load time under 2 seconds on a 4G connection", met: null },
    ],
  },
  {
    name: "Dashboard UI Design",
    items: [
      { text: "All 6 core widgets are visible on a 1440px screen without scrolling", met: null },
      { text: "Data updates reflect in real time without page refresh", met: null },
      { text: "Empty states are designed for all zero-data scenarios", met: null },
      { text: "Accessible — meets WCAG AA contrast requirements", met: null },
    ],
  },
  {
    name: "Authentication Flows",
    items: [
      { text: "Login, signup, and password reset flows all functional", met: null },
      { text: "Error states handled gracefully with user-friendly messages", met: null },
      { text: "Session timeout redirects to login without data loss", met: null },
    ],
  },
];

const TABS: LaunchTab[] = ["Status Page", "Go-Live Checklist", "Acceptance Criteria", "Project Wrap Report"];

const COMPONENTS = [
  { name: "Design System", status: "Operational", color: "var(--green)" },
  { name: "Frontend Build", status: "Not started", color: "var(--muted2)" },
  { name: "API Integration", status: "Not started", color: "var(--muted2)" },
  { name: "Authentication", status: "Not started", color: "var(--muted2)" },
  { name: "Database", status: "Not started", color: "var(--muted2)" },
  { name: "Hosting / Infra", status: "Configured", color: "var(--accent)" },
] as const;

export function ReportsPage() {
  const [tab, setTab] = useState<LaunchTab>("Status Page");
  const [checks, setChecks] = useState<ChecklistSection[]>(CHECKLIST_SECTIONS.map((section) => ({
    ...section,
    items: section.items.map((item) => ({ ...item })),
  })));
  const [criteriaState, setCriteriaState] = useState<CriteriaSection[]>(CRITERIA.map((section) => ({
    ...section,
    items: section.items.map((item) => ({ ...item })),
  })));
  const [toast, setToast] = useState<{ title: string; subtitle: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const allItems = useMemo(() => checks.flatMap((section) => section.items), [checks]);
  const doneCount = useMemo(() => allItems.filter((item) => item.done).length, [allItems]);
  const donePct = useMemo(() => {
    const total = allItems.length || 1;
    return Math.round((doneCount / total) * 100);
  }, [allItems.length, doneCount]);

  function notify(title: string, subtitle: string): void {
    setToast({ title, subtitle });
  }

  function toggleCheck(sectionIndex: number, itemIndex: number): void {
    setChecks((prev) => prev.map((section, si) => {
      if (si !== sectionIndex) return section;
      return {
        ...section,
        items: section.items.map((item, ii) => (ii === itemIndex ? { ...item, done: !item.done } : item)),
      };
    }));
  }

  function toggleCriteria(sectionIndex: number, itemIndex: number, value: boolean): void {
    setCriteriaState((prev) => prev.map((section, si) => {
      if (si !== sectionIndex) return section;
      return {
        ...section,
        items: section.items.map((item, ii) => {
          if (ii !== itemIndex) return item;
          return { ...item, met: item.met === value ? null : value };
        }),
      };
    }));
  }

  return (
    <div className={cx("pageBody", styles.statusLaunchRoot)}>
      <div className={styles.statusLaunchLayout}>
        <aside className={styles.statusLaunchSidebar}>
          <div className={styles.statusLaunchSection}>Launch Tools</div>
          {[
            { label: "Status Page", tone: styles.statusLaunchToneGreen },
            { label: "Go-Live Checklist", tone: styles.statusLaunchToneAccent },
            { label: "Acceptance Criteria", tone: styles.statusLaunchTonePurple },
            { label: "Project Wrap Report", tone: styles.statusLaunchToneBlue },
          ].map((item) => (
            <button key={item.label} type="button" className={cx(styles.statusLaunchSideItem, tab === item.label && styles.statusLaunchSideItemActive)} onClick={() => setTab(item.label as LaunchTab)}>
              <span className={cx(styles.statusLaunchDot, item.tone)} />
              <span>{item.label}</span>
            </button>
          ))}

          <div className={styles.statusLaunchDivider} />
          <div className={styles.statusLaunchProgressCard}>
            <div className={styles.statusLaunchProgressTitle}>Launch Readiness</div>
            <div className={styles.statusLaunchProgressTrack}><div className={styles.statusLaunchProgressFill} style={{ width: `${donePct}%` }} /></div>
            <div className={styles.statusLaunchProgressMeta}>
              <span>{doneCount}/{allItems.length} checks</span>
              <span>{donePct}%</span>
            </div>
          </div>

          <div className={styles.statusLaunchDateCard}>
            <div>🚀 Launch date: <strong>Mar 28, 2026</strong></div>
            <div className={donePct < 80 ? styles.statusLaunchWarn : styles.statusLaunchReady}>{donePct < 80 ? "Not yet ready" : "Ready to launch"}</div>
          </div>
        </aside>

        <section className={styles.statusLaunchMain}>
          <div className={cx("pageHeader", "mb0")}>
            <div>
              <div className={cx("pageEyebrow")}>Veldt Finance · Launch</div>
              <h1 className={cx("pageTitle")}>Status &amp; Launch</h1>
              <p className={cx("pageSub")}>Real-time project health, go-live checklist, and clean handover readiness.</p>
            </div>
            <div className={cx("pageActions")}>
              <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => notify("Link copied", "Public status page URL copied")}>Share Status Page</button>
              <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => notify("Report generated", "Wrap report downloaded as PDF")}>Wrap Report</button>
            </div>
          </div>

          <div className={styles.statusLaunchTabs}>
            {TABS.map((item) => (
              <button key={item} type="button" className={cx(styles.statusLaunchTab, tab === item && styles.statusLaunchTabActive)} onClick={() => setTab(item)}>
                {item}
              </button>
            ))}
          </div>

          {tab === "Status Page" ? (
            <div className={styles.statusLaunchContent}>
              <div className={styles.statusLaunchHero}>
                <div className={styles.statusLaunchBadge}><span className={styles.statusLaunchBadgeDot} /><span>All Systems Operational</span></div>
                <div className={styles.statusLaunchHeroTitle}>Veldt Finance Dashboard</div>
                <div className={styles.statusLaunchHeroSub}>Project status · Updated Feb 21, 2026 at 14:32</div>
              </div>

              <div>
                <div className={styles.statusLaunchSectionTitle}>System Components</div>
                <div className={styles.statusLaunchComponentsGrid}>
                  {COMPONENTS.map((component, index) => (
                    <div key={component.name} className={styles.statusLaunchCompItem}>
                      <div className={styles.statusLaunchCompName}><span className={styles.statusLaunchCompDot} style={{ background: component.color }} />{component.name}</div>
                      <div className={styles.statusLaunchCompStatus} style={{ color: component.color }}>{component.status}</div>
                      <div className={styles.statusLaunchUptimeRow}>
                        {Array.from({ length: 30 }).map((_, day) => (
                          <span
                            key={`${component.name}-${day}`}
                            className={styles.statusLaunchUptimeBar}
                            style={{ background: index === 0 ? (day > 20 ? "var(--green)" : "var(--muted3)") : "var(--muted3)" }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className={styles.statusLaunchSectionTitle}>Recent Incidents</div>
                <div className={styles.statusLaunchIncidentCard}>
                  <div className={styles.statusLaunchIncidentHead}><div className={styles.statusLaunchIncidentTitle}>No incidents recorded</div><span className={cx("badge", "badgeGreen")}>Resolved</span></div>
                  <div className={styles.statusLaunchIncidentBody}>All project systems are running as expected. No disruptions in the last 30 days.</div>
                </div>
              </div>
            </div>
          ) : null}

          {tab === "Go-Live Checklist" ? (
            <div className={styles.statusLaunchContent}>
              <div>
                <div className={styles.statusLaunchChecklistHead}>
                  <div className={styles.statusLaunchChecklistIntro}>Collaborative launch checklist — both client and team can tick items. Launch happens only when everything is green.</div>
                  <span className={cx("badge", "badgeAmber")}>{donePct}% ready</span>
                </div>

                {checks.map((section, sectionIndex) => (
                  <div key={section.title} className={cx("card", styles.statusLaunchChecklistCard)}>
                    <div className={styles.statusLaunchChecklistSectionTitle}>{section.title} · {section.items.filter((item) => item.done).length}/{section.items.length}</div>
                    {section.items.map((item, itemIndex) => (
                      <div key={`${section.title}-${item.name}`} className={styles.statusLaunchChecklistItem}>
                        <button type="button" className={cx(styles.statusLaunchCheck, item.done && styles.statusLaunchCheckDone)} onClick={() => toggleCheck(sectionIndex, itemIndex)} aria-label={item.done ? "Mark incomplete" : "Mark complete"}>{item.done ? "✓" : ""}</button>
                        <div className={styles.statusLaunchGrow}>
                          <div className={cx(styles.statusLaunchChecklistName, item.done && styles.statusLaunchStrike)}>{item.name}</div>
                          <div className={styles.statusLaunchChecklistOwner}>{item.owner}</div>
                        </div>
                        {item.done ? <span className={cx("badge", "badgeGreen")}>Done</span> : null}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {tab === "Acceptance Criteria" ? (
            <div className={styles.statusLaunchContent}>
              <div>
                <div className={styles.statusLaunchSectionTitle}>Acceptance Criteria</div>
                <div className={styles.statusLaunchInfoStrip}>These criteria were agreed at project start. A deliverable is only complete when criteria are met.</div>

                {criteriaState.map((section, sectionIndex) => (
                  <div key={section.name} className={styles.statusLaunchCriteriaCard}>
                    <div className={styles.statusLaunchCriteriaHead}>
                      <div className={styles.statusLaunchCriteriaName}>{section.name}</div>
                      <span className={cx("badge", section.items.every((item) => item.met === true) ? "badgeGreen" : section.items.some((item) => item.met === false) ? "badgeRed" : "badgeMuted")}>
                        {section.items.every((item) => item.met === true) ? "All Met" : section.items.some((item) => item.met === false) ? "Issues Found" : "Pending Review"}
                      </span>
                    </div>

                    <div className={styles.statusLaunchCriteriaBody}>
                      {section.items.map((item, itemIndex) => (
                        <div key={`${section.name}-${itemIndex}`} className={styles.statusLaunchCriterionRow}>
                          <span className={styles.statusLaunchCriterionNum}>{itemIndex + 1}.</span>
                          <span className={styles.statusLaunchCriterionText}>{item.text}</span>
                          <div className={styles.statusLaunchCriterionActions}>
                            <button type="button" className={cx(styles.statusLaunchCriterionBtn, item.met === true && styles.statusLaunchCriterionYes)} onClick={() => toggleCriteria(sectionIndex, itemIndex, true)}>Met</button>
                            <button type="button" className={cx(styles.statusLaunchCriterionBtn, item.met === false && styles.statusLaunchCriterionNo)} onClick={() => toggleCriteria(sectionIndex, itemIndex, false)}>Not Met</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {tab === "Project Wrap Report" ? (
            <div className={styles.statusLaunchContent}>
              <div className={styles.statusLaunchReportHead}>
                <div className={styles.statusLaunchSectionTitle}>Auto-Generated Wrap Report</div>
                <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => notify("Report downloaded", "Project Wrap Report saved as PDF")}>Download PDF</button>
              </div>

              <div className={styles.statusLaunchWarnStrip}>This report finalises at project completion (Mar 28, 2026). Preview reflects current data.</div>

              <div className={styles.statusLaunchReportCard}>
                <div className={styles.statusLaunchReportTitle}>Project Overview</div>
                <div className={styles.statusLaunchReportText}>
                  <p><strong>Project:</strong> Veldt Finance Dashboard Rebuild</p>
                  <p><strong>Client:</strong> Veldt Finance (Naledi Dlamini)</p>
                  <p><strong>Agency:</strong> Maphari (Sipho Ndlovu, Project Lead)</p>
                  <p><strong>Duration:</strong> Jan 10 – Mar 28, 2026 (12 weeks)</p>
                  <p><strong>Scope:</strong> Brand Identity, UI/UX Design, Frontend Development, QA, Launch</p>
                </div>
                <div className={styles.statusLaunchStatsGrid}>
                  {[{ value: "6", label: "Milestones" }, { value: "R 80K", label: "Budget" }, { value: "35", label: "Deliverables" }].map((stat) => (
                    <div key={stat.label} className={styles.statusLaunchStatCard}><div className={styles.statusLaunchStatValue}>{stat.value}</div><div className={styles.statusLaunchStatLabel}>{stat.label}</div></div>
                  ))}
                </div>
              </div>

              <div className={styles.statusLaunchReportCard}>
                <div className={styles.statusLaunchReportTitle}>What Was Delivered</div>
                <div className={styles.statusLaunchReportText}>
                  {[
                    "Brand Identity System (logo, guidelines, colour palette, typography)",
                    "UI/UX Design for 12 screens",
                    "Frontend build — React + TypeScript",
                    "Authentication & user management",
                    "Dashboard with real-time data visualisation",
                    "Mobile-responsive design across all screens",
                    "QA & cross-browser testing",
                    "Deployment to production",
                  ].map((item) => (
                    <div key={item} className={styles.statusLaunchBulletRow}><span>✓</span><span>{item}</span></div>
                  ))}
                </div>
              </div>

              <div className={styles.statusLaunchReportCard}>
                <div className={styles.statusLaunchReportTitle}>Timeline Summary</div>
                <div className={styles.statusLaunchReportText}>
                  {[
                    { phase: "Discovery & Strategy", dates: "Jan 10–14", status: "On time" },
                    { phase: "Brand Identity", dates: "Jan 14 – Feb 12", status: "On time" },
                    { phase: "UI/UX Design", dates: "Feb 12 – Feb 28", status: "In progress" },
                    { phase: "Frontend Dev", dates: "Mar 1 – Mar 21", status: "Upcoming" },
                    { phase: "QA & Testing", dates: "Mar 21 – Apr 4", status: "Upcoming" },
                    { phase: "Launch", dates: "Mar 28", status: "Upcoming" },
                  ].map((row) => (
                    <div key={row.phase} className={styles.statusLaunchTimelineRow}>
                      <span>{row.phase}</span>
                      <span>{row.dates}</span>
                      <span className={row.status === "On time" ? styles.statusLaunchReady : row.status === "In progress" ? styles.statusLaunchAccent : styles.statusLaunchMuted}>{row.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.statusLaunchReportCard}>
                <div className={styles.statusLaunchReportTitle}>Budget Summary</div>
                <div className={styles.statusLaunchStatsGrid}>
                  {[{ value: "R 80,000", label: "Total Budget" }, { value: "R 32,800", label: "Spent to Date" }, { value: "R 47,200", label: "Remaining" }].map((stat) => (
                    <div key={stat.label} className={styles.statusLaunchStatCard}><div className={styles.statusLaunchStatValue}>{stat.value}</div><div className={styles.statusLaunchStatLabel}>{stat.label}</div></div>
                  ))}
                </div>
                <div className={styles.statusLaunchReportText}>Based on current burn rate, the project is forecast to complete at <strong style={{ color: "var(--accent)" }}>R 78,400</strong> — approximately R 1,600 under budget.</div>
              </div>

              <div className={styles.statusLaunchReportCard}>
                <div className={styles.statusLaunchReportTitle}>Key Decisions</div>
                <div className={styles.statusLaunchReportText}>
                  {[
                    "Switched from purple to lime accent colour (Feb 14)",
                    "Reduced homepage sections from 8 to 5 for clarity (Feb 17)",
                    "Added mobile-first approach to all screens (Feb 19)",
                    "Deferred dark mode to Phase 2 (Feb 21)",
                  ].map((decision) => (
                    <div key={decision} className={styles.statusLaunchBulletRow}><span>→</span><span>{decision}</span></div>
                  ))}
                </div>
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

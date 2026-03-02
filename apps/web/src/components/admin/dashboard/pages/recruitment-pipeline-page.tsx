"use client";

import { useState } from "react";
import { cx, styles } from "../style";
import { AdminTabs } from "./shared";
import { colorClass } from "./admin-page-utils";

type Candidate = {
  name: string;
  stage: string;
  score: number;
  source: string;
  flag: string | null;
};

type Role = {
  id: string;
  title: string;
  department: string;
  priority: "high" | "medium" | "low";
  status: "active" | "on-hold" | "filled" | "closed";
  postedDate: string;
  targetDate: string;
  hiringManager: string;
  salaryBand: string;
  applications: number;
  interviewed: number;
  offered: number;
  candidates: Candidate[];
};

const roles: Role[] = [
  {
    id: "REC-003", title: "Senior Brand Designer", department: "Creative", priority: "high",
    status: "active", postedDate: "Feb 5", targetDate: "Mar 15", hiringManager: "Renzo Fabbri",
    salaryBand: "R38k-R46k", applications: 14, interviewed: 4, offered: 0,
    candidates: [
      { name: "Amara Osei", stage: "2nd Interview", score: 88, source: "LinkedIn", flag: null },
      { name: "James Liu", stage: "2nd Interview", score: 81, source: "Referral", flag: null },
      { name: "Priya Sharma", stage: "1st Interview", score: 74, source: "Pnet", flag: "Portfolio weak" },
      { name: "Ben Kruger", stage: "Offer", score: 91, source: "Referral", flag: null }
    ]
  },
  {
    id: "REC-002", title: "Junior Copywriter", department: "Content", priority: "medium",
    status: "active", postedDate: "Jan 22", targetDate: "Mar 1", hiringManager: "Tapiwa Moyo",
    salaryBand: "R18k-R24k", applications: 31, interviewed: 6, offered: 1,
    candidates: [
      { name: "Zoe Hendricks", stage: "Offer Accepted", score: 84, source: "LinkedIn", flag: null },
      { name: "Sipho Zulu", stage: "Offer Declined", score: 79, source: "CareerJet", flag: "Accepted competitor offer" }
    ]
  },
  {
    id: "REC-001", title: "Motion Designer", department: "Creative", priority: "low",
    status: "on-hold", postedDate: "Dec 10", targetDate: "Apr 30", hiringManager: "Renzo Fabbri",
    salaryBand: "R28k-R36k", applications: 8, interviewed: 2, offered: 0,
    candidates: [
      { name: "Lara Venter", stage: "Screen", score: 68, source: "Portfolio site", flag: null },
      { name: "Kwame Asante", stage: "Screen", score: 72, source: "LinkedIn", flag: null }
    ]
  }
];

const stages = ["Applied", "Screen", "1st Interview", "2nd Interview", "Offer", "Offer Accepted", "Offer Declined"] as const;

const stageColors: Record<string, string> = {
  Applied: "var(--muted)",
  Screen: "var(--blue)",
  "1st Interview": "var(--accent)",
  "2nd Interview": "var(--amber)",
  Offer: "var(--amber)",
  "Offer Accepted": "var(--accent)",
  "Offer Declined": "var(--red)"
};

const priorityConfig = {
  high: { color: "var(--red)", label: "High" },
  medium: { color: "var(--amber)", label: "Medium" },
  low: { color: "var(--muted)", label: "Low" }
} as const;

const statusConfig = {
  active: { color: "var(--accent)", label: "Active" },
  "on-hold": { color: "var(--amber)", label: "On Hold" },
  filled: { color: "var(--blue)", label: "Filled" },
  closed: { color: "var(--muted)", label: "Closed" }
} as const;

const tabs = ["pipeline", "kanban", "candidates", "analytics"] as const;
type Tab = (typeof tabs)[number];

function tonePillClass(color: string): string {
  switch (color) {
    case "var(--accent)":
      return styles.rcpPillAccent;
    case "var(--red)":
      return styles.rcpPillRed;
    case "var(--amber)":
      return styles.rcpPillAmber;
    case "var(--blue)":
      return styles.rcpPillBlue;
    default:
      return styles.rcpPillMuted;
  }
}

function toneKanbanCardClass(color: string): string {
  switch (color) {
    case "var(--accent)":
      return styles.rcpKanbanCardAccent;
    case "var(--red)":
      return styles.rcpKanbanCardRed;
    case "var(--amber)":
      return styles.rcpKanbanCardAmber;
    case "var(--blue)":
      return styles.rcpKanbanCardBlue;
    default:
      return styles.rcpKanbanCardMuted;
  }
}

function toneFillClass(color: string): string {
  switch (color) {
    case "var(--accent)":
      return styles.rcpBarFillAccent;
    case "var(--red)":
      return styles.rcpBarFillRed;
    case "var(--amber)":
      return styles.rcpBarFillAmber;
    case "var(--blue)":
      return styles.rcpBarFillBlue;
    default:
      return styles.rcpBarFillMuted;
  }
}

function scoreClass(score: number): string {
  if (score >= 85) return "colorAccent";
  if (score >= 70) return "colorAmber";
  return "colorMuted";
}

export function RecruitmentPipelinePage() {
  const [activeTab, setActiveTab] = useState<Tab>("pipeline");
  const [expanded, setExpanded] = useState<string>("REC-003");

  const totalActive = roles.filter((r) => r.status === "active").length;
  const totalApplications = roles.reduce((s, r) => s + r.applications, 0);
  const totalInterviewed = roles.reduce((s, r) => s + r.interviewed, 0);
  const conversionRate = Math.round((totalInterviewed / Math.max(totalApplications, 1)) * 100);

  const candidatesFlat = roles.flatMap((r) => r.candidates.map((c) => ({ ...c, roleName: r.title, roleId: r.id })));

  return (
    <div className={cx(styles.pageBody, styles.rcpRoot)}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / STAFF</div>
          <h1 className={styles.pageTitle}>Recruitment Pipeline</h1>
          <div className={styles.pageSub}>Open roles, candidates, interview stages, and offer tracking</div>
        </div>
        <button type="button" className={cx("btnSm", "btnAccent")}>+ Open Role</button>
      </div>

      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Open Roles", value: totalActive.toString(), color: "var(--accent)", sub: `${roles.filter((r) => r.status === "on-hold").length} on hold` },
          { label: "Total Applications", value: totalApplications.toString(), color: "var(--blue)", sub: "Across all roles" },
          { label: "Interview Conversion", value: `${conversionRate}%`, color: "var(--accent)", sub: `${totalInterviewed} interviewed` },
          { label: "Offers Outstanding", value: roles.flatMap((r) => r.candidates.filter((c) => c.stage === "Offer")).length.toString(), color: "var(--amber)", sub: "Awaiting candidate response" }
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, colorClass(s.color))}>{s.value}</div>
            <div className={cx("text11", "colorMuted")}>{s.sub}</div>
          </div>
        ))}
      </div>

      <AdminTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        primaryColor={"var(--accent)"}
        mutedColor={"var(--muted)"}
        panelColor={"var(--surface)"}
        borderColor={"var(--border)"}
      />

      <div className={cx("overflowAuto", "minH0")}>
        {activeTab === "pipeline" ? (
          <div className={styles.rcpPipelineList}>
            {roles.map((role) => {
              const sc = statusConfig[role.status];
              const pc = priorityConfig[role.priority];
              const isExp = expanded === role.id;
              return (
                <div key={role.id} className={cx(styles.rcpRoleCard, role.priority === "high" && styles.rcpRoleCardHigh)}>
                  <div
                    role="button"
                    tabIndex={0}
                    className={styles.rcpRoleHead}
                    onClick={() => setExpanded(isExp ? "" : role.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setExpanded(isExp ? "" : role.id);
                      }
                    }}
                  >
                    <div className={styles.rcpRoleSummary}>
                      <div>
                        <div className={styles.rcpRoleTitle}>{role.title}</div>
                        <div className={styles.rcpRoleMeta}>{role.department} - {role.hiringManager} - {role.salaryBand}</div>
                      </div>
                      <div>
                        <div className={styles.rcpLabel}>Posted</div>
                        <div className={styles.rcpMono11}>{role.postedDate}</div>
                      </div>
                      <div className={styles.rcpMetricBox}>
                        <div className={styles.rcpLabel}>Applied</div>
                        <div className={styles.rcpApplied}>{role.applications}</div>
                      </div>
                      <div className={styles.rcpMetricBox}>
                        <div className={styles.rcpLabel}>Interviewed</div>
                        <div className={styles.rcpInterviewed}>{role.interviewed}</div>
                      </div>
                      <div className={styles.rcpMetricBox}>
                        <div className={styles.rcpLabel}>Offered</div>
                        <div className={styles.rcpOffered}>{role.offered}</div>
                      </div>
                      <span className={cx(styles.rcpPill, tonePillClass(pc.color))}>{pc.label}</span>
                      <span className={cx(styles.rcpPill, tonePillClass(sc.color))}>{sc.label}</span>
                      <button type="button" className={cx("btnSm", "btnGhost")}>{isExp ? "▲" : "▼"}</button>
                    </div>
                  </div>

                  {isExp ? (
                    <div className={styles.rcpExpanded}>
                      <div className={styles.rcpExpandedInner}>
                        <div className={styles.rcpShortlistTitle}>Candidate Shortlist</div>
                        <div className={styles.rcpCandidateList}>
                          {role.candidates.map((c, i) => (
                            <div key={i} className={styles.rcpCandidateRow}>
                              <div>
                                <div className={styles.rcpCandName}>{c.name}</div>
                                <div className={styles.rcpCandMeta}>Source: {c.source}</div>
                              </div>
                              <div>
                                <div className={styles.rcpLabelSmall}>Stage</div>
                                <span className={cx(styles.rcpPill, tonePillClass(stageColors[c.stage]))}>{c.stage}</span>
                              </div>
                              <div className={styles.rcpMetricBox}>
                                <div className={styles.rcpLabelSmall}>Score</div>
                                <div className={cx(styles.rcpMono11, "fw700", scoreClass(c.score))}>{c.score}</div>
                              </div>
                              {c.flag ? <div className={styles.rcpFlag}>⚑ {c.flag}</div> : <div />}
                              <div className={styles.rcpActionRow}>
                                <button type="button" className={cx("btnSm", "btnAccent")}>Advance</button>
                                <button type="button" className={cx("btnSm", "btnGhost")}>Notes</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}

        {activeTab === "kanban" ? (
          <div className={styles.rcpKanbanRow}>
            {stages.map((stage) => {
              const stageCandidates = roles.flatMap((r) =>
                r.candidates
                  .filter((c) => c.stage === stage)
                  .map((c) => ({ ...c, role: r.title }))
              );
              const stageColor = stageColors[stage];
              return (
                <div key={stage} className={styles.rcpKanbanCol}>
                  <div className={styles.rcpKanbanHead}>
                    <span className={cx(styles.rcpKanbanTitle, colorClass(stageColor))}>{stage}</span>
                    <span className={cx(styles.rcpKanbanCount, tonePillClass(stageColor))}>{stageCandidates.length}</span>
                  </div>
                  <div className={styles.rcpKanbanStack}>
                    {stageCandidates.map((c, i) => (
                      <div key={i} className={cx(styles.rcpKanbanCard, toneKanbanCardClass(stageColor))}>
                        <div className={styles.rcpCandName}>{c.name}</div>
                        <div className={styles.rcpCandMeta}>{c.role}</div>
                        <div className={styles.rcpKanbanFoot}>
                          <span className={styles.rcpCandMeta}>{c.source}</span>
                          <span className={cx(styles.rcpMono11, "fw700", scoreClass(c.score))}>{c.score}</span>
                        </div>
                        {c.flag ? <div className={styles.rcpFlagMini}>⚑ {c.flag}</div> : null}
                      </div>
                    ))}
                    {stageCandidates.length === 0 ? <div className={styles.rcpKanbanEmpty}>Empty</div> : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {activeTab === "candidates" ? (
          <div className={styles.rcpTableCard}>
            <div className={cx(styles.rcpCandHead, "fontMono", "text10", "colorMuted", "uppercase")}>
              {["Candidate", "Role", "Source", "Stage", "Score", "Flag", ""].map((h) => <span key={h}>{h}</span>)}
            </div>
            {candidatesFlat.map((c, i) => (
              <div key={`${c.roleId}-${c.name}`} className={cx(styles.rcpCandRow, i < candidatesFlat.length - 1 && "borderB")}>
                <span className={styles.rcpCandName}>{c.name}</span>
                <span className={styles.rcpCandMeta}>{c.roleName}</span>
                <span className={styles.rcpCandMeta}>{c.source}</span>
                <span className={cx(styles.rcpPill, tonePillClass(stageColors[c.stage]))}>{c.stage}</span>
                <span className={cx(styles.rcpMono11, "fw700", scoreClass(c.score))}>{c.score}</span>
                <span className={cx(styles.rcpFlagGlyph, c.flag ? "colorRed" : "colorMuted")}>{c.flag ? "⚑" : "-"}</span>
                <button type="button" className={cx("btnSm", "btnGhost")}>View</button>
              </div>
            ))}
          </div>
        ) : null}

        {activeTab === "analytics" ? (
          <div className={styles.rcpAnalyticsSplit}>
            <div className={cx("card", "p24")}>
              <div className={styles.rcpSectionTitle}>Application Sources</div>
              {[
                { source: "LinkedIn", count: roles.flatMap((r) => r.candidates.filter((c) => c.source === "LinkedIn")).length, color: "var(--blue)" },
                { source: "Referral", count: roles.flatMap((r) => r.candidates.filter((c) => c.source === "Referral")).length, color: "var(--accent)" },
                { source: "Pnet", count: roles.flatMap((r) => r.candidates.filter((c) => c.source === "Pnet")).length, color: "var(--accent)" },
                { source: "Portfolio site", count: roles.flatMap((r) => r.candidates.filter((c) => c.source === "Portfolio site")).length, color: "var(--amber)" },
                { source: "CareerJet", count: roles.flatMap((r) => r.candidates.filter((c) => c.source === "CareerJet")).length, color: "var(--muted)" }
              ].map((s) => (
                <div key={s.source} className={styles.rcpBarRow}>
                  <span className={styles.text12}>{s.source}</span>
                  <div className={styles.rcpTrack80}>
                    <progress className={cx(styles.rcpBarFill, "uiProgress", toneFillClass(s.color))} max={100} value={(s.count / 8) * 100} />
                  </div>
                  <span className={cx(styles.rcpCount, colorClass(s.color))}>{s.count}</span>
                </div>
              ))}
            </div>
            <div className={cx("card", "p24")}>
              <div className={styles.rcpSectionTitle}>Recruitment Funnel</div>
              {[
                { stage: "Applications", count: totalApplications, color: "var(--muted)" },
                { stage: "Screened", count: 18, color: "var(--blue)" },
                { stage: "Interviewed", count: totalInterviewed, color: "var(--accent)" },
                { stage: "Offered", count: 2, color: "var(--amber)" },
                { stage: "Accepted", count: 1, color: "var(--accent)" }
              ].map((f) => (
                <div key={f.stage} className={styles.rcpBarRow}>
                  <span className={styles.text12}>{f.stage}</span>
                  <div className={styles.rcpTrack120}>
                    <progress className={cx(styles.rcpBarFill, "uiProgress", toneFillClass(f.color))} max={100} value={(f.count / Math.max(totalApplications, 1)) * 100} />
                  </div>
                  <span className={cx(styles.rcpCount, styles.rcpCountWide, colorClass(f.color))}>{f.count}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

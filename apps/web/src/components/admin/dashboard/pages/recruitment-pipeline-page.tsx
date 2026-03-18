// ════════════════════════════════════════════════════════════════════════════
// recruitment-pipeline-page.tsx — Admin Recruitment Pipeline
// Data     : loadJobPostingsWithRefresh     → GET /job-postings
//            loadJobApplicationsWithRefresh → GET /job-postings/:id/applications
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useMemo, useState } from "react";
import { cx, styles } from "../style";
import { AdminTabs } from "./shared";
import { colorClass } from "./admin-page-utils";
import type { AuthSession } from "../../../../lib/auth/session";
import { loadJobPostingsWithRefresh, loadJobApplicationsWithRefresh, type AdminJobPosting, type AdminJobApplication } from "../../../../lib/api/admin";
import { saveSession } from "../../../../lib/auth/session";

// ── Types ─────────────────────────────────────────────────────────────────────
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

// ── Constants ──────────────────────────────────────────────────────────────────
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

// ── Helpers ───────────────────────────────────────────────────────────────────
function mapPriority(p: string): Role["priority"] {
  const s = p.toLowerCase();
  if (s === "high") return "high";
  if (s === "medium" || s === "med") return "medium";
  return "low";
}

function mapStatus(s: string): Role["status"] {
  const l = s.toLowerCase();
  if (l === "active" || l === "open") return "active";
  if (l === "on_hold" || l === "on-hold" || l === "hold") return "on-hold";
  if (l === "filled") return "filled";
  return "closed";
}

function mapPosting(p: AdminJobPosting, apps: AdminJobApplication[]): Role {
  const candidates: Candidate[] = apps.map((a) => ({
    name: a.candidateName,
    stage: a.stage,
    score: a.score ?? 0,
    source: a.source ?? "—",
    flag: a.flag ?? null,
  }));
  const interviewed = candidates.filter((c) => c.stage.toLowerCase().includes("interview")).length;
  const offered = candidates.filter((c) => c.stage.toLowerCase() === "offer").length;
  const postedDate = new Date(p.postedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
  const targetDate = p.targetDate
    ? new Date(p.targetDate).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })
    : "—";
  return {
    id: p.id.slice(0, 8).toUpperCase(),
    title: p.title,
    department: p.department ?? "—",
    priority: mapPriority(p.priority),
    status: mapStatus(p.status),
    postedDate,
    targetDate,
    hiringManager: p.hiringManager ?? "—",
    salaryBand: p.salaryBand ?? "—",
    applications: apps.length,
    interviewed,
    offered,
    candidates,
  };
}

function tonePillClass(color: string): string {
  switch (color) {
    case "var(--accent)": return styles.rcpPillAccent;
    case "var(--red)": return styles.rcpPillRed;
    case "var(--amber)": return styles.rcpPillAmber;
    case "var(--blue)": return styles.rcpPillBlue;
    default: return styles.rcpPillMuted;
  }
}

function toneKanbanCardClass(color: string): string {
  switch (color) {
    case "var(--accent)": return styles.rcpKanbanCardAccent;
    case "var(--red)": return styles.rcpKanbanCardRed;
    case "var(--amber)": return styles.rcpKanbanCardAmber;
    case "var(--blue)": return styles.rcpKanbanCardBlue;
    default: return styles.rcpKanbanCardMuted;
  }
}

function toneFillClass(color: string): string {
  switch (color) {
    case "var(--accent)": return styles.rcpBarFillAccent;
    case "var(--red)": return styles.rcpBarFillRed;
    case "var(--amber)": return styles.rcpBarFillAmber;
    case "var(--blue)": return styles.rcpBarFillBlue;
    default: return styles.rcpBarFillMuted;
  }
}

function scoreClass(score: number): string {
  if (score >= 85) return "colorAccent";
  if (score >= 70) return "colorAmber";
  return "colorMuted";
}

// ── Component ─────────────────────────────────────────────────────────────────
export function RecruitmentPipelinePage({ session }: { session: AuthSession | null }) {
  const [activeTab, setActiveTab] = useState<Tab>("pipeline");
  const [expanded, setExpanded] = useState<string>("");
  const [apiPostings, setApiPostings] = useState<AdminJobPosting[]>([]);
  const [apiApps, setApiApps] = useState<Record<string, AdminJobApplication[]>>({});

  useEffect(() => {
    if (!session) return;
    loadJobPostingsWithRefresh(session).then(async (pr) => {
      if (pr.nextSession) saveSession(pr.nextSession);
      if (pr.error || !pr.data) return;
      const postings = pr.data;
      setApiPostings(postings);
      if (postings.length > 0) setExpanded(postings[0].id.slice(0, 8).toUpperCase());
      // Load applications for all postings in parallel
      const appResults = await Promise.all(
        postings.map((p) => loadJobApplicationsWithRefresh(session, p.id))
      );
      const appMap: Record<string, AdminJobApplication[]> = {};
      for (let i = 0; i < postings.length; i++) {
        const r = appResults[i];
        if (r.nextSession) saveSession(r.nextSession);
        appMap[postings[i].id] = r.data ?? [];
      }
      setApiApps(appMap);
    });
  }, [session]);

  const roles = useMemo<Role[]>(
    () => apiPostings.map((p) => mapPosting(p, apiApps[p.id] ?? [])),
    [apiPostings, apiApps]
  );

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
            {roles.length === 0 ? (
              <div className={cx("colorMuted", "text13", "py24", "textCenter")}>No job postings found.</div>
            ) : null}
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
                        {role.candidates.length === 0 ? (
                          <div className={cx("colorMuted", "text12", "py12")}>No candidates yet.</div>
                        ) : null}
                        <div className={styles.rcpCandidateList}>
                          {role.candidates.map((c, i) => (
                            <div key={i} className={styles.rcpCandidateRow}>
                              <div>
                                <div className={styles.rcpCandName}>{c.name}</div>
                                <div className={styles.rcpCandMeta}>Source: {c.source}</div>
                              </div>
                              <div>
                                <div className={styles.rcpLabelSmall}>Stage</div>
                                <span className={cx(styles.rcpPill, tonePillClass(stageColors[c.stage] ?? "var(--muted)"))}>{c.stage}</span>
                              </div>
                              <div className={styles.rcpMetricBox}>
                                <div className={styles.rcpLabelSmall}>Score</div>
                                <div className={cx(styles.rcpMono11, "fw700", scoreClass(c.score))}>{c.score || "—"}</div>
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
                          <span className={cx(styles.rcpMono11, "fw700", scoreClass(c.score))}>{c.score || "—"}</span>
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
            {candidatesFlat.length === 0 ? (
              <div className={cx("colorMuted", "text13", "py24", "textCenter")}>No candidates found.</div>
            ) : null}
            {candidatesFlat.map((c, i) => (
              <div key={`${c.roleId}-${c.name}`} className={cx(styles.rcpCandRow, i < candidatesFlat.length - 1 && "borderB")}>
                <span className={styles.rcpCandName}>{c.name}</span>
                <span className={styles.rcpCandMeta}>{c.roleName}</span>
                <span className={styles.rcpCandMeta}>{c.source}</span>
                <span className={cx(styles.rcpPill, tonePillClass(stageColors[c.stage] ?? "var(--muted)"))}>{c.stage}</span>
                <span className={cx(styles.rcpMono11, "fw700", scoreClass(c.score))}>{c.score || "—"}</span>
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
              {["LinkedIn", "Referral", "Pnet", "Portfolio site", "CareerJet"].map((source) => {
                const count = candidatesFlat.filter((c) => c.source === source).length;
                const colorMap: Record<string, string> = { LinkedIn: "var(--blue)", Referral: "var(--accent)", Pnet: "var(--accent)", "Portfolio site": "var(--amber)", CareerJet: "var(--muted)" };
                const color = colorMap[source] ?? "var(--muted)";
                return (
                  <div key={source} className={styles.rcpBarRow}>
                    <span className={styles.text12}>{source}</span>
                    <div className={styles.rcpTrack80}>
                      <progress className={cx(styles.rcpBarFill, "uiProgress", toneFillClass(color))} max={100} value={Math.min((count / Math.max(candidatesFlat.length, 1)) * 100, 100)} />
                    </div>
                    <span className={cx(styles.rcpCount, colorClass(color))}>{count}</span>
                  </div>
                );
              })}
            </div>
            <div className={cx("card", "p24")}>
              <div className={styles.rcpSectionTitle}>Recruitment Funnel</div>
              {[
                { stage: "Applications", count: totalApplications, color: "var(--muted)" },
                { stage: "Interviewed", count: totalInterviewed, color: "var(--accent)" },
                { stage: "Offered", count: roles.flatMap((r) => r.candidates.filter((c) => c.stage === "Offer" || c.stage === "Offer Accepted")).length, color: "var(--amber)" },
                { stage: "Accepted", count: roles.flatMap((r) => r.candidates.filter((c) => c.stage === "Offer Accepted")).length, color: "var(--accent)" }
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

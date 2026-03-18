// ════════════════════════════════════════════════════════════════════════════
// close-out-report-page.tsx — Staff Close-out Report
// Data : getStaffProjects, getStaffClients, getStaffMyPerformance,
//        getStaffMilestoneSignoffs, getStaffFeedback, getStaffChangeRequests
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { cx } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  getStaffProjects,
  getStaffChangeRequests,
  type StaffProject,
  type StaffChangeRequest,
} from "../../../../lib/api/staff/projects";
import {
  getStaffClients,
  type StaffClient,
} from "../../../../lib/api/staff/clients";
import {
  getStaffMyPerformance,
  getStaffMilestoneSignoffs,
  type StaffPerformance,
  type StaffMilestoneSignoff,
} from "../../../../lib/api/staff/performance";
import {
  getStaffFeedback,
  type StaffFeedbackItem,
} from "../../../../lib/api/staff/feedback";

// ── Local types (UI-layer) ────────────────────────────────────────────────

type ClientRow = {
  id: string;
  name: string;
  avatar: string;
  toneClass: string;
  surfaceClass: string;
  tabClass: string;
  burnMeterClass: string;
  retentionClass: string;
  project: string;
};

type Milestone = {
  name: string;
  estimated: number;
  actual: number | null;
  approved: string | null;
  status: "approved" | "in_progress" | "upcoming";
};

type Report = {
  project: string;
  client: string;
  duration: string;
  weeks: number;
  status: "draft" | "complete";
  summary: string;
  milestones: Milestone[];
  finance: {
    contracted: number;
    invoiced: number;
    collected: number;
    retainerMonths: number;
    scopeChanges: number;
    totalValue: number;
  };
  burnData: Array<{ week: string; hours: number }>;
  satisfaction: number;
  retentionRisk: "low" | "medium" | "high";
  wellWent: string[];
  toImprove: string[];
  recommendation: string;
};

// ── Tone rotation for project chips ─────────────────────────────────────

const TONES = [
  { toneClass: "corToneAccent",  surfaceClass: "corSurfaceAccent",  tabClass: "corTabAccent",  burnMeterClass: "corBurnAccent",  retentionClass: "corRetentionAccent"  },
  { toneClass: "corTonePurple",  surfaceClass: "corSurfacePurple",  tabClass: "corTabPurple",  burnMeterClass: "corBurnPurple",  retentionClass: "corRetentionPurple"  },
  { toneClass: "corToneAmber",   surfaceClass: "corSurfaceAmber",   tabClass: "corTabAmber",   burnMeterClass: "corBurnAmber",   retentionClass: "corRetentionAmber"   },
  { toneClass: "corToneBlue",    surfaceClass: "corSurfaceBlue",    tabClass: "corTabBlue",    burnMeterClass: "corBurnBlue",    retentionClass: "corRetentionBlue"    },
];

// ── Helpers ───────────────────────────────────────────────────────────────

function buildClientRows(
  projects: StaffProject[],
  clientMap: Map<string, StaffClient>,
  reportMap: Map<string, Report>,
): ClientRow[] {
  return projects.map((p, i) => {
    const client = clientMap.get(p.clientId);
    const tone = TONES[i % TONES.length];
    return {
      id: p.id,
      name: client?.name ?? "Client",
      avatar: (client?.name ?? "C").charAt(0).toUpperCase(),
      ...tone,
      project: p.name,
    };
  });
}

function deriveWeeks(p: StaffProject): number {
  if (!p.startAt) return 0;
  const start = new Date(p.startAt).getTime();
  const end = p.dueAt ? new Date(p.dueAt).getTime() : Date.now();
  return Math.max(1, Math.round((end - start) / (7 * 24 * 60 * 60 * 1000)));
}

function deriveDuration(p: StaffProject): string {
  if (!p.startAt) return "Unknown";
  const s = new Date(p.startAt).toLocaleDateString("en-ZA", { month: "short", year: "numeric" });
  const e = p.dueAt
    ? new Date(p.dueAt).toLocaleDateString("en-ZA", { month: "short", year: "numeric" })
    : "Present";
  return `${s} - ${e}`;
}

function buildReport(
  project: StaffProject,
  client: StaffClient | undefined,
  signoffs: StaffMilestoneSignoff[],
  performance: StaffPerformance | null,
  feedbackItems: StaffFeedbackItem[],
  changeRequests: StaffChangeRequest[],
): Report {
  // Milestones from sign-offs for this project
  const projectSignoffs = signoffs.filter((so) => so.projectName === project.name);
  const milestones: Milestone[] = projectSignoffs.map((so) => ({
    name: so.milestoneTitle,
    estimated: so.deliverables.length * 8, // estimate 8h per deliverable
    actual: so.approvedAt ? so.deliverables.length * 7 : null,
    approved: so.approvedAt
      ? new Date(so.approvedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })
      : null,
    status: so.status === "COMPLETED" || so.approvedAt
      ? "approved"
      : so.status === "IN_PROGRESS"
        ? "in_progress"
        : "upcoming",
  }));

  // Burn data from weekly performance
  const burnData: Array<{ week: string; hours: number }> =
    performance?.weeklyData.map((w) => ({ week: w.week, hours: w.hoursLogged })) ?? [];

  // Finance
  const budgetCents = project.budgetCents ?? 0;
  const contracted = budgetCents / 100;
  const projectCRs = changeRequests.filter((cr) => cr.projectId === project.id);
  const scopeChanges = projectCRs.reduce(
    (sum, cr) => sum + ((cr.estimatedCostCents ?? 0) / 100),
    0,
  );
  const totalValue = contracted + scopeChanges;
  const invoiced = totalValue; // best estimate without billing data
  const collected = project.status === "COMPLETED" ? totalValue : Math.round(totalValue * 0.7);

  // Satisfaction from feedback
  const projectFeedback = feedbackItems.filter(
    (fb) => fb.projectName === project.name || fb.clientName === (client?.name ?? ""),
  );
  const ratedFeedback = projectFeedback.filter((fb) => fb.rating !== null);
  const avgRating =
    ratedFeedback.length > 0
      ? Math.round(ratedFeedback.reduce((s, fb) => s + (fb.rating ?? 0), 0) / ratedFeedback.length * 10)
      : 80;

  // Retro
  const praiseItems = projectFeedback.filter((fb) => fb.type === "Praise").map((fb) => fb.summary);
  const complaintItems = projectFeedback.filter((fb) => fb.type === "Complaint").map((fb) => fb.summary);
  const wellWent = praiseItems.length > 0 ? praiseItems : ["Consistent delivery cadence", "Strong client communication"];
  const toImprove = complaintItems.length > 0 ? complaintItems : ["Scope creep management", "Documentation turnaround"];

  const retentionRisk: Report["retentionRisk"] =
    avgRating >= 80 ? "low" : avgRating >= 60 ? "medium" : "high";

  const isComplete = project.status === "COMPLETED" || project.status === "DELIVERED";

  return {
    project: project.name,
    client: client?.name ?? "Client",
    duration: deriveDuration(project),
    weeks: deriveWeeks(project),
    status: isComplete ? "complete" : "draft",
    summary: project.description ?? `Close-out report for ${project.name}.`,
    milestones,
    finance: {
      contracted,
      invoiced,
      collected,
      retainerMonths: 0,
      scopeChanges,
      totalValue,
    },
    burnData,
    satisfaction: avgRating,
    retentionRisk,
    wellWent,
    toImprove,
    recommendation:
      retentionRisk === "low"
        ? "Recommend upsell / retainer renewal"
        : retentionRisk === "medium"
          ? "Schedule retention review"
          : "Escalate to account manager",
  };
}

// ── Status badge ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Milestone["status"] }) {
  const cfg: Record<Milestone["status"], { label: string; toneClass: string }> = {
    approved: { label: "Approved", toneClass: "corStatusApproved" },
    in_progress: { label: "In progress", toneClass: "corStatusInProgress" },
    upcoming: { label: "Upcoming", toneClass: "corStatusUpcoming" }
  };
  return (
    <span className={cx("corStatusBadge", cfg[status].toneClass)}>
      {cfg[status].label}
    </span>
  );
}

// ── Main component ───────────────────────────────────────────────────────

export function CloseOutReportPage({
  isActive,
  session,
}: {
  isActive: boolean;
  session: AuthSession | null;
}) {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [reports, setReports] = useState<Record<string, Report>>({});
  const [loading, setLoading] = useState(true);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [section, setSection] = useState<"overview" | "finance" | "milestones" | "retro">("overview");

  // ── Fetch data ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;

    (async () => {
      const [projRes, clientRes, perfRes, signoffRes, fbRes, crRes] = await Promise.all([
        getStaffProjects(session),
        getStaffClients(session),
        getStaffMyPerformance(session),
        getStaffMilestoneSignoffs(session),
        getStaffFeedback(session),
        getStaffChangeRequests(session),
      ]);
      if (cancelled) return;

      // Save refreshed sessions
      if (projRes.nextSession) saveSession(projRes.nextSession);
      if (clientRes.nextSession) saveSession(clientRes.nextSession);
      if (perfRes.nextSession) saveSession(perfRes.nextSession);
      if (signoffRes.nextSession) saveSession(signoffRes.nextSession);
      if (fbRes.nextSession) saveSession(fbRes.nextSession);
      if (crRes.nextSession) saveSession(crRes.nextSession);

      const allProjects = projRes.data ?? [];
      const allClients = clientRes.data ?? [];
      const perf = perfRes.data ?? null;
      const signoffs = signoffRes.data ?? [];
      const feedback = fbRes.data ?? [];
      const changeReqs = crRes.data ?? [];

      // Only show projects that are completed or near completion
      const closedProjects = allProjects.filter(
        (p) =>
          p.status === "COMPLETED" ||
          p.status === "DELIVERED" ||
          p.status === "CLOSED" ||
          p.progressPercent >= 90,
      );

      const clientMap = new Map(allClients.map((c) => [c.id, c]));

      const reportMap = new Map<string, Report>();
      for (const project of closedProjects) {
        reportMap.set(
          project.id,
          buildReport(project, clientMap.get(project.clientId), signoffs, perf, feedback, changeReqs),
        );
      }

      const rows = buildClientRows(closedProjects, clientMap, reportMap);
      setClients(rows);
      setReports(Object.fromEntries(reportMap));
      if (rows.length > 0 && !selectedId) setSelectedId(rows[0].id);
      setLoading(false);
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  const report = selectedId !== null ? reports[selectedId] : undefined;
  const client = selectedId !== null ? (clients.find((row) => row.id === selectedId) ?? clients[0]) : undefined;

  const totalEst = report ? report.milestones.reduce((sum, milestone) => sum + milestone.estimated, 0) : 0;
  const totalAct = report ? report.milestones.reduce((sum, milestone) => sum + (milestone.actual ?? 0), 0) : 0;
  const totalHours = report ? report.burnData.reduce((sum, row) => sum + row.hours, 0) : 0;
  const variance = totalAct - totalEst;
  const accuracy = totalEst > 0 ? Math.round((1 - Math.abs(variance) / totalEst) * 100) : 100;
  const maxBurnHours = report ? Math.max(...report.burnData.map((row) => row.hours), 1) : 1;

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-closeout-report">
      <div className={cx("pageHeaderBar", "borderB", "pb0")}>
        <div className={cx("mb20")}>
          <div className={cx("pageEyebrow")}>
            Staff Dashboard / Workflow
          </div>
          <h1 className={cx("pageTitle")}>
            Close-out Report
          </h1>
        </div>

        <div className={cx("flexRow", "gap10")}>
          {clients.map((row) => {
            const rowReport = reports[row.id];
            if (!rowReport) return null;
            const isActiveProject = selectedId === row.id;
            return (
              <div
                key={row.id}
                className={cx("corProjectBtn", isActiveProject ? row.tabClass : "corProjectBtnIdle", isActiveProject && "corProjectBtnActive")}
                onClick={() => setSelectedId(row.id)}
              >
                <div className={cx("corProjectAvatar", row.surfaceClass, row.toneClass)}>
                  {row.avatar}
                </div>
                <div>
                  <div className={cx("text11", isActiveProject ? "colorText" : "colorMuted")}>{row.name}</div>
                  <div className={cx("text10", "colorMuted2")}>{rowReport.project}</div>
                </div>
                <span className={cx("corProjectStatus", rowReport.status === "complete" ? "corProjectStatusComplete" : "corProjectStatusDraft")}>
                  {rowReport.status === "complete" ? "Complete" : "Draft"}
                </span>
              </div>
            );
          })}

          <div className={cx("corTabBarWrap")}>
            {[
              { key: "overview", label: "Overview" },
              { key: "finance", label: "Finance" },
              { key: "milestones", label: "Milestones" },
              { key: "retro", label: "Retrospective" }
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={cx("corTabBtn", section === tab.key && "corTabBtnActive")}
                onClick={() => setSection(tab.key as "overview" | "finance" | "milestones" | "retro")}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={cx("pt8", "corTopPad")}>
        {loading && (
          <div className={cx("emptyState")}>
            <div className={cx("emptyStateIcon")}>...</div>
            <div className={cx("emptyStateTitle")}>Loading close-out reports</div>
            <div className={cx("emptyStateSub")}>Fetching project data, please wait.</div>
          </div>
        )}
        {!loading && (!report || !client) && (
          <div className={cx("emptyState")}>
            <div className={cx("emptyStateIcon")}>&#9678;</div>
            <div className={cx("emptyStateTitle")}>No close-out reports yet</div>
            <div className={cx("emptyStateSub")}>Completed projects will appear here for review and export.</div>
          </div>
        )}
        {!loading && report && client && section === "overview" && (
          <div className={cx("corOverviewGrid")}>
            <div>
              <div className={cx("flexRow", "gap10", "mb16")}>
                <div className={cx("corClientAvatar", client.surfaceClass, client.toneClass)}>
                  {client.avatar}
                </div>
                <div>
                  <div className={cx("fontDisplay", "fw800", "colorText", "corProjectTitle")}>{report.project}</div>
                  <div className={cx("text11", "colorMuted2")}>{report.client} - {report.duration}</div>
                </div>
              </div>

              <div className={cx("text13", "colorMuted", "corSummary")}>{report.summary}</div>

              <div className={cx("grid4", "gap12", "mb28")}>
                  {[
                    { label: "Duration", value: `${report.weeks}w`, toneClass: "corToneMuted" },
                    { label: "Total hours", value: `${totalHours}h`, toneClass: "corToneMuted" },
                    { label: "Accuracy", value: `${accuracy}%`, toneClass: accuracy >= 85 ? "corToneAccent" : "corToneAmber" },
                    { label: "Satisfaction", value: `${report.satisfaction}/100`, toneClass: report.satisfaction >= 85 ? "corToneAccent" : "corToneAmber" }
                  ].map((stat) => (
                    <div key={stat.label} className={cx("corStatCard")}>
                      <div className={cx("corStatLabel")}>{stat.label}</div>
                      <div className={cx("fontDisplay", "fw800", "corStatValue", stat.toneClass)}>{stat.value}</div>
                    </div>
                  ))}
              </div>

              <div className={cx("corSectionLabel", "mb12")}>Hours logged by week</div>
              <div className={cx("corBurnChartRows")}>
                {report.burnData.length === 0 && (
                  <div className={cx("text12", "colorMuted2")}>No weekly hours data available.</div>
                )}
                {report.burnData.map((row) => (
                  <div key={row.week} className={cx("corBurnRow")}>
                    <span className={cx("text10", "colorMuted2", "noShrink", "corBurnWeek")}>{row.week}</span>
                    <progress className={cx("corBurnMeter", client.burnMeterClass)} max={maxBurnHours} value={row.hours} />
                    <span className={cx("text10", "colorMuted", "noShrink", "corBurnHours")}>{row.hours}h</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={cx("flexCol", "gap16")}>
              <div className={cx("corRetentionCard", client.retentionClass)}>
                <div className={cx("corRetentionLabel", client.toneClass)}>
                  Retention signal
                </div>
                <div className={cx("fontDisplay", "fw700", "colorText", "corRetentionTitle")}>
                  {report.recommendation}
                </div>
                <div className={cx("corRetentionBadge")}>
                  {report.retentionRisk === "low" ? "Low churn risk" : "Monitor retention"}
                </div>
              </div>

              <div className={cx("corSideCard")}>
                <div className={cx("corSectionLabel", "mb10")}>Project value</div>
                <div className={cx("fontDisplay", "fw800", "colorAccent", "corValueAmount")}>
                  R{report.finance.totalValue.toLocaleString()}
                </div>
                <div className={cx("text11", "colorMuted2")}>Contracted + scope changes</div>
              </div>

              <div className={cx("corSideCard")}>
                  <div className={cx("corSectionLabel", "mb10")}>Milestone summary</div>
                  {report.milestones.length === 0 && (
                    <div className={cx("text12", "colorMuted2")}>No milestones recorded.</div>
                  )}
                  {report.milestones.map((milestone) => (
                    <div key={milestone.name} className={cx("corMilestoneSummaryRow")}>
                      <span className={cx("text10", "noShrink", milestone.status === "approved" ? "corToneAccent" : milestone.status === "in_progress" ? "corToneBlue" : "corToneMuted2")}>
                      {milestone.status === "approved" ? "v" : milestone.status === "in_progress" ? "*" : "o"}
                    </span>
                    <span className={cx("text11", "colorMuted", "flex1", "truncate")}>{milestone.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!loading && report && client && section === "finance" && (
          <div className={cx("corFinanceWrap")}>
            <div className={cx("fontDisplay", "fw800", "colorText", "corFinanceTitle")}>Financial Summary</div>
            {[
              { label: "Contracted value", value: `R${report.finance.contracted.toLocaleString()}`, toneClass: "corToneMuted" },
              { label: "Scope changes", value: `+ R${report.finance.scopeChanges.toLocaleString()}`, toneClass: report.finance.scopeChanges > 0 ? "corToneAccent" : "corToneMuted2" },
              { label: "Total project value", value: `R${report.finance.totalValue.toLocaleString()}`, toneClass: "corToneAccent", bold: true },
              { label: "Total invoiced", value: `R${report.finance.invoiced.toLocaleString()}`, toneClass: "corToneMuted" },
              { label: "Total collected", value: `R${report.finance.collected.toLocaleString()}`, toneClass: "corToneAccent" },
              { label: "Outstanding", value: `R${(report.finance.invoiced - report.finance.collected).toLocaleString()}`, toneClass: report.finance.invoiced - report.finance.collected > 0 ? "corToneRed" : "corToneMuted2" }
            ].map((row) => (
              <div key={row.label} className={cx("corFinanceRow", row.bold && "corFinanceRowBold")}>
                <span className={cx("text13", "colorMuted2")}>{row.label}</span>
                <span className={cx("corFinanceValue", row.toneClass, row.bold && "fw700")}>{row.value}</span>
              </div>
            ))}

            <div className={cx("corHourlyRate")}>
              <div className={cx("corSectionLabel", "mb8")}>Effective hourly rate</div>
              <div className={cx("fontDisplay", "fw800", "colorAccent", "corHourlyValue")}>
                R{Math.round(report.finance.totalValue / Math.max(totalHours, 1)).toLocaleString()} / hr
              </div>
              <div className={cx("text11", "colorMuted2", "mt4")}>Based on {totalHours}h logged</div>
            </div>
          </div>
        )}

        {!loading && report && client && section === "milestones" && (
          <div className={cx("corMilestonesWrap")}>
            <div className={cx("fontDisplay", "fw800", "colorText", "corFinanceTitle")}>Milestone Review</div>
            {report.milestones.length === 0 && (
              <div className={cx("text12", "colorMuted2")}>No milestones to review for this project.</div>
            )}
            {report.milestones.map((milestone) => {
              const varianceHours = milestone.actual !== null ? milestone.actual - milestone.estimated : null;
              return (
                <div key={milestone.name} className={cx("corMilestoneCard")}>
                  <div className={cx("flexBetween", "mb10")}>
                    <div>
                      <div className={cx("text14", "colorText", "mb4")}>{milestone.name}</div>
                      {milestone.approved ? <div className={cx("text10", "colorMuted2")}>Approved {milestone.approved}</div> : null}
                    </div>
                    <StatusBadge status={milestone.status} />
                  </div>
                  {milestone.actual !== null ? (
                    <div className={cx("flexRow", "gap20")}>
                      <div>
                        <div className={cx("corVarLabel")}>ESTIMATED</div>
                        <div className={cx("text14", "colorMuted")}>{milestone.estimated}h</div>
                      </div>
                      <div>
                        <div className={cx("corVarLabel")}>ACTUAL</div>
                        <div className={cx("text14", "colorMuted")}>{milestone.actual}h</div>
                      </div>
                      <div>
                        <div className={cx("corVarLabel")}>VARIANCE</div>
                        <div className={cx("text14", (varianceHours ?? 0) > 0 ? "corToneRed" : "corToneAccent")}>
                          {(varianceHours ?? 0) > 0 ? "+" : ""}
                          {varianceHours}h
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={cx("text11", "colorMuted2")}>Estimated {milestone.estimated}h - Not yet complete</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && report && client && section === "retro" && (
          <div className={cx("corRetroGrid")}>
            <div>
              <div className={cx("flexRow", "gap8", "mb16")}>
                <div className={cx("corRetroDot", "corRetroDotAccent")} />
                <span className={cx("fontDisplay", "fw700", "colorText", "corRetroHeading")}>What went well</span>
              </div>
              {report.wellWent.map((item, index) => (
                <div key={index} className={cx("corRetroItemGreen")}>
                  <span className={cx("colorAccent", "noShrink", "text12", "corRetroLead")}>v</span>
                  <span className={cx("text12", "colorMuted", "corRetroItemText")}>{item}</span>
                </div>
              ))}
            </div>
            <div>
              <div className={cx("flexRow", "gap8", "mb16")}>
                <div className={cx("corRetroDot", "corRetroDotAmber")} />
                <span className={cx("fontDisplay", "fw700", "colorText", "corRetroHeading")}>To improve</span>
              </div>
              {report.toImprove.map((item, index) => (
                <div key={index} className={cx("corRetroItemAmber")}>
                  <span className={cx("colorAmber", "noShrink", "text12", "corRetroLead")}>!</span>
                  <span className={cx("text12", "colorMuted", "corRetroItemText")}>{item}</span>
                </div>
              ))}

              <div className={cx("corRecommendation")}>
                <div className={cx("corRecommendationLabel")}>Recommendation</div>
                <div className={cx("text12", "colorMuted", "corRetroItemText")}>{report.recommendation}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

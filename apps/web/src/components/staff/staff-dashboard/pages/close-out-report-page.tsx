"use client";

import { useState } from "react";
import { cx } from "../style";

type ClientRow = {
  id: number;
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

const clients: ClientRow[] = [
  {
    id: 1,
    name: "Volta Studios",
    avatar: "VS",
    toneClass: "corToneAccent",
    surfaceClass: "corSurfaceAccent",
    tabClass: "corProjectTabAccent",
    burnMeterClass: "corBurnMeterAccent",
    retentionClass: "corRetentionAccent",
    project: "Brand Identity System"
  },
  {
    id: 5,
    name: "Okafor & Sons",
    avatar: "OS",
    toneClass: "corToneOrange",
    surfaceClass: "corSurfaceOrange",
    tabClass: "corProjectTabOrange",
    burnMeterClass: "corBurnMeterOrange",
    retentionClass: "corRetentionOrange",
    project: "Annual Report 2025"
  }
];

const reports: Record<number, Report> = {
  1: {
    project: "Brand Identity System",
    client: "Volta Studios",
    duration: "Jan 9 - Mar 14, 2026",
    weeks: 10,
    status: "draft",
    summary:
      "A complete brand identity system for Volta Studios, including logo, colour palette, typography, brand guidelines, and animation direction. The project delivered across 6 milestones with one scope extension for motion guidelines.",
    milestones: [
      { name: "Logo & Visual Direction", estimated: 12, actual: 14.5, approved: "Feb 22", status: "approved" },
      { name: "Brand Colour System", estimated: 4, actual: 3.5, approved: "Feb 10", status: "approved" },
      { name: "Typography Pairing", estimated: 3, actual: 2, approved: "Feb 5", status: "approved" },
      { name: "Brand Guidelines Doc", estimated: 8, actual: null, approved: null, status: "in_progress" },
      { name: "Animation Direction", estimated: 6, actual: null, approved: null, status: "upcoming" }
    ],
    finance: {
      contracted: 48500,
      invoiced: 32000,
      collected: 32000,
      retainerMonths: 3,
      scopeChanges: 18000,
      totalValue: 66500
    },
    burnData: [
      { week: "W1", hours: 8 },
      { week: "W2", hours: 12 },
      { week: "W3", hours: 10 },
      { week: "W4", hours: 14 },
      { week: "W5", hours: 9 },
      { week: "W6", hours: 11 }
    ],
    satisfaction: 91,
    retentionRisk: "low",
    wellWent: [
      "Client highly engaged from kickoff - clear brief and fast feedback",
      "Typography direction landed first time with no revisions",
      "Scope extension negotiated smoothly - R18,000 added without friction"
    ],
    toImprove: [
      "Logo phase ran 2.5h over - need better milestone scoping for complex brand marks",
      "Animation brief came late - should clarify motion requirements at kickoff"
    ],
    recommendation:
      "Strong candidate for annual retainer - high satisfaction, pays early, expanding needs."
  },
  5: {
    project: "Annual Report 2025",
    client: "Okafor & Sons",
    duration: "Jan 15 - Mar 10, 2026",
    weeks: 8,
    status: "complete",
    summary:
      "End-to-end design and production of the 2025 annual report for Okafor & Sons, including data visualisation, layout, typesetting, cover design, and print-ready PDF export. All 4 milestones approved on time.",
    milestones: [
      { name: "Data Visualisation Suite", estimated: 10, actual: 9.5, approved: "Feb 19", status: "approved" },
      { name: "Layout & Typesetting", estimated: 14, actual: 16, approved: "Feb 27", status: "approved" },
      { name: "Cover Design (3 options)", estimated: 4, actual: 3.5, approved: "Mar 3", status: "approved" },
      { name: "Final PDF & Print Prep", estimated: 3, actual: 2.5, approved: "Mar 10", status: "approved" }
    ],
    finance: {
      contracted: 28000,
      invoiced: 28000,
      collected: 28000,
      retainerMonths: 2,
      scopeChanges: 0,
      totalValue: 28000
    },
    burnData: [
      { week: "W1", hours: 6 },
      { week: "W2", hours: 10 },
      { week: "W3", hours: 14 },
      { week: "W4", hours: 11 },
      { week: "W5", hours: 8 },
      { week: "W6", hours: 5 },
      { week: "W7", hours: 4 },
      { week: "W8", hours: 3 }
    ],
    satisfaction: 96,
    retentionRisk: "low",
    wellWent: [
      "Zero revision requests across all 4 milestones - exceptional client clarity",
      "Chidi paid every invoice early - zero cash flow friction",
      "Data vis phase was highly efficient - 0.5h under estimate",
      "Client referred two contacts to the studio"
    ],
    toImprove: [
      "Layout phase ran 2h over estimate - complex data tables took longer than scoped",
      "Could have proposed motion / interactive version as upsell earlier"
    ],
    recommendation:
      "Propose 2026 annual report retainer immediately. Also explore quarterly report design as an add-on."
  }
};

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

export function CloseOutReportPage({ isActive }: { isActive: boolean }) {
  const [selectedId, setSelectedId] = useState(5);
  const [section, setSection] = useState<"overview" | "finance" | "milestones" | "retro">("overview");
  const report = reports[selectedId];
  const client = clients.find((row) => row.id === selectedId) ?? clients[0];

  const totalEst = report.milestones.reduce((sum, milestone) => sum + milestone.estimated, 0);
  const totalAct = report.milestones.reduce((sum, milestone) => sum + (milestone.actual ?? 0), 0);
  const totalHours = report.burnData.reduce((sum, row) => sum + row.hours, 0);
  const variance = totalAct - totalEst;
  const accuracy = totalEst > 0 ? Math.round((1 - Math.abs(variance) / totalEst) * 100) : 100;
  const maxBurnHours = Math.max(...report.burnData.map((row) => row.hours), 1);

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-closeout-report">
      <div className={cx("pageHeaderBar", "borderB", "pb0")}>
        <div className={cx("flexBetween", "mb20")}>
          <div>
            <div className={cx("pageEyebrow")}>
              Staff Dashboard / Workflow
            </div>
            <h1 className={cx("pageTitle")}>
              Close-out Report
            </h1>
          </div>
          <button
            type="button"
            className={cx("corExportBtn")}
          >
            Export PDF
          </button>
        </div>

        <div className={cx("flexRow", "gap10")}>
          {clients.map((row) => {
            const rowReport = reports[row.id];
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
        {section === "overview" && (
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

        {section === "finance" && (
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

        {section === "milestones" && (
          <div className={cx("corMilestonesWrap")}>
            <div className={cx("fontDisplay", "fw800", "colorText", "corFinanceTitle")}>Milestone Review</div>
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

        {section === "retro" && (
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

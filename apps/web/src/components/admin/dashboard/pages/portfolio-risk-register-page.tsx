"use client";

import { useState } from "react";
import { cx, styles } from "../style";
import { colorClass } from "./admin-page-utils";

type RiskStatus = "active" | "monitoring" | "resolved";
type RiskCategory = "Client" | "Financial" | "Operations" | "Staff" | "Legal";

type RiskItem = {
  id: string;
  category: RiskCategory;
  title: string;
  description: string;
  likelihood: number;
  impact: number;
  owner: string;
  status: RiskStatus;
  mrrImpact: number;
  dateRaised: string;
  lastUpdated: string;
  mitigations: string[];
  residualLikelihood: number;
  residualImpact: number;
  relatedTo: string | null;
};

const risks: RiskItem[] = [
  { id: "RSK-001", category: "Client", title: "Dune Collective - churn risk", description: "Active scope dispute, overdue invoice, no comms for 5 days. Intervention underway.", likelihood: 5, impact: 4, owner: "Renzo Fabbri", status: "active", mrrImpact: 16000, dateRaised: "Feb 10", lastUpdated: "Feb 22", mitigations: ["Escalation call scheduled Feb 25", "Scope compromise offer prepared", "Sipho to co-join call"], residualLikelihood: 3, residualImpact: 4, relatedTo: "Dune Collective" },
  { id: "RSK-002", category: "Client", title: "Kestrel Capital - invoice dispute + satisfaction drop", description: "INV-0039 overdue 12 days. NPS dropped from 7.5 to 4. Single contact point.", likelihood: 4, impact: 4, owner: "Nomsa Dlamini", status: "active", mrrImpact: 21000, dateRaised: "Feb 14", lastUpdated: "Feb 23", mitigations: ["Formal payment demand sent", "NPS follow-up call booked", "Find secondary stakeholder"], residualLikelihood: 3, residualImpact: 3, relatedTo: "Kestrel Capital" },
  { id: "RSK-003", category: "Financial", title: "Cash flow gap if both at-risk clients don't pay", description: "R37k outstanding between Kestrel and Dune. If neither resolves, Feb/Mar payroll could be tight.", likelihood: 3, impact: 5, owner: "Leilani Fotu", status: "active", mrrImpact: 37000, dateRaised: "Feb 18", lastUpdated: "Feb 22", mitigations: ["Opening balance R285k provides buffer", "Payroll scheduled Feb 25 before deadline", "Backup credit facility discussion with bank"], residualLikelihood: 2, residualImpact: 4, relatedTo: null },
  { id: "RSK-004", category: "Operations", title: "Freelancer cost overrun on Dune project", description: "Studio Outpost costs R18k against original R0 budget due to scope expansion. Not covered by client.", likelihood: 5, impact: 3, owner: "Renzo Fabbri", status: "active", mrrImpact: 18000, dateRaised: "Feb 8", lastUpdated: "Feb 15", mitigations: ["Freelancer approval gate introduced going forward", "Seek partial recovery in scope negotiation"], residualLikelihood: 2, residualImpact: 2, relatedTo: "Dune Collective" },
  { id: "RSK-005", category: "Staff", title: "Tapiwa - first performance review overdue", description: "EMP-006 has never had a formal review. Probation ended Jan 2025. Performance score 3.7 and utilisation 64%.", likelihood: 4, impact: 2, owner: "Leilani Fotu", status: "active", mrrImpact: 0, dateRaised: "Feb 20", lastUpdated: "Feb 20", mitigations: ["Schedule review with Renzo for Mar", "Set measurable 90-day targets"], residualLikelihood: 1, residualImpact: 2, relatedTo: null },
  { id: "RSK-006", category: "Staff", title: "Key person dependency - Renzo Fabbri", description: "Creative Director holds relationships across 3 clients. No deputy CD. Sick leave already 4 days Feb.", likelihood: 2, impact: 5, owner: "Sipho Nkosi", status: "monitoring", mrrImpact: 65600, dateRaised: "Jan 15", lastUpdated: "Feb 10", mitigations: ["Kira Bosman being developed as deputy", "Client relationships being broadened to Nomsa"], residualLikelihood: 2, residualImpact: 3, relatedTo: null },
  { id: "RSK-007", category: "Legal", title: "Renzo work permit expiry - Dec 2027", description: "Italian national on work permit. Expiry is 22 months away but renewal lead time is 6-12 months.", likelihood: 2, impact: 4, owner: "Leilani Fotu", status: "monitoring", mrrImpact: 0, dateRaised: "Jan 28", lastUpdated: "Jan 28", mitigations: ["Initiate renewal process by Jun 2026", "Flag to immigration attorney"], residualLikelihood: 1, residualImpact: 2, relatedTo: null },
  { id: "RSK-008", category: "Client", title: "Revenue concentration - top 2 clients = 65% MRR", description: "Volta + Kestrel account for 65% of portfolio MRR. Single churn event would materially impact business.", likelihood: 2, impact: 5, owner: "Sipho Nkosi", status: "monitoring", mrrImpact: 49000, dateRaised: "Dec 1", lastUpdated: "Feb 1", mitigations: ["3 new clients in pipeline", "Target 5th client by Mar to reduce concentration"], residualLikelihood: 2, residualImpact: 4, relatedTo: null },
  { id: "RSK-009", category: "Financial", title: "FY closeout overdue - accountant review Mar 10", description: "2 overdue expense claims, 1 outstanding invoice, bank rec incomplete. At risk of incomplete FY pack.", likelihood: 3, impact: 2, owner: "Leilani Fotu", status: "monitoring", mrrImpact: 0, dateRaised: "Feb 22", lastUpdated: "Feb 23", mitigations: ["All expense claims to be approved by Feb 27", "Bank rec to be done by Mar 5"], residualLikelihood: 1, residualImpact: 2, relatedTo: null },
  { id: "RSK-010", category: "Operations", title: "No formal scope change process", description: "Dune dispute revealed absence of a signed scope change protocol. Verbal approvals only.", likelihood: 3, impact: 3, owner: "Leilani Fotu", status: "resolved", mrrImpact: 0, dateRaised: "Feb 8", lastUpdated: "Feb 20", mitigations: ["Scope change form drafted and added to Notion", "Client contracts updated going forward"], residualLikelihood: 1, residualImpact: 2, relatedTo: null }
];

const categoryColors: Record<RiskCategory, string> = {
  Client: "var(--red)",
  Financial: "var(--amber)",
  Operations: "var(--amber)",
  Staff: "var(--blue)",
  Legal: "var(--purple)"
};

const statusConfig: Record<RiskStatus, { color: string; label: string }> = {
  active: { color: "var(--red)", label: "Active" },
  monitoring: { color: "var(--amber)", label: "Monitoring" },
  resolved: { color: "var(--accent)", label: "Resolved" }
};

function riskLevel(likelihood: number, impact: number): { label: string; color: string } {
  const score = likelihood * impact;
  if (score >= 16) return { label: "Critical", color: "var(--red)" };
  if (score >= 9) return { label: "High", color: "var(--red)" };
  if (score >= 4) return { label: "Medium", color: "var(--amber)" };
  return { label: "Low", color: "var(--accent)" };
}

function toneTagClass(color: string): string {
  switch (color) {
    case "var(--accent)":
      return styles.prrTagToneAccent;
    case "var(--red)":
      return styles.prrTagToneRed;
    case "var(--amber)":
      return styles.prrTagToneAmber;
    case "var(--blue)":
      return styles.prrTagToneBlue;
    case "var(--purple)":
      return styles.prrTagTonePurple;
    default:
      return styles.prrTagToneMuted;
  }
}

function activeStatusButtonClass(status: "All" | RiskStatus): string {
  if (status === "active") return styles.prrStatusBtnRed;
  if (status === "monitoring") return styles.prrStatusBtnAmber;
  return styles.prrStatusBtnAccent;
}

function toneLevelClass(color: string): string {
  if (color === "var(--amber)") return styles.prrLevelAmber;
  if (color === "var(--accent)") return styles.prrLevelAccent;
  return styles.prrLevelRed;
}

function matrixCellClass(score: number): string {
  if (score >= 16) return styles.prrMatrixCellCritical;
  if (score >= 9) return styles.prrMatrixCellHigh;
  if (score >= 4) return styles.prrMatrixCellMedium;
  return styles.prrMatrixCellLow;
}

function matrixRiskClass(color: string): string {
  switch (color) {
    case "var(--accent)":
      return styles.prrMatrixRiskAccent;
    case "var(--red)":
      return styles.prrMatrixRiskRed;
    case "var(--amber)":
      return styles.prrMatrixRiskAmber;
    case "var(--blue)":
      return styles.prrMatrixRiskBlue;
    case "var(--purple)":
      return styles.prrMatrixRiskPurple;
    default:
      return styles.prrMatrixRiskMuted;
  }
}

function legendDotClass(color: string): string {
  switch (color) {
    case "var(--accent)":
      return styles.prrLegendDotAccent;
    case "var(--red)":
      return styles.prrLegendDotRed;
    case "var(--amber)":
      return styles.prrLegendDotAmber;
    case "var(--blue)":
      return styles.prrLegendDotBlue;
    case "var(--purple)":
      return styles.prrLegendDotPurple;
    default:
      return styles.prrLegendDotMuted;
  }
}

function categoryCardClass(color: string): string {
  switch (color) {
    case "var(--accent)":
      return styles.prrCategoryCardAccent;
    case "var(--red)":
      return styles.prrCategoryCardRed;
    case "var(--amber)":
      return styles.prrCategoryCardAmber;
    case "var(--blue)":
      return styles.prrCategoryCardBlue;
    case "var(--purple)":
      return styles.prrCategoryCardPurple;
    default:
      return styles.prrCategoryCardMuted;
  }
}

function categoryRowClass(color: string): string {
  if (color === "var(--accent)") return styles.prrCategoryRowAccent;
  if (color === "var(--amber)") return styles.prrCategoryRowAmber;
  return styles.prrCategoryRowRed;
}

const tabs = ["risk register", "risk matrix", "by category", "mitigations"] as const;
type Tab = (typeof tabs)[number];
type FilterStatus = "All" | RiskStatus;

export function PortfolioRiskRegisterPage() {
  const [activeTab, setActiveTab] = useState<Tab>("risk register");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("All");
  const [expanded, setExpanded] = useState("RSK-001");

  const active = risks.filter((risk) => risk.status === "active");
  const critical = risks.filter((risk) => risk.likelihood * risk.impact >= 16);
  const highRisks = risks.filter((risk) => {
    const score = risk.likelihood * risk.impact;
    return score >= 9 && score < 16;
  });
  const totalMRRExposure = active.reduce((sum, risk) => sum + risk.mrrImpact, 0);

  const filtered = filterStatus === "All" ? risks : risks.filter((risk) => risk.status === filterStatus);

  return (
    <div className={cx(styles.pageBody, styles.prrRoot)}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / REPORTING &amp; INTELLIGENCE</div>
          <h1 className={styles.pageTitle}>Portfolio Risk Register</h1>
          <div className={styles.pageSub}>Live risk log - Likelihood x impact - Mitigations - Residual exposure</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnGhost")}>+ Add Risk</button>
          <button type="button" className={cx("btnSm", "btnAccent")}>Export Register</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb28") }>
        {[
          { label: "Active Risks", value: active.length.toString(), color: "var(--red)", sub: `${critical.length} critical, ${highRisks.length} high` },
          { label: "MRR Exposure", value: `R${(totalMRRExposure / 1000).toFixed(0)}k`, color: "var(--red)", sub: "From active client risks" },
          { label: "Monitoring", value: risks.filter((risk) => risk.status === "monitoring").length.toString(), color: "var(--amber)", sub: "Watch-list items" },
          { label: "Resolved (FY2026)", value: risks.filter((risk) => risk.status === "resolved").length.toString(), color: "var(--accent)", sub: "Closed out this year" }
        ].map((stat) => (
          <div key={stat.label} className={styles.statCard}>
            <div className={styles.statLabel}>{stat.label}</div>
            <div className={cx(styles.statValue, colorClass(stat.color))}>{stat.value}</div>
            <div className={cx("text11", "colorMuted")}>{stat.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.filterRow}>
        <select title="Select tab" value={activeTab} onChange={e => setActiveTab(e.target.value as Tab)} className={styles.filterSelect}>
          {tabs.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {activeTab === "risk register" ? (
          <select title="Filter by status" value={filterStatus} onChange={e => setFilterStatus(e.target.value as FilterStatus)} className={styles.filterSelect}>
            {(["All", "active", "monitoring", "resolved"] as const).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        ) : null}
      </div>

      {activeTab === "risk register" ? (
        <div className={styles.prrRiskList}>
          {[...filtered].sort((a, b) => b.likelihood * b.impact - a.likelihood * a.impact).map((risk) => {
            const level = riskLevel(risk.likelihood, risk.impact);
            const residualLevel = riskLevel(risk.residualLikelihood, risk.residualImpact);
            const sc = statusConfig[risk.status];
            const catColor = categoryColors[risk.category] || "var(--muted)";
            const isExp = expanded === risk.id;
            return (
              <div key={risk.id} className={cx(styles.prrRiskCard, risk.status === "active" && risk.likelihood * risk.impact >= 9 && styles.prrRiskCardCritical)}>
                <div
                  role="button"
                  tabIndex={0}
                  className={styles.prrRiskHead}
                  onClick={() => setExpanded(isExp ? "" : risk.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setExpanded(isExp ? "" : risk.id);
                    }
                  }}
                >
                  <div className={styles.prrRiskGrid}>
                    <span className={cx("fontMono", "text10", "colorMuted")}>{risk.id}</span>
                    <span className={cx(styles.prrCategoryTag, toneTagClass(catColor))}>{risk.category}</span>
                    <div>
                      <div className={cx("fw700", "text13")}>{risk.title}</div>
                      <div className={cx("text10", "colorMuted", "mt4")}>Owner: {risk.owner.split(" ")[0]} - Raised {risk.dateRaised}</div>
                    </div>
                    <div className={styles.prrCenterCol}>
                      <div className={cx("text10", "colorMuted", "mb3")}>Risk Level</div>
                      <span className={cx("text11", "fw700", colorClass(level.color))}>{level.label} ({risk.likelihood}x{risk.impact}={risk.likelihood * risk.impact})</span>
                    </div>
                    {risk.mrrImpact > 0 ? (
                      <div className={styles.prrCenterCol}>
                        <div className={cx("text10", "colorMuted", "mb3")}>MRR at Risk</div>
                        <span className={cx("fontMono", "fw700", "colorRed")}>R{(risk.mrrImpact / 1000).toFixed(0)}k</span>
                      </div>
                    ) : (
                      <span />
                    )}
                    <span className={cx("fontMono", "text10", "textCenter", "wFit", styles.prrStatusTag, toneTagClass(sc.color))}>{sc.label}</span>
                    <span className={cx(styles.prrChevron, isExp ? "colorAccent" : "colorMuted")}>{isExp ? "▲" : "▼"}</span>
                  </div>
                </div>

                {isExp ? (
                  <div className={styles.prrExpanded}>
                    <div className={styles.prrExpandedGrid}>
                      <div>
                        <div className={styles.prrSectionTitle}>Description</div>
                        <div className={styles.prrDesc}>{risk.description}</div>
                        <div className={styles.prrLevelsGrid}>
                          <div className={cx(styles.prrLevelCard, toneLevelClass(level.color))}>
                            <div className={cx("text10", "colorMuted", "mb4")}>Inherent Risk</div>
                            <div className={cx("fontMono", "fw800", colorClass(level.color))}>{level.label}</div>
                            <div className={cx("text10", "colorMuted")}>L{risk.likelihood} x I{risk.impact} = {risk.likelihood * risk.impact}</div>
                          </div>
                          <div className={cx(styles.prrLevelCard, toneLevelClass(residualLevel.color))}>
                            <div className={cx("text10", "colorMuted", "mb4")}>Residual Risk</div>
                            <div className={cx("fontMono", "fw800", colorClass(residualLevel.color))}>{residualLevel.label}</div>
                            <div className={cx("text10", "colorMuted")}>L{risk.residualLikelihood} x I{risk.residualImpact} = {risk.residualLikelihood * risk.residualImpact}</div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className={styles.prrSectionTitle}>Mitigations</div>
                        {risk.mitigations.map((mitigation, index) => (
                          <div key={index} className={styles.prrMitigationRow}>
                            <span className={styles.prrMitigationArrow}>→</span>
                            <span className={styles.text12}>{mitigation}</span>
                          </div>
                        ))}
                        <div className={cx("text11", "colorMuted", "mt12")}>Last updated: {risk.lastUpdated}</div>
                      </div>
                    </div>
                    <div className={cx("flexRow", "gap8", "mt16")}>
                      {risk.status === "active" ? <button type="button" className={cx("btnSm", "btnAccent")}>Mark Resolved</button> : null}
                      <button type="button" className={cx("btnSm", "btnGhost")}>Update Risk</button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {activeTab === "risk matrix" ? (
        <div className={styles.prrMatrixCard}>
          <div className={styles.prrMatrixTitle}>5x5 Risk Matrix - Likelihood vs Impact</div>
          <div className={cx("text11", "colorMuted", "mb24")}>Bubble = risk item. Position = likelihood (x) x impact (y). Size proportional to MRR exposure.</div>
          <div className={styles.prrMatrixWrap}>
            <div className={styles.prrMatrixYLabel}>Impact →</div>
            <div className={styles.prrMatrixGrid}>
              {[5, 4, 3, 2, 1].map((impact) =>
                ([null, 1, 2, 3, 4, 5] as const).map((likelihood) => {
                  if (likelihood === null) {
                    return <div key={`y-${impact}`} className={styles.prrMatrixAxisY}>{impact}</div>;
                  }
                  const score = likelihood * impact;
                  const cellRisks = risks.filter((risk) => risk.likelihood === likelihood && risk.impact === impact);
                  return (
                    <div key={`${impact}-${likelihood}`} className={cx(styles.prrMatrixCell, matrixCellClass(score))}>
                      <span className={styles.prrMatrixScore}>{score}</span>
                      {cellRisks.map((risk) => (
                        <div key={risk.id} title={risk.title} className={cx(styles.prrMatrixRisk, matrixRiskClass(categoryColors[risk.category]))}>
                          {risk.id} {risk.category[0]}
                        </div>
                      ))}
                    </div>
                  );
                })
              )}
            </div>
            <div className={styles.prrMatrixXAxis}>
              <div className={styles.prrMatrixAxisSpacer} />
              {[1, 2, 3, 4, 5].map((likelihood) => (
                <div key={likelihood} className={styles.prrMatrixAxisX}>{likelihood}</div>
              ))}
            </div>
            <div className={styles.prrMatrixXLabel}>Likelihood →</div>
          </div>
          <div className={styles.prrLegend}>
            {Object.entries(categoryColors).map(([category, color]) => (
              <div key={category} className={styles.prrLegendItem}>
                <div className={cx(styles.prrLegendDot, legendDotClass(color))} />
                <span className={cx("text11", "colorMuted")}>{category}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === "by category" ? (
        <div className={styles.prrCategoryGrid}>
          {Object.entries(categoryColors).map(([category, color]) => {
            const catRisks = risks.filter((risk) => risk.category === category);
            const activeCount = catRisks.filter((risk) => risk.status === "active").length;
            return (
              <div key={category} className={cx(styles.prrCategoryCard, categoryCardClass(color))}>
                <div className={cx("flexBetween", "mb16")}>
                  <div className={cx(styles.prrCategoryTitle, colorClass(color))}>{category}</div>
                  <div className={cx("flexRow", "gap8")}>
                    {activeCount > 0 ? <span className={styles.prrActivePill}>{activeCount} active</span> : null}
                    <span className={cx("text10", "colorMuted")}>{catRisks.length} total</span>
                  </div>
                </div>
                {catRisks.map((risk) => {
                  const level = riskLevel(risk.likelihood, risk.impact);
                  const sc = statusConfig[risk.status];
                  return (
                    <div key={risk.id} className={cx(styles.prrCategoryRow, categoryRowClass(level.color))}>
                      <div>
                        <div className={cx("text12", "fw600")}>{risk.title}</div>
                        <div className={cx("text10", "colorMuted", "mt4")}>{risk.owner.split(" ")[0]} - {level.label} risk</div>
                      </div>
                      <span className={cx(styles.prrMiniStatus, toneTagClass(sc.color))}>{sc.label}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      ) : null}

      {activeTab === "mitigations" ? (
        <div className={styles.prrMitigationList}>
          {risks
            .filter((risk) => risk.status !== "resolved")
            .sort((a, b) => b.likelihood * b.impact - a.likelihood * a.impact)
            .map((risk) => {
              const level = riskLevel(risk.likelihood, risk.impact);
              const residual = riskLevel(risk.residualLikelihood, risk.residualImpact);
              return (
                <div key={risk.id} className={styles.prrMitigationCard}>
                  <div className={cx("flexBetween", "mb16")}>
                    <div>
                      <div className={cx("fw700", "text14")}>{risk.title}</div>
                      <div className={cx("text11", "colorMuted")}>Owner: {risk.owner} - {risk.id}</div>
                    </div>
                    <div className={styles.prrResidualSplit}>
                      <div className={styles.prrAlignRight}>
                        <div className={cx("text10", "colorMuted")}>Inherent</div>
                        <div className={cx("fontMono", "fw700", colorClass(level.color))}>{level.label} ({risk.likelihood * risk.impact})</div>
                      </div>
                      <span className={cx("colorMuted")}>→</span>
                      <div className={styles.prrAlignRight}>
                        <div className={cx("text10", "colorMuted")}>Residual</div>
                        <div className={cx("fontMono", "fw700", colorClass(residual.color))}>{residual.label} ({risk.residualLikelihood * risk.residualImpact})</div>
                      </div>
                    </div>
                  </div>
                  <div className={styles.prrMitigationStack}>
                    {risk.mitigations.map((mitigation, index) => (
                      <div key={index} className={styles.prrMitigationItem}>
                        <div className={styles.prrMitigationBadge}><span className={styles.prrMitigationBadgeArrow}>→</span></div>
                        <span className={styles.text12}>{mitigation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      ) : null}
    </div>
  );
}

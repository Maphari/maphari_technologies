// ════════════════════════════════════════════════════════════════════════════
// portfolio-risk-register-page.tsx — Admin Portfolio Risk Register
// Data : loadAllPortfolioRisksWithRefresh → GET /risks
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useMemo, useState } from "react";
import { cx, styles } from "../style";
import { colorClass } from "./admin-page-utils";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadAllPortfolioRisksWithRefresh,
  type AdminPortfolioRisk,
} from "../../../../lib/api/admin";

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

// ── Helpers ───────────────────────────────────────────────────────────────────

const SEVERITY_NUM: Record<string, number> = {
  LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4, EXTREME: 5,
};
function severityToNum(s: string): number {
  return SEVERITY_NUM[s.toUpperCase()] ?? 2;
}

function mapRiskStatus(s: string): RiskStatus {
  const u = s.toUpperCase();
  if (u === "MONITORING")                     return "monitoring";
  if (u === "CLOSED" || u === "RESOLVED")     return "resolved";
  return "active";
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "2-digit" });
  } catch { return "—"; }
}

function mapApiRisk(r: AdminPortfolioRisk): RiskItem {
  const likelihood = severityToNum(r.likelihood);
  const impact     = severityToNum(r.impact);
  return {
    id:                  r.id.slice(0, 6).toUpperCase(),
    category:            "Operations",
    title:               r.name,
    description:         r.detail ?? "No description provided.",
    likelihood,
    impact,
    owner:               r.project?.name ?? "Unassigned",
    status:              mapRiskStatus(r.status),
    mrrImpact:           0,
    dateRaised:          formatDate(r.createdAt),
    lastUpdated:         formatDate(r.updatedAt),
    mitigations:         r.mitigation ? [r.mitigation] : [],
    residualLikelihood:  Math.max(1, likelihood - 1),
    residualImpact:      Math.max(1, impact - 1),
    relatedTo:           r.project?.name ?? null,
  };
}

// ── Static lookups ────────────────────────────────────────────────────────────

const categoryColors: Record<RiskCategory, string> = {
  Client: "var(--red)",
  Financial: "var(--amber)",
  Operations: "var(--amber)",
  Staff: "var(--blue)",
  Legal: "var(--purple)"
};

const statusConfig: Record<RiskStatus, { color: string; label: string }> = {
  active:     { color: "var(--red)",   label: "Active" },
  monitoring: { color: "var(--amber)", label: "Monitoring" },
  resolved:   { color: "var(--accent)", label: "Resolved" }
};

function riskLevel(likelihood: number, impact: number): { label: string; color: string } {
  const score = likelihood * impact;
  if (score >= 16) return { label: "Critical", color: "var(--red)" };
  if (score >= 9)  return { label: "High",     color: "var(--red)" };
  if (score >= 4)  return { label: "Medium",   color: "var(--amber)" };
  return { label: "Low", color: "var(--accent)" };
}

function toneTagClass(color: string): string {
  switch (color) {
    case "var(--accent)": return styles.prrTagToneAccent;
    case "var(--red)":    return styles.prrTagToneRed;
    case "var(--amber)":  return styles.prrTagToneAmber;
    case "var(--blue)":   return styles.prrTagToneBlue;
    case "var(--purple)": return styles.prrTagTonePurple;
    default:              return styles.prrTagToneMuted;
  }
}

function toneLevelClass(color: string): string {
  if (color === "var(--amber)")  return styles.prrLevelAmber;
  if (color === "var(--accent)") return styles.prrLevelAccent;
  return styles.prrLevelRed;
}

function matrixCellClass(score: number): string {
  if (score >= 16) return styles.prrMatrixCellCritical;
  if (score >= 9)  return styles.prrMatrixCellHigh;
  if (score >= 4)  return styles.prrMatrixCellMedium;
  return styles.prrMatrixCellLow;
}

function matrixRiskClass(color: string): string {
  switch (color) {
    case "var(--accent)": return styles.prrMatrixRiskAccent;
    case "var(--red)":    return styles.prrMatrixRiskRed;
    case "var(--amber)":  return styles.prrMatrixRiskAmber;
    case "var(--blue)":   return styles.prrMatrixRiskBlue;
    case "var(--purple)": return styles.prrMatrixRiskPurple;
    default:              return styles.prrMatrixRiskMuted;
  }
}

function legendDotClass(color: string): string {
  switch (color) {
    case "var(--accent)": return styles.prrLegendDotAccent;
    case "var(--red)":    return styles.prrLegendDotRed;
    case "var(--amber)":  return styles.prrLegendDotAmber;
    case "var(--blue)":   return styles.prrLegendDotBlue;
    case "var(--purple)": return styles.prrLegendDotPurple;
    default:              return styles.prrLegendDotMuted;
  }
}

function categoryCardClass(color: string): string {
  switch (color) {
    case "var(--accent)": return styles.prrCategoryCardAccent;
    case "var(--red)":    return styles.prrCategoryCardRed;
    case "var(--amber)":  return styles.prrCategoryCardAmber;
    case "var(--blue)":   return styles.prrCategoryCardBlue;
    case "var(--purple)": return styles.prrCategoryCardPurple;
    default:              return styles.prrCategoryCardMuted;
  }
}

function categoryRowClass(color: string): string {
  if (color === "var(--accent)") return styles.prrCategoryRowAccent;
  if (color === "var(--amber)")  return styles.prrCategoryRowAmber;
  return styles.prrCategoryRowRed;
}

const tabs = ["risk register", "risk matrix", "by category", "mitigations"] as const;
type Tab = (typeof tabs)[number];
type FilterStatus = "All" | RiskStatus;

// ── Component ─────────────────────────────────────────────────────────────────

export function PortfolioRiskRegisterPage({ session }: { session: AuthSession | null }) {
  const [activeTab, setActiveTab]       = useState<Tab>("risk register");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("All");
  const [expanded, setExpanded]         = useState("");
  const [apiRisks, setApiRisks]         = useState<AdminPortfolioRisk[]>([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    void loadAllPortfolioRisksWithRefresh(session).then((r) => {
      if (cancelled) return;
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) setApiRisks(r.data);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [session]);

  const risks = useMemo<RiskItem[]>(() => apiRisks.map(mapApiRisk), [apiRisks]);

  const active           = risks.filter((r) => r.status === "active");
  const critical         = risks.filter((r) => r.likelihood * r.impact >= 16);
  const highRisks        = risks.filter((r) => { const s = r.likelihood * r.impact; return s >= 9 && s < 16; });
  const totalMRRExposure = active.reduce((sum, r) => sum + r.mrrImpact, 0);
  const filtered         = filterStatus === "All" ? risks : risks.filter((r) => r.status === filterStatus);

  return (
    <div className={cx(styles.pageBody, styles.prrRoot)}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / REPORTING &amp; INTELLIGENCE</div>
          <h1 className={styles.pageTitle}>Portfolio Risk Register</h1>
          <div className={styles.pageSub}>Live risk log — Likelihood × Impact — Mitigations — Residual exposure</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnGhost")}>+ Add Risk</button>
          <button type="button" className={cx("btnSm", "btnAccent")}>Export Register</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb28")}>
        {[
          { label: "Active Risks",      value: loading ? "…" : active.length.toString(),                                         color: "var(--red)",    sub: `${critical.length} critical, ${highRisks.length} high` },
          { label: "MRR Exposure",      value: loading ? "…" : `R${(totalMRRExposure / 1000).toFixed(0)}k`,                      color: "var(--red)",    sub: "From active client risks" },
          { label: "Monitoring",        value: loading ? "…" : risks.filter((r) => r.status === "monitoring").length.toString(), color: "var(--amber)",  sub: "Watch-list items" },
          { label: "Resolved (FY2026)", value: loading ? "…" : risks.filter((r) => r.status === "resolved").length.toString(),  color: "var(--accent)", sub: "Closed out this year" },
        ].map((stat) => (
          <div key={stat.label} className={styles.statCard}>
            <div className={styles.statLabel}>{stat.label}</div>
            <div className={cx(styles.statValue, colorClass(stat.color))}>{stat.value}</div>
            <div className={cx("text11", "colorMuted")}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className={cx("colorMuted2", "text12", "mt16")}>Loading risks…</div>
      ) : risks.length === 0 ? (
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateTitle")}>No risks logged</div>
          <p className={cx("emptyStateSub")}>
            Project risks will appear here once they are created. Use "+ Add Risk" to log the first risk.
          </p>
        </div>
      ) : (
        <>
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
                const level         = riskLevel(risk.likelihood, risk.impact);
                const residualLevel = riskLevel(risk.residualLikelihood, risk.residualImpact);
                const sc            = statusConfig[risk.status];
                const catColor      = categoryColors[risk.category] || "var(--muted)";
                const isExp         = expanded === risk.id;
                return (
                  <div key={risk.id} className={cx(styles.prrRiskCard, risk.status === "active" && risk.likelihood * risk.impact >= 9 && styles.prrRiskCardCritical)}>
                    <div
                      role="button"
                      tabIndex={0}
                      className={styles.prrRiskHead}
                      onClick={() => setExpanded(isExp ? "" : risk.id)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpanded(isExp ? "" : risk.id); } }}
                    >
                      <div className={styles.prrRiskGrid}>
                        <span className={cx("fontMono", "text10", "colorMuted")}>{risk.id}</span>
                        <span className={cx(styles.prrCategoryTag, toneTagClass(catColor))}>{risk.category}</span>
                        <div>
                          <div className={cx("fw700", "text13")}>{risk.title}</div>
                          <div className={cx("text10", "colorMuted", "mt4")}>Project: {risk.owner} — Raised {risk.dateRaised}</div>
                        </div>
                        <div className={styles.prrCenterCol}>
                          <div className={cx("text10", "colorMuted", "mb3")}>Risk Level</div>
                          <span className={cx("text11", "fw700", colorClass(level.color))}>{level.label} ({risk.likelihood}×{risk.impact}={risk.likelihood * risk.impact})</span>
                        </div>
                        {risk.mrrImpact > 0 ? (
                          <div className={styles.prrCenterCol}>
                            <div className={cx("text10", "colorMuted", "mb3")}>MRR at Risk</div>
                            <span className={cx("fontMono", "fw700", "colorRed")}>R{(risk.mrrImpact / 1000).toFixed(0)}k</span>
                          </div>
                        ) : <span />}
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
                                <div className={cx("text10", "colorMuted")}>L{risk.likelihood} × I{risk.impact} = {risk.likelihood * risk.impact}</div>
                              </div>
                              <div className={cx(styles.prrLevelCard, toneLevelClass(residualLevel.color))}>
                                <div className={cx("text10", "colorMuted", "mb4")}>Residual Risk</div>
                                <div className={cx("fontMono", "fw800", colorClass(residualLevel.color))}>{residualLevel.label}</div>
                                <div className={cx("text10", "colorMuted")}>L{risk.residualLikelihood} × I{risk.residualImpact} = {risk.residualLikelihood * risk.residualImpact}</div>
                              </div>
                            </div>
                          </div>
                          <div>
                            <div className={styles.prrSectionTitle}>Mitigations</div>
                            {risk.mitigations.length > 0 ? risk.mitigations.map((m, i) => (
                              <div key={i} className={styles.prrMitigationRow}>
                                <span className={styles.prrMitigationArrow}>→</span>
                                <span className={styles.text12}>{m}</span>
                              </div>
                            )) : <div className={cx("text12", "colorMuted")}>No mitigations recorded.</div>}
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
              <div className={styles.prrMatrixTitle}>5×5 Risk Matrix — Likelihood vs Impact</div>
              <div className={cx("text11", "colorMuted", "mb24")}>Bubble = risk item. Position = likelihood (x) × impact (y).</div>
              <div className={styles.prrMatrixWrap}>
                <div className={styles.prrMatrixYLabel}>Impact →</div>
                <div className={styles.prrMatrixGrid}>
                  {[5, 4, 3, 2, 1].map((impact) =>
                    ([null, 1, 2, 3, 4, 5] as const).map((likelihood) => {
                      if (likelihood === null) {
                        return <div key={`y-${impact}`} className={styles.prrMatrixAxisY}>{impact}</div>;
                      }
                      const score = likelihood * impact;
                      const cellRisks = risks.filter((r) => r.likelihood === likelihood && r.impact === impact);
                      return (
                        <div key={`${impact}-${likelihood}`} className={cx(styles.prrMatrixCell, matrixCellClass(score))}>
                          <span className={styles.prrMatrixScore}>{score}</span>
                          {cellRisks.map((r) => (
                            <div key={r.id} title={r.title} className={cx(styles.prrMatrixRisk, matrixRiskClass(categoryColors[r.category]))}>
                              {r.id} {r.category[0]}
                            </div>
                          ))}
                        </div>
                      );
                    })
                  )}
                </div>
                <div className={styles.prrMatrixXAxis}>
                  <div className={styles.prrMatrixAxisSpacer} />
                  {[1, 2, 3, 4, 5].map((l) => <div key={l} className={styles.prrMatrixAxisX}>{l}</div>)}
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
                const catRisks   = risks.filter((r) => r.category === category);
                const activeCount = catRisks.filter((r) => r.status === "active").length;
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
                      const sc    = statusConfig[risk.status];
                      return (
                        <div key={risk.id} className={cx(styles.prrCategoryRow, categoryRowClass(level.color))}>
                          <div>
                            <div className={cx("text12", "fw600")}>{risk.title}</div>
                            <div className={cx("text10", "colorMuted", "mt4")}>{risk.owner} — {level.label} risk</div>
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
                .filter((r) => r.status !== "resolved")
                .sort((a, b) => b.likelihood * b.impact - a.likelihood * a.impact)
                .map((risk) => {
                  const level    = riskLevel(risk.likelihood, risk.impact);
                  const residual = riskLevel(risk.residualLikelihood, risk.residualImpact);
                  return (
                    <div key={risk.id} className={styles.prrMitigationCard}>
                      <div className={cx("flexBetween", "mb16")}>
                        <div>
                          <div className={cx("fw700", "text14")}>{risk.title}</div>
                          <div className={cx("text11", "colorMuted")}>Project: {risk.owner} — {risk.id}</div>
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
                        {risk.mitigations.length > 0 ? risk.mitigations.map((m, i) => (
                          <div key={i} className={styles.prrMitigationItem}>
                            <div className={styles.prrMitigationBadge}><span className={styles.prrMitigationBadgeArrow}>→</span></div>
                            <span className={styles.text12}>{m}</span>
                          </div>
                        )) : <div className={cx("text12", "colorMuted")}>No mitigations recorded.</div>}
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

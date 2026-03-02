"use client";

import { useState } from "react";
import { cx, styles } from "../style";
import { colorClass } from "./admin-page-utils";

const months = ["Mar", "Apr", "May", "Jun", "Jul", "Aug"] as const;
const currentMRR = 380600;

type Scenario = "best" | "base" | "worst";

type ClientRow = {
  name: string;
  color: string;
  mrr: number;
  retentionProb: number;
  expansionPotential: number;
  churnRisk: number;
};

const clients: ClientRow[] = [
  { name: "Volta Studios", color: "var(--accent)", mrr: 28000, retentionProb: 97, expansionPotential: 8000, churnRisk: 4 },
  { name: "Kestrel Capital", color: "var(--purple)", mrr: 21000, retentionProb: 38, expansionPotential: 0, churnRisk: 62 },
  { name: "Mira Health", color: "var(--blue)", mrr: 21600, retentionProb: 78, expansionPotential: 10000, churnRisk: 22 },
  { name: "Dune Collective", color: "var(--amber)", mrr: 16000, retentionProb: 18, expansionPotential: 0, churnRisk: 74 },
  { name: "Okafor & Sons", color: "var(--amber)", mrr: 12000, retentionProb: 98, expansionPotential: 4000, churnRisk: 2 }
];

type PipelineRow = {
  name: string;
  source: string;
  stage: string;
  potential: number;
  probability: number;
  color: string;
  expectedClose: (typeof months)[number];
};

const pipeline: PipelineRow[] = [
  { name: "Horizon Media", source: "Volta referral", stage: "Proposal Sent", potential: 28000, probability: 55, color: "var(--accent)", expectedClose: "Mar" },
  { name: "Apex Financial", source: "Okafor referral", stage: "Negotiation", potential: 45000, probability: 70, color: "var(--blue)", expectedClose: "Mar" },
  { name: "SolarSense", source: "LinkedIn", stage: "Discovery", potential: 18000, probability: 30, color: "var(--purple)", expectedClose: "Apr" },
  { name: "Pulse Clinics", source: "Mira referral", stage: "Discovery", potential: 22000, probability: 25, color: "var(--amber)", expectedClose: "May" }
];

type ForecastMonth = {
  month: (typeof months)[number];
  mrr: number;
  retained: number;
  expansion: number;
  newBiz: number;
};

function buildForecast(scenario: Scenario): ForecastMonth[] {
  const retentionMultiplier = scenario === "best" ? 1.1 : scenario === "worst" ? 0.6 : 1.0;
  const expansionMultiplier = scenario === "best" ? 1.2 : scenario === "worst" ? 0 : 0.5;
  const pipelineMultiplier = scenario === "best" ? 1.3 : scenario === "worst" ? 0.5 : 1.0;

  return months.map((month, i) => {
    const retainedMRR = clients.reduce((s, c) => {
      const effectiveRetention = Math.min(c.retentionProb * retentionMultiplier, 99) / 100;
      return s + c.mrr * effectiveRetention;
    }, 0);

    const expansionMRR = clients.reduce((s, c) => s + c.expansionPotential * expansionMultiplier * (i >= 2 ? 1 : 0), 0);

    const newMRR = pipeline.reduce((s, p) => {
      const prob = (p.probability * pipelineMultiplier) / 100;
      return s + (p.expectedClose === month ? p.potential * prob : 0);
    }, 0);

    const monthMRR = Math.round(retainedMRR + expansionMRR + newMRR);
    return {
      month,
      mrr: monthMRR,
      retained: Math.round(retainedMRR),
      expansion: Math.round(expansionMRR),
      newBiz: Math.round(newMRR)
    };
  });
}

const scenarios: Record<Scenario, ForecastMonth[]> = {
  best: buildForecast("best"),
  base: buildForecast("base"),
  worst: buildForecast("worst")
};

const tabs = ["6-month forecast", "pipeline impact", "scenario planner", "assumptions"] as const;
type Tab = (typeof tabs)[number];

function scenarioCardClass(scenario: Scenario, activeScenario: Scenario): string {
  if (activeScenario !== scenario) return "";
  if (scenario === "best") return styles.revfScenarioBestActive;
  if (scenario === "base") return styles.revfScenarioBaseActive;
  return styles.revfScenarioWorstActive;
}

function progressToneClass(value: string): string {
  if (value === "var(--red)") return styles.revfProgressRed;
  if (value === "var(--amber)") return styles.revfProgressAmber;
  if (value === "var(--blue)") return styles.revfProgressBlue;
  if (value === "var(--purple)") return styles.revfProgressPurple;
  if (value === "var(--muted)") return styles.revfProgressMuted;
  return styles.revfProgressAccent;
}

function sparkFill(scenario: Scenario, isActive: boolean): string {
  if (scenario === "best") return isActive ? "color-mix(in srgb, var(--accent) 75%, transparent)" : "color-mix(in srgb, var(--accent) 35%, transparent)";
  if (scenario === "base") return isActive ? "color-mix(in srgb, var(--blue) 75%, transparent)" : "color-mix(in srgb, var(--blue) 35%, transparent)";
  return isActive ? "color-mix(in srgb, var(--red) 75%, transparent)" : "color-mix(in srgb, var(--red) 35%, transparent)";
}

function dotClass(value: string): string {
  if (value === "var(--red)") return styles.revfDotRed;
  if (value === "var(--blue)") return styles.revfDotBlue;
  if (value === "var(--amber)") return styles.revfDotAmber;
  if (value === "var(--purple)") return styles.revfDotPurple;
  if (value === "var(--muted)") return styles.revfDotMuted;
  return styles.revfDotAccent;
}

export function RevenueForecastingPage() {
  const [activeTab, setActiveTab] = useState<Tab>("6-month forecast");
  const [activeScenario, setActiveScenario] = useState<Scenario>("base");

  const forecast = scenarios[activeScenario];
  const forecastEndMRR = forecast[forecast.length - 1].mrr;
  const mrrGrowth = Math.round(((forecastEndMRR - currentMRR) / currentMRR) * 100);
  const weightedPipelineMRR = Math.round(pipeline.reduce((s, p) => s + p.potential * (p.probability / 100), 0));
  const maxBar = Math.max(...Object.values(scenarios).flatMap((s) => s.map((m) => m.mrr)));

  return (
    <div className={cx(styles.pageBody, styles.revfRoot)}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / REPORTING &amp; INTELLIGENCE</div>
          <h1 className={styles.pageTitle}>Revenue Forecasting</h1>
          <div className={styles.pageSub}>6-month MRR projection - Pipeline impact - Retention-weighted scenarios</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnAccent")}>Export Forecast</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb28")}>
        {[
          { label: "Current MRR", value: `R${(currentMRR / 1000).toFixed(0)}k`, color: "var(--accent)", sub: "Feb 2026 baseline" },
          { label: "Forecast MRR (Aug)", value: `R${(forecastEndMRR / 1000).toFixed(0)}k`, color: forecastEndMRR > currentMRR ? "var(--accent)" : "var(--red)", sub: `${mrrGrowth >= 0 ? "+" : ""}${mrrGrowth}% - ${activeScenario} case` },
          { label: "Weighted Pipeline", value: `R${(weightedPipelineMRR / 1000).toFixed(0)}k`, color: "var(--blue)", sub: "Probability-adjusted new MRR" },
          {
            label: "MRR at Churn Risk",
            value: `R${(clients.filter((c) => c.churnRisk >= 50).reduce((s, c) => s + c.mrr, 0) / 1000).toFixed(0)}k`,
            color: "var(--red)",
            sub: "From clients at risk"
          }
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, colorClass(s.color))}>{s.value}</div>
            <div className={cx("text11", "colorMuted")}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.filterRow}>
        <select title="View" value={activeTab} onChange={e => setActiveTab(e.target.value as Tab)} className={styles.filterSelect}>
          {tabs.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {(activeTab === "6-month forecast" || activeTab === "scenario planner") && (
          <select title="Scenario" value={activeScenario} onChange={e => setActiveScenario(e.target.value as Scenario)} className={styles.filterSelect}>
            {(["best", "base", "worst"] as const).map(s => <option key={s} value={s}>{s} case</option>)}
          </select>
        )}
      </div>

      {activeTab === "6-month forecast" && (
        <div className={styles.revfStack20}>
          <div className={styles.revfChartCard}>
            <div className={styles.revfSectionTitle}>MRR Forecast - {activeScenario.charAt(0).toUpperCase() + activeScenario.slice(1)} Case</div>
            <div className={cx("text11", "colorMuted", "mb24")}>Stacked: retained (lime) + expansion (blue) + new business (purple)</div>
            <div className={styles.revfBarRow}>
                  <div className={styles.revfBarCol}>
                    <div className={cx("fontMono", "text10", "colorMuted")}>R{(currentMRR / 1000).toFixed(0)}k</div>
                    <svg className={styles.revfNowBar} viewBox="0 0 10 140" preserveAspectRatio="none" aria-hidden="true">
                      <rect x="0" y={140 - (currentMRR / maxBar) * 140} width="10" height={(currentMRR / maxBar) * 140} className={styles.revfNowRect} />
                    </svg>
                <span className={styles.revfBarMonth}>NOW</span>
              </div>
              {forecast.map((m) => {
                const totalH = (m.mrr / maxBar) * 140;
                const retH = (m.retained / m.mrr) * totalH;
                const expH = (m.expansion / m.mrr) * totalH;
                const newH = totalH - retH - expH;
                const scenColor = activeScenario === "best" ? "var(--accent)" : activeScenario === "base" ? "var(--blue)" : "var(--red)";
                return (
                  <div key={m.month} className={styles.revfBarCol}>
                    <div className={cx("fontMono", "text10", colorClass(scenColor))}>R{(m.mrr / 1000).toFixed(0)}k</div>
                    <svg className={styles.revfStackedBar} viewBox="0 0 10 140" preserveAspectRatio="none" aria-hidden="true">
                      {newH > 0 && <rect x="0" y={140 - newH} width="10" height={newH} className={styles.revfNewBiz} />}
                      {expH > 0 && <rect x="0" y={140 - newH - expH} width="10" height={expH} className={styles.revfExpansion} />}
                      <rect x="0" y={140 - totalH} width="10" height={retH} className={styles.revfRetained} />
                    </svg>
                    <span className={styles.revfBarMonth}>{m.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.revfTableCard}>
            <div className={cx(styles.revfTableHead, "fontMono", "text10", "colorMuted", "uppercase")}>
              {"Month|Total MRR|Retained|Expansion|New Biz|Growth".split("|").map((h) => <span key={h}>{h}</span>)}
            </div>
            <div className={styles.revfNowRow}>
              <span className={cx("fontMono", "text11", "colorMuted")}>NOW</span>
              <span className={cx("fontMono", "fw700", "colorAccent")}>R{(currentMRR / 1000).toFixed(0)}k</span>
              <span className={cx("text11", "colorMuted")}>-</span>
              <span className={cx("text11", "colorMuted")}>-</span>
              <span className={cx("text11", "colorMuted")}>-</span>
              <span className={cx("text11", "colorMuted")}>Baseline</span>
            </div>
            {forecast.map((m, i) => {
              const prevMRR = i === 0 ? currentMRR : forecast[i - 1].mrr;
              const growth = Math.round(((m.mrr - prevMRR) / prevMRR) * 100);
              const scenColor = activeScenario === "best" ? "var(--accent)" : activeScenario === "base" ? "var(--blue)" : "var(--red)";
              return (
                <div key={m.month} className={cx(styles.revfTableRow, i < forecast.length - 1 && "borderB")}>
                  <span className={cx("fontMono", "fw700")}>{m.month}</span>
                  <span className={cx("fontMono", "fw800", "text14", colorClass(scenColor))}>R{(m.mrr / 1000).toFixed(0)}k</span>
                  <span className={cx("fontMono", "colorMuted")}>R{(m.retained / 1000).toFixed(0)}k</span>
                  <span className={cx("fontMono", "colorBlue")}>{m.expansion > 0 ? `+R${(m.expansion / 1000).toFixed(0)}k` : "-"}</span>
                  <span className={cx("fontMono", "colorPurple")}>{m.newBiz > 0 ? `+R${(m.newBiz / 1000).toFixed(0)}k` : "-"}</span>
                  <span className={cx("text12", growth >= 0 ? "colorAccent" : "colorRed")}>{growth >= 0 ? "^" : "v"} {Math.abs(growth)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "pipeline impact" && (
        <div className={styles.revfStack14}>
          <div className={styles.revfPipelineSummary}>
            <div>
              <div className={styles.revfSummaryTitle}>Total Pipeline Value</div>
              <div className={cx("text11", "colorMuted")}>Probability-weighted new MRR</div>
            </div>
            <div className={styles.revfSummaryValue}>R{(weightedPipelineMRR / 1000).toFixed(0)}k</div>
          </div>

          {pipeline.map((p) => {
            const weighted = Math.round(p.potential * (p.probability / 100));
            return (
              <div key={p.name} className={styles.revfPipelineCard}>
                <div className={styles.revfPipelineGrid}>
                  <div>
                    <div className={cx(styles.revfPipelineName, colorClass(p.color))}>{p.name}</div>
                    <div className={cx("text10", "colorMuted")}>{p.source}</div>
                  </div>
                  <div>
                    <div className={styles.revfMiniLabel}>Stage</div>
                    <span className={cx(styles.revfStageTag, p.stage === "Negotiation" ? styles.revfStageAmber : styles.revfStageBlue)}>{p.stage}</span>
                  </div>
                  <div>
                    <div className={styles.revfProbHead}>
                      <span className={styles.revfMiniLabel}>Close probability</span>
                      <span className={cx("fontMono", "text11", p.probability >= 60 ? "colorAccent" : "colorAmber")}>{p.probability}%</span>
                    </div>
                    <progress
                      className={cx(styles.revfProbTrack, p.probability >= 60 ? styles.revfProgressAccent : styles.revfProgressAmber)}
                      max={100}
                      value={p.probability}
                      aria-label={`${p.name} close probability ${p.probability}%`}
                    />
                  </div>
                  <div className={styles.revfCenterCol}>
                    <div className={styles.revfTinyLabel}>Potential MRR</div>
                    <div className={cx("fontMono", "fw700", "colorAccent")}>R{(p.potential / 1000).toFixed(0)}k</div>
                  </div>
                  <div className={styles.revfCenterCol}>
                    <div className={styles.revfTinyLabel}>Weighted</div>
                    <div className={cx("fontMono", "fw700", "colorBlue")}>R{(weighted / 1000).toFixed(0)}k</div>
                  </div>
                  <div className={styles.revfCenterCol}>
                    <div className={styles.revfTinyLabel}>Expected Close</div>
                    <div className={cx("fontMono", "fw700")}>{p.expectedClose} 2026</div>
                  </div>
                  <button type="button" className={cx("btnSm", "btnGhost")}>View</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "scenario planner" && (
        <div className={styles.revfScenarioGrid}>
          {(["best", "base", "worst"] as const).map((scenario) => {
            const sc = scenarios[scenario];
            const endMRR = sc[sc.length - 1].mrr;
            const growth = Math.round(((endMRR - currentMRR) / currentMRR) * 100);
            const color = scenario === "best" ? "var(--accent)" : scenario === "base" ? "var(--blue)" : "var(--red)";
            const desc = {
              best: "Retain all clients, expand Mira/Volta, close top 2 deals",
              base: "Kestrel/Dune churn handled, close Apex on schedule",
              worst: "Both at-risk clients churn, pipeline delays, no expansion"
            }[scenario];
            const revenue = sc.reduce((s, m) => s + m.mrr, 0);
            return (
              <div
                key={scenario}
                role="button"
                tabIndex={0}
                className={cx(styles.revfScenarioCard, scenarioCardClass(scenario, activeScenario))}
                onClick={() => setActiveScenario(scenario)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setActiveScenario(scenario);
                  }
                }}
              >
                <div className={cx(styles.revfScenarioTitle, colorClass(color))}>{scenario} Case</div>
                <div className={styles.revfScenarioDesc}>{desc}</div>
                <div className={cx(styles.revfScenarioValue, colorClass(color))}>R{(endMRR / 1000).toFixed(0)}k</div>
                <div className={styles.revfScenarioSub}>MRR by Aug 2026 - {growth >= 0 ? "+" : ""}{growth}% vs today</div>
                <div className={styles.revfSparkBars}>
                  {sc.map((m, i) => (
                    <svg key={i} className={styles.revfSparkBar} viewBox="0 0 10 60" preserveAspectRatio="none" aria-hidden="true">
                      <rect
                        x="0"
                        y={60 - (m.mrr / endMRR) * 60}
                        width="10"
                        height={(m.mrr / endMRR) * 60}
                        fill={sparkFill(scenario, activeScenario === scenario)}
                      />
                    </svg>
                  ))}
                </div>
                <div className={styles.revfScenarioFoot}>
                  <span>6-month revenue</span>
                  <span className={cx(styles.revfScenarioRevenue, colorClass(color))}>R{(revenue / 1000000).toFixed(2)}m</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "assumptions" && (
        <div className={cx("grid2", "gap20")}>
          <div className={cx("card", "p24")}>
            <div className={styles.revfSectionTitle}>Retention Assumptions</div>
            {clients.map((c) => (
              <div key={c.name} className={styles.revfAssumeRow}>
                <div className={cx(styles.revfColorDot, dotClass(c.color))} />
                <span className={cx(styles.revfAssumeName, colorClass(c.color))}>{c.name.split(" ")[0]}</span>
                <progress
                  className={cx(styles.revfAssumeTrack, c.retentionProb >= 70 ? styles.revfProgressAccent : c.retentionProb >= 40 ? styles.revfProgressAmber : styles.revfProgressRed)}
                  max={100}
                  value={c.retentionProb}
                  aria-label={`${c.name} retention probability ${c.retentionProb}%`}
                />
                <span className={cx(styles.revfAssumePct, c.retentionProb >= 70 ? "colorAccent" : c.retentionProb >= 40 ? "colorAmber" : "colorRed")}>{c.retentionProb}%</span>
              </div>
            ))}
          </div>
          <div className={cx("card", "p24")}>
            <div className={styles.revfSectionTitle}>Expansion Potential</div>
            {clients.map((c) => (
              <div key={c.name} className={styles.revfExpandRow}>
                <span className={cx(styles.revfAssumeName, colorClass(c.color))}>{c.name.split(" ")[0]}</span>
                <span className={cx("fontMono", c.expansionPotential > 0 ? "colorAccent" : "colorMuted")}>{c.expansionPotential > 0 ? `+R${(c.expansionPotential / 1000).toFixed(0)}k/mo` : "-"}</span>
              </div>
            ))}
            <div className={styles.revfModelNote}>
              <div className={styles.revfModelTitle}>Model Notes</div>
              <div className={styles.revfModelBody}>Retention probability derived from client health scorecard churn risk. Expansion revenue modelled from AM notes and growth signals. Pipeline probability from CRM stage data.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

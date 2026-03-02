"use client";

import { useState } from "react";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";

type DimensionScore = {
  score: number;
  weight: number;
  prev: number;
  note: string;
};

type DimensionMap = Record<string, DimensionScore>;

type ScorecardClient = {
  client: string;
  color: string;
  avatar: string;
  tier: string;
  am: string;
  mrr: number;
  months: number;
  dimensions: DimensionMap;
  history: number[];
  churnRisk: number;
  renewalProbability: number;
  openIssues: number;
};

const scorecardData: ScorecardClient[] = [
  {
    client: "Volta Studios",
    color: "var(--green)",
    avatar: "VS",
    tier: "Growth",
    am: "Nomsa Dlamini",
    mrr: 28000,
    months: 14,
    dimensions: {
      "NPS / Satisfaction": { score: 9.2, weight: 20, prev: 9.0, note: "Consistently promoter" },
      "Invoice Payment": { score: 9.5, weight: 15, prev: 9.5, note: "Always on time" },
      "Communication Health": { score: 9.0, weight: 15, prev: 8.8, note: "Responsive, positive tone" },
      "Project Delivery": { score: 8.8, weight: 20, prev: 8.5, note: "On track, minimal revisions" },
      "Scope Stability": { score: 9.0, weight: 10, prev: 9.0, note: "No scope disputes" },
      "Growth Signal": { score: 9.5, weight: 10, prev: 9.0, note: "Verbal interest in expanding" },
      "Relationship Depth": { score: 9.0, weight: 10, prev: 8.8, note: "Multi-stakeholder access" }
    },
    history: [82, 86, 88, 91, 94, 94],
    churnRisk: 4,
    renewalProbability: 96,
    openIssues: 0
  },
  {
    client: "Kestrel Capital",
    color: "var(--accent)",
    avatar: "KC",
    tier: "Core",
    am: "Nomsa Dlamini",
    mrr: 21000,
    months: 5,
    dimensions: {
      "NPS / Satisfaction": { score: 4.0, weight: 20, prev: 7.5, note: "Dropped significantly" },
      "Invoice Payment": { score: 2.0, weight: 15, prev: 9.0, note: "INV-0039 overdue 12 days" },
      "Communication Health": { score: 5.0, weight: 15, prev: 7.0, note: "Terse replies, slow response" },
      "Project Delivery": { score: 6.5, weight: 20, prev: 6.8, note: "Slight delays, client frustrated" },
      "Scope Stability": { score: 7.0, weight: 10, prev: 7.5, note: "No major disputes" },
      "Growth Signal": { score: 3.0, weight: 10, prev: 6.0, note: "No expansion signals" },
      "Relationship Depth": { score: 5.0, weight: 10, prev: 6.5, note: "Only one contact point" }
    },
    history: [74, 78, 72, 68, 55, 44],
    churnRisk: 62,
    renewalProbability: 38,
    openIssues: 2
  },
  {
    client: "Mira Health",
    color: "var(--blue)",
    avatar: "MH",
    tier: "Core",
    am: "Nomsa Dlamini",
    mrr: 21600,
    months: 4,
    dimensions: {
      "NPS / Satisfaction": { score: 8.0, weight: 20, prev: 6.5, note: "Recovering well" },
      "Invoice Payment": { score: 9.5, weight: 15, prev: 9.5, note: "Always on time" },
      "Communication Health": { score: 8.2, weight: 15, prev: 7.0, note: "Improved significantly" },
      "Project Delivery": { score: 7.8, weight: 20, prev: 7.5, note: "Minor wireframe revisions" },
      "Scope Stability": { score: 8.5, weight: 10, prev: 8.5, note: "Stable" },
      "Growth Signal": { score: 7.5, weight: 10, prev: 6.0, note: "Mentioned phase 2 interest" },
      "Relationship Depth": { score: 7.0, weight: 10, prev: 6.5, note: "Dr. Obi very engaged" }
    },
    history: [61, 63, 66, 69, 72, 74],
    churnRisk: 22,
    renewalProbability: 78,
    openIssues: 0
  },
  {
    client: "Dune Collective",
    color: "var(--amber)",
    avatar: "DC",
    tier: "Core",
    am: "Renzo Fabbri",
    mrr: 16000,
    months: 4,
    dimensions: {
      "NPS / Satisfaction": { score: 3.0, weight: 20, prev: 6.0, note: "Very unhappy with scope" },
      "Invoice Payment": { score: 2.5, weight: 15, prev: 8.5, note: "INV-0040 overdue" },
      "Communication Health": { score: 3.5, weight: 15, prev: 5.0, note: "No reply to emails" },
      "Project Delivery": { score: 5.5, weight: 20, prev: 5.5, note: "Template library rejected" },
      "Scope Stability": { score: 2.0, weight: 10, prev: 5.0, note: "Active scope dispute" },
      "Growth Signal": { score: 2.0, weight: 10, prev: 3.0, note: "No growth signals" },
      "Relationship Depth": { score: 3.0, weight: 10, prev: 4.0, note: "Relationship deteriorating" }
    },
    history: [71, 68, 60, 54, 46, 38],
    churnRisk: 74,
    renewalProbability: 18,
    openIssues: 3
  },
  {
    client: "Okafor & Sons",
    color: "var(--amber)",
    avatar: "OS",
    tier: "Core",
    am: "Tapiwa Moyo",
    mrr: 12000,
    months: 18,
    dimensions: {
      "NPS / Satisfaction": { score: 10.0, weight: 20, prev: 9.8, note: "Absolute promoter" },
      "Invoice Payment": { score: 9.8, weight: 15, prev: 9.8, note: "Always early" },
      "Communication Health": { score: 9.5, weight: 15, prev: 9.2, note: "James always responsive" },
      "Project Delivery": { score: 9.8, weight: 20, prev: 9.5, note: "Annual report approved" },
      "Scope Stability": { score: 9.5, weight: 10, prev: 9.5, note: "Zero disputes ever" },
      "Growth Signal": { score: 8.5, weight: 10, prev: 8.0, note: "Asked about new services" },
      "Relationship Depth": { score: 9.8, weight: 10, prev: 9.5, note: "CEO direct relationship" }
    },
    history: [88, 90, 92, 93, 95, 96],
    churnRisk: 2,
    renewalProbability: 98,
    openIssues: 0
  }
];

function calcHealthScore(dimensions: DimensionMap): number {
  const rows = Object.values(dimensions);
  const totalWeight = rows.reduce((s, d) => s + d.weight, 0);
  return Math.round((rows.reduce((s, d) => s + (d.score / 10) * d.weight, 0) / totalWeight) * 100);
}

function healthColor(health: number): string {
  if (health >= 70) return "var(--green)";
  if (health >= 50) return "var(--amber)";
  return "var(--red)";
}

function dimColor(score: number): string {
  if (score >= 8) return "var(--green)";
  if (score >= 6) return "var(--blue)";
  if (score >= 4) return "var(--amber)";
  return "var(--red)";
}

function churnColor(risk: number): string {
  if (risk >= 50) return "var(--red)";
  if (risk >= 25) return "var(--amber)";
  return "var(--green)";
}

function renewalColor(prob: number): string {
  if (prob >= 75) return "var(--green)";
  return "var(--amber)";
}

const tabs = ["scorecard grid", "deep dive", "risk summary"] as const;
type Tab = (typeof tabs)[number];

export function ClientHealthScorecardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("scorecard grid");
  const [selected, setSelected] = useState<ScorecardClient>(scorecardData[0]);

  const atRisk = scorecardData.filter((c) => c.churnRisk >= 50).length;
  const avgHealth = Math.round(scorecardData.reduce((s, c) => s + calcHealthScore(c.dimensions), 0) / scorecardData.length);
  const totalMRRAtRisk = scorecardData.filter((c) => c.churnRisk >= 50).reduce((s, c) => s + c.mrr, 0);

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / REPORTING & INTELLIGENCE</div>
          <h1 className={styles.pageTitle}>Client Health Scorecard</h1>
          <div className={styles.pageSub}>7-dimension weighted health model · Churn risk · Renewal probability</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnAccent")}>Export Scorecard</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb28")}>
        {[
          { label: "Portfolio Avg Health", value: avgHealth.toString(), color: healthColor(avgHealth), sub: "Weighted score" },
          { label: "Clients at Risk", value: atRisk.toString(), color: atRisk > 0 ? "var(--red)" : "var(--green)", sub: "Churn risk >= 50%" },
          { label: "MRR at Risk", value: `R${(totalMRRAtRisk / 1000).toFixed(0)}k`, color: "var(--red)", sub: "From at-risk clients" },
          { label: "Renewal Probability", value: `${Math.round(scorecardData.reduce((s, c) => s + c.renewalProbability, 0) / scorecardData.length)}%`, color: "var(--blue)", sub: "Portfolio average" }
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx("statValue", styles.healthToneText, toneClass(s.color))}>{s.value}</div>
            <div className={cx("text11", "colorMuted")}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.filterRow}>
        <select title="Select tab" value={activeTab} onChange={e => setActiveTab(e.target.value as Tab)} className={styles.filterSelect}>
          {tabs.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {activeTab === "scorecard grid" && (
        <div>
          <div className={cx("card", "overflowAuto", "mb20")}>
            <div className={styles.healthMinW900}>
              <div className={cx("healthGridHead")}>
                <span className={cx("text10", "colorMuted")}>Client</span>
                {Object.keys(scorecardData[0].dimensions).map((d) => (
                  <span key={d} className={cx("textXs", "colorMuted", "textCenter")}>{d.split(" ")[0]}</span>
                ))}
                <span className={cx("text10", "colorMuted", "textCenter")}>Score</span>
                <span className={cx("text10", "colorMuted", "textCenter")}>Churn%</span>
                <span className={cx("text10", "colorMuted", "textCenter")}>Issues</span>
              </div>

              {[...scorecardData]
                .sort((a, b) => calcHealthScore(a.dimensions) - calcHealthScore(b.dimensions))
                .map((c) => {
                  const health = calcHealthScore(c.dimensions);
                  return (
                    <div
                      key={c.client}
                      onClick={() => {
                        setSelected(c);
                        setActiveTab("deep dive");
                      }}
                      className={cx("healthGridRow", "pointerCursor", c.churnRisk >= 50 && styles.healthRowAtRisk)}
                    >
                      <div className={cx("flexRow", "gap8")}>
                        <div className={cx(styles.healthDot8, toneClass(c.color))} />
                        <span className={cx("fw600", "text13", styles.healthToneText, toneClass(c.color))}>{c.client.split(" ")[0]}</span>
                      </div>

                      {Object.values(c.dimensions).map((d, di) => {
                        const score = d.score;
                        const color = dimColor(score);
                        return (
                          <div key={`${c.client}-${di}`} className={cx("textCenter")}>
                            <div className={styles.healthTinyTrack}>
                              <progress className={cx(styles.healthTinyFill, "uiProgress", toneClass(color))} max={100} value={(score / 10) * 100} />
                            </div>
                            <span className={cx("fontMono", "text10", styles.healthToneText, toneClass(color))}>{score.toFixed(1)}</span>
                          </div>
                        );
                      })}

                      <div className={cx("textCenter", "fontMono", "fw800", styles.healthScore18, styles.healthToneText, toneClass(healthColor(health)))}>{health}</div>
                      <div className={cx("textCenter", "fontMono", styles.healthToneText, toneClass(churnColor(c.churnRisk)))}>{c.churnRisk}%</div>
                      <div className={cx("textCenter", styles.healthToneText, c.openIssues > 0 ? "toneRed" : "toneMuted")}>{c.openIssues > 0 ? `! ${c.openIssues}` : "\u2014"}</div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className={cx("text11", "colorMuted", "flexRow", "gap4")}>
            <span>Click any row to open deep dive.</span>
            <span>Dimension weights: NPS 20%, Invoice 15%, Comms 15%, Delivery 20%, Scope 10%, Growth 10%, Relationship 10%</span>
          </div>
        </div>
      )}

      {activeTab === "deep dive" && (
        <div className={styles.healthDeepDiveSplit}>
          <div className={cx("flexCol", "gap8")}>
            {scorecardData.map((c) => {
              const h = calcHealthScore(c.dimensions);
              return (
                <div
                  key={c.client}
                  onClick={() => setSelected(c)}
                  className={cx("pointerCursor", styles.healthSelectCard, selected.client === c.client && styles.healthSelectCardActive, selected.client === c.client && toneClass(c.color))}
                >
                  <div className={cx("fw600", "text12", selected.client === c.client && styles.healthToneText, selected.client === c.client && toneClass(c.color))}>{c.client.split(" ")[0]}</div>
                  <div className={cx("fontMono", "fw800", styles.healthScore16, styles.healthToneText, toneClass(healthColor(h)))}>{h}</div>
                </div>
              );
            })}
          </div>

          <div className={cx("card", "p24", styles.healthDetailCard, toneClass(selected.color))}>
            <div className={cx("flexBetween", "mb28")}>
              <div>
                <div className={cx("fw800", styles.healthTitle22, styles.healthToneText, toneClass(selected.color))}>{selected.client}</div>
                <div className={cx("colorMuted", "text13")}>{selected.tier} · {selected.am} · {selected.months} months</div>
              </div>
              <div className={cx("textRight")}>
                <div className={cx("fontMono", "fw800", styles.healthScore40, styles.healthToneText, churnColor(selected.churnRisk) === "var(--red)" ? "toneRed" : "toneAccent")} >{calcHealthScore(selected.dimensions)}</div>
                <div className={cx("text11", "colorMuted")}>Health Score</div>
              </div>
            </div>

            <div className={cx("flexCol", "gap10", "mb24")}>
              {Object.entries(selected.dimensions).map(([dim, data]) => {
                const color = dimColor(data.score);
                const delta = (data.score - data.prev).toFixed(1);
                return (
                  <div key={dim} className={styles.healthDimRow}>
                    <div>
                      <div className={cx("fw600", "text12")}>{dim}</div>
                      <div className={cx("text10", "colorMuted")}>Weight: {data.weight}%</div>
                    </div>
                    <div>
                      <div className={cx("h6", styles.healthTrackBg)}>
                        <progress className={cx(styles.healthFillFull, "uiProgress", toneClass(color))} max={100} value={(data.score / 10) * 100} />
                      </div>
                      <div className={cx("text10", "colorMuted", "mt4")}>{data.note}</div>
                    </div>
                    <div className={cx("fontMono", "fw800", "textCenter", styles.healthScore18, styles.healthToneText, toneClass(color))}>{data.score.toFixed(1)}</div>
                    <span className={cx("text12", "textCenter", styles.healthToneText, Number.parseFloat(delta) > 0 ? "toneAccent" : Number.parseFloat(delta) < 0 ? "toneRed" : "toneMuted")}>
                      {Number.parseFloat(delta) > 0 ? "\u25B2" : Number.parseFloat(delta) < 0 ? "\u25BC" : "\u2192"}
                    </span>
                    <span className={cx("fontMono", "text10", "colorMuted", "textCenter")}>prev {data.prev.toFixed(1)}</span>
                  </div>
                );
              })}
            </div>

            <div className={cx("grid3", "mb20")}>
              {[
                { label: "Churn Risk", value: `${selected.churnRisk}%`, color: churnColor(selected.churnRisk) },
                { label: "Renewal Probability", value: `${selected.renewalProbability}%`, color: renewalColor(selected.renewalProbability) },
                { label: "MRR at Stake", value: `R${(selected.mrr / 1000).toFixed(0)}k`, color: "var(--blue)" }
              ].map((m) => (
                <div key={m.label} className={cx("bgBg", "p14", "textCenter")}>
                  <div className={cx("fontMono", "fw800", styles.healthScore24, styles.healthToneText, toneClass(m.color))}>{m.value}</div>
                  <div className={cx("text10", "colorMuted", "mt4")}>{m.label}</div>
                </div>
              ))}
            </div>

            <div className={cx("flexRow", "gap8")}>
              {selected.churnRisk >= 50 ? <button type="button" className={cx("btnSm", styles.healthDangerBtn, styles.healthBtnPad)}>Log Intervention</button> : null}
              <button type="button" className={cx("btnSm", "btnAccent", styles.healthBtnPad)}>View Client</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "risk summary" && (
        <div className={cx("flexCol", "gap16")}>
          {[...scorecardData].sort((a, b) => b.churnRisk - a.churnRisk).map((c) => {
            const health = calcHealthScore(c.dimensions);
            const worstDim = Object.entries(c.dimensions).reduce<[string, DimensionScore]>((a, [k, v]) => (v.score < a[1].score ? [k, v] : a), Object.entries(c.dimensions)[0]);
            return (
              <div key={c.client} className={cx("card", "p24", c.churnRisk >= 50 && styles.healthRiskCard)}>
                <div className={styles.healthRiskGrid}>
                  <div className={cx("fw700", styles.healthName15, styles.healthToneText, toneClass(c.color))}>{c.client}</div>
                  <div className={cx("fontMono", "fw800", styles.healthScore24, styles.healthToneText, toneClass(healthColor(health)))}>{health}</div>
                  <div>
                    <div className={cx("text10", "colorMuted", "mb4")}>Weakest dimension: {worstDim[0]}</div>
                    <div className={cx("text12", styles.healthToneText, worstDim[1].score < 5 ? "toneRed" : "toneAmber")}>{worstDim[1].note}</div>
                  </div>
                  <div className={cx("textCenter")}>
                    <div className={cx("text10", "colorMuted", "mb3")}>Churn Risk</div>
                    <div className={cx("fontMono", "fw800", styles.healthScore20, styles.healthToneText, toneClass(churnColor(c.churnRisk)))}>{c.churnRisk}%</div>
                  </div>
                  <div className={cx("textCenter")}>
                    <div className={cx("text10", "colorMuted", "mb3")}>Renewal Probability</div>
                    <div className={cx("fontMono", "fw800", styles.healthScore20, styles.healthToneText, toneClass(renewalColor(c.renewalProbability)))}>{c.renewalProbability}%</div>
                  </div>
                  {c.churnRisk >= 50 ? <button type="button" className={cx("btnSm", styles.healthDangerBtn)}>Intervene</button> : <span className={cx("text11", "colorGreen", "textCenter")}>Healthy</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

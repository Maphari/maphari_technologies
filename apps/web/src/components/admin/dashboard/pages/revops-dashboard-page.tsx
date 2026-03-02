"use client";

import { useState } from "react";
import { cx, styles } from "../style";
import { colorClass } from "./admin-page-utils";

const mrrHistory = [
  { month: "Aug", mrr: 298000, churn: 0, expansion: 0, new: 28000 },
  { month: "Sep", mrr: 326000, churn: 0, expansion: 28000, new: 0 },
  { month: "Oct", mrr: 354000, churn: 0, expansion: 0, new: 28000 },
  { month: "Nov", mrr: 370000, churn: 12000, expansion: 16000, new: 12000 },
  { month: "Dec", mrr: 356000, churn: 28000, expansion: 14000, new: 0 },
  { month: "Jan", mrr: 378000, churn: 0, expansion: 22000, new: 0 },
  { month: "Feb", mrr: 398600, churn: 0, expansion: 16000, new: 4600 }
] as const;

const pipeline = [
  { stage: "Discovery", leads: 4, value: 148000, avgDays: 8 },
  { stage: "Proposal Sent", leads: 2, value: 84000, avgDays: 14 },
  { stage: "Negotiation", leads: 1, value: 42000, avgDays: 21 },
  { stage: "Contract Sent", leads: 1, value: 28000, avgDays: 7 }
] as const;

const revenueConcentration = [
  { client: "Volta Studios", mrr: 28000, pct: 7.0, color: "var(--accent)" },
  { client: "Kestrel Capital", mrr: 21000, pct: 5.3, color: "var(--purple)" },
  { client: "Mira Health", mrr: 21600, pct: 5.4, color: "var(--blue)" },
  { client: "Dune Collective", mrr: 16000, pct: 4.0, color: "var(--amber)" },
  { client: "Okafor & Sons", mrr: 12000, pct: 3.0, color: "var(--amber)" }
] as const;

const forecastData = [
  { month: "Mar 2026", forecast: 420000, low: 395000, high: 450000 },
  { month: "Apr 2026", forecast: 440000, low: 408000, high: 475000 },
  { month: "May 2026", forecast: 458000, low: 418000, high: 500000 }
] as const;

const tabs = ["mrr tracking", "pipeline", "concentration risk", "forecast", "sales velocity"] as const;
type Tab = (typeof tabs)[number];

function progressToneClass(color: string): string {
  switch (color) {
    case "var(--accent)":
      return styles.revopsProgressAccent;
    case "var(--red)":
      return styles.revopsProgressRed;
    case "var(--amber)":
      return styles.revopsProgressAmber;
    case "var(--blue)":
      return styles.revopsProgressBlue;
    case "var(--purple)":
      return styles.revopsProgressPurple;
    default:
      return styles.revopsProgressAccent;
  }
}

export function RevOpsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("mrr tracking");

  const currentMRR = mrrHistory[mrrHistory.length - 1].mrr;
  const prevMRR = mrrHistory[mrrHistory.length - 2].mrr;
  const mrrGrowth = (((currentMRR - prevMRR) / prevMRR) * 100).toFixed(1);
  const arr = currentMRR * 12;
  const pipelineValue = pipeline.reduce((s, p) => s + p.value, 0);

  const maxMRR = Math.max(...mrrHistory.map((m) => m.mrr));

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / REVENUE OPERATIONS</div>
          <h1 className={styles.pageTitle}>RevOps Dashboard</h1>
          <div className={styles.pageSub}>MRR · ARR · Pipeline velocity · Revenue concentration · Forecasting</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnAccent")}>Export RevOps Report</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "gap16", "mb28")}>
        {[
          { label: "MRR (Feb 2026)", value: `R${(currentMRR / 1000).toFixed(1)}k`, color: "var(--accent)", sub: `${Number(mrrGrowth) > 0 ? "▲" : "▼"} ${Math.abs(Number(mrrGrowth))}% MoM`, subColor: Number(mrrGrowth) > 0 ? "var(--accent)" : "var(--red)" },
          { label: "ARR (Annualised)", value: `R${(arr / 1000000).toFixed(2)}M`, color: "var(--blue)", sub: "Based on Feb MRR", subColor: "var(--muted)" },
          { label: "Pipeline Value", value: `R${(pipelineValue / 1000).toFixed(0)}k`, color: "var(--purple)", sub: `${pipeline.reduce((s, p) => s + p.leads, 0)} active leads`, subColor: "var(--muted)" },
          { label: "Net MRR Growth", value: `+R${((currentMRR - prevMRR) / 1000).toFixed(1)}k`, color: "var(--accent)", sub: "Expansion + New - Churn", subColor: "var(--muted)" }
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, colorClass(s.color))}>{s.value}</div>
            <div className={cx("text11", colorClass(s.subColor || "var(--muted)"))}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.filterRow}>
        <select title="View" value={activeTab} onChange={e => setActiveTab(e.target.value as Tab)} className={styles.filterSelect}>
          {tabs.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {activeTab === "mrr tracking" ? (
        <div className={styles.revopsSplit}>
          <div className={cx("card", "p24")}>
            <div className={styles.revopsSecTitle}>MRR Movement - 7 Months</div>
            <div className={styles.revopsChartBars}>
              {mrrHistory.map((m, i) => {
                const h = (m.mrr / maxMRR) * 120;
                const isLast = i === mrrHistory.length - 1;
                return (
                  <div key={m.month} className={styles.revopsBarCol}>
                    <div className={cx("text10", "fontMono", isLast ? "colorAccent" : "colorMuted", "mb4")}>
                      R{(m.mrr / 1000).toFixed(0)}k
                    </div>
                    <svg className={styles.revopsBarFill} viewBox="0 0 10 120" preserveAspectRatio="none" aria-hidden="true">
                      <rect x="0" y={120 - h} width="10" height={h} fill={isLast ? "var(--accent)" : "var(--accent-g)"} />
                    </svg>
                    <div className={cx("text10", isLast ? "colorAccent" : "colorMuted", "mt4")}>{m.month}</div>
                  </div>
                );
              })}
            </div>
            <div className={styles.revopsTableWrap}>
              <div className={styles.revopsMrrHead}>
                {["Month", "MRR", "New", "Expansion", "Churn"].map((h) => <span key={h}>{h}</span>)}
              </div>
              {mrrHistory.map((m, i) => (
                <div key={m.month} className={cx(styles.revopsMrrRow, i < mrrHistory.length - 1 && "borderB")}>
                  <span className={cx("fontMono", "colorMuted")}>{m.month}</span>
                  <span className={cx("fontMono", "fw700", "colorAccent")}>R{(m.mrr / 1000).toFixed(0)}k</span>
                  <span className={cx("fontMono", m.new > 0 ? "colorBlue" : "colorMuted")}>{m.new > 0 ? `+R${(m.new / 1000).toFixed(0)}k` : "-"}</span>
                  <span className={cx("fontMono", m.expansion > 0 ? "colorPurple" : "colorMuted")}>{m.expansion > 0 ? `+R${(m.expansion / 1000).toFixed(0)}k` : "-"}</span>
                  <span className={cx("fontMono", m.churn > 0 ? "colorRed" : "colorMuted")}>{m.churn > 0 ? `-R${(m.churn / 1000).toFixed(0)}k` : "-"}</span>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.revopsSideCol}>
            {[
              { label: "New MRR (Feb)", value: `+R${(mrrHistory[6].new / 1000).toFixed(1)}k`, color: "var(--blue)", desc: "New client revenue" },
              { label: "Expansion MRR (Feb)", value: `+R${(mrrHistory[6].expansion / 1000).toFixed(0)}k`, color: "var(--purple)", desc: "Upsell & tier upgrades" },
              { label: "Churned MRR (Feb)", value: `R${mrrHistory[6].churn}`, color: "var(--accent)", desc: "No churn this month" }
            ].map((s) => (
              <div key={s.label} className={styles.statCard}>
                <div className={styles.statLabel}>{s.label}</div>
                <div className={cx(styles.statValue, colorClass(s.color))}>{s.value}</div>
                <div className={cx("text12", "colorMuted")}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === "pipeline" ? (
        <div className={styles.revopsSplit}>
          <div>
            <div className={cx("card", "p24", "mb16")}>
              <div className={styles.revopsSecTitle}>Sales Pipeline</div>
              <div className={cx("flexCol", "gap12")}>
                {pipeline.map((stage, i) => {
                  const maxLeads = pipeline[0].leads;
                  const colors = ["var(--accent)", "var(--blue)", "var(--purple)", "var(--amber)"] as const;
                  return (
                    <div key={stage.stage}>
                      <div className={cx("flexBetween", "mb6")}>
                        <span className={cx("text13", "fw600")}>{stage.stage}</span>
                        <div className={styles.revopsMetaRow}>
                          <span className={cx("colorMuted")}>{stage.leads} leads</span>
                          <span className={colorClass(colors[i])}>R{(stage.value / 1000).toFixed(0)}k</span>
                          <span className={cx("colorMuted")}>{stage.avgDays}d avg</span>
                        </div>
                      </div>
                      <div className={styles.revopsTrack28}>
                        <progress
                          className={cx(styles.revopsTrackFill, progressToneClass(colors[i]))}
                          max={maxLeads}
                          value={stage.leads}
                          aria-label={`${stage.stage} leads ${stage.leads}`}
                        />
                        <span className={styles.revopsLeadNum}>{stage.leads}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className={styles.revopsSideCol}>
            <div className={cx("card", "p24")}>
              <div className={styles.revopsSecTitle}>Pipeline Summary</div>
              <div className={cx("flexCol", "gap12")}>
                <div>
                  <div className={cx("text11", "colorMuted", "mb4")}>Total Pipeline Value</div>
                  <div className={styles.revopsValue32}>R{(pipelineValue / 1000).toFixed(0)}k</div>
                </div>
                <div className={styles.revopsHr} />
                <div className={cx("grid2", "gap12")}>
                  <div>
                    <div className={cx("text11", "colorMuted", "mb4")}>Total Leads</div>
                    <div className={styles.revopsValue22}>{pipeline.reduce((s, p) => s + p.leads, 0)}</div>
                  </div>
                  <div>
                    <div className={cx("text11", "colorMuted", "mb4")}>Win Rate (90d)</div>
                    <div className={cx(styles.revopsValue22, "colorAccent")}>42%</div>
                  </div>
                  <div>
                    <div className={cx("text11", "colorMuted", "mb4")}>Avg Deal Size</div>
                    <div className={styles.revopsValue22}>R{Math.round(pipelineValue / pipeline.reduce((s, p) => s + p.leads, 0) / 1000)}k</div>
                  </div>
                  <div>
                    <div className={cx("text11", "colorMuted", "mb4")}>Sales Cycle</div>
                    <div className={styles.revopsValue22}>38d</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "concentration risk" ? (
        <div className={cx("grid2", "gap20")}>
          <div className={cx("card", "p24")}>
            <div className={styles.revopsSecTitle}>Revenue Concentration</div>
            <div className={cx("text11", "colorMuted", "mb20")}>Top 2 clients = {revenueConcentration.slice(0, 2).reduce((s, c) => s + c.pct, 0).toFixed(1)}% of MRR</div>
            <div className={cx("flexCol", "gap14")}>
              {revenueConcentration.map((c) => (
                <div key={c.client}>
                  <div className={cx("flexBetween", "mb6")}>
                    <span className={cx("text13", "fw600")}>{c.client}</span>
                    <div className={styles.revopsMetaRow}>
                      <span className={colorClass(c.color)}>R{(c.mrr / 1000).toFixed(0)}k</span>
                      <span className={cx("colorMuted")}>{c.pct}%</span>
                    </div>
                  </div>
                  <div className={styles.revopsTrack8}>
                    <progress
                      className={cx(styles.revopsTrackBar, progressToneClass(c.color))}
                      max={10}
                      value={c.pct}
                      aria-label={`${c.client} concentration ${c.pct}%`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.revopsSideCol}>
            <div className={cx("card", "p24")}>
              <div className={styles.revopsSecTitle}>Concentration Risk Score</div>
              <div className={styles.revopsRiskWord}>Medium</div>
              <div className={cx(styles.revopsTrack8, "mb12")}>
                <div className={styles.revopsRiskFill} />
              </div>
              <div className={styles.revopsBodyText}>
                No single client exceeds 10% of MRR - within acceptable range. Target: no client above 20%. Current highest: Volta Studios at 7.0%.
              </div>
            </div>
            <div className={styles.revopsWarnCard}>
              <div className={styles.revopsWarnTitle}>Concentration Guidance</div>
              <div className={styles.revopsBodyText}>
                To reduce risk, target 3-4 new clients at R10k-R20k MRR each. This would dilute top client concentration below 5%.
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "forecast" ? (
        <div className={cx("grid2", "gap20")}>
          <div className={cx("card", "p24")}>
            <div className={styles.revopsSecTitle}>3-Month MRR Forecast</div>
            <div className={cx("flexCol", "gap20")}>
              {forecastData.map((f) => (
                <div key={f.month}>
                  <div className={cx("flexBetween", "mb8")}>
                    <span className={cx("text14", "fw700")}>{f.month}</span>
                    <span className={styles.revopsForecastVal}>R{(f.forecast / 1000).toFixed(0)}k</span>
                  </div>
                  <div className={styles.revopsForecastTrack}>
                    <svg className={styles.revopsForecastSvg} viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true">
                      <rect
                        className={styles.revopsForecastRangeRect}
                        x={(f.low / f.high) * 100}
                        y="0"
                        width={100 - (f.low / f.high) * 100}
                        height="12"
                      />
                      <rect
                        className={styles.revopsForecastMarkerRect}
                        x={(f.forecast / f.high) * 100 - 2}
                        y="0"
                        width="4"
                        height="12"
                      />
                    </svg>
                  </div>
                  <div className={styles.revopsForecastMeta}>
                    <span>Low: R{(f.low / 1000).toFixed(0)}k</span>
                    <span>High: R{(f.high / 1000).toFixed(0)}k</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.revopsSideCol}>
            <div className={cx("card", "p24")}>
              <div className={styles.revopsSecTitle}>Forecast Assumptions</div>
              {[
                { assumption: "Zero churn over 3 months", confidence: "High", color: "var(--accent)" },
                { assumption: "2 upsells (Mira + Okafor)", confidence: "Medium", color: "var(--amber)" },
                { assumption: "1 new client at R12k MRR", confidence: "Medium", color: "var(--amber)" },
                { assumption: "No rate changes", confidence: "High", color: "var(--accent)" }
              ].map((a, i) => (
                <div key={a.assumption} className={cx("flexBetween", "py10", i < 3 && "borderB")}> 
                  <span className={cx("text12")}>{a.assumption}</span>
                  <span className={cx("text10", "fontMono", colorClass(a.color))}>{a.confidence}</span>
                </div>
              ))}
            </div>
            <div className={cx("card", "p24")}>
              <div className={styles.revopsSecTitle}>Forecast Accuracy</div>
              <div className={styles.revopsValue36}>87%</div>
              <div className={styles.revopsBodyText}>Avg accuracy over last 6 forecasts. Industry benchmark: 80%.</div>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "sales velocity" ? (
        <div className={cx("grid2", "gap20")}>
          <div className={cx("card", "p24")}>
            <div className={styles.revopsSecTitle}>Sales Velocity Formula</div>
            <div className={cx("text11", "colorMuted", "mb24")}>Revenue generated per day from the pipeline</div>
            <div className={cx("grid2", "gap16", "mb24")}>
              {[
                { label: "# Opportunities", value: "8", color: "var(--blue)" },
                { label: "Avg Deal Value", value: "R37.5k", color: "var(--purple)" },
                { label: "Win Rate", value: "42%", color: "var(--accent)" },
                { label: "Sales Cycle (days)", value: "38", color: "var(--amber)" }
              ].map((s) => (
                <div key={s.label} className={styles.revopsMetricTile}>
                  <div className={cx("text11", "colorMuted", "mb4")}>{s.label}</div>
                  <div className={cx(styles.revopsMetricTileVal, colorClass(s.color))}>{s.value}</div>
                </div>
              ))}
            </div>
            <div className={styles.revopsVelocityCard}>
              <div className={cx("text12", "colorMuted", "mb8")}>Sales Velocity</div>
              <div className={styles.revopsVelocityVal}>R3,289</div>
              <div className={cx("text12", "colorMuted")}>per day</div>
            </div>
          </div>
          <div className={styles.revopsSideCol}>
            <div className={cx("card", "p24")}>
              <div className={styles.revopsSecTitle}>Velocity Trend</div>
              <div className={cx("flexCol", "gap12")}>
                {[
                  { period: "Nov 2025", velocity: 2800, change: 0 },
                  { period: "Dec 2025", velocity: 2400, change: -14.3 },
                  { period: "Jan 2026", velocity: 3100, change: +29.2 },
                  { period: "Feb 2026", velocity: 3289, change: +6.1 }
                ].map((v) => (
                  <div key={v.period} className={styles.revopsVelRow}>
                    <span className={styles.revopsVelPeriod}>{v.period}</span>
                    <div className={styles.revopsTrack8Flex}>
                      <progress
                        className={cx(styles.revopsTrackBar, styles.revopsProgressAccent)}
                        max={3500}
                        value={v.velocity}
                        aria-label={`${v.period} velocity ${v.velocity}`}
                      />
                    </div>
                    <div className={styles.revopsVelMeta}>
                      <span className={cx("fontMono", "text12")}>R{v.velocity.toLocaleString()}</span>
                      {v.change !== 0 ? <span className={cx("text11", v.change > 0 ? "colorAccent" : "colorRed")}>{v.change > 0 ? "▲" : "▼"} {Math.abs(v.change)}%</span> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className={cx("card", "p24")}>
              <div className={styles.revopsSecTitle}>How to Improve</div>
              {[
                { action: "Reduce sales cycle by 5 days", impact: "+R433/day" },
                { action: "Increase win rate to 50%", impact: "+R782/day" },
                { action: "Add 2 more opportunities", impact: "+R821/day" }
              ].map((item, i) => (
                <div key={item.action} className={cx("flexBetween", "py10", i < 2 && "borderB")}> 
                  <span className={cx("text12")}>{item.action}</span>
                  <span className={styles.revopsImpact}>{item.impact}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

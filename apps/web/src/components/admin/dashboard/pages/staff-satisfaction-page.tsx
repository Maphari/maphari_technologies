"use client";

import { useState } from "react";
import { cx, styles } from "../style";
import { AdminTabs } from "./shared";
import { colorClass } from "./admin-page-utils";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";

type Sentiment = "positive" | "neutral" | "negative";

type PulseResult = {
  month: string;
  enps: number;
  responses: number;
  total: number;
  scores: Record<string, number>;
  openFeedback: Array<{ theme: string; sentiment: Sentiment; note: string }>;
};

const pulseResults: PulseResult[] = [];

const sentimentConfig: Record<Sentiment, { color: string; icon: string }> = {
  positive: { color: "var(--accent)", icon: "▲" },
  neutral: { color: "var(--muted)", icon: "→" },
  negative: { color: "var(--red)", icon: "▼" }
};

const tabs = ["latest pulse", "trends", "feedback themes", "survey settings"] as const;
type Tab = (typeof tabs)[number];

function scoreColor(score: number): string {
  return score >= 8 ? "var(--accent)" : score >= 7 ? "var(--blue)" : score >= 6 ? "var(--amber)" : "var(--red)";
}

function eNPSColor(score: number): string {
  return score >= 50 ? "var(--accent)" : score >= 30 ? "var(--blue)" : score >= 10 ? "var(--amber)" : "var(--red)";
}

function progressToneClass(value: string): string {
  if (value === "var(--red)") return styles.sstProgressRed;
  if (value === "var(--amber)") return styles.sstProgressAmber;
  if (value === "var(--blue)") return styles.sstProgressBlue;
  return styles.sstProgressAccent;
}

function sentimentCardClass(sentiment: Sentiment): string {
  if (sentiment === "positive") return styles.sstFeedbackPos;
  if (sentiment === "negative") return styles.sstFeedbackNeg;
  return styles.sstFeedbackNeutral;
}

export function StaffSatisfactionPage() {
  const [activeTab, setActiveTab] = useState<Tab>("latest pulse");

  const latest = pulseResults[0] ?? null;
  const prev   = pulseResults[1] ?? null;
  const categories = latest ? Object.keys(latest.scores) : [];

  const responseRate  = latest ? Math.round((latest.responses / latest.total) * 100) : 0;
  const avgScore      = latest && categories.length > 0
    ? (Object.values(latest.scores).reduce((s, v) => s + v, 0) / categories.length).toFixed(1)
    : "0";
  const lowestCategory  = latest && categories.length > 0 ? categories.reduce((a, b) => (latest.scores[a] < latest.scores[b] ? a : b)) : "—";
  const highestCategory = latest && categories.length > 0 ? categories.reduce((a, b) => (latest.scores[a] > latest.scores[b] ? a : b)) : "—";

  const scoreChartData = categories.map(cat => ({ label: cat.split(" ")[0] ?? cat, count: latest?.scores[cat] ?? 0 }));

  const sentimentCounts = {
    positive: latest?.openFeedback.filter(f => f.sentiment === "positive").length ?? 0,
    neutral:  latest?.openFeedback.filter(f => f.sentiment === "neutral").length  ?? 0,
    negative: latest?.openFeedback.filter(f => f.sentiment === "negative").length ?? 0,
  };

  const tableRows = pulseResults.map(r => ({
    month:        r.month,
    enps:         r.enps,
    responses:    `${r.responses}/${r.total}`,
    avgScore:     (Object.values(r.scores).reduce((s, v) => s + v, 0) / Math.max(Object.keys(r.scores).length, 1)).toFixed(1),
  }));

  return (
    <div className={cx(styles.pageBody, styles.sstRoot)}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>GOVERNANCE / STAFF SATISFACTION</div>
          <h1 className={styles.pageTitle}>Staff Satisfaction</h1>
          <div className={styles.pageSub}>Monthly pulse surveys · eNPS · Trends · Anonymous feedback</div>
        </div>
        <div className={styles.sstHeadActions}>
          <button type="button" className={cx("btnSm", "btnGhost")}>View Results</button>
          <button type="button" className={cx("btnSm", "btnAccent")}>Send Pulse Survey</button>
        </div>
      </div>

      {/* Row 1 — Stats */}
      <WidgetGrid>
        <StatWidget label="eNPS Score" value={latest?.enps ?? "—"} sub={latest && prev ? `${latest.enps > prev.enps ? "▲" : "▼"} vs last month` : "No data yet"} tone={latest && latest.enps >= 50 ? "green" : latest && latest.enps >= 30 ? "default" : "amber"} />
        <StatWidget label="Response Rate" value={latest ? `${responseRate}%` : "—"} sub={latest ? `${latest.responses}/${latest.total} staff` : "No surveys sent"} tone={responseRate >= 80 ? "green" : responseRate > 0 ? "amber" : "default"} />
        <StatWidget label="Avg Score" value={latest ? `${avgScore}/10` : "—"} sub="Across all categories" tone={parseFloat(avgScore) >= 7.5 ? "green" : parseFloat(avgScore) > 0 ? "amber" : "default"} />
        <StatWidget label="Surveys Completed" value={pulseResults.length} sub="Historical results" tone="default" />
      </WidgetGrid>

      {/* Row 2 — Chart + Pipeline */}
      <WidgetGrid>
        <ChartWidget
          label="Category Scores"
          data={scoreChartData.length > 0 ? scoreChartData : [{ label: "No data", count: 0 }]}
          dataKey="count"
          type="bar"
          xKey="label"
          color="#8b6fff"
        />
        <PipelineWidget
          label="Feedback Sentiment"
          stages={[
            { label: "Positive", count: sentimentCounts.positive, total: Math.max(latest?.openFeedback.length ?? 0, 1), color: "#34d98b" },
            { label: "Neutral",  count: sentimentCounts.neutral,  total: Math.max(latest?.openFeedback.length ?? 0, 1), color: "#8b6fff" },
            { label: "Negative", count: sentimentCounts.negative, total: Math.max(latest?.openFeedback.length ?? 0, 1), color: "#ff5f5f" },
          ]}
        />
      </WidgetGrid>

      {/* Row 3 — Table */}
      <WidgetGrid>
        <TableWidget
          label="Survey History"
          rows={tableRows as Record<string, unknown>[]}
          columns={[
            { key: "month",     header: "Month" },
            { key: "enps",      header: "eNPS",      align: "right" },
            { key: "responses", header: "Responses", align: "right" },
            { key: "avgScore",  header: "Avg Score", align: "right" },
          ]}
          emptyMessage="No pulse survey results yet"
        />
      </WidgetGrid>

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
        {activeTab === "latest pulse" && latest ? (
          <div className={styles.sstLatestSplit}>
            <div>
              <div className={styles.sstSectionTitle}>{latest.month} - Category Scores</div>
              <div className={styles.sstScoreList}>
                {categories.map((cat) => {
                  const score = latest.scores[cat] ?? 0;
                  const prevScore = prev?.scores[cat] ?? score;
                  const delta = Number((score - prevScore).toFixed(1));
                  const color = scoreColor(score);
                  return (
                    <div key={cat} className={cx(styles.sstScoreCard, score < 7 && styles.sstScoreCardWarn)}>
                      <div className={styles.sstScoreRow}>
                        <span className={styles.sstCatName}>{cat}</span>
                        <progress
                          className={cx(styles.sstTrack, progressToneClass(color))}
                          max={10}
                          value={score}
                          aria-label={`${cat} score ${score} out of 10`}
                        />
                        <div className={styles.sstScoreValWrap}>
                          <div className={cx(styles.sstScoreVal, colorClass(color))}>{score}</div>
                          <div className={styles.sstOutOf}>out of 10</div>
                        </div>
                        <div className={styles.sstDeltaWrap}>
                          <span className={cx(styles.text12, delta > 0 ? "colorAccent" : delta < 0 ? "colorRed" : "colorMuted")}>
                            {delta > 0 ? "▲" : delta < 0 ? "▼" : "→"} {Math.abs(delta)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.sstSideStack}>
              <div className={styles.sstEnpsCard}>
                <div className={styles.sstMiniLabel}>eNPS Score</div>
                <div className={styles.sstGaugeWrap}>
                  <svg width={120} height={120} className={styles.sstGaugeSvg}>
                    <circle cx={60} cy={60} r={50} fill="none" stroke={"var(--border)"} strokeWidth={10} />
                    <circle cx={60} cy={60} r={50} fill="none" stroke={eNPSColor(latest.enps)} strokeWidth={10} strokeDasharray={`${((latest.enps + 100) / 200) * 314} 314`} strokeLinecap="round" />
                  </svg>
                  <div className={styles.sstGaugeValueWrap}>
                    <div className={cx(styles.sstGaugeValue, colorClass(eNPSColor(latest.enps)))}>{latest.enps}</div>
                    <div className={styles.sstOutOf}>eNPS</div>
                  </div>
                </div>
                <div className={cx("text11", "colorMuted")}>Range: -100 to +100</div>
                <div className={cx(styles.sstEnpsLabel, colorClass(eNPSColor(latest.enps)))}>
                  {latest.enps >= 50 ? "Excellent" : latest.enps >= 30 ? "Good" : latest.enps >= 10 ? "Needs Improvement" : "Critical"}
                </div>
              </div>

              <div className={styles.sstStrongWeakCard}>
                <div className={styles.sstStrongBlock}>
                  <div className={styles.sstStrongLabel}>Strongest</div>
                  <div className={styles.sstStrongName}>{highestCategory}</div>
                  <div className={styles.sstStrongVal}>{latest.scores[highestCategory] ?? "—"}/10</div>
                </div>
                <div className={styles.sstWeakBlock}>
                  <div className={styles.sstWeakLabel}>Weakest</div>
                  <div className={styles.sstStrongName}>{lowestCategory}</div>
                  <div className={styles.sstWeakVal}>{latest.scores[lowestCategory] ?? "—"}/10</div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "trends" && latest ? (
          <div className={styles.sstTrendStack}>
            {categories.map((cat) => {
              const dataPoints = pulseResults.map((r) => ({ month: r.month.slice(0, 3), score: r.scores[cat] ?? 0 })).reverse();
              return (
                <div key={cat} className={styles.sstTrendCard}>
                  <span className={styles.sstCatName}>{cat}</span>
                  <div className={styles.sstTrendBars}>
                    {dataPoints.map((dp, i) => {
                      const h = (dp.score / 10) * 40;
                      const color = scoreColor(dp.score);
                      return (
                        <div key={i} className={styles.sstTrendCol}>
                          <svg className={styles.sstTrendBarSvg} viewBox="0 0 10 40" preserveAspectRatio="none" aria-hidden="true">
                            <rect x="0" y={40 - h} width="10" height={h} fill={color} opacity={i === dataPoints.length - 1 ? 1 : 0.5} />
                          </svg>
                          <span className={styles.sstMonth}>{dp.month}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className={styles.sstTrendValueWrap}>
                    <div className={cx(styles.sstTrendValue, colorClass(scoreColor(latest.scores[cat] ?? 0)))}>{latest.scores[cat] ?? 0}</div>
                    <div className={styles.sstMonth}>Feb</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {activeTab === "feedback themes" && latest ? (
          <div>
            <div className={styles.sstAnonNotice}>
              All responses are anonymous. Themes are synthesized by category. Individual responses cannot be attributed.
            </div>
            <div className={styles.sstFeedbackStack}>
              {latest.openFeedback.map((item, i) => {
                const sc = sentimentConfig[item.sentiment];
                return (
                  <div key={i} className={cx(styles.sstFeedbackCard, sentimentCardClass(item.sentiment))}>
                    <div className={styles.sstFeedbackHead}>
                      <div className={styles.sstThemeWrap}>
                        <span className={styles.sstThemeLabel}>Theme</span>
                        <span className={styles.sstThemeName}>{item.theme}</span>
                      </div>
                      <div className={styles.sstSentWrap}>
                        <span className={cx(styles.text14, colorClass(sc.color))}>{sc.icon}</span>
                        <span className={cx(styles.text11, colorClass(sc.color), "capitalize")}>{item.sentiment}</span>
                      </div>
                    </div>
                    <div className={styles.sstQuote}>
                      &quot;{item.note}&quot;
                    </div>
                  </div>
                );
              })}
              {latest.openFeedback.length === 0 ? (
                <div className={styles.sstEmpty}>No open feedback this month</div>
              ) : null}
            </div>
          </div>
        ) : null}

        {activeTab === "survey settings" ? (
          <div className={styles.sstSettingsSplit}>
            <div className={styles.sstSettingsCard}>
              <div className={styles.sstSectionTitle}>Survey Schedule</div>
              {[
                { label: "Frequency", value: "Monthly (1st of each month)" },
                { label: "Response Window", value: "7 days" },
                { label: "Anonymity", value: "Full - responses not attributable" },
                { label: "Reminder", value: "3 days before close" },
                { label: "Next Survey", value: "1 Mar 2026" },
                { label: "Report Recipients", value: "Admin & Owner" }
              ].map((s) => (
                <div key={s.label} className={styles.sstSettingRow}>
                  <span className={styles.colorMuted}>{s.label}</span>
                  <span className={styles.sstSettingVal}>{s.value}</span>
                </div>
              ))}
              <button type="button" className={cx("btnSm", "btnAccent", "mt20")}>Edit Settings</button>
            </div>
            <div className={styles.sstSettingsCard}>
              <div className={styles.sstSectionTitle}>Survey Questions</div>
              {categories.map((cat, i) => (
                <div key={cat} className={styles.sstQuestionRow}>
                  <span className={styles.sstQuestionNo}>Q{i + 1}</span>
                  <span className={styles.text12}>Rate: {cat}</span>
                  <span className={styles.sstScale}>1-10 scale</span>
                </div>
              ))}
              <div className={styles.sstQuestionLast}>
                <span className={styles.sstQuestionNo}>Q8</span>
                <span>Open feedback (optional)</span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

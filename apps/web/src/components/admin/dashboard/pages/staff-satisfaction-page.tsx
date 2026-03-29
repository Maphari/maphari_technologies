"use client";

import { useState } from "react";
import { cx, styles } from "../style";
import { AdminTabs } from "./shared";
import { colorClass } from "./admin-page-utils";

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

  if (pulseResults.length === 0) {
    return (
      <div className={cx(styles.pageBody, styles.sstRoot)}>
        <div className={styles.pageHeader}>
          <div>
            <div className={styles.pageEyebrow}>COMMUNICATION / STAFF SATISFACTION</div>
            <h1 className={styles.pageTitle}>Staff Satisfaction</h1>
            <div className={styles.pageSub}>Monthly pulse surveys, eNPS, trends, and anonymous feedback</div>
          </div>
          <div className={styles.sstHeadActions}>
            <button type="button" className={cx("btnSm", "btnAccent")}>Send Pulse Survey</button>
          </div>
        </div>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3" y="12" width="4" height="9" rx="1" />
              <rect x="10" y="7" width="4" height="14" rx="1" />
              <rect x="17" y="3" width="4" height="18" rx="1" />
            </svg>
          </div>
          <div className={styles.emptyStateHeading}>No pulse survey results yet</div>
          <div className={styles.emptyStateSub}>Send your first pulse survey to start collecting staff satisfaction data.</div>
        </div>
      </div>
    );
  }

  const latest = pulseResults[0];
  const prev = pulseResults[1];
  const categories = Object.keys(latest.scores);

  const responseRate = Math.round((latest.responses / latest.total) * 100);
  const avgScore = (Object.values(latest.scores).reduce((s, v) => s + v, 0) / categories.length).toFixed(1);
  const lowestCategory = categories.reduce((a, b) => (latest.scores[a] < latest.scores[b] ? a : b));
  const highestCategory = categories.reduce((a, b) => (latest.scores[a] > latest.scores[b] ? a : b));

  return (
    <div className={cx(styles.pageBody, styles.sstRoot)}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>COMMUNICATION / STAFF SATISFACTION</div>
          <h1 className={styles.pageTitle}>Staff Satisfaction</h1>
          <div className={styles.pageSub}>Monthly pulse surveys, eNPS, trends, and anonymous feedback</div>
        </div>
        <div className={styles.sstHeadActions}>
          <button type="button" className={cx("btnSm", "btnGhost")}>View Results</button>
          <button type="button" className={cx("btnSm", "btnAccent")}>Send Pulse Survey</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb16") }>
        {[
          { label: "eNPS (Feb 2026)", value: latest.enps.toString(), color: eNPSColor(latest.enps), sub: `${latest.enps > prev.enps ? "▲" : "▼"} ${Math.abs(latest.enps - prev.enps)} vs Jan` },
          { label: "Response Rate", value: `${responseRate}%`, color: responseRate >= 80 ? "var(--accent)" : "var(--amber)", sub: `${latest.responses}/${latest.total} staff responded` },
          { label: "Avg Score (Feb)", value: `${avgScore}/10`, color: parseFloat(avgScore) >= 7.5 ? "var(--accent)" : "var(--amber)", sub: "Across all categories" },
          { label: "Lowest Category", value: lowestCategory.split(" ")[0], color: "var(--red)", sub: `${latest.scores[lowestCategory]}/10 - needs attention` }
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
        {activeTab === "latest pulse" ? (
          <div className={styles.sstLatestSplit}>
            <div>
              <div className={styles.sstSectionTitle}>February 2026 - Category Scores</div>
              <div className={styles.sstScoreList}>
                {categories.map((cat) => {
                  const score = latest.scores[cat];
                  const prevScore = prev.scores[cat];
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
                  <div className={styles.sstStrongVal}>{latest.scores[highestCategory]}/10</div>
                </div>
                <div className={styles.sstWeakBlock}>
                  <div className={styles.sstWeakLabel}>Weakest</div>
                  <div className={styles.sstStrongName}>{lowestCategory}</div>
                  <div className={styles.sstWeakVal}>{latest.scores[lowestCategory]}/10</div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "trends" ? (
          <div className={styles.sstTrendStack}>
            {categories.map((cat) => {
              const dataPoints = pulseResults.map((r) => ({ month: r.month.slice(0, 3), score: r.scores[cat] })).reverse();
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
                    <div className={cx(styles.sstTrendValue, colorClass(scoreColor(latest.scores[cat])))}>{latest.scores[cat]}</div>
                    <div className={styles.sstMonth}>Feb</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {activeTab === "feedback themes" ? (
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

// ════════════════════════════════════════════════════════════════════════════
// client-health-summary-page.tsx — Staff Client Health Summary
// Data : getStaffAllHealthScores → GET /staff/health-scores
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { cx } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  getStaffAllHealthScores,
  type StaffHealthScoreEntry,
} from "../../../../lib/api/staff/clients";

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(n: number) {
  if (n >= 80) return "colorGreen";
  if (n >= 60) return "colorAmber";
  return "colorRed";
}

function scoreFill(n: number) {
  if (n >= 80) return "chsHealthFillGreen";
  if (n >= 60) return "chsHealthFillAmber";
  return "chsHealthFillRed";
}

function healthLabel(n: number) {
  if (n >= 80) return { text: "Healthy",  cls: "chsBadgeGreen" };
  if (n >= 60) return { text: "Moderate", cls: "chsBadgeAmber" };
  return              { text: "At Risk",  cls: "chsBadgeRed"   };
}

type Trend = "up" | "down" | "stable";

function trendCls(t: Trend) {
  if (t === "up")   return "chsTrendUp";
  if (t === "down") return "chsTrendDown";
  return "chsTrendStable";
}

function trendGlyph(t: Trend) {
  if (t === "up")   return "↑";
  if (t === "down") return "↓";
  return "→";
}

function sentimentCls(s: string) {
  if (s === "positive") return "chsSentGreen";
  if (s === "at_risk")  return "chsSentRed";
  return "chsSentAmber";
}

function sentimentLabel(s: string) {
  if (s === "positive") return "Positive";
  if (s === "at_risk")  return "At Risk";
  return "Neutral";
}

function paymentCls(p: string) {
  return p === "paid" ? "chsPayGreen" : "chsPayRed";
}

function paymentLabel(p: string) {
  if (p === "paid")    return "Paid";
  if (p === "pending") return "Pending";
  return "Overdue";
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
  } catch {
    return iso;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ClientHealthSummaryPage({
  isActive,
  session,
}: {
  isActive: boolean;
  session: AuthSession | null;
}) {
  const [entries, setEntries] = useState<StaffHealthScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    void getStaffAllHealthScores(session).then((r) => {
      if (cancelled) return;
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) setEntries(r.data);
    }).catch(() => {
      // keep previous state on error
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [session?.accessToken]);

  const avgHealth = entries.length > 0
    ? Math.round(entries.reduce((s, c) => s + c.score, 0) / entries.length)
    : 0;
  const healthy = entries.filter((c) => c.score >= 80).length;
  const atRisk  = entries.filter((c) => c.score < 60).length;
  const sorted  = [...entries].sort((a, b) => a.score - b.score);

  if (loading) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-client-health-summary">
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </section>
    );
  }

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-client-health-summary">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Intelligence</div>
        <h1 className={cx("pageTitleText")}>Client Health Summary</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Health scores and key indicators for all assigned clients</p>
      </div>

      {/* ── Summary stats ── */}
      <div className={cx("chsStatGrid")}>

        <div className={cx("chsStatCard")}>
          <div className={cx("chsStatCardTop")}>
            <div className={cx("chsStatLabel")}>Avg Health Score</div>
            <div className={cx("chsStatValue", scoreColor(avgHealth))}>{loading ? "…" : avgHealth}</div>
          </div>
          <div className={cx("chsStatCardDivider")} />
          <div className={cx("chsStatCardBottom")}>
            <span className={cx("chsStatDot", "dynBgColor")} style={{ "--bg-color": avgHealth >= 80 ? "var(--green)" : avgHealth >= 60 ? "var(--amber)" : "var(--red)" } as React.CSSProperties} />
            <span className={cx("chsStatMeta")}>across all clients</span>
          </div>
        </div>

        <div className={cx("chsStatCard")}>
          <div className={cx("chsStatCardTop")}>
            <div className={cx("chsStatLabel")}>Healthy</div>
            <div className={cx("chsStatValue", "colorGreen")}>{loading ? "…" : healthy}</div>
          </div>
          <div className={cx("chsStatCardDivider")} />
          <div className={cx("chsStatCardBottom")}>
            <span className={cx("chsStatDot", "dotBgGreen")} />
            <span className={cx("chsStatMeta")}>score ≥ 80</span>
          </div>
        </div>

        <div className={cx("chsStatCard")}>
          <div className={cx("chsStatCardTop")}>
            <div className={cx("chsStatLabel")}>At Risk</div>
            <div className={cx("chsStatValue", atRisk > 0 ? "colorRed" : "colorGreen")}>{loading ? "…" : atRisk}</div>
          </div>
          <div className={cx("chsStatCardDivider")} />
          <div className={cx("chsStatCardBottom")}>
            <span className={cx("chsStatDot", "dynBgColor")} style={{ "--bg-color": atRisk > 0 ? "var(--red)" : "var(--muted2)" } as React.CSSProperties} />
            <span className={cx("chsStatMeta")}>{atRisk > 0 ? "needs attention" : "all clear"}</span>
          </div>
        </div>

        <div className={cx("chsStatCard")}>
          <div className={cx("chsStatCardTop")}>
            <div className={cx("chsStatLabel")}>Total Clients</div>
            <div className={cx("chsStatValue", "colorAccent")}>{loading ? "…" : entries.length}</div>
          </div>
          <div className={cx("chsStatCardDivider")} />
          <div className={cx("chsStatCardBottom")}>
            <span className={cx("chsStatDot", "dotBgAccent")} />
            <span className={cx("chsStatMeta")}>assigned to you</span>
          </div>
        </div>

      </div>

      {/* ── Client cards ── */}
      <div className={cx("chsSection")}>

        <div className={cx("chsSectionHeader")}>
          <div className={cx("chsSectionTitle")}>All Clients</div>
          <span className={cx("chsSectionMeta")}>{sorted.length} CLIENT{sorted.length !== 1 ? "S" : ""}</span>
        </div>

        {loading ? (
          <div className={cx("colorMuted2", "text12", "mt16")}>Loading health scores…</div>
        ) : sorted.length === 0 ? (
          <div className={cx("emptyState")}>
            <div className={cx("emptyStateIcon")}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>
            <div className={cx("emptyStateTitle")}>No client data yet</div>
            <p className={cx("emptyStateSub")}>Health scores will appear once clients are assigned to you.</p>
          </div>
        ) : (
          <div className={cx("chsCardList")}>
            {sorted.map((entry, idx) => {
              const badge = healthLabel(entry.score);
              return (
                <div key={entry.id} className={cx("chsClientCard", idx === sorted.length - 1 && "chsClientCardLast")}>

                  {/* Head: avatar + name + score + trend + badge */}
                  <div className={cx("chsClientHead")}>
                    <div className={cx("chsClientLeft")}>
                      <div className={cx("chsAvatar")}>{entry.avatar}</div>
                      <div>
                        <div className={cx("chsClientName")}>{entry.name}</div>
                        <div className={cx("chsClientContact")}>Last contact: {formatDate(entry.lastTouched)}</div>
                      </div>
                    </div>
                    <div className={cx("chsClientRight")}>
                      <span className={cx("chsScore", scoreColor(entry.score))}>{entry.score}</span>
                      <span className={cx("chsTrend", trendCls(entry.trend))}>{trendGlyph(entry.trend)}</span>
                      <span className={cx("chsHealthBadge", badge.cls)}>{badge.text}</span>
                    </div>
                  </div>

                  {/* Health score bar */}
                  <div className={cx("chsHealthBarWrap")}>
                    <div className={cx("chsHealthBarMeta")}>
                      <span className={cx("chsHealthBarLabel")}>Health Score</span>
                      <span className={cx("chsHealthBarPct", scoreColor(entry.score))}>{entry.score}</span>
                    </div>
                    <div className={cx("chsHealthTrack")}>
                      <div className={cx("chsHealthFill", scoreFill(entry.score))} style={{ '--pct': `${entry.score}%` } as React.CSSProperties} />
                    </div>
                  </div>

                  {/* Metrics strip */}
                  <div className={cx("chsMetrics")}>
                    <div className={cx("chsMetricCell")}>
                      <div className={cx("chsMetricLabel")}>Sentiment</div>
                      <span className={cx("chsMetricBadge", sentimentCls(entry.sentiment))}>{sentimentLabel(entry.sentiment)}</span>
                    </div>
                    <div className={cx("chsMetricCell")}>
                      <div className={cx("chsMetricLabel")}>Overdue Tasks</div>
                      <div className={cx("chsMetricValue", entry.overdueTasks > 0 ? "colorRed" : "colorGreen")}>{entry.overdueTasks}</div>
                    </div>
                    <div className={cx("chsMetricCell")}>
                      <div className={cx("chsMetricLabel")}>Unread Msgs</div>
                      <div className={cx("chsMetricValue", entry.unreadMessages > 0 ? "colorAmber" : "colorMuted2")}>{entry.unreadMessages}</div>
                    </div>
                    <div className={cx("chsMetricCell")}>
                      <div className={cx("chsMetricLabel")}>Milestone Delay</div>
                      <div className={cx("chsMetricValue", entry.milestoneDelay > 0 ? "colorAmber" : "colorGreen")}>
                        {entry.milestoneDelay > 0 ? `${entry.milestoneDelay}d` : "On track"}
                      </div>
                    </div>
                  </div>

                  {/* Footer: invoice status */}
                  <div className={cx("chsClientFooter")}>
                    <span className={cx("chsPayBadge", paymentCls(entry.invoiceStatus))}>{paymentLabel(entry.invoiceStatus)}</span>
                    <span className={cx("chsFooterLabel")}>Invoice status</span>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

    </section>
  );
}

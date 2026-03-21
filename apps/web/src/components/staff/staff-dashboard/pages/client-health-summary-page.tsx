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
      <div className={cx("staffKpiStrip", "staffKpiStripFour")}>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>Avg Health Score</div>
          <div className={cx("staffKpiValue", scoreColor(avgHealth))}>{loading ? "…" : avgHealth}</div>
          <div className={cx("staffKpiSub")}>across all clients</div>
        </div>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>Healthy</div>
          <div className={cx("staffKpiValue", "colorGreen")}>{loading ? "…" : healthy}</div>
          <div className={cx("staffKpiSub")}>score ≥ 80</div>
        </div>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>At Risk</div>
          <div className={cx("staffKpiValue", atRisk > 0 ? "colorRed" : "colorGreen")}>{loading ? "…" : atRisk}</div>
          <div className={cx("staffKpiSub")}>{atRisk > 0 ? "needs attention" : "all clear"}</div>
        </div>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>Total Clients</div>
          <div className={cx("staffKpiValue", "colorAccent")}>{loading ? "…" : entries.length}</div>
          <div className={cx("staffKpiSub")}>assigned to you</div>
        </div>
      </div>

      {/* ── Client cards ── */}
      <div className={cx("chsSection")}>

        <div className={cx("staffSectionHd")}>
          <div className={cx("staffSectionTitle")}>All Clients</div>
          <span className={cx("staffChip")}>{sorted.length} CLIENT{sorted.length !== 1 ? "S" : ""}</span>
        </div>

        {loading ? (
          <div className={cx("colorMuted2", "text12", "mt16")}>Loading health scores…</div>
        ) : sorted.length === 0 ? (
          <div className={cx("staffEmpty")}>
            <div className={cx("staffEmptyIcon")}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>
            <div className={cx("staffEmptyTitle")}>No client data yet</div>
            <p className={cx("staffEmptyNote")}>Health scores will appear once clients are assigned to you.</p>
          </div>
        ) : (
          <div className={cx("flexCol", "gap8")}>
            {sorted.map((entry) => {
              const badge = healthLabel(entry.score);
              const fillColor = entry.score >= 80 ? "var(--green)" : entry.score >= 60 ? "var(--amber)" : "var(--red)";
              return (
                <div
                  key={entry.id}
                  className={cx(
                    "staffCard",
                    "staffClientCard",
                    entry.score >= 80 ? "staffClientToneGreen" : entry.score >= 60 ? "staffClientToneAmber" : "staffClientToneRed"
                  )}
                >
                  {/* Head row: avatar + name + score + trend + badge */}
                  <div className={cx("staffListRow")}>
                    <div className={cx("staffClientAvatar")}>{entry.avatar}</div>
                    <div className={cx("flex1", "minW0")}>
                      <div className={cx("chsClientName")}>{entry.name}</div>
                      <div className={cx("chsClientContact")}>Last contact: {formatDate(entry.lastTouched)}</div>
                    </div>
                    <span className={cx("chsScore", scoreColor(entry.score))}>{entry.score}</span>
                    <span className={cx("chsTrend", trendCls(entry.trend))}>{trendGlyph(entry.trend)}</span>
                    <span className={cx("staffChip", badge.cls === "chsBadgeGreen" ? "staffChipGreen" : badge.cls === "chsBadgeAmber" ? "staffChipAmber" : "staffChipRed")}>{badge.text}</span>
                  </div>

                  {/* Health bar */}
                  <div className={cx("staffBudgetBarWrap")}>
                    <div className={cx("staffBudgetBarMeta")}>
                      <span className={cx("staffBudgetBarLabel")}>Health Score</span>
                      <span className={cx("staffBudgetBarPct", scoreColor(entry.score))}>{entry.score}/100</span>
                    </div>
                    <div className={cx("staffBar")}>
                      <div
                        className={cx("staffBarFill")}
                        style={{ "--fill-pct": entry.score, "--fill-color": fillColor } as React.CSSProperties}
                      />
                    </div>
                  </div>

                  {/* Metrics + footer */}
                  <div className={cx("staffCardMetricGrid")}>
                    <div className={cx("staffCardMetricCell")}>
                      <div className={cx("staffCardMetricLabel")}>Sentiment</div>
                      <span className={cx("staffChip", sentimentCls(entry.sentiment) === "chsSentGreen" ? "staffChipGreen" : sentimentCls(entry.sentiment) === "chsSentRed" ? "staffChipRed" : "staffChipAmber")}>{sentimentLabel(entry.sentiment)}</span>
                    </div>
                    <div className={cx("staffCardMetricCell")}>
                      <div className={cx("staffCardMetricLabel")}>Overdue Tasks</div>
                      <div className={cx("staffCardMetricValue", entry.overdueTasks > 0 ? "colorRed" : "colorGreen")}>{entry.overdueTasks}</div>
                    </div>
                    <div className={cx("staffCardMetricCell")}>
                      <div className={cx("staffCardMetricLabel")}>Unread Msgs</div>
                      <div className={cx("staffCardMetricValue", entry.unreadMessages > 0 ? "colorAmber" : "colorMuted2")}>{entry.unreadMessages}</div>
                    </div>
                    <div className={cx("staffCardMetricCell")}>
                      <div className={cx("staffCardMetricLabel")}>Milestone Delay</div>
                      <div className={cx("staffCardMetricValue", entry.milestoneDelay > 0 ? "colorAmber" : "colorGreen")}>
                        {entry.milestoneDelay > 0 ? `${entry.milestoneDelay}d` : "On track"}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className={cx("staffClientCardFoot")}>
                    <span className={cx("staffChip", paymentCls(entry.invoiceStatus) === "chsPayGreen" ? "staffChipGreen" : "staffChipRed")}>{paymentLabel(entry.invoiceStatus)}</span>
                    <span className={cx("staffRoleLabel")}>Invoice status</span>
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

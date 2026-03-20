// ════════════════════════════════════════════════════════════════════════════
// satisfaction-scores-page.tsx — Client Satisfaction Scores
// Data     : getStaffAllHealthScores → GET /staff/health-scores
//            Aggregated per-client health & satisfaction signals
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useMemo, useState, useEffect } from "react";
import { cx } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { getStaffAllHealthScores, type StaffHealthScoreEntry } from "../../../../lib/api/staff/clients";

type RiskLevel = "low" | "medium" | "high" | "critical";

function riskFromScore(score: number): RiskLevel {
  if (score >= 85) return "low";
  if (score >= 65) return "medium";
  if (score >= 45) return "high";
  return "critical";
}

function deriveDimensions(entry: StaffHealthScoreEntry) {
  const s = entry.score;
  return [
    { axis: "Overall" as const,    value: s },
    { axis: "Comms" as const,      value: Math.min(100, Math.round(s - entry.unreadMessages * 2)) },
    { axis: "Delivery" as const,   value: Math.min(100, Math.round(s - entry.milestoneDelay * 3)) },
    { axis: "Finance" as const,    value: entry.invoiceStatus === "paid" ? Math.min(100, s + 5) : entry.invoiceStatus === "overdue" ? Math.max(0, s - 15) : s },
    { axis: "Engagement" as const, value: Math.min(100, Math.round(s * (entry.trend === "up" ? 1.05 : entry.trend === "down" ? 0.9 : 1))) },
  ];
}

const riskConfig: Record<RiskLevel, { label: string; badgeClass: string }> = {
  low:      { label: "Low risk",    badgeClass: "ssRiskLow"      },
  medium:   { label: "Medium risk", badgeClass: "ssRiskMedium"   },
  high:     { label: "High risk",   badgeClass: "ssRiskHigh"     },
  critical: { label: "Critical",    badgeClass: "ssRiskCritical" },
};

function dimensionTone(value: number): string {
  if (value >= 80) return "ssMeterGood";
  if (value >= 60) return "ssMeterWarn";
  return "ssMeterBad";
}

const TONE_CLASSES = [
  { toneClass: "ssToneAccent",  surfaceClass: "ssSurfaceAccent",  selectedClass: "ssClientCardActiveAccent"  },
  { toneClass: "ssTonePurple",  surfaceClass: "ssSurfacePurple",  selectedClass: "ssClientCardActivePurple"  },
  { toneClass: "ssToneBlue",    surfaceClass: "ssSurfaceBlue",    selectedClass: "ssClientCardActiveBlue"    },
  { toneClass: "ssToneAmber",   surfaceClass: "ssSurfaceAmber",   selectedClass: "ssClientCardActiveAmber"   },
  { toneClass: "ssToneOrange",  surfaceClass: "ssSurfaceOrange",  selectedClass: "ssClientCardActiveOrange"  },
];

export function SatisfactionScoresPage({
  isActive,
  session,
}: {
  isActive: boolean;
  session: AuthSession | null;
}) {
  const [entries, setEntries]         = useState<StaffHealthScoreEntry[]>([]);
  const [loading, setLoading]         = useState(true);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [error, setError]             = useState<string | null>(null);

  useEffect(() => {
    if (!session || !isActive) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);

    async function load() {
      try {
        const result = await getStaffAllHealthScores(session!);
        if (cancelled) return;
        if (result.nextSession) saveSession(result.nextSession);
        const sorted = [...(result.data ?? [])].sort((a, b) => b.score - a.score);
        setEntries(sorted);
        setSelectedIdx(0);
      } catch (err) {
        const msg = (err as Error)?.message ?? "Failed to load";
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [session?.accessToken, isActive]);

  const selected = entries[selectedIdx];

  const avgScore = useMemo(
    () => entries.length > 0
      ? Math.round(entries.reduce((s, e) => s + e.score, 0) / entries.length)
      : 0,
    [entries]
  );

  const criticalCount = useMemo(() => entries.filter((e) => riskFromScore(e.score) === "critical").length, [entries]);
  const atRiskCount   = useMemo(() => entries.filter((e) => riskFromScore(e.score) === "high").length,    [entries]);

  const dimensions = selected ? deriveDimensions(selected) : null;

  const recommendations = useMemo(() => {
    if (!selected) return [];
    const risk = riskFromScore(selected.score);
    const recs: Array<{ action: string; priority: "urgent" | "high" | "medium" | "opportunity" }> = [];
    if (selected.score < 60)
      recs.push({ action: "Schedule a relationship call this week", priority: "urgent" });
    if (selected.unreadMessages > 3)
      recs.push({ action: "Clear unread messages — comms score impacted", priority: "high" });
    if (selected.milestoneDelay > 1)
      recs.push({ action: "Review delivery pace — milestones delayed", priority: "medium" });
    if (selected.invoiceStatus === "overdue")
      recs.push({ action: "Follow up on overdue invoice", priority: "high" });
    if (risk === "low")
      recs.push({ action: "Consider upsell conversation — satisfaction high", priority: "opportunity" });
    return recs;
  }, [selected]);

  if (loading) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-satisfaction-scores">
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-satisfaction-scores">
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateTitle")}>Something went wrong</div>
          <div className={cx("emptyStateSub")}>{error}</div>
        </div>
      </section>
    );
  }

  if (!loading && entries.length === 0) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-satisfaction-scores">
        <div className={cx("pageHeaderBar", "borderB", "ssHeaderWrap")}>
          <div className={cx("pageEyebrow", "mb8")}>Staff Dashboard / Client Intelligence</div>
          <h1 className={cx("pageTitle")}>Client Health</h1>
        </div>
        <div className={cx("ssMainGrid")}>
          <div className={cx("ssPane")}>
            <div className={cx("text13", "colorMuted2")}>No client health data available yet.</div>
          </div>
        </div>
      </section>
    );
  }

  const selTone = TONE_CLASSES[selectedIdx % TONE_CLASSES.length];

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-satisfaction-scores">
      <div className={cx("pageHeaderBar", "borderB", "ssHeaderWrap")}>
        <div className={cx("flexBetween", "mb20", "itemsStart")}>
          <div>
            <div className={cx("pageEyebrow", "mb8")}>Staff Dashboard / Client Intelligence</div>
            <h1 className={cx("pageTitle")}>Client Health</h1>
          </div>
          <div className={cx("flexRow", "gap24")}>
            {[
              { label: "Portfolio avg", value: loading ? "…" : String(avgScore),      toneClass: avgScore >= 75 ? "ssToneAccent" : avgScore >= 60 ? "ssToneAmber" : "ssToneRisk" },
              { label: "Critical",      value: loading ? "…" : String(criticalCount), toneClass: "ssToneRisk"   },
              { label: "At risk",       value: loading ? "…" : String(atRiskCount),   toneClass: "ssToneOrange" },
            ].map((s) => (
              <div key={s.label} className={cx("textRight")}>
                <div className={cx("pageEyebrow", "mb4", "trackingWide10")}>{s.label}</div>
                <div className={cx("fontDisplay", "fw800", "ssStatValue", s.toneClass)}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Client selector cards */}
        <div className={cx("flexRow", "gap10")}>
          {loading ? (
            <div className={cx("ssClientCard", "flex1", "ssClientCardIdle")}>
              <div className={cx("text11", "colorMuted2")}>Loading…</div>
            </div>
          ) : entries.map((entry, idx) => {
            const tone = TONE_CLASSES[idx % TONE_CLASSES.length];
            const risk = riskFromScore(entry.score);
            const r    = riskConfig[risk];
            const isSelected = selectedIdx === idx;
            return (
              <div
                key={entry.id}
                className={cx("ssClientCard", "flex1", isSelected ? tone.selectedClass : "ssClientCardIdle")}
                onClick={() => setSelectedIdx(idx)}
              >
                <div className={cx("flexRow", "gap8", "mb8")}>
                  <div className={cx("flexCenter", "ssScoreClientAvatar", tone.surfaceClass, tone.toneClass)}>
                    {entry.avatar}
                  </div>
                  <span className={cx("text10", "truncate", isSelected ? "colorText" : "colorMuted")}>
                    {entry.name}
                  </span>
                </div>
                <div className={cx("flexBetween", "itemsEnd")}>
                  <div className={cx("flexRow", "gap4", "itemsEnd")}>
                    <div className={cx("fontDisplay", "fw800", "ssClientScore", tone.toneClass)}>{entry.score}</div>
                    <span className={cx("text11", "mb4", entry.trend === "up" ? "colorGreen" : entry.trend === "down" ? "colorRed" : "colorMuted")} title={`Trend: ${entry.trend}`}>
                      {entry.trend === "up" ? "↑" : entry.trend === "down" ? "↓" : "→"}
                    </span>
                  </div>
                  <div className={cx("textXs", "uppercase", "ssRiskBadge", r.badgeClass)}>{r.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selected ? (
        <div className={cx("ssMainGrid")}>

          {/* Dimension breakdown */}
          <div className={cx("ssPane", "ssPaneRightBorder")}>
            <div className={cx("flexRow", "gap16", "mb24")}>
              <div>
                <div className={cx("fontDisplay", "fw800", "colorText", "mb4", "ssClientName")}>
                  {selected.name}
                </div>
                <div className={cx("flexRow", "gap8", "mb6")}>
                  <div className={cx("text10", "uppercase", "ssRiskChip", riskConfig[riskFromScore(selected.score)].badgeClass)}>
                    {riskConfig[riskFromScore(selected.score)].label}
                  </div>
                </div>
                <div className={cx("text11", selTone.toneClass)}>
                  {selected.project} · last touched {selected.lastTouched}
                </div>
              </div>
            </div>

            <div className={cx("text10", "colorMuted2", "uppercase", "mb12", "trackingWide10")}>
              Score breakdown
            </div>
            {dimensions ? dimensions.map((d) => (
              <div key={d.axis} className={cx("flexRow", "gap12", "mb8")}>
                <span className={cx("text11", "colorMuted", "noShrink", "ssAxisLabel")}>{d.axis}</span>
                <progress max={100} value={d.value} className={cx("ssDimensionMeter", dimensionTone(d.value))} />
                <span className={cx("text11", "textRight", "noShrink", "ssAxisValue", dimensionTone(d.value))}>{d.value}</span>
              </div>
            )) : null}
          </div>

          {/* Signals */}
          <div className={cx("ssPane", "ssPaneRightBorder")}>
            <div className={cx("text10", "colorMuted2", "uppercase", "mb14", "trackingWide10")}>
              Health signals
            </div>
            <div className={cx("flexCol", "gap8")}>
              {selected.signals.map((sig, i) => {
                const sigClass = sig.type === "positive" ? "ssSignalPositive" : sig.type === "negative" ? "ssSignalNegative" : "ssSignalNeutral";
                return (
                  <div key={String(i)} className={cx("flexRow", "gap10", "ssSignalRow")}>
                    <div className={cx("noShrink", "ssSignalDot", sigClass)} />
                    <span className={cx("text12", "colorMuted", "lh15")}>{sig.text}</span>
                  </div>
                );
              })}
              {selected.signals.length === 0 && (
                <div className={cx("text12", "colorMuted2")}>No signals available.</div>
              )}
            </div>
            <div className={cx("mt16", "flexRow", "gap16")}>
              {[
                { label: "Overdue tasks",   value: selected.overdueTasks },
                { label: "Unread msgs",     value: selected.unreadMessages },
                { label: "Milestone delay", value: selected.milestoneDelay },
              ].map((m) => (
                <div key={m.label}>
                  <div className={cx("text10", "colorMuted2", "mb2")}>{m.label}</div>
                  <div className={cx("text13", "fw700", m.value > 0 ? "ssToneAmber" : "ssToneAccent")}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className={cx("ssPane")}>
            <div className={cx("text10", "colorMuted2", "uppercase", "mb14", "trackingWide10")}>
              Recommended actions
            </div>
            {riskFromScore(selected.score) === "critical" ? (
              <div className={cx("mb16", "ssCriticalAlert")}>
                <div className={cx("text11", "mb4", "ssToneRisk")}>⚑ Immediate attention needed</div>
                <div className={cx("text11", "colorMuted")}>Score declining. Escalate to account manager before client initiates conversation.</div>
              </div>
            ) : null}
            {recommendations.map((a, i) => {
              const colors = { urgent: "ssToneRisk", high: "ssToneAmber", medium: "ssToneBlue", opportunity: "ssTonePurple" };
              const dots   = { urgent: "ssSignalNegative", high: "ssSignalAmber", medium: "ssSignalBlue", opportunity: "ssSignalPurple" };
              return (
                <div key={String(i)} className={cx("flexRow", "gap10", "mb8", "ssActionRow")}>
                  <div className={cx("noShrink", "ssSignalDot", dots[a.priority])} />
                  <div className={cx("flex1")}>
                    <div className={cx("text12", "colorMuted", "lh14")}>{a.action}</div>
                    <div className={cx("textXs", "uppercase", "mt3", "trackingWide6", colors[a.priority])}>{a.priority}</div>
                  </div>
                </div>
              );
            })}
            {recommendations.length === 0 ? (
              <div className={cx("text12", "colorMuted2")}>No specific actions needed at this time.</div>
            ) : null}
          </div>

        </div>
      ) : null}
    </section>
  );
}

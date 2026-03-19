// ════════════════════════════════════════════════════════════════════════════
// client-budget-page.tsx — Staff Client Budget Awareness
// Data : GET /staff/client-budgets → StaffClientBudget[]
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { getStaffClientBudgets, type StaffClientBudget } from "../../../../lib/api/staff/clients";
import type { AuthSession } from "../../../../lib/auth/session";

// ── Props ─────────────────────────────────────────────────────────────────────

type ClientBudgetPageProps = {
  isActive: boolean;
  session:  AuthSession | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

function healthLabel(score: number): string {
  if (score >= 80) return "Healthy";
  if (score >= 60) return "Moderate";
  return "At Risk";
}

function healthBadgeCls(score: number): string {
  if (score >= 80) return "cbHealthGreen";
  if (score >= 60) return "cbHealthAmber";
  return "cbHealthRed";
}

function healthScoreCls(score: number): string {
  if (score >= 80) return "colorGreen";
  if (score >= 60) return "colorAmber";
  return "colorRed";
}

function burnFillTone(pct: number): string {
  if (pct >= 100) return "progressFillRed";
  if (pct >= 80)  return "progressFillAmber";
  return "progressFillGreen";
}

function burnColorCls(pct: number): string {
  if (pct >= 100) return "colorRed";
  if (pct >= 80)  return "colorAmber";
  return "colorGreen";
}

function sentimentBadgeCls(sentiment: string): string {
  if (sentiment === "POSITIVE") return "cbHealthGreen";
  if (sentiment === "NEUTRAL")  return "cbHealthAmber";
  return "cbHealthRed";
}

function sentimentLabel(sentiment: string): string {
  if (sentiment === "POSITIVE") return "Positive";
  if (sentiment === "NEUTRAL")  return "Neutral";
  return "At Risk";
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonStat() {
  return (
    <div className={cx("cbStatCard", "opacity50")}>
      <div className={cx("cbStatCardTop")}>
        <div className={cx("skeleBlock10x50p")} />
        <div className={cx("skeleBlock22x35p")} />
      </div>
      <div className={cx("cbStatCardDivider")} />
      <div className={cx("skeleBlock9x60p")} />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className={cx("cbCard", "opacity40")}>
      <div className={cx("cbCardHead")}>
        <div className={cx("cbCardLeft")}>
          <div className={cx("cbAvatar", "bgS3")} />
          <div>
            <div className={cx("skeleBlock12x120px")} />
            <div className={cx("skeleBlock9x80px")} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page component ────────────────────────────────────────────────────────────

export function ClientBudgetPage({ isActive, session }: ClientBudgetPageProps) {
  const [clients, setClients] = useState<StaffClientBudget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session || !isActive) return;
    let cancelled = false;

    setLoading(true);
    void getStaffClientBudgets(session).then((result) => {
      if (cancelled) return;
      if (result.data) setClients(result.data);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [session, isActive]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const avgBurn      = clients.length > 0
    ? Math.round(clients.reduce((s, c) => s + c.retainerBurnPct, 0) / clients.length)
    : 0;
  const healthyCount = clients.filter((c) => c.healthScore >= 80).length;
  const atRiskCount  = clients.filter((c) => c.healthScore < 60).length;
  const avgScore     = clients.length > 0
    ? Math.round(clients.reduce((s, c) => s + c.healthScore, 0) / clients.length)
    : 0;

  if (loading) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </div>
    );
  }

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-client-budget">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Finance</div>
        <h1 className={cx("pageTitleText")}>Client Budget Awareness</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Budget health indicators for your assigned clients</p>
      </div>

      {/* ── Summary stats ────────────────────────────────────────────────── */}
      <div className={cx("cbStatGrid")}>
        {loading ? (
          [1, 2, 3, 4].map((n) => <SkeletonStat key={n} />)
        ) : (
          <>
            <div className={cx("cbStatCard")}>
              <div className={cx("cbStatCardTop")}>
                <div className={cx("cbStatLabel")}>Clients</div>
                <div className={cx("cbStatValue")}>{clients.length}</div>
              </div>
              <div className={cx("cbStatCardDivider")} />
              <div className={cx("cbStatCardBottom")}>
                <span className={cx("cbStatDot", "dotBgMuted2")} />
                <span className={cx("cbStatMeta")}>assigned clients</span>
              </div>
            </div>

            <div className={cx("cbStatCard")}>
              <div className={cx("cbStatCardTop")}>
                <div className={cx("cbStatLabel")}>Avg Burn</div>
                <div className={cx("cbStatValue", burnColorCls(avgBurn))}>{avgBurn}%</div>
              </div>
              <div className={cx("cbStatCardDivider")} />
              <div className={cx("cbStatCardBottom")}>
                <span className={cx("cbStatDot", "dotBgAccent")} />
                <span className={cx("cbStatMeta")}>retainer utilised</span>
              </div>
            </div>

            <div className={cx("cbStatCard")}>
              <div className={cx("cbStatCardTop")}>
                <div className={cx("cbStatLabel")}>Healthy Clients</div>
                <div className={cx("cbStatValue", "colorGreen")}>{healthyCount}</div>
              </div>
              <div className={cx("cbStatCardDivider")} />
              <div className={cx("cbStatCardBottom")}>
                <span className={cx("cbStatDot", "dotBgGreen")} />
                <span className={cx("cbStatMeta")}>{clients.length - healthyCount} need attention</span>
              </div>
            </div>

            <div className={cx("cbStatCard")}>
              <div className={cx("cbStatCardTop")}>
                <div className={cx("cbStatLabel")}>Avg Health Score</div>
                <div className={cx("cbStatValue", avgScore >= 70 ? "colorGreen" : avgScore >= 50 ? "colorAmber" : "colorRed")}>
                  {avgScore}
                </div>
              </div>
              <div className={cx("cbStatCardDivider")} />
              <div className={cx("cbStatCardBottom")}>
                <span className={cx("cbStatDot", "dynBgColor")} style={{ "--bg-color": atRiskCount > 0 ? "var(--red)" : "var(--muted2)" } as React.CSSProperties} />
                <span className={cx("cbStatMeta")}>{atRiskCount} at risk</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Client cards ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className={cx("flexCol", "gap12")}>
          {[1, 2, 3].map((n) => <SkeletonCard key={n} />)}
        </div>
      ) : clients.length === 0 ? (
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateIcon")}><Ic n="dollar-sign" sz={22} c="var(--muted2)" /></div>
          <div className={cx("emptyStateTitle")}>No client budget data</div>
          <div className={cx("emptyStateSub")}>Budget awareness data will appear once clients are assigned to you.</div>
        </div>
      ) : (
        <div className={cx("flexCol", "gap12")}>
          {clients.map((client) => (
            <div key={client.clientId} className={cx("cbCard")}>

              {/* ── Head ── */}
              <div className={cx("cbCardHead")}>
                <div className={cx("cbCardLeft")}>
                  <div className={cx("cbAvatar")}>{initials(client.clientName)}</div>
                  <div>
                    <div className={cx("cbClientName")}>{client.clientName}</div>
                    <div className={cx("cbClientMeta")}>{client.hoursUsed}h used this cycle</div>
                  </div>
                </div>
                <div className={cx("cbCardRight")}>
                  <div className={cx("cbScoreRow")}>
                    <span className={cx("cbScore", healthScoreCls(client.healthScore))}>{client.healthScore}</span>
                    <span className={cx("cbScoreOf")}>/100</span>
                  </div>
                  <span className={cx("cbHealthBadge", healthBadgeCls(client.healthScore))}>
                    {healthLabel(client.healthScore)}
                  </span>
                </div>
              </div>

              {/* ── Metrics strip ── */}
              <div className={cx("cbMetrics")}>
                <div className={cx("cbMetricItem")}>
                  <div className={cx("cbMetricLabel")}>Hours Used</div>
                  <div className={cx("cbMetricValue", burnColorCls(client.retainerBurnPct))}>{client.hoursUsed}h</div>
                </div>
                <div className={cx("cbMetricItem")}>
                  <div className={cx("cbMetricLabel")}>Burn %</div>
                  <div className={cx("cbMetricValue", burnColorCls(client.retainerBurnPct))}>{client.retainerBurnPct}%</div>
                </div>
                <div className={cx("cbMetricItem")}>
                  <div className={cx("cbMetricLabel")}>Sentiment</div>
                  <div className={cx("cbMetricValue")}>
                    <span className={cx("cbHealthBadge", sentimentBadgeCls(client.sentiment))}>
                      {sentimentLabel(client.sentiment)}
                    </span>
                  </div>
                </div>
                <div className={cx("cbMetricItem")}>
                  <div className={cx("cbMetricLabel")}>Health Score</div>
                  <div className={cx("cbMetricValue", healthScoreCls(client.healthScore))}>{client.healthScore}/100</div>
                </div>
              </div>

              {/* ── Progress bar ── */}
              <div className={cx("cbBars")}>
                <div className={cx("cbBarRow")}>
                  <div className={cx("cbBarMeta")}>
                    <span className={cx("cbBarLabel")}>Retainer Burn</span>
                    <span className={cx("cbBarPct", burnColorCls(client.retainerBurnPct))}>{client.retainerBurnPct}%</span>
                  </div>
                  <div className={cx("progressTrack")}>
                    <div
                      className={cx("progressFill", burnFillTone(client.retainerBurnPct))}
                      style={{ '--pct': `${Math.min(client.retainerBurnPct, 100)}%` } as React.CSSProperties}
                    />
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </section>
  );
}

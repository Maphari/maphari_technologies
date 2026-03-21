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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session || !isActive) { setLoading(false); return; }
    let cancelled = false;

    setLoading(true);
    setError(null);
    void getStaffClientBudgets(session).then((result) => {
      if (cancelled) return;
      if (result.data) setClients(result.data);
    }).catch((err) => {
      const msg = err?.message ?? "Failed to load budget";
      setError(msg);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [session?.accessToken, isActive]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const avgBurn      = clients.length > 0
    ? Math.round(clients.reduce((s, c) => s + (c.retainerBurnPct ?? 0), 0) / clients.length)
    : 0;
  const healthyCount = clients.filter((c) => (c.healthScore ?? 0) >= 80).length;
  const atRiskCount  = clients.filter((c) => (c.healthScore ?? 0) < 60).length;
  const avgScore     = clients.length > 0
    ? Math.round(clients.reduce((s, c) => s + (c.healthScore ?? 0), 0) / clients.length)
    : 0;

  if (loading) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-client-budget">
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </section>
    );
  }

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-client-budget">
      {error && (
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateTitle")}>Something went wrong</div>
          <div className={cx("emptyStateSub")}>{error}</div>
        </div>
      )}
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Finance</div>
        <h1 className={cx("pageTitleText")}>Client Budget Awareness</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Budget health indicators for your assigned clients</p>
      </div>

      {/* ── Summary stats ────────────────────────────────────────────────── */}
      <div className={cx("staffKpiStrip", "staffKpiStripFour")}>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>Clients</div>
          <div className={cx("staffKpiValue")}>{clients.length}</div>
          <div className={cx("staffKpiSub")}>assigned clients</div>
        </div>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>Avg Burn</div>
          <div className={cx("staffKpiValue", burnColorCls(avgBurn))}>{avgBurn}%</div>
          <div className={cx("staffKpiSub")}>retainer utilised</div>
        </div>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>Healthy Clients</div>
          <div className={cx("staffKpiValue", "colorGreen")}>{healthyCount}</div>
          <div className={cx("staffKpiSub")}>{clients.length - healthyCount} need attention</div>
        </div>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>Avg Health Score</div>
          <div className={cx("staffKpiValue", avgScore >= 70 ? "colorGreen" : avgScore >= 50 ? "colorAmber" : "colorRed")}>
            {avgScore}
          </div>
          <div className={cx("staffKpiSub")}>{atRiskCount} at risk</div>
        </div>
      </div>

      {/* ── Client cards ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className={cx("flexCol", "gap10")}>
          {[1, 2, 3].map((n) => <SkeletonCard key={n} />)}
        </div>
      ) : clients.length === 0 ? (
        <div className={cx("staffEmpty")}>
          <div className={cx("staffEmptyIcon")}><Ic n="dollar-sign" sz={22} c="var(--muted2)" /></div>
          <div className={cx("staffEmptyTitle")}>No client budget data</div>
          <div className={cx("staffEmptyNote")}>Budget awareness data will appear once clients are assigned to you.</div>
        </div>
      ) : (
        <div className={cx("flexCol", "gap10")}>
          {clients.map((client) => {
            const burn = client.retainerBurnPct ?? 0;
            const burnFill = burn >= 85 ? "var(--red)" : burn >= 65 ? "var(--amber)" : "var(--green)";
            const healthCls = client.healthScore >= 80 ? "staffChipGreen" : client.healthScore >= 60 ? "staffChipAmber" : "staffChipRed";
            const toneCls = client.healthScore >= 80 ? "staffClientToneGreen" : client.healthScore >= 60 ? "staffClientToneAmber" : "staffClientToneRed";
            return (
              <div key={client.clientId} className={cx("staffCard", "staffClientCard", toneCls)}>

                {/* Head */}
                <div className={cx("staffListRow")}>
                  <div className={cx("staffClientAvatar")}>{initials(client.clientName)}</div>
                  <div className={cx("flex1", "minW0")}>
                    <div className={cx("cbClientName")}>{client.clientName}</div>
                    <div className={cx("cbClientMeta")}>{client.hoursUsed ?? 0}h used this cycle</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className={cx("cbScore", healthScoreCls(client.healthScore))}>{client.healthScore}</span>
                    <span className={cx("cbScoreOf")}>/100</span>
                    <span className={cx("staffChip", healthCls)}>{healthLabel(client.healthScore)}</span>
                  </div>
                </div>

                {/* Metrics strip */}
                <div className={cx("staffCardMetricGrid")}>
                  <div className={cx("staffCardMetricCell")}>
                    <div className={cx("staffCardMetricLabel")}>Hours Used</div>
                    <div className={cx("staffCardMetricValue", burnColorCls(burn))}>{client.hoursUsed ?? 0}h</div>
                  </div>
                  <div className={cx("staffCardMetricCell")}>
                    <div className={cx("staffCardMetricLabel")}>Burn %</div>
                    <div className={cx("staffCardMetricValue", burnColorCls(burn))}>{burn}%</div>
                  </div>
                  <div className={cx("staffCardMetricCell")}>
                    <div className={cx("staffCardMetricLabel")}>Sentiment</div>
                    <span className={cx("staffChip", sentimentBadgeCls(client.sentiment) === "cbHealthGreen" ? "staffChipGreen" : sentimentBadgeCls(client.sentiment) === "cbHealthAmber" ? "staffChipAmber" : "staffChipRed")}>
                      {sentimentLabel(client.sentiment)}
                    </span>
                  </div>
                  <div className={cx("staffCardMetricCell")}>
                    <div className={cx("staffCardMetricLabel")}>Health Score</div>
                    <div className={cx("staffCardMetricValue", healthScoreCls(client.healthScore))}>{client.healthScore}/100</div>
                  </div>
                </div>

                {/* Burn progress bar */}
                <div className={cx("staffBudgetBarWrap")}>
                  <div className={cx("staffBudgetBarMeta")}>
                    <span className={cx("staffBudgetBarLabel")}>Retainer Burn</span>
                    <span className={cx("staffBudgetBarPct", burnColorCls(burn))}>{burn}%</span>
                  </div>
                  <div className={cx("staffBar")}>
                    <div
                      className={cx("staffBarFill")}
                      style={{ "--fill-pct": Math.min(100, burn), "--fill-color": burnFill } as React.CSSProperties}
                    />
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

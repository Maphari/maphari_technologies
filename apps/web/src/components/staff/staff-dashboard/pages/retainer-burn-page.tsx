// ════════════════════════════════════════════════════════════════════════════
// retainer-burn-page.tsx — Staff Retainer Burn Dashboard
// Data : GET /staff/retainer-burn → StaffRetainerBurnEntry[]
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import {
  getStaffRetainerBurn,
  type StaffRetainerBurnEntry,
  type StaffRetainerBurnMonth,
} from "../../../../lib/api/staff/clients";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";

// ── Props ─────────────────────────────────────────────────────────────────────

type RetainerBurnPageProps = {
  isActive: boolean;
  session:  AuthSession | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

type BurnStatus = "healthy" | "moderate" | "critical" | "exceeded";

function burnStatus(pct: number): BurnStatus {
  if (pct > 100) return "exceeded";
  if (pct >= 85) return "critical";
  if (pct >= 70) return "moderate";
  return "healthy";
}

function statusLabel(s: BurnStatus): string {
  if (s === "exceeded") return "Exceeded";
  if (s === "critical") return "Critical";
  if (s === "moderate") return "Moderate";
  return "Healthy";
}

function statusBadgeCls(s: BurnStatus): string {
  if (s === "exceeded") return "rbStatusExceeded";
  if (s === "critical") return "rbStatusCritical";
  if (s === "moderate") return "rbStatusModerate";
  return "rbStatusHealthy";
}

function donutColor(s: BurnStatus): string {
  if (s === "exceeded") return "var(--red)";
  if (s === "critical") return "var(--red)";
  if (s === "moderate") return "var(--amber)";
  return "var(--green)";
}

function burnFillCls(pct: number): string {
  if (pct >= 100) return "progressFillRed";
  if (pct >= 85)  return "progressFillRed";
  if (pct >= 70)  return "progressFillAmber";
  return "progressFillGreen";
}

function initials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

// ── SVG: Donut ────────────────────────────────────────────────────────────────

function DonutChart({ pct, status }: { pct: number; status: BurnStatus }) {
  const r           = 19;
  const circ        = 2 * Math.PI * r;
  const fill        = Math.min(pct / 100, 1) * circ;
  const color       = donutColor(status);
  return (
    <svg width="52" height="52" viewBox="0 0 48 48" className={cx("noShrink")}>
      <circle cx="24" cy="24" r={r} fill="none" stroke="var(--s3)" strokeWidth="6" />
      <circle
        cx="24" cy="24" r={r}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeDasharray={`${fill} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 24 24)"
      />
    </svg>
  );
}

// ── SVG: Sparkline ────────────────────────────────────────────────────────────

function Sparkline({ history, status }: { history: StaffRetainerBurnMonth[]; status: BurnStatus }) {
  if (history.length < 2) {
    return <svg width="80" height="24" viewBox="0 0 80 24" />;
  }
  const color = donutColor(status);
  const maxV  = Math.max(...history.map((h) => h.burnPct), 1);
  const W = 80, H = 24, pad = 2;
  const pts = history.map((h, i) => {
    const x = pad + (i / (history.length - 1)) * (W - pad * 2);
    const y = H - pad - ((h.burnPct / maxV) * (H - pad * 2));
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className={cx("overflowVisible")}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonStat() {
  return (
    <div className={cx("rbStatCard", "opacity50")}>
      <div className={cx("rbStatCardTop")}>
        <div className={cx("skeleBlock10x50p")} />
        <div className={cx("skeleBlock22x35p")} />
      </div>
      <div className={cx("rbStatCardDivider")} />
      <div className={cx("skeleBlock9x60p")} />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className={cx("rbCard", "opacity40")}>
      <div className={cx("skeleBlock14x40p")} />
      <div className={cx("skeleBlock9x25p")} />
    </div>
  );
}

// ── Page component ────────────────────────────────────────────────────────────

export function RetainerBurnPage({ isActive, session }: RetainerBurnPageProps) {
  const [clients, setClients]   = useState<StaffRetainerBurnEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    if (!session || !isActive) { setLoading(false); return; }
    let cancelled = false;

    setLoading(true);
    setError(null);
    void getStaffRetainerBurn(session).then((result) => {
      if (cancelled) return;
      if (result.nextSession) saveSession(result.nextSession);
      if (result.data) {
        setClients(result.data);
        if (result.data.length > 0) setActiveId(result.data[0].clientId);
      }
    }).catch((err) => {
      const msg = (err as Error)?.message ?? "Failed to load";
      setError(msg);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [session?.accessToken, isActive]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const avgBurn     = clients.length > 0
    ? Math.round(clients.reduce((s, c) => s + c.retainerBurnPct, 0) / clients.length)
    : 0;
  const atRisk      = clients.filter((c) => c.retainerBurnPct >= 85).length;
  const exceeded    = clients.filter((c) => c.retainerBurnPct > 100).length;
  const activeClient = clients.find((c) => c.clientId === activeId) ?? clients[0] ?? null;

  if (loading) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-retainer-burn">
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
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-retainer-burn">
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateTitle")}>Something went wrong</div>
          <div className={cx("emptyStateSub")}>{error}</div>
        </div>
      </section>
    );
  }

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-retainer-burn">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Finance</div>
        <h1 className={cx("pageTitleText")}>Retainer Burn</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Retainer utilisation across all clients</p>
      </div>

      {/* ── Summary stats ────────────────────────────────────────────────── */}
      <div className={cx("rbStatGrid")}>
        <div className={cx("rbStatCard")}>
          <div className={cx("rbStatCardTop")}>
            <div className={cx("rbStatLabel")}>Clients</div>
            <div className={cx("rbStatValue")}>{clients.length}</div>
          </div>
          <div className={cx("rbStatCardDivider")} />
          <div className={cx("rbStatCardBottom")}>
            <span className={cx("rbStatDot", "dotBgMuted2")} />
            <span className={cx("rbStatMeta")}>retainer clients</span>
          </div>
        </div>

        <div className={cx("rbStatCard")}>
          <div className={cx("rbStatCardTop")}>
            <div className={cx("rbStatLabel")}>Avg Burn</div>
            <div className={cx("rbStatValue", burnFillCls(avgBurn).replace("progressFill", "color"))}>{avgBurn}%</div>
          </div>
          <div className={cx("rbStatCardDivider")} />
          <div className={cx("rbStatCardBottom")}>
            <span className={cx("rbStatDot", "dotBgAccent")} />
            <span className={cx("rbStatMeta")}>portfolio average</span>
          </div>
        </div>

        <div className={cx("rbStatCard")}>
          <div className={cx("rbStatCardTop")}>
            <div className={cx("rbStatLabel")}>At Risk</div>
            <div className={cx("rbStatValue", atRisk > 0 ? "colorAmber" : "colorGreen")}>{atRisk}</div>
          </div>
          <div className={cx("rbStatCardDivider")} />
          <div className={cx("rbStatCardBottom")}>
            <span className={cx("rbStatDot", "dynBgColor")} style={{ "--bg-color": atRisk > 0 ? "var(--amber)" : "var(--green)" } as React.CSSProperties} />
            <span className={cx("rbStatMeta")}>≥ 85% burn</span>
          </div>
        </div>

        <div className={cx("rbStatCard")}>
          <div className={cx("rbStatCardTop")}>
            <div className={cx("rbStatLabel")}>Exceeded</div>
            <div className={cx("rbStatValue", exceeded > 0 ? "colorRed" : "colorGreen")}>{exceeded}</div>
          </div>
          <div className={cx("rbStatCardDivider")} />
          <div className={cx("rbStatCardBottom")}>
            <span className={cx("rbStatDot", "dynBgColor")} style={{ "--bg-color": exceeded > 0 ? "var(--red)" : "var(--green)" } as React.CSSProperties} />
            <span className={cx("rbStatMeta")}>&gt; 100% burn</span>
          </div>
        </div>
      </div>

      {/* ── Client tabs + detail ──────────────────────────────────────────── */}
      {clients.length === 0 ? (
        <div className={cx("emptyState")}>
          <div className={cx("emptyStateIcon")}><Ic n="activity" sz={22} c="var(--muted2)" /></div>
          <div className={cx("emptyStateTitle")}>No retainer data</div>
          <div className={cx("emptyStateSub")}>Retainer burn data will appear once clients are on retainer.</div>
        </div>
      ) : (
        <div className={cx("rbLayout")}>

          {/* Client tab list */}
          <div className={cx("rbClientList")}>
            {clients.map((c) => {
              const st = burnStatus(c.retainerBurnPct);
              return (
                <div
                  key={c.clientId}
                  className={cx("rbClientTab", activeId === c.clientId && "rbClientTabActive")}
                  onClick={() => setActiveId(c.clientId)}
                >
                  <div className={cx("rbTabAvatar")}>{initials(c.clientName)}</div>
                  <div className={cx("rbTabInfo")}>
                    <div className={cx("rbTabName")}>{c.clientName}</div>
                    <div className={cx("rbTabBurn", st === "healthy" ? "colorGreen" : st === "moderate" ? "colorAmber" : "colorRed")}>
                      {c.retainerBurnPct}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail panel */}
          {activeClient && (() => {
            const st = burnStatus(activeClient.retainerBurnPct);
            return (
              <div className={cx("rbDetailPanel")}>
                {/* Head */}
                <div className={cx("rbDetailHead")}>
                  <div>
                    <div className={cx("rbDetailName")}>{activeClient.clientName}</div>
                    <div className={cx("rbDetailHours")}>{activeClient.hoursUsed}h logged this cycle</div>
                  </div>
                  <span className={cx("rbStatusBadge", statusBadgeCls(st))}>{statusLabel(st)}</span>
                </div>

                {/* Donut + burn % */}
                <div className={cx("rbDonutRow")}>
                  <DonutChart pct={activeClient.retainerBurnPct} status={st} />
                  <div className={cx("rbDonutMeta")}>
                    <div className={cx("rbBurnPct", st === "healthy" ? "colorGreen" : st === "moderate" ? "colorAmber" : "colorRed")}>
                      {activeClient.retainerBurnPct}%
                    </div>
                    <div className={cx("rbBurnLabel")}>retainer used</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className={cx("rbBarSection")}>
                  <div className={cx("rbBarMeta")}>
                    <span className={cx("rbBarLabel")}>Burn Rate</span>
                    <span className={cx("rbBarPct", st === "healthy" ? "colorGreen" : st === "moderate" ? "colorAmber" : "colorRed")}>
                      {activeClient.retainerBurnPct}%
                    </span>
                  </div>
                  <div className={cx("progressTrack")}>
                    <div
                      className={cx("progressFill", burnFillCls(activeClient.retainerBurnPct))}
                      style={{ '--pct': `${Math.min(activeClient.retainerBurnPct, 100)}%` } as React.CSSProperties}
                    />
                  </div>
                </div>

                {/* Sparkline */}
                {activeClient.burnHistory.length > 0 && (
                  <div className={cx("rbSparkSection")}>
                    <div className={cx("rbSparkLabel")}>Burn Trend ({activeClient.burnHistory.length} months)</div>
                    <div className={cx("rbSparkWrap")}>
                      <Sparkline history={activeClient.burnHistory} status={st} />
                    </div>
                    <div className={cx("rbSparkMonths")}>
                      {activeClient.burnHistory.map((h) => (
                        <div key={h.month} className={cx("rbSparkMonth")}>
                          <div className={cx("rbSparkMonthLabel")}>{h.month.slice(0, 3)}</div>
                          <div className={cx("rbSparkMonthVal")}>{h.burnPct}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </section>
  );
}

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

function burnChipCls(pct: number): string {
  if (pct > 90) return "staffChipRed";
  if (pct > 70) return "staffChipAmber";
  return "staffChipGreen";
}

function burnMetricCls(pct: number): string {
  if (pct >= 85) return "colorRed";
  if (pct >= 70) return "colorAmber";
  return "colorGreen";
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

// ── SVG: Mini donut (20px, inline, no extra CSS) ─────────────────────────────

function MiniDonut({ pct, color }: { pct: number; color: string }) {
  const r    = 7;
  const circ = 2 * Math.PI * r;
  const fill = Math.min(pct / 100, 1) * circ;
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
      <circle cx="10" cy="10" r={r} fill="none" stroke="var(--s3)" strokeWidth="3" />
      <circle
        cx="10" cy="10" r={r}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeDasharray={`${fill} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 10 10)"
      />
    </svg>
  );
}

// ── SVG: Full Donut (detail panel) ────────────────────────────────────────────

function DonutChart({ pct, status }: { pct: number; status: BurnStatus }) {
  const r     = 19;
  const circ  = 2 * Math.PI * r;
  const fill  = Math.min(pct / 100, 1) * circ;
  const color = donutColor(status);
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
  const avgBurn    = clients.length > 0
    ? Math.round(clients.reduce((s, c) => s + (c.retainerBurnPct ?? 0), 0) / clients.length)
    : 0;
  const atRisk     = clients.filter((c) => (c.retainerBurnPct ?? 0) >= 85).length;
  const exceeded   = clients.filter((c) => c.retainerBurnPct > 100).length;
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
        <div className={cx("staffEmpty")}>
          <div className={cx("staffEmptyTitle")}>Something went wrong</div>
          <div className={cx("staffEmptyNote")}>{error}</div>
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

      {/* ── KPI strip ────────────────────────────────────────────────────── */}
      <div className={cx("staffKpiStrip", "mb20")}>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>Clients</div>
          <div className={cx("staffKpiValue")}>{clients.length}</div>
          <div className={cx("staffKpiSub")}>retainer clients</div>
        </div>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>Avg Burn</div>
          <div className={cx("staffKpiValue", burnMetricCls(avgBurn))}>{avgBurn}%</div>
          <div className={cx("staffKpiSub")}>portfolio average</div>
        </div>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>At Risk</div>
          <div className={cx("staffKpiValue", atRisk > 0 ? "colorAmber" : "colorGreen")}>{atRisk}</div>
          <div className={cx("staffKpiSub")}>&ge; 85% burn</div>
        </div>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>Exceeded</div>
          <div className={cx("staffKpiValue", exceeded > 0 ? "colorRed" : "colorGreen")}>{exceeded}</div>
          <div className={cx("staffKpiSub")}>&gt; 100% burn</div>
        </div>
      </div>

      {/* ── Client selector + detail ──────────────────────────────────────── */}
      {clients.length === 0 ? (
        <div className={cx("staffEmpty")}>
          <div className={cx("staffEmptyIcon")}><Ic n="activity" sz={22} c="var(--muted2)" /></div>
          <div className={cx("staffEmptyTitle")}>No retainer data</div>
          <div className={cx("staffEmptyNote")}>Retainer burn data will appear once clients are on retainer.</div>
        </div>
      ) : (
        <div className={cx("staffSplitShell")}>

          {/* Left: compact client rows with mini donut */}
          <div className={cx("rbClientPanel")}>
            {clients.map((c) => {
              const st    = burnStatus(c.retainerBurnPct);
              const color = donutColor(st);
              const isAct = activeId === c.clientId;
              return (
                <div
                  key={c.clientId}
                  className={cx("staffListRow", isAct && "staffClientToneAccent")}
                  onClick={() => setActiveId(c.clientId)}
                  style={{ cursor: "pointer" }}
                >
                  <MiniDonut pct={c.retainerBurnPct} color={color} />
                  <div className={cx("rbClientInfo")}>
                    <div className={cx("rbClientName")}>{c.clientName}</div>
                    <div className={cx("rbClientBurnPct", burnMetricCls(c.retainerBurnPct))}>
                      {c.retainerBurnPct}%
                    </div>
                  </div>
                  <span className={cx("staffChip", burnChipCls(c.retainerBurnPct))}>
                    {statusLabel(st)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Right: detail panel */}
          {activeClient && (() => {
            const st = burnStatus(activeClient.retainerBurnPct);
            return (
              <div className={cx("staffCard", "rbDetailPanel")}>
                {/* Head */}
                <div className={cx("rbDetailHead")}>
                  <div>
                    <div className={cx("rbDetailName")}>{activeClient.clientName}</div>
                    <div className={cx("rbDetailHours")}>{activeClient.hoursUsed}h logged this cycle</div>
                  </div>
                  <span className={cx("staffChip", burnChipCls(activeClient.retainerBurnPct))}>
                    {statusLabel(st)}
                  </span>
                </div>

                {/* Donut + burn % metric */}
                <div className={cx("rbDonutRow")}>
                  <DonutChart pct={activeClient.retainerBurnPct} status={st} />
                  <div className={cx("staffMetricBlock", burnMetricCls(activeClient.retainerBurnPct), "rbDonutMeta")}>
                    <div className={cx("rbBurnPct")}>{activeClient.retainerBurnPct}%</div>
                    <div className={cx("rbBurnLabel")}>retainer used</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className={cx("rbBarSection")}>
                  <div className={cx("rbBarMeta")}>
                    <span className={cx("rbBarLabel")}>Burn Rate</span>
                    <span className={cx("rbBarPct", burnMetricCls(activeClient.retainerBurnPct))}>
                      {activeClient.retainerBurnPct}%
                    </span>
                  </div>
                  <div className={cx("staffBar")}>
                    <div
                      className={cx("staffBarFill", burnMetricCls(activeClient.retainerBurnPct) === "colorRed" ? "rbFillRed" : burnMetricCls(activeClient.retainerBurnPct) === "colorAmber" ? "rbFillAmber" : "rbFillGreen")}
                      style={{ "--fill-pct": `${Math.min(activeClient.retainerBurnPct, 100)}%` } as React.CSSProperties}
                    />
                  </div>
                </div>

                {/* Monthly history rows */}
                {activeClient.burnHistory.length > 0 && (
                  <div className={cx("rbSparkSection")}>
                    <div className={cx("staffSectionHd")}>
                      <span className={cx("staffSectionTitle")}>Burn History</span>
                      <span className={cx("staffChip")}>{activeClient.burnHistory.length} months</span>
                    </div>
                    {activeClient.burnHistory.map((h, i) => (
                      <div key={`${h.month}-${i}`} className={cx("staffListRow")}>
                        <span className={cx("rbHistoryMonth")}>{h.month}</span>
                        <div className={cx("staffBar", "rbHistoryBar")}>
                          <div
                            className={cx("staffBarFill", h.burnPct > 90 ? "rbFillRed" : h.burnPct > 70 ? "rbFillAmber" : "rbFillGreen")}
                            style={{ "--fill-pct": `${Math.min(h.burnPct, 100)}%` } as React.CSSProperties}
                          />
                        </div>
                        <span className={cx("staffChip", burnChipCls(h.burnPct))}>{h.burnPct}%</span>
                      </div>
                    ))}
                    <div className={cx("rbSparkWrap")}>
                      <Sparkline history={activeClient.burnHistory} status={st} />
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

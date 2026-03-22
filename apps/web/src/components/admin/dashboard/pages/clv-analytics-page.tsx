// ════════════════════════════════════════════════════════════════════════════
// clv-analytics-page.tsx — Client Lifetime Value & Churn Risk Analytics
// Data   : GET /admin/analytics/clv → billing service
// Shows  : KPI strip (ARR / avg CLV / high-risk count) + risk-ranked table
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useMemo, useState } from "react";
import { cx, styles } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { loadAdminClientCLVWithRefresh, type ClientCLV } from "../../../../lib/api/admin/analytics";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatZAR(n: number): string {
  if (n === 0) return "R0";
  if (n >= 1_000_000) return `R${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `R${(n / 1_000).toFixed(0)}k`;
  return `R${n}`;
}

function churnRiskLabel(risk: number): string {
  if (risk >= 0.6) return "High";
  if (risk >= 0.3) return "Medium";
  return "Low";
}

function churnBadgeClass(risk: number): string {
  if (risk >= 0.6) return styles.badgeRed;
  if (risk >= 0.3) return styles.badgeAmber;
  return styles.badgeGreen;
}

function churnFillClass(risk: number): string {
  if (risk >= 0.6) return styles.progressFillRed;
  if (risk >= 0.3) return styles.progressFillAmber;
  return styles.progressFillGreen;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  session: AuthSession | null;
  onNotify: (tone: "success" | "error" | "warning" | "info", msg: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CLVAnalyticsPage({ session, onNotify }: Props) {
  const { snapshot } = useAdminWorkspaceContext();
  const [rows, setRows] = useState<ClientCLV[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Client name lookup from workspace snapshot
  const clientNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of snapshot.clients ?? []) {
      map.set(c.id, c.name);
    }
    return map;
  }, [snapshot.clients]);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    void (async () => {
      try {
        const r = await loadAdminClientCLVWithRefresh(session);
        if (cancelled) return;
        if (r.nextSession) saveSession(r.nextSession);
        if (r.error || !r.data) {
          setLoadError(r.error?.message ?? "Failed to load CLV analytics. Please try again.");
          onNotify("error", r.error?.message ?? "Failed to load CLV analytics.");
          return;
        }
        setLoadError(null);
        setRows(r.data);
      } catch (err: unknown) {
        if (!cancelled) setLoadError((err as Error)?.message ?? "Failed to load CLV analytics.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [session, onNotify]);

  // ── KPI derivations ───────────────────────────────────────────────────────

  const totalARR = useMemo(() => rows.reduce((s, r) => s + r.clv, 0), [rows]);
  const avgCLV = useMemo(() => (rows.length > 0 ? Math.round(totalARR / rows.length) : 0), [rows, totalARR]);
  const highRiskCount = useMemo(() => rows.filter((r) => r.churnRisk >= 0.6).length, [rows]);

  // ── Refresh handler ───────────────────────────────────────────────────────

  function handleRefresh(): void {
    if (!session) return;
    setLoading(true);
    void loadAdminClientCLVWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error || !r.data) {
        setLoadError(r.error?.message ?? "Failed to load CLV analytics.");
        onNotify("error", r.error?.message ?? "Failed to load CLV analytics.");
        return;
      }
      setLoadError(null);
      setRows(r.data);
    }).catch((err: unknown) => {
      setLoadError((err as Error)?.message ?? "Failed to load CLV analytics.");
    }).finally(() => {
      setLoading(false);
    });
  }

  // ── Loading state ─────────────────────────────────────────────────────────

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

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={styles.pageBody}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / FINANCE</div>
          <h1 className={styles.pageTitle}>Client Lifetime Value &amp; Churn Risk</h1>
          <div className={styles.pageSub}>Projected CLV and churn risk score per client</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnGhost")} onClick={handleRefresh}>
            Refresh
          </button>
        </div>
      </div>

      {/* ── Error banner ───────────────────────────────────────────────── */}
      {loadError ? (
        <div className={cx("alertStrip", "alertError")}>
          <span>{loadError}</span>
        </div>
      ) : null}

      {/* ── KPI strip ──────────────────────────────────────────────────── */}
      <div className={styles.clvKpiGrid}>
        <div className={`${styles.kpiCard} ${styles.kpiTeal}`}>
          <p>Total Projected ARR</p>
          <strong>{formatZAR(totalARR)}</strong>
          <span className={styles.kpiSub}>across {rows.length} client{rows.length !== 1 ? "s" : ""}</span>
        </div>
        <div className={`${styles.kpiCard} ${styles.kpiSlate}`}>
          <p>Avg CLV per Client</p>
          <strong>{formatZAR(avgCLV)}</strong>
          <span className={styles.kpiSub}>annual projected value</span>
        </div>
        <div className={`${styles.kpiCard} ${highRiskCount > 0 ? styles.kpiRed : styles.kpiTeal}`}>
          <p>High Churn Risk</p>
          <strong>{highRiskCount}</strong>
          <span className={styles.kpiSub}>{highRiskCount > 0 ? "clients above 60% risk" : "no high-risk clients"}</span>
        </div>
      </div>

      {/* ── Client table ───────────────────────────────────────────────── */}
      {rows.length === 0 ? (
        <div className={cx("card")}>
          <div className={cx("emptyState")}>
            <div className={cx("emptyIcon")}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 9.5a2.5 2.5 0 0 1 2.5-2.5h11A2.5 2.5 0 0 1 20 9.5v7A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z" />
                <path d="M8 7V5.8A1.8 1.8 0 0 1 9.8 4h4.4A1.8 1.8 0 0 1 16 5.8V7" />
                <path d="M4 11h16" />
              </svg>
            </div>
            <div className={cx("emptyTitle")}>No invoice data available</div>
            <div className={cx("emptySub")}>CLV analytics will appear once invoices have been recorded.</div>
          </div>
        </div>
      ) : (
        <div className={cx("card")}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Avg Monthly</th>
                  <th>CLV (Annual)</th>
                  <th>Engagement</th>
                  <th>Churn Risk</th>
                  <th>Last Activity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const clientName = clientNameMap.get(row.clientId) ?? row.clientId.slice(0, 8) + "…";
                  const riskPct = Math.round(row.churnRisk * 100);
                  return (
                    <tr key={row.clientId}>
                      {/* Client name */}
                      <td>
                        <span className={styles.tableName}>{clientName}</span>
                      </td>

                      {/* Avg monthly */}
                      <td>
                        <span className={styles.tableMonospace}>{formatZAR(row.avgMonthly)}</span>
                      </td>

                      {/* CLV */}
                      <td>
                        <span className={cx("colorAccent")}>{formatZAR(row.clv)}</span>
                      </td>

                      {/* Engagement months */}
                      <td>
                        <span className={styles.tableMuted}>{row.engagementMonths}mo</span>
                      </td>

                      {/* Churn risk progress bar */}
                      <td>
                        <div className={styles.progressWrap}>
                          <div
                            className={styles.progressBar}
                            style={{ "--pct": `${riskPct}%` } as React.CSSProperties}
                          >
                            <div
                              className={`${styles.progressFill} ${styles.progressFillDynamic} ${churnFillClass(row.churnRisk)}`}
                            />
                          </div>
                          <span className={styles.progressPct}>{riskPct}%</span>
                        </div>
                      </td>

                      {/* Days since last activity */}
                      <td>
                        <span className={row.daysSinceLastActivity > 60 ? cx("colorAmber") : styles.tableMuted}>
                          {row.daysSinceLastActivity}d ago
                        </span>
                      </td>

                      {/* Status badge */}
                      <td>
                        <span className={`${styles.badge} ${churnBadgeClass(row.churnRisk)}`}>
                          {churnRiskLabel(row.churnRisk)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer: missed invoices summary */}
          <div className={styles.clvTableFooter}>
            <span className={styles.tableMuted}>
              {rows.reduce((s, r) => s + r.missedInvoices, 0)} overdue invoice{rows.reduce((s, r) => s + r.missedInvoices, 0) !== 1 ? "s" : ""} across all clients
            </span>
            <span className={styles.tableMuted}>
              Sorted by churn risk (highest first)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

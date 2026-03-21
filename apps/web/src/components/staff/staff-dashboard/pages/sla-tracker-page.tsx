// ════════════════════════════════════════════════════════════════════════════
// sla-tracker-page.tsx — Staff SLA Tracker (live API data)
// Data : getStaffClients        → GET /staff/clients
//        getStaffClientSla      → GET /staff/clients/:id/sla
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState, useCallback } from "react";
import { cx } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  getStaffClients,
  getStaffClientSla,
  type StaffClient,
  type StaffSlaRecord,
} from "../../../../lib/api/staff/clients";

// ── Merged row type ──────────────────────────────────────────────────────────

type SlaStatus = "met" | "at risk" | "breached";

interface SlaRow {
  id: string;
  client: string;
  tier: string;
  metric: string;
  targetHours: number;
  actualHours: number | null;
  status: SlaStatus;
  periodStart: string;
  periodEnd: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function mapStatus(raw: string): SlaStatus {
  const lower = raw.toLowerCase();
  if (lower === "met" || lower === "compliant") return "met";
  if (lower === "at_risk" || lower === "at risk" || lower === "warning") return "at risk";
  return "breached";
}

function fmtHours(h: number): string {
  if (h < 1) return `${Math.round(h * 60)}m`;
  const whole = Math.floor(h);
  const mins = Math.round((h - whole) * 60);
  return mins > 0 ? `${whole}h ${mins}m` : `${whole}h`;
}

function varianceStr(target: number, actual: number | null): string {
  if (actual === null) return "—";
  const diff = target - actual;
  if (Math.abs(diff) < 0.01) return "0";
  return diff > 0 ? `+${fmtHours(diff)}` : `-${fmtHours(Math.abs(diff))}`;
}

function dotClass(s: SlaStatus): string {
  if (s === "met") return "staffDotGreen";
  if (s === "at risk") return "staffDotAmber";
  return "staffDotRed";
}

function chipClass(s: SlaStatus): string {
  if (s === "met") return "staffChipGreen";
  if (s === "at risk") return "staffChipAmber";
  return "staffChipRed";
}

function complianceColorCls(pct: number): string {
  if (pct >= 80) return "colorGreen";
  if (pct >= 50) return "colorAmber";
  return "colorRed";
}

function avgResponseTime(rows: SlaRow[]): string {
  const withActual = rows.filter((r) => r.actualHours !== null);
  if (withActual.length === 0) return "—";
  const avg = withActual.reduce((s, r) => s + (r.actualHours ?? 0), 0) / withActual.length;
  return fmtHours(avg);
}

// ── Component ────────────────────────────────────────────────────────────────

export function SlaTrackerPage({
  isActive,
  session,
}: {
  isActive: boolean;
  session: AuthSession | null;
}) {
  const [rows, setRows] = useState<SlaRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (sess: AuthSession) => {
    setLoading(true);

    try {
      // 1. Fetch all clients
      const clientsResult = await getStaffClients(sess);
      if (clientsResult.nextSession) saveSession(clientsResult.nextSession);
      const clients: StaffClient[] = clientsResult.data ?? [];

      if (clients.length === 0) {
        setRows([]);
        return;
      }

      // 2. Fetch SLA records for each client in parallel
      const slaResults = await Promise.all(
        clients.map((c) =>
          getStaffClientSla(clientsResult.nextSession ?? sess, c.id).then((r) => ({
            client: c,
            records: r.data ?? [],
            nextSession: r.nextSession,
          }))
        )
      );

      // Save latest session from any response
      const lastSession = slaResults.reduce<AuthSession | null>(
        (acc, r) => r.nextSession ?? acc,
        null,
      );
      if (lastSession) saveSession(lastSession);

      // 3. Merge into display rows
      const merged: SlaRow[] = slaResults.flatMap(({ client, records }) =>
        records.map((rec: StaffSlaRecord) => ({
          id: rec.id,
          client: client.name,
          tier: client.tier ?? "—",
          metric: rec.metric,
          targetHours: rec.targetHours,
          actualHours: rec.actualHours,
          status: mapStatus(rec.status),
          periodStart: rec.periodStart,
          periodEnd: rec.periodEnd,
        }))
      );

      setRows(merged);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    void fetchData(session).then(() => {
      if (cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [session?.accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived KPIs ─────────────────────────────────────────────────────────
  const withinSla  = rows.filter((e) => e.status === "met").length;
  const atRisk     = rows.filter((e) => e.status === "at risk").length;
  const breached   = rows.filter((e) => e.status === "breached").length;
  const compliancePct = rows.length > 0 ? Math.round((withinSla / rows.length) * 100) : 0;

  if (loading) {
    return (
      <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-sla-tracker">
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </section>
    );
  }

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-sla-tracker">
      {/* ── Header ── */}
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Lifecycle</div>
        <h1 className={cx("pageTitleText")}>SLA Tracker</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Monitor client service-level agreement compliance across accounts</p>
      </div>

      {/* ── KPI strip ── */}
      <div className={cx("staffKpiStrip", "mb20")}>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>Within SLA</div>
          <div className={cx("staffKpiValue", "colorGreen")}>{withinSla}</div>
          <div className={cx("staffKpiSub")}>Compliant</div>
        </div>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>At Risk</div>
          <div className={cx("staffKpiValue", atRisk > 0 ? "colorAmber" : "colorGreen")}>{atRisk}</div>
          <div className={cx("staffKpiSub")}>Approaching limit</div>
        </div>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>Breached</div>
          <div className={cx("staffKpiValue", breached > 0 ? "colorRed" : "colorGreen")}>{breached}</div>
          <div className={cx("staffKpiSub")}>Needs escalation</div>
        </div>
        <div className={cx("staffKpiCell")}>
          <div className={cx("staffKpiLabel")}>Avg Response</div>
          <div className={cx("staffKpiValue")}>{avgResponseTime(rows)}</div>
          <div className={cx("staffKpiSub")}>Across all clients</div>
        </div>
      </div>

      {/* ── Compliance metric ── */}
      {rows.length > 0 && (
        <div className={cx("staffCard", "slaComplianceCard", "mb16")}>
          <div className={cx("staffSectionHd")}>
            <span className={cx("staffSectionTitle")}>Overall Compliance</span>
            <span className={cx("staffMetricBlockSm", complianceColorCls(compliancePct))}>
              {compliancePct}%
            </span>
          </div>
          <div className={cx("staffBar")}>
            <div
              className={cx("staffBarFill", compliancePct >= 80 ? "slaFillGreen" : compliancePct >= 50 ? "slaFillAmber" : "slaFillRed")}
              style={{ "--fill-pct": `${compliancePct}%` } as React.CSSProperties}
            />
          </div>
        </div>
      )}

      {/* ── SLA rows ── */}
      <div className={cx("staffCard")}>
        <div className={cx("staffSectionHd")}>
          <span className={cx("staffSectionTitle")}>SLA Records</span>
          <span className={cx("staffChip")}>{rows.length} entries</span>
        </div>

        {rows.length === 0 ? (
          <div className={cx("staffEmpty")}>
            <div className={cx("staffEmptyIcon")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className={cx("staffEmptyTitle")}>No SLA records</div>
            <div className={cx("staffEmptyNote")}>SLA data will appear once service-level agreements are configured for your clients.</div>
          </div>
        ) : (
          rows.map((e) => (
            <div key={e.id} className={cx("staffListRow", "slaRowItem")}>
              <span className={cx("staffDot", dotClass(e.status))} />
              <div className={cx("slaRowMain")}>
                <span className={cx("slaRowClient")}>{e.client}</span>
                <span className={cx("slaRowMetric")}>{e.metric}</span>
              </div>
              <div className={cx("slaRowNumbers")}>
                <span className={cx("slaRowTarget")}>Target: {fmtHours(e.targetHours)}</span>
                <span className={cx("slaRowActual")}>
                  Actual: {e.actualHours !== null ? fmtHours(e.actualHours) : "—"}
                </span>
                <span className={cx("slaRowVariance", e.status === "met" ? "colorGreen" : e.status === "breached" ? "colorRed" : "colorAmber")}>
                  {varianceStr(e.targetHours, e.actualHours)}
                </span>
              </div>
              <div className={cx("slaRowRight")}>
                <span className={cx("staffChip", "staffChipMuted")}>{e.tier}</span>
                <span className={cx("staffChip", chipClass(e.status))}>{e.status}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

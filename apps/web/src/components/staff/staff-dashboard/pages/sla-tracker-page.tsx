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

function statusBadge(s: SlaStatus) {
  if (s === "met") return "badgeGreen";
  if (s === "at risk") return "badgeAmber";
  return "badgeRed";
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
  const withinSla = rows.filter((e) => e.status === "met").length;
  const atRisk = rows.filter((e) => e.status === "at risk").length;
  const breached = rows.filter((e) => e.status === "breached").length;

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

      {/* ── KPI row ── */}
      <div className={cx("grid4", "gap14", "mb4")}>
        {[
          { label: "Within SLA", value: loading ? "…" : String(withinSla), sub: "Compliant" },
          { label: "At Risk", value: loading ? "…" : String(atRisk), sub: "Approaching limit" },
          { label: "Breached", value: loading ? "…" : String(breached), sub: "Needs escalation" },
          { label: "Avg Response Time", value: loading ? "…" : avgResponseTime(rows), sub: "Across all clients" },
        ].map((k) => (
          <div key={k.label} className={cx("statCard")}>
            <div className={cx("statLabel")}>{k.label}</div>
            <div className={cx("statValue")}>{k.value}</div>
            <div className={cx("statMeta")}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      <div className={cx("card", "overflowHidden")}>
        <div className={cx("slaHead")}>
          {["Client", "Tier", "SLA Metric", "Target", "Actual", "Variance", "Status"].map((h) => (
            <span key={h}>{h}</span>
          ))}
        </div>

        {loading && (
          <div className={cx("emptyState")}>
            <div className={cx("emptyStateText")}>Loading SLA records…</div>
          </div>
        )}

        {!loading && rows.length === 0 && (
          <div className={cx("emptyState")}>
            <div className={cx("emptyStateIcon")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className={cx("emptyStateTitle")}>No SLA records</div>
            <div className={cx("emptyStateSub")}>SLA data will appear once service-level agreements are configured for your clients.</div>
          </div>
        )}

        {!loading && rows.map((e) => (
          <div key={e.id} className={cx("slaRow")}>
            <span className={cx("fw600", "text13")}>{e.client}</span>
            <span className={cx("badge", "badgeMuted")}>{e.tier}</span>
            <span className={cx("text12", "colorMuted")}>{e.metric}</span>
            <span className={cx("fontMono", "text12")}>{"< "}{fmtHours(e.targetHours)}</span>
            <span className={cx("fontMono", "text12", "fw600")}>{e.actualHours !== null ? fmtHours(e.actualHours) : "—"}</span>
            <span className={cx("fontMono", "text12", e.status === "met" ? "colorAccent" : e.status === "breached" ? "colorRed" : "colorAmber")}>
              {varianceStr(e.targetHours, e.actualHours)}
            </span>
            <span className={cx("badge", statusBadge(e.status))}>{e.status}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

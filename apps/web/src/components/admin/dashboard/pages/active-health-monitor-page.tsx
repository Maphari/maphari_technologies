// ════════════════════════════════════════════════════════════════════════════
// active-health-monitor-page.tsx — Admin Active Health Monitor
// Data : loadAdminSnapshotWithRefresh → derives alerts from client status
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { cx, styles } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { loadAdminSnapshotWithRefresh } from "../../../../lib/api/admin";
import type { AdminClient } from "../../../../lib/api/admin/types";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";

// ── Health derivation ─────────────────────────────────────────────────────────

type Severity = "Critical" | "Warning";

type HealthAlert = {
  client:   string;
  clientId: string;
  score:    number;
  trend:    string;
  category: string;
  detail:   string;
  severity: Severity;
  since:    string;
};

type HealthyClient = {
  client:   string;
  clientId: string;
  score:    number;
  tier:     string;
};

const STATUS_ALERT: Record<string, { severity: Severity; category: string; detail: string } | undefined> = {
  AT_RISK:    { severity: "Warning",  category: "Account Status", detail: "Client flagged as at-risk — follow up required." },
  CHURNED:    { severity: "Critical", category: "Account Lost",   detail: "Client has churned — escalation recommended." },
  INACTIVE:   { severity: "Warning",  category: "Engagement",     detail: "Client account is inactive." },
  PAUSED:     { severity: "Warning",  category: "Project Paused", detail: "All client projects are currently paused." },
  OVERDUE:    { severity: "Critical", category: "Payment",        detail: "Client has overdue invoices." },
  ESCALATED:  { severity: "Critical", category: "SLA Breach",     detail: "Active SLA escalation — response overdue." },
};

function deriveHealth(clients: AdminClient[]): {
  alerts: HealthAlert[];
  healthy: HealthyClient[];
} {
  const alerts: HealthAlert[]   = [];
  const healthy: HealthyClient[] = [];

  for (const c of clients) {
    const alertDef = STATUS_ALERT[c.status?.toUpperCase() ?? ""];
    if (alertDef) {
      alerts.push({
        client:   c.name,
        clientId: c.id,
        score:    c.status === "CHURNED" ? 0 : c.status === "AT_RISK" ? 45 : 60,
        trend:    "↓",
        category: alertDef.category,
        detail:   alertDef.detail,
        severity: alertDef.severity,
        since:    new Date(c.updatedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short" }),
      });
    } else {
      healthy.push({
        client:   c.name,
        clientId: c.id,
        score:    c.priority === "HIGH" ? 95 : c.priority === "MEDIUM" ? 85 : 80,
        tier:     c.tier,
      });
    }
  }

  return { alerts, healthy };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ActiveHealthMonitorPage({ session }: { session: AuthSession | null }) {
  const [alerts,  setAlerts]  = useState<HealthAlert[]>([]);
  const [healthy, setHealthy] = useState<HealthyClient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    void loadAdminSnapshotWithRefresh(session).then((r) => {
      if (cancelled) return;
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) {
        const { alerts: a, healthy: h } = deriveHealth(r.data.clients);
        setAlerts(a);
        setHealthy(h);
      }
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [session]);

  const critical = alerts.filter((a) => a.severity === "Critical").length;
  const warnings = alerts.filter((a) => a.severity === "Warning").length;

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

  // ── Widget data ─────────────────────────────────────────────────────────
  const totalClients  = alerts.length + healthy.length;
  const categoryChartData = alerts.reduce<Record<string, number>>((acc, a) => {
    acc[a.category] = (acc[a.category] ?? 0) + 1;
    return acc;
  }, {});
  const alertChartData = Object.entries(categoryChartData).map(([name, value]) => ({ name: name.split(" ")[0], value }));

  const tableRows = alerts.map((a) => ({
    id: a.clientId,
    client: a.client,
    category: a.category,
    severity: a.severity,
    score: a.score,
    since: a.since,
  })) as unknown as Record<string, unknown>[];

  return (
    <div className={styles.pageBody}>

      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>AI/ML / HEALTH MONITOR</div>
          <h1 className={styles.pageTitle}>Active Health Monitor</h1>
          <div className={styles.pageSub}>Real-time alerts · Client health scores · Risk dashboard</div>
        </div>
      </div>

      {/* ── Row 1: Stats ── */}
      <WidgetGrid>
        <StatWidget label="Critical Alerts" value={critical} tone={critical > 0 ? "red" : "default"} progressValue={totalClients > 0 ? Math.round((critical / totalClients) * 100) : 0} />
        <StatWidget label="Warnings" value={warnings} tone={warnings > 0 ? "amber" : "default"} progressValue={totalClients > 0 ? Math.round((warnings / totalClients) * 100) : 0} />
        <StatWidget label="Healthy Clients" value={healthy.length} tone="green" progressValue={totalClients > 0 ? Math.round((healthy.length / totalClients) * 100) : 0} />
        <StatWidget label="Total Monitored" value={totalClients} sub="clients tracked" sparkData={[2, 4, 6, 5, 8, 7, 9, totalClients]} />
      </WidgetGrid>

      {/* ── Row 2: Chart + Pipeline ── */}
      <WidgetGrid>
        <ChartWidget
          label="Alerts by Category"
          type="bar"
          data={alertChartData.length > 0 ? alertChartData : [{ name: "No alerts", value: 0 }]}
          dataKey="value"
          xKey="name"
          color="#8b6fff"
        />
        <PipelineWidget
          label="Health Distribution"
          stages={[
            { label: "Healthy", count: healthy.length, total: Math.max(totalClients, 1), color: "#34d98b" },
            { label: "Warning", count: warnings, total: Math.max(totalClients, 1), color: "#f5a623" },
            { label: "Critical", count: critical, total: Math.max(totalClients, 1), color: "#ff5f5f" },
          ]}
        />
      </WidgetGrid>

      {/* ── Row 3: Table ── */}
      <WidgetGrid>
        <TableWidget
          label="Active Alerts"
          rows={tableRows}
          rowKey="id"
          emptyMessage="No active health alerts — all clients are healthy."
          columns={[
            { key: "client", header: "Client", render: (_v, row) => <span style={{ fontWeight: 600 }}>{String(row.client ?? "")}</span> },
            { key: "category", header: "Category", render: (_v, row) => <span className={cx("colorMuted")}>{String(row.category ?? "")}</span> },
            { key: "severity", header: "Severity", render: (_v, row) => {
              const s = String(row.severity ?? "");
              return <span className={cx("badge", s === "Critical" ? "badgeRed" : "badgeAmber")}>{s}</span>;
            }},
            { key: "score", header: "Score", align: "right", render: (_v, row) => <span className={cx("fontMono")}>{String(row.score ?? 0)}%</span> },
            { key: "since", header: "Since", align: "right", render: (_v, row) => <span className={cx("text12", "colorMuted")}>{String(row.since ?? "")}</span> },
          ]}
        />
      </WidgetGrid>

      <>
        {alerts.length === 0 ? (
            <div className={cx("colorMuted", "text12", "textCenter", "py24")}>
              No active health alerts — all clients are healthy.
            </div>
          ) : (
            <div className={cx("flexCol", "gap16", "mb24")}>
              {alerts.map((a) => (
                <article
                  key={a.clientId}
                  className={cx(styles.card, a.severity === "Critical" ? "borderLeftRed" : "borderLeftAmber")}
                >
                  <div className={styles.cardHd}>
                    <span className={styles.cardHdTitle}>
                      {a.client}{" "}
                      <span className={cx("fontMono", "text12", a.severity === "Critical" ? "colorRed" : "colorAmber")}>
                        {a.score}% {a.trend}
                      </span>
                    </span>
                    <span className={cx("badge", a.severity === "Critical" ? "badgeRed" : "badgeAmber")}>{a.severity}</span>
                  </div>
                  <div className={styles.cardInner}>
                    <div className={cx("text12", "mb4")}><strong>{a.category}:</strong> {a.detail}</div>
                    <div className={cx("text11", "colorMuted")}>Alert since: {a.since}</div>
                  </div>
                </article>
              ))}
            </div>
          )}

          <article className={styles.card}>
            <div className={styles.cardHd}>
              <span className={styles.cardHdTitle}>Healthy Clients</span>
              <span className={cx("badge", "badgeGreen")}>{healthy.length}</span>
            </div>
            <div className={styles.cardInner}>
              {healthy.length === 0 ? (
                <div className={cx("colorMuted", "text12")}>No healthy clients found.</div>
              ) : (
                healthy.map((h) => (
                  <div key={h.clientId} className={cx("flexBetween", "py8", "borderB")}>
                    <div>
                      <span className={cx("fw600")}>{h.client}</span>
                      <span className={cx("fontMono", "text10", "colorMuted", "ml8")}>{h.tier}</span>
                    </div>
                    <span className={cx("fontMono", "fw600", "colorGreen")}>{h.score}% ↑</span>
                  </div>
                ))
              )}
            </div>
          </article>
        </>
    </div>
  );
}

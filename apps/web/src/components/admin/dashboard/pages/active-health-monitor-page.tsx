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

  return (
    <div className={styles.pageBody}>

      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>GOVERNANCE / ACTIVE HEALTH MONITOR</div>
          <h1 className={styles.pageTitle}>Active Health Monitor</h1>
          <div className={styles.pageSub}>Real-time health alerts — proactive vs. static scorecard</div>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Critical Alerts",  value: loading ? "…" : String(critical),        cls: critical > 0 ? "colorRed"   : "colorAccent" },
          { label: "Warnings",         value: loading ? "…" : String(warnings),        cls: warnings > 0 ? "colorAmber" : "colorAccent" },
          { label: "Healthy Clients",  value: loading ? "…" : String(healthy.length),  cls: "colorAccent" },
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, s.cls)}>{s.value}</div>
          </div>
        ))}
      </div>

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

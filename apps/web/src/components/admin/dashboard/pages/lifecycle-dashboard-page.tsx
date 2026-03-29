// ════════════════════════════════════════════════════════════════════════════
// lifecycle-dashboard-page.tsx — Admin Lifecycle Dashboard
// Data : loadClientDirectoryWithRefresh → GET /clients/directory
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { cx, styles } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import { loadClientDirectoryWithRefresh } from "../../../../lib/api/admin/clients";
import type { AdminClient } from "../../../../lib/api/admin/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function inferStage(status: string): string {
  switch (status) {
    case "ONBOARDING": return "Onboarding";
    case "ACTIVE":     return "Active";
    case "PAUSED":     return "At Risk";
    case "CHURNED":    return "Offboarding";
    default:           return status;
  }
}

function stageBadge(stage: string): string {
  if (stage === "Active")      return "badgeGreen";
  if (stage === "At Risk")     return "badgeRed";
  if (stage === "Offboarding") return "badgeAmber";
  return "badgeMuted"; // Onboarding
}

function inferHealth(status: string, priority: string): number {
  if (status === "CHURNED") return 15;
  if (status === "PAUSED")  return 35;
  const base = status === "ACTIVE" ? 70 : 65; // ONBOARDING baseline
  if (priority === "HIGH")   return Math.min(base + 20, 100);
  if (priority === "MEDIUM") return base;
  return Math.max(base - 15, 0);
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "2-digit" });
  } catch { return "—"; }
}

function computeTenure(contractStartAt: string | null): string {
  if (!contractStartAt) return "—";
  const start = new Date(contractStartAt);
  const now = new Date();
  const months =
    (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth();
  if (months <= 0) return "< 1 mo";
  const yrs = Math.floor(months / 12);
  const mo  = months % 12;
  if (yrs === 0) return `${months} mo`;
  return mo === 0 ? `${yrs} yr` : `${yrs} yr, ${mo} mo`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function LifecycleDashboardPage({ session }: { session: AuthSession | null }) {
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    let cancelled = false;
    setError(null);
    void loadClientDirectoryWithRefresh(session, { pageSize: 100 }).then((r) => {
      if (cancelled) return;
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) { setError(r.error.message ?? "Failed to load."); }
      else if (r.data?.items) setClients(r.data.items);
    }).catch((err: unknown) => {
      if (!cancelled) setError((err as Error)?.message ?? "Failed to load.");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [session]);

  const onboarding  = clients.filter((c) => c.status === "ONBOARDING").length;
  const active      = clients.filter((c) => c.status === "ACTIVE").length;
  const atRisk      = clients.filter((c) => c.status === "PAUSED").length;
  const offboarding = clients.filter((c) => c.status === "CHURNED").length;

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

  if (error) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("errorState")}>
          <div className={cx("errorStateIcon")}>✕</div>
          <div className={cx("errorStateTitle")}>Failed to load</div>
          <div className={cx("errorStateSub")}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>LIFECYCLE / LIFECYCLE DASHBOARD</div>
          <h1 className={styles.pageTitle}>Lifecycle Dashboard</h1>
          <div className={styles.pageSub}>Unified client onboarding, active, and offboarding status</div>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Onboarding",  value: String(onboarding),  cls: "colorAccent" },
          { label: "Active",      value: String(active),      cls: "colorGreen"  },
          { label: "At Risk",     value: String(atRisk),      cls: "colorRed"    },
          { label: "Offboarding", value: String(offboarding), cls: "colorAmber"  },
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, s.cls)}>{s.value}</div>
          </div>
        ))}
      </div>

      <article className={styles.card}>
        <div className={styles.cardHd}>
          <span className={styles.cardHdTitle}>All Clients</span>
          <span className={cx("colorMuted", "text12")}>{clients.length} total</span>
        </div>
        <div className={styles.cardInner}>
          {clients.length === 0 ? (
            <div className={cx("colorMuted2", "text13", "mt16")}>No clients found.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Client</th>
                  <th scope="col">Stage</th>
                  <th scope="col">Contract Start</th>
                  <th scope="col">Tenure</th>
                  <th scope="col">Health</th>
                  <th scope="col">Renewal</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => {
                  const stage  = inferStage(c.status);
                  const health = inferHealth(c.status, c.priority);
                  return (
                    <tr key={c.id}>
                      <td className={cx("fw600")}>{c.name}</td>
                      <td>
                        <span className={cx("badge", stageBadge(stage))}>{stage}</span>
                      </td>
                      <td className={cx("text12")}>{formatDate(c.contractStartAt)}</td>
                      <td className={cx("text12", "colorMuted")}>{computeTenure(c.contractStartAt)}</td>
                      <td className={cx("fontMono", "fw600", health >= 70 ? "colorGreen" : health >= 50 ? "colorAmber" : "colorRed")}>
                        {health}%
                      </td>
                      <td className={cx("text12", "colorMuted")}>{formatDate(c.contractRenewalAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </article>
    </div>
  );
}

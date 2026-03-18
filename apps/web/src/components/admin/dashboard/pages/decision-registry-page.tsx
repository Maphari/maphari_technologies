// ════════════════════════════════════════════════════════════════════════════
// decision-registry-page.tsx — Admin Decision Registry
// Data     : loadDecisionRecordsWithRefresh → GET /admin/decision-records
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useState, useEffect } from "react";
import { cx, styles } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadDecisionRecordsWithRefresh,
  type AdminDecisionRecord,
} from "../../../../lib/api/admin";

// ── Helpers ───────────────────────────────────────────────────────────────────
function statusBadge(status: string) {
  const s = status.toUpperCase();
  if (s === "ACTIVE")     return "badgeGreen";
  if (s === "SUPERSEDED") return "badge";
  return "badgeAmber"; // DRAFT / PENDING
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

// ── Component ─────────────────────────────────────────────────────────────────
export function DecisionRegistryPage({ session }: { session: AuthSession | null }) {
  const [decisions, setDecisions] = useState<AdminDecisionRecord[]>([]);

  useEffect(() => {
    if (!session) return;
    void loadDecisionRecordsWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) setDecisions(r.data);
    });
  }, [session]);

  const active     = decisions.filter((d) => d.status.toUpperCase() === "ACTIVE").length;
  const superseded = decisions.filter((d) => d.status.toUpperCase() === "SUPERSEDED").length;

  return (
    <div className={styles.pageBody}>
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / KNOWLEDGE</div>
          <h1 className={styles.pageTitle}>Decision Registry</h1>
          <div className={styles.pageSub}>Company-wide decision log with rationale and impact tracking</div>
        </div>
        <button type="button" className={cx("btnSm", "btnAccent")}>+ Record Decision</button>
      </div>

      {/* ── KPI Cards ── */}
      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Total",      value: String(decisions.length), cls: "colorAccent" },
          { label: "Active",     value: String(active),           cls: "colorAccent" },
          { label: "Superseded", value: String(superseded),       cls: "colorMuted"  },
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, s.cls)}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      <article className={styles.card}>
        <div className={styles.cardHd}>
          <span className={styles.cardHdTitle}>Decision Log</span>
          <span className={cx("text12", "colorMuted")}>{decisions.length} records</span>
        </div>
        <div className={styles.cardInner}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Decision</th>
                <th scope="col">Decided By</th>
                <th scope="col">Date</th>
                <th scope="col">Tags</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {decisions.length === 0 ? (
                <tr>
                  <td colSpan={5} className={cx("colorMuted", "text12", "textCenter", "py16")}>
                    No decisions recorded yet.
                  </td>
                </tr>
              ) : (
                decisions.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <div className={cx("fw600")}>{d.title}</div>
                      {d.outcome && <div className={cx("text11", "colorMuted")}>{d.outcome}</div>}
                    </td>
                    <td className={cx("colorMuted")}>{d.decidedByName ?? "—"}</td>
                    <td className={cx("text12", "colorMuted")}>{formatDate(d.decidedAt)}</td>
                    <td>
                      {d.tags
                        ? <span className={cx("badge")}>{d.tags.split(",")[0]?.trim()}</span>
                        : <span className={cx("colorMuted")}>—</span>}
                    </td>
                    <td>
                      <span className={cx("badge", statusBadge(d.status))}>{d.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}

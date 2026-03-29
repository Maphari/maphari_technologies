// ════════════════════════════════════════════════════════════════════════════
// handover-management-page.tsx — Admin Handover Management
// Data     : loadHandoversWithRefresh → GET /admin/handovers
//            updateHandoverWithRefresh → PATCH /admin/handovers/:id
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useState, useEffect } from "react";
import { cx, styles } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadHandoversWithRefresh,
  updateHandoverWithRefresh,
  type AdminHandover,
} from "../../../../lib/api/admin";

// ── Helpers ───────────────────────────────────────────────────────────────────
function statusBadge(status: string) {
  const s = status.toUpperCase();
  if (s === "COMPLETE" || s === "COMPLETED") return "badgeGreen";
  if (s === "IN_PROGRESS")                   return "badgeAmber";
  return "badgeRed"; // PENDING / CANCELLED
}

function statusLabel(status: string) {
  const s = status.toUpperCase();
  if (s === "IN_PROGRESS") return "In Progress";
  if (s === "COMPLETE" || s === "COMPLETED") return "Complete";
  return status;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

// ── Component ─────────────────────────────────────────────────────────────────
export function HandoverManagementPage({ session }: { session: AuthSession | null }) {
  const [handovers, setHandovers] = useState<AdminHandover[]>([]);
  const [updating,  setUpdating]  = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    void loadHandoversWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) setError(r.error.message ?? "Failed to load.");
      else if (r.data) setHandovers(r.data);
      setLoading(false);
    }).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to load.");
      setLoading(false);
    });
  }, [session]);

  const active   = handovers.filter((h) => h.status.toUpperCase() === "IN_PROGRESS").length;
  const complete = handovers.filter((h) => ["COMPLETE", "COMPLETED"].includes(h.status.toUpperCase())).length;
  const pending  = handovers.filter((h) => h.status.toUpperCase() === "PENDING").length;

  async function handleComplete(id: string) {
    if (!session || updating) return;
    setUpdating(id);
    try {
      const r = await updateHandoverWithRefresh(session, id, { status: "COMPLETED" });
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) setHandovers((prev) => prev.map((h) => h.id === id ? r.data! : h));
    } finally {
      setUpdating(null);
    }
  }

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
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>KNOWLEDGE / HANDOVER MANAGEMENT</div>
          <h1 className={styles.pageTitle}>Handover Management</h1>
          <div className={styles.pageSub}>Create and monitor project handover records</div>
        </div>
        <button type="button" className={cx("btnSm", "btnAccent")}>+ New Handover</button>
      </div>

      {/* ── KPI Cards ── */}
      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Active",   value: String(active),   cls: "colorAmber"  },
          { label: "Complete", value: String(complete), cls: "colorAccent" },
          { label: "Pending",  value: String(pending),  cls: "colorRed"    },
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, s.cls)}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Handover cards ── */}
      {handovers.length === 0 ? (
        <div className={cx("colorMuted", "text12", "textCenter", "py24")}>
          No handovers recorded yet.
        </div>
      ) : (
        <div className={cx("flexCol", "gap16")}>
          {handovers.map((h) => (
            <article key={h.id} className={styles.card}>
              <div className={cx(styles.cardHd)}>
                <span className={styles.cardHdTitle}>
                  {h.fromStaffName ?? "Unknown"} → {h.toStaffName ?? "TBD"}
                </span>
                <span className={cx("badge", statusBadge(h.status))}>{statusLabel(h.status)}</span>
              </div>
              <div className={styles.cardInner}>
                <div className={cx("flexBetween", "mb8")}>
                  <span className={cx("text12", "colorMuted")}>
                    {h.projectId ? `Project: ${h.projectId}` : h.clientId ? `Client: ${h.clientId}` : "No project/client linked"}
                  </span>
                  <span className={cx("text12", "colorMuted")}>Transfer: {formatDate(h.transferDate)}</span>
                </div>
                {h.notes && (
                  <div className={cx("text12", "colorMuted", "mb12")}>{h.notes}</div>
                )}
                {(h.status.toUpperCase() === "PENDING" || h.status.toUpperCase() === "IN_PROGRESS") && (
                  <button
                    type="button"
                    className={cx("btnSm", "btnAccent")}
                    disabled={updating === h.id}
                    onClick={() => void handleComplete(h.id)}
                  >
                    {updating === h.id ? "…" : "Mark Complete"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

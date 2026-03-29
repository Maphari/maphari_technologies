// ════════════════════════════════════════════════════════════════════════════
// peer-review-queue-page.tsx — Admin Peer Review Queue
// Data     : loadAdminPeerReviewsWithRefresh → GET /peer-reviews
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useState, useEffect } from "react";
import { cx, styles } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { loadAdminPeerReviewsWithRefresh, type AdminPeerReview } from "../../../../lib/api/admin";
import { saveSession } from "../../../../lib/auth/session";

// ── Helpers ───────────────────────────────────────────────────────────────────
function priorityBadge(dueAt: string | null): string {
  if (!dueAt) return "badge";
  const diff = new Date(dueAt).getTime() - Date.now();
  if (diff < 86_400_000 * 2) return "badgeRed";
  if (diff < 86_400_000 * 7) return "badgeAmber";
  return "badge";
}
function priorityLabel(dueAt: string | null): string {
  if (!dueAt) return "Normal";
  const diff = new Date(dueAt).getTime() - Date.now();
  if (diff < 86_400_000 * 2) return "High";
  if (diff < 86_400_000 * 7) return "Medium";
  return "Low";
}
function statusBadge(status: string): string {
  if (status === "SUBMITTED") return "badgeGreen";
  if (status === "PENDING")   return "badgeRed";
  return "badgeAmber";
}
function statusLabel(status: string): string {
  if (status === "SUBMITTED") return "Complete";
  if (status === "PENDING")   return "Pending";
  return "In Review";
}

// ── Component ─────────────────────────────────────────────────────────────────
export function PeerReviewQueuePage({ session }: { session: AuthSession | null }) {
  const [reviews, setReviews] = useState<AdminPeerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    loadAdminPeerReviewsWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) setError(r.error.message ?? "Failed to load.");
      else if (r.data) setReviews(r.data);
    }).catch((err: unknown) => {
      setError((err as Error)?.message ?? "Failed to load.");
    }).finally(() => {
      setLoading(false);
    });
  }, [session]);

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
          <div className={styles.pageEyebrow}>GOVERNANCE / PEER REVIEW QUEUE</div>
          <h1 className={styles.pageTitle}>Peer Review Queue</h1>
          <div className={styles.pageSub}>Manage and distribute peer review assignments across the team</div>
        </div>
      </div>
      <article className={styles.card}>
        <div className={styles.cardHd}><span className={styles.cardHdTitle}>Review Requests ({reviews.length})</span></div>
        <div className={styles.cardInner}>
          {reviews.length === 0 ? (
            <div className={cx("colorMuted", "text13", "py24", "textCenter")}>No peer reviews found.</div>
          ) : (
            <table className={styles.table}>
              <thead><tr><th scope="col">ID</th><th scope="col">Reviewer</th><th scope="col">Reviewee</th><th scope="col">Project</th><th scope="col">Priority</th><th scope="col">Status</th></tr></thead>
              <tbody>
                {reviews.map((r) => (
                  <tr key={r.id}>
                    <td className={cx("fontMono", "text12")}>{r.id.slice(0, 8).toUpperCase()}</td>
                    <td className={cx("fw600", "text12")}>{r.reviewerId.slice(0, 8)}…</td>
                    <td className={cx("text12")}>{r.revieweeId.slice(0, 8)}…</td>
                    <td className={cx("colorMuted", "text12")}>{r.projectId ? r.projectId.slice(0, 8) + "…" : "—"}</td>
                    <td><span className={cx("badge", priorityBadge(r.dueAt))}>{priorityLabel(r.dueAt)}</span></td>
                    <td><span className={cx("badge", statusBadge(r.status))}>{statusLabel(r.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </article>
    </div>
  );
}

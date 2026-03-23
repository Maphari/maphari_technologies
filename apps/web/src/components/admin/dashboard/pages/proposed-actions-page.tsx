// ════════════════════════════════════════════════════════════════════════════
// proposed-actions-page.tsx — Admin Pending Approvals
// Data     : listProposedActionsWithRefresh    → GET  /admin/proposed-actions
//            approveProposedActionWithRefresh  → PATCH /admin/proposed-actions/:id/approve
//            rejectProposedActionWithRefresh   → PATCH /admin/proposed-actions/:id/reject
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useCallback, useEffect, useState } from "react";
import { styles } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  listProposedActionsWithRefresh,
  approveProposedActionWithRefresh,
  rejectProposedActionWithRefresh,
  type ProposedAction,
} from "../../../../lib/api/admin/proposed-actions";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatAction(action: string): string {
  return action.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ProposedActionsPage({ session }: { session: AuthSession | null }) {
  const [items, setItems]     = useState<ProposedAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [working, setWorking] = useState<string | null>(null);

  const load = useCallback(async (s: typeof session) => {
    if (!s) return;
    setLoading(true);
    setError(null);
    const res = await listProposedActionsWithRefresh(s, "PENDING");
    if (res.unauthorized) return;
    if (res.nextSession) saveSession(res.nextSession);
    if (res.error) {
      setError(res.error.message ?? "Failed to load pending approvals.");
    } else if (res.data) {
      setItems(res.data);
    }
    setLoading(false);
  }, []); // stable — only depends on stable setState dispatchers

  useEffect(() => { void load(session); }, [session, load]);

  async function handleApprove(id: string): Promise<void> {
    if (!session || working) return;
    setError(null);
    setWorking(id);
    const res = await approveProposedActionWithRefresh(session, id);
    if (res.nextSession) saveSession(res.nextSession);
    if (res.error) {
      setError(res.error.message ?? "Failed to approve action.");
      setWorking(null);
      return;
    }
    await load(session);
    setWorking(null);
  }

  async function handleReject(id: string): Promise<void> {
    if (!session || working) return;
    setError(null);
    setWorking(id);
    const res = await rejectProposedActionWithRefresh(session, id, "Rejected via dashboard");
    if (res.nextSession) saveSession(res.nextSession);
    if (res.error) {
      setError(res.error.message ?? "Failed to reject action.");
      setWorking(null);
      return;
    }
    await load(session);
    setWorking(null);
  }

  // ── Loading / error states ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={styles.pageBody}>
        <div className={styles.emptyState}>Loading pending approvals…</div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={styles.pageBody}>
      {error && <p className={styles.errorStateSub}>{error}</p>}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / GOVERNANCE</div>
          <h1 className={styles.pageTitle}>Pending Approvals</h1>
          <div className={styles.pageSub}>
            High-stakes actions proposed by admins that require a second sign-off before execution.
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className={styles.emptyState}>All clear — no pending approvals.</div>
      ) : (
        <div className={styles.paList}>
          {items.map((item) => (
            <div key={item.id} className={styles.paCard}>
              <div className={styles.paCardHeader}>
                <span className={styles.paBadge}>{formatAction(item.action)}</span>
                <span className={styles.paResource}>
                  {item.resourceType}
                  {item.resourceId ? ` · ${item.resourceId}` : ""}
                </span>
                <span className={styles.paTimestamp}>{timeAgo(item.createdAt)}</span>
              </div>

              <div className={styles.paCardBody}>
                <p className={styles.paProposer}>
                  Proposed by{" "}
                  <strong>{item.proposedByName ?? item.proposedBy}</strong>
                </p>
                {item.reason && (
                  <p className={styles.paReason}>{item.reason}</p>
                )}
              </div>

              <div className={styles.paCardActions}>
                <button
                  type="button"
                  className={styles.btnAccent}
                  disabled={working === item.id}
                  onClick={() => { void handleApprove(item.id); }}
                >
                  {working === item.id ? "Working…" : "Approve"}
                </button>
                <button
                  type="button"
                  className={styles.btnGhost}
                  disabled={working === item.id}
                  onClick={() => { void handleReject(item.id); }}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

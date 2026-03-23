// ════════════════════════════════════════════════════════════════════════════
// admin-community-feature-requests-page.tsx — Admin Feature Requests Management
// Data     : loadAdminFeatureRequestsWithRefresh  → GET  /admin/feature-requests
//            updateAdminFeatureRequestWithRefresh → PATCH /admin/feature-requests/:id
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { cx, styles } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadAdminFeatureRequestsWithRefresh,
  updateAdminFeatureRequestWithRefresh,
  type AdminFeatureRequest,
} from "../../../../lib/api/admin";

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "under_review", label: "Under Review" },
  { value: "planned",      label: "Planned" },
  { value: "in_progress",  label: "In Progress" },
  { value: "done",         label: "Done" },
  { value: "declined",     label: "Declined" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function displayFrom(req: AdminFeatureRequest): string {
  return req.realName ?? req.anonAlias;
}

function fmtRelative(iso: string): string {
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
export function AdminCommunityFeatureRequestsPage({ session }: { session: AuthSession | null }) {
  const [requests, setRequests]     = useState<AdminFeatureRequest[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [sort, setSort]             = useState<"votes" | "newest">("votes");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    void loadAdminFeatureRequestsWithRefresh(session, { sort })
      .then((r) => {
        if (r.nextSession) saveSession(r.nextSession);
        if (r.error) {
          setError(r.error.message ?? "Failed to load feature requests.");
        } else if (r.data) {
          setRequests(r.data);
        }
      })
      .catch((err: unknown) => {
        setError((err as Error)?.message ?? "Failed to load feature requests.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [session, sort]);

  async function handleStatusChange(req: AdminFeatureRequest, newStatus: string): Promise<void> {
    if (!session || updatingId) return;
    setUpdatingId(req.id);
    setActionError(null);

    // Optimistic update
    setRequests((prev) =>
      prev.map((r) => (r.id === req.id ? { ...r, status: newStatus } : r))
    );

    const result = await updateAdminFeatureRequestWithRefresh(session, req.id, {
      status: newStatus,
    });

    if (result.nextSession) saveSession(result.nextSession);

    if (result.error) {
      // Revert optimistic update
      setRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, status: req.status } : r))
      );
      setActionError(result.error.message ?? "Failed to update status.");
    } else if (result.data) {
      setRequests((prev) =>
        prev.map((r) => (r.id === req.id ? result.data! : r))
      );
    }

    setUpdatingId(null);
  }

  async function handleApproval(
    req: AdminFeatureRequest,
    action: "approve" | "reject"
  ): Promise<void> {
    if (!session || updatingId) return;
    setUpdatingId(req.id);
    setActionError(null);

    const body =
      action === "approve" ? { isApproved: true } : { isRejected: true };

    // Optimistic update
    setRequests((prev) =>
      prev.map((r) =>
        r.id === req.id
          ? {
              ...r,
              isApproved: action === "approve" ? true : r.isApproved,
              isRejected: action === "reject" ? true : r.isRejected,
            }
          : r
      )
    );

    const result = await updateAdminFeatureRequestWithRefresh(session, req.id, body);

    if (result.nextSession) saveSession(result.nextSession);

    if (result.error) {
      // Revert
      setRequests((prev) =>
        prev.map((r) => (r.id === req.id ? req : r))
      );
      setActionError(result.error.message ?? "Action failed. Please try again.");
    } else if (result.data) {
      setRequests((prev) =>
        prev.map((r) => (r.id === req.id ? result.data! : r))
      );
    }

    setUpdatingId(null);
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={styles.pageBody}>
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className={styles.pageBody}>
        <div className={styles.errorState}>
          <div className={styles.errorStateIcon}>✕</div>
          <div className={styles.errorStateTitle}>Failed to load</div>
          <div className={styles.errorStateSub}>{error}</div>
        </div>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className={styles.pageBody}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / COMMUNITY</div>
          <h1 className={styles.pageTitle}>Feature Requests</h1>
          <div className={styles.pageSub}>
            Manage all client feature requests — approve, reject, and update status
          </div>
        </div>
        <div className={styles.pageActions}>
          <span className={cx("badge", "badgeMuted")}>{requests.length} total</span>
        </div>
      </div>

      {/* Action error banner */}
      {actionError ? (
        <div className={cx("commModError")}>
          <span>{actionError}</span>
          <button
            type="button"
            className={cx("btnSm", "btnGhost")}
            onClick={() => setActionError(null)}
          >
            ✕
          </button>
        </div>
      ) : null}

      {/* Controls */}
      <div className={cx("commFrHeader")}>
        <div className={cx("segmentedControl")}>
          <button
            type="button"
            className={cx("segBtn", sort === "votes" ? "segBtnActive" : "")}
            onClick={() => setSort("votes")}
          >
            Top Voted
          </button>
          <button
            type="button"
            className={cx("segBtn", sort === "newest" ? "segBtnActive" : "")}
            onClick={() => setSort("newest")}
          >
            Newest
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={cx("commFrPage")}>
        {requests.length === 0 ? (
          <div className={cx("commFrEmpty")}>
            <div className={styles.emptyIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className={styles.emptyTitle}>No feature requests</div>
            <div className={styles.emptySub}>
              No feature requests have been submitted yet.
            </div>
          </div>
        ) : (
          <div className={cx("commFrTable")}>
            {/* Table header */}
            <div className={cx("commFrTableHead")}>
              <div>Votes</div>
              <div>Title / Category</div>
              <div>From</div>
              <div>Status</div>
            </div>

            {/* Rows */}
            {requests.map((req) => {
              const isPending = !req.isApproved && !req.isRejected;
              const busy = updatingId === req.id;

              return (
                <div key={req.id} className={cx("commFrRow")}>
                  {/* Vote count */}
                  <div
                    className={cx(
                      "commFrVoteCount",
                      req.voteCount > 20 ? "commFrVoteHigh" : ""
                    )}
                  >
                    {req.voteCount}
                  </div>

                  {/* Title + category */}
                  <div>
                    <div className={cx("commFrTitle")}>{req.title}</div>
                    <div className={cx("commFrRowMeta")}>
                      <span className={cx("commFrCategoryBadge")}>{req.category}</span>
                      <span className={cx("colorMuted", "text12")}>{fmtRelative(req.createdAt)}</span>
                      {req.isRejected && (
                        <span className={cx("badge", "badgeRed")}>Rejected</span>
                      )}
                      {req.isApproved && (
                        <span className={cx("badge", "badgeAccent")}>Approved</span>
                      )}
                    </div>
                    {/* Approve/Reject actions for pending items */}
                    {isPending && (
                      <div className={cx("commFrApprovalBtns")}>
                        <button
                          type="button"
                          className={cx("commFrApproveBtn")}
                          disabled={busy || updatingId !== null}
                          onClick={() => void handleApproval(req, "approve")}
                        >
                          {busy ? "…" : "Approve"}
                        </button>
                        <button
                          type="button"
                          className={cx("commFrRejectBtn")}
                          disabled={busy || updatingId !== null}
                          onClick={() => void handleApproval(req, "reject")}
                        >
                          {busy ? "…" : "Reject"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* From */}
                  <div className={cx("commFrFrom")}>{displayFrom(req)}</div>

                  {/* Status dropdown */}
                  <div>
                    <select
                      className={cx("commFrStatusSelect")}
                      value={req.status}
                      disabled={busy || updatingId !== null}
                      onChange={(e) => void handleStatusChange(req, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

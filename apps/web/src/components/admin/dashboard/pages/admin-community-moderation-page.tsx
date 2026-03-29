// ════════════════════════════════════════════════════════════════════════════
// admin-community-moderation-page.tsx — Admin Community Moderation Queue
// Data     : loadAdminModerationQueueWithRefresh → GET  /admin/forum/moderation-queue
//            approveAdminForumThreadWithRefresh  → PATCH /admin/forum/threads/:id
//            rejectAdminForumThreadWithRefresh   → PATCH /admin/forum/threads/:id
//            approveAdminForumPostWithRefresh    → PATCH /admin/forum/posts/:id
//            rejectAdminForumPostWithRefresh     → PATCH /admin/forum/posts/:id
//            approveAdminFeatureRequestWithRefresh → PATCH /admin/feature-requests/:id
//            rejectAdminFeatureRequestWithRefresh  → PATCH /admin/feature-requests/:id
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import { cx, styles } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadAdminModerationQueueWithRefresh,
  approveAdminForumThreadWithRefresh,
  rejectAdminForumThreadWithRefresh,
  approveAdminForumPostWithRefresh,
  rejectAdminForumPostWithRefresh,
  approveAdminFeatureRequestWithRefresh,
  rejectAdminFeatureRequestWithRefresh,
  type ModerationItem,
} from "../../../../lib/api/admin";

// ── Helpers ───────────────────────────────────────────────────────────────────
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

function typeLabel(type: ModerationItem["type"]): string {
  if (type === "thread") return "Thread";
  if (type === "post") return "Reply";
  return "Feature Request";
}

function typeBadgeClass(type: ModerationItem["type"]): string {
  if (type === "thread") return "commModItemTypePurple";
  if (type === "post") return "commModItemTypeBlue";
  return "commModItemTypeLime";
}

function itemPreview(item: ModerationItem): string {
  const raw = item.title ?? item.body ?? item.description ?? "";
  return raw.length > 160 ? raw.slice(0, 160) + "…" : raw;
}

function displayAuthor(item: ModerationItem): string {
  return item.realName ?? item.anonAlias;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function AdminCommunityModerationPage({ session }: { session: AuthSession | null }) {
  const [items, setItems]               = useState<ModerationItem[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionError, setActionError]   = useState<string | null>(null);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    void loadAdminModerationQueueWithRefresh(session)
      .then((r) => {
        if (r.nextSession) saveSession(r.nextSession);
        if (r.error) {
          setError(r.error.message ?? "Failed to load moderation queue.");
        } else if (r.data) {
          setItems(r.data.items);
        }
      })
      .catch((err: unknown) => {
        setError((err as Error)?.message ?? "Failed to load moderation queue.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [session]);

  async function handleAction(
    item: ModerationItem,
    action: "approve" | "reject"
  ): Promise<void> {
    if (!session || processingId) return;

    // Optimistic remove
    setProcessingId(item.id);
    setActionError(null);
    setItems((prev) => prev.filter((i) => i.id !== item.id));

    let result: Awaited<ReturnType<typeof approveAdminForumThreadWithRefresh>>;

    if (item.type === "thread") {
      result =
        action === "approve"
          ? await approveAdminForumThreadWithRefresh(session, item.id)
          : await rejectAdminForumThreadWithRefresh(session, item.id);
    } else if (item.type === "post") {
      result =
        action === "approve"
          ? await approveAdminForumPostWithRefresh(session, item.id)
          : await rejectAdminForumPostWithRefresh(session, item.id);
    } else {
      result =
        action === "approve"
          ? await approveAdminFeatureRequestWithRefresh(session, item.id)
          : await rejectAdminFeatureRequestWithRefresh(session, item.id);
    }

    if (result.nextSession) saveSession(result.nextSession);

    if (result.error) {
      // Revert optimistic removal
      setItems((prev) => {
        const exists = prev.some((i) => i.id === item.id);
        if (exists) return prev;
        return [item, ...prev].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
      setActionError(result.error.message ?? "Action failed. Please try again.");
    }

    setProcessingId(null);
  }

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={styles.pageBody}>
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
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

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <div className={styles.pageBody}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>COMMUNITY / COMMUNITY MODERATION</div>
          <h1 className={styles.pageTitle}>Moderation Queue</h1>
          <div className={styles.pageSub}>
            Review and approve or reject pending forum threads, replies, and feature requests
          </div>
        </div>
        <div className={styles.pageActions}>
          <span className={cx("badge", "badgeRed")}>{items.length} pending</span>
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

      {/* Moderation list */}
      <div className={cx("commModPage")}>
        {items.length === 0 ? (
          <div className={cx("commModEmpty")}>
            <div className={styles.emptyIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className={styles.emptyTitle}>Queue is clear</div>
            <div className={styles.emptySub}>
              No threads, replies, or feature requests pending review.
            </div>
          </div>
        ) : (
          <div className={cx("commModList")}>
            {items.map((item) => {
              const busy = processingId === item.id;
              return (
                <div key={item.id} className={cx("commModItem")}>
                  {/* Type + category badges */}
                  <div className={cx("commModItemType")}>
                    <span className={cx("badge", typeBadgeClass(item.type))}>
                      {typeLabel(item.type)}
                    </span>
                    <span className={cx("badge", "commModCategoryBadge")}>
                      {item.category}
                    </span>
                  </div>

                  {/* Content preview */}
                  <div className={cx("commModPreview")}>{itemPreview(item)}</div>

                  {/* Meta row */}
                  <div className={cx("commModMeta")}>
                    <span className={cx("commModRealName")}>{displayAuthor(item)}</span>
                    <span className={cx("colorMuted", "text12")}>·</span>
                    <span className={cx("colorMuted", "text12")}>{fmtRelative(item.createdAt)}</span>
                  </div>

                  {/* Actions */}
                  <div className={cx("commModActions")}>
                    <button
                      type="button"
                      className={cx("commModApproveBtn")}
                      disabled={busy || processingId !== null}
                      onClick={() => void handleAction(item, "approve")}
                    >
                      {busy ? "…" : "Approve"}
                    </button>
                    <button
                      type="button"
                      className={cx("commModRejectBtn")}
                      disabled={busy || processingId !== null}
                      onClick={() => void handleAction(item, "reject")}
                    >
                      {busy ? "…" : "Reject"}
                    </button>
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

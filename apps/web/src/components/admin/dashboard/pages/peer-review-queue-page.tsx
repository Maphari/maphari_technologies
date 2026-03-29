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
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";

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

  const pending   = reviews.filter((r) => r.status === "PENDING").length;
  const completed = reviews.filter((r) => r.status === "SUBMITTED").length;
  const overdue   = reviews.filter((r) => {
    if (r.status === "SUBMITTED") return false;
    if (!r.dueAt) return false;
    return new Date(r.dueAt).getTime() < Date.now();
  }).length;
  const avgScore = 0; // no score in current model

  const weekCounts = reviews.reduce<Record<string, number>>((acc, r) => {
    if (!r.dueAt) return acc;
    const week = new Date(r.dueAt).toLocaleDateString("en-ZA", { month: "short", day: "numeric" });
    acc[week] = (acc[week] ?? 0) + 1;
    return acc;
  }, {});
  const chartData = Object.entries(weekCounts).slice(-6).map(([name, value]) => ({ name, value }));

  const tableRows = reviews.map((r) => ({
    id: r.id,
    reviewerId: r.reviewerId.slice(0, 8),
    revieweeId: r.revieweeId.slice(0, 8),
    projectId: r.projectId ? r.projectId.slice(0, 8) : "—",
    status: r.status,
    dueAt: r.dueAt,
  })) as unknown as Record<string, unknown>[];

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>LIFECYCLE / PEER REVIEW</div>
          <h1 className={styles.pageTitle}>Peer Review Queue</h1>
          <div className={styles.pageSub}>Review pipeline · Quality scores · Turnaround time</div>
        </div>
      </div>

      {/* ── Row 1: Stats ── */}
      <WidgetGrid>
        <StatWidget label="Reviews Pending" value={pending} tone="amber" sparkData={[2, 3, 4, 3, 5, 4, 6, pending]} />
        <StatWidget label="Completed This Week" value={completed} tone="green" progressValue={reviews.length > 0 ? Math.round((completed / reviews.length) * 100) : 0} />
        <StatWidget label="Avg Score" value={avgScore > 0 ? `${avgScore}%` : "—"} sub="no score data" />
        <StatWidget label="Overdue" value={overdue} tone={overdue > 0 ? "red" : "default"} progressValue={reviews.length > 0 ? Math.round((overdue / reviews.length) * 100) : 0} />
      </WidgetGrid>

      {/* ── Row 2: Chart + Pipeline ── */}
      <WidgetGrid>
        <ChartWidget
          label="Reviews by Week"
          type="bar"
          data={chartData.length > 0 ? chartData : [{ name: "No data", value: 0 }]}
          dataKey="value"
          xKey="name"
          color="#8b6fff"
        />
        <PipelineWidget
          label="Review Stages"
          stages={[
            { label: "Requested", count: pending, total: reviews.length, color: "#f5a623" },
            { label: "In Review", count: Math.max(0, reviews.length - pending - completed), total: reviews.length, color: "#8b6fff" },
            { label: "Completed", count: completed, total: reviews.length, color: "#34d98b" },
          ]}
        />
      </WidgetGrid>

      {/* ── Row 3: Table ── */}
      <WidgetGrid>
        <TableWidget
          label="Review Queue"
          rows={tableRows}
          rowKey="id"
          emptyMessage="No peer reviews found."
          columns={[
            { key: "reviewerId", header: "Reviewer", render: (_v, row) => <span style={{ fontWeight: 600 }}>{String(row.reviewerId ?? "")}…</span> },
            { key: "revieweeId", header: "Reviewee", render: (_v, row) => <span className={cx("colorMuted")}>{String(row.revieweeId ?? "")}…</span> },
            { key: "projectId", header: "Project", render: (_v, row) => <span className={cx("text12", "colorMuted")}>{String(row.projectId ?? "—")}{row.projectId !== "—" ? "…" : ""}</span> },
            { key: "status", header: "Status", align: "right", render: (_v, row) => <span className={cx("badge", statusBadge(String(row.status ?? "")))}>{statusLabel(String(row.status ?? ""))}</span> },
            { key: "dueAt", header: "Priority", align: "right", render: (_v, row) => <span className={cx("badge", priorityBadge(row.dueAt as string | null))}>{priorityLabel(row.dueAt as string | null)}</span> },
          ]}
        />
      </WidgetGrid>
    </div>
  );
}

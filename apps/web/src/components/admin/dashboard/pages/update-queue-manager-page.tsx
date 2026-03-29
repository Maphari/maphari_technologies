// ════════════════════════════════════════════════════════════════════════════
// update-queue-manager-page.tsx — Admin update queue wired to real API
// Data   : loadContentSubmissionsWithRefresh → GET /admin/content-submissions
//          approveContentSubmissionWithRefresh → PATCH /:id/approve
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useCallback, useEffect, useState } from "react";
import { cx, styles } from "../style";
import { colorClass } from "./admin-page-utils";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import type { AdminContentSubmission } from "../../../../lib/api/admin/governance";
import {
  loadContentSubmissionsWithRefresh,
  approveContentSubmissionWithRefresh
} from "../../../../lib/api/admin/governance";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  session: AuthSession | null;
  onNotify: (tone: "success" | "error" | "warning" | "info", msg: string) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function confidenceBadge(status: string): number {
  if (status === "APPROVED") return 95;
  if (status === "REJECTED") return 40;
  return 80;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function UpdateQueueManagerPage({ session, onNotify }: Props) {
  const [submissions, setSubmissions] = useState<AdminContentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) { setLoading(false); return; }
    setError(null);
    try {
      const r = await loadContentSubmissionsWithRefresh(session);
      if (r.nextSession) saveSession(r.nextSession);
      if (r.error) { setError(r.error.message ?? "Failed to load."); }
      else setSubmissions(r.data ?? []);
    } catch (err: unknown) {
      setError((err as Error)?.message ?? "Failed to load.");
    } finally {
      setLoading(false);
    }
  }, [session, onNotify]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await load();
      if (cancelled) return;
    })();
    return () => { cancelled = true; };
  }, [load]);

  const handleApprove = useCallback(async (id: string) => {
    if (!session) return;
    setProcessing(id);
    const r = await approveContentSubmissionWithRefresh(session, id, { approved: true });
    if (r.nextSession) saveSession(r.nextSession);
    if (r.error) {
      onNotify("error", r.error.message);
    } else {
      onNotify("success", "Submission approved.");
      setSubmissions((prev) => prev.map((s) => s.id === id ? { ...s, status: "APPROVED", approvedAt: new Date().toISOString() } : s));
    }
    setProcessing(null);
  }, [session, onNotify]);

  const handleReject = useCallback(async (id: string) => {
    if (!session) return;
    setProcessing(id);
    const r = await approveContentSubmissionWithRefresh(session, id, { approved: false });
    if (r.nextSession) saveSession(r.nextSession);
    if (r.error) {
      onNotify("error", r.error.message);
    } else {
      onNotify("info", "Submission rejected.");
      setSubmissions((prev) => prev.map((s) => s.id === id ? { ...s, status: "REJECTED", rejectedAt: new Date().toISOString() } : s));
    }
    setProcessing(null);
  }, [session, onNotify]);

  const pending   = submissions.filter((d) => d.status === "PENDING");
  const approved  = submissions.filter((d) => d.status === "APPROVED");
  const avgConf   = submissions.length > 0
    ? Math.round(submissions.reduce((s, d) => s + confidenceBadge(d.status), 0) / submissions.length)
    : 0;

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

  // ── Derived data ──────────────────────────────────────────────────────────
  const rejected   = submissions.filter((d) => d.status === "REJECTED");
  const typeCounts = submissions.reduce<Record<string, number>>((acc, d) => {
    acc[d.type] = (acc[d.type] ?? 0) + 1;
    return acc;
  }, {});
  const chartData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));

  const tableRows = submissions.map((d) => ({
    id: d.id,
    title: d.title,
    submittedByName: d.submittedByName ?? "Unknown",
    type: d.type,
    createdAt: d.createdAt,
    status: d.status,
  })) as unknown as Record<string, unknown>[];

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>LIFECYCLE / UPDATES</div>
          <h1 className={styles.pageTitle}>Update Queue Manager</h1>
          <div className={styles.pageSub}>Client updates · Queue health · Delivery status</div>
        </div>
      </div>

      {/* ── Row 1: Stats ── */}
      <WidgetGrid>
        <StatWidget label="Queue Depth" value={submissions.length} tone="accent" sparkData={[3, 4, 5, 6, 5, 7, 6, submissions.length]} />
        <StatWidget label="Sent Today" value={approved.length} tone="green" progressValue={submissions.length > 0 ? Math.round((approved.length / submissions.length) * 100) : 0} />
        <StatWidget label="Pending" value={pending.length} tone="amber" progressValue={submissions.length > 0 ? Math.round((pending.length / submissions.length) * 100) : 0} />
        <StatWidget label="Overdue" value={rejected.length} tone="red" progressValue={submissions.length > 0 ? Math.round((rejected.length / submissions.length) * 100) : 0} />
      </WidgetGrid>

      {/* ── Row 2: Chart + Pipeline ── */}
      <WidgetGrid>
        <ChartWidget
          label="Updates by Type"
          type="bar"
          data={chartData.length > 0 ? chartData : [{ name: "No data", value: 0 }]}
          dataKey="value"
          xKey="name"
          color="#8b6fff"
        />
        <PipelineWidget
          label="Update Status"
          stages={[
            { label: "Pending Review", count: pending.length, total: submissions.length, color: "#f5a623" },
            { label: "Approved", count: approved.length, total: submissions.length, color: "#34d98b" },
            { label: "Rejected", count: rejected.length, total: submissions.length, color: "#ff5f5f" },
          ]}
        />
      </WidgetGrid>

      {/* ── Row 3: Table ── */}
      <WidgetGrid>
        <TableWidget
          label="Update Queue"
          rows={tableRows}
          rowKey="id"
          emptyMessage="No content submissions found."
          columns={[
            { key: "title", header: "Update", render: (_v, row) => <span style={{ fontWeight: 600 }}>{String(row.title ?? "")}</span> },
            { key: "submittedByName", header: "By", render: (_v, row) => <span className={cx("colorMuted")}>{String(row.submittedByName ?? "—")}</span> },
            { key: "type", header: "Type", render: (_v, row) => <span className={cx("badge")}>{String(row.type ?? "—")}</span> },
            { key: "createdAt", header: "Scheduled", align: "right", render: (_v, row) => <span className={cx("text12", "colorMuted")}>{formatDate(String(row.createdAt ?? ""))}</span> },
            { key: "status", header: "Status", align: "right", render: (_v, row) => {
              const s = String(row.status ?? "");
              return <span className={cx("badge", s === "APPROVED" ? "badgeGreen" : s === "REJECTED" ? "badgeRed" : "badgeAmber")}>{s}</span>;
            }},
            { key: "id", header: "Actions", align: "right", render: (_v, row) => {
              if (String(row.status ?? "") === "PENDING") {
                const isProcessing = processing === String(row.id);
                return (
                  <div className={cx("flexRow", "gap4")} style={{ justifyContent: "flex-end" }}>
                    <button type="button" className={cx("btnSm", "btnAccent")} disabled={isProcessing} onClick={() => void handleApprove(String(row.id))}>
                      {isProcessing ? "…" : "Approve"}
                    </button>
                    <button type="button" className={cx("btnSm", "btnGhost")} disabled={isProcessing} onClick={() => void handleReject(String(row.id))}>
                      Reject
                    </button>
                  </div>
                );
              }
              return <span className={cx("text11", "colorMuted")}>—</span>;
            }},
          ]}
        />
      </WidgetGrid>
    </div>
  );
}

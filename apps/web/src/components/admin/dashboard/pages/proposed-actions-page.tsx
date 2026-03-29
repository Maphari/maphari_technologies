// ════════════════════════════════════════════════════════════════════════════
// proposed-actions-page.tsx — Admin Pending Approvals
// Data     : listProposedActionsWithRefresh    → GET  /admin/proposed-actions
//            approveProposedActionWithRefresh  → PATCH /admin/proposed-actions/:id/approve
//            rejectProposedActionWithRefresh   → PATCH /admin/proposed-actions/:id/reject
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useCallback, useEffect, useState } from "react";
import { cx, styles } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  listProposedActionsWithRefresh,
  approveProposedActionWithRefresh,
  rejectProposedActionWithRefresh,
  type ProposedAction,
} from "../../../../lib/api/admin/proposed-actions";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";

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

  // ── Widget data ─────────────────────────────────────────────────────────
  const pendingCount   = items.length;
  const actionTypeCounts = items.reduce<Record<string, number>>((acc, i) => {
    acc[i.action] = (acc[i.action] ?? 0) + 1;
    return acc;
  }, {});
  const actionChartData = Object.entries(actionTypeCounts).map(([name, value]) => ({ name: formatAction(name).split(" ")[0], value }));
  const resourceTypeCounts = items.reduce<Record<string, number>>((acc, i) => {
    acc[i.resourceType] = (acc[i.resourceType] ?? 0) + 1;
    return acc;
  }, {});
  const uniqueProposers = new Set(items.map((i) => i.proposedBy)).size;

  const tableRows = items.map((i) => ({
    id: i.id,
    action: i.action,
    resourceType: i.resourceType,
    proposedBy: i.proposedByName ?? i.proposedBy,
    createdAt: i.createdAt,
  })) as unknown as Record<string, unknown>[];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={styles.pageBody}>
      {error && <p className={styles.errorStateSub}>{error}</p>}

      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>AI/ML / PROPOSED ACTIONS</div>
          <h1 className={styles.pageTitle}>Proposed Actions</h1>
          <div className={styles.pageSub}>Pending approvals · AI recommendations · Action queue</div>
        </div>
      </div>

      {/* ── Row 1: Stats ── */}
      <WidgetGrid>
        <StatWidget label="Pending Approval" value={pendingCount} tone={pendingCount > 0 ? "amber" : "default"} sparkData={[1, 2, 3, 2, 4, 3, 5, pendingCount]} />
        <StatWidget label="Action Types" value={Object.keys(actionTypeCounts).length} sub="distinct action kinds" />
        <StatWidget label="Proposers" value={uniqueProposers} sub="distinct admin users" />
        <StatWidget label="Resource Types" value={Object.keys(resourceTypeCounts).length} sub="entity types affected" />
      </WidgetGrid>

      {/* ── Row 2: Chart + Pipeline ── */}
      <WidgetGrid>
        <ChartWidget
          label="Actions by Type"
          type="bar"
          data={actionChartData.length > 0 ? actionChartData : [{ name: "No data", value: 0 }]}
          dataKey="value"
          xKey="name"
          color="#8b6fff"
        />
        <PipelineWidget
          label="Action Queue"
          stages={[
            { label: "Pending", count: pendingCount, total: Math.max(pendingCount, 1), color: "#f5a623" },
            { label: "Approved", count: 0, total: Math.max(pendingCount, 1), color: "#34d98b" },
            { label: "Rejected", count: 0, total: Math.max(pendingCount, 1), color: "#ff5f5f" },
          ]}
        />
      </WidgetGrid>

      {/* ── Row 3: Table ── */}
      <WidgetGrid>
        <TableWidget
          label="Pending Actions"
          rows={tableRows}
          rowKey="id"
          emptyMessage="All clear — no pending approvals."
          columns={[
            { key: "action", header: "Action", render: (_v, row) => <span style={{ fontWeight: 600 }}>{formatAction(String(row.action ?? ""))}</span> },
            { key: "resourceType", header: "Resource", render: (_v, row) => <span className={cx("badge")}>{String(row.resourceType ?? "")}</span> },
            { key: "proposedBy", header: "Proposed By", render: (_v, row) => <span className={cx("colorMuted")}>{String(row.proposedBy ?? "")}</span> },
            { key: "createdAt", header: "When", align: "right", render: (_v, row) => <span className={cx("text12", "colorMuted")}>{timeAgo(String(row.createdAt ?? ""))}</span> },
          ]}
        />
      </WidgetGrid>

      {/* ── Approval cards ── */}
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

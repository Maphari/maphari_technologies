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
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";

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
  const overdue  = handovers.filter((h) => {
    if (["COMPLETE", "COMPLETED"].includes(h.status.toUpperCase())) return false;
    if (!h.transferDate) return false;
    return new Date(h.transferDate).getTime() < Date.now();
  }).length;

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

  // ── Derived chart data ────────────────────────────────────────────────────
  const monthCounts = handovers.reduce<Record<string, number>>((acc, h) => {
    if (!h.transferDate) return acc;
    const month = new Date(h.transferDate).toLocaleDateString("en-ZA", { month: "short", year: "2-digit" });
    acc[month] = (acc[month] ?? 0) + 1;
    return acc;
  }, {});
  const chartData = Object.entries(monthCounts).slice(-6).map(([name, value]) => ({ name, value }));

  const tableRows = handovers.map((h) => ({
    id: h.id,
    from: h.fromStaffName ?? "—",
    to: h.toStaffName ?? "—",
    project: h.projectId ?? h.clientId ?? "—",
    status: h.status,
    transferDate: h.transferDate ?? null,
  })) as unknown as Record<string, unknown>[];

  return (
    <div className={styles.pageBody}>
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>KNOWLEDGE / HANDOVERS</div>
          <h1 className={styles.pageTitle}>Handover Management</h1>
          <div className={styles.pageSub}>Active handovers · Completion rate · Knowledge transfer</div>
        </div>
        <button type="button" className={cx("btnSm", "btnAccent")}>+ New Handover</button>
      </div>

      {/* ── Row 1: Stats ── */}
      <WidgetGrid>
        <StatWidget label="Active Handovers" value={active} tone="amber" sparkData={[2, 3, 2, 4, 3, 5, 4, active]} />
        <StatWidget label="Completed" value={complete} tone="green" progressValue={handovers.length > 0 ? Math.round((complete / handovers.length) * 100) : 0} />
        <StatWidget label="Overdue" value={overdue} tone="red" progressValue={handovers.length > 0 ? Math.round((overdue / handovers.length) * 100) : 0} />
        <StatWidget label="Avg Completion Time" value="—" sub="days (no data)" />
      </WidgetGrid>

      {/* ── Row 2: Chart + Pipeline ── */}
      <WidgetGrid>
        <ChartWidget
          label="Handovers by Month"
          type="bar"
          data={chartData.length > 0 ? chartData : [{ name: "No data", value: 0 }]}
          dataKey="value"
          xKey="name"
          color="#8b6fff"
        />
        <PipelineWidget
          label="Handover Stages"
          stages={[
            { label: "Initiated", count: pending, total: handovers.length, color: "#f5a623" },
            { label: "In Progress", count: active, total: handovers.length, color: "#8b6fff" },
            { label: "Review", count: Math.max(0, handovers.length - pending - active - complete), total: handovers.length, color: "#60a5fa" },
            { label: "Completed", count: complete, total: handovers.length, color: "#34d98b" },
          ]}
        />
      </WidgetGrid>

      {/* ── Row 3: Table ── */}
      <WidgetGrid>
        <TableWidget
          label="All Handovers"
          rows={tableRows}
          rowKey="id"
          columns={[
            { key: "from", header: "From", render: (_v, row) => <span style={{ fontWeight: 600 }}>{String(row.from ?? "—")}</span> },
            { key: "to", header: "To", render: (_v, row) => <span className={cx("colorMuted")}>{String(row.to ?? "—")}</span> },
            { key: "project", header: "Project / Client", render: (_v, row) => <span className={cx("text12")}>{String(row.project ?? "—")}</span> },
            { key: "status", header: "Status", align: "right", render: (_v, row) => <span className={cx("badge", statusBadge(String(row.status ?? "")))}>{statusLabel(String(row.status ?? ""))}</span> },
            { key: "transferDate", header: "Due Date", align: "right", render: (_v, row) => <span className={cx("text12", "colorMuted")}>{formatDate(row.transferDate as string | null)}</span> },
            {
              key: "id", header: "Actions", align: "right",
              render: (_v, row) => {
                const s = String(row.status ?? "").toUpperCase();
                if (s === "PENDING" || s === "IN_PROGRESS") {
                  return (
                    <button type="button" className={cx("btnSm", "btnAccent")} disabled={updating === String(row.id)} onClick={() => void handleComplete(String(row.id))}>
                      {updating === String(row.id) ? "…" : "Complete"}
                    </button>
                  );
                }
                return <span className={cx("text11", "colorMuted")}>—</span>;
              },
            },
          ]}
        />
      </WidgetGrid>
    </div>
  );
}

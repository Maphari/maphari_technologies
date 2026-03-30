"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchCloseoutReports, approveCloseoutReport, type CloseoutReport } from "../../../../lib/api/admin/closeout";
import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import { cx, styles } from "../style";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";

export function CloseoutReviewPage() {
  const { session } = useAdminWorkspaceContext();
  const [reports, setReports] = useState<CloseoutReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const result = await fetchCloseoutReports(session);
      if (result.error) {
        setError(result.error.message);
      } else {
        setReports(result.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleApprove(id: string) {
    if (!session) return;
    setApprovingId(id);
    const result = await approveCloseoutReport(session, id, "APPROVED");
    if (result.data) {
      setReports((prev) => prev.map((r) => (r.id === id ? result.data! : r)));
    }
    setApprovingId(null);
  }

  const pending    = reports.filter((r) => r.status === "PENDING_REVIEW").length;
  const approved   = reports.filter((r) => r.status === "APPROVED").length;
  const changes    = reports.filter((r) => r.status === "CHANGES_REQUESTED").length;
  const lessonsTotal = reports.reduce((s, r) => s + (r.lessonsCount ?? 0), 0);

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

  // ── Derived chart data ──────────────────────────────────────────────────────
  const monthCounts = reports.reduce<Record<string, number>>((acc, r) => {
    const month = new Date(r.createdAt).toLocaleDateString("en-ZA", { month: "short", year: "2-digit" });
    acc[month] = (acc[month] ?? 0) + 1;
    return acc;
  }, {});
  const chartData = Object.entries(monthCounts).slice(-6).map(([name, value]) => ({ name, value }));

  const tableRows = reports.map((r) => ({
    id: r.id,
    projectName: r.projectName,
    clientName: r.clientName,
    status: r.status,
    createdAt: r.createdAt,
    budgetVariance: r.budgetVariance,
  })) as unknown as Record<string, unknown>[];

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>KNOWLEDGE / CLOSEOUT</div>
          <h1 className={styles.pageTitle}>Closeout Review</h1>
          <div className={styles.pageSub}>Project closeouts · Learnings · Documentation</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnGhost")} onClick={() => void load()} disabled={loading}>
            {loading ? "Loading…" : "↻ Refresh"}
          </button>
        </div>
      </div>

      {/* ── Row 1: Stats ── */}
      <WidgetGrid>
        <StatWidget label="Closeouts This Month" value={reports.length} tone="accent" sparkData={[2, 3, 4, 3, 5, 4, 6, reports.length]} />
        <StatWidget label="Avg Score" value="—" sub="no score data" />
        <StatWidget label="Pending Reviews" value={pending} tone="amber" progressValue={reports.length > 0 ? Math.round((pending / reports.length) * 100) : 0} />
        <StatWidget label="Lessons Captured" value={lessonsTotal} tone="green" sub="total lessons" />
      </WidgetGrid>

      {/* ── Row 2: Chart + Pipeline ── */}
      <WidgetGrid>
        <ChartWidget
          label="Closeouts by Month"
          type="bar"
          data={chartData.length > 0 ? chartData : [{ name: "No data", value: 0 }]}
          dataKey="value"
          xKey="name"
          color="#8b6fff"
        />
        <PipelineWidget
          label="Review Stages"
          stages={[
            { label: "Pending Review", count: pending, total: reports.length, color: "#f5a623" },
            { label: "Changes Requested", count: changes, total: reports.length, color: "#ff5f5f" },
            { label: "Approved", count: approved, total: reports.length, color: "#34d98b" },
          ]}
        />
      </WidgetGrid>

      {/* ── Row 3: Table ── */}
      <WidgetGrid>
        <TableWidget
          label="Close-out Reports"
          rows={tableRows}
          rowKey="id"
          columns={[
            { key: "projectName", header: "Project", render: (_v, row) => <span style={{ fontWeight: 600 }}>{String(row.projectName ?? "")}</span> },
            { key: "clientName", header: "Client", render: (_v, row) => <span className={cx("colorMuted")}>{String(row.clientName ?? "")}</span> },
            { key: "budgetVariance", header: "Budget Δ", align: "right", render: (_v, row) => {
              const v = String(row.budgetVariance ?? "—");
              return <span className={cx("fontMono", "fw600", v.startsWith("+") ? "colorRed" : "colorGreen")}>{v}</span>;
            }},
            { key: "createdAt", header: "Date", align: "right", render: (_v, row) => <span className={cx("text12", "colorMuted")}>{new Date(String(row.createdAt ?? "")).toLocaleDateString("en-ZA", { month: "short", day: "numeric", year: "numeric" })}</span> },
            { key: "status", header: "Status", align: "right", render: (_v, row) => {
              const s = String(row.status ?? "");
              const cls = s === "APPROVED" ? "badgeGreen" : s === "CHANGES_REQUESTED" ? "badgeRed" : "badgeAmber";
              const label = s === "PENDING_REVIEW" ? "Pending" : s === "APPROVED" ? "Approved" : "Changes";
              return <span className={cx("badge", cls)}>{label}</span>;
            }},
            { key: "id", header: "Actions", align: "right", render: (_v, row) => {
              if (String(row.status ?? "") === "PENDING_REVIEW") {
                return (
                  <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => void handleApprove(String(row.id))} disabled={approvingId === String(row.id)}>
                    {approvingId === String(row.id) ? "…" : "Approve"}
                  </button>
                );
              }
              return <span className={cx("text11", "colorMuted")}>—</span>;
            }},
          ]}
        />
      </WidgetGrid>

      {/* ── Error state ── */}
      {!loading && error && (
        <div className={cx(styles.card, styles.cardInner)}>
          <div className={cx("text13", "colorRed", "mb8")}>Failed to load reports</div>
          <div className={cx("text12", "colorMuted", "mb16")}>{error}</div>
          <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => void load()}>Retry</button>
        </div>
      )}
    </div>
  );
}

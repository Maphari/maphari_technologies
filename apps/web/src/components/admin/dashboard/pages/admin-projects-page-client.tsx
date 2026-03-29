"use client";

import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import { cx, styles } from "../style";
import { formatStatus } from "@/lib/utils/format-status";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";

export function AdminProjectsPageClient() {
  const { snapshot, loading } = useAdminWorkspaceContext();
  const clientsById = new Map(snapshot.clients.map((c) => [c.id, c.name]));
  const projects = snapshot.projects;

  const total = projects.length;
  const inProgress = projects.filter((p) => p.status === "IN_PROGRESS").length;
  const blocked = projects.filter((p) => p.status === "BLOCKED" || p.status === "ON_HOLD").length;
  const completed = projects.filter((p) => p.status === "COMPLETED" || p.status === "DONE").length;

  // Health breakdown for pipeline
  const lowRisk = projects.filter((p) => p.riskLevel === "LOW").length;
  const mediumRisk = projects.filter((p) => p.riskLevel === "MEDIUM").length;
  const highRisk = projects.filter((p) => p.riskLevel === "HIGH").length;

  // Chart data: projects by status
  const statusBuckets = [
    { label: "In Progress", count: inProgress },
    { label: "Blocked", count: blocked },
    { label: "Completed", count: completed },
    { label: "Other", count: total - inProgress - blocked - completed },
  ].filter((b) => b.count > 0);

  const tableRows = projects.map((p) => ({
    id: p.id,
    name: p.name,
    client: clientsById.get(p.clientId) ?? p.clientId.slice(0, 8).toUpperCase(),
    status: formatStatus(p.status),
    _statusRaw: p.status,
    progress: `${p.progressPercent}%`,
    due: p.dueAt ? p.dueAt.slice(0, 10) : "—",
  }));

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

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>OPERATIONS / PROJECTS</div>
          <h1 className={styles.pageTitle}>Projects</h1>
          <div className={styles.pageSub}>Project portfolio · Status breakdown · Delivery health</div>
        </div>
      </div>

      {/* Row 1 — 4 stat widgets */}
      <WidgetGrid>
        <StatWidget
          label="Total Projects"
          value={total}
          sub={`Across ${snapshot.clients.length} clients`}
          tone="accent"
        />
        <StatWidget
          label="In Progress"
          value={inProgress}
          sub="Currently active"
          tone={inProgress > 0 ? "accent" : "default"}
        />
        <StatWidget
          label="Blocked / On Hold"
          value={blocked}
          sub="Needs resolution"
          tone={blocked > 0 ? "amber" : "default"}
        />
        <StatWidget
          label="Completed"
          value={completed}
          sub="Delivered"
          tone={completed > 0 ? "green" : "default"}
        />
      </WidgetGrid>

      {/* Row 2 — bar chart + health pipeline */}
      <WidgetGrid>
        <ChartWidget
          label="Projects by Status"
          data={statusBuckets}
          dataKey="count"
          type="bar"
          color="#8b6fff"
          xKey="label"
        />
        <PipelineWidget
          label="Project Health Breakdown"
          stages={[
            { label: "Low Risk", count: lowRisk || 0, total: total || 1, color: "#34d98b" },
            { label: "Medium Risk", count: mediumRisk || 0, total: total || 1, color: "#f5a623" },
            { label: "High Risk", count: highRisk || 0, total: total || 1, color: "#ff5f5f" },
          ]}
        />
      </WidgetGrid>

      {/* Row 3 — projects table */}
      <WidgetGrid>
        <TableWidget
          label="Project List"
          rows={tableRows as Record<string, unknown>[]}
          rowKey="id"
          emptyMessage="No projects found."
          columns={[
            { key: "name", header: "Project", align: "left" },
            { key: "client", header: "Client", align: "left" },
            {
              key: "status",
              header: "Status",
              align: "left",
              render: (_v, row) => {
                const raw = (row as { _statusRaw: string })._statusRaw;
                const badgeCls =
                  raw === "IN_PROGRESS" ? cx("badgeAccent")
                  : raw === "COMPLETED" || raw === "DONE" ? cx("badgeGreen")
                  : raw === "BLOCKED" ? cx("badgeRed")
                  : raw === "ON_HOLD" ? cx("badgeAmber")
                  : cx("badgeMuted");
                return <span className={badgeCls}>{String(_v)}</span>;
              },
            },
            { key: "progress", header: "Progress", align: "right" },
            { key: "due", header: "Due Date", align: "right" },
          ]}
        />
      </WidgetGrid>
    </div>
  );
}

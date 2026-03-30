"use client";

import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import { cx, styles } from "../style";
import { formatStatus } from "@/lib/utils/format-status";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";

export function AdminLeadsPageClient() {
  const { snapshot, loading, moveLead, transitioningLeadId } = useAdminWorkspaceContext();

  const leads = snapshot.leads;
  const total = leads.length;
  const wonLeads = leads.filter((l) => l.status === "WON");
  const qualifiedLeads = leads.filter((l) => l.status === "QUALIFIED" || l.status === "PROPOSAL" || l.status === "WON");
  const winRate = total > 0 ? Math.round((wonLeads.length / total) * 100) : 0;

  // New this month (created in current calendar month)
  const currentMonthPrefix = new Date().toISOString().slice(0, 7);
  const newThisMonth = leads.filter((l) => l.createdAt.startsWith(currentMonthPrefix)).length;

  // Chart data: leads by stage
  const stageLabels: Array<{ key: string; label: string }> = [
    { key: "NEW", label: "New" },
    { key: "CONTACTED", label: "Contacted" },
    { key: "QUALIFIED", label: "Qualified" },
    { key: "PROPOSAL", label: "Proposal" },
    { key: "WON", label: "Won" },
    { key: "LOST", label: "Lost" },
  ];
  const chartData = stageLabels.map(({ key, label }) => ({
    label,
    count: leads.filter((l) => l.status === key).length,
  }));

  const tableRows = leads.map((lead) => ({
    name: lead.company ?? lead.title,
    contact: lead.contactName ?? "—",
    source: lead.source ?? "—",
    value: lead.title,
    status: formatStatus(lead.status),
    _statusRaw: lead.status,
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
          <div className={styles.pageEyebrow}>OPERATIONS / LEADS</div>
          <h1 className={styles.pageTitle}>Leads</h1>
          <div className={styles.pageSub}>Lead pipeline · Qualification rate · Source breakdown</div>
        </div>
      </div>

      {/* Row 1 — 4 stat widgets */}
      <WidgetGrid>
        <StatWidget
          label="Total Leads"
          value={total}
          sub={`${newThisMonth} new this month`}
          tone="accent"
        />
        <StatWidget
          label="New This Month"
          value={newThisMonth}
          sub="Added in current month"
          tone="default"
        />
        <StatWidget
          label="Qualified"
          value={qualifiedLeads.length}
          sub="Qualified + Proposal + Won"
          tone={qualifiedLeads.length > 0 ? "accent" : "default"}
        />
        <StatWidget
          label="Win Rate"
          value={`${winRate}%`}
          sub={`${wonLeads.length} won of ${total}`}
          tone={winRate >= 30 ? "accent" : "amber"}
          progressValue={winRate}
        />
      </WidgetGrid>

      {/* Row 2 — bar chart + pipeline */}
      <WidgetGrid>
        <ChartWidget
          label="Leads by Stage"
          data={chartData}
          dataKey="count"
          type="bar"
          color="#8b6fff"
          xKey="label"
        />
        <PipelineWidget
          label="Pipeline Stages"
          stages={[
            { label: "New", count: leads.filter((l) => l.status === "NEW").length || 0, total: total || 1, color: "#8b6fff" },
            { label: "Contacted", count: leads.filter((l) => l.status === "CONTACTED").length || 0, total: total || 1, color: "#60a5fa" },
            { label: "Qualified", count: leads.filter((l) => l.status === "QUALIFIED").length || 0, total: total || 1, color: "#f5a623" },
            { label: "Proposal", count: leads.filter((l) => l.status === "PROPOSAL").length || 0, total: total || 1, color: "#34d98b" },
            { label: "Won / Lost", count: wonLeads.length || 0, total: total || 1, color: "#c8f135" },
          ]}
        />
      </WidgetGrid>

      {/* Row 3 — leads table with advance action */}
      <WidgetGrid>
        <TableWidget
          label="Leads"
          rows={tableRows as Record<string, unknown>[]}
          rowKey="name"
          emptyMessage="No leads found."
          columns={[
            { key: "name", header: "Name / Company", align: "left" },
            { key: "contact", header: "Contact", align: "left" },
            { key: "source", header: "Source", align: "left" },
            { key: "value", header: "Title", align: "left" },
            {
              key: "status",
              header: "Status",
              align: "right",
              render: (_v, row) => {
                const raw = (row as { _statusRaw: string })._statusRaw;
                const badgeCls =
                  raw === "WON" ? cx("badgeGreen")
                  : raw === "LOST" ? cx("badgeRed")
                  : raw === "PROPOSAL" ? cx("badgeAmber")
                  : raw === "QUALIFIED" ? cx("badgeAccent")
                  : cx("badgeMuted");
                return <span className={badgeCls}>{String(_v)}</span>;
              },
            },
            {
              key: "_statusRaw",
              header: "Action",
              align: "right",
              render: (_v, row) => {
                const lead = leads.find((l) => l.title === (row as { value: string }).value);
                if (!lead || lead.status === "WON" || lead.status === "LOST") return null;
                return (
                  <button
                    type="button"
                    className={cx("btnSm", "btnGhost")}
                    disabled={transitioningLeadId === lead.id}
                    onClick={() =>
                      void moveLead(
                        lead.id,
                        lead.status === "NEW" ? "CONTACTED"
                          : lead.status === "CONTACTED" ? "QUALIFIED"
                          : lead.status === "QUALIFIED" ? "PROPOSAL"
                          : "WON"
                      )
                    }
                  >
                    {transitioningLeadId === lead.id ? "Saving…" : "Advance"}
                  </button>
                );
              },
            },
          ]}
        />
      </WidgetGrid>
    </div>
  );
}

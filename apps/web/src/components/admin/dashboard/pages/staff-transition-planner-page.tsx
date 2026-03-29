"use client";

import { cx, styles } from "../style";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";

const transitions: Array<{ id: string; staff: string; from: string; to: string; type: string; status: "In Progress" | "Complete" | "Planning"; effectiveDate: string; handovers: number; knowledgeTransfer: number }> = [];

export function StaffTransitionPlannerPage() {
  const active    = transitions.filter((t) => t.status === "In Progress").length;
  const complete  = transitions.filter((t) => t.status === "Complete").length;
  const atRisk    = transitions.filter((t) => t.status === "In Progress" && t.knowledgeTransfer < 50).length;
  const avgGap    = transitions.length > 0
    ? Math.round(transitions.reduce((s, t) => s + (100 - t.knowledgeTransfer), 0) / transitions.length)
    : 0;

  const typeCounts = transitions.reduce<Record<string, number>>((acc, t) => {
    acc[t.type] = (acc[t.type] ?? 0) + 1;
    return acc;
  }, {});
  const chartData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));

  const tableRows = transitions as unknown as Record<string, unknown>[];

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>KNOWLEDGE / TRANSITIONS</div>
          <h1 className={styles.pageTitle}>Staff Transition Planner</h1>
          <div className={styles.pageSub}>Role transitions · Succession planning · Knowledge gaps</div>
        </div>
        <button type="button" className={cx("btnSm", "btnAccent")}>+ New Transition</button>
      </div>

      {/* ── Row 1: Stats ── */}
      <WidgetGrid>
        <StatWidget label="Active Transitions" value={active} tone="amber" sparkData={[1, 2, 1, 3, 2, 4, 3, active]} />
        <StatWidget label="Completed" value={complete} tone="green" progressValue={transitions.length > 0 ? Math.round((complete / transitions.length) * 100) : 0} />
        <StatWidget label="At Risk" value={atRisk} tone="red" progressValue={transitions.length > 0 ? Math.round((atRisk / transitions.length) * 100) : 0} />
        <StatWidget label="Knowledge Gap Score" value={`${avgGap}%`} sub="avg gap" />
      </WidgetGrid>

      {/* ── Row 2: Chart + Pipeline ── */}
      <WidgetGrid>
        <ChartWidget
          label="Transitions by Type"
          type="bar"
          data={chartData.length > 0 ? chartData : [{ name: "No data", value: 0 }]}
          dataKey="value"
          xKey="name"
          color="#8b6fff"
        />
        <PipelineWidget
          label="Transition Stages"
          stages={[
            { label: "Planning", count: transitions.filter((t) => t.status === "Planning").length, total: transitions.length, color: "#f5a623" },
            { label: "In Progress", count: active, total: transitions.length, color: "#8b6fff" },
            { label: "Completed", count: complete, total: transitions.length, color: "#34d98b" },
          ]}
        />
      </WidgetGrid>

      {/* ── Row 3: Table ── */}
      <WidgetGrid>
        <TableWidget
          label="All Transitions"
          rows={tableRows}
          rowKey="id"
          emptyMessage="No transitions recorded yet."
          columns={[
            { key: "staff", header: "Staff Member", render: (_v, row) => <span style={{ fontWeight: 600 }}>{String(row.staff ?? "")}</span> },
            { key: "from", header: "From Role", render: (_v, row) => <span className={cx("text12", "colorMuted")}>{String(row.from ?? "")}</span> },
            { key: "to", header: "To Role", render: (_v, row) => <span className={cx("text12")}>{String(row.to ?? "")}</span> },
            { key: "status", header: "Status", align: "right", render: (_v, row) => {
              const s = String(row.status ?? "");
              return <span className={cx("badge", s === "Complete" ? "badgeGreen" : s === "In Progress" ? "badgeAmber" : "badgeRed")}>{s}</span>;
            }},
            { key: "effectiveDate", header: "Timeline", align: "right", render: (_v, row) => <span className={cx("text12", "colorMuted")}>{String(row.effectiveDate ?? "—")}</span> },
            { key: "knowledgeTransfer", header: "Knowledge %", align: "right", render: (_v, row) => {
              const v = Number(row.knowledgeTransfer ?? 0);
              return <span className={cx("fontMono", "fw600", v >= 80 ? "colorGreen" : "colorAmber")}>{v}%</span>;
            }},
          ]}
        />
      </WidgetGrid>
    </div>
  );
}

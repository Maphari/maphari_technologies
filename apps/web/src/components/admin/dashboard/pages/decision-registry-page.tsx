// ════════════════════════════════════════════════════════════════════════════
// decision-registry-page.tsx — Admin Decision Registry
// Data     : loadDecisionRecordsWithRefresh → GET /admin/decision-records
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useState, useEffect } from "react";
import { cx, styles } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadDecisionRecordsWithRefresh,
  type AdminDecisionRecord,
} from "../../../../lib/api/admin";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";

// ── Helpers ───────────────────────────────────────────────────────────────────
function statusBadge(status: string) {
  const s = status.toUpperCase();
  if (s === "ACTIVE")       return "badgeGreen";
  if (s === "SUPERSEDED")   return "badge";
  if (s === "IMPLEMENTED")  return "badgePurple";
  if (s === "REVERSED")     return "badgeRed";
  return "badgeAmber"; // DRAFT / PENDING
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

// ── Component ─────────────────────────────────────────────────────────────────
export function DecisionRegistryPage({ session }: { session: AuthSession | null }) {
  const [decisions, setDecisions] = useState<AdminDecisionRecord[]>([]);

  useEffect(() => {
    if (!session) return;
    void loadDecisionRecordsWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) setDecisions(r.data);
    });
  }, [session]);

  const active      = decisions.filter((d) => d.status.toUpperCase() === "ACTIVE").length;
  const pending     = decisions.filter((d) => ["DRAFT", "PENDING"].includes(d.status.toUpperCase())).length;
  const implemented = decisions.filter((d) => d.status.toUpperCase() === "IMPLEMENTED").length;
  const reversed    = decisions.filter((d) => ["SUPERSEDED", "REVERSED"].includes(d.status.toUpperCase())).length;

  // ── Derived chart data ─────────────────────────────────────────────────
  const tagCounts = decisions.reduce<Record<string, number>>((acc, d) => {
    const tag = d.tags ? d.tags.split(",")[0]?.trim() ?? "Other" : "Other";
    acc[tag] = (acc[tag] ?? 0) + 1;
    return acc;
  }, {});
  const chartData = Object.entries(tagCounts).slice(0, 8).map(([name, value]) => ({ name, value }));

  return (
    <div className={styles.pageBody}>
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>KNOWLEDGE / DECISIONS</div>
          <h1 className={styles.pageTitle}>Decision Registry</h1>
          <div className={styles.pageSub}>Strategic decisions · Owners · Outcomes</div>
        </div>
        <button type="button" className={cx("btnSm", "btnAccent")}>+ Record Decision</button>
      </div>

      {/* ── Row 1: Stats ── */}
      <WidgetGrid>
        <StatWidget label="Total Decisions" value={decisions.length} tone="accent" sparkData={[5, 8, 10, 12, 15, 16, 18, decisions.length]} />
        <StatWidget label="Pending" value={pending} tone="amber" progressValue={decisions.length > 0 ? Math.round((pending / decisions.length) * 100) : 0} />
        <StatWidget label="Implemented" value={implemented} tone="green" progressValue={decisions.length > 0 ? Math.round((implemented / decisions.length) * 100) : 0} />
        <StatWidget label="Reversed / Deprecated" value={reversed} tone="red" progressValue={decisions.length > 0 ? Math.round((reversed / decisions.length) * 100) : 0} />
      </WidgetGrid>

      {/* ── Row 2: Chart + Pipeline ── */}
      <WidgetGrid>
        <ChartWidget
          label="Decisions by Category"
          type="bar"
          data={chartData.length > 0 ? chartData : [{ name: "No data", value: 0 }]}
          dataKey="value"
          xKey="name"
          color="#8b6fff"
        />
        <PipelineWidget
          label="Decision Status"
          stages={[
            { label: "Proposed", count: pending, total: decisions.length, color: "#f5a623" },
            { label: "Active", count: active, total: decisions.length, color: "#8b6fff" },
            { label: "Implemented", count: implemented, total: decisions.length, color: "#34d98b" },
            { label: "Reversed", count: reversed, total: decisions.length, color: "#ff5f5f" },
          ]}
        />
      </WidgetGrid>

      {/* ── Row 3: Table ── */}
      <WidgetGrid>
        <TableWidget
          label="Decision Log"
          rows={decisions as unknown as Record<string, unknown>[]}
          rowKey="id"
          columns={[
            {
              key: "title", header: "Decision",
              render: (_v, row) => (
                <div>
                  <div style={{ fontWeight: 600 }}>{String(row.title ?? "")}</div>
                  {row.outcome ? <div className={cx("text11", "colorMuted")}>{String(row.outcome)}</div> : null}
                </div>
              ),
            },
            { key: "tags", header: "Category", render: (_v, row) => row.tags ? <span className={cx("badge")}>{String(row.tags).split(",")[0]?.trim()}</span> : <span className={cx("colorMuted")}>—</span> },
            { key: "decidedByName", header: "Owner", align: "right", render: (_v, row) => <span className={cx("colorMuted")}>{String(row.decidedByName ?? "—")}</span> },
            { key: "decidedAt", header: "Date", align: "right", render: (_v, row) => <span className={cx("text12", "colorMuted")}>{formatDate(row.decidedAt as string | null)}</span> },
            { key: "status", header: "Status", align: "right", render: (_v, row) => <span className={cx("badge", statusBadge(String(row.status ?? "")))}>{String(row.status ?? "")}</span> },
          ]}
        />
      </WidgetGrid>
    </div>
  );
}

"use client";

import { useAdminWorkspaceContext } from "../../admin-workspace-context";
import { styles as dashboardStyles } from "../style";
import { formatMoneyCents } from "@/lib/i18n/currency";
import { formatStatus } from "@/lib/utils/format-status";
import { StatWidget, ChartWidget, TableWidget, PipelineWidget, WidgetGrid } from "../widgets";
import widgetStyles from "@/app/style/admin/widgets.module.css";
import { cx } from "../style";

export function AdminBillingPageClient() {
  const { snapshot, loading } = useAdminWorkspaceContext();

  // ── Derived KPIs ────────────────────────────────────────────────────────────
  const invoices = snapshot?.invoices ?? [];
  const payments = snapshot?.payments ?? [];

  const totalInvoiced = invoices.reduce((s, i) => s + i.amountCents, 0);
  const totalPaid     = invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + i.amountCents, 0);
  const outstanding   = invoices
    .filter((i) => i.status === "ISSUED" || i.status === "OVERDUE")
    .reduce((s, i) => s + i.amountCents, 0);
  const overdueCount  = invoices.filter((i) => i.status === "OVERDUE").length;

  // ── Chart data — payments collected by month ────────────────────────────────
  const revenueByMonth = (() => {
    const buckets: Record<string, number> = {};
    for (const p of payments) {
      if (p.status !== "COMPLETED") continue;
      const key = p.paidAt
        ? new Date(p.paidAt).toLocaleDateString("en-US", { month: "short", year: "2-digit" })
        : "Unknown";
      buckets[key] = (buckets[key] ?? 0) + p.amountCents / 100;
    }
    return Object.entries(buckets).map(([label, value]) => ({ label, value }));
  })();

  // ── Pipeline stages — invoice status breakdown ──────────────────────────────
  const paidCount     = invoices.filter((i) => i.status === "PAID").length;
  const issuedCount   = invoices.filter((i) => i.status === "ISSUED").length;
  const draftCount    = invoices.filter((i) => i.status === "DRAFT").length;
  const overdueCountN = invoices.filter((i) => i.status === "OVERDUE").length;
  const total         = invoices.length || 1;

  const invoicePipelineStages = [
    { label: "Paid",    count: paidCount,    total, color: "#34d98b" },
    { label: "Issued",  count: issuedCount,  total, color: "#8b6fff" },
    { label: "Draft",   count: draftCount,   total, color: "#f5a623" },
    { label: "Overdue", count: overdueCountN, total, color: "#ff5f5f" },
  ];

  // ── Table rows ──────────────────────────────────────────────────────────────
  const tableRows = invoices.slice(0, 50).map((inv) => ({
    number:   inv.number,
    client:   inv.clientId.slice(0, 8).toUpperCase(),
    amount:   formatMoneyCents(inv.amountCents, { currency: inv.currency, maximumFractionDigits: 0 }),
    status:   formatStatus(inv.status),
    statusRaw: inv.status,
    dueAt:    inv.dueAt
      ? new Date(inv.dueAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })
      : "—",
  })) as Record<string, unknown>[];

  const fmtK = (cents: number) =>
    cents >= 1_000_000
      ? `R${(cents / 100_000_000).toFixed(2)}m`
      : `R${(cents / 100_000).toFixed(1)}k`;

  return (
    <div className={dashboardStyles.pageBody}>
      {/* ── Header ── */}
      <div className={dashboardStyles.pageHeader}>
        <div>
          <div className={dashboardStyles.pageEyebrow}>FINANCE / BILLING</div>
          <h1 className={dashboardStyles.pageTitle}>Billing</h1>
          <div className={dashboardStyles.pageSub}>Invoice status · Payment health · Outstanding balance</div>
        </div>
      </div>

      {/* ── Row 1: KPI stats ── */}
      <WidgetGrid>
        <StatWidget
          label="Total Invoiced"
          value={loading ? "—" : fmtK(totalInvoiced)}
          sub="All invoices issued"
          tone="accent"
        />
        <StatWidget
          label="Paid"
          value={loading ? "—" : fmtK(totalPaid)}
          sub={`${paidCount} invoice${paidCount !== 1 ? "s" : ""} collected`}
          tone="green"
        />
        <StatWidget
          label="Outstanding"
          value={loading ? "—" : fmtK(outstanding)}
          sub={`${issuedCount} issued, unpaid`}
          tone={outstanding > 0 ? "amber" : "default"}
        />
        <StatWidget
          label="Overdue Count"
          value={loading ? "—" : overdueCount}
          sub="Past due date"
          tone={overdueCount > 0 ? "red" : "default"}
        />
      </WidgetGrid>

      {/* ── Row 2: Chart + Pipeline ── */}
      <WidgetGrid>
        <ChartWidget
          label="Revenue Collected by Month"
          currentValue={revenueByMonth.length > 0 ? `R${(revenueByMonth[revenueByMonth.length - 1]?.value ?? 0).toLocaleString()}` : undefined}
          data={revenueByMonth.length > 0 ? revenueByMonth : [{ label: "No data", value: 0 }]}
          dataKey="value"
          type="area"
          color="#8b6fff"
          xKey="label"
        />
        <PipelineWidget
          label="Invoice Status Breakdown"
          stages={invoicePipelineStages}
        />
      </WidgetGrid>

      {/* ── Row 3: Invoices table ── */}
      <WidgetGrid>
        <TableWidget
          label="Invoices"
          rows={tableRows}
          rowKey="number"
          emptyMessage={loading ? "Loading invoices…" : "No invoices found."}
          columns={[
            { key: "number", header: "Invoice #", align: "left" },
            { key: "client", header: "Client", align: "left" },
            { key: "amount", header: "Amount", align: "right" },
            {
              key: "status",
              header: "Status",
              align: "left",
              render: (val, row) => {
                const raw = (row as { statusRaw: string }).statusRaw;
                const badgeClass =
                  raw === "PAID"    ? cx("badgeGreen")  :
                  raw === "OVERDUE" ? cx("badgeRed")    :
                  raw === "ISSUED"  ? cx("badgeAmber")  :
                  cx("badgeMuted");
                return <span className={badgeClass}>{String(val)}</span>;
              },
            },
            { key: "dueAt", header: "Due Date", align: "right" },
          ]}
        />
      </WidgetGrid>
    </div>
  );
}

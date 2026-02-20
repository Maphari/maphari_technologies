import { cx, styles } from "../style";
import { capitalize } from "../utils";
import type { DashboardStat } from "../types";
import type { InvoiceTab, ProjectInvoiceRow } from "./types";

type InvoicesPageProps = {
  active: boolean;
  invoiceSummaryStats: DashboardStat[];
  invoiceTabs: InvoiceTab[];
  activeInvoiceTab: "all" | "outstanding" | "paid";
  onInvoiceTabChange: (tabId: "all" | "outstanding" | "paid") => void;
  onOpenInvoice: (invoiceId: string) => void;
  onExportInvoices: () => void;
  filteredInvoiceTable: ProjectInvoiceRow[];
};

export function ClientInvoicesPage({
  active,
  invoiceSummaryStats,
  invoiceTabs,
  activeInvoiceTab,
  onInvoiceTabChange,
  onOpenInvoice,
  onExportInvoices,
  filteredInvoiceTable
}: InvoicesPageProps) {
  return (
    <section className={cx("page", active && "pageActive")} id="page-invoices">
      <div className={styles.pageHeader} id="tour-page-invoices">
        <div>
          <div className={styles.pageEyebrow}>Finance</div>
          <div className={styles.pageTitle}>Invoices</div>
          <div className={styles.pageSub}>Your billing history and outstanding payments.</div>
        </div>
        <button className={cx("button", "buttonGhost")} type="button" onClick={onExportInvoices}>📥 Export CSV</button>
      </div>

      <div className={cx("stats", "stats3")} style={{ marginBottom: 24 }}>
        {invoiceSummaryStats.map((stat) => (
          <div key={stat.label} className={styles.stat}>
            <div className={styles.statTopBar} style={{ background: stat.tone }} />
            <div className={styles.statLabel}>{stat.label}</div>
            <div className={styles.statValue}>{stat.value}</div>
            <div className={cx("statDelta", stat.deltaTone)}>{stat.delta}</div>
          </div>
        ))}
      </div>

      <div className={styles.filterTabs}>
        {invoiceTabs.map((tab) => (
          <button
            key={tab.id}
            className={cx("filterTab", tab.id === activeInvoiceTab && "filterTabActive")}
            type="button"
            onClick={() => onInvoiceTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={cx("card", "full")}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Project</th>
              <th>Issued</th>
              <th>Due</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoiceTable.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.emptyState}>No invoices found for this view.</td>
              </tr>
            ) : (
              filteredInvoiceTable.map((invoice) => (
                <tr key={invoice.id}>
                  <td><div className={styles.invoiceNumber}>{invoice.id}</div></td>
                  <td style={{ color: "var(--muted)", fontSize: "0.78rem" }}>{invoice.project}</td>
                  <td><span className={styles.mono} style={{ fontSize: "0.7rem", color: "var(--muted)" }}>{invoice.issued}</span></td>
                  <td><span className={styles.mono} style={{ fontSize: "0.7rem", color: invoice.dueTone }}>{invoice.due}</span></td>
                  <td><span className={styles.invoiceAmount} style={{ fontWeight: 700, color: invoice.amountTone }}>{invoice.amount}</span></td>
                  <td><span className={cx("badge", `bg${capitalize(invoice.badge.tone)}`)}>{invoice.badge.label}</span></td>
                  <td>
                    <button
                      className={cx("button", invoice.action.tone === "accent" ? "buttonAccent" : "buttonGhost")}
                      type="button"
                      style={{ padding: "6px 14px", fontSize: "0.65rem" }}
                      onClick={() => onOpenInvoice(invoice.sourceId)}
                    >
                      {invoice.action.label}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

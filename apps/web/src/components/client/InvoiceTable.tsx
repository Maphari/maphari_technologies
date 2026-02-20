import type { InvoiceRow } from "./data";

type Props = {
  invoices: InvoiceRow[];
  showClientColumn?: boolean;
};

export function InvoiceTable({ invoices, showClientColumn = false }: Props) {
  return (
    <div className="card full-w">
      <table className="inv-table">
        <thead>
          <tr>
            <th>Invoice #</th>
            {showClientColumn ? <th>Client</th> : null}
            <th>Project</th>
            <th>Issued</th>
            <th>Due</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id}>
              <td>
                <div style={{ fontWeight: 700 }}>{invoice.id}</div>
                <div style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 12, color: "var(--muted)" }}>
                  {invoice.issued}
                </div>
              </td>
              {showClientColumn ? <td>{invoice.client}</td> : null}
              <td style={{ color: "var(--muted)", fontSize: 12 }}>{invoice.project}</td>
              <td style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 12, color: "var(--muted)" }}>{invoice.issued}</td>
              <td style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 12, color: invoice.statusColor ?? "var(--muted)" }}>{invoice.due}</td>
              <td>
                <span className="inv-amount" style={{ fontWeight: 700, color: invoice.statusColor ?? "var(--text)" }}>
                  {invoice.amount}
                </span>
              </td>
              <td>
                <span className={`badge ${invoice.badgeTone}`}>{invoice.badgeLabel}</span>
              </td>
              <td>
                <button className={`btn-sm ${invoice.actionStyle}`} type="button" style={{ padding: "5px 12px", fontSize: "0.65rem" }}>
                  {invoice.actionLabel}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

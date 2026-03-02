"use client";

import { cx } from "../style";

const invoices = [
  { id: "INV-2024-031", client: "Volta Studios", project: "Brand Identity System", amount: 28000, status: "Paid", issuedAt: "Jan 15, 2026", paidAt: "Jan 28, 2026", dueAt: "Feb 15, 2026" },
  { id: "INV-2024-032", client: "Kestrel Capital", project: "Q1 Campaign Strategy", amount: 21000, status: "Pending", issuedAt: "Feb 1, 2026", paidAt: null, dueAt: "Mar 1, 2026" },
  { id: "INV-2024-033", client: "Mira Health", project: "Website Redesign", amount: 35000, status: "Overdue", issuedAt: "Jan 1, 2026", paidAt: null, dueAt: "Jan 31, 2026" },
  { id: "INV-2024-034", client: "Dune Collective", project: "Editorial Design System", amount: 17500, status: "Paid", issuedAt: "Dec 15, 2025", paidAt: "Dec 28, 2025", dueAt: "Jan 15, 2026" },
  { id: "INV-2024-035", client: "Okafor & Sons", project: "Annual Report 2025", amount: 14000, status: "Draft", issuedAt: null, paidAt: null, dueAt: null },
] as const;

function statusTone(status: string) {
  if (status === "Paid") return "badgeGreen";
  if (status === "Pending") return "badgeAmber";
  if (status === "Overdue") return "badgeRed";
  return "badge";
}

export function InvoiceViewerPage({ isActive }: { isActive: boolean }) {
  const totalOutstanding = invoices.filter((i) => i.status === "Pending" || i.status === "Overdue").reduce((sum, i) => sum + i.amount, 0);
  const totalPaid = invoices.filter((i) => i.status === "Paid").reduce((sum, i) => sum + i.amount, 0);

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-invoice-viewer">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Finance</div>
        <h1 className={cx("pageTitleText")}>Invoice Viewer</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Read-only view of invoices for your assigned clients</p>
      </div>

      <div className={cx("stats", "stats3", "mb28")}>
        {[
          { label: "Total Paid", value: `R${totalPaid.toLocaleString()}`, tone: "colorGreen" },
          { label: "Outstanding", value: `R${totalOutstanding.toLocaleString()}`, tone: totalOutstanding > 0 ? "colorAmber" : "colorMuted" },
          { label: "Invoices", value: String(invoices.length), tone: "colorAccent" },
        ].map((stat) => (
          <div key={stat.label} className={cx("card")}>
            <div className={cx("text10", "colorMuted2", "uppercase", "tracking", "mb6")}>{stat.label}</div>
            <div className={cx("fontDisplay", "fw800", "text20", stat.tone)}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className={cx("card")}>
        <div className={cx("tableWrap")}>
          <table className={cx("table")}>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Client</th>
                <th>Project</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Issued</th>
                <th>Due</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className={cx("fontMono", "text12")}>{inv.id}</td>
                  <td className={cx("fw600")}>{inv.client}</td>
                  <td className={cx("colorMuted")}>{inv.project}</td>
                  <td className={cx("fontMono", "fw600")}>R{inv.amount.toLocaleString()}</td>
                  <td><span className={cx("badge", statusTone(inv.status))}>{inv.status}</span></td>
                  <td className={cx("colorMuted", "text12")}>{inv.issuedAt ?? "—"}</td>
                  <td className={cx("colorMuted", "text12")}>{inv.dueAt ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

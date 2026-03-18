"use client";
// ════════════════════════════════════════════════════════
// invoice-history-page.tsx — Client Invoice History
// Source  : snapshot.invoices (PortalInvoice[]) passed as props
// Scope   : CLIENT own-tenant invoices, all statuses
// ════════════════════════════════════════════════════════
import { useMemo, useState } from "react";
import { cx } from "../style";
import { usePageToast } from "../hooks/use-page-toast";
import type { PortalInvoice } from "../../../../lib/api/portal/types";

// ── Local types ────────────────────────────────────────────────────────────
type InvoiceTab = "All" | "Paid" | "Outstanding" | "Overdue";
const TABS: InvoiceTab[] = ["All", "Paid", "Outstanding", "Overdue"];

interface Invoice {
  number: string;
  date: string;
  description: string;
  amount: string;
  status: "Paid" | "Outstanding" | "Overdue";
  badgeClass: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt = (cents: number) => `R ${(cents / 100).toLocaleString("en-ZA")}`;

function toInvStatus(s: string): "Paid" | "Outstanding" | "Overdue" {
  if (s === "PAID")    return "Paid";
  if (s === "OVERDUE") return "Overdue";
  return "Outstanding";
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function mapInvoice(inv: PortalInvoice): Invoice {
  const status = toInvStatus(inv.status);
  return {
    number:     inv.number,
    date:       fmtDate(inv.issuedAt),
    description: `Invoice ${inv.number}`,
    amount:     fmt(inv.amountCents),
    status,
    badgeClass: status === "Paid" ? "badgeGreen" : status === "Overdue" ? "badgeRed" : "badgeAmber",
  };
}

// ── Helpers: export ─────────────────────────────────────────────────────────
function triggerCsvDownload(invoices: Invoice[]): void {
  const header = "Invoice Number,Date,Description,Amount,Status";
  const rows = invoices.map(i => `${i.number},${i.date},"${i.description}",${i.amount},${i.status}`);
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "maphari-invoice-history.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Component ──────────────────────────────────────────────────────────────
export function InvoiceHistoryPage({ invoices: allInvoices }: { invoices: PortalInvoice[] }) {
  const [tab, setTab] = useState<InvoiceTab>("All");
  const notify = usePageToast();

  const { invoices, totalPaid, totalOutstanding, lastPaymentDate, nextDueDate } = useMemo(() => {
    const mapped = allInvoices
      .slice()
      .sort((a, b) => new Date(b.issuedAt ?? b.createdAt).getTime() - new Date(a.issuedAt ?? a.createdAt).getTime())
      .map(mapInvoice);

    const paidAmounts   = allInvoices.filter(i => i.status === "PAID").map(i => i.amountCents);
    const unpaidAmounts = allInvoices.filter(i => i.status !== "PAID").map(i => i.amountCents);

    const totalPaid        = paidAmounts.reduce((s, v) => s + v, 0);
    const totalOutstanding = unpaidAmounts.reduce((s, v) => s + v, 0);

    const paidInvoices = allInvoices.filter(i => i.status === "PAID").sort((a, b) =>
      new Date(b.paidAt ?? b.updatedAt).getTime() - new Date(a.paidAt ?? a.updatedAt).getTime()
    );
    const lastPaymentDate = paidInvoices[0] ? fmtDate(paidInvoices[0].paidAt) : "—";

    const upcoming = allInvoices.filter(i => i.status !== "PAID" && i.dueAt).sort((a, b) =>
      new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime()
    );
    const nextDueDate = upcoming[0] ? fmtDate(upcoming[0].dueAt) : "—";

    return { invoices: mapped, totalPaid, totalOutstanding, lastPaymentDate, nextDueDate };
  }, [allInvoices]);

  const filtered = useMemo(() => {
    if (tab === "All")         return invoices;
    if (tab === "Paid")        return invoices.filter(i => i.status === "Paid");
    if (tab === "Outstanding") return invoices.filter(i => i.status === "Outstanding");
    if (tab === "Overdue")     return invoices.filter(i => i.status === "Overdue");
    return invoices;
  }, [tab, invoices]);

  return (
    <div className={cx("pageBody")}>
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Finance · Invoices</div>
          <h1 className={cx("pageTitle")}>Invoice History</h1>
          <p className={cx("pageSub")}>View and download all your invoices and payment records.</p>
        </div>
        <div className={cx("pageActions")}>
          <button
            type="button"
            className={cx("btnSm", "btnGhost")}
            disabled={invoices.length === 0}
            onClick={() => {
              if (invoices.length === 0) return;
              triggerCsvDownload(invoices);
              notify("success", "Downloading", "Invoice history CSV is downloading.");
            }}
          >
            Download All
          </button>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb16")}>
        <div className={cx("card", "p16")}>
          <div className={cx("text10", "uppercase", "tracking", "colorMuted", "fw700", "mb4")}>Total Paid</div>
          <div className={cx("fw800", "colorAccent")}>{totalPaid > 0 ? fmt(totalPaid) : "—"}</div>
        </div>
        <div className={cx("card", "p16")}>
          <div className={cx("text10", "uppercase", "tracking", "colorMuted", "fw700", "mb4")}>Outstanding</div>
          <div className={cx("fw800", "colorAmber")}>{totalOutstanding > 0 ? fmt(totalOutstanding) : "—"}</div>
        </div>
        <div className={cx("card", "p16")}>
          <div className={cx("text10", "uppercase", "tracking", "colorMuted", "fw700", "mb4")}>Last Payment</div>
          <div className={cx("fw800")}>{lastPaymentDate}</div>
        </div>
        <div className={cx("card", "p16")}>
          <div className={cx("text10", "uppercase", "tracking", "colorMuted", "fw700", "mb4")}>Next Due</div>
          <div className={cx("fw800")}>{nextDueDate}</div>
        </div>
      </div>

      <div className={cx("pillTabs", "mb16")}>
        {TABS.map(t => (
          <button
            key={t}
            type="button"
            className={cx("pillTab", tab === t && "pillTabActive")}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className={cx("card")}>
        <div className={cx("cardHd")}>
          <span className={cx("cardHdTitle")}>Invoice History</span>
        </div>
        <div className={cx("listGroup")}>
          {filtered.length === 0 && (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
              <div className={cx("emptyStateTitle")}>No invoices yet</div>
              <div className={cx("emptyStateSub")}>Your invoice history will appear here once invoices have been issued.</div>
            </div>
          )}
          {filtered.map(invoice => (
            <div key={invoice.number} className={cx("listRow")}>
              <div>
                <div className={cx("fw600")}>{invoice.number}</div>
                <div className={cx("text11", "colorMuted")}>
                  {invoice.date} · {invoice.description}
                </div>
              </div>
              <div className={cx("flexRow", "gap12")}>
                <span className={cx("fontMono", "fw600")}>{invoice.amount}</span>
                <span className={cx("badge", invoice.badgeClass)}>{invoice.status}</span>
                <button
                  type="button"
                  className={cx("btnSm", "btnGhost")}
                  onClick={() => window.print()}
                >
                  Download PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

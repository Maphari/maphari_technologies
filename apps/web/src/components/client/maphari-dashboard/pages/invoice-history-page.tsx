"use client";

import { useMemo, useState } from "react";
import { cx } from "../style";
import { Ic, Av } from "../ui";
import { usePageToast } from "../hooks/use-page-toast";
import type { PortalInvoice } from "../../../../lib/api/portal/types";

type InvoiceTab = "All" | "Paid" | "Outstanding" | "Overdue";
const TABS: InvoiceTab[] = ["All", "Paid", "Outstanding", "Overdue"];

const PAGE_STYLES = `
  .invhTableHead {
    display: grid;
    grid-template-columns: minmax(0, 2.2fr) minmax(120px, 0.9fr) minmax(120px, 0.9fr) minmax(120px, 0.8fr) auto;
    gap: 16px;
    align-items: center;
    padding: 14px 20px;
    border-bottom: 1px solid color-mix(in oklab, var(--b2) 72%, transparent);
    background:
      linear-gradient(180deg, color-mix(in oklab, var(--s2) 94%, transparent), color-mix(in oklab, var(--s1) 98%, transparent));
  }

  .invhRow {
    display: grid;
    grid-template-columns: minmax(0, 2.2fr) minmax(120px, 0.9fr) minmax(120px, 0.9fr) minmax(120px, 0.8fr) auto;
    gap: 16px;
    align-items: center;
    padding: 18px 20px;
    border-left: 3px solid transparent;
    transition: background 180ms ease, border-color 180ms ease, transform 180ms ease;
  }

  .invhRow:hover {
    background: color-mix(in oklab, var(--s3) 84%, transparent);
    border-left-color: color-mix(in oklab, var(--accent) 50%, transparent);
    transform: translateY(-1px);
  }

  .invhDateCell {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .invhActionCell {
    display: flex;
    justify-content: flex-end;
  }

  .invhPrimaryCell {
    display: flex;
    gap: 12px;
    min-width: 0;
  }

  .invhMetaPill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border-radius: 999px;
    border: 1px solid color-mix(in oklab, var(--b2) 74%, transparent);
    background: color-mix(in oklab, var(--s3) 92%, transparent);
    font-family: var(--font-dm-mono), monospace;
    font-size: 0.62rem;
    color: var(--muted2);
  }

  .invhAmountCell {
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: flex-start;
  }

  @media (max-width: 860px) {
    .invhTableHead {
      display: none;
    }

    .invhRow {
      grid-template-columns: 1fr;
      gap: 14px;
    }

    .invhActionCell {
      justify-content: flex-start;
    }

    .invhDateCell,
    .invhAmountCell {
      padding-left: 40px;
    }
  }
`;

interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  paidDate: string;
  issueIso: string | null;
  dueIso: string | null;
  paidIso: string | null;
  description: string;
  amountLabel: string;
  amountRaw: number;
  status: "Paid" | "Outstanding" | "Overdue";
  badgeClass: string;
  avatar: string;
  collectionLagDays: number | null;
}

const fmt = (cents: number) => "R " + (cents / 100).toLocaleString("en-ZA");

function toInvStatus(status: string): "Paid" | "Outstanding" | "Overdue" {
  if (status === "PAID") return "Paid";
  if (status === "OVERDUE") return "Overdue";
  return "Outstanding";
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function diffDays(from: string | null, to: string | null): number | null {
  if (!from || !to) return null;
  const diff = new Date(to).getTime() - new Date(from).getTime();
  return diff >= 0 ? Math.round(diff / 86400000) : null;
}

function mapInvoice(invoice: PortalInvoice): Invoice {
  const status = toInvStatus(invoice.status);
  return {
    id: invoice.id,
    number: invoice.number,
    date: fmtDate(invoice.issuedAt),
    dueDate: fmtDate(invoice.dueAt),
    paidDate: fmtDate(invoice.paidAt),
    issueIso: invoice.issuedAt,
    dueIso: invoice.dueAt,
    paidIso: invoice.paidAt,
    description: "Invoice " + invoice.number,
    amountLabel: fmt(invoice.amountCents),
    amountRaw: invoice.amountCents / 100,
    status,
    badgeClass: status === "Paid" ? "badgeGreen" : status === "Overdue" ? "badgeRed" : "badgeAmber",
    avatar: invoice.number.slice(-2).toUpperCase(),
    collectionLagDays: diffDays(invoice.issuedAt, invoice.paidAt),
  };
}

function csvCell(value: string | number): string {
  return "\"" + String(value).replace(/"/g, "\"\"") + "\"";
}

function triggerCsvDownload(invoices: Invoice[]): void {
  const header = [
    "Invoice Number",
    "Issue Date",
    "Due Date",
    "Paid Date",
    "Description",
    "Amount",
    "Status",
    "Collection Lag (Days)",
  ].join(",");
  const rows = invoices.map((invoice) => [
    csvCell(invoice.number),
    csvCell(invoice.date),
    csvCell(invoice.dueDate),
    csvCell(invoice.paidDate),
    csvCell(invoice.description),
    csvCell(invoice.amountLabel),
    csvCell(invoice.status),
    csvCell(invoice.collectionLagDays ?? ""),
  ].join(","));
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "maphari-invoice-history.csv";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function InvoiceHistoryPage({ invoices: allInvoices }: { invoices: PortalInvoice[] }) {
  const [tab, setTab] = useState<InvoiceTab>("All");
  const [search, setSearch] = useState("");
  const notify = usePageToast();

  const { invoices, totalPaid, totalOutstanding, lastPaymentDate, nextDueDate, oldestUnpaid, overdueCount } = useMemo(() => {
    const mapped = allInvoices
      .slice()
      .sort((left, right) => new Date(right.issuedAt ?? right.createdAt).getTime() - new Date(left.issuedAt ?? left.createdAt).getTime())
      .map(mapInvoice);

    const totalPaidCents = allInvoices.filter((invoice) => invoice.status === "PAID").reduce((sum, invoice) => sum + invoice.amountCents, 0);
    const totalOutstandingCents = allInvoices.filter((invoice) => invoice.status !== "PAID").reduce((sum, invoice) => sum + invoice.amountCents, 0);

    const paidInvoices = allInvoices
      .filter((invoice) => invoice.status === "PAID")
      .slice()
      .sort((left, right) => new Date(right.paidAt ?? right.updatedAt).getTime() - new Date(left.paidAt ?? left.updatedAt).getTime());
    const lastPaymentDate = paidInvoices[0] ? fmtDate(paidInvoices[0].paidAt) : "—";

    const unpaidByDueDate = allInvoices
      .filter((invoice) => invoice.status !== "PAID" && invoice.dueAt)
      .slice()
      .sort((left, right) => new Date(left.dueAt ?? 0).getTime() - new Date(right.dueAt ?? 0).getTime());
    const nextDueDate = unpaidByDueDate[0] ? fmtDate(unpaidByDueDate[0].dueAt) : "—";

    const oldestUnpaid = mapped
      .filter((invoice) => invoice.status !== "Paid" && invoice.dueIso)
      .slice()
      .sort((left, right) => new Date(left.dueIso ?? 0).getTime() - new Date(right.dueIso ?? 0).getTime())[0] ?? null;

    return {
      invoices: mapped,
      totalPaid: totalPaidCents,
      totalOutstanding: totalOutstandingCents,
      lastPaymentDate,
      nextDueDate,
      oldestUnpaid,
      overdueCount: mapped.filter((invoice) => invoice.status === "Overdue").length,
    };
  }, [allInvoices]);

  const filtered = useMemo(() => {
    const byTab = tab === "All" ? invoices : invoices.filter((invoice) => invoice.status === tab);
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return byTab;
    return byTab.filter((invoice) => {
      return invoice.number.toLowerCase().includes(normalizedSearch) || invoice.description.toLowerCase().includes(normalizedSearch);
    });
  }, [invoices, search, tab]);

  const handleDownloadInvoicePdf = async (invoice: Invoice) => {
    try {
      const { downloadInvoicePdf } = await import("@/lib/pdf/invoice");
      await downloadInvoicePdf({
        id: invoice.id,
        ref: invoice.number,
        date: invoice.date,
        due: invoice.dueDate,
        paidDate: invoice.paidIso ? invoice.paidDate : undefined,
        amount: invoice.amountLabel,
        amountRaw: invoice.amountRaw,
        status: invoice.status,
        items: [{ desc: invoice.description, qty: 1, rate: invoice.amountLabel, total: invoice.amountLabel, totalRaw: invoice.amountRaw }],
        category: "Finance",
      });
    } catch {
      notify("error", "PDF download failed", "Please try again.");
    }
  };

  return (
    <div className={cx("pageBody")}>
      <style>{PAGE_STYLES}</style>
      <div className={cx("printHeader")}>Maphari Technologies</div>
      <div className={cx("printFooter")}>Printed: {new Date().toLocaleDateString("en-ZA")}</div>

      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Finance · Invoices</div>
          <h1 className={cx("pageTitle")}>Invoice History</h1>
          <p className={cx("pageSub")}>Search, review, and download every invoice issued to your account.</p>
        </div>
        <div className={cx("pageActions", "flexRow", "gap8", "flexWrap")}>
          <button
            type="button"
            className={cx("btnSm", "btnGhost")}
            disabled={invoices.length === 0}
            onClick={() => {
              if (invoices.length === 0) return;
              triggerCsvDownload(filtered);
              notify("success", "Downloading", "Invoice history CSV is downloading.");
            }}
          >
            <Ic n="download" sz={13} c="var(--muted)" /> Download CSV
          </button>
          <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => window.print()}>
            <Ic n="file" sz={13} c="var(--bg)" /> Print / Save PDF
          </button>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb16")}>
        <div className={cx("statCard", "statCardGreen")}>
          <div className={cx("statLabel")}>Total Paid</div>
          <div className={cx("statValue")}>{totalPaid > 0 ? fmt(totalPaid) : "—"}</div>
        </div>
        <div className={cx("statCard", "statCardAmber")}>
          <div className={cx("statLabel")}>Outstanding</div>
          <div className={cx("statValue")}>{totalOutstanding > 0 ? fmt(totalOutstanding) : "—"}</div>
        </div>
        <div className={cx("statCard", "statCardBlue")}>
          <div className={cx("statLabel")}>Last Payment</div>
          <div className={cx("statValue")}>{lastPaymentDate}</div>
        </div>
        <div className={cx("statCard", overdueCount > 0 ? "statCardRed" : "statCardPurple")}>
          <div className={cx("statLabel")}>Oldest Open Invoice</div>
          <div className={cx("statValue")}>{oldestUnpaid ? oldestUnpaid.number : "—"}</div>
          <div className={cx("text10", "colorMuted", "mt4")}>{oldestUnpaid ? ("Due " + oldestUnpaid.dueDate) : ("Next due " + nextDueDate)}</div>
        </div>
      </div>

      <div className={cx("card", "mb16")}>
        <div className={cx("cardBodyPad")}>
          <div className={cx("pillTabs", "mt12", "mb12")}>
            {TABS.map((item) => (
              <button
                key={item}
                type="button"
                className={cx("pillTab", tab === item && "pillTabActive")}
                onClick={() => setTab(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className={cx("relative")}>
            <span className={cx("searchIconWrap")}>
              <Ic n="filter" sz={13} c="var(--muted2)" />
            </span>
            <input
              className={cx("input", "searchInput")}
              placeholder="Search by invoice number"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className={cx("text10", "colorMuted", "mt6")}>{filtered.length} shown</div>
        </div>
      </div>

      <div className={cx("card", "p0", "overflowHidden")}>
        <div className={cx("cardHd", "pl18")}>
          <span className={cx("cardHdTitle")}>Invoice Register</span>
          <span className={cx("text11", "colorMuted", "mlAuto")}>{filtered.length} entries</span>
        </div>

        {invoices.length === 0 ? (
          <div className={cx("emptyState")}>
            <div className={cx("emptyStateIcon")}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
            </div>
            <div className={cx("emptyStateTitle")}>No invoices yet</div>
            <div className={cx("emptyStateSub")}>Your invoice history will appear here once invoices have been issued.</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className={cx("emptyState")}>
            <div className={cx("emptyStateIcon")}><Ic n="filter" sz={22} c="var(--muted2)" /></div>
            <div className={cx("emptyStateTitle")}>No invoices match</div>
            <div className={cx("emptyStateSub")}>Try a different search term or status filter.</div>
          </div>
        ) : (
          <div className={cx("listGroup")}>
            <div className={cx("invhTableHead")}>
              {["Invoice", "Issued", "Due / Paid", "Amount", "Actions"].map((label) => (
                <span key={label} className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls012")}>{label}</span>
              ))}
            </div>
            {filtered.map((invoice) => (
              <div key={invoice.number} className={cx("invhRow", "borderB")}>
                <div className={cx("invhPrimaryCell")}>
                  <Av initials={invoice.avatar} size={28} />
                  <div className={cx("minW0")}>
                    <div className={cx("fw600", "flexRow", "gap8", "flexWrap", "flexCenter")}>
                      <span>{invoice.number}</span>
                      <span className={cx("badge", invoice.badgeClass)}>{invoice.status}</span>
                    </div>
                    <div className={cx("text11", "colorMuted", "mt3")}>{invoice.description}</div>
                    <div className={cx("text10", "colorMuted2", "mt4", "flexRow", "gap10", "flexWrap")}>
                      {invoice.collectionLagDays !== null ? (
                        <span className={cx("invhMetaPill")}>
                          <Ic n="clock" sz={10} c="var(--muted2)" />
                          {invoice.collectionLagDays} day cycle
                        </span>
                      ) : null}
                      {!invoice.paidIso && invoice.status === "Overdue" ? (
                        <span className={cx("invhMetaPill")}>
                          <Ic n="alert" sz={10} c="var(--red)" />
                          Overdue
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className={cx("invhDateCell")}>
                  <span className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls01")}>Issued</span>
                  <span className={cx("fw700", "text12")}>{invoice.date}</span>
                </div>

                <div className={cx("invhDateCell")}>
                  <span className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls01")}>{invoice.paidIso ? "Paid" : "Due"}</span>
                  <span className={cx("fw700", "text12", invoice.paidIso ? "colorAccent" : invoice.status === "Overdue" ? "colorRed" : invoice.status === "Outstanding" ? "colorAmber" : undefined)}>
                    {invoice.paidIso ? invoice.paidDate : invoice.dueDate}
                  </span>
                </div>

                <div className={cx("invhAmountCell")}>
                  <span className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls01")}>Amount</span>
                  <span className={cx("fontMono", "fw700", "text12")}>{invoice.amountLabel}</span>
                  <span className={cx("text10", "colorMuted")}>{invoice.paidIso ? "Settled" : "Open balance"}</span>
                </div>

                <div className={cx("invhActionCell")}>
                  <button
                    type="button"
                    className={cx("btnSm", "btnGhost")}
                    onClick={() => { void handleDownloadInvoicePdf(invoice); }}
                  >
                    <Ic n="download" sz={12} c="var(--muted)" /> PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

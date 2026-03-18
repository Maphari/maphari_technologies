"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { cx } from "../style";
import { Ic, Av } from "../ui";
import { usePageToast } from "../hooks/use-page-toast";
import type { PortalInvoice } from "../../../../lib/api/portal/types";

// ── Types ──────────────────────────────────────────────────────────────────────

type ITab = "All" | "Paid" | "Outstanding" | "Overdue";
type IStatus = "Paid" | "Outstanding" | "Overdue";
type ICategory = "Development" | "Design" | "Retainer" | "Strategy" | "QA";
type PayState = "idle" | "processing" | "success";

interface InvItem { desc: string; qty: number; rate: string; total: string; totalRaw: number }
interface Invoice {
  id: string; ref: string; date: string; due: string; paidDate?: string;
  amount: string; amountRaw: number; status: IStatus; items: InvItem[];
  issuedMs: number; category: ICategory; project: string;
  contact: string; contactInitials: string; notes?: string;
}

// ── Config ─────────────────────────────────────────────────────────────────────

const CAT: Record<ICategory, { icon: string; color: string }> = {
  Development: { icon: "code",        color: "var(--cyan)"   },
  Design:      { icon: "pen",         color: "var(--purple)" },
  Retainer:    { icon: "layers",      color: "var(--blue)"   },
  Strategy:    { icon: "target",      color: "var(--amber)"  },
  QA:          { icon: "shieldCheck", color: "var(--green)"  },
};

const STATUS_COLOR: Record<IStatus, string> = {
  Paid: "var(--lime)", Outstanding: "var(--amber)", Overdue: "var(--red)",
};


const TABS: ITab[] = ["All", "Paid", "Outstanding", "Overdue"];

// Currency symbol is configured via NEXT_PUBLIC_CURRENCY_SYMBOL env var.
// Defaults to "R" (ZAR) for backward compatibility.
const CURRENCY_SYMBOL = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL ?? "R";
const LOCALE          = process.env.NEXT_PUBLIC_LOCALE ?? "en-ZA";

const fmt    = (n: number) => `${CURRENCY_SYMBOL} ${n.toLocaleString(LOCALE)}`;
const fmtDec = (n: number) =>
  `${CURRENCY_SYMBOL} ${n.toLocaleString(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const daysOverdue = (issuedMs: number, now: number) => Math.max(0, Math.floor((now - issuedMs) / 86_400_000));

// ── Keyframe animations ────────────────────────────────────────────────────────

const PAGE_STYLES = `
  @keyframes invFadeSlideUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes invSpin { to { transform: rotate(360deg); } }
  @keyframes invCheckPop {
    0%   { transform: scale(0); }
    65%  { transform: scale(1.18); }
    100% { transform: scale(1); }
  }
  @keyframes invModalIn {
    from { opacity: 0; transform: scale(0.97) translateY(10px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }

  .inv-row { animation: invFadeSlideUp 320ms cubic-bezier(0.23,1,0.32,1) both; }
  .inv-row:hover .inv-row-bg { background: var(--s3); }
  .inv-expand { animation: invFadeSlideUp 240ms cubic-bezier(0.23,1,0.32,1) both; }
  .inv-spinner { border: 3px solid var(--b2); border-top-color: var(--lime); border-radius: 50%; animation: invSpin .7s linear infinite; }
  .inv-check-pop { animation: invCheckPop .42s cubic-bezier(0.34,1.56,.64,1) both; }
  .inv-modal-in { animation: invModalIn .26s cubic-bezier(0.23,1,0.32,1); }
  .inv-chevron { transition: transform 200ms cubic-bezier(0.23,1,0.32,1); display: flex; }
  .inv-chevron-open { transform: rotate(90deg); }
  .inv-progress-fill { transition: width 700ms cubic-bezier(0.23,1,0.32,1); }
  .inv-search-wrap { position: relative; }
  .inv-search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); pointer-events: none; }
  .inv-bar-fill { transition: width 800ms cubic-bezier(0.23,1,0.32,1); }

  @media (prefers-reduced-motion: reduce) {
    .inv-row, .inv-expand, .inv-check-pop, .inv-modal-in { animation: none; }
    .inv-spinner { animation: invSpin 1.5s linear infinite; }
    .inv-chevron, .inv-progress-fill, .inv-bar-fill { transition: none; }
  }
`;

// ── Pay Modal (unchanged) ──────────────────────────────────────────────────────

function InvPayModal({ amount, desc, onClose }: { amount: number; desc: string; onClose: () => void }) {
  const [payState, setPayState] = useState<PayState>("idle");
  const [cardNum, setCardNum] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [splitPay, setSplitPay] = useState(false);
  const receipt = useRef(`RCP-${Date.now().toString().slice(-6)}`);

  const vat = Math.round(amount * 0.15);
  const total = amount + vat;
  const inst = Math.ceil(total / 3);

  useEffect(() => {
    if (payState === "processing") {
      const t = setTimeout(() => setPayState("success"), 2200);
      return () => clearTimeout(t);
    }
  }, [payState]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && payState !== "processing") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [payState, onClose]);

  return (
    <>
      <div
        className={cx("modalOverlay")}
        onClick={(e) => { if (e.target === e.currentTarget && payState !== "processing") onClose(); }}
      >
        <div className={`inv-modal-in ${cx("pmModalInner")}`}>

          {/* Header */}
          <div className={cx("pmModalHd")}>
            <div className={cx("flexRow", "gap8")}>
              <Ic n="shieldCheck" sz={15} c="var(--lime)" />
              <span className={cx("fontMono", "text10", "uppercase", "tracking", "colorAccent")}>
                Secure Payment · 256-bit Encrypted
              </span>
            </div>
            {payState !== "processing" && (
              <button type="button" onClick={onClose} className={cx("iconBtn")}>
                <Ic n="x" sz={16} />
              </button>
            )}
          </div>

          {/* Success */}
          {payState === "success" ? (
            <div className={cx("emptyPad36x24", "textCenter")}>
              <div className={`inv-check-pop ${cx("pmSuccessCircle")}`}>
                <Ic n="check" sz={30} c="var(--lime)" sw={2.5} />
              </div>
              <div className={cx("fw800", "fs11rem", "mb4")}>Payment Successful!</div>
              <div className={cx("text11", "colorMuted", "mb4")}>{desc}</div>
              <div className={cx("fontMono", "text10", "colorMuted2", "mb24")}>
                Receipt #{receipt.current}
              </div>
              <div className={cx("flexRow", "justifyCenter", "gap8")}>
                <button type="button" className={cx("btnSm", "btnGhost", "flexRow", "gap5")} title="Download not yet available" disabled>
                  <Ic n="download" sz={13} /> Download Receipt
                </button>
                <button type="button" className={cx("btnSm", "btnAccent")} onClick={onClose}>Close</button>
              </div>
            </div>

          ) : payState === "processing" ? (
            <div className={cx("emptyPad48x24", "flexCol", "flexCenter", "gap16")}>
              <div className={`inv-spinner ${cx("wh40")}`}  />
              <div className={cx("fw600", "text12", "colorMuted2")}>Processing securely…</div>
              <div className={cx("text11", "colorMuted2")}>Please don't close this window</div>
            </div>

          ) : (
            <>
              {/* Amount */}
              <div className={cx("p20x24x0", "textCenter")}>
                <div className={cx("fontMono", "fw800", "invBigAmount")}>
                  {splitPay ? fmtDec(inst) : fmtDec(total)}
                </div>
                <div className={cx("text11", "colorMuted", "mt4", "mb2")}>
                  {splitPay ? "Instalment 1 of 3" : desc}
                </div>
                <div className={cx("fontMono", "text10", "colorMuted2")}>
                  Includes 15% VAT ({fmt(vat)})
                </div>
              </div>

              {/* Card visual */}
              <div className={cx("py16_px", "px24_px")}>
                <div className={cx("invCardPreviewHd")}>
                  <div className={cx("cardChipAmber")} />
                  <span className={cx("fontMono", "text10", "colorMuted2", "ls01")}>
                    •••• •••• •••• 4242
                  </span>
                </div>
              </div>

              {/* Card fields */}
              <div className={cx("px24_0", "flexCol", "gap10")}>
                <div className={cx("relative")}>
                  <span className={cx("searchIconWrap")}>
                    <Ic n="creditCard" sz={14} c="var(--muted2)" />
                  </span>
                  <input
                    className={cx("input", "fontMono", "pl34", "tracking")}
                    placeholder="•••• •••• •••• ••••"
                    value={cardNum}
                    onChange={(e) => setCardNum(e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim())}
                  />
                </div>
                <div className={cx("grid2Cols10Gap")}>
                  <input className={cx("input", "fontMono")} placeholder="MM / YY" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
                  <input className={cx("input", "fontMono")} placeholder="CVV" value={cvv} type="password" onChange={(e) => setCvv(e.target.value.slice(0, 4))} />
                </div>
              </div>

              {/* Split pay */}
              <div className={cx("splitPayToggleRow")}>
                <button
                  type="button"
                  onClick={() => setSplitPay(!splitPay)} className={cx("splitPayToggleBtn")}
                >
                  <Ic n="splitPay" sz={13} c="var(--amber)" />
                  <span className={cx("fw700", "text12", "colorAmber", "flex1", "textLeft")}>
                    {splitPay ? "Pay in full instead" : "Split into 3 monthly payments"}
                  </span>
                  <span className={cx("fontMono", "text10", "fw700", "splitPayBadge", "dynBgColor", "dynColor")} style={{ "--bg-color": splitPay ? "color-mix(in oklab, var(--amber) 15%, transparent)" : "var(--s3)", "--color": splitPay ? "var(--amber)" : "var(--muted2)" } as React.CSSProperties}>
                    {splitPay ? "ON" : "OFF"}
                  </span>
                </button>
                {splitPay && (
                  <div className={cx("mt10", "flexCol", "gap4")}>
                    {["Today", "30 days", "60 days"].map((label) => (
                      <div key={label} className={cx("flexBetween")}>
                        <span className={cx("text11", "colorMuted2")}>{label}</span>
                        <span className={cx("fontMono", "text11", "fw700", "colorAmber", "tabularNums")}>{fmtDec(inst)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pay button */}
              <div className={cx("p024x20")}>
                <button
                  type="button"
                  className={cx("btnAccent", "wFull", "flexRow", "flexCenter", "gap6")}
                  onClick={() => setPayState("processing")}
                >
                  <Ic n="lock" sz={14} />
                  {splitPay ? `Pay ${fmtDec(inst)} Today` : `Pay ${fmtDec(total)} Securely`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── Invoice Preview Slide-in Panel ─────────────────────────────────────────────

function InvoicePreview({ inv, onClose, onPay, onError }: { inv: Invoice; onClose: () => void; onPay: (amount: number, desc: string) => void; onError?: (msg: string) => void }) {
  const vat = Math.round(inv.amountRaw * 0.15);
  const total = inv.amountRaw + vat;
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      const { downloadInvoicePdf } = await import("@/lib/pdf/invoice");
      await downloadInvoicePdf(inv);
    } catch {
      onError?.("PDF download failed. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const statusBadge = (s: IStatus) => s === "Paid" ? "badgeGreen" : s === "Overdue" ? "badgeRed" : "badgeAmber";
  const catCfg = CAT[inv.category];

  const metaItems = [
    { label: "Issue Date", value: inv.date },
    { label: "Due Date", value: inv.due },
    { label: "Category", value: inv.category },
    { label: "Project", value: inv.project },
    { label: "Contact", value: inv.contact },
    { label: "Reference", value: inv.ref },
    ...(inv.paidDate ? [{ label: "Paid On", value: inv.paidDate }] : []),
  ];

  return (
    <>
      <div onClick={onClose} className={cx("modalBg", "z49")} />
      <div className={cx("slidePanel")}>

        {/* Brand header */}
        <div className={cx("invSlidePanelHd")}>
          <div className={cx("flexBetween", "mb12")}>
            <span className={cx("fontMono", "fw800", "uppercase", "invRefLabel")}>
              Maphari Technologies
            </span>
            <button type="button" onClick={onClose} className={cx("iconBtn")}>
              <Ic n="x" sz={18} />
            </button>
          </div>
          <div className={cx("flexRow", "flexCenter", "gap8", "flexWrap")}>
            <span className={cx("badge", "badgeMuted")}>
              <span className={cx("fontMono")}>{inv.id}</span>
            </span>
            <span className={cx("badge", statusBadge(inv.status))}>{inv.status}</span>
            <span className={cx("badge", "badgeMuted", "inlineFlex", "gap4")}>
              <Ic n={catCfg.icon} sz={10} c={catCfg.color} />
              <span>{inv.category}</span>
            </span>
          </div>
        </div>

        {/* Scrollable content */}
        <div className={cx("flex1", "overflowYAuto", "py20_px", "px24_px")}>

          {/* Meta grid */}
          <div className={cx("grid2Cols", "gap10", "mb24")}>
            {metaItems.map(({ label, value }) => (
              <div key={label} className={cx("invMetaCell")}>
                <div className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls012", "mb4")}>{label}</div>
                <div className={cx("fw700", "text12")}>{value}</div>
              </div>
            ))}
          </div>

          {/* Line items header */}
          <div className={cx("tableHeaderGrid", "borderB", "mb4", "invReceiptRow")}>
            {["Description", "Qty", "Rate", "Total"].map((h) => (
              <span key={h} className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls012")}>{h}</span>
            ))}
          </div>

          {/* Line items */}
          {inv.items.map((item, i) => (
            <div key={i} className={cx("tableRowGrid", "borderB", "invTotalRow")}>
              <span className={cx("text12", "fw500")}>{item.desc}</span>
              <span className={cx("fontMono", "text11", "colorMuted", "textCenter")}>{item.qty}</span>
              <span className={cx("fontMono", "text11", "colorMuted")}>{item.rate}</span>
              <span className={cx("fontMono", "text11", "fw700")}>{item.total}</span>
            </div>
          ))}

          {/* Totals */}
          <div className={cx("mlAuto", "maxW240", "mt12")}>
            {[
              { label: "Subtotal", value: fmt(inv.amountRaw) },
              { label: "VAT (15%)", value: fmt(vat) },
            ].map(({ label, value }) => (
              <div key={label} className={cx("flexBetween", "py5_0", "borderB")}>
                <span className={cx("text11", "colorMuted")}>{label}</span>
                <span className={cx("fontMono", "text11", "fw600", "colorMuted", "tabularNums")}>{value}</span>
              </div>
            ))}
            <div className={cx("flexBetween", "borderT", "mt2", "p10x0x6")}>
              <span className={cx("fw800", "text13")}>Total</span>
              <span className={cx("fontMono", "fw800", "text13", "colorAccent", "tabularNums")}>{fmtDec(total)}</span>
            </div>
          </div>

          {/* Paid stamp */}
          {inv.status === "Paid" && (
            <div className={cx("invEmptyBanner", "mt24")}>
              <Ic n="check" sz={24} c="var(--lime)" sw={2.5} />
              <div className={cx("fontMono", "fw800", "uppercase", "colorAccent", "mt6", "ls012", "fs072")}>Paid in Full</div>
              <div className={cx("fontMono", "text10", "colorMuted2", "mt4")}>{inv.paidDate ?? inv.date}</div>
            </div>
          )}

          {/* Notes */}
          {inv.notes && (
            <div className={cx("cardS2", "p12x14", "mt16")}>
              <div className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls01", "mb6")}>Notes</div>
              <p className={cx("text11", "colorMuted", "m0", "lineH16")}>{inv.notes}</p>
            </div>
          )}
        </div>

        {/* Action row */}
        <div className={cx("noShrink", "p16x24", "borderT", "flexRow", "gap10")}>
          <button
            type="button"
            className={cx("btnSm", "btnGhost", "flex1", "flexRow", "flexCenter", "justifyCenter", "gap6")}
            onClick={handleDownloadPdf}
            disabled={isDownloading}
          >
            <Ic n="download" sz={13} /> {isDownloading ? "Generating…" : "Download PDF"}
          </button>
          {inv.status !== "Paid" && (
            <button
              type="button"
              className={cx("btnSm", "btnAccent", "flex1", "flexRow", "flexCenter", "justifyCenter", "gap6")}
              onClick={() => onPay(inv.amountRaw, `${inv.id} — ${inv.ref}`)}
            >
              <Ic n="creditCard" sz={13} /> Pay Now
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export function InvoicesPage({ invoices: apiInvoices = [] }: { invoices?: PortalInvoice[] }) {
  const notify = usePageToast();
  const [tab, setTab] = useState<ITab>("All");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [payModal, setPayModal] = useState<{ amount: number; desc: string } | null>(null);

  const now = Date.now();

  const statusBadge = (s: IStatus) => s === "Paid" ? "badgeGreen" : s === "Outstanding" ? "badgeAmber" : "badgeRed";

  const invoiceData = useMemo<Invoice[]>(() => {
    if (apiInvoices.length === 0) return [];
    return apiInvoices.map((inv) => {
      const statusMap: Record<string, IStatus> = {
        PAID: "Paid", OVERDUE: "Overdue", ISSUED: "Outstanding",
        DRAFT: "Outstanding", VOID: "Outstanding",
      };
      const status: IStatus = statusMap[inv.status] ?? "Outstanding";
      const amountRaw = inv.amountCents / 100;
      const fmtMoney = (cents: number) => fmtDec(cents / 100);
      return {
        id: inv.number || inv.id.slice(0, 8).toUpperCase(),
        ref: `Invoice ${inv.number}`,
        date: inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—",
        due: inv.dueAt ? new Date(inv.dueAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—",
        paidDate: inv.paidAt ? new Date(inv.paidAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : undefined,
        amount: fmtMoney(inv.amountCents),
        amountRaw,
        status,
        items: [{ desc: `Service - Invoice ${inv.number}`, qty: 1, rate: fmtMoney(inv.amountCents), total: fmtMoney(inv.amountCents), totalRaw: amountRaw }],
        issuedMs: inv.issuedAt ? new Date(inv.issuedAt).getTime() : new Date(inv.createdAt).getTime(),
        category: "Development" as ICategory,
        project: "Active Project",
        contact: "Account Manager",
        contactInitials: "AM",
      };
    });
  }, [apiInvoices]);

  const filtered = useMemo(() => {
    let list = tab === "All" ? invoiceData : invoiceData.filter((i) => i.status === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) => i.id.toLowerCase().includes(q) || i.ref.toLowerCase().includes(q) ||
          i.amount.includes(q) || i.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [tab, search, invoiceData]);

  // ── Monthly billing chart derived from real invoice data ──────────────────
  const displayMonthly = useMemo(() => {
    if (invoiceData.length === 0) return [];
    const byMonth: Record<string, { invoiced: number; collected: number }> = {};
    for (const inv of invoiceData) {
      const d = new Date(inv.issuedMs);
      const key = d.toLocaleDateString("en-ZA", { month: "short" });
      byMonth[key] ??= { invoiced: 0, collected: 0 };
      byMonth[key].invoiced += inv.amountRaw;
      if (inv.status === "Paid") byMonth[key].collected += inv.amountRaw;
    }
    return Object.entries(byMonth).map(([month, v]) => ({ month, ...v }));
  }, [invoiceData]);
  const displayMonthlyMax = displayMonthly.length > 0
    ? Math.max(...displayMonthly.map(m => m.invoiced), 1)
    : 1;

  const overdue          = invoiceData.filter((i) => i.status === "Overdue");
  const totalInvoiced    = invoiceData.reduce((s, i) => s + i.amountRaw, 0);
  const totalPaid        = invoiceData.filter((i) => i.status === "Paid").reduce((s, i) => s + i.amountRaw, 0);
  const totalOutstanding = invoiceData.filter((i) => i.status === "Outstanding").reduce((s, i) => s + i.amountRaw, 0);
  const totalOverdue     = invoiceData.filter((i) => i.status === "Overdue").reduce((s, i) => s + i.amountRaw, 0);

  const paidPct        = totalInvoiced > 0 ? Math.round((totalPaid        / totalInvoiced) * 100) : 0;
  const outstandingPct = totalInvoiced > 0 ? Math.round((totalOutstanding / totalInvoiced) * 100) : 0;
  const overduePct     = totalInvoiced > 0 ? 100 - paidPct - outstandingPct : 0;

  return (
    <div className={cx("pageBody")}>
      <style>{PAGE_STYLES}</style>

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Finance · Invoices</div>
          <h1 className={cx("pageTitle")}>Invoice History</h1>
          <p className={cx("pageSub")}>Review line items, preview branded invoices, and pay directly from this portal.</p>
        </div>
        <div className={cx("pageActions")}>
          <button type="button" className={cx("btnSm", "btnGhost", "flexRow", "gap6")} title="Download not yet available" disabled>
            <Ic n="download" sz={13} /> Download All
          </button>
          <button type="button" className={cx("btnSm", "btnGhost", "flexRow", "gap6")} title="Reminders not yet available" disabled>
            <Ic n="bell" sz={13} /> Payment Reminders
          </button>
        </div>
      </div>

      {/* ── Stat cards ───────────────────────────────────────────────────── */}
      <div className={cx("topCardsStack", "mb16")}>
        {[
          {
            label: "Total Invoiced", value: fmt(totalInvoiced), color: "statCardBlue",
            trend: `${invoiceData.length} invoices issued`, icon: "invoiceDoc", iconColor: "var(--cyan)",
          },
          {
            label: "Collected", value: fmt(totalPaid), color: "statCardGreen",
            trend: `${invoiceData.filter((i) => i.status === "Paid").length} of ${invoiceData.length} paid`, icon: "check", iconColor: "var(--green)",
          },
          {
            label: "Outstanding", value: fmt(totalOutstanding), color: "statCardAmber",
            trend: `${invoiceData.filter((i) => i.status === "Outstanding").length} invoice${invoiceData.filter((i) => i.status === "Outstanding").length !== 1 ? "s" : ""} pending`, icon: "clock", iconColor: "var(--amber)",
          },
          {
            label: "Overdue", value: fmt(totalOverdue), color: "statCardRed",
            trend: overdue.length > 0 ? `${daysOverdue(overdue[0].issuedMs, now)}d since due` : "None overdue", icon: "alert", iconColor: "var(--red)",
          },
        ].map((s) => (
          <div key={s.label} className={cx("statCard", s.color)}>
            <div className={cx("flexBetween", "mb8")}>
              <div className={cx("statLabel")}>{s.label}</div>
              <Ic n={s.icon} sz={14} c={s.iconColor} />
            </div>
            <div className={cx("statValue", "fontMono", "tabularNums")}>{s.value}</div>
            <div className={cx("fontMono", "text10", "colorMuted2", "mt6")}>{s.trend}</div>
          </div>
        ))}
      </div>

      {/* ── Payment composition + Monthly billing ────────────────────────── */}
      <div className={cx("grid2", "mb16")}>

        {/* Payment Composition */}
        <div className={cx("card", "p16x20")}>
          <div className={cx("cardHd", "mb14")}>
            <span className={cx("cardHdTitle")}>Payment Composition</span>
            <span className={cx("fontMono", "fw700", "text11", "invPayNowBtn")}>
              {paidPct}% collected
            </span>
          </div>

          {/* Stacked bar */}
          <div className={cx("invPayBarTrack")}>
            <div className={`inv-bar-fill ${cx("dotBgAccent")}`} style={{ '--pct': `${paidPct}%` } as React.CSSProperties} />
            {outstandingPct > 0 && (
              <div className={`inv-bar-fill ${cx("dotBgAmber")}`} style={{ '--pct': `${outstandingPct}%` } as React.CSSProperties} />
            )}
            {overduePct > 0 && (
              <div className={`inv-bar-fill ${cx("dotBgRed")}`} style={{ '--pct': `${overduePct}%` } as React.CSSProperties} />
            )}
          </div>

          {/* Legend */}
          <div className={cx("flexRow", "gap12")}>
            {[
              { label: "Paid", color: "var(--lime)", amount: totalPaid, pct: paidPct },
              { label: "Outstanding", color: "var(--amber)", amount: totalOutstanding, pct: outstandingPct },
              { label: "Overdue", color: "var(--red)", amount: totalOverdue, pct: overduePct },
            ].map(({ label, color, amount, pct }) => (
              <div key={label} className={cx("invLineCard", "dynBorderLeft3")} style={{ "--color": `color-mix(in oklab, ${color} 20%, var(--b1))` } as React.CSSProperties}>
                <div className={cx("flexRow", "flexCenter", "gap6", "mb6")}>
                  <span className={cx("wh8", "rounded50", "dynBgColor", "noShrink")} style={{ "--bg-color": color } as React.CSSProperties} />
                  <span className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls01")}>{label}</span>
                </div>
                <div className={cx("fontMono", "fw800", "text12", "invLineAmt", "dynColor")} style={{ "--color": color } as React.CSSProperties}>{fmt(amount)}</div>
                <div className={cx("fontMono", "text10", "colorMuted2")}>{pct}% of total</div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Billing */}
        <div className={cx("card", "p16x20")}>
          <div className={cx("cardHd", "mb14")}>
            <span className={cx("cardHdTitle")}>Monthly Billing</span>
            <div className={cx("flexRow", "gap10")}>
              <span className={cx("flexRow", "gap5")}>
                <span className={cx("miniBarMuted")} />
                <span className={cx("fontMono", "text10", "colorMuted2")}>Invoiced</span>
              </span>
              <span className={cx("flexRow", "gap5")}>
                <span className={cx("miniBarLime")} />
                <span className={cx("fontMono", "text10", "colorMuted2")}>Collected</span>
              </span>
            </div>
          </div>

          {displayMonthly.length === 0 ? (
            <div className={cx("py20_0", "textCenter")}>
              <span className={cx("text11", "colorMuted")}>No billing data available yet.</span>
            </div>
          ) : (
            <>
              <div className={cx("flexCol", "gap10")}>
                {displayMonthly.map((m, idx) => {
                  const collectRate = m.invoiced > 0 ? Math.round((m.collected / m.invoiced) * 100) : 0;
                  const isCurrent = idx === displayMonthly.length - 1;
                  return (
                    <div key={m.month} className={cx("flexRow", "gap10")}>
                      <span className={cx("fontMono", "text10", "w26", "noShrink", "dynColor")} style={{ "--color": isCurrent ? "var(--lime)" : "var(--muted2)" } as React.CSSProperties}>
                        {m.month}
                      </span>
                      <div className={cx("flex1", "flexCol", "gap3")}>
                        <div className={cx("microBarTrack")}>
                          <div className={cx("dotBgMuted2")} style={{ '--pct': `${(m.invoiced / displayMonthlyMax) * 100}%` } as React.CSSProperties} />
                        </div>
                        <div className={cx("microBarTrack")}>
                          <div style={{ '--pct': `${(m.collected / displayMonthlyMax) * 100}%` } as React.CSSProperties} />
                        </div>
                      </div>
                      <span className={cx("fontMono", "text10", "fw700", "w34", "textRight", "noShrink", "tabularNums", "dynColor")} style={{ "--color": collectRate === 100 ? "var(--lime)" : collectRate > 0 ? "var(--amber)" : "var(--muted2)" } as React.CSSProperties}>
                        {collectRate}%
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* Summary footer */}
              <div className={cx("mt14", "pt12", "borderT", "flexRow", "justifyBetween")}>
                <span className={cx("text10", "colorMuted2")}>Avg collection rate</span>
                <span className={cx("fontMono", "fw700", "text10", "colorAccent")}>
                  {Math.round(displayMonthly.reduce((s, m) => s + (m.invoiced > 0 ? m.collected / m.invoiced : 0), 0) / displayMonthly.length * 100)}%
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Overdue alert ────────────────────────────────────────────────── */}
      {overdue.length > 0 && (
        <div className={cx("invOverdueAlert")}>
          <Ic n="alert" sz={16} c="var(--red)" />
          <div className={cx("flex1")}>
            <span className={cx("fs078")}>
              <strong className={cx("fontMono")}>{overdue[0].id}</strong>
              <span className={cx("colorMuted")}> — {overdue[0].amount} · Due {overdue[0].due}</span>
            </span>
            <div className={cx("fontMono", "text10", "colorMuted2", "mt2")}>
              {overdue[0].ref} · {overdue[0].project}
            </div>
          </div>
          <span className={cx("badge", "badgeRed", "fontMono", "noShrink")}>
            {daysOverdue(overdue[0].issuedMs, now)}d overdue
          </span>
          <button
            type="button"
            className={cx("btnSm", "invPayNowBtn")}
            onClick={() => setPayModal({ amount: overdue[0].amountRaw, desc: `${overdue[0].id} — ${overdue[0].ref}` })}
          >
            <Ic n="creditCard" sz={12} c="var(--red)" />
            Pay {overdue[0].amount} Now
          </button>
        </div>
      )}

      {/* ── Tabs + Search ─────────────────────────────────────────────────── */}
      <div className={cx("flexBetween", "gap10", "mb16")}>
        <div className={cx("pillTabs", "gap6", "mb0")}>
          {TABS.map((t) => (
            <button key={t} type="button" className={cx("pillTab", tab === t && "pillTabActive")} onClick={() => { setTab(t); setSearch(""); }}>
              {t}
            </button>
          ))}
        </div>
        <div className={`inv-search-wrap ${cx("minW200", "maxW260")}`} >
          <span className="inv-search-icon">
            <Ic n="filter" sz={13} c="var(--muted2)" />
          </span>
          <input
            className={cx("input", "searchInput")}
            placeholder="Filter by ID, ref, category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Invoice list ─────────────────────────────────────────────────── */}
      <div className={cx("card", "overflowHidden")}>

        {/* Column headers */}
        {filtered.length > 0 && (
          <div className={cx("tableHeadGrid6col")}>
            {["", "Reference", "Issued", "Amount", "Status", ""].map((h, i) => (
              <span key={i} className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls012")}>{h}</span>
            ))}
          </div>
        )}

        {/* Rows */}
        {filtered.length === 0 ? (
          <div className={cx("emptyPad48x24", "textCenter")}>
            <Ic n="file" sz={32} c="var(--muted2)" />
            <div className={cx("fw800", "text13", "mt12", "mb4")}>No invoices</div>
            <div className={cx("text12", "colorMuted")}>
              {search ? `No results for "${search}"` : `No ${tab === "All" ? "" : tab.toLowerCase() + " "}invoices found.`}
            </div>
            {search && (
              <button type="button" className={cx("btnSm", "btnGhost", "mt16")} onClick={() => setSearch("")}>
                Clear filter
              </button>
            )}
          </div>
        ) : (
          filtered.map((inv, idx) => {
            const isOpen = expanded === inv.id;
            const catCfg = CAT[inv.category];
            const statusColor = STATUS_COLOR[inv.status];
            const vat = Math.round(inv.amountRaw * 0.15);
            const total = inv.amountRaw + vat;
            return (
              <div
                key={inv.id}
                className={`inv-row ${cx("dynBorderLeft3")}`} style={{ "--color": statusColor } as React.CSSProperties}
              >
                {/* Row trigger */}
                <button
                  type="button"
                  aria-expanded={isOpen}
                  className={`inv-row-bg ${cx("gridRowBtn6col", "transBack")}`}
                  onClick={() => setExpanded(isOpen ? null : inv.id)}
                >
                  {/* Category icon box */}
                  <div className={cx("pmIconBox36", "dynBgColor")} style={{ "--bg-color": `color-mix(in oklab, ${catCfg.color} 12%, var(--s2))`, "--color": `color-mix(in oklab, ${catCfg.color} 25%, transparent)` } as React.CSSProperties}>
                    <Ic n={catCfg.icon} sz={15} c={catCfg.color} />
                  </div>

                  {/* Reference + ID */}
                  <div className={cx("minW0")}>
                    <div className={cx("fw600", "text12", "truncate")}>{inv.ref}</div>
                    <div className={cx("flexRow", "flexCenter", "gap6", "mt2")}>
                      <span className={cx("fontMono", "text10", "colorAccent")}>{inv.id}</span>
                      <span className={cx("fontMono", "text10", "pmCatBadge", "dynBgColor", "dynColor")} style={{ "--bg-color": `color-mix(in oklab, ${catCfg.color} 10%, var(--s3))`, "--color": catCfg.color } as React.CSSProperties}>
                        {inv.category}
                      </span>
                    </div>
                  </div>

                  {/* Date */}
                  <span className={cx("fontMono", "text10", "colorMuted2")}>{inv.date}</span>

                  {/* Amount */}
                  <span className={cx("fontMono", "fw700", "text12", "textRight", "tabularNums")}>{inv.amount}</span>

                  {/* Status badge */}
                  <span className={cx("badge", statusBadge(inv.status))}>{inv.status}</span>

                  {/* Chevron */}
                  <span className={`inv-chevron${isOpen ? " inv-chevron-open" : ""}`}>
                    <Ic n="chevronRight" sz={14} c="var(--muted2)" />
                  </span>
                </button>

                {/* Expanded area */}
                {isOpen && (
                  <div className={`inv-expand ${cx("payRowExpanded", "dynBgColor")}`} style={{ "--bg-color": `color-mix(in oklab, ${statusColor} 4%, var(--s2))` } as React.CSSProperties}>
                    <div className={cx("grid2Cols260")}>

                      {/* Left: Line items + totals */}
                      <div className={cx("panelLWide")}>
                        {/* Items header */}
                        <div className={cx("invItemsHd")}>
                          {["Description", "Qty", "Rate", "Total"].map((h) => (
                            <span key={h} className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls01")}>{h}</span>
                          ))}
                        </div>

                        {inv.items.map((item, i) => (
                          <div key={i} className={cx("tableRowGrid", "invItemRow", "borderB")}>
                            <span className={cx("text11", "fw600")}>{item.desc}</span>
                            <span className={cx("fontMono", "text10", "colorMuted2", "textCenter")}>{item.qty}</span>
                            <span className={cx("fontMono", "text10", "colorMuted")}>{item.rate}</span>
                            <span className={cx("fontMono", "text11", "fw700", "tabularNums")}>{item.total}</span>
                          </div>
                        ))}

                        {/* Totals */}
                        <div className={cx("mt8", "pt8")}>
                          {[
                            { label: "Subtotal", value: fmt(inv.amountRaw) },
                            { label: "VAT (15%)", value: fmt(vat) },
                          ].map(({ label, value }) => (
                            <div key={label} className={cx("invSumRow")}>
                              <span className={cx("text10", "colorMuted2")}>{label}</span>
                              <span className={cx("fontMono", "text10", "colorMuted", "fw600", "tabularNums", "minW80", "textRight")}>{value}</span>
                            </div>
                          ))}
                          <div className={cx("invTotalInclVAT")}>
                            <span className={cx("fw800", "text11")}>Total incl. VAT</span>
                            <span className={cx("fontMono", "fw800", "text11", "colorAccent", "tabularNums", "minW80", "textRight")}>{fmtDec(total)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Details + actions */}
                      <div className={cx("p16x20", "flexCol", "gap10")}>
                        {/* Contact */}
                        <div className={cx("infoChip")}>
                          <Av initials={inv.contactInitials} size={32} />
                          <div className={cx("minW0")}>
                            <div className={cx("fw700", "text11", "truncate")}>{inv.contact}</div>
                            <div className={cx("fontMono", "text10", "colorMuted2")}>{inv.project}</div>
                          </div>
                        </div>

                        {/* Key dates */}
                        <div className={cx("flexCol", "gap6")}>
                          {[
                            { label: "Issued", value: inv.date, icon: "calendar" },
                            { label: "Due", value: inv.due, icon: "clock" },
                            ...(inv.paidDate ? [{ label: "Paid", value: inv.paidDate, icon: "check" }] : []),
                          ].map(({ label, value, icon }) => (
                            <div key={label} className={cx("flexBetween")}>
                              <div className={cx("flexRow", "gap6")}>
                                <Ic n={icon} sz={11} c="var(--muted2)" />
                                <span className={cx("text10", "colorMuted2")}>{label}</span>
                              </div>
                              <span className={cx("fontMono", "text10", "fw600")}>{value}</span>
                            </div>
                          ))}
                        </div>

                        {/* Notes */}
                        {inv.notes && (
                          <div className={cx("cardS3", "p8x10")}>
                            <p className={cx("text10", "colorMuted", "m0", "lineH16")}>{inv.notes}</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className={cx("flexCol", "gap6", "mtAuto")}>
                          <div className={cx("flexRow", "gap6")}>
                            <button type="button" className={cx("btnSm", "btnGhost", "flex1", "flexCenter", "gap5", "colorInherit")}>
                              <Ic n="download" sz={12} /> PDF
                            </button>
                            <button
                              type="button"
                              className={cx("btnSm", "btnGhost", "flex1", "flexCenter", "gap5", "colorInherit")}
                              onClick={() => setPreviewInvoice(inv)}
                            >
                              <Ic n="invoiceDoc" sz={12} /> Preview
                            </button>
                          </div>
                          {inv.status !== "Paid" && (
                            <button
                              type="button"
                              className={cx("btnSm", "btnAccent", "wFull", "flexRow", "flexCenter", "justifyCenter", "gap5")}
                              onClick={() => setPayModal({ amount: inv.amountRaw, desc: `${inv.id} — ${inv.ref}` })}
                            >
                              <Ic n="creditCard" sz={12} /> Pay {inv.amount} Now
                            </button>
                          )}
                          {inv.status === "Paid" && (
                            <div className={cx("pmPaidFullBadge")}>
                              <Ic n="check" sz={12} c="var(--lime)" sw={2.5} />
                              <span className={cx("fontMono", "text10", "fw700", "colorAccent")}>Paid in Full</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Preview Panel ─────────────────────────────────────────────────── */}
      {previewInvoice && (
        <InvoicePreview
          inv={previewInvoice}
          onClose={() => setPreviewInvoice(null)}
          onPay={(amount, desc) => { setPreviewInvoice(null); setPayModal({ amount, desc }); }}
          onError={(msg) => notify("error", "Download failed", msg)}
        />
      )}

      {/* ── Pay Modal ─────────────────────────────────────────────────────── */}
      {payModal && (
        <InvPayModal
          amount={payModal.amount}
          desc={payModal.desc}
          onClose={() => setPayModal(null)}
        />
      )}
    </div>
  );
}

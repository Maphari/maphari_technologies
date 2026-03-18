"use client";
import { useState, useMemo, useEffect } from "react";
import { cx } from "../style";
import { Ic, Av } from "../ui";
import type { PortalPayment, PortalInvoice } from "../../../../lib/api/portal/types";

// ── Types ──────────────────────────────────────────────────────────────────────

type PTab      = "All" | "Paid" | "Pending" | "Overdue";
type PStatus   = "Paid" | "Pending" | "Overdue";
type PCategory = "Development" | "Design" | "Retainer" | "Strategy" | "QA" | "Change Request";
type PayMethod = "visa" | "mc" | "bank";
type PayState  = "idle" | "processing" | "success";

interface Payment {
  id: string; invoiceRef: string; description: string;
  date: string; dueDate: string; amountRaw: number;
  status: PStatus; method?: string; category: PCategory;
  project: string; contact: string; contactInitials: string;
  receiptNum?: string; note?: string;
}

// ── Config ─────────────────────────────────────────────────────────────────────

const CAT: Record<PCategory, { icon: string; color: string }> = {
  Development:     { icon: "code",        color: "var(--cyan)"   },
  Design:          { icon: "pen",         color: "var(--purple)" },
  Retainer:        { icon: "layers",      color: "var(--blue)"   },
  Strategy:        { icon: "target",      color: "var(--amber)"  },
  QA:              { icon: "shieldCheck", color: "var(--green)"  },
  "Change Request":{ icon: "edit",        color: "var(--lime)"   },
};

const STATUS_COLOR: Record<PStatus, string> = {
  Paid: "var(--lime)", Pending: "var(--amber)", Overdue: "var(--red)",
};

// ── Data ───────────────────────────────────────────────────────────────────────

// Monthly payment activity — populated from API in a future batch
const CHART_H = 104;
const ACTIVITY: { month: string; paid: number; pending: number; overdue: number }[] = [];
const CHART_MAX = ACTIVITY.length > 0
  ? Math.max(...ACTIVITY.map((m) => m.paid + m.pending + m.overdue), 1)
  : 1;

// Upcoming schedule — populated from API in a future batch
const UPCOMING: { id: string; desc: string; date: string; amountRaw: number; status: PStatus }[] = [];

const TABS: PTab[] = ["All", "Paid", "Pending", "Overdue"];

// Saved payment methods — populated from API in a future batch
const SAVED_METHODS: { id: PayMethod; last4: string; expiry: string; gradient: string; network: string }[] = [];

const CURRENCY_SYMBOL = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL ?? "R";
const LOCALE          = process.env.NEXT_PUBLIC_LOCALE          ?? "en-ZA";
const fmt    = (n: number) => `${CURRENCY_SYMBOL} ${n.toLocaleString(LOCALE)}`;
const fmtDec = (n: number) => `${CURRENCY_SYMBOL} ${n.toLocaleString(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const daysAgo = (dateStr: string, now: number) => {
  const d = new Date(dateStr.split(" ").reverse().join("-").replace("Apr","04").replace("Mar","03").replace("Feb","02").replace("Jan","01"));
  return Math.max(0, Math.floor((now - d.getTime()) / 86_400_000));
};

// ── Page Styles ────────────────────────────────────────────────────────────────

const PAGE_STYLES = `
  @keyframes pmSpin    { to { transform: rotate(360deg); } }
  @keyframes pmFadeIn  { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
  @keyframes pmCheck   { 0%{transform:scale(0)} 60%{transform:scale(1.15)} 100%{transform:scale(1)} }
  @keyframes payRowIn  { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }

  .pm-spin     { animation: pmSpin 0.8s linear infinite; }
  .pm-fadein   { animation: pmFadeIn 0.25s ease; }
  .pm-checkpop { animation: pmCheck 0.45s cubic-bezier(0.175,0.885,0.32,1.275) forwards; }
  .pay-row     { animation: payRowIn 300ms cubic-bezier(0.23,1,0.32,1) both; }
  .pay-expand  { animation: payRowIn 220ms cubic-bezier(0.23,1,0.32,1) both; }
  .pay-chevron { transition: transform 200ms cubic-bezier(0.23,1,0.32,1); display:flex; }
  .pay-chevron-open { transform: rotate(90deg); }
  .pay-method  { transition: border-color 0.15s, transform 0.15s; cursor: pointer; }
  .pay-method:hover { transform: translateY(-1px); }

  @media (prefers-reduced-motion: reduce) {
    .pm-fadein, .pm-checkpop, .pay-row, .pay-expand { animation: none; }
    .pm-spin { animation: pmSpin 1.5s linear infinite; }
    .pay-chevron, .pay-method { transition: none; }
    .pay-method:hover { transform: none; }
  }
`;

// ── Pay Modal ──────────────────────────────────────────────────────────────────

function PayModal({ amount, desc, method, onClose }: { amount: number; desc: string; method: PayMethod; onClose: () => void }) {
  const [payState, setPayState] = useState<PayState>("idle");
  const [splitPay, setSplitPay] = useState(false);
  const [cardNum, setCardNum]   = useState("");
  const [expiry, setExpiry]     = useState("");
  const [cvv, setCvv]           = useState("");
  const [receiptNum]            = useState(() => "RCP-" + Date.now().toString().slice(-6));

  const selectedMethod = SAVED_METHODS.find((m) => m.id === method) ?? null;
  const installment    = Math.ceil(amount / 3);

  useEffect(() => {
    if (payState !== "processing") return;
    const t = setTimeout(() => setPayState("success"), 2200);
    return () => clearTimeout(t);
  }, [payState]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && payState !== "processing") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [payState, onClose]);

  return (
    <>
      <div
        className={cx("modalOverlay")}
        onClick={(e) => { if (e.target === e.currentTarget && payState !== "processing") onClose(); }}
      >
        <div className={cx("pm-fadein", "pmModalInner")}>

          <div className={cx("pmModalHd")}>
            <div className={cx("flexRow", "gap8")}>
              <Ic n="shieldCheck" sz={15} c="var(--lime)" />
              <span className={cx("fw600", "text11", "colorAccent")}>Secure Payment · 256-bit encrypted</span>
            </div>
            {payState !== "processing" && (
              <button type="button" onClick={onClose} className={cx("iconBtnGhost")}>
                <Ic n="x" sz={16} />
              </button>
            )}
          </div>

          <div className={cx("p24x24x20")}>
            {payState !== "success" && (
              <div className={cx("textCenter", "mb20")}>
                <div className={cx("invTotalVal")}>
                  {fmtDec(splitPay ? installment : amount)}
                </div>
                <div className={cx("text11", "colorMuted", "mt4")}>
                  {splitPay ? `Instalment 1 of 3 · ${desc}` : desc}
                </div>
              </div>
            )}

            {payState === "idle" && (
              <>
                <div className={cx("pmCardFace", "dynBgColor")} style={{ "--bg-color": method !== "bank" ? (selectedMethod?.gradient ?? "var(--s3)") : "var(--s3)" } as React.CSSProperties}>
                  <div className={cx("flexBetween")}>
                    <div className={cx("cardChipAmber")} />
                    {method !== "bank" && <span className={cx("pmCardNetworkLabel", "dynColor")}>{selectedMethod?.network ?? ""}</span>}
                    {method === "bank" && <Ic n="bank" sz={16} c="var(--muted2)" />}
                  </div>
                  <div className={cx("pmCardNumberLabel", "dynColor")} style={{ "--color": method !== "bank" ? "rgba(255,255,255,0.8)" : "var(--muted2)" } as React.CSSProperties}>
                    {method !== "bank" ? `•••• •••• •••• ${selectedMethod?.last4 ?? "????"}` : `FNB Business •••• ${selectedMethod?.last4 ?? "?????"}`}
                  </div>
                </div>

                {method !== "bank" && (
                  <div className={cx("flexCol", "gap10", "mb16")}>
                    <div className={cx("relative")}>
                      <div className={cx("searchIconWrap")}>
                        <Ic n="creditCard" sz={14} c="var(--muted2)" />
                      </div>
                      <input className={cx("input", "pl34")} placeholder="•••• •••• •••• ••••" value={cardNum} onChange={(e) => setCardNum(e.target.value.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim())} />
                    </div>
                    <div className={cx("grid2Cols10Gap")}>
                      <input className={cx("input")} placeholder="MM/YY" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
                      <input className={cx("input")} placeholder="CVV" value={cvv} onChange={(e) => setCvv(e.target.value.slice(0,4))} type="password" />
                    </div>
                  </div>
                )}

                {method === "bank" && (
                  <div className={cx("card", "p12x14", "mb16", "dynBgColor")}>
                    <div className={cx("fw600", "text11", "mb6")}>Bank Transfer Reference</div>
                    <div className={cx("text12", "colorMuted")}>Account: FNB 62 345 678 9</div>
                    <div className={cx("fontMono", "text11", "mt4", "colorAccent")}>VEL-{desc.split(" ")[0].toUpperCase().slice(0,4)}-{amount}</div>
                  </div>
                )}

                <div className={cx("splitPayToggleRow")}>
                  <button type="button" onClick={() => setSplitPay((p) => !p)} className={cx("splitPayToggleBtn", "dynBgColor")}>
                    <Ic n="splitPay" sz={14} c={splitPay ? "var(--amber)" : "var(--muted2)"} />
                    <span className={cx("fw600", "text12", "dynColor", "flex1", "textLeft")} style={{ "--color": splitPay ? "var(--amber)" : "inherit" } as React.CSSProperties}>
                      Split into 3 monthly payments
                    </span>
                    <span className={cx("splitPayBadge", "dynBgColor")} style={{ "--bg-color": splitPay ? "color-mix(in oklab, var(--amber) 15%, transparent)" : "var(--s3)", "--color": splitPay ? "var(--amber)" : "var(--muted2)" } as React.CSSProperties}>
                      {splitPay ? "ON" : "OFF"}
                    </span>
                  </button>
                  {splitPay && (
                    <div className={cx("mt10", "flexCol", "gap4")}>
                      {["Today", "30 days", "60 days"].map((label, i) => (
                        <div key={i} className={cx("flexBetween")}>
                          <span className={cx("text11", "colorMuted")}>{label}</span>
                          <span className={cx("fontMono", "fw700", "text11", "colorAmber", "tabularNums")}>{fmtDec(installment)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button type="button" onClick={() => setPayState("processing")} className={cx("btnPrimary")}>
                  <Ic n="lock" sz={14} c="var(--bg)" />
                  Pay {fmtDec(splitPay ? installment : amount)} Securely
                </button>
              </>
            )}

            {payState === "processing" && (
              <div className={cx("textCenter", "p20x0x8")}>
                <div className={cx("spinnerLg", "pm-spin")} />
                <div className={cx("fw700", "text13", "mb4")}>Processing securely...</div>
                <div className={cx("text11", "colorMuted")}>Please don&apos;t close this window</div>
              </div>
            )}

            {payState === "success" && (
              <div className={cx("textCenter", "p8x0x4")}>
                <div className={cx("pmSuccessCircle")}>
                  <Ic n="check" sz={28} c="var(--lime)" sw={2.5} />
                </div>
                <div className={cx("fw800", "text16", "mb4")}>Payment Successful!</div>
                <div className={cx("text11", "colorMuted", "mb16")}>{desc}</div>
                <div className={cx("pmReceiptBlock", "dynBgColor")}>
                  <div className={cx("text10", "colorMuted", "mb2")}>Receipt Number</div>
                  <div className={cx("fontMono", "fw700", "text13", "colorAccent", "monoTag")}>{receiptNum}</div>
                </div>
                <div className={cx("flexRow", "justifyCenter", "gap8")}>
                  <button type="button" className={cx("btnSm", "btnGhost", "flexRow", "gap5")} title="Download not yet available" disabled>
                    <Ic n="download" sz={13} /> Download Receipt
                  </button>
                  <button type="button" className={cx("btnSm", "btnAccent")} onClick={onClose}>Close</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export function PaymentsPage({ payments: apiPayments = [], invoices: apiInvoices = [] }: { payments?: PortalPayment[]; invoices?: PortalInvoice[] }) {
  const [tab, setTab]                 = useState<PTab>("All");
  const [search, setSearch]           = useState("");
  const [expanded, setExpanded]       = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PayMethod>(SAVED_METHODS[0]?.id ?? "visa");
  const [payModal, setPayModal]       = useState<{ amount: number; desc: string } | null>(null);

  const now = new Date("2026-03-05").getTime();

  const paymentData: Payment[] = useMemo(() => {
    if (apiPayments.length === 0) return [];
    const invoiceMap = new Map(apiInvoices.map((inv) => [inv.id, inv]));
    const fmtMoney = (cents: number) => `${CURRENCY_SYMBOL} ${(cents / 100).toLocaleString(LOCALE)}`;
    const statusMap: Record<string, PStatus> = {
      COMPLETED: "Paid", PENDING: "Pending", FAILED: "Overdue", REFUNDED: "Paid",
    };
    return apiPayments.map((pay) => {
      const inv = invoiceMap.get(pay.invoiceId);
      const status: PStatus = statusMap[pay.status] ?? "Pending";
      return {
        id: pay.id.slice(0, 8).toUpperCase(),
        invoiceRef: inv?.number ?? pay.invoiceId.slice(0, 8),
        description: inv ? `Invoice ${inv.number}` : "Payment",
        date: pay.paidAt ? new Date(pay.paidAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—",
        dueDate: inv?.dueAt ? new Date(inv.dueAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—",
        amountRaw: pay.amountCents / 100,
        status,
        method: pay.provider ?? undefined,
        category: "Development" as PCategory,
        project: "Active Project",
        contact: "Account Manager",
        contactInitials: "AM",
        receiptNum: pay.transactionRef ?? undefined,
      };
    });
  }, [apiPayments, apiInvoices]);

  const filtered = useMemo(() => {
    let list = tab === "All" ? paymentData : paymentData.filter((p) => p.status === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.description.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    return list;
  }, [tab, search, paymentData]);

  const overdueItems   = paymentData.filter((p) => p.status === "Overdue");
  const totalPaid      = paymentData.filter((p) => p.status === "Paid").reduce((s, p) => s + p.amountRaw, 0);
  const totalPending   = paymentData.filter((p) => p.status === "Pending").reduce((s, p) => s + p.amountRaw, 0);
  const totalOverdue   = paymentData.filter((p) => p.status === "Overdue").reduce((s, p) => s + p.amountRaw, 0);

  const statusBadge = (s: PStatus) => s === "Paid" ? "badgeGreen" : s === "Pending" ? "badgeAmber" : "badgeRed";

  return (
    <div className={cx("pageBody")}>
      <style>{PAGE_STYLES}</style>

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className={cx("pageHeader", "mb0")}>
        <div>
          <div className={cx("pageEyebrow")}>Finance · Payments</div>
          <h1 className={cx("pageTitle")}>Payments</h1>
          <p className={cx("pageSub")}>Manage payments, track history, and settle outstanding invoices securely.</p>
        </div>
        <div className={cx("pageActions")}>
          <button type="button" className={cx("btnSm", "btnGhost", "flexRow", "gap6")}>
            <Ic n="download" sz={13} /> Download Statement
          </button>
          <button type="button" className={cx("btnSm", "btnGhost", "flexRow", "gap6")}>
            <Ic n="bell" sz={13} /> Reminders
          </button>
        </div>
      </div>

      {/* ── Stat cards ───────────────────────────────────────────────────── */}
      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Total Paid",   value: paymentData.length > 0 ? fmt(totalPaid)    : "—", color: "statCardGreen", icon: "check",    iconColor: "var(--green)", trend: `${paymentData.filter(p => p.status === "Paid").length} transactions` },
          { label: "Outstanding",  value: paymentData.length > 0 ? fmt(totalPending) : "—", color: "statCardAmber", icon: "clock",    iconColor: "var(--amber)", trend: `${paymentData.filter(p => p.status === "Pending").length} pending` },
          { label: "Overdue",      value: paymentData.length > 0 ? fmt(totalOverdue) : "—", color: "statCardRed",   icon: "alert",    iconColor: "var(--red)",   trend: paymentData.length > 0 ? "See payment list" : "No overdue items" },
          { label: "Next Due",     value: "—",                                               color: "statCardBlue",  icon: "calendar", iconColor: "var(--cyan)",  trend: "No upcoming payments" },
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

      {/* ── Payment Activity + Upcoming Schedule ─────────────────────────── */}
      <div className={cx("grid2", "mb16")}>

        {/* Payment Activity */}
        <div className={cx("card", "p16x20")}>
          <div className={cx("cardHd", "mb14")}>
            <span className={cx("cardHdTitle")}>Payment Activity</span>
            <div className={cx("flexRow", "gap10")}>
              {[{ color: "var(--lime)", label: "Paid" }, { color: "var(--amber)", label: "Pending" }, { color: "var(--red)", label: "Overdue" }].map(({ color, label }) => (
                <span key={label} className={cx("flexRow", "gap4")}>
                  <span className={cx("dot7", "inlineBlock")} style={{ "--bg-color": color } as React.CSSProperties} />
                  <span className={cx("fontMono", "text10", "colorMuted2")}>{label}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Chart */}
          {ACTIVITY.length === 0 ? (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}><Ic n="activity" sz={22} c="var(--muted2)" /></div>
              <div className={cx("emptyStateTitle")}>No payment activity yet</div>
              <div className={cx("emptyStateSub")}>Payment activity data will appear here once payments are recorded.</div>
            </div>
          ) : (
          <div className={cx("relative")}>
            {/* Amount labels row — separate from bar columns to avoid overflow */}
            <div className={cx("flexRow", "gap16", "mb4")}>
              {ACTIVITY.map((m) => {
                const isEmpty = m.paid + m.pending + m.overdue === 0;
                return (
                  <span key={m.month} className={cx("actBarLabel", "fontMono", "dynColor")} style={{ "--color": isEmpty ? "var(--muted2)" : "var(--lime)" } as React.CSSProperties}>
                    {isEmpty ? "—" : fmt(m.paid + m.pending + m.overdue)}
                  </span>
                );
              })}
            </div>

            {/* Bars */}
            <div className={cx("actBarContainer")}>
              {ACTIVITY.map((m) => {
                const totalH   = ((m.paid + m.pending + m.overdue) / CHART_MAX) * CHART_H;
                const paidH    = (m.paid    / CHART_MAX) * CHART_H;
                const pendingH = (m.pending / CHART_MAX) * CHART_H;
                const overdueH = (m.overdue / CHART_MAX) * CHART_H;
                const isEmpty  = totalH === 0;
                return (
                  <div key={m.month} className={cx("actMonthCol")}>
                    {/* Bar stack */}
                    <div className={cx("chartContainerBase", "dynBgColor")} style={{ "--bg-color": isEmpty ? "var(--s3)" : "transparent", "--pct": `${CHART_H}px` } as React.CSSProperties}>
                      {paidH > 0 && <div className={cx("colBarFill", "dotBgAccent")}  />}
                      {overdueH > 0 && <div className={cx("colBarFill", "dotBgRed", "colBarHeightVar")} style={{ "--pct": `${overdueH}px` } as React.CSSProperties} />}
                      {pendingH > 0 && <div className={cx("colBarFill", "colBarAmber")} style={{ "--pct": `${pendingH}px` } as React.CSSProperties} />}
                    </div>
                    {/* Month label */}
                    <span className={cx("fontMono", "text10", "colorMuted2")}>{m.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
          )}

          {/* Footer summary */}
          {ACTIVITY.length > 0 && (
          <div className={cx("pt10", "borderT", "flexRow", "justifyBetween")}>
            <span className={cx("text10", "colorMuted2")}>Activity summary</span>
            <span className={cx("fontMono", "fw700", "text10", "colorAccent", "tabularNums")}>
              {fmt(ACTIVITY.reduce((s, m) => s + m.paid, 0))} collected
            </span>
          </div>
          )}
        </div>

        {/* Upcoming Schedule */}
        <div className={cx("card", "p16x20")}>
          <div className={cx("cardHd", "mb14")}>
            <span className={cx("cardHdTitle")}>Upcoming Schedule</span>
            {UPCOMING.length > 0 && (
              <span className={cx("fontMono", "text10", "colorMuted2")}>{fmt(UPCOMING.reduce((s, u) => s + u.amountRaw, 0))} due</span>
            )}
          </div>

          {UPCOMING.length === 0 ? (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}><Ic n="calendar" sz={22} c="var(--muted2)" /></div>
              <div className={cx("emptyStateTitle")}>No upcoming payments</div>
              <div className={cx("emptyStateSub")}>Scheduled upcoming payments will appear here.</div>
            </div>
          ) : (
          <div className={cx("flexCol", "gap8")}>
            {UPCOMING.map((u) => {
              const sc = STATUS_COLOR[u.status];
              return (
                <div key={u.id} className={cx("upcomingRowCard", "dynBorderLeft3")} style={{ "--color": sc } as React.CSSProperties}>
                  <div className={cx("dot8", "noShrink", "dynBgColor")} style={{ "--bg-color": sc } as React.CSSProperties} />
                  <div className={cx("flex1", "minW0")}>
                    <div className={cx("fw600", "text11", "truncate")}>{u.desc}</div>
                    <div className={cx("fontMono", "text10", "colorMuted2", "mt1")}>{u.date}</div>
                  </div>
                  <div className={cx("flexColEndRight")}>
                    <span className={cx("fontMono", "fw700", "text11", "tabularNums")}>{fmt(u.amountRaw)}</span>
                    {u.status === "Overdue" ? (
                      <button type="button" className={cx("btnSm", "btnPayOverdue")}
                        onClick={() => setPayModal({ amount: u.amountRaw, desc: u.desc })}
                      >
                        <Ic n="creditCard" sz={10} c="var(--red)" /> Pay
                      </button>
                    ) : (
                      <span className={cx("badge", "badgeAmber", "badgeSm2")}>Upcoming</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      </div>

      {/* ── Payment Methods ───────────────────────────────────────────────── */}
      <div className={cx("card", "mb16")}>
        <div className={cx("cardHd")}>
          <span className={cx("cardHdTitle")}>Saved Payment Methods</span>
          <span className={cx("flexRow", "gap5")}>
            <Ic n="shieldCheck" sz={11} c="var(--lime)" />
            <span className={cx("fontMono", "text10", "colorAccent")}>PCI-DSS Compliant</span>
          </span>
        </div>

        <div className={cx("p12x20x20", "flexRow", "gap12", "flexWrap")}>
          {SAVED_METHODS.map((m) => {
            const active = selectedMethod === m.id;
            const isBank = m.id === "bank";
            return (
              <div
                key={m.id}
                onClick={() => setSelectedMethod(m.id)}
                className={cx("pmSavedCard", "dynBgColor")} style={{ "--bg-color": isBank ? "var(--s3)" : m.gradient, "--color": active ? "var(--lime)" : isBank ? "var(--b2)" : "transparent", "--box-shadow": active ? "0 0 0 1px color-mix(in oklab, var(--lime) 30%, transparent)" : "none" } as React.CSSProperties}
              >
                {/* Top row */}
                <div className={cx("flexBetween")}>
                  {isBank ? (
                    <Ic n="bank" sz={18} c="var(--muted2)" />
                  ) : (
                    <div className={cx("cardChipAmber")} />
                  )}
                  <div className={cx("flexRow", "gap5")}>
                    {active && (
                      <span className={cx("pmDefaultBadge", "fontMono")}>
                        DEFAULT
                      </span>
                    )}
                    {m.id === "visa" && <span className={cx("pmNetworkLabel")}>VISA</span>}
                    {m.id === "mc" && (
                      <div className={cx("flexRow")}>
                        <div className={cx("mcRed")} />
                        <div className={cx("mcYellow")} />
                      </div>
                    )}
                    {isBank && <span className={cx("pmBankLabel", "fontMono")}>FNB</span>}
                  </div>
                </div>

                {/* Bottom row */}
                <div>
                  {isBank ? (
                    <>
                      <div className={cx("text10", "colorMuted2", "mb2")}>FNB Business</div>
                      <div className={cx("fontMono", "fw600", "text11")}>•••• {m.last4}</div>
                    </>
                  ) : (
                    <>
                      <div className={cx("pmCardMasked", "dynColor")} style={{ "--color": "rgba(255,255,255,0.55)" } as React.CSSProperties}>•••• •••• •••• {m.last4}</div>
                      <div className={cx("flexBetween")}>
                        <span className={cx("pmCardExpiry", "dynColor")} style={{ "--color": "rgba(255,255,255,0.4)" } as React.CSSProperties}>{m.expiry}</span>
                        <div className={cx("flexRow", "flexCenter", "gap3")}>
                          <Ic n="shieldCheck" sz={9} c="rgba(200,241,53,0.6)" />
                          <span className={cx("pmCardVerified", "dynColor")} style={{ "--color": "rgba(200,241,53,0.6)" } as React.CSSProperties}>VERIFIED</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add card */}
          <button
            type="button"
            className={cx("btnOutline", "gap6", "text11", "fw500")}
            onClick={() => {
              // TODO: wire to payment method modal/flow when implemented
              window.alert("Add Payment Method flow coming soon.");
            }}
          >
            <Ic n="plus" sz={14} c="currentColor" />
            Add Payment Method
          </button>
        </div>

        {/* Security row */}
        <div className={cx("p10x20x14", "borderT", "flexRow", "gap16", "flexWrap")}>
          {[
            { icon: "shieldCheck", label: "256-bit SSL" },
            { icon: "lock",        label: "3D Secure" },
            { icon: "check",       label: "PCI-DSS Level 1" },
          ].map(({ icon, label }) => (
            <span key={label} className={cx("flexRow", "gap5")}>
              <Ic n={icon} sz={11} c="var(--lime)" />
              <span className={cx("fontMono", "text10", "colorMuted2")}>{label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Overdue alert ────────────────────────────────────────────────── */}
      {overdueItems.length > 0 && (
        <div className={cx("invOverdueBanner")}>
          <Ic n="alert" sz={16} c="var(--red)" />
          <div className={cx("flex1")}>
            <div className={cx("fs078")}>
              <strong className={cx("fontMono")}>{overdueItems[0].id}</strong>
              <span className={cx("colorMuted")}> — {overdueItems[0].description} · {fmt(overdueItems[0].amountRaw)}</span>
            </div>
            <div className={cx("fontMono", "text10", "colorMuted2", "mt2")}>
              Due {overdueItems[0].dueDate} · {overdueItems[0].project}
            </div>
          </div>
          <button
            type="button"
            className={cx("btnSm", "btnPayNow", "dynBgColor")}
            onClick={() => setPayModal({ amount: overdueItems[0].amountRaw, desc: overdueItems[0].description })}
          >
            <Ic n="creditCard" sz={12} c="var(--red)" />
            Pay {fmt(overdueItems[0].amountRaw)} Now
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
        <div className={cx("relative", "minW200", "maxW260")}>
          <span className={cx("searchIconWrap")}>
            <Ic n="filter" sz={13} c="var(--muted2)" />
          </span>
          <input
            className={cx("input", "searchInput")}
            placeholder="Filter by description, category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Transaction list ─────────────────────────────────────────────── */}
      <div className={cx("card", "overflowHidden")}>

        {filtered.length > 0 && (
          <div className={cx("tableHeadGrid6col")}>
            {["", "Description", "Date", "Amount", "Status", ""].map((h, i) => (
              <span key={i} className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls012")}>{h}</span>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className={cx("emptyState")}>
            <div className={cx("emptyStateIcon")}><Ic n="creditCard" sz={22} c="var(--muted2)" /></div>
            <div className={cx("emptyStateTitle")}>No payments found</div>
            <div className={cx("emptyStateSub")}>
              {search ? `No results for "${search}"` : `No ${tab === "All" ? "" : tab.toLowerCase() + " "}payments found.`}
            </div>
            {search && (
              <button type="button" className={cx("btnSm", "btnGhost", "mt12")} onClick={() => setSearch("")}>
                Clear filter
              </button>
            )}
          </div>
        ) : (
          filtered.map((p, idx) => {
            const isOpen      = expanded === p.id;
            const catCfg      = CAT[p.category];
            const statusColor = STATUS_COLOR[p.status];
            return (
              <div
                key={p.id}
                className={cx("dynBorderLeft3", idx < filtered.length - 1 && "borderB")}
                style={{ "--color": statusColor, "--delay": `${idx * 0.04}s` } as React.CSSProperties}
              >
                {/* Row trigger */}
                <button
                  type="button"
                  aria-expanded={isOpen}
                  className={cx("gridRowBtn6col")}
                  onClick={() => setExpanded(isOpen ? null : p.id)}
                >
                  {/* Category icon box */}
                  <div className={cx("pmIconBox36", "dynBgColor")} style={{ "--bg-color": `color-mix(in oklab, ${catCfg.color} 12%, var(--s2))`, "--color": `color-mix(in oklab, ${catCfg.color} 25%, transparent)` } as React.CSSProperties}>
                    <Ic n={catCfg.icon} sz={15} c={catCfg.color} />
                  </div>

                  {/* Description + ID */}
                  <div className={cx("minW0")}>
                    <div className={cx("fw600", "text12", "truncate")}>{p.description}</div>
                    <div className={cx("flexRow", "flexCenter", "gap6", "mt2")}>
                      <span className={cx("fontMono", "text10", "colorAccent")}>{p.id}</span>
                      <span className={cx("fontMono", "text10", "pmCatBadge", "dynBgColor")} style={{ "--bg-color": `color-mix(in oklab, ${catCfg.color} 10%, var(--s3))`, "--color": catCfg.color } as React.CSSProperties}>
                        {p.category}
                      </span>
                    </div>
                  </div>

                  {/* Date */}
                  <span className={cx("fontMono", "text10", "colorMuted2")}>
                    {p.status === "Paid" ? p.date : p.dueDate}
                  </span>

                  {/* Amount */}
                  <span className={cx("fontMono", "fw700", "text12", "textRight", "tabularNums")}>{fmt(p.amountRaw)}</span>

                  {/* Status badge */}
                  <span className={cx("badge", statusBadge(p.status))}>{p.status}</span>

                  {/* Chevron */}
                  <span className={`pay-chevron${isOpen ? " pay-chevron-open" : ""}`}>
                    <Ic n="chevronRight" sz={14} c="var(--muted2)" />
                  </span>
                </button>

                {/* Expanded */}
                {isOpen && (
                  <div className={cx("payRowExpanded", "dynBgColor")} style={{ "--bg-color": `color-mix(in oklab, ${statusColor} 4%, var(--s2))` } as React.CSSProperties}>
                    <div className={cx("payRowGrid")}>

                      {/* Left: Payment details */}
                      <div className={cx("panelL")}>
                        <div className={cx("grid2Cols", "gap8", "mb12")}>
                          {[
                            { label: "Invoice Ref", value: p.invoiceRef },
                            { label: "Project",     value: p.project    },
                            { label: "Method",      value: p.method ?? "—"  },
                            { label: "Category",    value: p.category   },
                          ].map(({ label, value }) => (
                            <div key={label} className={cx("infoChip")}>
                              <div className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls01", "mb3")}>{label}</div>
                              <div className={cx("fw700", "text11")}>{value}</div>
                            </div>
                          ))}
                        </div>

                        {/* Receipt / overdue info */}
                        {p.receiptNum && (
                          <div className={cx("pmDetailReceiptRow")}>
                            <Ic n="check" sz={13} c="var(--lime)" sw={2.5} />
                            <span className={cx("text11")}>Paid in full ·</span>
                            <span className={cx("fontMono", "text11", "fw700", "colorAccent")}>{p.receiptNum}</span>
                            <button type="button" className={cx("btnSm", "btnGhost", "mlAuto", "flexRow", "gap4", "colorInherit")}>
                              <Ic n="download" sz={11} /> Receipt
                            </button>
                          </div>
                        )}
                        {p.status === "Overdue" && (
                          <div className={cx("pmDetailReceiptRow", "dynBgColor")} style={{ "--bg-color": "color-mix(in oklab, var(--red) 6%, var(--s1))", "--color": "color-mix(in oklab, var(--red) 18%, transparent)" } as React.CSSProperties}>
                            <Ic n="alert" sz={13} c="var(--red)" />
                            <span className={cx("text11")}>Overdue ·</span>
                            <span className={cx("fontMono", "text11", "fw700", "colorRed")}>Due {p.dueDate}</span>
                          </div>
                        )}

                        {p.note && (
                          <div className={cx("cardS3", "p8x10", "mt8")}>
                            <p className={cx("text10", "colorMuted", "m0", "lineH16")}>{p.note}</p>
                          </div>
                        )}
                      </div>

                      {/* Right: Contact + actions */}
                      <div className={cx("p14x20", "flexCol", "gap10")}>
                        <div className={cx("infoChip")}>
                          <Av initials={p.contactInitials} size={32} />
                          <div className={cx("minW0")}>
                            <div className={cx("fw700", "text11", "truncate")}>{p.contact}</div>
                            <div className={cx("fontMono", "text10", "colorMuted2")}>{p.project}</div>
                          </div>
                        </div>

                        <div className={cx("flexCol", "gap5")}>
                          {[
                            { label: "Due",    value: p.dueDate, icon: "calendar" },
                            ...(p.status === "Paid" ? [{ label: "Paid", value: p.date, icon: "check" }] : []),
                          ].map(({ label, value, icon }) => (
                            <div key={label} className={cx("flexBetween")}>
                              <div className={cx("flexRow", "gap5")}>
                                <Ic n={icon} sz={11} c="var(--muted2)" />
                                <span className={cx("text10", "colorMuted2")}>{label}</span>
                              </div>
                              <span className={cx("fontMono", "text10", "fw600")}>{value}</span>
                            </div>
                          ))}
                        </div>

                        <div className={cx("flexCol", "gap6", "mtAuto")}>
                          {p.status !== "Paid" && (
                            <button
                              type="button"
                              className={cx("btnSm", "btnAccent", "wFull", "flexRow", "flexCenter", "justifyCenter", "gap5")}
                              onClick={() => setPayModal({ amount: p.amountRaw, desc: p.description })}
                            >
                              <Ic n="creditCard" sz={12} /> Pay {fmt(p.amountRaw)} Now
                            </button>
                          )}
                          {p.status === "Paid" && (
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

      {/* ── Pay Modal ─────────────────────────────────────────────────────── */}
      {payModal && (
        <PayModal
          amount={payModal.amount}
          desc={payModal.desc}
          method={selectedMethod}
          onClose={() => setPayModal(null)}
        />
      )}
    </div>
  );
}

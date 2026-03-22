"use client";
import { useState, useMemo, useEffect } from "react";
import { cx } from "../style";
import { Ic, Av } from "../ui";
import type { PortalPayment, PortalInvoice } from "../../../../lib/api/portal/types";
import { formatMoneyCents } from "../../../../lib/i18n/currency";
import { useProjectLayer } from "../hooks/use-project-layer";
import { saveSession } from "../../../../lib/auth/session";
import { loadPortalProjectPaymentMilestonesWithRefresh } from "../../../../lib/api/portal";
import type { PortalProjectPaymentMilestone } from "../../../../lib/api/portal";
import { initiatePortalPayfastWithRefresh } from "../../../../lib/api/portal/projects";

// ── Types ──────────────────────────────────────────────────────────────────────

type PTab      = "All" | "Paid" | "Pending" | "Overdue";
type PStatus   = "Paid" | "Pending" | "Overdue";
type PCategory = "Development" | "Design" | "Retainer" | "Strategy" | "QA" | "Change Request";

interface Payment {
  id: string; invoiceRef: string; invoiceId: string; description: string;
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

const CHART_H = 104;

const TABS: PTab[] = ["All", "Paid", "Pending", "Overdue"];

const daysAgo = (dateStr: string, now: number) => {
  const d = new Date(dateStr.split(" ").reverse().join("-").replace("Apr","04").replace("Mar","03").replace("Feb","02").replace("Jan","01"));
  return Math.max(0, Math.floor((now - d.getTime()) / 86_400_000));
};

// ── Page Styles ────────────────────────────────────────────────────────────────

const PAGE_STYLES = `
  @keyframes payRowIn  { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }

  .pay-row     { animation: payRowIn 300ms cubic-bezier(0.23,1,0.32,1) both; }
  .pay-expand  { animation: payRowIn 220ms cubic-bezier(0.23,1,0.32,1) both; }
  .pay-chevron { transition: transform 200ms cubic-bezier(0.23,1,0.32,1); display:flex; }
  .pay-chevron-open { transform: rotate(90deg); }

  @media (prefers-reduced-motion: reduce) {
    .pay-row, .pay-expand { animation: none; }
    .pay-chevron { transition: none; }
  }
`;


// ── Main Page ──────────────────────────────────────────────────────────────────

export function PaymentsPage({ payments: apiPayments = [], invoices: apiInvoices = [], currency = "ZAR" }: { payments?: PortalPayment[]; invoices?: PortalInvoice[]; currency?: string }) {
  const { session, projectId } = useProjectLayer();
  const [milestones, setMilestones] = useState<PortalProjectPaymentMilestone[] | null>(null);

  useEffect(() => {
    if (!session || !projectId) return;
    loadPortalProjectPaymentMilestonesWithRefresh(session, projectId).then(r => {
      if (r.nextSession) saveSession(r.nextSession);
      if (r.data) setMilestones(r.data);
    });
  }, [session, projectId]);

  const [tab, setTab]                   = useState<PTab>("All");
  const [search, setSearch]             = useState("");
  const [expanded, setExpanded]         = useState<string | null>(null);
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
  const [payLoading, setPayLoading]           = useState(false);
  const [payError, setPayError]               = useState<string | null>(null);

  async function handlePayNow(invoiceId: string) {
    if (!session) return;
    setPayLoading(true);
    setPayError(null);
    const r = await initiatePortalPayfastWithRefresh(session, {
      invoiceId,
      returnUrl: window.location.href,
      cancelUrl: window.location.href,
    });
    if (r.nextSession) saveSession(r.nextSession);
    if (r.error || !r.data?.redirectUrl) {
      setPayError(r.error?.message ?? "Failed to initiate payment.");
      setPayLoading(false);
      return;
    }
    window.location.href = r.data.redirectUrl;
  }

  const monthlyActivity = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const label = d.toLocaleDateString("en-ZA", { month: "short" });
      const total = (apiPayments ?? [])
        .filter(p => {
          const pd = new Date(p.createdAt);
          return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear();
        })
        .reduce((s, p) => s + p.amountCents, 0);
      return { label, amountCents: total };
    });
  }, [apiPayments]);

  const paymentData: Payment[] = useMemo(() => {
    if (apiPayments.length === 0) return [];
    const invoiceMap = new Map(apiInvoices.map((inv) => [inv.id, inv]));
    const statusMap: Record<string, PStatus> = {
      COMPLETED: "Paid", PENDING: "Pending", FAILED: "Overdue", REFUNDED: "Paid",
    };
    return apiPayments.map((pay) => {
      const inv = invoiceMap.get(pay.invoiceId);
      const status: PStatus = statusMap[pay.status] ?? "Pending";
      return {
        id: pay.id.slice(0, 8).toUpperCase(),
        invoiceRef: inv?.number ?? pay.invoiceId.slice(0, 8),
        invoiceId: pay.invoiceId,
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

  const overdueItems     = paymentData.filter((p) => p.status === "Overdue");
  const totalPaidCents   = apiPayments.filter((p) => p.status === "COMPLETED" || p.status === "REFUNDED").reduce((s, p) => s + p.amountCents, 0);
  const totalPendingCents = apiPayments.filter((p) => p.status === "PENDING").reduce((s, p) => s + p.amountCents, 0);
  const totalOverdueCents = apiPayments.filter((p) => p.status === "FAILED").reduce((s, p) => s + p.amountCents, 0);

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
          { label: "Total Paid",   value: apiPayments.length > 0 ? formatMoneyCents(totalPaidCents,    { currency })    : "—", color: "statCardGreen", icon: "check",    iconColor: "var(--green)", trend: `${paymentData.filter(p => p.status === "Paid").length} transactions` },
          { label: "Outstanding",  value: apiPayments.length > 0 ? formatMoneyCents(totalPendingCents, { currency }) : "—", color: "statCardAmber", icon: "clock",    iconColor: "var(--amber)", trend: `${paymentData.filter(p => p.status === "Pending").length} pending` },
          { label: "Overdue",      value: apiPayments.length > 0 ? formatMoneyCents(totalOverdueCents, { currency }) : "—", color: "statCardRed",   icon: "alert",    iconColor: "var(--red)",   trend: paymentData.length > 0 ? "See payment list" : "No overdue items" },
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
          {monthlyActivity.every(m => m.amountCents === 0) ? (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}><Ic n="activity" sz={22} c="var(--muted2)" /></div>
              <div className={cx("emptyStateTitle")}>No payment activity yet</div>
              <div className={cx("emptyStateSub")}>Payment activity data will appear here once payments are recorded.</div>
            </div>
          ) : (
          <div className={cx("relative")}>
            {/* Amount labels row — separate from bar columns to avoid overflow */}
            <div className={cx("flexRow", "gap16", "mb4")}>
              {monthlyActivity.map((m) => {
                const isEmpty = m.amountCents === 0;
                return (
                  <span key={m.label} className={cx("actBarLabel", "fontMono", "dynColor")} style={{ "--color": isEmpty ? "var(--muted2)" : "var(--lime)" } as React.CSSProperties}>
                    {isEmpty ? "—" : formatMoneyCents(m.amountCents, { currency })}
                  </span>
                );
              })}
            </div>

            {/* Bars */}
            <div className={cx("actBarContainer")}>
              {(() => {
                const chartMax = Math.max(...monthlyActivity.map(b => b.amountCents), 1);
                return monthlyActivity.map((m) => {
                  const totalH = (m.amountCents / chartMax) * CHART_H;
                  const isEmpty = totalH === 0;
                  return (
                    <div key={m.label} className={cx("actMonthCol")}>
                      {/* Bar */}
                      <div className={cx("chartContainerBase", "dynBgColor")} style={{ "--bg-color": isEmpty ? "var(--s3)" : "transparent", "--pct": `${CHART_H}px` } as React.CSSProperties}>
                        {!isEmpty && <div className={cx("colBarFill", "dotBgAccent")} style={{ "--pct": `${totalH}px` } as React.CSSProperties} />}
                      </div>
                      {/* Month label */}
                      <span className={cx("fontMono", "text10", "colorMuted2")}>{m.label}</span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
          )}

          {/* Footer summary */}
          {!monthlyActivity.every(m => m.amountCents === 0) && (
          <div className={cx("pt10", "borderT", "flexRow", "justifyBetween")}>
            <span className={cx("text10", "colorMuted2")}>Activity summary</span>
            <span className={cx("fontMono", "fw700", "text10", "colorAccent", "tabularNums")}>
              {formatMoneyCents(monthlyActivity.reduce((s, m) => s + m.amountCents, 0), { currency })} collected
            </span>
          </div>
          )}
        </div>

        {/* Upcoming Schedule */}
        <div className={cx("card", "p16x20")}>
          <div className={cx("cardHd", "mb14")}>
            <span className={cx("cardHdTitle")}>Upcoming Schedule</span>
            {milestones !== null && milestones.filter(m => !m.paid).length > 0 && (
              <span className={cx("fontMono", "text10", "colorMuted2")}>{formatMoneyCents(milestones.filter(m => !m.paid).reduce((s, m) => s + m.amountCents, 0), { currency })} due</span>
            )}
          </div>

          {milestones === null ? (
            <div className={cx("flexCol", "gap8")}>
              {[1, 2, 3].map(n => <div key={n} className={cx("skeletonRow")} />)}
            </div>
          ) : milestones.filter(m => !m.paid).length === 0 ? (
            <div className={cx("emptyState")}>
              <div className={cx("emptyStateIcon")}><Ic n="calendar" sz={22} c="var(--muted2)" /></div>
              <div className={cx("emptyStateTitle")}>No upcoming payments</div>
              <div className={cx("emptyStateSub")}>Scheduled upcoming payments will appear here.</div>
            </div>
          ) : (
          <div className={cx("flexCol", "gap8")}>
            {milestones.filter(m => !m.paid).map((m) => (
              <div key={m.stage} className={cx("upcomingRowCard", "dynBorderLeft3")} style={{ "--color": "var(--amber)" } as React.CSSProperties}>
                <div className={cx("dot8", "noShrink", "dynBgColor")} style={{ "--bg-color": "var(--amber)" } as React.CSSProperties} />
                <div className={cx("flex1", "minW0")}>
                  <div className={cx("fw600", "text11", "truncate")}>
                    {m.stage === "MILESTONE_30" ? "Milestone Payment (30%)" : m.stage === "FINAL_20" ? "Final Payment (20%)" : m.stage}
                  </div>
                </div>
                <div className={cx("flexColEndRight")}>
                  <span className={cx("fontMono", "fw700", "text11", "tabularNums")}>{formatMoneyCents(m.amountCents, { currency })}</span>
                  <span className={cx("badge", "badgeAmber", "badgeSm2")}>Upcoming</span>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>

      {/* ── Overdue alert ────────────────────────────────────────────────── */}
      {overdueItems.length > 0 && (
        <div className={cx("invOverdueBanner")}>
          <Ic n="alert" sz={16} c="var(--red)" />
          <div className={cx("flex1")}>
            <div className={cx("fs078")}>
              <strong className={cx("fontMono")}>{overdueItems[0].id}</strong>
              <span className={cx("colorMuted")}> — {overdueItems[0].description} · {formatMoneyCents(Math.round(overdueItems[0].amountRaw * 100), { currency })}</span>
            </div>
            <div className={cx("fontMono", "text10", "colorMuted2", "mt2")}>
              Due {overdueItems[0].dueDate} · {overdueItems[0].project}
            </div>
          </div>
          <button
            type="button"
            className={cx("btnSm", "btnPayNow", "dynBgColor")}
            onClick={() => {
              const p0 = apiPayments.find(p => p.status === "FAILED");
              if (p0) setPayingInvoiceId(p0.invoiceId);
            }}
          >
            <Ic n="creditCard" sz={12} c="var(--red)" />
            Pay {formatMoneyCents(Math.round(overdueItems[0].amountRaw * 100), { currency })} Now
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
                  <span className={cx("fontMono", "fw700", "text12", "textRight", "tabularNums")}>{formatMoneyCents(Math.round(p.amountRaw * 100), { currency })}</span>

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
                              onClick={() => setPayingInvoiceId(p.invoiceId)}
                            >
                              <Ic n="creditCard" sz={12} /> Pay {formatMoneyCents(Math.round(p.amountRaw * 100), { currency })} Now
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

      {/* ── PayFast confirmation modal ─────────────────────────────────── */}
      {payingInvoiceId && (() => {
        const inv = apiInvoices?.find(i => i.id === payingInvoiceId);
        if (!inv) return null;
        return (
          <div className={cx("modalOverlay")}>
            <div className={cx("modal")}>
              <h3>Pay Invoice</h3>
              <p>{inv.number}</p>
              <p>{formatMoneyCents(inv.amountCents, { currency: inv.currency })}</p>
              <p>You will be redirected to PayFast to complete payment.</p>
              {payError && <p style={{ color: "red" }}>{payError}</p>}
              <button onClick={() => handlePayNow(payingInvoiceId)} disabled={payLoading}>
                {payLoading ? "…" : "Pay Now"}
              </button>
              <button onClick={() => { setPayingInvoiceId(null); setPayError(null); }}>
                Cancel
              </button>
            </div>
          </div>
        );
      })()}

    </div>
  );
}

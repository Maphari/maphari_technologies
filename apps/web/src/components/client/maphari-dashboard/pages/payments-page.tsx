"use client";
import { useState, useMemo, useEffect } from "react";
import { cx } from "../style";
import { Ic } from "../ui";
import { usePageToast } from "../hooks/use-page-toast";
import type { PageId } from "../config";
import type { PortalPayment, PortalInvoice } from "../../../../lib/api/portal/types";
import { formatMoneyCents } from "../../../../lib/i18n/currency";
import { useProjectLayer } from "../hooks/use-project-layer";
import { saveSession } from "../../../../lib/auth/session";
import { createPortalSupportTicketWithRefresh, loadPortalProjectPaymentMilestonesWithRefresh } from "../../../../lib/api/portal";
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
  receiptNum?: string; note?: string;
}

type ReminderTarget = {
  id: string;
  title: string;
  subtitle: string;
  amountCents: number;
  dueText: string;
  badgeClass: "badgeAmber" | "badgeRed";
  statusLabel: "Pending" | "Overdue" | "Upcoming";
  priority: "MEDIUM" | "HIGH";
};

type ReminderSuccess = {
  count: number;
  totalAmountCents: number;
};

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

function csvCell(value: string | number): string {
  return `"${String(value).replace(/"/g, "\"\"")}"`;
}

function triggerStatementDownload(payments: Payment[], currency: string): void {
  const header = [
    "Payment ID",
    "Invoice Ref",
    "Description",
    "Status",
    "Amount",
    "Currency",
    "Issued/Paid Date",
    "Due Date",
    "Method",
    "Receipt",
    "Category",
  ].join(",");
  const rows = payments.map((payment) => [
    csvCell(payment.id),
    csvCell(payment.invoiceRef),
    csvCell(payment.description),
    csvCell(payment.status),
    csvCell(payment.amountRaw.toFixed(2)),
    csvCell(currency),
    csvCell(payment.date),
    csvCell(payment.dueDate),
    csvCell(payment.method ?? "—"),
    csvCell(payment.receiptNum ?? "—"),
    csvCell(payment.category),
  ].join(","));
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const today = new Date().toISOString().slice(0, 10);
  anchor.href = url;
  anchor.download = `maphari-payment-statement-${today}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function formatMilestoneStage(stage: PortalProjectPaymentMilestone["stage"]): string {
  if (stage === "MILESTONE_30") return "Milestone Payment (30%)";
  if (stage === "FINAL_20") return "Final Payment (20%)";
  return stage;
}

// ── Page Styles ────────────────────────────────────────────────────────────────

const PAGE_STYLES = `
  @keyframes payRowIn  { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }

  .pay-row     { animation: payRowIn 300ms cubic-bezier(0.23,1,0.32,1) both; }
  .pay-expand  { animation: payRowIn 220ms cubic-bezier(0.23,1,0.32,1) both; }
  .pay-chevron { transition: transform 200ms cubic-bezier(0.23,1,0.32,1); display:flex; }
  .pay-chevron-open { transform: rotate(90deg); }

  .payfast-hero {
    position: relative;
    overflow: hidden;
    border-radius: 14px;
    padding: 16px 16px 14px;
    background:
      radial-gradient(circle at top right, rgba(200, 241, 53, 0.16), transparent 38%),
      linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .payfast-hero::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(180deg, rgba(255,255,255,0.05), transparent 36%);
  }

  .payfast-kicker {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-dm-mono), monospace;
    font-size: 0.58rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--lime);
    margin-bottom: 10px;
  }

  .payfast-amount {
    font-family: var(--font-dm-mono), monospace;
    font-size: 1.15rem;
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.02em;
    color: var(--text);
    margin-top: 10px;
  }

  .payfast-hero-sub {
    margin-top: 8px;
    font-size: 0.72rem;
    line-height: 1.5;
    color: var(--muted);
    max-width: 32ch;
  }

  .payfast-chip-row {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    margin-top: 12px;
  }

  .payfast-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 9px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    font-family: var(--font-dm-mono), monospace;
    font-size: 0.58rem;
    color: var(--muted2);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .payfast-meta-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .payfast-meta-card {
    border-radius: 12px;
    padding: 12px 13px;
    background: var(--s2);
    border: 1px solid var(--b1);
    min-width: 0;
  }

  .payfast-meta-label {
    font-family: var(--font-dm-mono), monospace;
    font-size: 0.58rem;
    letter-spacing: 0.10em;
    text-transform: uppercase;
    color: var(--muted2);
    margin-bottom: 6px;
  }

  .payfast-meta-value {
    font-size: 0.76rem;
    font-weight: 700;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .payfast-note {
    border-radius: 12px;
    padding: 12px 14px;
    background: color-mix(in oklab, var(--lime) 4%, var(--s2));
    border: 1px solid color-mix(in oklab, var(--lime) 14%, var(--b2));
  }

  .payfast-note-row {
    display: flex;
    align-items: flex-start;
    gap: 9px;
  }

  .payfast-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  }

  @media (max-width: 640px) {
    .payfast-meta-grid {
      grid-template-columns: 1fr;
    }

    .payfast-actions {
      flex-direction: column-reverse;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .pay-row, .pay-expand { animation: none; }
    .pay-chevron { transition: none; }
  }
`;


// ── Main Page ──────────────────────────────────────────────────────────────────

export function PaymentsPage({
  payments: apiPayments = [],
  invoices: apiInvoices = [],
  currency = "ZAR",
  onNavigate,
}: {
  payments?: PortalPayment[];
  invoices?: PortalInvoice[];
  currency?: string;
  onNavigate?: (page: PageId) => void;
}) {
  const { session, projectId } = useProjectLayer();
  const notify = usePageToast();
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
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [reminderSelection, setReminderSelection] = useState<string[]>([]);
  const [reminderNote, setReminderNote] = useState("");
  const [reminderLoading, setReminderLoading] = useState(false);
  const [reminderSuccess, setReminderSuccess] = useState<ReminderSuccess | null>(null);

  function buildPayfastReturnUrl(invoiceId: string, status: "success" | "cancelled"): string {
    const url = new URL(window.location.href);
    url.searchParams.set("payment", status);
    url.searchParams.set("paymentProvider", "payfast");
    url.searchParams.set("paymentInvoiceId", invoiceId);
    return url.toString();
  }

  async function handlePayNow(invoiceId: string) {
    if (!session) return;
    setPayLoading(true);
    setPayError(null);
    const r = await initiatePortalPayfastWithRefresh(session, {
      invoiceId,
      returnUrl: buildPayfastReturnUrl(invoiceId, "success"),
      cancelUrl: buildPayfastReturnUrl(invoiceId, "cancelled"),
    });
    if (r.nextSession) saveSession(r.nextSession);
    if (r.error || !r.data) {
      setPayError(r.error?.message ?? "Failed to initiate payment.");
      setPayLoading(false);
      return;
    }
    if (!r.data?.url || !r.data.fields) {
      setPayError("Failed to initiate payment — missing payment data.");
      setPayLoading(false);
      return;
    }

    // Build and submit a hidden form to PayFast
    const form = document.createElement("form");
    form.method = "POST";
    form.action = r.data.url;
    form.style.display = "none";

    Object.entries(r.data.fields).forEach(([key, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });

    const fallbackTimer = window.setTimeout(() => {
      if (document.visibilityState === "visible") {
        form.remove();
        setPayError("PayFast did not open. Please try again. If this persists, reload the portal and try again.");
        setPayLoading(false);
      }
    }, 4000);

    try {
      document.body.appendChild(form);
      requestAnimationFrame(() => {
        window.clearTimeout(fallbackTimer);
        form.submit();
      });
    } catch {
      window.clearTimeout(fallbackTimer);
      form.remove();
      setPayError("Failed to redirect to PayFast. Please try again.");
      setPayLoading(false);
    }
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
      const invNum = inv?.number ?? "";
      const invPrefix = invNum.split("-")[0].toUpperCase();
      const invLabel = !inv ? "Payment"
        : invPrefix === "DEP" ? "Deposit Invoice"
        : invPrefix === "INV" ? "Service Invoice"
        : invPrefix === "RET" ? "Retainer Invoice"
        : `Invoice ${invNum}`;
      return {
        id: pay.id.slice(0, 8).toUpperCase(),
        invoiceRef: inv?.number ?? pay.invoiceId.slice(0, 8),
        invoiceId: pay.invoiceId,
        description: invLabel,
        date: pay.paidAt ? new Date(pay.paidAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—",
        dueDate: inv?.dueAt ? new Date(inv.dueAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—",
        amountRaw: pay.amountCents / 100,
        status,
        method: pay.provider ?? undefined,
        category: "Development" as PCategory,
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
  const unpaidMilestones = useMemo(
    () => (milestones ?? []).filter((milestone) => !milestone.paid),
    [milestones],
  );
  const reminderTargets = useMemo<ReminderTarget[]>(() => {
    const paymentTargets = paymentData
      .filter((payment) => payment.status !== "Paid")
      .map((payment) => ({
        id: `payment:${payment.invoiceId}`,
        title: `${payment.invoiceRef} · ${payment.description}`,
        subtitle: payment.status === "Overdue" ? "Outstanding invoice requires attention." : "Pending payment awaiting settlement.",
        amountCents: Math.round(payment.amountRaw * 100),
        dueText: payment.dueDate !== "—" ? `Due ${payment.dueDate}` : "Due date pending",
        badgeClass: payment.status === "Overdue" ? "badgeRed" : "badgeAmber",
        statusLabel: payment.status,
        priority: payment.status === "Overdue" ? "HIGH" : "MEDIUM",
      }));
    const milestoneTargets = unpaidMilestones.map((milestone) => ({
      id: `milestone:${milestone.stage}`,
      title: formatMilestoneStage(milestone.stage),
      subtitle: "Upcoming scheduled project payment milestone.",
      amountCents: milestone.amountCents,
      dueText: "Upcoming project payment schedule",
      badgeClass: "badgeAmber" as const,
      statusLabel: "Upcoming" as const,
      priority: "MEDIUM" as const,
    }));
    return [...paymentTargets, ...milestoneTargets];
  }, [paymentData, unpaidMilestones]);
  const selectedReminderTargets = useMemo(
    () => reminderTargets.filter((target) => reminderSelection.includes(target.id)),
    [reminderSelection, reminderTargets],
  );
  const selectedReminderTotal = useMemo(
    () => selectedReminderTargets.reduce((sum, target) => sum + target.amountCents, 0),
    [selectedReminderTargets],
  );
  const canDownloadStatement = paymentData.length > 0;
  const canSendReminders = reminderTargets.length > 0;
  const totalPaidCents   = apiPayments.filter((p) => p.status === "COMPLETED" || p.status === "REFUNDED").reduce((s, p) => s + p.amountCents, 0);
  const totalPendingCents = apiPayments.filter((p) => p.status === "PENDING").reduce((s, p) => s + p.amountCents, 0);
  const totalOverdueCents = apiPayments.filter((p) => p.status === "FAILED").reduce((s, p) => s + p.amountCents, 0);

  const statusBadge = (s: PStatus) => s === "Paid" ? "badgeGreen" : s === "Pending" ? "badgeAmber" : "badgeRed";

  function handleDownloadStatement() {
    if (!canDownloadStatement) return;
    triggerStatementDownload(paymentData, currency);
    notify("success", "Statement Downloading", "Your payment statement CSV is downloading.");
  }

  function handleOpenReminders() {
    if (!canSendReminders) return;
    setReminderSuccess(null);
    setReminderSelection(reminderTargets.map((target) => target.id));
    setReminderNote("");
    setReminderModalOpen(true);
  }

  function handleCloseReminderModal() {
    if (reminderLoading) return;
    setReminderModalOpen(false);
    setReminderSuccess(null);
  }

  function toggleReminderTarget(id: string) {
    setReminderSelection((current) => (
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    ));
  }

  async function handleSubmitReminderRequest() {
    if (!session || !session.user?.clientId) {
      notify("error", "Reminder Request Failed", "You must be signed in to request billing reminders.");
      return;
    }
    if (selectedReminderTargets.length === 0) {
      notify("warning", "Select Items", "Choose at least one payment or milestone to include.");
      return;
    }
    setReminderLoading(true);
    const description = [
      "Billing reminder request submitted from the client payments page.",
      "",
      "Selected items:",
      ...selectedReminderTargets.map((target) => `- [${target.statusLabel}] ${target.title} · ${formatMoneyCents(target.amountCents, { currency })} · ${target.dueText}`),
      ...(reminderNote.trim() ? ["", "Client note:", reminderNote.trim()] : []),
    ].join("\n");
    const priority = selectedReminderTargets.some((target) => target.priority === "HIGH") ? "HIGH" : "MEDIUM";
    const response = await createPortalSupportTicketWithRefresh(session, {
      clientId: session.user.clientId,
      title: `Billing reminder request (${selectedReminderTargets.length})`,
      description,
      category: "BILLING",
      priority,
    });
    if (response.nextSession) saveSession(response.nextSession);
    setReminderLoading(false);
    if (response.error || !response.data) {
      notify("error", "Reminder Request Failed", response.error?.message ?? "Unable to create billing reminder request.");
      return;
    }
    setReminderSuccess({
      count: selectedReminderTargets.length,
      totalAmountCents: selectedReminderTargets.reduce((sum, target) => sum + target.amountCents, 0),
    });
    notify("success", "Reminder Request Sent", "Our billing team will follow up on the selected items.");
  }

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
          <button
            type="button"
            className={cx("btnSm", "btnGhost", "flexRow", "gap6")}
            onClick={handleDownloadStatement}
            disabled={!canDownloadStatement}
            title={canDownloadStatement ? "Download payment statement" : "No payment statement data available"}
          >
            <Ic n="download" sz={13} /> Download Statement
          </button>
          <button
            type="button"
            className={cx("btnSm", "btnGhost", "flexRow", "gap6")}
            onClick={handleOpenReminders}
            disabled={!canSendReminders}
            title={canSendReminders ? "Request billing reminders" : "No pending or upcoming billing items to remind on"}
          >
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
              {formatMoneyCents(monthlyActivity.reduce((s, m) => s + m.amountCents, 0), { currency })} total invoiced
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
              Due {overdueItems[0].dueDate}
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
        <div className={cx("pillTabs", "gap6")} style={{ marginBottom: 0 }}>
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
          <div className={cx("tableHeadPayGrid")}>
            {["Invoice / Description", "Date", "Amount", "Status", ""].map((h, i) => (
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
                  className={cx("gridRowBtnPay")}
                  onClick={() => setExpanded(isOpen ? null : p.id)}
                >
                  {/* Invoice ref + description on same line, category badge below */}
                  <div className={cx("flexCol", "gap4", "minW0")}>
                    <div className={cx("flexRow", "gap8", "minW0")}>
                      <span className={cx("fontMono", "text10", "colorAccent", "noShrink")}>{p.invoiceRef}</span>
                      <span className={cx("fw600", "text12", "truncate")}>{p.description}</span>
                    </div>
                    <span className={cx("fontMono", "text10", "pmCatBadge", "dynBgColor")} style={{ "--bg-color": `color-mix(in oklab, ${catCfg.color} 10%, var(--s3))`, "--color": catCfg.color } as React.CSSProperties}>
                      {p.category}
                    </span>
                  </div>

                  {/* Date */}
                  <span className={cx("fontMono", "text10", "colorMuted2")}>
                    {p.status === "Paid" ? p.date : p.dueDate}
                  </span>

                  {/* Amount */}
                  <span className={cx("fontMono", "fw700", "text12", "tabularNums")}>{formatMoneyCents(Math.round(p.amountRaw * 100), { currency })}</span>

                  {/* Status badge */}
                  <span className={cx("badge", statusBadge(p.status))} style={{ justifySelf: "start" }}>{p.status}</span>

                  {/* Chevron — right-aligned */}
                  <span className={`pay-chevron${isOpen ? " pay-chevron-open" : ""}`} style={{ justifySelf: "end" }}>
                    <Ic n="chevronRight" sz={14} c="var(--muted2)" />
                  </span>
                </button>

                {/* Expanded */}
                {isOpen && (
                  <div className={cx("payRowExpanded", "dynBgColor")} style={{ "--bg-color": `color-mix(in oklab, ${statusColor} 4%, var(--s2))` } as React.CSSProperties}>
                    <div className={cx("payRowGrid")}>

                      {/* Left: Payment details */}
                      <div className={cx("flexCol", "borderR", "p14x20")}>
                        <div className={cx("grid2Cols", "gap8", "mb12")}>
                          {[
                            { label: "Invoice Ref", value: p.invoiceRef },
                            { label: "Method",      value: p.method ?? "—"  },
                            { label: "Category",    value: p.category   },
                            { label: "Issued",      value: p.date !== "—" ? p.date : "—" },
                          ].map(({ label, value }) => (
                            <div key={label} className={cx("cardS3", "p8x10", "flexCol", "gap3")}>
                              <div className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls01")}>{label}</div>
                              <div className={cx("fw700", "text12")}>{value}</div>
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

                      {/* Right: Dates + actions */}
                      <div className={cx("p14x20", "flexCol", "gap10")}>
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
          <div className={cx("modalOverlay", "fixedOverlay9999")} onClick={() => { setPayingInvoiceId(null); setPayError(null); }}>
            <div className={cx("pmModalInner")} onClick={(event) => event.stopPropagation()}>
              <div className={cx("pmModalHd")}>
                <div>
                  <div className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls012", "mb4")}>
                    Secure Payment
                  </div>
                  <div className={cx("fw800", "text14")}>PayFast Checkout</div>
                </div>
                <button
                  type="button"
                  className={cx("iconBtn")}
                  onClick={() => { setPayingInvoiceId(null); setPayError(null); }}
                  title="Close"
                >
                  <Ic n="x" sz={16} />
                </button>
              </div>

              <div className={cx("p20", "flexCol", "gap14")}>
                <div className="payfast-hero">
                  <div className="payfast-kicker">
                    <Ic n="shieldCheck" sz={12} c="var(--lime)" />
                    Secure PayFast Session
                  </div>
                  <div className={cx("fw800", "text15")}>Complete payment</div>
                  <div className="payfast-amount">
                    {formatMoneyCents(inv.amountCents, { currency: inv.currency })}
                  </div>
                  <div className="payfast-hero-sub">
                    You’re about to leave the portal briefly and complete this payment in PayFast’s hosted checkout.
                  </div>
                  <div className="payfast-chip-row">
                    <span className="payfast-chip"><Ic n="creditCard" sz={10} c="var(--muted2)" /> Card</span>
                    <span className="payfast-chip"><Ic n="bank" sz={10} c="var(--muted2)" /> EFT</span>
                    <span className="payfast-chip"><Ic n="lock" sz={10} c="var(--muted2)" /> Encrypted</span>
                    <span className="payfast-chip"><Ic n="arrowUpRight" sz={10} c="var(--muted2)" /> External Checkout</span>
                  </div>
                </div>

                <div className="payfast-meta-grid">
                  <div className="payfast-meta-card">
                    <div className="payfast-meta-label">Invoice</div>
                    <div className="payfast-meta-value">{inv.number}</div>
                  </div>
                  <div className="payfast-meta-card">
                    <div className="payfast-meta-label">Currency</div>
                    <div className="payfast-meta-value">{inv.currency}</div>
                  </div>
                  <div className="payfast-meta-card">
                    <div className="payfast-meta-label">Amount</div>
                    <div className="payfast-meta-value">{formatMoneyCents(inv.amountCents, { currency: inv.currency })}</div>
                  </div>
                  <div className="payfast-meta-card">
                    <div className="payfast-meta-label">Merchant</div>
                    <div className="payfast-meta-value">Maphari Technologies</div>
                  </div>
                  <div className="payfast-meta-card">
                    <div className="payfast-meta-label">Provider</div>
                    <div className="payfast-meta-value">PayFast</div>
                  </div>
                  <div className="payfast-meta-card">
                    <div className="payfast-meta-label">Return</div>
                    <div className="payfast-meta-value">Back to Portal</div>
                  </div>
                </div>

                <div className="payfast-note">
                  <div className="payfast-note-row">
                    <Ic n="shieldCheck" sz={14} c="var(--lime)" />
                    <div>
                      <div className={cx("fw700", "text11", "mb4")}>What happens next</div>
                      <p className={cx("text11", "colorMuted", "m0", "lineH16")}>
                        You’ll leave the portal briefly for PayFast-hosted checkout. On the next screen, confirm the amount and that the merchant name is Maphari Technologies, then complete payment and return here.
                      </p>
                    </div>
                  </div>
                </div>

                <div className={cx("cardS3", "p12x14")}>
                  <div className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls012", "mb6")}>Trust Check</div>
                  <div className={cx("flexCol", "gap6")}>
                    <div className={cx("flexRow", "gap8", "itemsCenter")}>
                      <Ic n="check" sz={12} c="var(--lime)" sw={2.5} />
                      <span className={cx("text11", "colorMuted")}>You should see the same invoice amount on the PayFast page.</span>
                    </div>
                    <div className={cx("flexRow", "gap8", "itemsCenter")}>
                      <Ic n="check" sz={12} c="var(--lime)" sw={2.5} />
                      <span className={cx("text11", "colorMuted")}>The merchant should appear as Maphari Technologies.</span>
                    </div>
                    <div className={cx("flexRow", "gap8", "itemsCenter")}>
                      <Ic n="check" sz={12} c="var(--lime)" sw={2.5} />
                      <span className={cx("text11", "colorMuted")}>After payment or cancel, you’ll come back to this portal.</span>
                    </div>
                  </div>
                </div>

                {payError && (
                  <div className={cx("cardS3", "p12x14")} style={{ borderColor: "color-mix(in oklab, var(--red) 28%, var(--b2))", background: "color-mix(in oklab, var(--red) 7%, var(--s2))" }}>
                    <div className={cx("flexRow", "gap8", "itemsCenter")}>
                      <Ic n="alert" sz={14} c="var(--red)" />
                      <span className={cx("text11", "colorRed")}>{payError}</span>
                    </div>
                  </div>
                )}

                <div className="payfast-actions">
                  <button
                    type="button"
                    className={cx("btnSm", "btnGhost")}
                    onClick={() => { setPayingInvoiceId(null); setPayError(null); }}
                    disabled={payLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={cx("btnSm", "btnAccent", "flexRow", "gap6", "itemsCenter")}
                    onClick={() => void handlePayNow(payingInvoiceId)}
                    disabled={payLoading}
                  >
                    <Ic n="creditCard" sz={12} />
                    {payLoading ? "Opening PayFast…" : "Continue to PayFast"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {reminderModalOpen && (
        <div className={cx("modalOverlay")} onClick={handleCloseReminderModal}>
          <div
            className={cx("modal", "maxW520")}
            onClick={(event) => event.stopPropagation()}
            style={{ maxHeight: "86vh", overflowY: "auto" }}
          >
            <div className={cx("modalHeader")}>
              <div className={cx("flexCol", "gap4")}>
                <span className={cx("modalTitle")}>
                  {reminderSuccess ? "Reminder Request Sent" : "Billing Reminders"}
                </span>
                <span className={cx("fontMono", "text10", "colorMuted2")}>
                  {reminderSuccess
                    ? "Billing has the request and can continue follow-up from Support."
                    : `${reminderTargets.length} payment item${reminderTargets.length === 1 ? "" : "s"} available for reminder follow-up`}
                </span>
              </div>
              <button
                type="button"
                className={cx("modalClose")}
                onClick={handleCloseReminderModal}
                disabled={reminderLoading}
                title="Close"
              >
                <Ic n="x" sz={16} c="currentColor" />
              </button>
            </div>
            {reminderSuccess ? (
              <>
                <div className={cx("modalBody")}>
                  <div className={cx("cardS3", "p14x16")}>
                    <div className={cx("flexRow", "gap10", "itemsCenter")}>
                      <div
                        className={cx("dotBgAccent", "flexCenter")}
                        style={{ width: 36, height: 36, borderRadius: "999px", flexShrink: 0 } as React.CSSProperties}
                      >
                        <Ic n="check" sz={18} c="#0b0c12" sw={2.5} />
                      </div>
                      <div className={cx("flex1")}>
                        <div className={cx("fw700", "text12")}>Billing follow-up queued</div>
                        <div className={cx("text10", "colorMuted", "mt4")}>
                          {reminderSuccess.count} item{reminderSuccess.count === 1 ? "" : "s"} covering {formatMoneyCents(reminderSuccess.totalAmountCents, { currency })}.
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={cx("cardS3", "p12x14")}>
                    <div className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls01", "mb6")}>Next Step</div>
                    <p className={cx("text11", "colorMuted", "m0", "lineH16")}>
                      You can track the request and any team follow-up from the Support section.
                    </p>
                  </div>
                </div>
                <div className={cx("modalFooter")}>
                  <button
                    type="button"
                    className={cx("btnSm", "btnGhost")}
                    onClick={handleCloseReminderModal}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className={cx("btnSm", "btnAccent")}
                    onClick={() => {
                      handleCloseReminderModal();
                      onNavigate?.("progressKnowledge");
                    }}
                  >
                    Open Support
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className={cx("modalBody")}>
                  <div className={cx("cardS3", "p12x14")}>
                    <div className={cx("flexBetween", "gap8")}>
                      <div>
                        <div className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls01")}>Selected</div>
                        <div className={cx("fw700", "text12", "mt4")}>
                          {selectedReminderTargets.length} item{selectedReminderTargets.length === 1 ? "" : "s"}
                        </div>
                      </div>
                      <div className={cx("textRight")}>
                        <div className={cx("fontMono", "text10", "colorMuted2", "uppercase", "ls01")}>Amount</div>
                        <div className={cx("fontMono", "fw700", "text12", "mt4", "tabularNums")}>
                          {formatMoneyCents(selectedReminderTotal, { currency })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className={cx("text11", "colorMuted", "m0", "lineH16")}>
                    Select the payment items you want our billing team to follow up on. We’ll create a billing request and continue the conversation from Support.
                  </p>

                  <div className={cx("flexCol", "gap8")}>
                    {reminderTargets.map((target) => {
                      const checked = reminderSelection.includes(target.id);
                      return (
                        <label
                          key={target.id}
                          className={cx("cardS3", "p12x14", "flexRow", "gap10")}
                          style={{
                            cursor: "pointer",
                            alignItems: "flex-start",
                            borderColor: checked ? "color-mix(in oklab, var(--lime) 28%, var(--b2))" : undefined,
                            background: checked ? "color-mix(in oklab, var(--lime) 6%, var(--s3))" : undefined,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleReminderTarget(target.id)}
                            disabled={reminderLoading}
                            style={{ marginTop: 2 }}
                          />
                          <div className={cx("flex1", "minW0")}>
                            <div className={cx("flexBetween", "gap8")}>
                              <div className={cx("fw700", "text12", "truncate")}>{target.title}</div>
                              <span className={cx("badge", target.badgeClass, "badgeSm2")}>{target.statusLabel}</span>
                            </div>
                            <div className={cx("text10", "colorMuted", "mt4")}>{target.subtitle}</div>
                            <div className={cx("flexBetween", "gap8", "mt8")}>
                              <span className={cx("fontMono", "text10", "colorMuted2")}>{target.dueText}</span>
                              <span className={cx("fontMono", "fw700", "text11", "tabularNums")}>
                                {formatMoneyCents(target.amountCents, { currency })}
                              </span>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <div className={cx("flexCol", "gap6")}>
                    <label htmlFor="billing-reminder-note" className={cx("fieldLabel")}>Note for billing team</label>
                    <textarea
                      id="billing-reminder-note"
                      className={cx("textarea")}
                      rows={4}
                      placeholder="Optional note about reminder timing, follow-up preferences, or billing context…"
                      value={reminderNote}
                      onChange={(event) => setReminderNote(event.target.value)}
                      disabled={reminderLoading}
                    />
                  </div>
                </div>
                <div className={cx("modalFooter")}>
                  <button
                    type="button"
                    className={cx("btnSm", "btnGhost")}
                    onClick={handleCloseReminderModal}
                    disabled={reminderLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={cx("btnSm", "btnAccent")}
                    onClick={() => void handleSubmitReminderRequest()}
                    disabled={reminderLoading || selectedReminderTargets.length === 0}
                  >
                    {reminderLoading ? "Sending…" : `Send Reminder Request${selectedReminderTargets.length > 0 ? ` (${selectedReminderTargets.length})` : ""}`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

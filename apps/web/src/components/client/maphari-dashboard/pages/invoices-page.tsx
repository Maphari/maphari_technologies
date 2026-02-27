import { useMemo, useRef, useState } from "react";
import { cx, styles } from "../style";
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

type InvoiceStatus = "overdue" | "pending" | "paid" | "draft";
type ToolFilter = "Payment Schedule" | "Budget Utilization" | "Tax Summary" | "Receipt Archive";

type InvoiceSeed = {
  id: string;
  project: string;
  client: string;
  amount: number;
  due: string;
  status: InvoiceStatus;
  milestones: string;
};

type ScheduleSeed = {
  date: string;
  label: string;
  amount: string;
  pct: number;
  status: "overdue" | "pending" | "upcoming";
};

type BudgetSeed = {
  project: string;
  spent: number;
  total: number;
};

const BADGE_CLASS: Record<InvoiceStatus | "upcoming", string> = {
  paid: styles.badgeGreen,
  overdue: styles.badgeRed,
  pending: styles.badgeAmber,
  draft: styles.badgeMuted,
  upcoming: styles.badgeMuted,
};

export const CLIENT_INVOICES_PAYMENTS_INVOICES: InvoiceSeed[] = [
  { id: "INV-2026-011", project: "Client Portal v2", client: "Veldt Finance", amount: 16000, due: "2026-02-03", status: "overdue", milestones: "Design + Frontend" },
  { id: "INV-2026-010", project: "Lead Pipeline Rebuild", client: "Maphari Internal", amount: 22000, due: "2026-02-28", status: "pending", milestones: "Backend API" },
  { id: "INV-2026-009", project: "Automation Suite", client: "Ngozi Ltd", amount: 8500, due: "2026-03-10", status: "pending", milestones: "Phase 1 Scope" },
  { id: "INV-2026-008", project: "Veldt Finance Dashboard", client: "Veldt Finance", amount: 22000, due: "2026-02-15", status: "paid", milestones: "Full Delivery" },
  { id: "INV-2026-007", project: "Brand Identity Pack", client: "Khumalo Brands", amount: 11000, due: "2026-01-31", status: "paid", milestones: "Logo + System" },
  { id: "INV-2026-006", project: "CRM Integration", client: "Maphari Internal", amount: 5500, due: "2026-04-01", status: "draft", milestones: "Planning Phase" }
];

export const CLIENT_INVOICES_PAYMENTS_SCHEDULE: ScheduleSeed[] = [
  { date: "Feb 03", label: "INV-011 — Deposit", amount: "R 8,000", pct: 100, status: "overdue" },
  { date: "Feb 28", label: "INV-010 — Milestone 2", amount: "R 22,000", pct: 60, status: "pending" },
  { date: "Mar 10", label: "INV-009 — Phase 1", amount: "R 8,500", pct: 40, status: "upcoming" },
  { date: "Mar 31", label: "INV-011 — Balance", amount: "R 8,000", pct: 20, status: "upcoming" },
  { date: "Apr 01", label: "INV-006 — Kickoff", amount: "R 5,500", pct: 10, status: "upcoming" }
];

export const CLIENT_INVOICES_PAYMENTS_BUDGETS: BudgetSeed[] = [
  { project: "Client Portal v2", spent: 68000, total: 90000 },
  { project: "Lead Pipeline Rebuild", spent: 22000, total: 55000 },
  { project: "Automation Suite", spent: 8500, total: 35000 }
];

export const CLIENT_INVOICES_TOOL_FILTERS: ReadonlyArray<ToolFilter> = [
  "Payment Schedule",
  "Budget Utilization",
  "Tax Summary",
  "Receipt Archive"
];

function statusBorderColor(status: InvoiceStatus): string {
  if (status === "overdue") return "var(--red)";
  if (status === "paid") return "var(--green)";
  if (status === "pending") return "var(--amber)";
  return "var(--muted2)";
}

export function ClientInvoicesPage({
  active,
  invoiceSummaryStats: _invoiceSummaryStats,
  invoiceTabs: _invoiceTabs,
  activeInvoiceTab: _activeInvoiceTab,
  onInvoiceTabChange: _onInvoiceTabChange,
  onOpenInvoice,
  onExportInvoices,
  filteredInvoiceTable: _filteredInvoiceTable
}: InvoicesPageProps) {
  const [activeTab, setActiveTab] = useState<"All" | "Overdue" | "Pending" | "Paid" | "Draft">("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest" | "amount-hi" | "amount-lo">("newest");
  const [payModal, setPayModal] = useState<InvoiceSeed | null>(null);
  const [payStep, setPayStep] = useState<1 | 2 | 3>(1);
  const [disputeModal, setDisputeModal] = useState<InvoiceSeed | null>(null);
  const [payMethod, setPayMethod] = useState<"Card" | "EFT" | "Instant EFT">("Card");
  const [disputeReason, setDisputeReason] = useState("");
  const [toast, setToast] = useState<{ text: string; sub: string } | null>(null);
  const [invoices, setInvoices] = useState<InvoiceSeed[]>(CLIENT_INVOICES_PAYMENTS_INVOICES);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const budgetSectionRef = useRef<HTMLDivElement>(null);
  const scheduleSectionRef = useRef<HTMLDivElement>(null);
  const invoicesSectionRef = useRef<HTMLDivElement>(null);

  const showToast = (text: string, sub: string) => {
    setToast({ text, sub });
    window.setTimeout(() => setToast(null), 3500);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(inv => inv.id)));
    }
  };

  const handlePay = () => {
    if (!payModal) return;
    setPayStep(3);
    window.setTimeout(() => {
      setInvoices((prev) => prev.map((inv) => (inv.id === payModal.id ? { ...inv, status: "paid" as const } : inv)));
      window.setTimeout(() => {
        const id = payModal.id;
        const amt = payModal.amount;
        setPayModal(null);
        setPayStep(1);
        showToast("Payment confirmed ✓", `${id} — R ${amt.toLocaleString()}`);
      }, 2400);
    }, 80);
  };

  const handleDispute = () => {
    setDisputeModal(null);
    showToast("Dispute submitted", "We'll review and respond within 2 business days");
  };

  const filtered = useMemo(
    () =>
      invoices
        .filter((inv) => {
          if (activeTab === "Overdue") return inv.status === "overdue";
          if (activeTab === "Pending") return inv.status === "pending";
          if (activeTab === "Paid") return inv.status === "paid";
          if (activeTab === "Draft") return inv.status === "draft";
          return true;
        })
        .filter((inv) => {
          const q = search.toLowerCase();
          return inv.id.toLowerCase().includes(q) || inv.project.toLowerCase().includes(q);
        })
        .sort((a, b) => {
          if (sort === "amount-hi") return b.amount - a.amount;
          if (sort === "amount-lo") return a.amount - b.amount;
          if (sort === "oldest") return a.id.localeCompare(b.id);
          return b.id.localeCompare(a.id);
        }),
    [invoices, activeTab, search, sort]
  );

  const stats = useMemo(
    () => ({
      overdue: invoices.filter((i) => i.status === "overdue").reduce((a, i) => a + i.amount, 0),
      pending: invoices.filter((i) => i.status === "pending").reduce((a, i) => a + i.amount, 0),
      paid: invoices.filter((i) => i.status === "paid").reduce((a, i) => a + i.amount, 0),
      total: invoices.length
    }),
    [invoices]
  );

  return (
    <section className={cx(styles.page, active && styles.pageActive)} id="page-invoices">
      <div className={styles.pageHeader} id="tour-page-invoices">
        <div>
          <div className={styles.eyebrow}>Finance</div>
          <div className={styles.pageTitle}>Invoices &amp; Payments</div>
          <div className={styles.pageSub}>Manage billing, track payments, dispute line items, and download receipts.</div>
        </div>
        <div className={styles.headerRight}>
          <button className={cx(styles.button, styles.buttonGhost)} type="button" onClick={onExportInvoices}>
            Export CSV
          </button>
          <button
            className={cx(styles.button, styles.buttonAccent)}
            type="button"
            onClick={() => showToast("Draft invoice created", "You can edit line items next")}
          >
            + New Invoice
          </button>
        </div>
      </div>

      <div className={styles.statGrid}>
        {[
          { lbl: "Total Overdue", val: `R ${stats.overdue.toLocaleString()}`, sub: `${invoices.filter((i) => i.status === "overdue").length} invoice(s)`, bar: "var(--red)", trend: "↑ R 4k from last month", up: false as boolean | null },
          { lbl: "Pending Payment", val: `R ${stats.pending.toLocaleString()}`, sub: "Due this month", bar: "var(--amber)", trend: "2 invoices outstanding", up: null as boolean | null },
          { lbl: "Paid This Year", val: `R ${stats.paid.toLocaleString()}`, sub: "2 invoices settled", bar: "var(--green)", trend: "↑ 18% vs last year", up: true as boolean | null },
          { lbl: "Total Invoices", val: String(stats.total), sub: "Across all projects", bar: "var(--accent)", trend: "4 active projects", up: null as boolean | null }
        ].map((s, i) => (
          <div key={s.lbl} className={styles.statCard} style={{ "--i": i } as React.CSSProperties}>
            <div className={styles.statBar} style={{ background: s.bar }} />
            <div className={styles.statLabel}>{s.lbl}</div>
            <div className={styles.statValue}>{s.val}</div>
            <div className={styles.statSub}>{s.sub}</div>
            <div className={styles.statSub} style={{ marginTop: 4, color: s.up === true ? "var(--green)" : s.up === false ? "var(--red)" : "var(--muted2)" }}>
              {s.trend}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, padding: "0 32px 12px", flexShrink: 0 }}>
        {[
          { label: "Budget Utilization", ref: budgetSectionRef },
          { label: "Payment Schedule", ref: scheduleSectionRef },
          { label: "Invoice List", ref: invoicesSectionRef },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            className={cx(styles.button, styles.buttonGhost, styles.buttonSm)}
            onClick={() => item.ref.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        {/* Budget Utilization */}
        <div ref={budgetSectionRef} style={{ padding: "24px 32px 0" }}>
          <div className={styles.sectionTitle} style={{ marginBottom: 14 }}>Budget Utilization</div>
          <div className={styles.card} style={{ padding: "20px 24px", marginBottom: 24 }}>
            {CLIENT_INVOICES_PAYMENTS_BUDGETS.map((b, i) => {
              const pct = Math.round((b.spent / b.total) * 100);
              const fillColor = pct >= 90 ? "var(--red)" : pct >= 75 ? "var(--amber)" : "var(--accent)";
              return (
                <div key={b.project} style={{ marginBottom: i < CLIENT_INVOICES_PAYMENTS_BUDGETS.length - 1 ? 20 : 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: ".8rem", fontWeight: 700 }}>{b.project}</span>
                    <span style={{ fontSize: ".7rem", color: "var(--muted)" }}>{pct}% used</span>
                  </div>
                  <div style={{ height: 6, background: "var(--tint-overlay)", overflow: "hidden", marginBottom: 12 }}>
                    <div style={{ height: "100%", background: fillColor, width: `${pct}%`, transition: "width .8s cubic-bezier(.23,1,.32,1)" }} />
                  </div>
                  <div style={{ display: "flex", gap: 24 }}>
                    <div style={{ fontSize: ".6rem", color: "var(--muted)" }}>
                      <strong style={{ display: "block", color: "var(--text)", fontSize: ".72rem", marginBottom: 1 }}>R {b.spent.toLocaleString()}</strong>
                      Spent
                    </div>
                    <div style={{ fontSize: ".6rem", color: "var(--muted)" }}>
                      <strong style={{ display: "block", color: "var(--text)", fontSize: ".72rem", marginBottom: 1 }}>R {(b.total - b.spent).toLocaleString()}</strong>
                      Remaining
                    </div>
                    <div style={{ fontSize: ".6rem", color: "var(--muted)" }}>
                      <strong style={{ display: "block", color: "var(--text)", fontSize: ".72rem", marginBottom: 1 }}>R {b.total.toLocaleString()}</strong>
                      Total Budget
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Schedule */}
        <div ref={scheduleSectionRef} style={{ padding: "0 32px 24px" }}>
          <div className={styles.sectionTitle} style={{ marginBottom: 14 }}>Payment Schedule</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {CLIENT_INVOICES_PAYMENTS_SCHEDULE.map((s) => (
              <div
                key={s.label}
                style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 16px", background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <span style={{ fontSize: ".66rem", color: "var(--muted)", width: 80, flexShrink: 0 }}>{s.date}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: ".74rem", fontWeight: 600, marginBottom: 6 }}>{s.label}</div>
                  <div style={{ height: 4, background: "var(--tint-overlay)", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${s.pct}%`,
                        background: s.status === "overdue" ? "var(--red)" : s.status === "pending" ? "var(--amber)" : "var(--b1)",
                        transition: "width .6s cubic-bezier(.23,1,.32,1)"
                      }}
                    />
                  </div>
                </div>
                <span style={{ fontSize: ".76rem", fontWeight: 500, width: 100, textAlign: "right", flexShrink: 0 }}>{s.amount}</span>
                <span style={{ width: 70, textAlign: "right", flexShrink: 0 }}>
                  <span className={cx(styles.badge, BADGE_CLASS[s.status])}>{s.status}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Invoice toolbar */}
        <div
          className={styles.filterBar}
          style={{ padding: "0 32px", flexShrink: 0, borderBottom: "1px solid var(--border)" }}
        >
          {(["All", "Overdue", "Pending", "Paid", "Draft"] as const).map((t) => (
            <button
              key={t}
              className={cx(styles.filterTab, activeTab === t && styles.filterTabActive)}
              onClick={() => setActiveTab(t)}
              type="button"
            >
              {t}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--bg)",
              border: "1px solid var(--border)",
              padding: "7px 12px",
              width: 220
            }}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="var(--muted)" strokeWidth="1.5" />
              <path d="M11 11l3 3" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              style={{ background: "none", border: "none", color: "var(--text)", fontSize: ".7rem", width: "100%", outline: "none" }}
              placeholder="Search invoices…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            style={{
              fontSize: ".62rem",
              letterSpacing: ".06em",
              textTransform: "uppercase",
              background: "var(--bg)",
              border: "1px solid var(--border)",
              color: "var(--muted)",
              padding: "7px 10px"
            }}
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="amount-hi">Amount ↓</option>
            <option value="amount-lo">Amount ↑</option>
          </select>
        </div>

        {/* Invoice list */}
        <div ref={invoicesSectionRef} style={{ padding: "20px 32px 40px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "32px 120px 1fr 120px 110px 120px 140px",
              padding: "8px 16px",
              borderBottom: "1px solid var(--border)",
              marginBottom: 4,
              alignItems: "center"
            }}
          >
            <input
              type="checkbox"
              title="Select all invoices"
              className={styles.selectCheckbox}
              checked={filtered.length > 0 && selectedIds.size === filtered.length}
              onChange={toggleSelectAll}
            />
            {["Invoice", "Project", "Amount", "Due Date", "Status", "Actions"].map((h) => (
              <span key={h} style={{ fontSize: ".54rem", letterSpacing: ".15em", textTransform: "uppercase", color: "var(--muted2)" }}>
                {h}
              </span>
            ))}
          </div>

          {filtered.map((inv) => (
            <div
              key={inv.id}
              style={{
                display: "grid",
                gridTemplateColumns: "32px 120px 1fr 120px 110px 120px 140px",
                alignItems: "center",
                padding: "14px 16px",
                background: "var(--surface)",
                border: `1px solid ${selectedIds.has(inv.id) ? "var(--accent)" : "var(--border)"}`,
                borderLeft: `3px solid ${statusBorderColor(inv.status)}`,
                marginBottom: 8,
                transition: "all .18s"
              }}
            >
              <input
                type="checkbox"
                title={`Select ${inv.id}`}
                className={styles.selectCheckbox}
                checked={selectedIds.has(inv.id)}
                onChange={() => toggleSelect(inv.id)}
              />
              <span style={{ fontSize: ".72rem", color: "var(--accent)", fontWeight: 500 }}>{inv.id}</span>
              <div>
                <div style={{ fontSize: ".78rem", fontWeight: 700, marginBottom: 2 }}>{inv.project}</div>
                <div style={{ fontSize: ".6rem", color: "var(--muted)" }}>{inv.milestones}</div>
              </div>
              <span style={{ fontSize: ".88rem", fontWeight: 500 }}>R {inv.amount.toLocaleString()}</span>
              <span style={{ fontSize: ".68rem", color: inv.status === "overdue" ? "var(--red)" : "var(--muted)" }}>{inv.due}</span>
              <span className={cx(styles.badge, BADGE_CLASS[inv.status])}>{inv.status}</span>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {inv.status !== "paid" && inv.status !== "draft" ? (
                  <button className={cx(styles.button, styles.buttonAccent, styles.buttonSm)} onClick={() => { setPayModal(inv); setPayStep(1); setPayMethod("Card"); }} type="button">
                    Pay Now
                  </button>
                ) : null}
                {inv.status === "paid" ? (
                  <button
                    className={cx(styles.button, styles.buttonGhost, styles.buttonSm)}
                    onClick={() => showToast("Receipt downloaded", `${inv.id} PDF generated`)}
                    type="button"
                  >
                    Receipt
                  </button>
                ) : null}
                {inv.status === "draft" ? (
                  <button className={cx(styles.button, styles.buttonGhost, styles.buttonSm)} onClick={() => onOpenInvoice(inv.id)} type="button">
                    Open
                  </button>
                ) : null}
                <button
                  className={cx(styles.button, styles.buttonGhost, styles.buttonSm)}
                  style={{ color: "var(--red)", borderColor: "rgba(255,95,95,.3)" }}
                  onClick={() => setDisputeModal(inv)}
                  type="button"
                >
                  Dispute
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "var(--muted2)", fontSize: ".72rem", letterSpacing: ".1em", textTransform: "uppercase" }}>
              No invoices match your filter
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Bulk action bar ──────────────────────────────────── */}
      {selectedIds.size > 0 ? (
        <div className={styles.bulkBar}>
          <span className={styles.bulkBarCount}>{selectedIds.size} selected</span>
          <button
            className={cx(styles.button, styles.buttonGhost)}
            type="button"
            onClick={() => {
              showToast("Export started", `${selectedIds.size} invoice(s) exporting as CSV`);
              setSelectedIds(new Set());
            }}
          >
            Export Selected
          </button>
          <button
            className={cx(styles.button, styles.buttonAccent)}
            type="button"
            onClick={() => {
              showToast("Batch payment initiated", `${selectedIds.size} invoice(s) queued for payment`);
              setSelectedIds(new Set());
            }}
          >
            Pay Selected
          </button>
        </div>
      ) : null}

      {/* ── Pay modal (3-step) ──────────────────────────────── */}
      {payModal ? (
        <div className={styles.overlay} onClick={() => { if (payStep !== 3) setPayModal(null); }}>
          <div className={styles.modal} style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>
                {payStep === 1 ? "Choose Payment Method" : payStep === 2 ? "Confirm Payment" : "Payment Successful"}
              </span>
              {payStep !== 3 ? (
                <button className={styles.modalClose} onClick={() => setPayModal(null)} type="button">✕</button>
              ) : null}
            </div>

            {/* Step progress bar */}
            <div className={styles.payStepBar}>
              {([1, 2, 3] as const).map((s) => (
                <div key={s} className={styles.payStepSeg}
                  style={{ background: s <= payStep ? "var(--accent)" : "var(--border)" }} />
              ))}
            </div>

            {/* ── Step 1: Method selection ── */}
            {payStep === 1 ? (
              <div style={{ padding: "0 24px 20px" }}>
                <div style={{ fontSize: ".64rem", color: "var(--muted)", marginBottom: 14 }}>
                  {payModal.id} · R {payModal.amount.toLocaleString()} · Due {payModal.due}
                </div>
                <div className={styles.methodCards}>
                  {(["Card", "EFT", "Instant EFT"] as const).map((m) => (
                    <button key={m} type="button"
                      className={cx(styles.methodCard, payMethod === m ? styles.methodCardActive : undefined)}
                      onClick={() => setPayMethod(m)}>
                      <div style={{ fontSize: "1.2rem", marginBottom: 4 }}>
                        {m === "Card" ? "💳" : m === "EFT" ? "🏦" : "⚡"}
                      </div>
                      {m}
                    </button>
                  ))}
                </div>
                {payMethod === "EFT" || payMethod === "Instant EFT" ? (
                  <div className={styles.bankDetails}>
                    <div className={styles.bankRow}><span>Bank</span><span>FNB</span></div>
                    <div className={styles.bankRow}><span>Account</span><span>62 1234 5678</span></div>
                    <div className={styles.bankRow}><span>Branch</span><span>250 655</span></div>
                    <div className={styles.bankRow}><span>Type</span><span>Current</span></div>
                    <div className={styles.bankRow}><span>Reference</span><span>{payModal.id}</span></div>
                  </div>
                ) : null}
                <button type="button"
                  className={cx(styles.button, styles.buttonAccent)}
                  style={{ width: "100%", marginTop: 18 }}
                  onClick={() => setPayStep(2)}>
                  Continue →
                </button>
              </div>
            ) : null}

            {/* ── Step 2: Confirm ── */}
            {payStep === 2 ? (
              <div style={{ padding: "0 24px 20px" }}>
                <div style={{ background: "var(--s3)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 18px", marginBottom: 18 }}>
                  <div style={{ fontSize: ".6rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 10 }}>Payment Summary</div>
                  {[
                    { lbl: "Invoice", val: payModal.id },
                    { lbl: "Project", val: payModal.project },
                    { lbl: "Amount",  val: `R ${payModal.amount.toLocaleString()}` },
                    { lbl: "Method",  val: payMethod },
                    { lbl: "Due",     val: payModal.due },
                  ].map((row) => (
                    <div key={row.lbl} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--border)", fontSize: ".72rem" }}>
                      <span style={{ color: "var(--muted)" }}>{row.lbl}</span>
                      <span style={{ fontWeight: 700 }}>{row.val}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button type="button" className={cx(styles.button, styles.buttonGhost)} style={{ flex: 1 }}
                    onClick={() => setPayStep(1)}>← Back</button>
                  <button type="button" className={cx(styles.button, styles.buttonAccent)} style={{ flex: 2 }}
                    onClick={handlePay}>✓ Confirm Payment</button>
                </div>
              </div>
            ) : null}

            {/* ── Step 3: Success ── */}
            {payStep === 3 ? (
              <div style={{ padding: "20px 24px 28px", textAlign: "center" }}>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "rgba(52,217,139,.15)", border: "2px solid var(--green)",
                  margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.8rem", animation: "popIn .4s ease", color: "var(--green)"
                }}>
                  ✓
                </div>
                <div style={{ fontSize: "1rem", fontWeight: 800, marginBottom: 6 }}>Payment Successful!</div>
                <div style={{ fontSize: ".75rem", color: "var(--muted)", marginBottom: 20 }}>
                  {payModal.id} — R {payModal.amount.toLocaleString()} via {payMethod}
                </div>
                <button type="button" className={cx(styles.button, styles.buttonGhost)} style={{ width: "100%" }}
                  onClick={() => showToast("Receipt emailed", payModal.id)}>
                  📄 Download Receipt
                </button>
              </div>
            ) : null}

          </div>
        </div>
      ) : null}

      {/* Dispute modal */}
      {disputeModal ? (
        <div className={styles.overlay} onClick={() => setDisputeModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>Dispute Invoice</span>
              <button className={styles.modalClose} onClick={() => setDisputeModal(null)} type="button">
                ✕
              </button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ fontSize: ".64rem", color: "var(--muted)", marginBottom: 16 }}>
                {disputeModal.id} · R {disputeModal.amount.toLocaleString()}
              </div>
              <div style={{ fontSize: ".58rem", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>
                Reason for Dispute
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                {["Incorrect amount", "Duplicate charge", "Work not delivered", "Scope disagreement", "Other"].map((r) => (
                  <button
                    key={r}
                    style={{
                      padding: "10px 12px",
                      background: disputeReason === r ? "rgba(255,95,95,.12)" : "var(--bg)",
                      border: disputeReason === r ? "1px solid var(--red)" : "1px solid var(--border)",
                      color: disputeReason === r ? "var(--red)" : "var(--muted)",
                      fontSize: ".72rem",
                      fontWeight: 600,
                      textAlign: "left"
                    }}
                    onClick={() => setDisputeReason(r)}
                    type="button"
                  >
                    {r}
                  </button>
                ))}
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Additional Details</label>
                <textarea className={styles.formTextarea} placeholder="Describe the issue in detail…" />
              </div>
            </div>
            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className={cx(styles.button, styles.buttonGhost)} onClick={() => setDisputeModal(null)} type="button">
                Cancel
              </button>
              <button
                className={cx(styles.button, styles.buttonAccent)}
                style={{ background: "var(--red)", color: "#fff", borderColor: "var(--red)" }}
                onClick={handleDispute}
                type="button"
              >
                Submit Dispute
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div
          style={{
            position: "fixed",
            bottom: 28,
            right: 28,
            background: "var(--surface)",
            border: "1px solid var(--accent)",
            padding: "14px 20px",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            gap: 12,
            animation: "slideUp var(--dur-normal, 250ms) var(--ease-out, cubic-bezier(0.23,1,0.32,1))"
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              background: "var(--accent)",
              color: "var(--on-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: ".7rem",
              fontWeight: 700,
              flexShrink: 0,
              borderRadius: "50%"
            }}
          >
            ✓
          </div>
          <div>
            <div style={{ fontSize: ".76rem", fontWeight: 700 }}>{toast.text}</div>
            <div style={{ fontSize: ".6rem", color: "var(--muted)" }}>{toast.sub}</div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

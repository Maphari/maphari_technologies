// ════════════════════════════════════════════════════════════════════════════
// expense-tracker-page.tsx — Admin Expense Tracker
// Data     : loadExpensesWithRefresh     → GET /expenses
//            loadExpenseBudgetsWithRefresh → GET /expense-budgets
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminFilterBar } from "./shared";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";
import type { AuthSession } from "../../../../lib/auth/session";
import { loadExpensesWithRefresh, loadExpenseBudgetsWithRefresh, approveExpenseWithRefresh, type AdminExpense, type AdminExpenseBudget } from "../../../../lib/api/admin";
import { saveSession } from "../../../../lib/auth/session";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

const statusConfig: Record<string, { badge: string; label: string }> = {
  APPROVED:  { badge: "badgeGreen",  label: "Approved"  },
  PENDING:   { badge: "badgeAmber",  label: "Pending"   },
  FLAGGED:   { badge: "badgeRed",    label: "Flagged"   },
  REJECTED:  { badge: "badgeRed",    label: "Rejected"  },
  approved:  { badge: "badgeGreen",  label: "Approved"  },
  pending:   { badge: "badgeAmber",  label: "Pending"   },
  flagged:   { badge: "badgeRed",    label: "Flagged"   },
  rejected:  { badge: "badgeRed",    label: "Rejected"  },
};

const tabs = ["expense log", "budgets", "by category", "tax summary"] as const;
type Tab = (typeof tabs)[number];

// ── Component ─────────────────────────────────────────────────────────────────
export function ExpenseTrackerPage({ session }: { session: AuthSession | null }) {
  const [apiExpenses, setApiExpenses]   = useState<AdminExpense[]>([]);
  const [apiBudgets,  setApiBudgets]    = useState<AdminExpenseBudget[]>([]);
  const [activeTab,   setActiveTab]     = useState<Tab>("expense log");
  const [filterStatus, setFilterStatus] = useState<"All" | "approved" | "pending" | "flagged">("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    void Promise.all([
      loadExpensesWithRefresh(session),
      loadExpenseBudgetsWithRefresh(session),
    ]).then(([er, br]) => {
      if (er.nextSession) saveSession(er.nextSession);
      else if (br.nextSession) saveSession(br.nextSession);
      if (er.error) setError(er.error.message ?? "Failed to load.");
      else if (er.data) setApiExpenses(er.data);
      if (!br.error && br.data) setApiBudgets(br.data);
      setLoading(false);
    }).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to load.");
      setLoading(false);
    });
  }, [session]);

  // ── Derived display data ───────────────────────────────────────────────────
  const expenses = useMemo(() => apiExpenses.map((e) => ({
    id:          `EXP-${e.id.slice(0, 6).toUpperCase()}`,
    date:        fmtDate(e.expenseDate),
    category:    e.category,
    subcategory: e.subcategory ?? "—",
    description: e.description,
    amount:      Math.round(e.amountCents / 100),
    submittedBy: e.submittedBy ?? "Unknown",
    status:      e.status.toLowerCase() as "approved" | "pending" | "flagged" | "rejected",
    receipt:     e.hasReceipt,
    billable:    e.isBillable,
    client:      null as string | null,
    clientColor: "var(--muted)" as string,
    rawId:       e.id,
  })), [apiExpenses]);

  const budgets = useMemo(() => apiBudgets.map((b) => ({
    category: b.category,
    budget:   Math.round(b.budgetCents / 100),
    spent:    Math.round(b.spentCents / 100),
    color:    "var(--accent)" as string,
  })), [apiBudgets]);

  const totalSpent        = expenses.reduce((s, e) => s + e.amount, 0);
  const pendingItems      = expenses.filter((e) => e.status === "pending" || e.status === "flagged");
  const billableTotal     = expenses.filter((e) => e.billable).reduce((s, e) => s + e.amount, 0);
  const missingReceipts   = expenses.filter((e) => !e.receipt).length;

  const filtered = useMemo(
    () => (filterStatus === "All" ? expenses : expenses.filter((e) => e.status === filterStatus)),
    [filterStatus, expenses]
  );

  const handleApprove = async (rawId: string) => {
    if (!session) return;
    const r = await approveExpenseWithRefresh(session, rawId, "approve");
    if (r.nextSession) saveSession(r.nextSession);
    if (!r.error) setApiExpenses((prev) => prev.map((e) => e.id === rawId ? { ...e, status: "APPROVED" } : e));
  };

  if (loading) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("flexCol", "gap12")}>
          <div className={cx("skeletonBlock", "skeleH68")} />
          <div className={cx("skeletonBlock", "skeleH80")} />
          <div className={cx("skeletonBlock", "skeleH68")} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cx("pageBody")}>
        <div className={cx("errorState")}>
          <div className={cx("errorStateIcon")}>✕</div>
          <div className={cx("errorStateTitle")}>Failed to load</div>
          <div className={cx("errorStateSub")}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cx(styles.pageBody, styles.expenseRoot)}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / FINANCIAL</div>
          <h1 className={styles.pageTitle}>Expense Tracker</h1>
          <div className={styles.pageSub}>Ad hoc expenses, receipts, budget tracking, and SARS categorisation</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnGhost")} disabled title="Coming soon">Export CSV</button>
          <button type="button" className={cx("btnSm", "btnAccent")} disabled title="Coming soon">+ Log Expense</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Total Expenses",      value: `R${(totalSpent / 1000).toFixed(1)}k`,   color: "var(--amber)", sub: `${expenses.length} items` },
          { label: "Pending Approval",    value: pendingItems.length.toString(),            color: pendingItems.length > 0 ? "var(--red)" : "var(--accent)", sub: "Require review" },
          { label: "Billable to Clients", value: `R${(billableTotal / 1000).toFixed(1)}k`, color: "var(--blue)",  sub: "To be recovered" },
          { label: "Missing Receipts",    value: missingReceipts.toString(),                color: missingReceipts > 0 ? "var(--red)" : "var(--accent)", sub: "SARS non-compliant" },
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue, "mb4", styles.expenseToneText, toneClass(s.color))}>{s.value}</div>
            <div className={cx("text11", "colorMuted")}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className={cx("overflowAuto", "minH0")}>
        <AdminFilterBar panelColor="var(--surface)" borderColor="var(--border)">
          <select title="Select tab" value={activeTab} onChange={(e) => setActiveTab(e.target.value as Tab)} className={styles.formInput}>
            {tabs.map((tab) => <option key={tab} value={tab}>{tab}</option>)}
          </select>
          {activeTab === "expense log" ? (
            <select title="Filter by status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)} className={styles.formInput}>
              <option value="All">Status: All</option>
              <option value="approved">Status: Approved</option>
              <option value="pending">Status: Pending</option>
              <option value="flagged">Status: Flagged</option>
            </select>
          ) : null}
        </AdminFilterBar>

        {activeTab === "expense log" && (
          <div className={cx("card", "overflowHidden")}>
            <div className={styles.expenseHead}>
              {["ID", "Date", "Description", "Submitted By", "Category", "Amount", "Receipt", "Billable", "Status", ""].map((h) => <span key={h}>{h}</span>)}
            </div>
            {filtered.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptySub}>No expenses match the current filter.</div>
              </div>
            ) : null}
            {filtered.map((e) => {
              const sc = statusConfig[e.status] ?? { badge: "badge", label: e.status };
              return (
                <div key={e.id} className={cx(styles.expenseRow, e.status === "flagged" && styles.expenseRowFlagged)}>
                  <span className={cx("fontMono", "text10", "colorMuted")}>{e.id}</span>
                  <span className={cx("fontMono", "text11", "colorMuted")}>{e.date}</span>
                  <div>
                    <div className={cx("text12", "fw600")}>{e.description}</div>
                    {e.billable && e.client ? <div className={cx("text10", styles.expenseToneText, toneClass(e.clientColor))}>Billable: {e.client}</div> : null}
                  </div>
                  <span className={cx("text12")}>{e.submittedBy.split(" ")[0]}</span>
                  <div>
                    <div className={cx("text11")}>{e.category}</div>
                    <div className={cx("textXs", "colorMuted")}>{e.subcategory}</div>
                  </div>
                  <span className={cx("fontMono", "fw700", "colorAmber")}>R{e.amount.toLocaleString()}</span>
                  <span className={cx("textCenter", "text14", styles.expenseToneText, e.receipt ? "toneAccent" : "toneRed")}>{e.receipt ? "✓" : "✗"}</span>
                  <span className={cx("textCenter", "text14", styles.expenseToneText, e.billable ? "toneBlue" : "toneMuted")}>{e.billable ? "✓" : "-"}</span>
                  <span className={cx("badge", sc.badge)}>{sc.label}</span>
                  <div className={cx("flexRow", "gap4")}>
                    {e.status === "pending" ? <button type="button" className={cx("btnSm", "btnAccent")} onClick={() => void handleApprove(e.rawId)}>Approve</button> : null}
                    <button type="button" className={cx("btnSm", "btnGhost")}>Edit</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "budgets" && (
          <div className={cx("flexCol", "gap14")}>
            {budgets.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="12" y1="12" x2="12" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="9" y1="15" x2="15" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className={styles.emptyTitle}>No budgets configured</div>
                <div className={styles.emptySub}>Budget categories are set up when expenses are submitted and categorised. Log your first expense to populate this view.</div>
              </div>
            ) : null}
            {budgets.map((b) => {
              const pct = b.budget > 0 ? Math.round((b.spent / b.budget) * 100) : 0;
              const remaining = b.budget - b.spent;
              const color = pct >= 90 ? "var(--red)" : pct >= 70 ? "var(--amber)" : b.color;
              return (
                <div key={b.category} className={cx(styles.card, styles.expenseBudgetCard, pct >= 90 && styles.expenseBudgetWarn)}>
                  <div className={styles.cardInner}>
                    <div className={styles.budgetRow}>
                      <div className={cx("fw600")}>{b.category}</div>
                      <div>
                        <div className={cx("flexBetween", "mb6")}>
                          <span className={cx("text11", "colorMuted")}>R{(b.spent / 1000).toFixed(1)}k of R{(b.budget / 1000).toFixed(0)}k</span>
                          <span className={cx("fontMono", "text12", styles.expenseToneText, toneClass(color))}>{pct}%</span>
                        </div>
                        <div className={cx(styles.progressBar, "h8")}>
                          <progress className={cx(styles.expenseBarFill, "uiProgress", toneClass(color))} max={100} value={Math.min(pct, 100)} />
                        </div>
                      </div>
                      <div className={cx("textRight")}>
                        <div className={cx("text10", "colorMuted")}>Spent</div>
                        <div className={cx("fontMono", "colorAmber", "fw700")}>R{(b.spent / 1000).toFixed(1)}k</div>
                      </div>
                      <div className={cx("textRight")}>
                        <div className={cx("text10", "colorMuted")}>Remaining</div>
                        <div className={cx("fontMono", "fw700", styles.expenseToneText, remaining >= 0 ? "toneAccent" : "toneRed")}>R{(remaining / 1000).toFixed(1)}k</div>
                      </div>
                      {pct >= 90 ? <span className={cx("badge", "badgeRed")}>Near limit</span> : <span />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "by category" && (
          <div className={cx("grid2", "gap20")}>
            <div className={cx(styles.card)}>
              <div className={styles.cardInner}>
              <div className={cx("text13", "fw700", "mb20", "uppercase", "tracking")}>Spend by Category</div>
              {budgets.map((b) => (
                <div key={b.category} className={cx("flexRow", "gap12", "mb14")}>
                  <div className={cx("noShrink", styles.expenseDot10, styles.expenseToneBg, toneClass(b.color))} />
                  <span className={cx("text12", styles.expenseFlex1)}>{b.category}</span>
                  <div className={cx(styles.progressBar, styles.expenseProg100)}>
                    <progress className={cx(styles.expenseBarFill, "uiProgress", toneClass(b.color))} max={100} value={totalSpent > 0 ? (b.spent / totalSpent) * 100 : 0} />
                  </div>
                  <span className={cx("fontMono", "fw700", "textRight", styles.expenseToneText, styles.expenseW60, toneClass(b.color))}>R{(b.spent / 1000).toFixed(1)}k</span>
                </div>
              ))}
              </div>
            </div>
            <div className={cx(styles.card)}>
              <div className={styles.cardInner}>
              <div className={cx("text13", "fw700", "mb20", "uppercase", "tracking")}>By Submitter</div>
              {[...new Set(expenses.map((e) => e.submittedBy))].map((name) => {
                const spent = expenses.filter((e) => e.submittedBy === name).reduce((s, e) => s + e.amount, 0);
                if (!spent) return null;
                return (
                  <div key={name} className={cx("flexRow", "gap12", "mb14")}>
                    <span className={cx("text12", styles.expenseFlex1)}>{name.split(" ")[0]}</span>
                    <div className={cx(styles.progressBar, styles.expenseProg100)}>
                      <progress className={cx(styles.expenseBarFill, "uiProgress", "toneAccent")} max={100} value={totalSpent > 0 ? (spent / totalSpent) * 100 : 0} />
                    </div>
                    <span className={cx("fontMono", "colorAccent", "fw700", "textRight", styles.expenseW60)}>R{(spent / 1000).toFixed(1)}k</span>
                  </div>
                );
              })}
              </div>
            </div>
          </div>
        )}

        {activeTab === "tax summary" && (
          <div className={cx("grid2", "gap20")}>
            <div className={cx(styles.card)}>
              <div className={styles.cardInner}>
                <div className={cx("text13", "fw700", "mb20", "uppercase", "tracking")}>SARS-Ready Summary</div>
                {[
                  { label: "Total deductible expenses",  value: `R${(totalSpent / 1000).toFixed(1)}k`,                               color: "var(--accent)" },
                  { label: "VAT on expenses (15%)",      value: `R${((totalSpent * 0.15) / 1000).toFixed(1)}k`,                      color: "var(--blue)"   },
                  { label: "Input VAT claimable",        value: expenses.length > 0 ? `R${((totalSpent * 0.15 * (expenses.filter((e) => e.receipt).length / expenses.length)) / 1000).toFixed(1)}k` : "R0k", color: "var(--accent)" },
                  { label: "Missing receipts (at risk)", value: `${missingReceipts} items`,                                           color: "var(--red)"    },
                ].map((r) => (
                  <div key={r.label} className={cx("flexBetween", "text13", "borderB", "py10")}>
                    <span className={cx("colorMuted")}>{r.label}</span>
                    <span className={cx("fontMono", "fw700", styles.expenseToneText, toneClass(r.color))}>{r.value}</span>
                  </div>
                ))}
                <button type="button" className={cx("btnSm", "btnAccent", "mt20")}>Export for Accountant</button>
              </div>
            </div>
            <div className={cx(styles.card, styles.expenseRiskCard)}>
              <div className={styles.cardInner}>
                <div className={cx("text13", "fw700", "mb16", "colorRed", "uppercase")}>Missing Receipts</div>
                {expenses.filter((e) => !e.receipt).map((e) => (
                  <div key={e.id} className={cx("bgBg", "p12", "mb8")}>
                    <div className={cx("fw600", "text13")}>{e.description}</div>
                    <div className={cx("text11", "colorMuted", "mt4")}>{e.submittedBy} &middot; {e.date} &middot; <span className={cx("colorAmber")}>R{e.amount.toLocaleString()}</span></div>
                    <button type="button" className={cx("btnSm", "btnAccent", "mt8", styles.expenseAmberBtn)}>Upload Receipt</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

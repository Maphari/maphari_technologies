"use client";

import { useMemo, useState } from "react";
import { AdminFilterBar } from "./shared";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";

const expenses = [
  { id: "EXP-094", date: "Feb 22", category: "Client Entertainment", subcategory: "Meals", description: "Client lunch - Volta Studios brand review", amount: 1240, submittedBy: "Nomsa Dlamini", status: "approved", receipt: true, billable: true, client: "Volta Studios", clientColor: "var(--accent)" },
  { id: "EXP-093", date: "Feb 21", category: "Travel", subcategory: "Uber", description: "Client site visit - Mira Health offices", amount: 340, submittedBy: "Kira Bosman", status: "pending", receipt: true, billable: true, client: "Mira Health", clientColor: "var(--blue)" },
  { id: "EXP-092", date: "Feb 20", category: "Software", subcategory: "Plugin", description: "Motion Bro plugin - annual licence", amount: 890, submittedBy: "Renzo Fabbri", status: "approved", receipt: true, billable: false, client: null, clientColor: "var(--muted)" },
  { id: "EXP-091", date: "Feb 18", category: "Office Supplies", subcategory: "Stationery", description: "Pantone colour guides - Q1 refresh", amount: 2100, submittedBy: "Renzo Fabbri", status: "approved", receipt: true, billable: false, client: null, clientColor: "var(--muted)" },
  { id: "EXP-090", date: "Feb 17", category: "Travel", subcategory: "Flights", description: "Cape Town trip - Dune Collective in-person", amount: 5800, submittedBy: "Renzo Fabbri", status: "approved", receipt: false, billable: true, client: "Dune Collective", clientColor: "var(--amber)" },
  { id: "EXP-089", date: "Feb 15", category: "Training", subcategory: "Course", description: "Figma Advanced course - Kira Bosman", amount: 1800, submittedBy: "Kira Bosman", status: "approved", receipt: true, billable: false, client: null, clientColor: "var(--muted)" },
  { id: "EXP-088", date: "Feb 14", category: "Client Entertainment", subcategory: "Gifts", description: "Valentine's gift basket - top 3 clients", amount: 3600, submittedBy: "Nomsa Dlamini", status: "approved", receipt: true, billable: false, client: null, clientColor: "var(--muted)" },
  { id: "EXP-087", date: "Feb 10", category: "Software", subcategory: "Subscription", description: "Miro Teams - monthly (flagged for review)", amount: 200, submittedBy: "Leilani Fotu", status: "flagged", receipt: true, billable: false, client: null, clientColor: "var(--muted)" },
  { id: "EXP-086", date: "Feb 8", category: "Marketing", subcategory: "Print", description: "Maphari brand brochures - 200 copies", amount: 4200, submittedBy: "Sipho Nkosi", status: "approved", receipt: true, billable: false, client: null, clientColor: "var(--muted)" }
] as const;

const budgets = [
  { category: "Client Entertainment", budget: 8000, spent: 4840, color: "var(--accent)" },
  { category: "Travel", budget: 12000, spent: 6140, color: "var(--blue)" },
  { category: "Software", budget: 6000, spent: 1090, color: "var(--accent)" },
  { category: "Office Supplies", budget: 3000, spent: 2100, color: "var(--amber)" },
  { category: "Training", budget: 5000, spent: 1800, color: "var(--amber)" },
  { category: "Marketing", budget: 10000, spent: 4200, color: "var(--red)" }
] as const;

const statusConfig = {
  approved: { badge: "badgeGreen", label: "Approved" },
  pending: { badge: "badgeAmber", label: "Pending" },
  flagged: { badge: "badgeRed", label: "Flagged" },
  rejected: { badge: "badgeRed", label: "Rejected" }
} as const;

const tabs = ["expense log", "budgets", "by category", "tax summary"] as const;
type Tab = (typeof tabs)[number];

export function ExpenseTrackerPage() {
  const [activeTab, setActiveTab] = useState<Tab>("expense log");
  const [filterStatus, setFilterStatus] = useState<"All" | "approved" | "pending" | "flagged">("All");

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const pending = expenses.filter((e) => e.status === "pending" || e.status === "flagged");
  const billable = expenses.filter((e) => e.billable).reduce((s, e) => s + e.amount, 0);
  const missingReceipts = expenses.filter((e) => !e.receipt).length;

  const filtered = useMemo(
    () => (filterStatus === "All" ? expenses : expenses.filter((e) => e.status === filterStatus)),
    [filterStatus]
  );

  return (
    <div className={cx(styles.pageBody, styles.expenseRoot)}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / FINANCIAL</div>
          <h1 className={styles.pageTitle}>Expense Tracker</h1>
          <div className={styles.pageSub}>Ad hoc expenses, receipts, budget tracking, and SARS categorisation</div>
        </div>
        <div className={styles.pageActions}>
          <button type="button" className={cx("btnSm", "btnGhost")}>Export CSV</button>
          <button type="button" className={cx("btnSm", "btnAccent")}>+ Log Expense</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Total Expenses (Feb)", value: `R${(totalSpent / 1000).toFixed(1)}k`, color: "var(--amber)", sub: `${expenses.length} items` },
          { label: "Pending Approval", value: pending.length.toString(), color: pending.length > 0 ? "var(--red)" : "var(--accent)", sub: "Require review" },
          { label: "Billable to Clients", value: `R${(billable / 1000).toFixed(1)}k`, color: "var(--blue)", sub: "To be recovered" },
          { label: "Missing Receipts", value: missingReceipts.toString(), color: missingReceipts > 0 ? "var(--red)" : "var(--accent)", sub: "SARS non-compliant" }
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
            {tabs.map((tab) => (
              <option key={tab} value={tab}>{tab}</option>
            ))}
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
            {filtered.map((e) => {
              const sc = statusConfig[e.status];
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
                  <span className={cx("textCenter", "text14", styles.expenseToneText, e.receipt ? "toneAccent" : "toneRed")}>{e.receipt ? "\u2713" : "\u2717"}</span>
                  <span className={cx("textCenter", "text14", styles.expenseToneText, e.billable ? "toneBlue" : "toneMuted")}>{e.billable ? "\u2713" : "-"}</span>
                  <span className={cx("badge", sc.badge)}>{sc.label}</span>
                  <div className={cx("flexRow", "gap4")}>
                    {e.status === "pending" ? <button type="button" className={cx("btnSm", "btnAccent")}>Approve</button> : null}
                    <button type="button" className={cx("btnSm", "btnGhost")}>Edit</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "budgets" && (
          <div className={cx("flexCol", "gap14")}>
            {budgets.map((b) => {
              const pct = Math.round((b.spent / b.budget) * 100);
              const remaining = b.budget - b.spent;
              const color = pct >= 90 ? "var(--red)" : pct >= 70 ? "var(--amber)" : b.color;
              return (
                <div key={b.category} className={cx(styles.card, styles.expenseBudgetCard, pct >= 90 && styles.expenseBudgetWarn)}>
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
              );
            })}
          </div>
        )}

        {activeTab === "by category" && (
          <div className={cx("grid2", "gap20")}>
            <div className={cx(styles.card, styles.expensePad24)}>
              <div className={cx("text13", "fw700", "mb20", "uppercase", "tracking")}>Spend by Category</div>
              {budgets.map((b) => (
                <div key={b.category} className={cx("flexRow", "gap12", "mb14")}>
                  <div className={cx("noShrink", styles.expenseDot10, styles.expenseToneBg, toneClass(b.color))} />
                  <span className={cx("text12", styles.expenseFlex1)}>{b.category}</span>
                  <div className={cx(styles.progressBar, styles.expenseProg100)}>
                    <progress className={cx(styles.expenseBarFill, "uiProgress", toneClass(b.color))} max={100} value={(b.spent / totalSpent) * 100} />
                  </div>
                  <span className={cx("fontMono", "fw700", "textRight", styles.expenseToneText, styles.expenseW60, toneClass(b.color))}>R{(b.spent / 1000).toFixed(1)}k</span>
                </div>
              ))}
            </div>
            <div className={cx(styles.card, styles.expensePad24)}>
              <div className={cx("text13", "fw700", "mb20", "uppercase", "tracking")}>By Submitter</div>
              {["Sipho Nkosi", "Nomsa Dlamini", "Renzo Fabbri", "Kira Bosman", "Leilani Fotu"].map((name) => {
                const spent = expenses.filter((e) => e.submittedBy === name).reduce((s, e) => s + e.amount, 0);
                if (!spent) return null;
                return (
                  <div key={name} className={cx("flexRow", "gap12", "mb14")}>
                    <span className={cx("text12", styles.expenseFlex1)}>{name.split(" ")[0]}</span>
                    <div className={cx(styles.progressBar, styles.expenseProg100)}>
                      <progress className={cx(styles.expenseBarFill, "uiProgress", "toneAccent")} max={100} value={(spent / totalSpent) * 100} />
                    </div>
                    <span className={cx("fontMono", "colorAccent", "fw700", "textRight", styles.expenseW60)}>R{(spent / 1000).toFixed(1)}k</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "tax summary" && (
          <div className={cx("grid2", "gap20")}>
            <div className={cx(styles.card, "p24")}>
              <div className={cx("text13", "fw700", "mb20", "uppercase", "tracking")}>SARS-Ready Summary (FY2026)</div>
              {[
                { label: "Total deductible expenses", value: `R${(totalSpent / 1000).toFixed(1)}k`, color: "var(--accent)" },
                { label: "VAT on expenses (15%)", value: `R${((totalSpent * 0.15) / 1000).toFixed(1)}k`, color: "var(--blue)" },
                { label: "Input VAT claimable", value: `R${((totalSpent * 0.15 * (expenses.filter((e) => e.receipt).length / expenses.length)) / 1000).toFixed(1)}k`, color: "var(--accent)" },
                { label: "Missing receipts (at risk)", value: `${missingReceipts} items`, color: "var(--red)" }
              ].map((r) => (
                <div key={r.label} className={cx("flexBetween", "text13", "borderB", "py10")}>
                  <span className={cx("colorMuted")}>{r.label}</span>
                  <span className={cx("fontMono", "fw700", styles.expenseToneText, toneClass(r.color))}>{r.value}</span>
                </div>
              ))}
              <button type="button" className={cx("btnSm", "btnAccent", "mt20")}>Export for Accountant</button>
            </div>
            <div className={cx(styles.card, styles.expenseRiskCard)}>
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
        )}
      </div>
    </div>
  );
}

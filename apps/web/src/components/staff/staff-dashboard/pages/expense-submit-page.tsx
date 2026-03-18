// ════════════════════════════════════════════════════════════════════════════
// expense-submit-page.tsx — Staff Expense Submission
// Data     : loadMyExpensesWithRefresh  → GET  /expenses
//            submitExpenseWithRefresh   → POST /expenses
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useMemo, useState } from "react";
import { cx } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { loadMyExpensesWithRefresh, submitExpenseWithRefresh, type StaffExpenseRecord } from "../../../../lib/api/staff";
import { saveSession } from "../../../../lib/auth/session";
import { inferCountryFromLocale, currencyFromCountry } from "../../../../lib/i18n/currency";

// ── Types ─────────────────────────────────────────────────────────────────────
type DisplayCategory = "Software" | "Travel" | "Equipment" | "Subscription" | "Hosting" | "Other";
const CATEGORIES: DisplayCategory[] = ["Software", "Travel", "Equipment", "Subscription", "Hosting", "Other"];

const catBadgeCls: Record<DisplayCategory, string> = {
  Software: "exCatSoftware", Travel: "exCatTravel", Equipment: "exCatEquipment",
  Subscription: "exCatSubscription", Hosting: "exCatHosting", Other: "exCatOther",
};

function statusTone(status: string) {
  const s = status.toUpperCase();
  if (s === "APPROVED")  return "badgeGreen";
  if (s === "PENDING")   return "badgeAmber";
  if (s === "REJECTED")  return "badgeRed";
  return "badge";
}

function fmt(n: number) { return `R${n.toLocaleString()}`; }

function mapCategory(raw: string): DisplayCategory {
  const valid: DisplayCategory[] = ["Software", "Travel", "Equipment", "Subscription", "Hosting", "Other"];
  const matched = valid.find((v) => v.toLowerCase() === raw.toLowerCase());
  return matched ?? "Other";
}

// ── Component ─────────────────────────────────────────────────────────────────
export function ExpenseSubmitPage({
  isActive,
  session,
  onFeedback,
}: {
  isActive: boolean;
  session: AuthSession | null;
  onFeedback?: (tone: "success" | "error" | "warning" | "info", message: string) => void;
}) {
  const localCurrency = useMemo(() => {
    if (typeof navigator === "undefined") return "USD";
    const country = inferCountryFromLocale(navigator.language);
    return currencyFromCountry(country) ?? "USD";
  }, []);

  const [apiExpenses, setApiExpenses]     = useState<StaffExpenseRecord[]>([]);
  const [showForm, setShowForm]           = useState(false);
  const [formDesc, setFormDesc]           = useState("");
  const [formAmount, setFormAmount]       = useState("");
  const [formCategory, setFormCategory]   = useState<DisplayCategory>("Software");
  const [submitting, setSubmitting]       = useState(false);

  useEffect(() => {
    if (!session) return;
    void loadMyExpensesWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) setApiExpenses(r.data);
    });
  }, [session]);

  // ── Derived display data ───────────────────────────────────────────────────
  const expenses = useMemo(() => apiExpenses.map((e) => ({
    id:          `EXP-${e.id.slice(0, 6).toUpperCase()}`,
    rawId:       e.id,
    description: e.description,
    amount:      Math.round(e.amountCents / 100),
    category:    mapCategory(e.category),
    project:     "General",
    status:      e.status.charAt(0).toUpperCase() + e.status.slice(1).toLowerCase() as "Draft" | "Submitted" | "Approved" | "Rejected",
    submittedAt: e.createdAt ? new Date(e.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }) : null,
  })), [apiExpenses]);

  const approved      = expenses.filter((e) => e.status === "Approved");
  const submitted     = expenses.filter((e) => e.status === "Submitted" || e.status === "Draft");
  const draft         = expenses.filter((e) => e.status === "Draft");
  const rejected      = expenses.filter((e) => e.status === "Rejected");
  const totalApproved = approved.reduce((s, e) => s + e.amount, 0);
  const totalPending  = submitted.reduce((s, e) => s + e.amount, 0);

  const handleSubmit = async () => {
    if (!session || !formDesc || !formAmount) return;
    setSubmitting(true);
    const r = await submitExpenseWithRefresh(session, {
      category:    formCategory,
      description: formDesc,
      amountCents: Math.round(parseFloat(formAmount) * 100),
      expenseDate: new Date().toISOString(),
    });
    setSubmitting(false);
    if (r.nextSession) saveSession(r.nextSession);
    if (!r.error && r.data) {
      setApiExpenses((prev) => [r.data!, ...prev]);
      setFormDesc("");
      setFormAmount("");
      setFormCategory("Software");
      setShowForm(false);
      onFeedback?.("success", "Expense submitted — pending review.");
    } else if (r.error) {
      onFeedback?.("error", r.error.message ?? "Failed to submit expense. Please try again.");
    }
  };

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-expense-submit">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("flexBetween", "mb20")}>
          <div>
            <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Finance</div>
            <h1 className={cx("pageTitleText")}>Expense Submission</h1>
            <p className={cx("pageSubtitleText")}>Track and submit work-related expenses for review</p>
          </div>
          <button
            type="button"
            className={cx("button", showForm ? "buttonGhost" : "buttonAccent")}
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? "✕ Cancel" : "+ New Expense"}
          </button>
        </div>
      </div>

      {/* ── Stat summary ── */}
      <div className={cx("exStatGrid")}>
        <div className={cx("exStatCard")}>
          <div className={cx("exStatCardTop")}>
            <div className={cx("exStatLabel")}>Total Approved</div>
            <div className={cx("exStatValue", "colorGreen")}>{fmt(totalApproved)}</div>
          </div>
          <div className={cx("exStatCardDivider")} />
          <div className={cx("exStatCardBottom")}>
            <span className={cx("exStatDot", "dotBgGreen")} />
            <span className={cx("exStatMeta")}>{approved.length} expense{approved.length !== 1 ? "s" : ""} cleared</span>
          </div>
        </div>
        <div className={cx("exStatCard")}>
          <div className={cx("exStatCardTop")}>
            <div className={cx("exStatLabel")}>Pending Review</div>
            <div className={cx("exStatValue", totalPending > 0 ? "colorAmber" : "colorMuted")}>{fmt(totalPending)}</div>
          </div>
          <div className={cx("exStatCardDivider")} />
          <div className={cx("exStatCardBottom")}>
            <span className={cx("exStatDot", "dynBgColor")} style={{ "--bg-color": totalPending > 0 ? "var(--amber)" : "var(--muted2)" } as React.CSSProperties} />
            <span className={cx("exStatMeta")}>{submitted.length} awaiting decision</span>
          </div>
        </div>
        <div className={cx("exStatCard")}>
          <div className={cx("exStatCardTop")}>
            <div className={cx("exStatLabel")}>Total Submissions</div>
            <div className={cx("exStatValue", "colorAccent")}>{expenses.length}</div>
          </div>
          <div className={cx("exStatCardDivider")} />
          <div className={cx("exStatCardBottom")}>
            <span className={cx("exStatDot", "dotBgAccent")} />
            <span className={cx("exStatMeta")}>{draft.length} draft · {rejected.length} rejected</span>
          </div>
        </div>
      </div>

      {/* ── New expense form ── */}
      {showForm && (
        <div className={cx("exFormCard")}>
          <div className={cx("exFormHeader")}>
            <div className={cx("exFormTitle")}>New Expense</div>
            <button type="button" className={cx("button", "buttonGhost", "buttonSmall")}  onClick={() => setShowForm(false)}>Cancel</button>
          </div>
          <div className={cx("exFormBody")}>
            <div className={cx("fieldRow", "mb12")}>
              <div className={cx("inputGroup")}>
                <label className={cx("inputLabel")} htmlFor="exp-desc">Description</label>
                <input id="exp-desc" className={cx("input")} value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="What was this expense for?" />
              </div>
              <div className={cx("inputGroup")}>
                <label className={cx("inputLabel")} htmlFor="exp-amount">Amount ({localCurrency})</label>
                <input id="exp-amount" className={cx("input")} type="number" min="0" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <div className={cx("fieldRow", "mb16")}>
              <div className={cx("inputGroup")}>
                <label className={cx("inputLabel")} htmlFor="exp-cat">Category</label>
                <select id="exp-cat" className={cx("select")} value={formCategory} onChange={(e) => setFormCategory(e.target.value as DisplayCategory)}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className={cx("flex", "gap8")}>
              <button type="button" className={cx("button", "buttonAccent")} disabled={!formDesc || !formAmount || submitting} onClick={() => void handleSubmit()}>
                {submitting ? "Submitting…" : "Submit for Review"}
              </button>
              <button type="button" className={cx("button", "buttonGhost")} disabled={!formDesc} onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Expense log ── */}
      <div className={cx("exTableSection")}>
        <div className={cx("exTableHeader")}>
          <div className={cx("exTableTitle")}>Expense Log</div>
          <span className={cx("exTableCount")}>{expenses.length} RECORDS</span>
        </div>
        <div className={cx("tableWrap")}>
          <table className={cx("table")}>
            <thead>
              <tr>
                <th scope="col">ID</th><th scope="col">Description</th><th scope="col">Amount</th><th scope="col">Category</th><th scope="col">Project</th><th scope="col">Status</th><th scope="col">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr><td colSpan={7} className={cx("colorMuted", "text12", "textCenter", "py24_0")}>No expenses found.</td></tr>
              ) : null}
              {expenses.map((exp) => (
                <tr key={exp.rawId}>
                  <td className={cx("fontMono", "text12")}>{exp.id}</td>
                  <td className={cx("fw600")}>{exp.description}</td>
                  <td className={cx("fontMono", "fw600")}>{fmt(exp.amount)}</td>
                  <td><span className={cx("exCatBadge", catBadgeCls[exp.category])}>{exp.category}</span></td>
                  <td className={cx("colorMuted")}>{exp.project}</td>
                  <td><span className={cx("badge", statusTone(exp.status))}>{exp.status}</span></td>
                  <td className={cx("colorMuted", "text12")}>{exp.submittedAt ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

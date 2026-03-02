"use client";

import { useState } from "react";
import { cx } from "../style";

type ExpenseEntry = {
  id: string;
  description: string;
  amount: number;
  category: "Software" | "Travel" | "Equipment" | "Subscription" | "Hosting" | "Other";
  project: string;
  status: "Draft" | "Submitted" | "Approved" | "Rejected";
  submittedAt: string | null;
};

const expenses: ExpenseEntry[] = [
  { id: "EXP-001", description: "Figma Pro license renewal", amount: 1800, category: "Software", project: "Brand Identity System", status: "Approved", submittedAt: "Jan 10, 2026" },
  { id: "EXP-002", description: "Stock imagery pack – iStock", amount: 450, category: "Software", project: "Q1 Campaign Strategy", status: "Submitted", submittedAt: "Feb 5, 2026" },
  { id: "EXP-003", description: "Client meeting travel – Cape Town", amount: 3200, category: "Travel", project: "Website Redesign", status: "Approved", submittedAt: "Jan 22, 2026" },
  { id: "EXP-004", description: "Netlify hosting upgrade", amount: 680, category: "Hosting", project: "Editorial Design System", status: "Rejected", submittedAt: "Feb 1, 2026" },
  { id: "EXP-005", description: "Wacom tablet replacement", amount: 5200, category: "Equipment", project: "General", status: "Draft", submittedAt: null },
];

function statusTone(status: ExpenseEntry["status"]) {
  if (status === "Approved") return "badgeGreen";
  if (status === "Submitted") return "badgeAmber";
  if (status === "Rejected") return "badgeRed";
  return "badge";
}

export function ExpenseSubmitPage({ isActive }: { isActive: boolean }) {
  const [showForm, setShowForm] = useState(false);
  const [formDesc, setFormDesc] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState<ExpenseEntry["category"]>("Software");
  const [formProject, setFormProject] = useState("");

  const totalApproved = expenses.filter((e) => e.status === "Approved").reduce((s, e) => s + e.amount, 0);
  const totalPending = expenses.filter((e) => e.status === "Submitted").reduce((s, e) => s + e.amount, 0);

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-expense-submit">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("flexBetween", "mb20")}>
          <div>
            <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Finance</div>
            <h1 className={cx("pageTitleText")}>Expense Submission</h1>
          </div>
          <button type="button" className={cx("button", "buttonAccent")} onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "+ New Expense"}
          </button>
        </div>
      </div>

      <div className={cx("stats", "stats3", "mb28")}>
        {[
          { label: "Total Approved", value: `R${totalApproved.toLocaleString()}`, tone: "colorGreen" },
          { label: "Pending Review", value: `R${totalPending.toLocaleString()}`, tone: "colorAmber" },
          { label: "Submissions", value: String(expenses.length), tone: "colorAccent" },
        ].map((stat) => (
          <div key={stat.label} className={cx("card")}>
            <div className={cx("text10", "colorMuted2", "uppercase", "tracking", "mb6")}>{stat.label}</div>
            <div className={cx("fontDisplay", "fw800", "text20", stat.tone)}>{stat.value}</div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className={cx("card", "cardBody", "mb24")}>
          <div className={cx("sectionLabel", "mb16")}>New Expense</div>
          <div className={cx("fieldRow", "mb12")}>
            <div className={cx("inputGroup")}>
              <label className={cx("inputLabel")} htmlFor="exp-desc">Description</label>
              <input id="exp-desc" className={cx("input")} value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="What was this expense for?" />
            </div>
            <div className={cx("inputGroup")}>
              <label className={cx("inputLabel")} htmlFor="exp-amount">Amount (ZAR)</label>
              <input id="exp-amount" className={cx("input")} type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="0.00" />
            </div>
          </div>
          <div className={cx("fieldRow", "mb16")}>
            <div className={cx("inputGroup")}>
              <label className={cx("inputLabel")} htmlFor="exp-cat">Category</label>
              <select id="exp-cat" className={cx("select")} value={formCategory} onChange={(e) => setFormCategory(e.target.value as ExpenseEntry["category"])}>
                {["Software", "Travel", "Equipment", "Subscription", "Hosting", "Other"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className={cx("inputGroup")}>
              <label className={cx("inputLabel")} htmlFor="exp-proj">Project</label>
              <input id="exp-proj" className={cx("input")} value={formProject} onChange={(e) => setFormProject(e.target.value)} placeholder="Project name" />
            </div>
          </div>
          <div className={cx("flex", "gap8")}>
            <button type="button" className={cx("button", "buttonGhost")} onClick={() => setShowForm(false)}>Cancel</button>
            <button type="button" className={cx("button", "buttonAccent")} disabled={!formDesc || !formAmount}>Submit for Review</button>
          </div>
        </div>
      )}

      <div className={cx("card")}>
        <div className={cx("tableWrap")}>
          <table className={cx("table")}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Category</th>
                <th>Project</th>
                <th>Status</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => (
                <tr key={exp.id}>
                  <td className={cx("fontMono", "text12")}>{exp.id}</td>
                  <td className={cx("fw600")}>{exp.description}</td>
                  <td className={cx("fontMono", "fw600")}>R{exp.amount.toLocaleString()}</td>
                  <td><span className={cx("badge")}>{exp.category}</span></td>
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

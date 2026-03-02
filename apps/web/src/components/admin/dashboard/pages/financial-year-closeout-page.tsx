"use client";

import { useMemo, useState } from "react";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";
import { AdminTabs } from "./shared";

type CloseoutTask = {
  task: string;
  done: boolean;
  doneDate?: string | null;
  note?: string | null;
};

type CloseoutSection = {
  category: string;
  color: string;
  tasks: CloseoutTask[];
};

const fyChecklist: CloseoutSection[] = [
  {
    category: "Revenue & Invoicing",
    color: "var(--accent)",
    tasks: [
      { task: "All invoices issued for FY2025", done: true, doneDate: "Jan 15", note: null },
      { task: "Outstanding invoices chased and resolved", done: false, note: "INV-0039 (Kestrel) still outstanding" },
      { task: "Final retainer invoices reconciled", done: true, doneDate: "Jan 20", note: null },
      { task: "Credit notes issued where applicable", done: true, doneDate: "Jan 15", note: null },
      { task: "Revenue recognised correctly (accrual basis)", done: false, note: "Awaiting accountant sign-off" }
    ]
  },
  {
    category: "Expenses & Payroll",
    color: "var(--amber)",
    tasks: [
      { task: "All staff payroll processed for Feb", done: false, note: "Scheduled Feb 25", doneDate: null },
      { task: "All supplier invoices captured", done: true, doneDate: "Feb 10", note: null },
      { task: "All expense claims approved and captured", done: false, note: "2 pending claims", doneDate: null },
      { task: "Freelancer payments settled", done: true, doneDate: "Feb 18", note: null },
      { task: "Annual bonus payments captured", done: true, doneDate: "Jan 31", note: null }
    ]
  },
  {
    category: "Tax & SARS",
    color: "var(--red)",
    tasks: [
      { task: "PAYE submissions up to date (EMP201)", done: true, doneDate: "Feb 7", note: null },
      { task: "UIF contributions up to date", done: true, doneDate: "Feb 7", note: null },
      { task: "VAT returns submitted (VAT201)", done: true, doneDate: "Jan 25", note: null },
      { task: "Provisional tax (IRP6) submitted", done: false, note: "Due Aug 2026 - not yet", doneDate: null },
      { task: "PAYE reconciliation (EMP501) ready", done: false, note: "Due May 2026", doneDate: null }
    ]
  },
  {
    category: "Financial Statements",
    color: "var(--blue)",
    tasks: [
      { task: "Trial balance reviewed", done: false, note: "Scheduled with accountant Mar 10", doneDate: null },
      { task: "P&L statement prepared", done: false, note: null, doneDate: null },
      { task: "Balance sheet prepared", done: false, note: null, doneDate: null },
      { task: "Cash flow statement prepared", done: false, note: null, doneDate: null },
      { task: "Management accounts signed off", done: false, note: null, doneDate: null }
    ]
  },
  {
    category: "Year-End Admin",
    color: "var(--accent)",
    tasks: [
      { task: "All contracts filed and archived", done: true, doneDate: "Feb 1", note: null },
      { task: "Staff IRP5 certificates issued", done: false, note: "Due May 2026", doneDate: null },
      { task: "Asset register updated", done: true, doneDate: "Jan 28", note: null },
      { task: "Bank reconciliation completed", done: false, note: "In progress", doneDate: null },
      { task: "Accountant briefed for annual audit", done: false, note: null, doneDate: null }
    ]
  }
];

const fy2025Summary = {
  totalRevenue: 4260000,
  totalCosts: 2380000,
  grossProfit: 1880000,
  grossMargin: 44,
  staffCosts: 1540000,
  overheadCosts: 420000,
  freelancerCosts: 218000,
  toolsCosts: 202000,
  netProfit: 1340000,
  netMargin: 31,
  totalInvoiced: 4260000,
  totalCollected: 4187000,
  outstandingAtYearEnd: 73000,
  newClientsWon: 4,
  clientsLost: 1,
  mrrAtYearEnd: 380600,
  mrrAtYearStart: 244000,
  mrrGrowth: 56
} as const;

const tabs = ["fy checklist", "fy2025 summary", "p&l snapshot", "key learnings"] as const;
type Tab = (typeof tabs)[number];

export function FinancialYearCloseoutPage() {
  const [activeTab, setActiveTab] = useState<Tab>("fy checklist");

  const { doneTasks, totalTasks, pct, blocking } = useMemo(() => {
    const allTasks = fyChecklist.flatMap((c) => c.tasks);
    const done = allTasks.filter((t) => t.done).length;
    return {
      doneTasks: done,
      totalTasks: allTasks.length,
      pct: Math.round((done / allTasks.length) * 100),
      blocking: allTasks.filter((t) => !t.done && t.note).length
    };
  }, []);

  return (
    <div className={cx(styles.pageBody, styles.fyRoot)}>
      <div className={cx("flexBetween", "mb28")}>
        <div>
          <div className={cx("pageEyebrow")}>ADMIN / FINANCIAL</div>
          <h1 className={cx("pageTitle")}>Financial Year Closeout</h1>
          <div className={cx("pageSub")}>FY2025 closeout checklist, year-end summary, and SARS compliance</div>
        </div>
        <div className={cx("flexRow", "gap8")}>
          <button type="button" className={cx("btnSm", "btnGhost", "fontMono")}>Share with Accountant</button>
          <button type="button" className={cx("btnSm", "btnAccent", "fontMono")}>Export FY Pack</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "gap16", "mb16")}>
        {[
          { label: "Closeout Progress", value: `${pct}%`, color: pct >= 80 ? "var(--accent)" : "var(--amber)", sub: `${doneTasks}/${totalTasks} tasks done` },
          { label: "Blocking Items", value: blocking.toString(), color: blocking > 0 ? "var(--red)" : "var(--accent)", sub: "Notes or issues flagged" },
          { label: "FY End Date", value: "28 Feb 2026", color: "var(--blue)", sub: "South African FY" },
          { label: "Accountant Review", value: "10 Mar 2026", color: "var(--accent)", sub: "Scheduled" }
        ].map((s) => (
          <div key={s.label} className={cx("statCard")}>
            <div className={cx("statLabel")}>{s.label}</div>
            <div className={cx("statValue", styles.fyToneText, toneClass(s.color))}>{s.value}</div>
            <div className={cx("text11", "colorMuted")}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className={cx("card", "p20", "mb16")}>
        <div className={cx("flexBetween", "mb8")}>
          <span className={cx("fw700")}>FY2025 Closeout - Overall Progress</span>
          <span className={cx("fontMono", "fw800", styles.fyToneText, pct >= 80 ? "toneAccent" : "toneAmber")}>{pct}%</span>
        </div>
        <div className={cx("progressBar", styles.fyProgressLg)}>
          <progress className={cx("barFill", "uiProgress", styles.fyBarFillSmooth, pct >= 80 ? "toneAccent" : "toneAmber")} max={100} value={pct} />
        </div>
      </div>

      <AdminTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        primaryColor="var(--accent)"
        mutedColor="var(--muted)"
        panelColor="var(--surface)"
        borderColor="var(--border)"
      />

      <div className={cx("overflowAuto", "minH0")}>
        {activeTab === "fy checklist" ? (
          <div className={cx("grid2", "gap16")}>
            {fyChecklist.map((section) => {
              const done = section.tasks.filter((t) => t.done).length;
              const total = section.tasks.length;
              const sectionPct = Math.round((done / total) * 100);
              return (
                <div key={section.category} className={cx("card", "p24", styles.fySectionCard, toneClass(section.color))}>
                  <div className={cx("flexBetween", "mb16")}>
                    <div className={cx("fw700", "uppercase", "text12", styles.fyToneText, toneClass(section.color))}>{section.category}</div>
                    <span className={cx("fontMono", "text12", styles.fyToneText, sectionPct === 100 ? "toneAccent" : "toneAmber")}>{done}/{total}</span>
                  </div>
                  <div className={cx("progressBar", "mb16")}>
                    <progress className={cx("barFill", "uiProgress", sectionPct === 100 ? "toneAccent" : toneClass(section.color))} max={100} value={sectionPct} />
                  </div>
                  {section.tasks.map((task, i) => {
                    const taskTone = task.done ? "var(--muted)" : "var(--text)";
                    return (
                    <div key={i} className={cx("flexRow", "gap10", "mb10", styles.fyAlignStart)}>
                      <div
                        className={cx("flexCenter", "noShrink", styles.fyTaskBox, task.done && styles.fyTaskBoxDone)}
                      >
                        {task.done ? <span className={styles.fyTaskCheck}>&#10003;</span> : null}
                      </div>
                      <div className={styles.fyFlex1}>
                        <div className={cx("text12", styles.fyToneText, toneClass(taskTone), task.done && styles.fyLineThrough)}>{task.task}</div>
                        {task.doneDate ? <div className={cx("text10", "colorMuted", "mt4")}>Done {task.doneDate}</div> : null}
                        {task.note ? <div className={cx("text10", "mt4", styles.fyToneText, task.done ? "toneMuted" : "toneAmber")}>{task.note}</div> : null}
                      </div>
                    </div>
                  )})}
                </div>
              );
            })}
          </div>
        ) : null}

        {activeTab === "fy2025 summary" ? (
          <div className={cx("grid2", "gap20")}>
            <div className={cx("card", "p24")}>
              <div className={cx("text13", "fw700", "mb20", "uppercase")}>FY2025 Key Financials</div>
              {[
                { label: "Total Revenue", value: `R${(fy2025Summary.totalRevenue / 1000000).toFixed(2)}m`, color: "var(--accent)", big: true },
                { label: "Total Costs", value: `R${(fy2025Summary.totalCosts / 1000000).toFixed(2)}m`, color: "var(--red)", big: false },
                { label: "Gross Profit", value: `R${(fy2025Summary.grossProfit / 1000000).toFixed(2)}m`, color: "var(--accent)", big: false },
                { label: "Gross Margin", value: `${fy2025Summary.grossMargin}%`, color: "var(--accent)", big: false },
                { label: "Net Profit", value: `R${(fy2025Summary.netProfit / 1000000).toFixed(2)}m`, color: "var(--accent)", big: true },
                { label: "Net Margin", value: `${fy2025Summary.netMargin}%`, color: "var(--accent)", big: false }
              ].map((r) => (
                <div key={r.label} className={cx("flexBetween", "borderB", "py10")}>
                  <span className={cx("text12", "colorMuted")}>{r.label}</span>
                  <span className={cx("fontMono", styles.fyNumStat, r.big ? styles.fyNumBig : styles.fyNumMd, styles.fyToneText, toneClass(r.color))}>{r.value}</span>
                </div>
              ))}
            </div>

            <div className={cx("flexCol", "gap16")}>
              <div className={cx("card", "p24")}>
                <div className={cx("text13", "fw700", "mb16", "uppercase")}>Business Growth</div>
                {[
                  { label: "MRR at year-start", value: `R${(fy2025Summary.mrrAtYearStart / 1000).toFixed(0)}k`, color: "var(--muted)" },
                  { label: "MRR at year-end", value: `R${(fy2025Summary.mrrAtYearEnd / 1000).toFixed(0)}k`, color: "var(--accent)" },
                  { label: "MRR growth", value: `+${fy2025Summary.mrrGrowth}%`, color: "var(--accent)" },
                  { label: "New clients won", value: fy2025Summary.newClientsWon.toString(), color: "var(--blue)" },
                  { label: "Clients lost (churn)", value: fy2025Summary.clientsLost.toString(), color: "var(--red)" }
                ].map((r) => (
                  <div key={r.label} className={cx("flexBetween", "borderB", "text12", styles.fyRowPy8)}>
                    <span className={cx("colorMuted")}>{r.label}</span>
                    <span className={cx("fontMono", "fw700", styles.fyToneText, toneClass(r.color))}>{r.value}</span>
                  </div>
                ))}
              </div>
              <div className={cx("card", "p24", styles.fyProfitCard)}>
                <div className={cx("fontMono", "fw800", styles.fyProfitValue, "colorAccent")}>R{(fy2025Summary.netProfit / 1000000).toFixed(2)}m</div>
                <div className={cx("text12", "colorMuted", "mt4")}>Net profit &middot; FY2025 &middot; {fy2025Summary.netMargin}% margin</div>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "p&l snapshot" ? (
          <div className={cx("card", "p24", styles.fyPLCard)}>
            <div className={cx("text14", "fw700", "mb4", "colorAccent")}>MAPHARI CREATIVE STUDIO</div>
            <div className={cx("text12", "colorMuted", "mb24")}>Profit &amp; Loss - Financial Year March 2025 to February 2026</div>

            <div className={cx("mb20")}>
              <div className={cx("text11", "fw700", "colorMuted", "uppercase", "mb8")}>Revenue</div>
              {[
                { label: "Retainer revenue", value: 3142000 },
                { label: "Project revenue", value: 1118000 }
              ].map((r) => (
                <div key={r.label} className={cx("flexBetween", "text13", styles.fySubRow)}>
                  <span className={cx("colorMuted", styles.fyPl16)}>{r.label}</span>
                  <span className={cx("fontMono")}>R{r.value.toLocaleString()}</span>
                </div>
              ))}
              <div className={cx("flexBetween", "text14", "fw700", styles.fyRowPy10)}>
                <span>Total Revenue</span>
                <span className={cx("fontMono", "colorAccent")}>R{fy2025Summary.totalRevenue.toLocaleString()}</span>
              </div>
            </div>

            <div className={cx("mb20")}>
              <div className={cx("text11", "fw700", "colorMuted", "uppercase", "mb8")}>Cost of Sales</div>
              {[
                { label: "Staff salaries & PAYE", value: fy2025Summary.staffCosts },
                { label: "Freelancer costs", value: fy2025Summary.freelancerCosts },
                { label: "Tools & software", value: fy2025Summary.toolsCosts }
              ].map((r) => (
                <div key={r.label} className={cx("flexBetween", "text13", styles.fySubRow)}>
                  <span className={cx("colorMuted", styles.fyPl16)}>{r.label}</span>
                  <span className={cx("fontMono")}>({r.value.toLocaleString()})</span>
                </div>
              ))}
            </div>

            <div className={cx("flexBetween", "text14", "fw700", "mb20", styles.fyGrossRow)}>
              <span>Gross Profit</span>
              <span className={cx("fontMono", "colorAccent")}>
                R{fy2025Summary.grossProfit.toLocaleString()} ({fy2025Summary.grossMargin}%)
              </span>
            </div>

            <div className={cx("mb20")}>
              <div className={cx("text11", "fw700", "colorMuted", "uppercase", "mb8")}>Operating Expenses</div>
              <div className={cx("flexBetween", "text13", styles.fySubRow)}>
                <span className={cx("colorMuted", styles.fyPl16)}>Rent &amp; facilities</span>
                <span className={cx("fontMono")}>(264000)</span>
              </div>
              <div className={cx("flexBetween", "text13", styles.fySubRow)}>
                <span className={cx("colorMuted", styles.fyPl16)}>Marketing &amp; BD</span>
                <span className={cx("fontMono")}>(156000)</span>
              </div>
            </div>

            <div className={cx("flexBetween", "fw800", styles.fyNetRow)}>
              <span>Net Profit Before Tax</span>
              <span className={cx("fontMono", "colorAccent")}>
                R{fy2025Summary.netProfit.toLocaleString()} ({fy2025Summary.netMargin}%)
              </span>
            </div>
          </div>
        ) : null}

        {activeTab === "key learnings" ? (
          <div className={cx("flexCol", "gap16")}>
            {[
              { title: "Freelancer costs need tighter controls", detail: "Dune Collective ran 25% over budget due to uncontrolled freelancer scope. Add approval gates for any spend over R5k.", type: "cost", color: "var(--red)" },
              { title: "Invoice payment terms need enforcement", detail: "Three clients exceeded 30-day terms. Auto-escalate at 14 days. Late payments left R73k outstanding at year-end.", type: "cashflow", color: "var(--amber)" },
              { title: "MRR growth is healthy", detail: "MRR grew 56% from R244k to R381k. Retainer model drove predictability. Prioritise retainer conversion in BD.", type: "growth", color: "var(--accent)" },
              { title: "Staff cost ratio is trending up", detail: "Staff costs as % of revenue rose from 31% to 36%. Tie hiring to new client MRR instead of workload only.", type: "cost", color: "var(--amber)" },
              { title: "Tool sprawl increased spend", detail: "Eight tools were added in FY2025. Run a consolidation review before locking FY2026 budgets.", type: "efficiency", color: "var(--blue)" }
            ].map((l, i) => (
              <div key={i} className={cx("card", "fyLearningCard", styles.fyLearningItem, toneClass(l.color))}>
                <div className={styles.fyLearningBar} />
                <div>
                  <div className={cx("flexRow", "gap10", "mb8", styles.fyAlignCenter)}>
                    <span className={cx("text10", "fontMono", "uppercase", styles.fyLearningType)}>{l.type}</span>
                  </div>
                  <div className={cx("fw700", "mb8", styles.fyTitle15)}>{l.title}</div>
                  <div className={cx("text13", "colorMuted", styles.fyLine17)}>{l.detail}</div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

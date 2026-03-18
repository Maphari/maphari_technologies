// ════════════════════════════════════════════════════════════════════════════
// payroll-ledger-page.tsx — Admin Payroll Ledger
// Data : Payroll records are managed in the dedicated HR/payroll system.
//        This page shows SARS compliance deadlines and a cost summary.
//        Individual payslip data requires the payroll system integration.
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useState } from "react";
import { cx, styles } from "../style";
import { AdminTabs } from "./shared";
import { toneClass } from "./admin-page-utils";
import type { AuthSession } from "../../../../lib/auth/session";

const tabs = ["feb payroll", "payroll history", "compliance"] as const;
type Tab = (typeof tabs)[number];

// ── Component ─────────────────────────────────────────────────────────────────

export function PayrollLedgerPage({ session: _session }: { session: AuthSession | null }) {
  const [activeTab, setActiveTab] = useState<Tab>("feb payroll");

  return (
    <div className={cx(styles.pageBody, styles.payRoot)}>
      <div className={cx("flexBetween", "mb28")}>
        <div>
          <div className={cx("pageEyebrow")}>ADMIN / FINANCIAL</div>
          <h1 className={cx("pageTitle")}>Payroll Ledger</h1>
          <div className={cx("pageSub")}>Monthly payroll, payslips, PAYE, UIF, and SARS compliance</div>
        </div>
        <div className={cx("flexRow", "gap8")}>
          <button type="button" className={cx("btnSm", "btnGhost", "fontMono")}>Export EMP201</button>
          <button type="button" className={cx("btnSm", "btnAccent", "fontMono")}>Run Payroll</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "gap16", "mb16")}>
        {[
          { label: "Total Gross Payroll", value: "—",  color: "var(--amber)", sub: "Payroll system required" },
          { label: "Total Net Pay",       value: "—",  color: "var(--accent)", sub: "After deductions" },
          { label: "PAYE to SARS",        value: "—",  color: "var(--red)",    sub: "Due 7 Mar" },
          { label: "UIF Contributions",   value: "—",  color: "var(--blue)",   sub: "Employee + employer" },
        ].map((s) => (
          <div key={s.label} className={cx("statCard")}>
            <div className={cx("statLabel")}>{s.label}</div>
            <div className={cx("statValue", styles.payToneText, toneClass(s.color))}>{s.value}</div>
            <div className={cx("text11", "colorMuted")}>{s.sub}</div>
          </div>
        ))}
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
        {activeTab === "feb payroll" ? (
          <div className={cx("emptyState")}>
            <div className={cx("emptyStateTitle")}>Payroll data not available</div>
            <p className={cx("emptyStateSub")}>
              Individual payroll records, gross salaries, PAYE rates, and bank details are
              managed in the dedicated HR and payroll system. Connect the payroll integration
              to view this data in the dashboard.
            </p>
          </div>
        ) : null}

        {activeTab === "payroll history" ? (
          <div className={cx("emptyState")}>
            <div className={cx("emptyStateTitle")}>Payroll history not available</div>
            <p className={cx("emptyStateSub")}>
              Historical payroll records will appear here once the payroll system integration
              is active. Contact your Maphari account manager to enable this integration.
            </p>
          </div>
        ) : null}

        {activeTab === "compliance" ? (
          <div className={cx("grid2", "gap20")}>
            <div className={cx("card", "p24")}>
              <div className={cx("text13", "fw700", "mb20", "uppercase")}>SARS Submission Deadlines</div>
              {[
                { task: "EMP201 — PAYE monthly return",         due: "7 Mar 2026",  status: "upcoming" },
                { task: "UIF monthly contribution",             due: "7 Mar 2026",  status: "upcoming" },
                { task: "IRP5 certificates (EMP501)",           due: "31 May 2026", status: "future"   },
                { task: "EMP501 half-year reconciliation",      due: "31 Oct 2026", status: "future"   },
              ].map((d) => (
                <div key={d.task} className={cx("flexBetween", "borderB", styles.payRuleRow)}>
                  <div>
                    <div className={cx("text13", "fw600")}>{d.task}</div>
                    <div className={cx("text11", styles.payToneText, d.status === "upcoming" ? "toneAmber" : "toneMuted")}>{d.due}</div>
                  </div>
                  <span className={cx("text10", styles.payToneText, d.status === "upcoming" ? "toneAmber" : "toneMuted")}>{d.status}</span>
                </div>
              ))}
            </div>
            <div className={cx("card", "p24")}>
              <div className={cx("text13", "fw700", "mb20", "uppercase")}>South African Labour Obligations</div>
              {[
                { label: "Annual leave entitlement",       value: "21 consecutive days"     },
                { label: "Sick leave cycle",               value: "30 days per 3 years"     },
                { label: "Family responsibility leave",    value: "3 days per year"         },
                { label: "UIF employee contribution",      value: "1% of gross"             },
                { label: "UIF employer contribution",      value: "1% of gross"             },
                { label: "SDL (Skills Development Levy)",  value: "1% of gross payroll"     },
              ].map((r) => (
                <div key={r.label} className={cx("flexBetween", "borderB", "text13", styles.payPy10)}>
                  <span className={cx("colorMuted")}>{r.label}</span>
                  <span className={cx("fontMono", "fw700")}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

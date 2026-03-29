// ════════════════════════════════════════════════════════════════════════════
// payroll-ledger-page.tsx — Admin Payroll Ledger
// Data : Payroll records are managed in the dedicated HR/payroll system.
//        This page shows SARS compliance deadlines and a cost summary.
//        Individual payslip data requires the payroll system integration.
//
// Task 9: "Pending Timesheets" tab — approve/reject submitted staff entries.
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useState, useEffect, useCallback } from "react";
import { cx, styles } from "../style";
import { AdminTabs } from "./shared";
import { toneClass } from "./admin-page-utils";
import type { AuthSession } from "../../../../lib/auth/session";
import {
  loadPendingTimesheetsWithRefresh,
  approveTimesheetEntryWithRefresh,
  rejectTimesheetEntryWithRefresh,
  type AdminPendingTimeEntry,
} from "../../../../lib/api/admin/hr";

const tabs = ["pending timesheets", "feb payroll", "payroll history", "compliance"] as const;
type Tab = (typeof tabs)[number];

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PayrollLedgerPage({ session }: { session: AuthSession | null }) {
  const [activeTab, setActiveTab] = useState<Tab>("pending timesheets");

  // ── Pending timesheets state ──
  const [pendingEntries, setPendingEntries] = useState<AdminPendingTimeEntry[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [pendingError, setPendingError] = useState<string | null>(null);
  const [lastActionMsg, setLastActionMsg] = useState<string | null>(null);

  const loadPending = useCallback(async () => {
    if (!session) return;
    setLoadingPending(true);
    setPendingError(null);
    const result = await loadPendingTimesheetsWithRefresh(session);
    setLoadingPending(false);
    if (result.error) { setPendingError(result.error.message ?? "Unable to load pending timesheets."); return; }
    setPendingEntries(result.data ?? []);
  }, [session]);

  useEffect(() => {
    if (activeTab === "pending timesheets") void loadPending();
  }, [activeTab, loadPending]);

  const handleApprove = async (id: string) => {
    if (!session || actioningId) return;
    setActioningId(id);
    const result = await approveTimesheetEntryWithRefresh(session, id);
    setActioningId(null);
    if (result.error) { setPendingError(result.error.message ?? "Approve failed."); return; }
    setPendingEntries((prev) => prev.filter((e) => e.id !== id));
    setLastActionMsg("Entry approved.");
  };

  const handleReject = async (id: string) => {
    if (!session || actioningId) return;
    setActioningId(id);
    const result = await rejectTimesheetEntryWithRefresh(session, id);
    setActioningId(null);
    if (result.error) { setPendingError(result.error.message ?? "Reject failed."); return; }
    setPendingEntries((prev) => prev.filter((e) => e.id !== id));
    setLastActionMsg("Entry rejected.");
  };

  return (
    <div className={cx(styles.pageBody, styles.payRoot)}>
      <div className={cx("flexBetween", "mb28")}>
        <div>
          <div className={cx("pageEyebrow")}>FINANCE / PAYROLL LEDGER</div>
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
          { label: "Pending Timesheets",  value: String(pendingEntries.length), color: pendingEntries.length > 0 ? "var(--amber)" : "var(--accent)", sub: "Awaiting approval" },
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

        {/* ── Pending Timesheets ── */}
        {activeTab === "pending timesheets" ? (
          <div>
            {lastActionMsg && (
              <div className={cx("text12", "colorMuted", "mb12")}>{lastActionMsg}</div>
            )}
            {pendingError && (
              <div className={cx("text12", "mb12")} style={{ color: "var(--red)" }}>{pendingError}</div>
            )}
            {loadingPending ? (
              <div className={cx("emptyState")}>
                <div className={cx("emptyStateTitle")}>Loading…</div>
              </div>
            ) : pendingEntries.length === 0 ? (
              <div className={cx("emptyState")}>
                <div className={cx("emptyStateTitle")}>No pending timesheets</div>
                <p className={cx("emptyStateSub")}>
                  Timesheet entries submitted by staff for approval will appear here.
                  Staff can submit their week from the Time Log page in the staff dashboard.
                </p>
              </div>
            ) : (
              <div className={cx("card")}>
                <div className={cx("cardHeader")}>
                  <span className={cx("cardHeaderTitle")}>Pending Timesheet Approvals</span>
                  <span className={cx("text12", "colorMuted")}>{pendingEntries.length} entr{pendingEntries.length !== 1 ? "ies" : "y"} awaiting review</span>
                </div>
                <div className={cx("cardBody", "pt0")}>
                  {pendingEntries.map((entry) => (
                    <div key={entry.id} className={cx("flexBetween", "borderB", styles.payRuleRow)}>
                      <div>
                        <div className={cx("text13", "fw600")}>{entry.taskLabel}</div>
                        <div className={cx("text11", "colorMuted")}>
                          {entry.staffName ?? entry.staffUserId ?? "Unknown staff"}
                          {entry.submittedWeek ? ` · ${entry.submittedWeek}` : ""}
                          {" · "}{formatMinutes(entry.minutes)}
                        </div>
                        {entry.submittedAt && (
                          <div className={cx("text10", "colorMuted")}>
                            Submitted {new Date(entry.submittedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <div className={cx("flexRow", "gap8")}>
                        <button
                          type="button"
                          className={cx("btnSm", "btnAccent", "fontMono")}
                          onClick={() => void handleApprove(entry.id)}
                          disabled={actioningId === entry.id}
                        >
                          {actioningId === entry.id ? "…" : "Approve"}
                        </button>
                        <button
                          type="button"
                          className={cx("btnSm", "btnGhost", "fontMono")}
                          onClick={() => void handleReject(entry.id)}
                          disabled={actioningId === entry.id}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

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

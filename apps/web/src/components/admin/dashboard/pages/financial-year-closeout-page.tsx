// ════════════════════════════════════════════════════════════════════════════
// financial-year-closeout-page.tsx — Admin Financial Year Closeout page
// Data sources: loadAdminSnapshotWithRefresh (invoices + payments)
//               loadTimeEntriesWithRefresh (hours logged)
// SA Financial Year: April 1 – March 31
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AuthSession } from "../../../../lib/auth/session";
import { saveSession } from "../../../../lib/auth/session";
import {
  loadAdminSnapshotWithRefresh,
  loadTimeEntriesWithRefresh,
} from "../../../../lib/api/admin";
import type { AdminInvoice, AdminPayment, ProjectTimeEntry } from "../../../../lib/api/admin";
import { cx, styles } from "../style";
import { toneClass } from "./admin-page-utils";
import { AdminTabs } from "./shared";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "fy summary" | "key metrics" | "fy checklist";
const tabs = ["fy summary", "key metrics", "fy checklist"] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getFyBounds(now: Date): { start: Date; end: Date; label: string } {
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  // SA FY starts April (month 3) — if we're before April, FY started last year
  const fyStartYear = month >= 3 ? year : year - 1;
  const start = new Date(fyStartYear, 3, 1);       // April 1
  const end = new Date(fyStartYear + 1, 2, 31, 23, 59, 59); // March 31 EOD
  const label = `FY${String(fyStartYear).slice(2)}/${String(fyStartYear + 1).slice(2)}`;
  return { start, end, label };
}

function inFy(isoDate: string | null, start: Date, end: Date): boolean {
  if (!isoDate) return false;
  const d = new Date(isoDate);
  return d >= start && d <= end;
}

function centsTozar(cents: number): string {
  if (cents >= 1_000_000) return `R${(cents / 100_000_000).toFixed(2)}m`;
  if (cents >= 1_000) return `R${(cents / 100_000).toFixed(1)}k`;
  return `R${(cents / 100).toFixed(0)}`;
}

function minutesToHours(minutes: number): string {
  const h = Math.round(minutes / 60);
  return `${h.toLocaleString()}h`;
}

// ── Checklist (structural, not mock data) ────────────────────────────────────

const fyChecklist = [
  {
    category: "Revenue & Invoicing",
    color: "var(--accent)",
    tasks: [
      { task: "All invoices issued for FY", done: false, note: "Verify from Invoices page" },
      { task: "Outstanding invoices chased", done: false, note: "Check overdue status" },
      { task: "Final retainer invoices reconciled", done: false, note: null },
      { task: "Credit notes issued where applicable", done: false, note: null },
    ]
  },
  {
    category: "Tax & SARS",
    color: "var(--red)",
    tasks: [
      { task: "PAYE submissions up to date (EMP201)", done: false, note: null },
      { task: "UIF contributions up to date", done: false, note: null },
      { task: "VAT returns submitted (VAT201)", done: false, note: null },
      { task: "Provisional tax (IRP6) submitted", done: false, note: "Confirm with accountant" },
    ]
  },
  {
    category: "Year-End Admin",
    color: "var(--blue)",
    tasks: [
      { task: "Bank reconciliation completed", done: false, note: null },
      { task: "All contracts filed and archived", done: false, note: null },
      { task: "Asset register updated", done: false, note: null },
      { task: "Accountant briefed for annual audit", done: false, note: null },
    ]
  },
] as const;

// ── Main component ────────────────────────────────────────────────────────────

export function FinancialYearCloseoutPage({
  session,
  onNotify,
}: {
  session: AuthSession | null;
  onNotify: (tone: "success" | "error" | "info" | "warning", message: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("fy summary");
  const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [timeEntries, setTimeEntries] = useState<ProjectTimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session) { setLoading(false); return; }
    setLoading(true);

    const [snapshotResult, timeResult] = await Promise.all([
      loadAdminSnapshotWithRefresh(session),
      loadTimeEntriesWithRefresh(session),
    ]);

    // Use the most refreshed session
    if (snapshotResult.nextSession) saveSession(snapshotResult.nextSession);
    if (timeResult.nextSession) saveSession(timeResult.nextSession);

    if (snapshotResult.error) onNotify("error", snapshotResult.error.message);
    if (timeResult.error) onNotify("warning", timeResult.error.message);

    if (snapshotResult.data) {
      setInvoices(snapshotResult.data.invoices);
      setPayments(snapshotResult.data.payments);
    }
    if (timeResult.data) {
      setTimeEntries(timeResult.data);
    }

    setLoading(false);
  }, [session, onNotify]);

  useEffect(() => { void load(); }, [load]);

  const fy = useMemo(() => getFyBounds(new Date()), []);

  const fyInvoices = useMemo(
    () => invoices.filter((i) => inFy(i.issuedAt, fy.start, fy.end)),
    [invoices, fy]
  );

  const fyPayments = useMemo(
    () => payments.filter((p) => inFy(p.paidAt, fy.start, fy.end)),
    [payments, fy]
  );

  const fyTimeEntries = useMemo(
    () => timeEntries.filter((t) => inFy(t.createdAt, fy.start, fy.end)),
    [timeEntries, fy]
  );

  const totalInvoiced = fyInvoices.reduce((s, i) => s + i.amountCents, 0);
  const totalCollected = fyPayments
    .filter((p) => p.status === "COMPLETED")
    .reduce((s, p) => s + p.amountCents, 0);
  const totalOutstanding = fyInvoices
    .filter((i) => i.status === "ISSUED" || i.status === "OVERDUE")
    .reduce((s, i) => s + i.amountCents, 0);
  const totalMinutes = fyTimeEntries.reduce((s, t) => s + t.minutes, 0);
  const overdueCount = fyInvoices.filter((i) => i.status === "OVERDUE").length;
  const collectionRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;

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

  return (
    <div className={cx(styles.pageBody, styles.fyRoot)}>
      <div className={cx("flexBetween", "mb28")}>
        <div>
          <div className={cx("pageEyebrow")}>ADMIN / FINANCIAL</div>
          <h1 className={cx("pageTitle")}>Financial Year Closeout</h1>
          <div className={cx("pageSub")}>{fy.label} — SA Financial Year (April – March)</div>
        </div>
        <div className={cx("flexRow", "gap8")}>
          <button type="button" className={cx("btnSm", "btnGhost", "fontMono")}>Share with Accountant</button>
          <button type="button" className={cx("btnSm", "btnAccent", "fontMono")}>Export FY Pack</button>
        </div>
      </div>

      <div className={cx("topCardsStack", "gap16", "mb16")}>
        {[
          { label: "Total Invoiced", value: centsTozar(totalInvoiced), color: "var(--accent)", sub: `${fyInvoices.length} invoices in ${fy.label}` },
          { label: "Collected", value: centsTozar(totalCollected), color: totalCollected > 0 ? "var(--accent)" : "var(--muted)", sub: `${collectionRate}% collection rate` },
          { label: "Outstanding", value: centsTozar(totalOutstanding), color: totalOutstanding > 0 ? overdueCount > 0 ? "var(--red)" : "var(--amber)" : "var(--accent)", sub: overdueCount > 0 ? `${overdueCount} overdue` : "All current" },
          { label: "Hours Logged", value: minutesToHours(totalMinutes), color: "var(--blue)", sub: `${fyTimeEntries.length} time entries` },
        ].map((s) => (
          <div key={s.label} className={cx("statCard")}>
            <div className={cx("statLabel")}>{s.label}</div>
            <div className={cx("statValue", styles.fyToneText, toneClass(s.color))}>{s.value}</div>
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
        {activeTab === "fy summary" && (
          <div className={cx("grid2", "gap20")}>
            <div className={cx("card", "p24")}>
              <div className={cx("text13", "fw700", "mb20", "uppercase")}>{fy.label} Revenue Summary</div>
              {[
                { label: "Total Invoiced", value: centsTozar(totalInvoiced), color: "var(--accent)", big: true },
                { label: "Total Collected", value: centsTozar(totalCollected), color: "var(--accent)", big: false },
                { label: "Outstanding", value: centsTozar(totalOutstanding), color: totalOutstanding > 0 ? "var(--amber)" : "var(--accent)", big: false },
                { label: "Collection Rate", value: `${collectionRate}%`, color: collectionRate >= 90 ? "var(--accent)" : "var(--amber)", big: false },
                { label: "Total Invoices", value: fyInvoices.length.toString(), color: "var(--blue)", big: false },
                { label: "Overdue Invoices", value: overdueCount.toString(), color: overdueCount > 0 ? "var(--red)" : "var(--accent)", big: false },
              ].map((r) => (
                <div key={r.label} className={cx("flexBetween", "borderB", "py10")}>
                  <span className={cx("text12", "colorMuted")}>{r.label}</span>
                  <span className={cx("fontMono", styles.fyNumStat, r.big ? styles.fyNumBig : styles.fyNumMd, styles.fyToneText, toneClass(r.color))}>
                    {r.value}
                  </span>
                </div>
              ))}
            </div>

            <div className={cx("flexCol", "gap16")}>
              <div className={cx("card", "p24")}>
                <div className={cx("text13", "fw700", "mb16", "uppercase")}>Time & Operations</div>
                {[
                  { label: "Total hours logged", value: minutesToHours(totalMinutes), color: "var(--blue)" },
                  { label: "Time entries recorded", value: fyTimeEntries.length.toString(), color: "var(--blue)" },
                  { label: "Payments received", value: fyPayments.filter((p) => p.status === "COMPLETED").length.toString(), color: "var(--accent)" },
                  { label: "FY Period", value: `${fy.start.toLocaleDateString("en-ZA", { day: "2-digit", month: "short" })} – ${fy.end.toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" })}`, color: "var(--muted)" },
                ].map((r) => (
                  <div key={r.label} className={cx("flexBetween", "borderB", "text12", styles.fyRowPy8)}>
                    <span className={cx("colorMuted")}>{r.label}</span>
                    <span className={cx("fontMono", "fw700", styles.fyToneText, toneClass(r.color))}>{r.value}</span>
                  </div>
                ))}
              </div>
              <div className={cx("card", "p24", styles.fyProfitCard)}>
                <div className={cx("fontMono", "fw800", styles.fyProfitValue, "colorAccent")}>{centsTozar(totalCollected)}</div>
                <div className={cx("text12", "colorMuted", "mt4")}>Collected · {fy.label} · {collectionRate}% rate</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "key metrics" && (
          <div className={cx("card", "p24", styles.fyPLCard)}>
            <div className={cx("text14", "fw700", "mb4", "colorAccent")}>MAPHARI CREATIVE STUDIO</div>
            <div className={cx("text12", "colorMuted", "mb24")}>
              Revenue Summary — {fy.label} ({fy.start.toLocaleDateString("en-ZA", { month: "long", year: "numeric" })} to {fy.end.toLocaleDateString("en-ZA", { month: "long", year: "numeric" })})
            </div>

            <div className={cx("mb20")}>
              <div className={cx("text11", "fw700", "colorMuted", "uppercase", "mb8")}>Invoiced Revenue</div>
              {fyInvoices.slice(0, 5).map((inv) => (
                <div key={inv.id} className={cx("flexBetween", "text13", styles.fySubRow)}>
                  <span className={cx("colorMuted", styles.fyPl16)}>{inv.number}</span>
                  <span className={cx("fontMono")}>{centsTozar(inv.amountCents)}</span>
                </div>
              ))}
              {fyInvoices.length > 5 && (
                <div className={cx("text12", "colorMuted", styles.fyPl16)}>
                  …and {fyInvoices.length - 5} more invoices
                </div>
              )}
              <div className={cx("flexBetween", "text14", "fw700", styles.fyRowPy10)}>
                <span>Total Invoiced</span>
                <span className={cx("fontMono", "colorAccent")}>{centsTozar(totalInvoiced)}</span>
              </div>
            </div>

            <div className={cx("flexBetween", "fw800", styles.fyNetRow)}>
              <span>Total Collected</span>
              <span className={cx("fontMono", "colorAccent")}>{centsTozar(totalCollected)}</span>
            </div>
            <div className={cx("flexBetween", "text13", "mt8", styles.fyRowPy8)}>
              <span className={cx("colorMuted")}>Outstanding</span>
              <span className={cx("fontMono", totalOutstanding > 0 ? "colorAmber" : "colorAccent")}>{centsTozar(totalOutstanding)}</span>
            </div>
          </div>
        )}

        {activeTab === "fy checklist" && (
          <div className={cx("grid2", "gap16")}>
            {fyChecklist.map((section) => {
              const taskList = [...section.tasks];
              const done = taskList.filter((t) => t.done).length;
              const total = taskList.length;
              const sectionPct = Math.round((done / total) * 100);
              return (
                <div key={section.category} className={cx("card", "p24", styles.fySectionCard, toneClass(section.color))}>
                  <div className={cx("flexBetween", "mb16")}>
                    <div className={cx("fw700", "uppercase", "text12", styles.fyToneText, toneClass(section.color))}>
                      {section.category}
                    </div>
                    <span className={cx("fontMono", "text12", styles.fyToneText, sectionPct === 100 ? "toneAccent" : "toneAmber")}>
                      {done}/{total}
                    </span>
                  </div>
                  <div className={cx("progressBar", "mb16")}>
                    <progress
                      className={cx("barFill", "uiProgress", sectionPct === 100 ? "toneAccent" : toneClass(section.color))}
                      max={100}
                      value={sectionPct}
                    />
                  </div>
                  {taskList.map((task, i) => (
                    <div key={i} className={cx("flexRow", "gap10", "mb10", styles.fyAlignStart)}>
                      <div className={cx("flexCenter", "noShrink", styles.fyTaskBox, task.done && styles.fyTaskBoxDone)}>
                        {task.done ? <span className={styles.fyTaskCheck}>&#10003;</span> : null}
                      </div>
                      <div className={styles.fyFlex1}>
                        <div className={cx("text12", task.done && styles.fyLineThrough)}>{task.task}</div>
                        {task.note && <div className={cx("text10", "mt4", "colorMuted")}>{task.note}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

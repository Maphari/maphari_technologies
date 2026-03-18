// ════════════════════════════════════════════════════════════════════════════
// pay-stub-page.tsx — Staff Pay Stubs
// Data     : loadMyPayslipsWithRefresh → GET /payslips/me
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useMemo, useState } from "react";
import { cx } from "../style";
import type { AuthSession } from "../../../../lib/auth/session";
import { loadMyPayslipsWithRefresh, type StaffPayslipRecord } from "../../../../lib/api/staff";
import { saveSession } from "../../../../lib/auth/session";

function fmt(n: number) {
  return `R${n.toLocaleString()}`;
}

function fmtPaidAt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

export function PayStubPage({ isActive, session }: { isActive: boolean; session: AuthSession | null }) {
  const [apiPayslips, setApiPayslips] = useState<StaffPayslipRecord[]>([]);

  useEffect(() => {
    if (!session) return;
    loadMyPayslipsWithRefresh(session).then((r) => {
      if (r.nextSession) saveSession(r.nextSession);
      if (!r.error && r.data) setApiPayslips(r.data);
    });
  }, [session]);

  const payStubs = useMemo(() =>
    apiPayslips.map((p) => ({
      period:     p.period,
      grossPay:   Math.round(p.grossPayCents / 100),
      deductions: Math.round(p.totalDeductionsCents / 100),
      netPay:     Math.round(p.netPayCents / 100),
      tax:        Math.round(p.taxCents / 100),
      uif:        Math.round(p.uifCents / 100),
      medical:    Math.round(p.medicalCents / 100),
      paidAt:     fmtPaidAt(p.paidAt),
      status:     p.status,
    })),
  [apiPayslips]);

  const ytdGross = payStubs.reduce((s, p) => s + p.grossPay,  0);
  const ytdNet   = payStubs.reduce((s, p) => s + p.netPay,    0);
  const ytdTax   = payStubs.reduce((s, p) => s + p.tax,       0);
  const avgNet   = payStubs.length > 0 ? Math.round(ytdNet / payStubs.length) : 0;

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-pay-stubs">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Personal Finance</div>
        <h1 className={cx("pageTitleText")}>Pay Stubs</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Your personal payroll records (read-only)</p>
      </div>

      {/* ── YTD summary ──────────────────────────────────────────────────── */}
      <div className={cx("psStatGrid")}>

        {/* YTD Gross */}
        <div className={cx("psStatCard")}>
          <div className={cx("psStatCardTop")}>
            <div className={cx("psStatLabel")}>YTD Gross</div>
            <div className={cx("psStatValue", "colorAccent")}>{fmt(ytdGross)}</div>
          </div>
          <div className={cx("psStatCardDivider")} />
          <div className={cx("psStatCardBottom")}>
            <span className={cx("psStatDot", "dotBgAccent")} />
            <span className={cx("psStatMeta")}>{payStubs.length} pay periods</span>
          </div>
        </div>

        {/* YTD Net */}
        <div className={cx("psStatCard")}>
          <div className={cx("psStatCardTop")}>
            <div className={cx("psStatLabel")}>YTD Net</div>
            <div className={cx("psStatValue", "colorGreen")}>{fmt(ytdNet)}</div>
          </div>
          <div className={cx("psStatCardDivider")} />
          <div className={cx("psStatCardBottom")}>
            <span className={cx("psStatDot", "dotBgGreen")} />
            <span className={cx("psStatMeta")}>take-home total</span>
          </div>
        </div>

        {/* YTD Tax */}
        <div className={cx("psStatCard")}>
          <div className={cx("psStatCardTop")}>
            <div className={cx("psStatLabel")}>YTD Tax (PAYE)</div>
            <div className={cx("psStatValue", "colorAmber")}>{fmt(ytdTax)}</div>
          </div>
          <div className={cx("psStatCardDivider")} />
          <div className={cx("psStatCardBottom")}>
            <span className={cx("psStatDot", "dotBgAmber")} />
            <span className={cx("psStatMeta")}>deducted to date</span>
          </div>
        </div>

        {/* Avg Net */}
        <div className={cx("psStatCard")}>
          <div className={cx("psStatCardTop")}>
            <div className={cx("psStatLabel")}>Avg Net Pay</div>
            <div className={cx("psStatValue")}>{fmt(avgNet)}</div>
          </div>
          <div className={cx("psStatCardDivider")} />
          <div className={cx("psStatCardBottom")}>
            <span className={cx("psStatDot", "dotBgMuted2")} />
            <span className={cx("psStatMeta")}>per month</span>
          </div>
        </div>

      </div>

      {/* ── Pay stub cards ───────────────────────────────────────────────── */}
      <div className={cx("psSection")}>
        <div className={cx("psSectionHeader")}>
          <div className={cx("psSectionTitle")}>Pay Slip History</div>
          <span className={cx("psSectionMeta")}>{payStubs.length} RECORDS</span>
        </div>

        {payStubs.length === 0 ? (
          <div className={cx("colorMuted2", "py24_0", "textCenter", "fs13")} >No payslips found.</div>
        ) : null}

        <div className={cx("psGrid")}>
          {payStubs.map((stub) => (
            <div key={stub.period} className={cx("psCard")}>

              {/* ── Period header ── */}
              <div className={cx("psCardHead")}>
                <div className={cx("psPeriod")}>{stub.period}</div>
                <div className={cx("psHeadRight")}>
                  <span className={cx("psPaidBadge")}>{stub.status}</span>
                  <span className={cx("psPaidDate")}>{stub.paidAt}</span>
                </div>
              </div>

              {/* ── Gross pay ── */}
              <div className={cx("psGrossSection")}>
                <div className={cx("psGrossLabel")}>Gross Pay</div>
                <div className={cx("psGrossAmount")}>{fmt(stub.grossPay)}</div>
              </div>

              {/* ── Deductions strip ── */}
              <div className={cx("psDeductions")}>
                <div className={cx("psDeductionItem")}>
                  <div className={cx("psDeductionLabel")}>Tax (PAYE)</div>
                  <div className={cx("psDeductionValue", "colorAmber")}>{fmt(stub.tax)}</div>
                </div>
                <div className={cx("psDeductionItem")}>
                  <div className={cx("psDeductionLabel")}>UIF</div>
                  <div className={cx("psDeductionValue", "colorMuted")}>{fmt(stub.uif)}</div>
                </div>
                <div className={cx("psDeductionItem")}>
                  <div className={cx("psDeductionLabel")}>Medical</div>
                  <div className={cx("psDeductionValue", "colorMuted")}>{fmt(stub.medical)}</div>
                </div>
                <div className={cx("psDeductionItem")}>
                  <div className={cx("psDeductionLabel")}>Total Ded.</div>
                  <div className={cx("psDeductionValue", "colorRed")}>{fmt(stub.deductions)}</div>
                </div>
              </div>

              {/* ── Take home ── */}
              <div className={cx("psNetSection")}>
                <span className={cx("psNetLabel")}>Take Home</span>
                <span className={cx("psNetAmount")}>{fmt(stub.netPay)}</span>
              </div>

            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

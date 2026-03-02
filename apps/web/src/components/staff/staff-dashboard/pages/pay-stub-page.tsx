"use client";

import { cx } from "../style";

const payStubs = [
  { period: "February 2026", grossPay: 65000, deductions: 18200, netPay: 46800, tax: 14300, uif: 650, medical: 3250, paidAt: "Feb 25, 2026", status: "Paid" },
  { period: "January 2026", grossPay: 65000, deductions: 18200, netPay: 46800, tax: 14300, uif: 650, medical: 3250, paidAt: "Jan 25, 2026", status: "Paid" },
  { period: "December 2025", grossPay: 65000, deductions: 18200, netPay: 46800, tax: 14300, uif: 650, medical: 3250, paidAt: "Dec 25, 2025", status: "Paid" },
  { period: "November 2025", grossPay: 65000, deductions: 18200, netPay: 46800, tax: 14300, uif: 650, medical: 3250, paidAt: "Nov 25, 2025", status: "Paid" },
  { period: "October 2025", grossPay: 62000, deductions: 17360, netPay: 44640, tax: 13640, uif: 620, medical: 3100, paidAt: "Oct 25, 2025", status: "Paid" },
  { period: "September 2025", grossPay: 62000, deductions: 17360, netPay: 44640, tax: 13640, uif: 620, medical: 3100, paidAt: "Sep 25, 2025", status: "Paid" },
];

export function PayStubPage({ isActive }: { isActive: boolean }) {
  const ytdGross = payStubs.reduce((s, p) => s + p.grossPay, 0);
  const ytdNet = payStubs.reduce((s, p) => s + p.netPay, 0);
  const ytdTax = payStubs.reduce((s, p) => s + p.tax, 0);

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-pay-stubs">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Personal Finance</div>
        <h1 className={cx("pageTitleText")}>Pay Stubs</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Your personal payroll records (read-only)</p>
      </div>

      <div className={cx("stats", "stats3", "mb28")}>
        {[
          { label: "YTD Gross", value: `R${ytdGross.toLocaleString()}`, tone: "colorAccent" },
          { label: "YTD Net", value: `R${ytdNet.toLocaleString()}`, tone: "colorGreen" },
          { label: "YTD Tax", value: `R${ytdTax.toLocaleString()}`, tone: "colorAmber" },
        ].map((stat) => (
          <div key={stat.label} className={cx("card")}>
            <div className={cx("text10", "colorMuted2", "uppercase", "tracking", "mb6")}>{stat.label}</div>
            <div className={cx("fontDisplay", "fw800", "text20", stat.tone)}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className={cx("card")}>
        <div className={cx("tableWrap")}>
          <table className={cx("table")}>
            <thead>
              <tr>
                <th>Pay Period</th>
                <th>Gross Pay</th>
                <th>Tax</th>
                <th>UIF</th>
                <th>Medical</th>
                <th>Total Deductions</th>
                <th>Net Pay</th>
                <th>Paid</th>
              </tr>
            </thead>
            <tbody>
              {payStubs.map((stub) => (
                <tr key={stub.period}>
                  <td className={cx("fw600")}>{stub.period}</td>
                  <td className={cx("fontMono")}>R{stub.grossPay.toLocaleString()}</td>
                  <td className={cx("fontMono", "colorAmber")}>R{stub.tax.toLocaleString()}</td>
                  <td className={cx("fontMono", "colorMuted")}>R{stub.uif.toLocaleString()}</td>
                  <td className={cx("fontMono", "colorMuted")}>R{stub.medical.toLocaleString()}</td>
                  <td className={cx("fontMono", "colorRed")}>R{stub.deductions.toLocaleString()}</td>
                  <td className={cx("fontMono", "fw700", "colorGreen")}>R{stub.netPay.toLocaleString()}</td>
                  <td className={cx("text12", "colorMuted")}>{stub.paidAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

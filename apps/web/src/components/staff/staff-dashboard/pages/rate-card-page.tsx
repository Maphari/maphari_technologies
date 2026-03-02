"use client";

import { cx } from "../style";

const rates = [
  { role: "Senior Designer", hourlyRate: 450, dayRate: 3600, retainerMonthly: 36000, currency: "ZAR" },
  { role: "Mid-level Designer", hourlyRate: 350, dayRate: 2800, retainerMonthly: 28000, currency: "ZAR" },
  { role: "Junior Designer", hourlyRate: 250, dayRate: 2000, retainerMonthly: 20000, currency: "ZAR" },
  { role: "Brand Strategist", hourlyRate: 500, dayRate: 4000, retainerMonthly: 40000, currency: "ZAR" },
  { role: "UX Researcher", hourlyRate: 400, dayRate: 3200, retainerMonthly: 32000, currency: "ZAR" },
  { role: "Copywriter", hourlyRate: 300, dayRate: 2400, retainerMonthly: 24000, currency: "ZAR" },
  { role: "Project Manager", hourlyRate: 380, dayRate: 3040, retainerMonthly: 30400, currency: "ZAR" },
  { role: "Motion Designer", hourlyRate: 420, dayRate: 3360, retainerMonthly: 33600, currency: "ZAR" },
  { role: "Developer", hourlyRate: 480, dayRate: 3840, retainerMonthly: 38400, currency: "ZAR" },
];

const addOns = [
  { item: "Rush delivery (< 48h)", multiplier: "1.5×", note: "Applied to hourly rate" },
  { item: "Weekend / After-hours", multiplier: "1.75×", note: "Applied to hourly rate" },
  { item: "Strategy workshop", fixed: "R8,000", note: "Half-day facilitated session" },
  { item: "Brand audit", fixed: "R12,000", note: "Comprehensive brand health review" },
  { item: "User testing session", fixed: "R6,500", note: "Moderated, 5 participants" },
];

export function RateCardPage({ isActive }: { isActive: boolean }) {
  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-rate-card">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Finance</div>
        <h1 className={cx("pageTitleText")}>Rate Card Reference</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Standard pricing and rate reference (read-only)</p>
      </div>

      <div className={cx("card", "mb24")}>
        <div className={cx("sectionLabel", "mb16")} style={{ padding: "16px 20px 0" }}>Standard Rates</div>
        <div className={cx("tableWrap")}>
          <table className={cx("table")}>
            <thead>
              <tr>
                <th>Role</th>
                <th>Hourly Rate</th>
                <th>Day Rate (8h)</th>
                <th>Monthly Retainer</th>
                <th>Currency</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((rate) => (
                <tr key={rate.role}>
                  <td className={cx("fw600")}>{rate.role}</td>
                  <td className={cx("fontMono", "colorAccent")}>R{rate.hourlyRate}</td>
                  <td className={cx("fontMono")}>R{rate.dayRate.toLocaleString()}</td>
                  <td className={cx("fontMono")}>R{rate.retainerMonthly.toLocaleString()}</td>
                  <td><span className={cx("badge")}>{rate.currency}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={cx("card")}>
        <div className={cx("sectionLabel", "mb16")} style={{ padding: "16px 20px 0" }}>Add-on Services & Modifiers</div>
        <div className={cx("tableWrap")}>
          <table className={cx("table")}>
            <thead>
              <tr>
                <th>Item</th>
                <th>Rate / Multiplier</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {addOns.map((addon) => (
                <tr key={addon.item}>
                  <td className={cx("fw600")}>{addon.item}</td>
                  <td className={cx("fontMono", "colorAmber", "fw600")}>{addon.multiplier ?? addon.fixed}</td>
                  <td className={cx("colorMuted")}>{addon.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

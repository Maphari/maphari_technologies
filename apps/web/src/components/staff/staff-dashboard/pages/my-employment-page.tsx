"use client";

import { cx } from "../style";

export function MyEmploymentPage({ isActive }: { isActive: boolean }) {
  const records = {
    personal: { name: "Thabo Mokoena", title: "Senior Designer", department: "Creative", startDate: "Aug 1, 2024", employeeId: "MPH-042" },
    compensation: [
      { period: "Oct 2025 – Present", salary: "R65,000/month", change: "+4.8%" },
      { period: "Aug 2024 – Sep 2025", salary: "R62,000/month", change: "Starting" },
    ],
    reviews: [
      { period: "H2 2025", rating: "Exceeds Expectations", score: "4.2/5", reviewer: "Creative Director" },
      { period: "H1 2025", rating: "Meets Expectations", score: "3.8/5", reviewer: "Creative Director" },
    ],
  };

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-my-employment">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / HR</div>
        <h1 className={cx("pageTitleText")}>My Employment</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Personal records, contracts, and compensation (read-only)</p>
      </div>

      <div className={cx("card", "cardBody", "mb24")}>
        <div className={cx("sectionLabel", "mb16")}>Personal Details</div>
        <div className={cx("stats", "stats3")}>
          {[
            { label: "Name", value: records.personal.name },
            { label: "Title", value: records.personal.title },
            { label: "Department", value: records.personal.department },
            { label: "Start Date", value: records.personal.startDate },
            { label: "Employee ID", value: records.personal.employeeId },
          ].map((f) => (
            <div key={f.label}>
              <div className={cx("text10", "colorMuted2", "uppercase", "tracking")}>{f.label}</div>
              <div className={cx("fw600", "text12")}>{f.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={cx("card", "mb24")}>
        <div className={cx("sectionLabel", "mb8")} style={{ padding: "16px 20px 0" }}>Compensation History</div>
        <div className={cx("tableWrap")}>
          <table className={cx("table")}>
            <thead><tr><th>Period</th><th>Salary</th><th>Change</th></tr></thead>
            <tbody>
              {records.compensation.map((c) => (
                <tr key={c.period}>
                  <td className={cx("fw600")}>{c.period}</td>
                  <td className={cx("fontMono")}>{c.salary}</td>
                  <td className={cx("badge", c.change.startsWith("+") ? "badgeGreen" : "badge")}>{c.change}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={cx("card")}>
        <div className={cx("sectionLabel", "mb8")} style={{ padding: "16px 20px 0" }}>Performance Reviews</div>
        <div className={cx("tableWrap")}>
          <table className={cx("table")}>
            <thead><tr><th>Period</th><th>Rating</th><th>Score</th><th>Reviewer</th></tr></thead>
            <tbody>
              {records.reviews.map((r) => (
                <tr key={r.period}>
                  <td className={cx("fw600")}>{r.period}</td>
                  <td><span className={cx("badge", r.rating.includes("Exceeds") ? "badgeGreen" : "badgeAmber")}>{r.rating}</span></td>
                  <td className={cx("fontMono", "fw600")}>{r.score}</td>
                  <td className={cx("colorMuted")}>{r.reviewer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

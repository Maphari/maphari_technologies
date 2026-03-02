"use client";

import { cx } from "../style";

const reports = [
  { id: "RPT-001", name: "Monthly Time Summary — February 2026", type: "Time", format: "PDF", generatedAt: "Feb 28, 2026", status: "Ready" },
  { id: "RPT-002", name: "Performance Review — H2 2025", type: "Performance", format: "PDF", generatedAt: "Jan 15, 2026", status: "Ready" },
  { id: "RPT-003", name: "Project Contribution — Brand Identity System", type: "Project", format: "CSV", generatedAt: "Feb 20, 2026", status: "Ready" },
  { id: "RPT-004", name: "Monthly Time Summary — January 2026", type: "Time", format: "PDF", generatedAt: "Jan 31, 2026", status: "Ready" },
  { id: "RPT-005", name: "Quarterly Skills Assessment — Q4 2025", type: "Skills", format: "PDF", generatedAt: "Jan 5, 2026", status: "Ready" },
];

export function MyReportsPage({ isActive }: { isActive: boolean }) {
  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-my-reports">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Analytics</div>
        <h1 className={cx("pageTitleText")}>My Reports</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Export personal performance and time reports</p>
      </div>
      <div className={cx("card")}>
        <div className={cx("tableWrap")}>
          <table className={cx("table")}>
            <thead><tr><th>Report</th><th>Type</th><th>Format</th><th>Generated</th><th>Action</th></tr></thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td className={cx("fw600")}>{r.name}</td>
                  <td><span className={cx("badge")}>{r.type}</span></td>
                  <td className={cx("fontMono", "text12")}>{r.format}</td>
                  <td className={cx("colorMuted", "text12")}>{r.generatedAt}</td>
                  <td><button type="button" className={cx("button", "buttonGhost", "buttonSmall")}>Download</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

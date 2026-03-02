"use client";

import { cx } from "../style";

const contracts = [
  { id: "CTR-001", client: "Volta Studios", type: "Retainer", status: "Active", startDate: "Jan 1, 2026", endDate: "Dec 31, 2026", value: "R336,000", renewal: "Auto" },
  { id: "CTR-002", client: "Kestrel Capital", type: "Project", status: "Active", startDate: "Jan 15, 2026", endDate: "Mar 31, 2026", value: "R63,000", renewal: "N/A" },
  { id: "CTR-003", client: "Mira Health", type: "Retainer", status: "Active", startDate: "Nov 1, 2025", endDate: "Oct 31, 2026", value: "R420,000", renewal: "Manual" },
  { id: "CTR-004", client: "Dune Collective", type: "Project", status: "Completed", startDate: "Sep 1, 2025", endDate: "Feb 10, 2026", value: "R52,500", renewal: "N/A" },
  { id: "CTR-005", client: "Okafor & Sons", type: "Project", status: "Active", startDate: "Feb 1, 2026", endDate: "May 30, 2026", value: "R42,000", renewal: "N/A" },
];

function statusTone(s: string) {
  if (s === "Active") return "badgeGreen";
  if (s === "Completed") return "badge";
  return "badgeRed";
}

export function ContractViewerPage({ isActive }: { isActive: boolean }) {
  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-contract-viewer">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Knowledge</div>
        <h1 className={cx("pageTitleText")}>Contract Viewer</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Read-only client contracts for your assigned projects</p>
      </div>

      <div className={cx("card")}>
        <div className={cx("tableWrap")}>
          <table className={cx("table")}>
            <thead><tr><th>ID</th><th>Client</th><th>Type</th><th>Start</th><th>End</th><th>Value</th><th>Renewal</th><th>Status</th></tr></thead>
            <tbody>
              {contracts.map((c) => (
                <tr key={c.id}>
                  <td className={cx("fontMono", "text12")}>{c.id}</td>
                  <td className={cx("fw600")}>{c.client}</td>
                  <td><span className={cx("badge")}>{c.type}</span></td>
                  <td className={cx("text12")}>{c.startDate}</td>
                  <td className={cx("text12")}>{c.endDate}</td>
                  <td className={cx("fontMono", "fw600")}>{c.value}</td>
                  <td className={cx("text12", "colorMuted")}>{c.renewal}</td>
                  <td><span className={cx("badge", statusTone(c.status))}>{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

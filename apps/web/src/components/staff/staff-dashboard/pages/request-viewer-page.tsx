"use client";

import { cx } from "../style";

const requests = [
  { id: "REQ-001", title: "Social media campaign for Q2 launch", client: "Kestrel Capital", type: "Campaign", estimatedHours: 60, budget: "R21,000", priority: "High", status: "New", receivedAt: "Feb 20, 2026" },
  { id: "REQ-002", title: "Annual report design updates", client: "Okafor & Sons", type: "Print", estimatedHours: 15, budget: "R5,250", priority: "Medium", status: "Under Review", receivedAt: "Feb 18, 2026" },
  { id: "REQ-003", title: "Landing page for health campaign", client: "Mira Health", type: "Digital", estimatedHours: 40, budget: "R14,000", priority: "High", status: "New", receivedAt: "Feb 22, 2026" },
  { id: "REQ-004", title: "Brand refresh for subsidiary", client: "Volta Studios", type: "Branding", estimatedHours: 80, budget: "R28,000", priority: "Low", status: "Estimated", receivedAt: "Feb 10, 2026" },
];

function statusTone(s: string) { if (s === "New") return "badgeAmber"; if (s === "Under Review") return "badgeAmber"; if (s === "Estimated") return "badgeGreen"; return "badge"; }
function priorityTone(p: string) { if (p === "High") return "badgeRed"; if (p === "Medium") return "badgeAmber"; return "badge"; }

export function RequestViewerPage({ isActive }: { isActive: boolean }) {
  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-request-viewer">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Lifecycle</div>
        <h1 className={cx("pageTitleText")}>Request Viewer</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Incoming project briefs to estimate effort</p>
      </div>
      <div className={cx("card")}>
        <div className={cx("tableWrap")}>
          <table className={cx("table")}>
            <thead><tr><th>ID</th><th>Request</th><th>Client</th><th>Type</th><th>Est. Hours</th><th>Budget</th><th>Priority</th><th>Status</th></tr></thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td className={cx("fontMono", "text12")}>{r.id}</td>
                  <td className={cx("fw600")}>{r.title}</td>
                  <td className={cx("colorMuted")}>{r.client}</td>
                  <td><span className={cx("badge")}>{r.type}</span></td>
                  <td className={cx("fontMono")}>{r.estimatedHours}h</td>
                  <td className={cx("fontMono", "fw600")}>{r.budget}</td>
                  <td><span className={cx("badge", priorityTone(r.priority))}>{r.priority}</span></td>
                  <td><span className={cx("badge", statusTone(r.status))}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

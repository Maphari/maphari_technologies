"use client";

import { cx } from "../style";

const interventions = [
  { id: "INT-001", client: "Kestrel Capital", type: "Scope Review", action: "Schedule scope review meeting by Feb 28", priority: "Urgent", assignedBy: "Admin", dueAt: "Feb 28, 2026", status: "Open" as const },
  { id: "INT-002", client: "Dune Collective", type: "Budget Alert", action: "Prepare overage justification report", priority: "High", assignedBy: "Admin", dueAt: "Mar 1, 2026", status: "Open" as const },
  { id: "INT-003", client: "Kestrel Capital", type: "Response Time", action: "Improve response time to under 4 hours", priority: "Medium", assignedBy: "Admin", dueAt: "Ongoing", status: "In Progress" as const },
  { id: "INT-004", client: "Dune Collective", type: "Client Re-engagement", action: "Send project completion summary and feedback request", priority: "Medium", assignedBy: "Admin", dueAt: "Feb 25, 2026", status: "Done" as const },
];

function priorityTone(p: string) { if (p === "Urgent") return "badgeRed"; if (p === "High") return "badgeAmber"; return "badge"; }
function statusTone(s: string) { if (s === "Done") return "badgeGreen"; if (s === "In Progress") return "badgeAmber"; return "badgeRed"; }

export function InterventionActionsPage({ isActive }: { isActive: boolean }) {
  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-intervention-actions">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Lifecycle</div>
        <h1 className={cx("pageTitleText")}>Intervention Actions</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Action items from admin health interventions</p>
      </div>
      <div className={cx("card")}>
        <div className={cx("tableWrap")}>
          <table className={cx("table")}>
            <thead><tr><th>ID</th><th>Client</th><th>Type</th><th>Action</th><th>Priority</th><th>Due</th><th>Status</th></tr></thead>
            <tbody>
              {interventions.map((i) => (
                <tr key={i.id}>
                  <td className={cx("fontMono", "text12")}>{i.id}</td>
                  <td className={cx("fw600")}>{i.client}</td>
                  <td><span className={cx("badge")}>{i.type}</span></td>
                  <td className={cx("text12")}>{i.action}</td>
                  <td><span className={cx("badge", priorityTone(i.priority))}>{i.priority}</span></td>
                  <td className={cx("text12", "colorMuted")}>{i.dueAt}</td>
                  <td><span className={cx("badge", statusTone(i.status))}>{i.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

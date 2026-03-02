"use client";

import { cx } from "../style";

type ApprovalItem = {
  id: string;
  title: string;
  type: "Milestone" | "Deliverable" | "Expense" | "Change Request" | "Design Review";
  project: string;
  client: string;
  requestedBy: string;
  requestedAt: string;
  priority: "Urgent" | "Normal" | "Low";
  status: "Pending" | "Approved" | "Rejected";
};

const approvalItems: ApprovalItem[] = [
  { id: "APR-001", title: "Phase 2 milestone sign-off", type: "Milestone", project: "Brand Identity System", client: "Volta Studios", requestedBy: "Project Manager", requestedAt: "Feb 20, 2026", priority: "Urgent", status: "Pending" },
  { id: "APR-002", title: "Final brand guidelines deliverable", type: "Deliverable", project: "Brand Identity System", client: "Volta Studios", requestedBy: "Client", requestedAt: "Feb 19, 2026", priority: "Normal", status: "Pending" },
  { id: "APR-003", title: "Additional audience segments - scope change", type: "Change Request", project: "Q1 Campaign Strategy", client: "Kestrel Capital", requestedBy: "Client", requestedAt: "Feb 18, 2026", priority: "Urgent", status: "Pending" },
  { id: "APR-004", title: "Wireframe review - mobile breakpoints", type: "Design Review", project: "Website Redesign", client: "Mira Health", requestedBy: "UX Lead", requestedAt: "Feb 17, 2026", priority: "Normal", status: "Pending" },
  { id: "APR-005", title: "Stock imagery purchase - R450", type: "Expense", project: "Q1 Campaign Strategy", client: "Kestrel Capital", requestedBy: "Designer", requestedAt: "Feb 16, 2026", priority: "Low", status: "Approved" },
  { id: "APR-006", title: "Component library v2 deliverable", type: "Deliverable", project: "Editorial Design System", client: "Dune Collective", requestedBy: "Project Manager", requestedAt: "Feb 15, 2026", priority: "Normal", status: "Approved" },
  { id: "APR-007", title: "Data vis chart style approval", type: "Design Review", project: "Annual Report 2025", client: "Okafor & Sons", requestedBy: "Senior Designer", requestedAt: "Feb 14, 2026", priority: "Low", status: "Rejected" },
];

function priorityTone(p: string) {
  if (p === "Urgent") return "badgeRed";
  if (p === "Normal") return "badgeAmber";
  return "badge";
}

function statusTone(s: string) {
  if (s === "Approved") return "badgeGreen";
  if (s === "Pending") return "badgeAmber";
  return "badgeRed";
}

export function ApprovalQueuePage({ isActive }: { isActive: boolean }) {
  const pending = approvalItems.filter((i) => i.status === "Pending");
  const urgent = pending.filter((i) => i.priority === "Urgent");

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-approval-queue">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Workflow</div>
        <h1 className={cx("pageTitleText")}>Approval Queue</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Items pending your technical review and approval</p>
      </div>

      <div className={cx("stats", "stats3", "mb28")}>
        {[
          { label: "Pending", value: String(pending.length), tone: "colorAmber" },
          { label: "Urgent", value: String(urgent.length), tone: "colorRed" },
          { label: "Total Processed", value: String(approvalItems.filter((i) => i.status !== "Pending").length), tone: "colorGreen" },
        ].map((stat) => (
          <div key={stat.label} className={cx("card")}>
            <div className={cx("text10", "colorMuted2", "uppercase", "tracking", "mb6")}>{stat.label}</div>
            <div className={cx("fontDisplay", "fw800", "text20", stat.tone)}>{stat.value}</div>
          </div>
        ))}
      </div>

      {pending.length > 0 && (
        <div className={cx("card", "mb24")}>
          <div className={cx("sectionLabel", "mb8")} style={{ padding: "16px 20px 0" }}>Pending Review</div>
          <div className={cx("tableWrap")}>
            <table className={cx("table")}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Item</th>
                  <th>Type</th>
                  <th>Project</th>
                  <th>Requested By</th>
                  <th>Priority</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((item) => (
                  <tr key={item.id}>
                    <td className={cx("fontMono", "text12")}>{item.id}</td>
                    <td className={cx("fw600")}>{item.title}</td>
                    <td><span className={cx("badge")}>{item.type}</span></td>
                    <td className={cx("colorMuted")}>{item.project}</td>
                    <td className={cx("text12")}>{item.requestedBy}</td>
                    <td><span className={cx("badge", priorityTone(item.priority))}>{item.priority}</span></td>
                    <td>
                      <div className={cx("flex", "gap4")}>
                        <button type="button" className={cx("button", "buttonAccent", "buttonSmall")}>Approve</button>
                        <button type="button" className={cx("button", "buttonGhost", "buttonSmall")}>Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className={cx("card")}>
        <div className={cx("sectionLabel", "mb8")} style={{ padding: "16px 20px 0" }}>History</div>
        <div className={cx("tableWrap")}>
          <table className={cx("table")}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Item</th>
                <th>Type</th>
                <th>Project</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {approvalItems.filter((i) => i.status !== "Pending").map((item) => (
                <tr key={item.id}>
                  <td className={cx("fontMono", "text12")}>{item.id}</td>
                  <td className={cx("fw600")}>{item.title}</td>
                  <td><span className={cx("badge")}>{item.type}</span></td>
                  <td className={cx("colorMuted")}>{item.project}</td>
                  <td><span className={cx("badge", statusTone(item.status))}>{item.status}</span></td>
                  <td className={cx("colorMuted", "text12")}>{item.requestedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

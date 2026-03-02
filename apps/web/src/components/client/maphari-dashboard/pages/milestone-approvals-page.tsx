"use client";

import { cx } from "../style";

const milestones = [
  { id: "MS-001", name: "Phase 1 — Brand Identity Design", dueDate: "Jan 31, 2026", criteria: ["Logo suite delivered in all formats", "Colour palette approved", "Typography system defined"], status: "Approved" as const, approvedAt: "Jan 28, 2026" },
  { id: "MS-002", name: "Phase 2 — Brand Guidelines", dueDate: "Mar 15, 2026", criteria: ["Guidelines PDF finalized", "Icon library delivered", "Motion language specifications"], status: "Awaiting Approval" as const, approvedAt: null },
  { id: "MS-003", name: "Phase 3 — UI Design", dueDate: "Apr 30, 2026", criteria: ["Dashboard mockups signed off", "Component library documented", "Responsive breakpoints defined"], status: "Not Started" as const, approvedAt: null },
];

export function MilestoneApprovalsPage() {
  return (
    <div className={cx("pageBody")}>
      <div className={cx("pageHeader")}>
        <div>
          <div className={cx("pageEyebrow")}>Veldt Finance · Milestones</div>
          <h1 className={cx("pageTitle")}>Milestone Approvals</h1>
          <p className={cx("pageSub")}>Review milestone deliverables and approve when acceptance criteria are met.</p>
        </div>
      </div>
      <div className={cx("flexCol", "gap16")}>
        {milestones.map((ms) => (
          <div key={ms.id} className={cx("card")} style={{ borderLeft: ms.status === "Awaiting Approval" ? "3px solid var(--amber)" : ms.status === "Approved" ? "3px solid var(--accent)" : "3px solid var(--border)" }}>
            <div className={cx("cardHd")} style={{ padding: "16px 20px" }}>
              <span className={cx("cardHdTitle")}>{ms.name}</span>
              <span className={cx("badge", ms.status === "Approved" ? "badgeGreen" : ms.status === "Awaiting Approval" ? "badgeAmber" : "badge")}>{ms.status}</span>
            </div>
            <div style={{ padding: "0 20px 16px" }}>
              <div className={cx("text12", "colorMuted", "mb12")}>Due: {ms.dueDate} {ms.approvedAt ? `· Approved: ${ms.approvedAt}` : ""}</div>
              <div className={cx("text10", "uppercase", "tracking", "fw700", "colorMuted", "mb8")}>Acceptance Criteria</div>
              {ms.criteria.map((c) => (
                <div key={c} className={cx("flex", "gap8", "mb6")}>
                  <span style={{ color: ms.status === "Approved" ? "var(--accent)" : "var(--border)" }}>{ms.status === "Approved" ? "✓" : "○"}</span>
                  <span className={cx("text12", ms.status === "Approved" ? "colorMuted" : "")}>{c}</span>
                </div>
              ))}
              {ms.status === "Awaiting Approval" && (
                <div className={cx("flex", "gap8", "mt12")}>
                  <button type="button" className={cx("btnSm", "btnAccent")}>Approve Milestone</button>
                  <button type="button" className={cx("btnSm", "btnGhost")}>Request Changes</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

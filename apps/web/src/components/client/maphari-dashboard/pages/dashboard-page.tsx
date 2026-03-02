"use client";

import { cx, styles } from "../style";
import { Ic } from "../ui";

const priorities = [
  { id: 1, label: "Approve Phase 2 Proposal", severity: "urgent", eta: "Due today", action: "Review & Approve" },
  { id: 2, label: "Confirm design assets for brand pack", severity: "high", eta: "Due in 2 days", action: "Upload Assets" },
  { id: 3, label: "Sign MSA amendment v1.3", severity: "high", eta: "Overdue 1 day", action: "Sign Now" },
];

const risks = [
  { label: "API integration scope undefined", impact: "High", probability: "Medium", mitigation: "Schedule call" },
  { label: "Client approval lag on wireframes", impact: "Medium", probability: "High", mitigation: "Escalate" },
];

const blockers = [
  { label: "Brand guidelines not received", owner: "Your team", blockedSince: "3 days", action: "Upload" },
  { label: "Figma access not granted", owner: "Admin", blockedSince: "1 day", action: "Contact Admin" },
];

const nextActions = [
  { label: "Review milestone M3 deliverables", category: "Delivery", cta: "Review" },
  { label: "Respond to change request CR-07", category: "Changes", cta: "Respond" },
  { label: "Book sprint review meeting", category: "Meetings", cta: "Schedule" },
  { label: "Submit Q2 feedback survey", category: "Feedback", cta: "Start" },
];

const metrics = [
  { label: "Projects Active", value: "4", delta: "+1", positive: true },
  { label: "Open Blockers", value: "2", delta: "-2", positive: false },
  { label: "Overdue Invoices", value: "1", delta: "$3.4K", positive: false },
  { label: "Health Score", value: "82%", delta: "+6%", positive: true },
];

export function DashboardPage() {
  return (
    <div className={styles.pageBody}>
      <div className={cx("pageHeader")}>
        <div>
          <div className={cx("pageEyebrow")}>Client Portal</div>
          <h1 className={cx("pageTitle")}>Dashboard</h1>
        </div>
        <div className={cx("pageActions")}>
          <button className={cx("btnSm", "btnGhost")} type="button">Export Summary</button>
          <button className={cx("btnSm", "btnAccent")} type="button">View All Projects</button>
        </div>
      </div>
      <div className={cx("grid4", "mb16")}>
        {metrics.map((metric) => (
          <div key={metric.label} className={cx("statCard")}>
            <div className={cx("statLabel")}>{metric.label}</div>
            <div className={cx("clientDashMetricRow")}>
              <span className={cx("clientDashMetricValue")}>{metric.value}</span>
              <span className={cx("clientDashMetricDelta", metric.positive ? "clientDashDeltaPos" : "clientDashDeltaNeg")}>
                {metric.delta}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className={cx("grid2")}>
        <div className={cx("card")}>
          <div className={cx("cardHeader")}>
            <span className={cx("clientDashHeaderDot", "clientDashHeaderDotRed")} />
            <span className={cx("clientDashPanelTitle")}>Priority Actions</span>
            <span className={cx("badge", "badgeRed", "clientDashHeaderBadge")}>{priorities.length} urgent</span>
          </div>
          <div className={cx("cardBody", "clientDashStack12")}>
            {priorities.map((priority) => (
              <div
                key={priority.id}
                className={cx("clientDashRowCard", priority.severity === "urgent" ? "clientDashRowCardDanger" : "clientDashRowCardBase")}
              >
                <span className={cx("clientDashRowDot", priority.severity === "urgent" ? "clientDashDotRed" : "clientDashDotAmber")} />
                <div className={cx("clientDashGrow")}>
                  <div className={cx("clientDashRowTitle")}>{priority.label}</div>
                  <div className={cx("clientDashRowMeta")}>{priority.eta}</div>
                </div>
                <button className={cx("btnSm", "btnAccent")}>{priority.action}</button>
              </div>
            ))}
          </div>
        </div>

        <div className={cx("card")}>
          <div className={cx("cardHeader")}>
            <Ic n="alert" sz={14} c="var(--amber)" />
            <span className={cx("clientDashPanelTitle")}>Risk Register</span>
            <span className={cx("badge", "badgeAmber", "clientDashHeaderBadge")}>Active</span>
          </div>
          <div className={cx("cardBody", "clientDashStack12")}>
            {risks.map((risk) => (
              <div key={risk.label} className={cx("clientDashRowCard", "clientDashRowCardBase")}>
                <div className={cx("clientDashGrow")}>
                  <div className={cx("clientDashRowTitle", "clientDashMb8")}>{risk.label}</div>
                  <div className={cx("clientDashInlineMeta")}>
                    <span className={cx("badge", "badgeRed")}>Impact: {risk.impact}</span>
                    <span className={cx("badge", "badgeAmber")}>Prob: {risk.probability}</span>
                    <button className={cx("btnSm", "btnGhost", "clientDashMlAuto")}>{risk.mitigation}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={cx("card")}>
          <div className={cx("cardHeader")}>
            <Ic n="lock" sz={14} c="var(--red)" />
            <span className={cx("clientDashPanelTitle")}>Active Blockers</span>
            <span className={cx("badge", "badgeRed", "clientDashHeaderBadge")}>{blockers.length}</span>
          </div>
          <div className={cx("cardBody", "clientDashStack12")}>
            {blockers.map((blocker) => (
              <div key={blocker.label} className={cx("clientDashRowCard", "clientDashBlockerCard")}>
                <div className={cx("clientDashBetweenRow", "clientDashMb4")}>
                  <div className={cx("clientDashRowTitle")}>{blocker.label}</div>
                  <button className={cx("btnSm", "btnGhost")}>{blocker.action}</button>
                </div>
                <div className={cx("clientDashMetaRow")}>
                  <span>Owner: {blocker.owner}</span>
                  <span>Since: {blocker.blockedSince}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={cx("card")}>
          <div className={cx("cardHeader")}>
            <Ic n="activity" sz={14} c="var(--lime)" />
            <span className={cx("clientDashPanelTitle")}>Next Actions</span>
          </div>
          <div className={cx("cardBody", "clientDashStack12")}>
            {nextActions.map((action) => (
              <div key={action.label} className={cx("clientDashRowCard", "clientDashRowCardBase")}>
                <span className={cx("clientDashRowDot", "clientDashDotLime")} />
                <div className={cx("clientDashGrow")}>
                  <div className={cx("clientDashRowTitle")}>{action.label}</div>
                  <div className={cx("clientDashRowMeta", "clientDashRowMetaCompact")}>{action.category}</div>
                </div>
                <button className={cx("btnSm", "btnGhost")}>{action.cta}</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

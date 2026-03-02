"use client";

import { cx, styles } from "../style";

const entries = [
  { id: "AUT-001", trigger: "Client Health Score < 50", target: "Kestrel Capital", action: "Sent health intervention alert to PM", firedAt: "Feb 22, 2026 10:15", status: "Success" as const, automation: "Auto-Intervention" },
  { id: "AUT-002", trigger: "Invoice overdue > 14 days", target: "INV-0087", action: "Sent payment reminder email to client", firedAt: "Feb 21, 2026 09:00", status: "Success" as const, automation: "Payment Reminders" },
  { id: "AUT-003", trigger: "Task completed → next task assigned", target: "Brand Guidelines", action: "Auto-assigned icon library audit to Thabo", firedAt: "Feb 21, 2026 16:45", status: "Success" as const, automation: "Task Chaining" },
  { id: "AUT-004", trigger: "Daily standup not submitted by 10:00", target: "Kira Bosman", action: "Sent standup reminder via Slack", firedAt: "Feb 22, 2026 10:00", status: "Success" as const, automation: "Standup Reminders" },
  { id: "AUT-005", trigger: "Project budget > 85% utilised", target: "Website Redesign", action: "Sent budget alert to PM and Admin", firedAt: "Feb 20, 2026 14:30", status: "Failed" as const, automation: "Budget Alerts" },
];

export function AutomationAuditTrailPage() {
  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / GOVERNANCE</div>
          <h1 className={styles.pageTitle}>Automation Audit Trail</h1>
          <div className={styles.pageSub}>Complete log of automated trigger/action executions</div>
        </div>
      </div>
      <article className={styles.card}>
        <div className={styles.cardHd}><span className={styles.cardHdTitle}>Execution Log</span></div>
        <div className={styles.cardInner}>
          <table className={styles.table}>
            <thead><tr><th>ID</th><th>Automation</th><th>Trigger</th><th>Target</th><th>Action</th><th>Fired</th><th>Status</th></tr></thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td className={cx("fontMono", "text12")}>{e.id}</td>
                  <td><span className={cx("badge")}>{e.automation}</span></td>
                  <td className={cx("text12")}>{e.trigger}</td>
                  <td className={cx("fw600", "text12")}>{e.target}</td>
                  <td className={cx("text12", "colorMuted")}>{e.action}</td>
                  <td className={cx("fontMono", "text11", "colorMuted")}>{e.firedAt}</td>
                  <td><span className={cx("badge", e.status === "Success" ? "badgeGreen" : "badgeRed")}>{e.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}

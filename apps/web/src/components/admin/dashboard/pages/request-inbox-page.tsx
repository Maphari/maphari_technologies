"use client";

import { cx, styles } from "../style";

const requests = [
  { id: "REQ-001", title: "Social media campaign for Q2 launch", client: "Kestrel Capital", type: "Campaign", estimatedValue: "R21,000", priority: "High", receivedAt: "Feb 20, 2026", status: "New" as const },
  { id: "REQ-002", title: "Annual report design updates", client: "Okafor & Sons", type: "Print", estimatedValue: "R5,250", priority: "Medium", receivedAt: "Feb 18, 2026", status: "Under Review" as const },
  { id: "REQ-003", title: "Landing page for health campaign", client: "Mira Health", type: "Digital", estimatedValue: "R14,000", priority: "High", receivedAt: "Feb 22, 2026", status: "New" as const },
  { id: "REQ-004", title: "Brand refresh for subsidiary", client: "Volta Studios", type: "Branding", estimatedValue: "R28,000", priority: "Low", receivedAt: "Feb 10, 2026", status: "Estimated" as const },
];

export function RequestInboxPage() {
  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / LIFECYCLE</div>
          <h1 className={styles.pageTitle}>Request Inbox</h1>
          <div className={styles.pageSub}>Triage incoming project requests — assign, estimate, and approve</div>
        </div>
      </div>
      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "New Requests", value: String(requests.filter((r) => r.status === "New").length), color: "var(--red)" },
          { label: "Under Review", value: String(requests.filter((r) => r.status === "Under Review").length), color: "var(--amber)" },
          { label: "Estimated", value: String(requests.filter((r) => r.status === "Estimated").length), color: "var(--accent)" },
          { label: "Pipeline Value", value: "R" + requests.reduce((s, r) => s + parseInt(r.estimatedValue.replace(/[R,]/g, "")), 0).toLocaleString(), color: "var(--accent)" },
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue)} style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
      <article className={styles.card}>
        <div className={styles.cardHd}><span className={styles.cardHdTitle}>Incoming Requests</span></div>
        <div className={styles.cardInner}>
          <table className={styles.table}>
            <thead><tr><th>ID</th><th>Request</th><th>Client</th><th>Type</th><th>Value</th><th>Priority</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td className={cx("fontMono", "text12")}>{r.id}</td>
                  <td className={cx("fw600")}>{r.title}</td>
                  <td className={cx("colorMuted")}>{r.client}</td>
                  <td><span className={cx("badge")}>{r.type}</span></td>
                  <td className={cx("fontMono", "fw600")}>{r.estimatedValue}</td>
                  <td><span className={cx("badge", r.priority === "High" ? "badgeRed" : r.priority === "Medium" ? "badgeAmber" : "badge")}>{r.priority}</span></td>
                  <td><span className={cx("badge", r.status === "New" ? "badgeRed" : r.status === "Under Review" ? "badgeAmber" : "badgeGreen")}>{r.status}</span></td>
                  <td><button type="button" className={cx("btnSm", "btnAccent")}>Triage</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}

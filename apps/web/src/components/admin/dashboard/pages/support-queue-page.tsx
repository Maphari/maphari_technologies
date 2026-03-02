"use client";

import { cx, styles } from "../style";

const tickets = [
  { id: "SUP-001", title: "Cannot access latest brand assets", client: "Volta Studios", priority: "High", sla: "4h", elapsed: "2h 15m", assignedTo: "Thabo Mokoena", status: "Open" as const },
  { id: "SUP-002", title: "Invoice discrepancy on Feb statement", client: "Mira Health", priority: "Medium", sla: "24h", elapsed: "8h", assignedTo: "Leilani September", status: "In Progress" as const },
  { id: "SUP-003", title: "Portal login issue on mobile", client: "Kestrel Capital", priority: "High", sla: "4h", elapsed: "3h 45m", assignedTo: "James Okonkwo", status: "Open" as const },
  { id: "SUP-004", title: "Request progress report for board meeting", client: "Okafor & Sons", priority: "Low", sla: "48h", elapsed: "12h", assignedTo: "Kira Bosman", status: "In Progress" as const },
];

export function SupportQueuePage() {
  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / LIFECYCLE</div>
          <h1 className={styles.pageTitle}>Support Queue</h1>
          <div className={styles.pageSub}>Manage support tickets with SLA tracking and assignment</div>
        </div>
      </div>
      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Open Tickets", value: String(tickets.filter((t) => t.status === "Open").length), color: "var(--red)" },
          { label: "In Progress", value: String(tickets.filter((t) => t.status === "In Progress").length), color: "var(--amber)" },
          { label: "Avg SLA Used", value: "68%", color: "var(--accent)" },
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue)} style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
      <article className={styles.card}>
        <div className={styles.cardHd}><span className={styles.cardHdTitle}>Active Tickets</span></div>
        <div className={styles.cardInner}>
          <table className={styles.table}>
            <thead><tr><th>ID</th><th>Issue</th><th>Client</th><th>Priority</th><th>SLA</th><th>Elapsed</th><th>Assigned</th><th>Status</th></tr></thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td className={cx("fontMono", "text12")}>{t.id}</td>
                  <td className={cx("fw600")}>{t.title}</td>
                  <td className={cx("colorMuted")}>{t.client}</td>
                  <td><span className={cx("badge", t.priority === "High" ? "badgeRed" : t.priority === "Medium" ? "badgeAmber" : "badge")}>{t.priority}</span></td>
                  <td className={cx("fontMono", "text12")}>{t.sla}</td>
                  <td className={cx("fontMono", "text12")}>{t.elapsed}</td>
                  <td className={cx("text12")}>{t.assignedTo}</td>
                  <td><span className={cx("badge", t.status === "Open" ? "badgeRed" : "badgeAmber")}>{t.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}

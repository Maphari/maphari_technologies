"use client";

import { cx, styles } from "../style";

const reviews = [
  { id: "PR-001", title: "Brand Guidelines — Final Review", requester: "Thabo Mokoena", reviewer: "Naledi Mthembu", project: "Brand Identity System", priority: "High", submittedAt: "Feb 21, 2026", status: "Pending" as const },
  { id: "PR-002", title: "Campaign Strategy Deck", requester: "Kira Bosman", reviewer: "Fatima Al-Rashid", project: "Q1 Campaign Strategy", priority: "Medium", submittedAt: "Feb 20, 2026", status: "In Review" as const },
  { id: "PR-003", title: "Wireframe Set — Checkout Flow", requester: "Lerato Dlamini", reviewer: "James Okonkwo", project: "Website Redesign", priority: "High", submittedAt: "Feb 22, 2026", status: "Pending" as const },
  { id: "PR-004", title: "Annual Report Data Visualization", requester: "Thabo Mokoena", reviewer: "Naledi Mthembu", project: "Annual Report 2025", priority: "Low", submittedAt: "Feb 19, 2026", status: "Complete" as const },
];

export function PeerReviewQueuePage() {
  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / GOVERNANCE</div>
          <h1 className={styles.pageTitle}>Peer Review Queue</h1>
          <div className={styles.pageSub}>Manage and distribute peer review requests across the team</div>
        </div>
      </div>
      <article className={styles.card}>
        <div className={styles.cardHd}><span className={styles.cardHdTitle}>Review Requests</span></div>
        <div className={styles.cardInner}>
          <table className={styles.table}>
            <thead><tr><th>ID</th><th>Review</th><th>Requester</th><th>Reviewer</th><th>Project</th><th>Priority</th><th>Status</th></tr></thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r.id}>
                  <td className={cx("fontMono", "text12")}>{r.id}</td>
                  <td className={cx("fw600")}>{r.title}</td>
                  <td className={cx("text12")}>{r.requester}</td>
                  <td className={cx("text12")}>{r.reviewer}</td>
                  <td className={cx("colorMuted", "text12")}>{r.project}</td>
                  <td><span className={cx("badge", r.priority === "High" ? "badgeRed" : r.priority === "Medium" ? "badgeAmber" : "badge")}>{r.priority}</span></td>
                  <td><span className={cx("badge", r.status === "Complete" ? "badgeGreen" : r.status === "In Review" ? "badgeAmber" : "badgeRed")}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}

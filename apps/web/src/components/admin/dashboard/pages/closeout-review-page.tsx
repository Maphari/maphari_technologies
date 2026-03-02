"use client";

import { cx, styles } from "../style";

const reports = [
  { id: "CLO-001", project: "Editorial Design System", client: "Dune Collective", submittedBy: "Thabo Mokoena", date: "Feb 18, 2026", status: "Pending Review" as const, budgetVariance: "+R2,400", lessonsCount: 4 },
  { id: "CLO-002", project: "Q4 Campaign", client: "Volta Studios", submittedBy: "Kira Bosman", date: "Jan 30, 2026", status: "Approved" as const, budgetVariance: "-R1,200", lessonsCount: 3 },
  { id: "CLO-003", project: "Website MVP", client: "Kestrel Capital", submittedBy: "James Okonkwo", date: "Feb 22, 2026", status: "Pending Review" as const, budgetVariance: "+R5,800", lessonsCount: 5 },
];

export function CloseoutReviewPage() {
  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / KNOWLEDGE</div>
          <h1 className={styles.pageTitle}>Close-out Review</h1>
          <div className={styles.pageSub}>Approve project close-out reports and capture lessons learned</div>
        </div>
      </div>
      <article className={styles.card}>
        <div className={styles.cardHd}><span className={styles.cardHdTitle}>Close-out Reports</span></div>
        <div className={styles.cardInner}>
          <table className={styles.table}>
            <thead><tr><th>ID</th><th>Project</th><th>Client</th><th>Submitted By</th><th>Budget Δ</th><th>Lessons</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td className={cx("fontMono", "text12")}>{r.id}</td>
                  <td className={cx("fw600")}>{r.project}</td>
                  <td className={cx("colorMuted")}>{r.client}</td>
                  <td className={cx("text12")}>{r.submittedBy}</td>
                  <td className={cx("fontMono", "fw600", r.budgetVariance.startsWith("+") ? "colorRed" : "colorGreen")}>{r.budgetVariance}</td>
                  <td className={cx("fontMono")}>{r.lessonsCount}</td>
                  <td><span className={cx("badge", r.status === "Approved" ? "badgeGreen" : "badgeAmber")}>{r.status}</span></td>
                  <td>{r.status === "Pending Review" && <button type="button" className={cx("btnSm", "btnAccent")}>Review</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}

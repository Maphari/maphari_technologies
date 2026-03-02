"use client";

import { cx, styles } from "../style";

const changeRequests = [
  { id: "CR-001", project: "Q1 Campaign Strategy", client: "Kestrel Capital", title: "Add Instagram Reels to deliverables", impact: "Scope +15%", costImpact: "+R3,200", submittedBy: "Kira Bosman", status: "Pending" as const },
  { id: "CR-002", project: "Website Redesign", client: "Mira Health", title: "Replace carousel with hero video", impact: "Timeline +1 week", costImpact: "+R4,500", submittedBy: "James Okonkwo", status: "Pending" as const },
  { id: "CR-003", project: "Brand Identity System", client: "Volta Studios", title: "Add motion language to guidelines", impact: "Scope +10%", costImpact: "+R6,000", submittedBy: "Thabo Mokoena", status: "Approved" as const },
];

export function ChangeRequestManagerPage() {
  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / LIFECYCLE</div>
          <h1 className={styles.pageTitle}>Change Request Manager</h1>
          <div className={styles.pageSub}>Review and approve project scope change requests</div>
        </div>
      </div>
      <article className={styles.card}>
        <div className={styles.cardHd}><span className={styles.cardHdTitle}>Change Requests</span></div>
        <div className={styles.cardInner}>
          <table className={styles.table}>
            <thead><tr><th>ID</th><th>Change</th><th>Project</th><th>Impact</th><th>Cost Δ</th><th>Submitted By</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {changeRequests.map((cr) => (
                <tr key={cr.id}>
                  <td className={cx("fontMono", "text12")}>{cr.id}</td>
                  <td className={cx("fw600")}>{cr.title}</td>
                  <td className={cx("colorMuted")}>{cr.project}</td>
                  <td className={cx("text12")}>{cr.impact}</td>
                  <td className={cx("fontMono", "fw600", "colorAmber")}>{cr.costImpact}</td>
                  <td className={cx("text12", "colorMuted")}>{cr.submittedBy}</td>
                  <td><span className={cx("badge", cr.status === "Approved" ? "badgeGreen" : "badgeAmber")}>{cr.status}</span></td>
                  <td>{cr.status === "Pending" && <div className={cx("flex", "gap4")}><button type="button" className={cx("btnSm", "btnAccent")}>Approve</button><button type="button" className={cx("btnSm", "btnGhost")}>Reject</button></div>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}

"use client";

import { cx, styles } from "../style";

const decisions = [
  { id: "DEC-001", title: "Adopt Design Tokens v2 across all projects", category: "Technical", madeBy: "Naledi Mthembu", date: "Feb 15, 2026", status: "Active", impact: "High" },
  { id: "DEC-002", title: "Standardise retainer pricing to hourly model", category: "Commercial", madeBy: "Sipho Ndlovu", date: "Jan 10, 2026", status: "Active", impact: "Critical" },
  { id: "DEC-003", title: "Deprecate legacy CMS in favour of headless", category: "Technical", madeBy: "James Okonkwo", date: "Dec 5, 2025", status: "Superseded", impact: "High" },
  { id: "DEC-004", title: "Mandate accessibility audits for all launches", category: "Quality", madeBy: "Naledi Mthembu", date: "Feb 20, 2026", status: "Active", impact: "Medium" },
  { id: "DEC-005", title: "Approve remote-first policy for Q2 2026", category: "HR", madeBy: "Sipho Ndlovu", date: "Feb 22, 2026", status: "Pending Ratification", impact: "Medium" },
];

export function DecisionRegistryPage() {
  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / KNOWLEDGE</div>
          <h1 className={styles.pageTitle}>Decision Registry</h1>
          <div className={styles.pageSub}>Company-wide decision log with rationale and impact tracking</div>
        </div>
        <button type="button" className={cx("btnSm", "btnAccent")}>+ Record Decision</button>
      </div>
      <article className={styles.card}>
        <div className={styles.cardHd}><span className={styles.cardHdTitle}>Decision Log</span></div>
        <div className={styles.cardInner}>
          <table className={styles.table}>
            <thead><tr><th>ID</th><th>Decision</th><th>Category</th><th>Made By</th><th>Date</th><th>Impact</th><th>Status</th></tr></thead>
            <tbody>
              {decisions.map((d) => (
                <tr key={d.id}>
                  <td className={cx("fontMono", "text12")}>{d.id}</td>
                  <td className={cx("fw600")}>{d.title}</td>
                  <td><span className={cx("badge")}>{d.category}</span></td>
                  <td className={cx("colorMuted")}>{d.madeBy}</td>
                  <td className={cx("text12", "colorMuted")}>{d.date}</td>
                  <td><span className={cx("badge", d.impact === "Critical" ? "badgeRed" : d.impact === "High" ? "badgeAmber" : "badge")}>{d.impact}</span></td>
                  <td><span className={cx("badge", d.status === "Active" ? "badgeGreen" : d.status === "Superseded" ? "badge" : "badgeAmber")}>{d.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}

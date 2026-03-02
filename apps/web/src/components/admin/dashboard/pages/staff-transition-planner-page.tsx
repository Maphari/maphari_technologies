"use client";

import { cx, styles } from "../style";

const transitions = [
  { id: "TRN-001", staff: "Fatima Al-Rashid", from: "Project Manager", to: "Senior PM", type: "Promotion", status: "In Progress" as const, effectiveDate: "Mar 1, 2026", handovers: 2, knowledgeTransfer: 75 },
  { id: "TRN-002", staff: "Kira Bosman", from: "Junior Designer", to: "Designer", type: "Promotion", status: "Complete" as const, effectiveDate: "Feb 1, 2026", handovers: 1, knowledgeTransfer: 100 },
  { id: "TRN-003", staff: "Marcus Venter", from: "Developer", to: "—", type: "Departure", status: "Planning" as const, effectiveDate: "Apr 15, 2026", handovers: 3, knowledgeTransfer: 10 },
];

export function StaffTransitionPlannerPage() {
  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / KNOWLEDGE</div>
          <h1 className={styles.pageTitle}>Staff Transition Planner</h1>
          <div className={styles.pageSub}>Plan staff transitions and knowledge transfer workflows</div>
        </div>
        <button type="button" className={cx("btnSm", "btnAccent")}>+ New Transition</button>
      </div>
      <article className={styles.card}>
        <div className={styles.cardHd}><span className={styles.cardHdTitle}>Active Transitions</span></div>
        <div className={styles.cardInner}>
          <table className={styles.table}>
            <thead><tr><th>Staff</th><th>From</th><th>To</th><th>Type</th><th>Effective</th><th>Handovers</th><th>Knowledge %</th><th>Status</th></tr></thead>
            <tbody>
              {transitions.map((t) => (
                <tr key={t.id}>
                  <td className={cx("fw600")}>{t.staff}</td>
                  <td className={cx("text12", "colorMuted")}>{t.from}</td>
                  <td className={cx("text12")}>{t.to}</td>
                  <td><span className={cx("badge", t.type === "Departure" ? "badgeRed" : "badgeGreen")}>{t.type}</span></td>
                  <td className={cx("text12", "colorMuted")}>{t.effectiveDate}</td>
                  <td className={cx("fontMono")}>{t.handovers}</td>
                  <td className={cx("fontMono", "fw600", t.knowledgeTransfer >= 80 ? "colorGreen" : "colorAmber")}>{t.knowledgeTransfer}%</td>
                  <td><span className={cx("badge", t.status === "Complete" ? "badgeGreen" : t.status === "In Progress" ? "badgeAmber" : "badgeRed")}>{t.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}

"use client";

import { cx, styles } from "../style";

const transitions: Array<{ id: string; staff: string; from: string; to: string; type: string; status: "In Progress" | "Complete" | "Planning"; effectiveDate: string; handovers: number; knowledgeTransfer: number }> = [];

export function StaffTransitionPlannerPage() {
  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>KNOWLEDGE / STAFF TRANSITION PLANNER</div>
          <h1 className={styles.pageTitle}>Staff Transition Planner</h1>
          <div className={styles.pageSub}>Plan staff transitions and knowledge transfer workflows</div>
        </div>
        <button type="button" className={cx("btnSm", "btnAccent")}>+ New Transition</button>
      </div>
      <article className={styles.card}>
        <div className={styles.cardHd}><span className={styles.cardHdTitle}>Active Transitions</span></div>
        <div className={styles.cardInner}>
          <table className={styles.table}>
            <thead><tr><th scope="col">Staff</th><th scope="col">From</th><th scope="col">To</th><th scope="col">Type</th><th scope="col">Effective</th><th scope="col">Handovers</th><th scope="col">Knowledge %</th><th scope="col">Status</th></tr></thead>
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

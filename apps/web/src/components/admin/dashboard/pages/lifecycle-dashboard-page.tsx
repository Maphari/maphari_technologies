"use client";

import { cx, styles } from "../style";

const clients = [
  { name: "Volta Studios", avatar: "VS", onboarding: "Complete", stage: "Active", tenure: "18 months", offboarding: "—", healthScore: 92 },
  { name: "Kestrel Capital", avatar: "KC", onboarding: "Complete", stage: "At Risk", tenure: "2 months", offboarding: "—", healthScore: 45 },
  { name: "Mira Health", avatar: "MH", onboarding: "Complete", stage: "Growing", tenure: "4 months", offboarding: "—", healthScore: 78 },
  { name: "Dune Collective", avatar: "DC", onboarding: "Complete", stage: "Offboarding", tenure: "6 months", offboarding: "In Progress", healthScore: 35 },
  { name: "Okafor & Sons", avatar: "OS", onboarding: "Active (Week 2)", stage: "Onboarding", tenure: "3 weeks", offboarding: "—", healthScore: 85 },
];

export function LifecycleDashboardPage() {
  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / LIFECYCLE</div>
          <h1 className={styles.pageTitle}>Lifecycle Dashboard</h1>
          <div className={styles.pageSub}>Unified client onboarding, active, and offboarding status</div>
        </div>
      </div>
      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Onboarding", value: String(clients.filter((c) => c.stage === "Onboarding").length), color: "var(--blue)" },
          { label: "Active", value: String(clients.filter((c) => c.stage === "Active" || c.stage === "Growing").length), color: "var(--accent)" },
          { label: "At Risk", value: String(clients.filter((c) => c.stage === "At Risk").length), color: "var(--red)" },
          { label: "Offboarding", value: String(clients.filter((c) => c.stage === "Offboarding").length), color: "var(--amber)" },
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue)} style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
      <article className={styles.card}>
        <div className={styles.cardHd}><span className={styles.cardHdTitle}>All Clients</span></div>
        <div className={styles.cardInner}>
          <table className={styles.table}>
            <thead><tr><th>Client</th><th>Stage</th><th>Onboarding</th><th>Tenure</th><th>Health</th><th>Offboarding</th></tr></thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.name}>
                  <td className={cx("fw600")}>{c.name}</td>
                  <td><span className={cx("badge", c.stage === "Active" || c.stage === "Growing" ? "badgeGreen" : c.stage === "At Risk" ? "badgeRed" : c.stage === "Offboarding" ? "badgeAmber" : "badgeBlue")}>{c.stage}</span></td>
                  <td className={cx("text12")}>{c.onboarding}</td>
                  <td className={cx("text12", "colorMuted")}>{c.tenure}</td>
                  <td className={cx("fontMono", "fw600", c.healthScore >= 70 ? "colorGreen" : c.healthScore >= 50 ? "colorAmber" : "colorRed")}>{c.healthScore}%</td>
                  <td className={cx("text12", "colorMuted")}>{c.offboarding}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}

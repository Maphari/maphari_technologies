"use client";

import { cx, styles } from "../style";

const handovers = [
  { id: "HND-001", project: "Brand Identity System", from: "Thabo Mokoena", to: "Lerato Dlamini", status: "In Progress" as const, progress: 65, dueDate: "Mar 5, 2026", items: 12 },
  { id: "HND-002", project: "Q1 Campaign Strategy", from: "Fatima Al-Rashid", to: "Kira Bosman", status: "Complete" as const, progress: 100, dueDate: "Feb 14, 2026", items: 8 },
  { id: "HND-003", project: "Website Redesign", from: "James Okonkwo", to: "TBD", status: "Not Started" as const, progress: 0, dueDate: "Apr 1, 2026", items: 15 },
];

export function HandoverManagementPage() {
  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / KNOWLEDGE</div>
          <h1 className={styles.pageTitle}>Handover Management</h1>
          <div className={styles.pageSub}>Create and monitor project handover checklists</div>
        </div>
        <button type="button" className={cx("btnSm", "btnAccent")}>+ New Handover</button>
      </div>
      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Active", value: String(handovers.filter((h) => h.status === "In Progress").length), color: "var(--amber)" },
          { label: "Complete", value: String(handovers.filter((h) => h.status === "Complete").length), color: "var(--accent)" },
          { label: "Pending", value: String(handovers.filter((h) => h.status === "Not Started").length), color: "var(--red)" },
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue)} style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div className={cx("flexCol", "gap16")}>
        {handovers.map((h) => (
          <article key={h.id} className={styles.card}>
            <div className={cx(styles.cardHd)}><span className={styles.cardHdTitle}>{h.project}</span><span className={cx("badge", h.status === "Complete" ? "badgeGreen" : h.status === "In Progress" ? "badgeAmber" : "badgeRed")}>{h.status}</span></div>
            <div className={styles.cardInner}>
              <div className={cx("flexBetween", "mb8")}>
                <span className={cx("text12", "colorMuted")}>From: <strong>{h.from}</strong> → To: <strong>{h.to}</strong></span>
                <span className={cx("text12", "colorMuted")}>Due: {h.dueDate}</span>
              </div>
              <div className={cx("flexBetween", "mb4")}>
                <span className={cx("text11", "colorMuted")}>{h.items} checklist items</span>
                <span className={cx("fontMono", "text11")}>{h.progress}%</span>
              </div>
              <progress max={100} value={h.progress} style={{ width: "100%", height: "4px", accentColor: "var(--accent)" }} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

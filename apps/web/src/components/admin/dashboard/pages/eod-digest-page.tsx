"use client";

import { cx, styles } from "../style";

const wraps = [
  { name: "Thabo Mokoena", role: "Senior Designer", time: "17:45", completed: ["Brand guidelines pages 12-18", "Colour consistency review", "Print-ready asset prep"], hoursLogged: 7.5, mood: "Productive", carryOver: "Icon library audit" },
  { name: "James Okonkwo", role: "Frontend Dev", time: "17:30", completed: ["Responsive navigation", "Safari bug fix", "Component library setup"], hoursLogged: 8.0, mood: "Focused", carryOver: "Form validation" },
  { name: "Kira Bosman", role: "Designer", time: "17:15", completed: ["4 of 8 campaign assets", "Email header design"], hoursLogged: 7.0, mood: "Good", carryOver: "Remaining 4 campaign assets" },
];

export function EODDigestPage() {
  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / GOVERNANCE</div>
          <h1 className={styles.pageTitle}>EOD Digest</h1>
          <div className={styles.pageSub}>Daily wrap-up summaries from all staff</div>
        </div>
      </div>
      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Submitted", value: `${wraps.length}/6`, color: "var(--accent)" },
          { label: "Avg Hours", value: (wraps.reduce((s, w) => s + w.hoursLogged, 0) / wraps.length).toFixed(1) + "h", color: "var(--accent)" },
          { label: "Total Items Done", value: String(wraps.reduce((s, w) => s + w.completed.length, 0)), color: "var(--accent)" },
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue)} style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div className={cx("flexCol", "gap16")}>
        {wraps.map((w) => (
          <article key={w.name} className={styles.card}>
            <div className={styles.cardHd}><span className={styles.cardHdTitle}>{w.name} <span className={cx("text11", "colorMuted", "fw400")}>· {w.role} · {w.time}</span></span><span className={cx("fontMono", "text12")}>{w.hoursLogged}h</span></div>
            <div className={styles.cardInner}>
              <div className={cx("mb8")}><span className={cx("text10", "uppercase", "tracking", "colorMuted", "fw700")}>Completed</span><ul className={cx("mt4")} style={{ paddingLeft: "16px" }}>{w.completed.map((c) => <li key={c} className={cx("text12")}>{c}</li>)}</ul></div>
              <div><span className={cx("text10", "uppercase", "tracking", "colorAmber", "fw700")}>Carry Over</span><div className={cx("text12", "mt4")}>{w.carryOver}</div></div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

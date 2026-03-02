"use client";

import { cx, styles } from "../style";

const standups = [
  { name: "Thabo Mokoena", role: "Senior Designer", avatar: "TM", time: "09:12", yesterday: "Completed brand guidelines pages 12-18, conducted colour consistency review", today: "Finalize print-ready assets, start icon library audit", blockers: "None" },
  { name: "Lerato Dlamini", role: "UX Designer", avatar: "LD", time: "09:08", yesterday: "Finished wireframes for checkout flow, ran 3 user tests", today: "Iterate on test feedback, design empty states", blockers: "Awaiting client content for product pages" },
  { name: "James Okonkwo", role: "Frontend Dev", avatar: "JO", time: "09:15", yesterday: "Implemented responsive navigation, fixed Safari rendering bug", today: "Build component library storybook, start form validation", blockers: "None" },
  { name: "Kira Bosman", role: "Designer", avatar: "KB", time: "09:05", yesterday: "Created campaign social templates, designed email header", today: "Finish remaining 4 campaign assets, send for PM review", blockers: "Waiting for final copy from copywriter" },
];

export function StandupFeedPage() {
  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / GOVERNANCE</div>
          <h1 className={styles.pageTitle}>Standup Feed</h1>
          <div className={styles.pageSub}>Aggregated daily stand-ups from all staff — {new Date().toLocaleDateString("en-ZA", { weekday: "long", month: "long", day: "numeric" })}</div>
        </div>
      </div>
      <div className={cx("flexCol", "gap16")}>
        {standups.map((s) => (
          <article key={s.name} className={styles.card}>
            <div className={styles.cardHd}>
              <span className={styles.cardHdTitle}>{s.name} <span className={cx("text11", "colorMuted", "fw400")}>· {s.role} · {s.time}</span></span>
            </div>
            <div className={styles.cardInner}>
              <div className={cx("mb8")}><span className={cx("text10", "uppercase", "tracking", "colorMuted", "fw700")}>Yesterday</span><div className={cx("text12", "mt4")}>{s.yesterday}</div></div>
              <div className={cx("mb8")}><span className={cx("text10", "uppercase", "tracking", "colorMuted", "fw700")}>Today</span><div className={cx("text12", "mt4")}>{s.today}</div></div>
              <div><span className={cx("text10", "uppercase", "tracking", s.blockers === "None" ? "colorGreen" : "colorRed", "fw700")}>Blockers</span><div className={cx("text12", "mt4")}>{s.blockers}</div></div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

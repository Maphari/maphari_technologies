"use client";

import { cx, styles } from "../style";

const alerts = [
  { client: "Kestrel Capital", score: 45, trend: "↓ -12", category: "Response Time", detail: "Average response time increased to 18h (SLA: 4h)", severity: "Critical" as const, since: "Feb 18, 2026" },
  { client: "Dune Collective", score: 35, trend: "↓ -8", category: "Engagement", detail: "No client touchpoints in 14 days", severity: "Critical" as const, since: "Feb 8, 2026" },
  { client: "Mira Health", score: 78, trend: "↓ -5", category: "Sentiment", detail: "Recent feedback flagged timeline concerns", severity: "Warning" as const, since: "Feb 20, 2026" },
];

const healthy = [
  { client: "Volta Studios", score: 92, trend: "↑ +3" },
  { client: "Okafor & Sons", score: 85, trend: "→ 0" },
];

export function ActiveHealthMonitorPage() {
  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageEyebrow}>ADMIN / GOVERNANCE</div>
          <h1 className={styles.pageTitle}>Active Health Monitor</h1>
          <div className={styles.pageSub}>Real-time health alerts — proactive vs. static scorecard</div>
        </div>
      </div>
      <div className={cx("topCardsStack", "mb16")}>
        {[
          { label: "Critical Alerts", value: String(alerts.filter((a) => a.severity === "Critical").length), color: "var(--red)" },
          { label: "Warnings", value: String(alerts.filter((a) => a.severity === "Warning").length), color: "var(--amber)" },
          { label: "Healthy Clients", value: String(healthy.length), color: "var(--accent)" },
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={cx(styles.statValue)} style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div className={cx("flexCol", "gap16", "mb24")}>
        {alerts.map((a) => (
          <article key={a.client} className={styles.card} style={{ borderLeft: a.severity === "Critical" ? "3px solid var(--red)" : "3px solid var(--amber)" }}>
            <div className={styles.cardHd}>
              <span className={styles.cardHdTitle}>{a.client} <span className={cx("fontMono", "text12", "colorRed")}>{a.score}% {a.trend}</span></span>
              <span className={cx("badge", a.severity === "Critical" ? "badgeRed" : "badgeAmber")}>{a.severity}</span>
            </div>
            <div className={styles.cardInner}>
              <div className={cx("text12", "mb4")}><strong>{a.category}:</strong> {a.detail}</div>
              <div className={cx("text11", "colorMuted")}>Alert since: {a.since}</div>
            </div>
          </article>
        ))}
      </div>
      <article className={styles.card}>
        <div className={styles.cardHd}><span className={styles.cardHdTitle}>Healthy Clients</span></div>
        <div className={styles.cardInner}>
          {healthy.map((h) => (
            <div key={h.client} className={cx("flexBetween", "py8", "borderB")}>
              <span className={cx("fw600")}>{h.client}</span>
              <span className={cx("fontMono", "fw600", "colorGreen")}>{h.score}% {h.trend}</span>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}

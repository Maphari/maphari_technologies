"use client";

import { cx } from "../style";

const health = {
  overall: 85,
  factors: [
    { name: "Communication", score: 92, trend: "↑", detail: "Average response time: 2.1 hours" },
    { name: "Delivery", score: 88, trend: "→", detail: "8 of 9 milestones on time" },
    { name: "Satisfaction", score: 78, trend: "↑", detail: "Last NPS: 8/10" },
    { name: "Engagement", score: 82, trend: "↑", detail: "12 portal sessions this month" },
  ],
  lastUpdated: "Feb 22, 2026",
  accountManager: "Naledi Mthembu",
};

export function HealthScorePage() {
  return (
    <div className={cx("pageBody")}>
      <div className={cx("pageHeader")}>
        <div>
          <div className={cx("pageEyebrow")}>Veldt Finance · Account</div>
          <h1 className={cx("pageTitle")}>Relationship Health</h1>
          <p className={cx("pageSub")}>See how your partnership with Maphari is performing across key dimensions.</p>
        </div>
      </div>
      <div className={cx("card", "p24", "mb16")} style={{ textAlign: "center" }}>
        <div className={cx("text10", "uppercase", "tracking", "colorMuted", "fw700", "mb8")}>Overall Relationship Score</div>
        <div className={cx("fontDisplay", "fw800")} style={{ fontSize: "48px", color: health.overall >= 80 ? "var(--accent)" : health.overall >= 60 ? "var(--amber)" : "var(--red)" }}>{health.overall}%</div>
        <div className={cx("text12", "colorMuted", "mt8")}>Updated: {health.lastUpdated} · Account Manager: {health.accountManager}</div>
      </div>
      <div className={cx("topCardsStack", "mb16")}>
        {health.factors.map((f) => (
          <div key={f.name} className={cx("card", "p16")}>
            <div className={cx("flexBetween", "mb6")}>
              <span className={cx("text10", "uppercase", "tracking", "colorMuted", "fw700")}>{f.name}</span>
              <span className={cx("fontMono", "text12")}>{f.trend}</span>
            </div>
            <div className={cx("fontDisplay", "fw800", "text20", "mb4")} style={{ color: f.score >= 80 ? "var(--accent)" : f.score >= 60 ? "var(--amber)" : "var(--red)" }}>{f.score}%</div>
            <div className={cx("text11", "colorMuted")}>{f.detail}</div>
          </div>
        ))}
      </div>
      <div className={cx("card", "p16")}>
        <div className={cx("fw700", "mb8")}>What does this mean?</div>
        <div className={cx("text12", "colorMuted")}>Your relationship health is calculated from communication responsiveness, on-time delivery, satisfaction scores, and your engagement with the portal. A higher score means a stronger, more productive partnership.</div>
      </div>
    </div>
  );
}
